-- Universities Voice by Convertic - Phase 1 Database Schema
-- Complete PostgreSQL schema for MVP features

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_secret VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'super_admin', 'editor', 'university_admin', 'moderator', 'analyst'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id),
  resource VARCHAR(100), -- 'articles', 'events', 'jobs', 'faculty', 'users', 'settings'
  action VARCHAR(50), -- 'create', 'read', 'update', 'delete', 'approve', 'publish'
  field_level BOOLEAN DEFAULT false, -- applies to specific fields only
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, resource, action)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(500) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100), -- 'create', 'update', 'delete', 'publish', 'approve'
  entity_type VARCHAR(100), -- 'article', 'event', 'job', 'faculty'
  entity_id UUID,
  changes JSONB, -- what changed: {field: {old: value, new: value}}
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  expires_at TIMESTAMP,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CONTENT MANAGEMENT
-- ============================================

CREATE TABLE content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'article', 'event', 'job', 'faculty'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar VARCHAR(500) NOT NULL,
  title_en VARCHAR(500) NOT NULL,
  excerpt_ar TEXT,
  excerpt_en TEXT,
  content_ar TEXT,
  content_en TEXT,
  author_id UUID NOT NULL REFERENCES users(id),
  university_id UUID,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, approved, published, archived, retracted
  featured BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  version INT DEFAULT 1,
  template_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  scheduled_at TIMESTAMP -- for scheduled publishing
);

CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  version INT NOT NULL,
  title_ar VARCHAR(500),
  title_en VARCHAR(500),
  content_ar TEXT,
  content_en TEXT,
  changed_by UUID REFERENCES users(id),
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id, version)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar VARCHAR(500) NOT NULL,
  title_en VARCHAR(500) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  university_id UUID,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  employer VARCHAR(255),
  location VARCHAR(255),
  job_type VARCHAR(50), -- full-time, part-time, internship
  field VARCHAR(100),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  deadline DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  department VARCHAR(255),
  specialization TEXT,
  email VARCHAR(255),
  university_id UUID,
  publications INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20), -- image, video, document
  file_size INT, -- bytes
  width INT, -- for images
  height INT,
  alt_text TEXT,
  tags VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(100), -- article, event, job
  structure JSONB, -- predefined fields
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. EDITORIAL WORKFLOW
-- ============================================

CREATE TABLE workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100), -- 'draft', 'under_review', 'approved', 'scheduled', 'published'
  order_index INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  current_state VARCHAR(100),
  next_state VARCHAR(100),
  approver_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  user_id UUID NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  mentioned_users UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  field_name VARCHAR(255),
  old_value TEXT,
  suggested_value TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE editorial_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. PUBLISHING & SCHEDULING
-- ============================================

CREATE TABLE publishing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  scheduled_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, published, failed, cancelled
  published_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE publishing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMP DEFAULT NOW(),
  version INT
);

-- ============================================
-- 5. ANALYTICS & METRICS
-- ============================================

CREATE TABLE article_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  date DATE,
  views INT DEFAULT 0,
  unique_views INT DEFAULT 0,
  avg_time_on_page INT, -- seconds
  scroll_depth DECIMAL(5,2), -- percentage
  click_through_rate DECIMAL(5,2),
  engagement_score INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id, date)
);

CREATE TABLE reader_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  reader_session_id VARCHAR(255),
  time_on_page INT,
  scroll_depth DECIMAL(5,2),
  clicked_links INT,
  reached_end BOOLEAN,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trending_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  score DECIMAL(10,4),
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id)
);

CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100), -- 'top_articles', 'university_stats', 'editorial_metrics'
  data JSONB,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- ============================================
-- 6. DATA MANAGEMENT & SETTINGS
-- ============================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  setting_type VARCHAR(50), -- string, json, boolean, number
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100), -- article, event, job
  field_name VARCHAR(255),
  field_type VARCHAR(50), -- text, textarea, number, date, select, multiselect
  required BOOLEAN DEFAULT false,
  options TEXT[], -- for select/multiselect
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name VARCHAR(255),
  backup_size INT,
  backup_path TEXT,
  status VARCHAR(50), -- success, failed, restoring, restored
  scheduled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  subject VARCHAR(500),
  template_html TEXT,
  variables TEXT[], -- placeholders
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. UNIVERSITIES & ORGANIZATIONS
-- ============================================

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  logo_url TEXT,
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_university ON articles(university_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_workflows_article ON workflow_approvals(article_id);
CREATE INDEX idx_publishing_queue_scheduled ON publishing_queue(scheduled_time);
CREATE INDEX idx_analytics_date ON article_analytics(date);
CREATE INDEX idx_trending_score ON trending_scores(score DESC);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access'),
  ('editor', 'Can create and approve content'),
  ('university_admin', 'Manage own university content'),
  ('moderator', 'Review and moderate content'),
  ('analyst', 'View analytics only - read-only');

INSERT INTO universities (name_ar, name_en, slug) VALUES
  ('جامعة الأردن', 'University of Jordan', 'university-of-jordan'),
  ('اليرموك', 'Yarmouk University', 'yarmouk'),
  ('العلوم والتكنولوجيا', 'Science & Technology University', 'just'),
  ('الهاشمية', 'Al-Hashemite University', 'ahu'),
  ('مؤتة', 'Mutah University', 'mutah'),
  ('البلقاء', 'Balqa Applied University', 'bau'),
  ('الزيتونة', 'Al-Zaytoonah University', 'zpu');
