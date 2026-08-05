-- Universities Voice - Phase 1, Task 15: Data Management & Settings API
-- Complete schema for settings, backups, exports, imports, custom fields, and configuration management

-- ============================================
-- 1. SYSTEM SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Branding Settings
  organization_name VARCHAR(255),
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),

  -- Theme Settings
  theme_mode VARCHAR(20) DEFAULT 'light', -- light, dark, auto
  custom_css TEXT,

  -- Language & Locale
  default_language VARCHAR(10) DEFAULT 'en', -- en, ar
  supported_languages TEXT[], -- array of language codes
  timezone VARCHAR(100) DEFAULT 'UTC',
  date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(50) DEFAULT 'HH:MM:SS',

  -- Notification Settings
  email_notifications_enabled BOOLEAN DEFAULT true,
  in_app_notifications_enabled BOOLEAN DEFAULT true,
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, never

  -- Security Settings
  ip_whitelist INET[],
  enforce_2fa BOOLEAN DEFAULT false,
  session_timeout_minutes INT DEFAULT 60,
  password_policy_enabled BOOLEAN DEFAULT true,

  -- Data Settings
  data_retention_days INT DEFAULT 2555, -- 7 years
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly

  -- Encryption Keys
  encryption_key_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  UNIQUE(university_id, user_id)
);

CREATE INDEX ON admin_settings(university_id);
CREATE INDEX ON admin_settings(user_id);

-- ============================================
-- 2. CUSTOM FIELDS (NO-CODE)
-- ============================================

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,
  entity_type VARCHAR(100) NOT NULL, -- article, user, event, etc.
  field_name VARCHAR(255) NOT NULL,
  field_label_en VARCHAR(255) NOT NULL,
  field_label_ar VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- text, number, email, url, date, select, checkbox, textarea, rich_text
  field_placeholder_en VARCHAR(255),
  field_placeholder_ar VARCHAR(255),

  -- Field Validation
  is_required BOOLEAN DEFAULT false,
  validation_pattern VARCHAR(500), -- regex pattern
  min_length INT,
  max_length INT,
  min_value NUMERIC,
  max_value NUMERIC,

  -- Field Options (for select/checkbox types)
  options JSONB, -- [{label: "...", value: "..."}, ...]
  default_value TEXT,

  -- Field Display
  field_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT false,
  show_in_list_view BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(university_id, entity_type, field_name)
);

CREATE INDEX ON custom_fields(university_id);
CREATE INDEX ON custom_fields(entity_type);

-- ============================================
-- 3. CUSTOM PERMISSION RULES
-- ============================================

CREATE TABLE IF NOT EXISTS custom_permission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT,

  -- Rule Definition
  resource VARCHAR(100) NOT NULL, -- article, user, settings, etc.
  action VARCHAR(100) NOT NULL, -- read, create, update, delete, etc.
  conditions JSONB, -- {field: value, ...}

  -- Rule Application
  applies_to_roles TEXT[], -- roles this rule applies to
  applies_to_users UUID[], -- specific users this rule applies to

  -- Rule Effect
  allow BOOLEAN DEFAULT true, -- true for allow, false for deny
  priority INT DEFAULT 0, -- higher priority = evaluated first

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(university_id, rule_name)
);

CREATE INDEX ON custom_permission_rules(university_id);
CREATE INDEX ON custom_permission_rules(is_active);

-- ============================================
-- 4. EMAIL TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,
  template_name VARCHAR(255) NOT NULL,
  template_slug VARCHAR(255) NOT NULL,

  -- Template Content
  subject_en VARCHAR(500) NOT NULL,
  subject_ar VARCHAR(500) NOT NULL,
  body_html_en TEXT NOT NULL,
  body_html_ar TEXT NOT NULL,
  body_text_en TEXT,
  body_text_ar TEXT,

  -- Template Variables
  variables JSONB, -- ["user_name", "article_title", ...]

  -- Template Settings
  reply_to_email VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  use_branding BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(university_id, template_slug)
);

CREATE INDEX ON email_templates(university_id);
CREATE INDEX ON email_templates(is_active);

