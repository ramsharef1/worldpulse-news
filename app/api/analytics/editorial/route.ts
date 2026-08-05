import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminAuth, forbidden } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/editorial
 * Get editorial team performance metrics including approval times and productivity
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const period = searchParams.get('period') || 'month';
    const language = searchParams.get('lang') || 'en';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    let userFilter = '';
    const params: any[] = [startDate, endDate];

    if (userId) {
      userFilter = ' AND u.id = $3';
      params.push(userId);
    }

    // Get editor productivity metrics
    const result = await query(
      `
      SELECT
        u.id,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        COUNT(DISTINCT a.id) as total_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'draft' THEN a.id END) as draft_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'in_review' THEN a.id END) as pending_articles,
        COALESCE(AVG(ep.avg_approval_time), 0)::numeric(8,2) as avg_approval_hours,
        COALESCE(AVG(ep.quality_score), 0)::int as quality_score,
        COALESCE(AVG(ep.productivity_score), 0)::int as productivity_score,
        COALESCE(SUM(ep.articles_published), 0) as monthly_published,
        MAX(a.updated_at) as last_activity
      FROM users u
      LEFT JOIN articles a ON u.id = a.author_id
      LEFT JOIN editorial_performance ep ON u.id = ep.user_id
        AND ep.date >= $1 AND ep.date <= $2
      WHERE (u.role_id IN (SELECT id FROM roles WHERE name IN ('editor', 'admin', 'university_admin')))
        ${userFilter}
        AND a.created_at >= $1
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY monthly_published DESC
    `,
      params
    );

    // Get approval workflow metrics
    const approvalResult = await query(
      `
      SELECT
        wa.approver_id,
        COUNT(*) as total_approvals,
        COUNT(CASE WHEN wa.status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN wa.status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN wa.status = 'pending' THEN 1 END) as pending,
        EXTRACT(EPOCH FROM AVG(
          CASE
            WHEN wa.updated_at IS NOT NULL
            THEN wa.updated_at - wa.created_at
            ELSE NOW() - wa.created_at
          END
        )) / 3600 as avg_approval_hours
      FROM workflow_approvals wa
      WHERE wa.created_at >= $1 AND wa.created_at <= $2
      GROUP BY wa.approver_id
    `,
      params
    );

    const approvalByUser = new Map();
    approvalResult.rows.forEach((row: any) => {
      approvalByUser.set(row.approver_id, {
        total: row.total_approvals,
        approved: row.approved,
        rejected: row.rejected,
        pending: row.pending,
        avgHours: parseFloat(row.avg_approval_hours || 0),
      });
    });

    // Get top performers
    const topPerformers = result.rows
      .filter((r: any) => r.monthly_published > 0)
      .sort((a: any, b: any) => b.productivity_score - a.productivity_score)
      .slice(0, 5);

    return NextResponse.json(
      {
        success: true,
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        editors: result.rows.map((row: any) => {
          const approval = approvalByUser.get(row.id);

          return {
            id: row.id,
            name: row.full_name,
            email: row.email,
            output: {
              total: row.total_articles,
              published: row.published_articles,
              draft: row.draft_articles,
              pending: row.pending_articles,
              monthlyPublished: row.monthly_published || 0,
            },
            quality: {
              qualityScore: row.quality_score,
              productivityScore: row.productivity_score,
              avgApprovalHours: row.avg_approval_hours,
            },
            approvals: approval || {
              total: 0,
              approved: 0,
              rejected: 0,
              pending: 0,
              avgHours: 0,
            },
            lastActivity: row.last_activity,
          };
        }),
        summary: {
          totalEditors: result.rows.length,
          totalArticles: result.rows.reduce(
            (sum: number, r: any) => sum + r.total_articles,
            0
          ),
          totalPublished: result.rows.reduce(
            (sum: number, r: any) => sum + r.published_articles,
            0
          ),
          avgApprovalHours:
            result.rows.length > 0
              ? (
                  result.rows.reduce(
                    (sum: number, r: any) => sum + r.avg_approval_hours,
                    0
                  ) / result.rows.length
                ).toFixed(2)
              : 0,
          topPerformers: topPerformers.map((p: any) => ({
            name: p.full_name,
            published: p.published_articles,
            score: p.productivity_score,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Editorial metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editorial metrics' },
      { status: 500 }
    );
  }
}
