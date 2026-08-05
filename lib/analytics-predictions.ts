import { query } from './db';
import {
  calculateTrendingScore,
  calculateChurnProbability,
  getChurnRiskLevel,
  calculateGrowthRate,
  calculateTrendDirection,
  calculateMomentum,
  TrendData,
} from './analytics-calculations';

/**
 * Analytics Predictions Library
 * Provides ML-based predictions for trending, churn, and optimal publish times
 */

// ============================================
// TRENDING PREDICTION
// ============================================

export interface TrendingPrediction {
  articleId: string;
  trendingScore: number;
  rank: number;
  rankChange: number;
  momentum: number;
  trend: 'up' | 'down' | 'stable';
  confidenceScore: number;
  views24h: number;
  engagement24h: number;
}

/**
 * Calculate trending articles for the last 24 hours
 */
export async function predictTrendingArticles(
  limit: number = 10
): Promise<TrendingPrediction[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get recent article performance data
  const result = await query(
    `
    SELECT
      a.id,
      a.title_en,
      SUM(apm.views) as views_24h,
      SUM(apm.clicks) as clicks_24h,
      SUM(apm.comments_count) as comments_24h,
      SUM(apm.shares) as shares_24h,
      AVG(apm.engagement_score) as avg_engagement,
      COALESCE((
        SELECT SUM(views)
        FROM article_performance_metrics
        WHERE article_id = a.id AND date >= CURRENT_DATE - INTERVAL '7 days'
      ), 0) as views_7d
    FROM articles a
    LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
      AND apm.date >= CURRENT_DATE - INTERVAL '1 day'
    WHERE a.status = 'published'
    GROUP BY a.id, a.title_en
    HAVING SUM(apm.views) > 0
    ORDER BY views_24h DESC
    LIMIT $1
  `,
    [limit]
  );

  const predictions: TrendingPrediction[] = [];

  // Get previous day's top articles for rank comparison
  const prevDayResult = await query(
    `
    SELECT article_id, ROW_NUMBER() OVER (ORDER BY SUM(views) DESC) as prev_rank
    FROM article_performance_metrics
    WHERE date = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY article_id
  `
  );

  const previousRanks = new Map(prevDayResult.rows.map((r: any) => [r.article_id, r.prev_rank]));

  result.rows.forEach((row: any, index: number) => {
    const views24h = parseInt(row.views_24h) || 0;
    const views7d = parseInt(row.views_7d) || 0;

    const trendingScore = calculateTrendingScore({
      viewsLast24h: views24h,
      viewsLast7d: views7d,
      clicksLast24h: parseInt(row.clicks_24h) || 0,
      commentsLast24h: parseInt(row.comments_24h) || 0,
      sharesLast24h: parseInt(row.shares_24h) || 0,
      socialsignals: 0, // Would integrate with social media API
    });

    const previousRank = previousRanks.get(row.id) || index + 1;
    const rankChange = previousRank - (index + 1);

    // Calculate momentum over last 7 days
    const momentum = views7d > 0 ? (views24h / (views7d / 7)) * 100 - 100 : 0;

    // Confidence score based on data recency and consistency
    const confidenceScore = Math.min(
      100,
      50 + views24h / 100 + (views24h > 100 ? 20 : 0)
    );

    predictions.push({
      articleId: row.id,
      trendingScore,
      rank: index + 1,
      rankChange,
      momentum: Math.round(momentum),
      trend: calculateTrendDirection(momentum),
      confidenceScore: Math.round(confidenceScore),
      views24h,
      engagement24h: parseInt(row.clicks_24h) || 0,
    });
  });

  return predictions;
}

/**
 * Predict future performance of an article
 */
export async function predictArticlePerformance(
  articleId: string,
  daysAhead: number = 7
): Promise<{
  predictedViews: number;
  predictedEngagement: number;
  trendDirection: string;
  confidenceScore: number;
}> {
  // Get historical performance data
  const historicalData = await query(
    `
    SELECT
      date,
      views,
      engagement_score
    FROM article_performance_metrics
    WHERE article_id = $1
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date ASC
  `,
    [articleId]
  );

  if (historicalData.rows.length < 3) {
    // Insufficient data for prediction
    return {
      predictedViews: 0,
      predictedEngagement: 0,
      trendDirection: 'stable',
      confidenceScore: 20,
    };
  }

  const viewsTrend: TrendData[] = historicalData.rows.map((r: any) => ({
    period: r.date,
    value: r.views,
  }));

  // Simple linear regression for trend
  const viewsRegression = linearRegression(
    viewsTrend.map((d) => d.value)
  );
  const engagementRegression = linearRegression(
    historicalData.rows.map((r: any) => r.engagement_score)
  );

  // Calculate predicted values
  const predictedViews = Math.max(
    0,
    Math.round(
      viewsRegression.slope * daysAhead +
        viewsRegression.intercept
    )
  );

  const predictedEngagement = Math.max(
    0,
    Math.round(
      engagementRegression.slope * daysAhead +
        engagementRegression.intercept
    )
  );

  // Calculate confidence based on R-squared value
  const rSquared = calculateRSquared(
    viewsTrend.map((d) => d.value),
    viewsRegression
  );

  return {
    predictedViews,
    predictedEngagement,
    trendDirection: viewsRegression.slope > 0 ? 'up' : 'down',
    confidenceScore: Math.round(rSquared * 100),
  };
}

