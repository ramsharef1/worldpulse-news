import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authMiddleware, requireAdminAuth, forbidden } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/dashboard
 * Get comprehensive analytics dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('university_id');
    const period = searchParams.get('period') || 'month'; // day, week, month, quarter
    const language = searchParams.get('lang') || 'en';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
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

    if (universityId && auth.user.role !== 'super_admin') {
      universityFilter = ' AND a.university_id = $3';
      params.push(universityId);
    } else if (universityId) {
      universityFilter = ' AND a.university_id = $3';
      params.push(universityId);
    }

    // Get aggregate statistics
    const statsResult = await query(
      `
      SELECT
        COUNT(DISTINCT a.id) as total_articles,
        COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published_articles,
        SUM(COALESCE(apm.views, 0)) as total_views,
        COUNT(DISTINCT apm.id) as metric_records,
        AVG(apm.engagement_score) as avg_engagement,
        COUNT(DISTINCT a.author_id) as contributors,
        SUM(COALESCE(apm.clicks, 0)) as total_clicks,
        SUM(COALESCE(apm.shares, 0)) as total_shares,
        SUM(COALESCE(apm.comments_count, 0)) as total_comments
      FROM articles a
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= $1 AND apm.date <= $2
      WHERE a.created_at >= $1 ${universityFilter}
    `,
      params
    );

    const stats = statsResult.rows[0];

    // Get top articles
    const topArticlesResult = await query(
      `
      SELECT
        a.id,
        a.${language === 'ar' ? 'title_ar' : 'title_en'} as title,
        SUM(COALESCE(apm.views, 0)) as views,
        AVG(apm.engagement_score) as engagement_score,
        SUM(COALESCE(apm.clicks, 0)) as clicks,
        a.published_at
      FROM articles a
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= $1 AND apm.date <= $2
      WHERE a.status = 'published' AND a.created_at >= $1 ${universityFilter}
      GROUP BY a.id, a.title_${language}
      ORDER BY views DESC
      LIMIT 10
    `,
      params
    );

    // Get university breakdown
    const universityResult = await query(
      `
      SELECT
        u.id,
        u.${language === 'ar' ? 'name_ar' : 'name_en'} as name,
        COUNT(DISTINCT a.id) as article_count,
        SUM(COALESCE(apm.views, 0)) as total_views,
        AVG(apm.engagement_score) as avg_engagement
      FROM universities u
      LEFT JOIN articles a ON u.id = a.university_id
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= $1 AND apm.date <= $2
      WHERE a.created_at >= $1 ${universityId ? 'AND u.id = $3' : ''}
      GROUP BY u.id, u.${language === 'ar' ? 'name_ar' : 'name_en'}
      ORDER BY total_views DESC
    `,
      universityId ? [startDate, endDate, universityId] : [startDate, endDate]
    );

    // Get trending articles
    const trendingResult = await query(
      `
      SELECT
        article_id,
        rank,
        score,
        rank_change,
        views_24h,
        engagement_24h,
        momentum
      FROM trending_articles
      WHERE calculated_at >= NOW() - INTERVAL '1 hour'
      ORDER BY rank ASC
      LIMIT 5
    `
    );

    return NextResponse.json(
      {
        success: true,
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        summary: {
          totalArticles: stats.total_articles || 0,
          publishedArticles: stats.published_articles || 0,
          totalViews: stats.total_views || 0,
          avgEngagement: Math.round(stats.avg_engagement || 0),
          contributors: stats.contributors || 0,
          totalClicks: stats.total_clicks || 0,
          totalShares: stats.total_shares || 0,
          totalComments: stats.total_comments || 0,
        },
        topArticles: topArticlesResult.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          views: row.views || 0,
          engagement: Math.round(row.engagement_score || 0),
          clicks: row.clicks || 0,
          published: row.published_at,
        })),
        universities: universityResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          articles: row.article_count || 0,
          views: row.total_views || 0,
          engagement: Math.round(row.avg_engagement || 0),
        })),
        trending: trendingResult.rows.map((row: any) => ({
          articleId: row.article_id,
          rank: row.rank,
          score: row.score,
          rankChange: row.rank_change,
          views24h: row.views_24h,
          momentum: row.momentum,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
