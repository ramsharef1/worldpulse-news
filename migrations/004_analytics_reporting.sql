-- Universities Voice - Analytics & Reporting System
-- Comprehensive analytics schema for Phase 1 admin panel
-- Supports article performance, university stats, editorial metrics, user behavior, and predictions

-- ============================================
-- 1. EVENT LOGGING & TRACKING
-- ============================================

CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- view, click, share, comment, reaction, search
  entity_type VARCHAR(50) NOT NULL, -- article, event, job, faculty
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  reader_session_id VARCHAR(255), -- anonymously track readers
  metadata JSONB, -- additional context: device, referrer, geo, etc
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  INDEX idx_event_logs_timestamp (timestamp DESC),
  INDEX idx_event_logs_entity (entity_type, entity_id),
  INDEX idx_event_logs_user (user_id)
);

CREATE TABLE reader_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50), -- desktop, tablet, mobile
  browser VARCHAR(100),
  os VARCHAR(100),
  first_visit TIMESTAMP DEFAULT NOW(),
  last_visit TIMESTAMP DEFAULT NOW(),
  visit_count INT DEFAULT 1,
  total_time_spent INT DEFAULT 0, -- seconds
  pages_viewed INT DEFAULT 0,
  is_returning BOOLEAN DEFAULT false,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  referrer_domain VARCHAR(255)
);

CREATE TABLE article_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  unique_views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  reactions_count INT DEFAULT 0,
  avg_time_on_page INT DEFAULT 0, -- seconds
  scroll_depth DECIMAL(5, 2) DEFAULT 0, -- percentage 0-100
  bounce_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  readers_per_day INT DEFAULT 0,
  repeat_readers INT DEFAULT 0,
  engagement_score INT DEFAULT 0, -- calculated metric
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id, date),
  INDEX idx_article_perf_date (date DESC),
  INDEX idx_article_perf_score (engagement_score DESC)
);

CREATE TABLE university_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_articles INT DEFAULT 0,
  published_articles INT DEFAULT 0,
  draft_articles INT DEFAULT 0,
  total_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  avg_article_views DECIMAL(10, 2) DEFAULT 0,
  total_engagement_score INT DEFAULT 0,
  top_category VARCHAR(100),
  contributors_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(university_id, date),
  INDEX idx_uni_stats_date (date DESC)
);

CREATE TABLE editorial_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  articles_created INT DEFAULT 0,
  articles_published INT DEFAULT 0,
  articles_approved INT DEFAULT 0,
  avg_approval_time INT DEFAULT 0, -- hours
  avg_revision_cycles INT DEFAULT 0,
  quality_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  productivity_score DECIMAL(5, 2) DEFAULT 0, -- based on output
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date),
  INDEX idx_edit_perf_date (date DESC)
);

CREATE TABLE user_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reader_session_id VARCHAR(255),
  last_visit TIMESTAMP,
  visit_frequency INT DEFAULT 0, -- visits per month
  avg_session_duration INT DEFAULT 0, -- seconds
  total_time_on_platform INT DEFAULT 0, -- seconds
  articles_read INT DEFAULT 0,
  avg_articles_per_visit DECIMAL(5, 2) DEFAULT 0,
  preferred_categories TEXT[], -- top categories
  churn_risk DECIMAL(5, 2) DEFAULT 0, -- 0-100, prediction
  lifetime_value DECIMAL(10, 2) DEFAULT 0, -- engagement value
  last_engagement TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_behavior_churn (churn_risk DESC)
);

-- ============================================
-- 2. PREDICTIVE ANALYTICS
-- ============================================

CREATE TABLE content_performance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  predicted_views INT,
  predicted_engagement_score INT,
  trend_direction VARCHAR(20), -- up, down, stable
  confidence_score DECIMAL(5, 2), -- 0-100
  prediction_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id, prediction_date),
  INDEX idx_pred_article (article_id)
);

CREATE TABLE trending_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  rank INT,
  score DECIMAL(10, 4),
  rank_change INT, -- compared to previous period
  views_24h INT,
  engagement_24h INT,
  momentum DECIMAL(5, 2), -- growth rate
  calculated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_trending_rank (rank ASC),
  INDEX idx_trending_score (score DESC)
);