// ============================================
// CHURN PREDICTION
// ============================================

export interface ChurnPrediction {
  readerId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  daysSinceActivity: number;
  predictedChurnDate: Date;
  recommendedAction: string;
}

/**
 * Predict readers at risk of churning
 */
export async function predictChurn(
  threshold: number = 70
): Promise<ChurnPrediction[]> {
  const result = await query(
    `
    SELECT
      rs.id as reader_id,
      rs.user_id,
      EXTRACT(DAY FROM NOW() - rs.last_visit)::int as days_since_activity,
      rs.visit_count as total_visits,
      EXTRACT(DAY FROM NOW() - rs.first_visit)::int as account_age,
      rs.total_time_spent,
      rs.pages_viewed,
      COALESCE(ub.avg_articles_per_visit, 0) as avg_articles_per_visit,
      COALESCE(ub.churn_risk, 0) as current_churn_risk
    FROM reader_sessions rs
    LEFT JOIN user_behavior_analytics ub ON rs.user_id = ub.user_id
    WHERE rs.last_visit >= CURRENT_DATE - INTERVAL '60 days'
    ORDER BY days_since_activity DESC
    LIMIT 1000
  `
  );

  const predictions: ChurnPrediction[] = [];

  result.rows.forEach((row: any) => {
    const daysSinceActivity = row.days_since_activity || 30;
    const visitFrequency = row.total_visits / Math.max(row.account_age / 30, 1);
    const avgSessionDuration =
      row.pages_viewed > 0 ? row.total_time_spent / row.pages_viewed : 0;

    const churnProbability = calculateChurnProbability({
      daysSinceLastVisit: daysSinceActivity,
      visitFrequency,
      averageSessionDuration: avgSessionDuration,
      articlesRead: row.pages_viewed,
      engagementScore: 50, // Would be calculated from actual engagement
    });

    if (churnProbability >= threshold) {
      const predictedChurnDate = new Date();
      predictedChurnDate.setDate(
        predictedChurnDate.getDate() +
          Math.max(7, 30 - daysSinceActivity)
      );

      predictions.push({
        readerId: row.reader_id,
        churnProbability: Math.round(churnProbability),
        riskLevel: getChurnRiskLevel(churnProbability),
        daysSinceActivity,
        predictedChurnDate,
        recommendedAction: getChurnRecommendation(churnProbability),
      });
    }
  });

  return predictions.sort(
    (a, b) => b.churnProbability - a.churnProbability
  );
}

/**
 * Get recommended action for churn prevention
 */
function getChurnRecommendation(churnProbability: number): string {
  if (churnProbability > 80) {
    return 're_engagement_campaign';
  } else if (churnProbability > 60) {
    return 'personalized_recommendations';
  } else if (churnProbability > 40) {
    return 'send_newsletter';
  } else {
    return 'monitor';
  }
}

// ============================================
// OPTIMAL PUBLISH TIME PREDICTION
// ============================================

export interface OptimalPublishTime {
  dayOfWeek: string;
  hour: number;
  avgEngagement: number;
  historicalViews: number;
  recommendationScore: number;
}

/**
 * Predict optimal publish times based on historical data
 */
export async function predictOptimalPublishTimes(
  universityId: string,
  timezone: string = 'UTC'
): Promise<OptimalPublishTime[]> {
  const result = await query(
    `
    SELECT
      EXTRACT(DOW FROM apm.date)::int as day_of_week,
      EXTRACT(HOUR FROM a.published_at) as hour_of_day,
      AVG(apm.engagement_score) as avg_engagement,
      SUM(apm.views) as total_views,
      COUNT(*) as article_count
    FROM articles a
    LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
    WHERE a.university_id = $1
      AND a.status = 'published'
      AND a.published_at IS NOT NULL
      AND a.published_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY day_of_week, hour_of_day
    HAVING COUNT(*) >= 2
    ORDER BY avg_engagement DESC
  `,
    [universityId]
  );

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const recommendations: OptimalPublishTime[] = [];

  result.rows.forEach((row: any) => {
    const recommendationScore = Math.min(
      100,
      (row.avg_engagement / 100) * 100
    );

    recommendations.push({
      dayOfWeek: dayNames[row.day_of_week] || 'Unknown',
      hour: row.hour_of_day || 12,
      avgEngagement: Math.round(row.avg_engagement),
      historicalViews: row.total_views,
      recommendationScore: Math.round(recommendationScore),
    });
  });

  // Return top 10 recommendations
  return recommendations
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 10);
}

// ============================================
// CONTENT PERFORMANCE PREDICTION
// ============================================

export interface ContentPrediction {
  articleId: string;
  predictedViews: number;
  predictedEngagementScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  confidenceScore: number;
  recommendation: string;
}

/**
 * Predict performance before publishing (based on similar content)
 */
