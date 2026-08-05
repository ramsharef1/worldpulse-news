import { query } from './db';

/**
 * Analytics Calculations Library
 * Provides core calculation functions for metrics, scores, and aggregations
 */

// ============================================
// ENGAGEMENT SCORE CALCULATION
// ============================================

export interface EngagementFactors {
  views: number;
  clicks: number;
  shares: number;
  comments: number;
  reactions: number;
  averageTimeOnPage: number;
  scrollDepth: number;
  bounceRate: number;
}

/**
 * Calculate engagement score based on multiple factors
 * Score ranges 0-100
 */
export function calculateEngagementScore(factors: EngagementFactors): number {
  const weights = {
    views: 0.15,
    clicks: 0.15,
    shares: 0.2,
    comments: 0.2,
    reactions: 0.1,
    timeOnPage: 0.1,
    scrollDepth: 0.05,
    bounce: -0.05, // negative weight
  };

  // Normalize values
  const normViews = Math.min(factors.views / 1000, 1);
  const normClicks = Math.min(factors.clicks / 500, 1);
  const normShares = Math.min(factors.shares / 100, 1);
  const normComments = Math.min(factors.comments / 50, 1);
  const normReactions = Math.min(factors.reactions / 200, 1);
  const normTime = Math.min(factors.averageTimeOnPage / 300, 1); // 5 minutes
  const normScroll = (factors.scrollDepth || 0) / 100;
  const normBounce = Math.max(0, 1 - (factors.bounceRate / 100));

  const score =
    (normViews * weights.views +
      normClicks * weights.clicks +
      normShares * weights.shares +
      normComments * weights.comments +
      normReactions * weights.reactions +
      normTime * weights.timeOnPage +
      normScroll * weights.scrollDepth +
      normBounce * weights.bounce) *
    100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================
// PRODUCTIVITY SCORE CALCULATION
// ============================================

export interface EditorProductivityFactors {
  articlesPublished: number;
  averageApprovalTime: number;
  qualityScore: number;
  revisionCycles: number;
}

/**
 * Calculate editor productivity score (0-100)
 */
export function calculateProductivityScore(factors: EditorProductivityFactors): number {
  const weights = {
    output: 0.4,
    speed: 0.3,
    quality: 0.2,
    revisions: -0.1,
  };

  // Normalize output (0-50 articles per month baseline)
  const normOutput = Math.min(factors.articlesPublished / 50, 1);

  // Normalize speed (baseline 24 hours)
  const normSpeed = Math.max(0, 1 - factors.averageApprovalTime / 24);

  // Quality is already normalized 0-100
  const normQuality = factors.qualityScore / 100;

  // Penalty for revisions (baseline 3 cycles)
  const normRevisions = Math.max(0, 1 - factors.revisionCycles / 5);

  const score =
    (normOutput * weights.output +
      normSpeed * weights.speed +
      normQuality * weights.quality +
      normRevisions * weights.revisions) *
    100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================
// BOUNCE RATE CALCULATION
// ============================================

export async function calculateBounceRate(
  articleId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await query(
    `
    SELECT
      COUNT(DISTINCT reader_session_id) as total_sessions,
      COUNT(DISTINCT CASE WHEN pages_viewed = 1 THEN reader_session_id END) as bounce_sessions
    FROM reader_analytics
    WHERE article_id = $1
      AND timestamp >= $2
      AND timestamp <= $3
  `,
    [articleId, startDate, endDate]
  );

  const data = result.rows[0];
  if (!data || data.total_sessions === 0) {
    return 0;
  }

  return Math.round((data.bounce_sessions / data.total_sessions) * 100);
}

// ============================================
// GROWTH RATE & TREND ANALYSIS
// ============================================

export interface TrendData {
  period: Date;
  value: number;
}

export function calculateGrowthRate(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculateMomentum(trends: TrendData[]): number {
  if (trends.length < 2) return 0;

  const recent = trends.slice(-7); // Last 7 periods
  if (recent.length < 2) return 0;

  let momentum = 0;
  for (let i = 1; i < recent.length; i++) {
    momentum += calculateGrowthRate(recent[i - 1].value, recent[i].value);
  }

  return momentum / (recent.length - 1);
}

export function calculateTrendDirection(
  momentum: number
): 'up' | 'down' | 'stable' {
  if (momentum > 10) return 'up';
  if (momentum < -10) return 'down';
  return 'stable';
}

// ============================================
// CHURN PREDICTION CALCULATION
// ============================================

export interface ChurnIndicators {
  daysSinceLastVisit: number;
  visitFrequency: number; // visits per month
  averageSessionDuration: number; // seconds
  articlesRead: number;
  engagementScore: number;
}

/**
 * Calculate churn probability (0-100)
 * Higher values = higher risk of user leaving
 */
export function calculateChurnProbability(indicators: ChurnIndicators): number {
  // Weights for different factors
  const weights = {
    inactivity: 0.4,
    frequencyDecline: 0.25,
    sessionDuration: 0.15,
    contentEngagement: 0.2,
  };

  // Inactivity score (more days = higher churn risk)
  // Assume 30 days as threshold for moderate risk
  const inactivityScore = Math.min(indicators.daysSinceLastVisit / 30, 1);

  // Frequency decline score (lower visits = higher risk)
  // Baseline: 5 visits per month
  const frequencyScore = Math.max(0, 1 - indicators.visitFrequency / 5);

  // Session duration score (shorter sessions = higher risk)
  // Baseline: 5 minutes = 300 seconds
  const durationScore = Math.max(0, 1 - indicators.averageSessionDuration / 300);

  // Content engagement score
  const engagementScore = 1 - indicators.engagementScore / 100;

  const probability =
    (inactivityScore * weights.inactivity +
      frequencyScore * weights.frequencyDecline +
      durationScore * weights.sessionDuration +
      engagementScore * weights.contentEngagement) *
    100;

  return Math.max(0, Math.min(100, Math.round(probability)));
}

export function getChurnRiskLevel(
  probability: number
): 'low' | 'medium' | 'high' {
  if (probability > 70) return 'high';
  if (probability > 40) return 'medium';
  return 'low';
}

// ============================================
// AVERAGE TIME ON PAGE CALCULATION
// ============================================

export async function calculateAverageTimeOnPage(
  articleId: string,
  date: Date
): Promise<number> {
  const result = await query(
    `
    SELECT AVG(time_on_page) as avg_time
    FROM reader_analytics
    WHERE article_id = $1
      AND DATE(timestamp) = $2
  `,
    [articleId, date]
  );

  return result.rows[0]?.avg_time || 0;
}

// ============================================
// ARTICLE PERFORMANCE AGGREGATION
// ============================================

export async function aggregateArticlePerformance(
  articleId: string,
  date: Date
): Promise<any> {
  const result = await query(
    `
    SELECT
      COUNT(DISTINCT reader_session_id) as unique_views,
      COUNT(*) as total_views,
      AVG(time_on_page) as avg_time_on_page,
      AVG(scroll_depth) as scroll_depth,
      COUNT(CASE WHEN clicked_links > 0 THEN 1 END) as clicks,
      COUNT(CASE WHEN reached_end THEN 1 END) as completed_reads
    FROM reader_analytics
    WHERE article_id = $1
      AND DATE(timestamp) = $2
  `,
    [articleId, date]
  );

  return result.rows[0];
}

// ============================================
// UNIVERSITY STATISTICS CALCULATION
// ============================================

export async function calculateUniversityStats(
  universityId: string,
  date: Date
): Promise<any> {
  const result = await query(
    `
    SELECT
      COUNT(DISTINCT a.id) as total_articles,
      COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published_articles,
      COUNT(DISTINCT CASE WHEN a.status = 'draft' THEN a.id END) as draft_articles,
      COALESCE(SUM(apm.views), 0) as total_views,
      COUNT(DISTINCT apm.id) as metrics_records,
      AVG(apm.engagement_score) as avg_engagement_score,
      COUNT(DISTINCT a.author_id) as contributors_count
    FROM articles a
    LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id AND apm.date = $2
    WHERE a.university_id = $1
      AND a.created_at <= $2
  `,
    [universityId, date]
  );

  return result.rows[0];
}

// ============================================
// TRENDING SCORE CALCULATION
// ============================================

export interface TrendingFactors {
  viewsLast24h: number;
  viewsLast7d: number;
  clicksLast24h: number;
  commentsLast24h: number;
  sharesLast24h: number;
  socialsignals: number;
}

/**
 * Calculate trending score (higher = more trending)
 * Emphasizes recent activity and momentum
 */
export function calculateTrendingScore(factors: TrendingFactors): number {
  const weights = {
    recentViews: 0.3,
    momentum: 0.25,
    engagement: 0.25,
    social: 0.2,
  };

  // Recent views (last 24h)
  const recentViewsScore = Math.min(factors.viewsLast24h / 500, 1);

  // Momentum (trend over time)
  const momentum =
    factors.viewsLast7d > 0
      ? factors.viewsLast24h / (factors.viewsLast7d / 7)
      : 0;
  const momentumScore = Math.min(momentum / 3, 1);

  // Engagement (comments + shares relative to views)
  const engagementRate =
    factors.viewsLast24h > 0
      ? (factors.commentsLast24h + factors.sharesLast24h) /
        factors.viewsLast24h
      : 0;
  const engagementScore = Math.min(engagementRate * 100, 1);

  // Social signals
  const socialScore = Math.min(factors.socialsignals / 100, 1);

  const score =
    (recentViewsScore * weights.recentViews +
      momentumScore * weights.momentum +
      engagementScore * weights.engagement +
      socialScore * weights.social) *
    100;

  return Math.round(score);
}

// ============================================
// TIME ZONE AWARE CALCULATIONS
// ============================================

export function convertToTimezone(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const timezoneDate = new Date();

  parts.forEach((part) => {
    if (part.type === 'year') {
      timezoneDate.setFullYear(parseInt(part.value));
    } else if (part.type === 'month') {
      timezoneDate.setMonth(parseInt(part.value) - 1);
    } else if (part.type === 'day') {
      timezoneDate.setDate(parseInt(part.value));
    } else if (part.type === 'hour') {
      timezoneDate.setHours(parseInt(part.value));
    } else if (part.type === 'minute') {
      timezoneDate.setMinutes(parseInt(part.value));
    } else if (part.type === 'second') {
      timezoneDate.setSeconds(parseInt(part.value));
    }
  });

  return timezoneDate;
}

// ============================================
// BILINGUAL CONTENT PREPARATION
// ============================================

export interface BilingualMetrics {
  metric_en: string;
  metric_ar: string;
  value: number;
}

export function prepareBilingualMetrics(
  metric: string,
  value: any
): BilingualMetrics {
  const translations: Record<string, { en: string; ar: string }> = {
    total_views: {
      en: 'Total Views',
      ar: 'إجمالي المشاهدات',
    },
    unique_views: {
      en: 'Unique Visitors',
      ar: 'الزوار الفريدون',
    },
    engagement_score: {
      en: 'Engagement Score',
      ar: 'درجة الانخراط',
    },
    avg_time_on_page: {
      en: 'Average Time on Page',
      ar: 'متوسط الوقت على الصفحة',
    },
    click_through_rate: {
      en: 'Click Through Rate',
      ar: 'معدل النقر',
    },
    bounce_rate: {
      en: 'Bounce Rate',
      ar: 'معدل الارتداد',
    },
    articles_published: {
      en: 'Articles Published',
      ar: 'المقالات المنشورة',
    },
    contributors: {
      en: 'Contributors',
      ar: 'المساهمون',
    },
  };

  const trans = translations[metric] || { en: metric, ar: metric };

  return {
    metric_en: trans.en,
    metric_ar: trans.ar,
    value,
  };
}

// ============================================
// PERCENTILE CALCULATIONS
// ============================================

export async function calculatePercentile(
  values: number[],
  percentile: number
): Promise<number> {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// ============================================
// MOVING AVERAGE CALCULATION
// ============================================

export function calculateMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const average = window.reduce((a, b) => a + b, 0) / window.length;
    result.push(average);
  }

  return result;
}