CREATE TABLE churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_session_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  churn_probability DECIMAL(5, 2), -- 0-100
  risk_level VARCHAR(50), -- low, medium, high
  last_activity TIMESTAMP,
  days_since_activity INT,
  predicted_churn_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_churn_risk (risk_level)
);

CREATE TABLE optimal_publish_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  day_of_week INT, -- 0=Sunday to 6=Saturday
  hour_of_day INT, -- 0-23
  avg_engagement_score INT,
  historical_views INT,
  recommendation_score DECIMAL(5, 2), -- confidence
  timezone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_opt_publish (university_id, day_of_week)
);

-- ============================================
-- 3. REPORT MANAGEMENT
-- ============================================

CREATE TABLE report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(100), -- article_performance, university_stats, editorial_metrics, etc
  owner_id UUID NOT NULL REFERENCES users(id),
  filters JSONB, -- stored filters: date_range, university, category, etc
  columns TEXT[], -- which metrics to include
  sort_by VARCHAR(100),
  sort_order VARCHAR(10), -- ASC or DESC
  language VARCHAR(10) DEFAULT 'en', -- ar or en
  is_public BOOLEAN DEFAULT false,
  is_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_report_owner (owner_id)
);

CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  frequency VARCHAR(50), -- daily, weekly, monthly, quarterly
  day_of_week INT, -- for weekly
  day_of_month INT, -- for monthly
  time_of_day TIME,
  timezone VARCHAR(50),
  recipients TEXT[], -- email addresses
  format VARCHAR(50), -- pdf, excel, csv
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_schedule_next_run (next_run)
);

CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES users(id),
  file_url TEXT,
  file_format VARCHAR(50), -- pdf, excel, csv
  file_size INT, -- bytes
  data_json JSONB, -- raw report data
  period_start DATE,
  period_end DATE,
  row_count INT,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  INDEX idx_generated_date (generated_at DESC)
);

CREATE TABLE report_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES generated_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. ANALYTICS CACHE & MATERIALIZED VIEWS
-- ============================================

CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_type VARCHAR(100), -- top_articles, university_stats, trending, etc
  data JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_cache_expires (expires_at)
);

CREATE TABLE dashboard_metrics_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id VARCHAR(100), -- admin_overview, university_dashboard, etc
  university_id UUID REFERENCES universities(id),
  metrics JSONB, -- key metrics for dashboard
  period_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_dashboard_period (period_date DESC)
);

-- ============================================
-- 5. CONTENT PERFORMANCE TRIGGERS & AUTOMATION
-- ============================================

CREATE TABLE performance_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100), -- high_performer, trending, underperformer
  metric VARCHAR(100), -- views, engagement_score, etc
  threshold INT,
  condition VARCHAR(50), -- greater_than, less_than, equals
  action VARCHAR(100), -- promote, feature, notify
  action_params JSONB,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_trigger_active (is_active)
);

CREATE TABLE triggered_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES performance_triggers(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  featured_at TIMESTAMP,
  promoted_at TIMESTAMP,
  automation_action VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trigger_id, article_id)
);

-- ============================================
-- 6. ANALYTICS SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE analytics_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  data_type VARCHAR(50), -- string, number, boolean, json
  category VARCHAR(100), -- tracking, retention, export, etc
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type VARCHAR(100), -- event_logs, sessions, predictions
  retention_days INT,
  archive_after_days INT,
  auto_delete BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX idx_reader_sessions_user ON reader_sessions(user_id);
CREATE INDEX idx_reader_sessions_last_visit ON reader_sessions(last_visit DESC);
CREATE INDEX idx_article_perf_article ON article_performance_metrics(article_id);
CREATE INDEX idx_uni_stats_university ON university_statistics(university_id);
CREATE INDEX idx_edit_perf_user ON editorial_performance(user_id);
CREATE INDEX idx_user_behavior_user ON user_behavior_analytics(user_id);
CREATE INDEX idx_trending_article ON trending_articles(article_id);
CREATE INDEX idx_churn_session ON churn_predictions(reader_session_id);
CREATE INDEX idx_churn_date ON churn_predictions(predicted_churn_date);
CREATE INDEX idx_report_type ON report_definitions(report_type);
CREATE INDEX idx_schedule_active ON report_schedules(is_active);

