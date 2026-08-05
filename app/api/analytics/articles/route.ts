import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminAuth, forbidden } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/articles
 * Get detailed article performance metrics with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('article_id');
    const universityId = searchParams.get('university_id');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';
    const sortBy = searchParams.get('sort_by') || 'views';
    const sortOrder = searchParams.get('sort_order') || 'DESC';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const language = searchParams.get('lang') || 'en';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build dynamic query
    let whereClause = `WHERE a.status = '${status}'`;
    const params: any[] = [];

    if (articleId) {
      whereClause += ` AND a.id = $${params.length + 1}`;
      params.push(articleId);
    }

    if (universityId) {
      whereClause += ` AND a.university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    if (category) {
      whereClause += ` AND a.category = $${params.length + 1}`;
      params.push(category);
    }

    if (startDate) {
      whereClause += ` AND apm.date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND apm.date <= $${params.length + 1}`;
      params.push(endDate);
    }

    const titleField = language === 'ar' ? 'title_ar' : 'title_en';

    const result = await query(
      `
      SELECT
        a.id,
        a.${titleField} as title,
        u.${language === 'ar' ? 'name_ar' : 'name_en'} as university,
        a.category,
        a.status,
        a.published_at,
        a.author_id,
        COALESCE(SUM(apm.views), 0) as total_views,
        COALESCE(SUM(apm.unique_views), 0) as unique_views,
        COALESCE(AVG(apm.avg_time_on_page), 0)::int as avg_time_on_page,
        COALESCE(AVG(apm.scroll_depth), 0)::numeric(5,2) as avg_scroll_depth,
        COALESCE(AVG(apm.bounce_rate), 0)::numeric(5,2) as bounce_rate,
        COALESCE(SUM(apm.clicks), 0) as total_clicks,
        COALESCE(SUM(apm.shares), 0) as total_shares,
        COALESCE(SUM(apm.comments_count), 0) as comments,
        COALESCE(SUM(apm.reactions_count), 0) as reactions,
        COALESCE(AVG(apm.engagement_score), 0)::int as engagement_score,
        COUNT(DISTINCT apm.date) as tracking_days,
        MAX(apm.date) as last_updated
      FROM articles a
      LEFT JOIN universities u ON a.university_id = u.id
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
      ${whereClause}
      GROUP BY a.id, a.${titleField}, u.${language === 'ar' ? 'name_ar' : 'name_en'}, a.category, a.status, a.published_at, a.author_id
      ORDER BY ${getSafeOrderBy(sortBy)} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
      ${whereClause}
    `,
      params
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          university: row.university,
          category: row.category,
          status: row.status,
          published: row.published_at,
          metrics: {
            views: row.total_views,
            uniqueViews: row.unique_views,
            avgTimeOnPage: row.avg_time_on_page,
            scrollDepth: row.avg_scroll_depth,
            bounceRate: row.bounce_rate,
            clicks: row.total_clicks,
            shares: row.total_shares,
            comments: row.comments,
            reactions: row.reactions,
            engagementScore: row.engagement_score,
          },
          trackingDays: row.tracking_days,
          lastUpdated: row.last_updated,
        })),
        pagination: {
          limit,
          offset,
          total: countResult.rows[0]?.total || 0,
          hasMore: offset + limit < (countResult.rows[0]?.total || 0),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Article analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article metrics' },
      { status: 500 }
    );
  }
}

/**
 * Safely get order by clause
 */
function getSafeOrderBy(sortBy: string): string {
  const allowedFields = [
    'total_views',
    'unique_views',
    'engagement_score',
    'bounce_rate',
    'total_clicks',
    'total_shares',
    'comments',
    'published_at',
    'title',
  ];

  if (allowedFields.includes(sortBy)) {
    return sortBy;
  }

  return 'total_views';
}
