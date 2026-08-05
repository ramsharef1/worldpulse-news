import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminAuth, forbidden } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/universities
 * Get university-level statistics including content distribution and reach
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('university_id');
    const language = searchParams.get('lang') || 'en';
    const period = searchParams.get('period') || 'month';

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

    let universityFilter = '';
    const params: any[] = [startDate, endDate];

    if (universityId) {
      universityFilter = ' AND u.id = $3';
      params.push(universityId);
    }

    const nameField = language === 'ar' ? 'name_ar' : 'name_en';

    const result = await query(
      `
      SELECT
        u.id,
        u.${nameField} as name,
        u.country,
        COUNT(DISTINCT a.id) as total_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'draft' THEN a.id END) as draft_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'in_review' THEN a.id END) as in_review_articles,
        COALESCE(SUM(apm.views), 0) as total_views,
        COALESCE(COUNT(DISTINCT apm.id), 0) as tracking_records,
        COALESCE(AVG(apm.engagement_score), 0)::int as avg_engagement_score,
        COALESCE(SUM(apm.clicks), 0) as total_clicks,
        COALESCE(SUM(apm.shares), 0) as total_shares,
        COUNT(DISTINCT a.author_id) as contributors,
        (
          SELECT COUNT(DISTINCT reader_session_id)
          FROM reader_sessions
          WHERE last_visit >= $1 AND last_visit <= $2
        ) as unique_visitors,
        MAX(apm.date) as last_update
      FROM universities u
      LEFT JOIN articles a ON u.id = a.university_id
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= $1 AND apm.date <= $2
      WHERE a.created_at >= $1 ${universityFilter}
      GROUP BY u.id, u.${nameField}, u.country
      ORDER BY total_views DESC
    `,
      params
    );

    // Get category distribution for each university
    const categoryResult = await query(
      `
      SELECT
        a.university_id,
        a.category,
        COUNT(*) as count,
        COALESCE(SUM(apm.views), 0) as views,
        COALESCE(AVG(apm.engagement_score), 0)::int as avg_engagement
      FROM articles a
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= $1 AND apm.date <= $2
      WHERE a.created_at >= $1 ${universityFilter}
      GROUP BY a.university_id, a.category
      ORDER BY views DESC
    `,
      params
    );

    // Group categories by university
    const categoriesByUniversity: Record<string, any[]> = {};
    categoryResult.rows.forEach((row: any) => {
      if (!categoriesByUniversity[row.university_id]) {
        categoriesByUniversity[row.university_id] = [];
      }
      categoriesByUniversity[row.university_id].push({
        category: row.category || 'Uncategorized',
        articles: row.count,
        views: row.views,
        engagement: row.avg_engagement,
      });
    });

    return NextResponse.json(
      {
        success: true,
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        universities: result.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          country: row.country,
          content: {
            total: row.total_articles,
            published: row.published_articles,
            draft: row.draft_articles,
            inReview: row.in_review_articles,
          },
          reach: {
            totalViews: row.total_views,
            uniqueVisitors: row.unique_visitors || 0,
            totalClicks: row.total_clicks,
            totalShares: row.total_shares,
          },
          engagement: {
            avgScore: row.avg_engagement_score,
            contributors: row.contributors,
          },
          categories: categoriesByUniversity[row.id] || [],
          lastUpdate: row.last_update,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('University statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch university statistics' },
      { status: 500 }
    );
  }
}
