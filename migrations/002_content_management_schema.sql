-- Content Management API Schema
-- Supports articles, events, jobs, faculty, media, templates, and versioning

-- Content Versions Table
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'article', 'event', 'job', 'faculty'
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL, -- Full content snapshot
  changes JSONB DEFAULT '{}'::jsonb, -- Field changes {field: {old, new}}
  change_summary VARCHAR(500), -- Comma-separated changed fields
  changed_by VARCHAR(255) NOT NULL, -- User ID
  change_reason VARCHAR(500), -- Optional reason for change
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, entity_type, version_number)
);

CREATE INDEX idx_versions_content ON content_versions(content_id, entity_type);
CREATE INDEX idx_versions_user ON content_versions(changed_by);
CREATE INDEX idx_versions_date ON content_versions(created_at DESC);

-- Change Annotations Table
CREATE TABLE IF NOT EXISTS change_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  field VARCHAR(255) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  note TEXT NOT NULL,
  annotated_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_annotations_version ON change_annotations(version_id);
CREATE INDEX idx_annotations_user ON change_annotations(annotated_by);

-- Content Templates Table
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'article', 'event', 'job', 'faculty'
  category VARCHAR(100),
  template_content JSONB NOT NULL, -- Template with {{variable}} placeholders
  preview_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_entity ON content_templates(entity_type);
CREATE INDEX idx_templates_active ON content_templates(is_active);
CREATE INDEX idx_templates_usage ON content_templates(usage_count DESC);

-- Media Files Table
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL, -- File size in bytes
  width INTEGER, -- For images
  height INTEGER, -- For images
  s3_key VARCHAR(500) NOT NULL,
  s3_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  alt_text_en VARCHAR(255),
  alt_text_ar VARCHAR(255),
  uploaded_by VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_user ON media_files(uploaded_by);
CREATE INDEX idx_media_mime ON media_files(mime_type);
CREATE INDEX idx_media_deleted ON media_files(deleted_at);
CREATE INDEX idx_media_date ON media_files(created_at DESC);

-- Content-Media Relationship Table
CREATE TABLE IF NOT EXISTS content_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL, -- 'featured_image', 'gallery', 'attachment', 'thumbnail'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_media ON content_media(content_id, entity_type);
CREATE INDEX idx_content_media_id ON content_media(media_id);

-- Duplicate Checks Log Table
CREATE TABLE IF NOT EXISTS duplicate_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  matched_ids JSONB, -- Array of IDs of matched duplicates
  is_duplicate BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_duplicates_content ON duplicate_checks(content_id, entity_type);
CREATE INDEX idx_duplicates_is_dup ON duplicate_checks(is_duplicate);

-- Articles Table (enhanced with admin features)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  excerpt_en VARCHAR(500),
  excerpt_ar VARCHAR(500),
  university_id VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) DEFAULT 'admin', -- 'admin', 'rss', 'tip', 'social', 'event'
  featured_image_url VARCHAR(500),
  gallery_urls JSONB, -- Array of image URLs
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'published', 'archived'
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reading_time INTEGER, -- Minutes
  tags JSONB DEFAULT '[]'::jsonb, -- Array of tags
  seo_metadata JSONB, -- {title, description, keywords}
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,
  language_original VARCHAR(2) DEFAULT 'en', -- 'ar' or 'en'
  published_at TIMESTAMP,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_university ON articles(university_id);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured);
CREATE INDEX idx_articles_title_en ON articles USING GIN(to_tsvector('english', title_en));
CREATE INDEX idx_articles_title_ar ON articles USING GIN(to_tsvector('simple', title_ar));
CREATE INDEX idx_articles_created ON articles(created_at DESC);

-- Events Table (enhanced)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location_en VARCHAR(255),
  location_ar VARCHAR(255),
  image_url VARCHAR(500),
  link VARCHAR(500),
  university_id VARCHAR(255) NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'published', -- 'draft', 'published', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_university ON events(university_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_featured ON events(is_featured);
CREATE INDEX idx_events_status ON events(status);

-- Jobs Table (enhanced)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  position_type VARCHAR(50) NOT NULL, -- 'internship', 'fulltime', 'parttime', 'contract'
  requirements_en TEXT,
  requirements_ar TEXT,
  salary_range_min DECIMAL(10, 2),
  salary_range_max DECIMAL(10, 2),
  university_id VARCHAR(255) NOT NULL,
  posted_by_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_university ON jobs(university_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by_id);
CREATE INDEX idx_jobs_expires ON jobs(expires_at);

-- Faculty Table (enhanced)
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  research_interests TEXT,
  office_location VARCHAR(255),
  office_hours VARCHAR(500),
  profile_image_url VARCHAR(500),
  university_id VARCHAR(255) NOT NULL,
  department_id VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faculty_university ON faculty(university_id);
CREATE INDEX idx_faculty_department ON faculty(department_id);
CREATE INDEX idx_faculty_email ON faculty(email);
CREATE INDEX idx_faculty_deleted ON faculty(deleted_at);

-- Audit Log for Admin Actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'publish', 'archive', 'rollback'
  entity_type VARCHAR(50) NOT NULL, -- 'article', 'event', 'job', 'faculty', 'template', 'media'
  entity_id VARCHAR(255) NOT NULL,
  old_values JSONB, -- Previous state
  new_values JSONB, -- New state
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  notes VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON admin_audit_log(user_id);
CREATE INDEX idx_audit_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON admin_audit_log(action);
CREATE INDEX idx_audit_date ON admin_audit_log(created_at DESC);

-- Content Auto-Save Drafts
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255),
  entity_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  data JSONB NOT NULL, -- Draft content
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'discarded'
  auto_saved BOOLEAN DEFAULT true,
  last_auto_save TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drafts_user ON content_drafts(user_id);
CREATE INDEX idx_drafts_content ON content_drafts(content_id, entity_type);
CREATE INDEX idx_drafts_auto_save ON content_drafts(last_auto_save);

-- Enhance existing articles table if not already present
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'admin';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language_original VARCHAR(2) DEFAULT 'en';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time INTEGER;

-- Create necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_fulltext_en ON articles USING GIN(to_tsvector('english', coalesce(title_en, '') || ' ' || coalesce(excerpt_en, '') || ' ' || coalesce(content_en, '')));
CREATE INDEX IF NOT EXISTS idx_events_fulltext ON events USING GIN(to_tsvector('simple', coalesce(title_en, '') || ' ' || coalesce(description_en, '')));
CREATE INDEX IF NOT EXISTS idx_jobs_fulltext ON jobs USING GIN(to_tsvector('simple', coalesce(title_en, '') || ' ' || coalesce(description_en, '')));

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
