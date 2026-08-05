import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminAuth, forbidden } from '@/lib/auth-middleware';
import { predictTrendingArticles } from '@/lib/analytics-predictions';

/**
 * GET /api/analytics/trending
 * Get trending articles with real-time trending scores
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const period = searchParams.get('period') || '24h'; // 24h, 7d, 30d
    const language = searchParams.get('lang') || 'en';
    const universityId = searchParams.get('university_id');

    // Get trending predictions
    const predictions = await predictTrendingArticles(limit);

    // Get full article details
    const titleField = language === 'ar' ? 'title_ar' : 'title_en';
    const articleIds = predictions.map((p) => p.articleId);

    let universityFilter = '';
    const params: any[] = articleIds;

    if (universityId) {
      universityFilter = ` AND a.university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    const result = await query(
      `
      SELECT
        a.id,
        a.${titleField} as title,
        a.${language === 'ar' ? 'excerpt_ar' : 'excerpt_en'} as excerpt,
        u.${language === 'ar' ? 'name_ar' : 'name_en'} as university,
        a.published_at,
        a.category,
        ta.rank,
        ta.score,
        ta.rank_change,
        ta.views_24h,
        ta.engagement_24h,
        ta.momentum
      FROM articles a
      LEFT JOIN universities u ON a.university_id = u.id
      LEFT JOIN trending_articles ta ON a.id = ta.article_id
      WHERE a.id = ANY($1) ${universityFilter}
      ORDER BY ta.rank ASC
    `,
      params
    );

    // Calculate trend direction
    const trendingData = result.rows.map((row: any) => {
      let trend = 'stable';
      if (row.rank_change > 2) trend = 'up';
      if (row.rank_change < -2) trend = 'down';

      return {
        id: row.id,
        title: row.title,
        excerpt: row.excerpt,
        university: row.university,
        category: row.category,
        published: row.published_at,
        trending: {
          rank: row.rank || 0,
          score: row.score || 0,
          rankChange: row.rank_change || 0,
          trend,
          momentum: row.momentum || 0,
          views24h: row.views_24h || 0,
          engagement24h: row.engagement_24h || 0,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        period,
        count: trendingData.length,
        trending: trendingData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Trending analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    );
  }
}