-- ============================================
-- 5. USER NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),

  -- Email Notifications
  email_on_article_published BOOLEAN DEFAULT true,
  email_on_article_approved BOOLEAN DEFAULT true,
  email_on_comment BOOLEAN DEFAULT true,
  email_on_reply BOOLEAN DEFAULT true,
  email_on_reaction BOOLEAN DEFAULT false,
  email_digest_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, never

  -- In-App Notifications
  in_app_notifications_enabled BOOLEAN DEFAULT true,
  in_app_sound_enabled BOOLEAN DEFAULT true,
  in_app_desktop_notifications BOOLEAN DEFAULT true,

  -- Notification Settings by Category
  notify_system_updates BOOLEAN DEFAULT true,
  notify_security_alerts BOOLEAN DEFAULT true,
  notify_user_activity BOOLEAN DEFAULT true,
  notify_content_activity BOOLEAN DEFAULT true,

  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. BACKUP MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS backup_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,

  -- Backup Identification
  backup_name VARCHAR(255) NOT NULL,
  backup_type VARCHAR(50) NOT NULL, -- full, incremental, differential

  -- Backup Details
  size_bytes BIGINT,
  file_count INT,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INT,

  -- Backup Storage
  storage_location VARCHAR(500), -- S3 path or local path
  storage_type VARCHAR(50) DEFAULT 'local', -- local, s3, azure, gcs

  -- Backup Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed, archived
  error_message TEXT,

  -- Backup Retention
  retention_policy VARCHAR(50), -- daily, weekly, monthly, permanent
  expires_at TIMESTAMP,
  is_encrypted BOOLEAN DEFAULT true,

  -- Backup Verification
  checksum VARCHAR(255),
  integrity_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,

  -- Backup Scheduling
  is_scheduled_backup BOOLEAN DEFAULT false,
  schedule_id UUID,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX ON backup_metadata(university_id);
CREATE INDEX ON backup_metadata(status);
CREATE INDEX ON backup_metadata(created_at);

-- ============================================
-- 7. BACKUP SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,

  -- Schedule Definition
  schedule_name VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- hourly, daily, weekly, monthly

  -- Timing
  run_time TIME, -- time of day to run
  day_of_week INT, -- 0-6 for weekly backups
  day_of_month INT, -- 1-31 for monthly backups

  -- Retention
  retention_days INT DEFAULT 30,
  retention_policy VARCHAR(50), -- daily, weekly, monthly, permanent
  max_backups_to_keep INT DEFAULT 10,

  -- Notification
  notify_on_success BOOLEAN DEFAULT false,
  notify_on_failure BOOLEAN DEFAULT true,
  notification_email_list TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  last_run_status VARCHAR(50), -- succeeded, failed

  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX ON backup_schedules(university_id);
CREATE INDEX ON backup_schedules(is_active);
CREATE INDEX ON backup_schedules(next_run_at);

-- ============================================
-- 8. DATA RETENTION POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,

  -- Policy Definition
  policy_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL, -- article, user, log, comment, etc.

  -- Retention Rules
  retention_days INT NOT NULL,
  archive_after_days INT,
  delete_after_days INT,

  -- Conditions
  applies_to_status TEXT[], -- draft, published, archived, etc.
  applies_to_users UUID[],

  -- Actions
  action_before_delete VARCHAR(50), -- archive, backup, notify

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  UNIQUE(university_id, entity_type, policy_name)
);

CREATE INDEX ON data_retention_policies(university_id);
CREATE INDEX ON data_retention_policies(entity_type);

-- ============================================
-- 9. DATA EXPORT JOBS
-- ============================================

CREATE TABLE IF NOT EXISTS data_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,

  -- Export Definition
  export_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL, -- article, user, comment, etc.
  export_format VARCHAR(50) NOT NULL, -- csv, json, xml

  -- Export Filters
  filters JSONB, -- {status: "published", dateRange: {...}}
  included_fields TEXT[],

  -- Export Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  progress_percent INT DEFAULT 0,
  total_records INT,
  processed_records INT,

  -- Export File
  file_path VARCHAR(500),
  file_size_bytes BIGINT,
  file_url TEXT,
  download_url TEXT,

  -- Export Settings
  include_relationships BOOLEAN DEFAULT false,
  compress_file BOOLEAN DEFAULT false,
  encryption_password_hash VARCHAR(255),

  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX ON data_export_jobs(university_id);