export async function predictContentPerformance(
  title: string,
  category: string,
  universityId: string
): Promise<ContentPrediction> {
  // Find similar published articles
  const similarArticles = await query(
    `
    SELECT
      a.id,
      apm.views,
      apm.engagement_score,
      apm.date
    FROM articles a
    LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
    WHERE a.category = $1
      AND a.university_id = $2
      AND a.status = 'published'
      AND a.published_at >= CURRENT_DATE - INTERVAL '90 days'
      AND apm.date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY apm.views DESC
    LIMIT 20
  `,
    [category, universityId]
  );

  if (similarArticles.rows.length === 0) {
    return {
      articleId: '',
      predictedViews: 500,
      predictedEngagementScore: 35,
      trendDirection: 'stable',
      confidenceScore: 30,
      recommendation: 'Insufficient data for prediction',
    };
  }

  // Calculate averages from similar content
  const views = similarArticles.rows.map((r: any) => r.views);
  const engagement = similarArticles.rows.map((r: any) => r.engagement_score);

  const avgViews = Math.round(
    views.reduce((a, b) => a + b, 0) / views.length
  );
  const avgEngagement = Math.round(
    engagement.reduce((a, b) => a + b, 0) / engagement.length
  );

  // Adjust based on content length and title
  const titleBoost = title.length > 60 ? 1.1 : title.length < 30 ? 0.9 : 1;
  const adjustedViews = Math.round(avgViews * titleBoost);

  return {
    articleId: '',
    predictedViews: adjustedViews,
    predictedEngagementScore: avgEngagement,
    trendDirection: 'stable',
    confidenceScore: Math.min(
      80,
      40 + similarArticles.rows.length * 2
    ),
    recommendation:
      adjustedViews > 1000
        ? 'promote_on_homepage'
        : 'standard_distribution',
  };
}

// ============================================
// HELPER FUNCTIONS FOR REGRESSION ANALYSIS
// ============================================

interface RegressionResult {
  slope: number;
  intercept: number;
}

/**
 * Simple linear regression calculation
 */
function linearRegression(values: number[]): RegressionResult {
  if (values.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i + 1);

  const sumX = xValues.reduce((a, b) => a + b);
  const sumY = values.reduce((a, b) => a + b);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate R-squared value for regression
 */
function calculateRSquared(
  actualValues: number[],
  regression: RegressionResult
): number {
  if (actualValues.length < 2) return 0;

  const mean = actualValues.reduce((a, b) => a + b) / actualValues.length;

  const ssTotal = actualValues.reduce((sum, y) => sum + (y - mean) ** 2, 0);

  const predictedValues = Array.from({ length: actualValues.length }, (_, i) =>
    regression.slope * (i + 1) + regression.intercept
  );

  const ssRes = actualValues.reduce(
    (sum, y, i) => sum + (y - predictedValues[i]) ** 2,
    0
  );

  const rSquared = ssTotal === 0 ? 0 : 1 - ssRes / ssTotal;

  return Math.max(0, Math.min(1, rSquared));
}

// ============================================
// SAVE PREDICTIONS TO DATABASE
// ============================================

/**
 * Save trending predictions to database
 */
export async function saveTrendingPredictions(
  predictions: TrendingPrediction[]
): Promise<void> {
  for (const pred of predictions) {
    await query(
      `
      INSERT INTO trending_articles (article_id, rank, score, rank_change, views_24h, engagement_24h, momentum, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (article_id) DO UPDATE SET
        rank = $2,
        score = $3,
        rank_change = $4,
        views_24h = $5,
        engagement_24h = $6,
        momentum = $7,
        calculated_at = NOW()
    `,
      [
        pred.articleId,
        pred.rank,
        pred.trendingScore,
        pred.rankChange,
        pred.views24h,
        pred.engagement24h,
        pred.momentum,
      ]
    );
  }
}

/**
 * Save churn predictions to database
 */
export async function saveChurnPredictions(
  predictions: ChurnPrediction[]
): Promise<void> {
  for (const pred of predictions) {
    await query(
      `
      INSERT INTO churn_predictions (reader_session_id, user_id, churn_probability, risk_level, predicted_churn_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (reader_session_id) DO UPDATE SET
        churn_probability = $3,
        risk_level = $4,
        predicted_churn_date = $5,
        updated_at = NOW()
    `,
      [
        pred.readerId,
        null,
        pred.churnProbability,
        pred.riskLevel,
        pred.predictedChurnDate,
      ]
    );
  }
}

/**
 * Save content performance predictions
 */
export async function saveContentPredictions(
  articleId: string,
  prediction: ContentPrediction
): Promise<void> {
  await query(
    `
    INSERT INTO content_performance_predictions (article_id, predicted_views, predicted_engagement_score, trend_direction, confidence_score, prediction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, NOW())
    ON CONFLICT (article_id, prediction_date) DO UPDATE SET
      predicted_views = $2,
      predicted_engagement_score = $3,
      trend_direction = $4,
      confidence_score = $5
  `,
    [
      articleId,
      prediction.predictedViews,
      prediction.predictedEngagementScore,
      prediction.trendDirection,
      prediction.confidenceScore,
    ]
  );
}
