import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authMiddleware, requireAdminAuth, forbidden } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/user-behavior
 * Get user behavior analytics including engagement patterns and churn risk
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const sessionId = searchParams.get('session_id');
    const churnRiskFilter = searchParams.get('churn_risk'); // low, medium, high
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (userId) {
      whereClause += ` AND u.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (sessionId) {
      whereClause += ` AND u.reader_session_id = $${params.length + 1}`;
      params.push(sessionId);
    }

    if (churnRiskFilter) {
      whereClause += ` AND u.churn_risk >= $${params.length + 1}`;
      if (churnRiskFilter === 'low') {
        params.push(0);
        whereClause = whereClause.replace('>= $', '< $');
        whereClause = whereClause.replace('$' + params.length, '40');
      } else if (churnRiskFilter === 'medium') {
        params.push(40);
        whereClause = whereClause.replace('>= $', 'BETWEEN $');
        whereClause = whereClause.replace('$' + params.length, `$${params.length} AND 70`);
      } else if (churnRiskFilter === 'high') {
        params.push(70);
      }
    }

    const result = await query(
      `
      SELECT
        u.id,
        u.user_id,
        u.reader_session_id,
        u.last_visit,
        u.visit_frequency,
        u.avg_session_duration,
        u.total_time_on_platform,
        u.articles_read,
        u.avg_articles_per_visit,
        u.preferred_categories,
        u.churn_risk,
        u.lifetime_value,
        u.last_engagement,
        u.created_at
      FROM user_behavior_analytics u
      ${whereClause}
      ORDER BY u.churn_risk DESC, u.last_visit DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
      [...params, limit, offset]
    );

    const countResult = await query(
      `
      SELECT COUNT(*) as total FROM user_behavior_analytics u ${whereClause}
    `,
      params
    );

    // Calculate summary statistics
    const summaryResult = await query(
      `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN churn_risk > 70 THEN 1 END) as high_risk_users,
        COUNT(CASE WHEN churn_risk BETWEEN 40 AND 70 THEN 1 END) as medium_risk_users,
        COUNT(CASE WHEN churn_risk < 40 THEN 1 END) as low_risk_users,
        AVG(churn_risk) as avg_churn_risk,
        AVG(visit_frequency) as avg_visit_frequency,
        AVG(total_time_on_platform) as avg_time_on_platform,
        AVG(lifetime_value) as avg_lifetime_value
      FROM user_behavior_analytics
    `
    );

    const summary = summaryResult.rows[0];

    return NextResponse.json(
      {
        success: true,
        users: result.rows.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          sessionId: row.reader_session_id,
          engagement: {
            lastVisit: row.last_visit,
            visitFrequency: row.visit_frequency,
            avgSessionDuration: row.avg_session_duration,
            totalTimeOnPlatform: row.total_time_on_platform,
            articlesRead: row.articles_read,
            avgArticlesPerVisit: row.avg_articles_per_visit,
          },
          preferences: {
            favoriteCategories: row.preferred_categories || [],
            lastEngagement: row.last_engagement,
          },
          retention: {
            churnRisk: row.churn_risk,
            lifetimeValue: row.lifetime_value,
          },
          createdAt: row.created_at,
        })),
        summary: {
          totalUsers: summary.total_users,
          riskDistribution: {
            high: summary.high_risk_users,
            medium: summary.medium_risk_users,
            low: summary.low_risk_users,
          },
          averages: {
            churnRisk: Math.round(summary.avg_churn_risk),
            visitFrequency: Math.round(summary.avg_visit_frequency),
            timeOnPlatform: Math.round(summary.avg_time_on_platform),
            lifetimeValue: Math.round(summary.avg_lifetime_value * 100) / 100,
          },
        },
        pagination: {
          limit,
          offset,
          total: countResult.rows[0]?.total || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User behavior analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user behavior analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/user-behavior
 * Track or update user behavior data
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const {
      sessionId,
      visitFrequency,
      avgSessionDuration,
      articlesRead,
      preferredCategories,
    } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Insert or update user behavior record
    await query(
      `
      INSERT INTO user_behavior_analytics
        (user_id, reader_session_id, visit_frequency, avg_session_duration, articles_read, preferred_categories, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (reader_session_id) DO UPDATE SET
        visit_frequency = COALESCE($3, user_behavior_analytics.visit_frequency),
        avg_session_duration = COALESCE($4, user_behavior_analytics.avg_session_duration),
        articles_read = COALESCE($5, user_behavior_analytics.articles_read),
        preferred_categories = COALESCE($6, user_behavior_analytics.preferred_categories),
        updated_at = NOW()
    `,
      [
        auth.user.userId,
        sessionId,
        visitFrequency || null,
        avgSessionDuration || null,
        articlesRead || null,
        preferredCategories ? JSON.stringify(preferredCategories) : null,
      ]
    );

    return NextResponse.json(
      { success: true, message: 'User behavior tracked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('User behavior tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track user behavior' },
      { status: 500 }
    );
  }
}