CREATE INDEX ON data_export_jobs(status);
CREATE INDEX ON data_export_jobs(created_by);

-- ============================================
-- 10. DATA IMPORT JOBS
-- ============================================

CREATE TABLE IF NOT EXISTS data_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,

  -- Import Definition
  import_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  import_format VARCHAR(50) NOT NULL, -- csv, json, xml

  -- Import File
  source_file_path VARCHAR(500),
  source_file_size_bytes BIGINT,

  -- Import Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, validating, in_progress, completed, failed
  progress_percent INT DEFAULT 0,
  total_records INT,
  processed_records INT,
  successful_records INT,
  failed_records INT,

  -- Import Settings
  skip_on_error BOOLEAN DEFAULT false,
  create_new_records BOOLEAN DEFAULT true,
  update_existing_records BOOLEAN DEFAULT true,
  duplicate_handling VARCHAR(50) DEFAULT 'skip', -- skip, update, error

  -- Validation
  validation_errors JSONB[], -- array of validation errors

  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX ON data_import_jobs(university_id);
CREATE INDEX ON data_import_jobs(status);
CREATE INDEX ON data_import_jobs(created_by);

-- ============================================
-- 11. CONFIGURATION AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS configuration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID,

  -- Change Details
  change_type VARCHAR(50) NOT NULL, -- settings_updated, custom_field_created, permission_rule_modified, etc.
  entity_type VARCHAR(100), -- settings, custom_field, permission_rule, email_template, etc.
  entity_id UUID,
  entity_name VARCHAR(255),

  -- Change Content
  changes JSONB, -- {field_name: {old_value: ..., new_value: ...}, ...}

  -- Change Metadata
  ip_address INET,
  user_agent TEXT,

  -- Audit Info
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX ON configuration_audit_log(university_id);
CREATE INDEX ON configuration_audit_log(change_type);
CREATE INDEX ON configuration_audit_log(created_at);
CREATE INDEX ON configuration_audit_log(created_by);

-- ============================================
-- 12. ENCRYPTION KEY MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key Information
  key_name VARCHAR(255) UNIQUE NOT NULL,
  key_id VARCHAR(255) UNIQUE NOT NULL,
  key_version INT DEFAULT 1,

  -- Key Details
  algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
  key_material_hash VARCHAR(255), -- hash of the actual key material

  -- Key Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, compromised, rotated

  -- Key Rotation
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  rotation_schedule VARCHAR(50), -- monthly, quarterly, yearly
  next_rotation_at TIMESTAMP,

  -- Key Storage
  key_storage_location VARCHAR(100), -- environment, database, kms

  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON encryption_keys(status);
CREATE INDEX ON encryption_keys(key_id);

-- ============================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX ON admin_settings(created_at);
CREATE INDEX ON admin_settings(updated_at);
CREATE INDEX ON custom_fields(created_at);
CREATE INDEX ON custom_permission_rules(created_at);
CREATE INDEX ON email_templates(created_at);
CREATE INDEX ON backup_metadata(expires_at);
CREATE INDEX ON data_export_jobs(expires_at);

-- ============================================
-- 14. GRANTS FOR SECURITY
-- ============================================

-- Note: Adjust these based on your actual database users and roles
-- GRANT SELECT, INSERT, UPDATE, DELETE ON admin_settings TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON custom_fields TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON custom_permission_rules TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON email_templates TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_notification_preferences TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON backup_metadata TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON backup_schedules TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_retention_policies TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_export_jobs TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_import_jobs TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON configuration_audit_log TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON encryption_keys TO app_user;

-- ============================================
-- 15. INITIALIZATION DATA
-- ============================================

-- Insert default encryption key if not exists
INSERT INTO encryption_keys (key_name, key_id, algorithm, status)
VALUES ('default_aes_256_gcm', 'default_key_v1', 'AES-256-GCM', 'active')
ON CONFLICT (key_id) DO NOTHING;
