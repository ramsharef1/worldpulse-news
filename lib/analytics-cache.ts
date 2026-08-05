import { query } from './db';

/**
 * Analytics Cache Management
 * Provides Redis-like caching for analytics queries using PostgreSQL
 */

const CACHE_DURATION_HOURS = 2; // Default cache duration

// ============================================
// CACHE KEY GENERATION
// ============================================

export function generateCacheKey(
  type: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|');

  return `${type}:${sortedParams}`;
}

// ============================================
// CACHE OPERATIONS
// ============================================

export interface CacheEntry {
  key: string;
  type: string;
  data: any;
  calculatedAt: Date;
  expiresAt: Date;
}

/**
 * Get cached data
 */
export async function getCacheEntry(cacheKey: string): Promise<any | null> {
  try {
    const result = await query(
      `
      SELECT data, expires_at
      FROM analytics_cache
      WHERE cache_key = $1 AND expires_at > NOW()
    `,
      [cacheKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return JSON.parse(result.rows[0].data);
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCacheEntry(
  cacheKey: string,
  cacheType: string,
  data: any,
  durationHours: number = CACHE_DURATION_HOURS
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    await query(
      `
      INSERT INTO analytics_cache (cache_key, cache_type, data, calculated_at, expires_at)
      VALUES ($1, $2, $3, NOW(), $4)
      ON CONFLICT (cache_key) DO UPDATE SET
        data = $3,
        calculated_at = NOW(),
        expires_at = $4
    `,
      [cacheKey, cacheType, JSON.stringify(data), expiresAt]
    );
  } catch (error) {
    console.error('Cache setting error:', error);
  }
}

/**
 * Delete cached entry
 */
export async function deleteCacheEntry(cacheKey: string): Promise<void> {
  try {
    await query('DELETE FROM analytics_cache WHERE cache_key = $1', [
      cacheKey,
    ]);
  } catch (error) {
    console.error('Cache deletion error:', error);
  }
}

/**
 * Clear all cache entries of a specific type
 */
export async function clearCacheByType(cacheType: string): Promise<void> {
  try {
    await query('DELETE FROM analytics_cache WHERE cache_type = $1', [
      cacheType,
    ]);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Clear all expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const result = await query('DELETE FROM analytics_cache WHERE expires_at <= NOW()');
    return result.rowCount || 0;
  } catch (error) {
    console.error('Cache expiration clear error:', error);
    return 0;
  }
}

// ============================================
// QUERY WITH CACHING
// ============================================

export interface CacheOptions {
  cacheType?: string;
  durationHours?: number;
  forceRefresh?: boolean;
}

/**
 * Execute query with automatic caching
 */
export async function queryWithCache(
  queryStr: string,
  params: any[],
  cacheKey: string,
  options: CacheOptions = {}
): Promise<any> {
  const {
    cacheType = 'general',
    durationHours = CACHE_DURATION_HOURS,
    forceRefresh = false,
  } = options;

  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = await getCacheEntry(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // Execute query
  const result = await query(queryStr, params);
  const data = result.rows;

  // Cache the results
  await setCacheEntry(cacheKey, cacheType, data, durationHours);

  return data;
}

// ============================================
// DASHBOARD CACHE MANAGEMENT
// ============================================

/**
 * Cache dashboard metrics snapshot
 */
export async function cacheDashboardMetrics(
  dashboardId: string,
  universityId: string | null,
  metrics: any
): Promise<void> {
  try {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    await query(
      `
      INSERT INTO dashboard_metrics_snapshot (dashboard_id, university_id, metrics, period_date, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (dashboard_id, period_date) DO UPDATE SET
        metrics = $3,
        created_at = NOW()
    `,
      [dashboardId, universityId, JSON.stringify(metrics), date]
    );
  } catch (error) {
    console.error('Dashboard snapshot cache error:', error);
  }
}

/**
 * Get cached dashboard metrics
 */
export async function getDashboardMetrics(
  dashboardId: string,
  universityId?: string | null
): Promise<any | null> {
  try {
    let query_str = `
      SELECT metrics, period_date
      FROM dashboard_metrics_snapshot
      WHERE dashboard_id = $1
    `;

    const params: any[] = [dashboardId];

    if (universityId) {
      query_str += ` AND university_id = $2`;
      params.push(universityId);
    }

    query_str += ` ORDER BY period_date DESC LIMIT 1`;

    const result = await query(query_str, params);

    if (result.rows.length === 0) {
      return null;
    }

    return JSON.parse(result.rows[0].metrics);
  } catch (error) {
    console.error('Dashboard metrics retrieval error:', error);
    return null;
  }
}

// ============================================
// MATERIALIZED VIEW REFRESH
// ============================================

/**
 * Refresh materialized views
 */
export async function refreshMaterializedViews(): Promise<{
  success: boolean;
  views_refreshed: string[];
  errors?: string[];
}> {
  const views = [
    'mv_top_articles_by_engagement',
    'mv_university_content_distribution',
    'mv_editor_productivity',
  ];

  const refreshed: string[] = [];
  const errors: string[] = [];

  for (const view of views) {
    try {
      await query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`);
      refreshed.push(view);
    } catch (error) {
      errors.push(`${view}: ${(error as Error).message}`);
    }
  }

  return {
    success: errors.length === 0,
    views_refreshed: refreshed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ============================================
// CACHE STATISTICS
// ============================================

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  byType: Record<string, number>;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        SUM(LENGTH(data::text)) as total_size,
        MIN(calculated_at) as oldest,
        MAX(calculated_at) as newest
      FROM analytics_cache
    `);

    const stats = result.rows[0];

    const typeResult = await query(`
      SELECT cache_type, COUNT(*) as count
      FROM analytics_cache
      GROUP BY cache_type
    `);

    const byType: Record<string, number> = {};
    typeResult.rows.forEach((row: any) => {
      byType[row.cache_type] = row.count;
    });

    return {
      totalEntries: stats.total || 0,
      byType,
      totalSize: stats.total_size || 0,
      oldestEntry: stats.oldest,
      newestEntry: stats.newest,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      totalEntries: 0,
      byType: {},
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

// ============================================
// CACHE WARMING
// ============================================

/**
 * Pre-populate common analytics caches
 */
export async function warmAnalyticsCache(): Promise<void> {
  try {
    console.log('Starting analytics cache warm-up...');

    // Cache top articles
    const topArticlesKey = generateCacheKey('top_articles', { period: 'month' });
    const topArticles = await query(`
      SELECT
        a.id,
        a.title_en,
        SUM(apm.views) as views,
        AVG(apm.engagement_score) as engagement
      FROM articles a
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE a.status = 'published'
      GROUP BY a.id
      ORDER BY views DESC
      LIMIT 20
    `);

    await setCacheEntry(
      topArticlesKey,
      'top_articles',
      topArticles.rows,
      CACHE_DURATION_HOURS
    );

    // Cache university stats
    const uniStatsKey = generateCacheKey('university_stats', { period: 'month' });
    const uniStats = await query(`
      SELECT
        u.id,
        u.name_en,
        COUNT(DISTINCT a.id) as articles,
        SUM(apm.views) as views
      FROM universities u
      LEFT JOIN articles a ON u.id = a.university_id
      LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
        AND apm.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id
    `);

    await setCacheEntry(
      uniStatsKey,
      'university_stats',
      uniStats.rows,
      CACHE_DURATION_HOURS
    );

    // Cache trending articles
    const trendingKey = generateCacheKey('trending_articles', { period: '24h' });
    const trending = await query(`
      SELECT
        article_id,
        rank,
        score,
        views_24h,
        momentum
      FROM trending_articles
      WHERE calculated_at >= NOW() - INTERVAL '1 hour'
      ORDER BY rank ASC
      LIMIT 10
    `);

    await setCacheEntry(
      trendingKey,
      'trending_articles',
      trending.rows,
      1 // Cache for 1 hour only
    );

    console.log('Analytics cache warm-up completed');
  } catch (error) {
    console.error('Cache warm-up error:', error);
  }
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Invalidate cache when article is updated
 */
export async function invalidateArticleCache(articleId: string): Promise<void> {
  try {
    const prefixes = [
      'article_performance',
      'top_articles',
      'trending_articles',
      `article:${articleId}`,
    ];

    for (const prefix of prefixes) {
      await query(
        'DELETE FROM analytics_cache WHERE cache_key LIKE $1',
        [`${prefix}%`]
      );
    }
  } catch (error) {
    console.error('Article cache invalidation error:', error);
  }
}

/**
 * Invalidate cache when university content changes
 */
export async function invalidateUniversityCache(
  universityId: string
): Promise<void> {
  try {
    const prefixes = [
      'university_stats',
      `university:${universityId}`,
      'top_articles',
    ];

    for (const prefix of prefixes) {
      await query(
        'DELETE FROM analytics_cache WHERE cache_key LIKE $1',
        [`${prefix}%`]
      );
    }
  } catch (error) {
    console.error('University cache invalidation error:', error);
  }
}

/**
 * Bulk invalidate all analytics cache
 */
export async function invalidateAllCache(): Promise<void> {
  try {
    await query('DELETE FROM analytics_cache');
    console.log('All analytics cache invalidated');
  } catch (error) {
    console.error('Bulk cache invalidation error:', error);
  }
}