-- ============================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- ============================================

CREATE MATERIALIZED VIEW mv_top_articles_by_engagement AS
SELECT
  a.id,
  a.title_en,
  a.title_ar,
  a.university_id,
  SUM(apm.views) as total_views,
  SUM(apm.clicks) as total_clicks,
  AVG(apm.engagement_score) as avg_engagement,
  MAX(apm.date) as last_updated
FROM articles a
LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
WHERE a.status = 'published' AND apm.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY a.id, a.title_en, a.title_ar, a.university_id
ORDER BY avg_engagement DESC;

CREATE INDEX idx_mv_top_articles_engagement ON mv_top_articles_by_engagement(avg_engagement DESC);

CREATE MATERIALIZED VIEW mv_university_content_distribution AS
SELECT
  u.id,
  u.name_en,
  u.name_ar,
  COUNT(a.id) as total_articles,
  COUNT(CASE WHEN a.status = 'published' THEN 1 END) as published_articles,
  SUM(CASE WHEN apm.date = CURRENT_DATE THEN apm.views ELSE 0 END) as today_views,
  AVG(apm.engagement_score) as avg_engagement_score
FROM universities u
LEFT JOIN articles a ON u.id = a.university_id
LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
GROUP BY u.id, u.name_en, u.name_ar;

CREATE INDEX idx_mv_uni_dist_views ON mv_university_content_distribution(today_views DESC);

CREATE MATERIALIZED VIEW mv_editor_productivity AS
SELECT
  u.id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  COUNT(DISTINCT a.id) as total_articles,
  SUM(CASE WHEN a.status = 'published' THEN 1 ELSE 0 END) as published_articles,
  AVG(ep.avg_approval_time) as avg_approval_hours,
  SUM(ep.articles_published) as published_this_month,
  AVG(ep.quality_score) as avg_quality_score
FROM users u
LEFT JOIN articles a ON u.id = a.author_id
LEFT JOIN editorial_performance ep ON u.id = ep.user_id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY u.id, u.email, u.first_name, u.last_name;

CREATE INDEX idx_mv_editor_prod_articles ON mv_editor_productivity(total_articles DESC);

-- ============================================
-- SEED ANALYTICS SETTINGS
-- ============================================

INSERT INTO analytics_settings (setting_key, setting_value, description, data_type, category)
VALUES
  ('track_page_views', 'true', 'Enable page view tracking', 'boolean', 'tracking'),
  ('track_user_events', 'true', 'Enable user event tracking', 'boolean', 'tracking'),
  ('event_log_retention_days', '90', 'Days to retain event logs', 'number', 'retention'),
  ('session_retention_days', '30', 'Days to retain reader sessions', 'number', 'retention'),
  ('cache_analytics_hours', '2', 'Hours to cache analytics data', 'number', 'caching'),
  ('export_max_rows', '100000', 'Maximum rows in export', 'number', 'export'),
  ('enable_predictions', 'true', 'Enable ML predictions', 'boolean', 'features'),
  ('prediction_confidence_threshold', '70', 'Min confidence for predictions', 'number', 'features');

INSERT INTO data_retention_policies (data_type, retention_days, archive_after_days, auto_delete, description)
VALUES
  ('event_logs', 90, 30, true, 'Event logs retention'),
  ('reader_sessions', 30, 15, true, 'Reader session data retention'),
  ('article_metrics', 365, 180, false, 'Article performance metrics'),
  ('predictions', 30, 15, true, 'Predictive analytics data');

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

CREATE OR REPLACE FUNCTION update_analytics_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.calculated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analytics_cache_update
BEFORE UPDATE ON analytics_cache
FOR EACH ROW
EXECUTE FUNCTION update_analytics_cache_timestamp();

-- Refresh materialized views (run manually or via cron)
-- REFRESH MATERIALIZED VIEW mv_top_articles_by_engagement;
-- REFRESH MATERIALIZED VIEW mv_university_content_distribution;
-- REFRESH MATERIALIZED VIEW mv_editor_productivity;
