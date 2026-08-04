import { query } from './db';

/**
 * Initialize publishing-related tables
 * This creates the complete schema for publishing features
 */
export async function initializePublishingSchema() {
  try {
    // Publishing Queue Table - Holds content scheduled for publishing
    await query(`
      CREATE TABLE IF NOT EXISTS publishing_queue (
        id SERIAL PRIMARY KEY,
        article_id VARCHAR(255) NOT NULL,
        university_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        scheduled_time TIMESTAMP NOT NULL,
        publish_time TIMESTAMP,
        timezone VARCHAR(50) DEFAULT 'UTC',
        embargo_date TIMESTAMP,
        retraction_date TIMESTAMP,
        priority INTEGER DEFAULT 0,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        UNIQUE(article_id)
      );
      CREATE INDEX IF NOT EXISTS idx_publishing_queue_status ON publishing_queue(status);
      CREATE INDEX IF NOT EXISTS idx_publishing_queue_scheduled_time ON publishing_queue(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_publishing_queue_university ON publishing_queue(university_id);
    `);

    // Publishing History Table - Audit trail for all publishing actions
    await query(`
      CREATE TABLE IF NOT EXISTS publishing_history (
        id SERIAL PRIMARY KEY,
        article_id VARCHAR(255) NOT NULL,
        university_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        action_type VARCHAR(50),
        publish_time TIMESTAMP,
        retracted_time TIMESTAMP,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES publishing_queue(article_id)
      );
      CREATE INDEX IF NOT EXISTS idx_publishing_history_article ON publishing_history(article_id);
      CREATE INDEX IF NOT EXISTS idx_publishing_history_created_at ON publishing_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_publishing_history_university ON publishing_history(university_id);
    `);

    // Scheduled Jobs Table - For recurring content scheduling
    await query(`
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) NOT NULL UNIQUE,
        article_id VARCHAR(255),
        university_id VARCHAR(255) NOT NULL,
        job_type VARCHAR(50) NOT NULL,
        cron_expression VARCHAR(255),
        timezone VARCHAR(50) DEFAULT 'UTC',
        next_run TIMESTAMP,
        last_run TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255) NOT NULL,
        config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type ON scheduled_jobs(job_type);
      CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(is_active);
      CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run);
    `);

    // Publishing Settings Table - Per-university publishing configurations
    await query(`
      CREATE TABLE IF NOT EXISTS publishing_settings (
        id SERIAL PRIMARY KEY,
        university_id VARCHAR(255) NOT NULL UNIQUE,
        auto_publish_enabled BOOLEAN DEFAULT false,
        default_timezone VARCHAR(50) DEFAULT 'UTC',
        embargo_by_default BOOLEAN DEFAULT false,
        require_approval BOOLEAN DEFAULT false,
        notification_emails TEXT[],
        retry_on_failure BOOLEAN DEFAULT true,
        max_retries INTEGER DEFAULT 3,
        retry_interval_minutes INTEGER DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id)
      );
      CREATE INDEX IF NOT EXISTS idx_publishing_settings_university ON publishing_settings(university_id);
    `);

    // Publishing Notifications Table - Tracks notification sending
    await query(`
      CREATE TABLE IF NOT EXISTS publishing_notifications (
        id SERIAL PRIMARY KEY,
        article_id VARCHAR(255) NOT NULL,
        university_id VARCHAR(255) NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES publishing_queue(article_id)
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_article ON publishing_notifications(article_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON publishing_notifications(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON publishing_notifications(created_at);
    `);

    // Calendar Events Table - For visual calendar display
    await query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        article_id VARCHAR(255) NOT NULL,
        university_id VARCHAR(255) NOT NULL,
        event_date TIMESTAMP NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        title VARCHAR(500),
        description TEXT,
        color VARCHAR(7),
        is_all_day BOOLEAN DEFAULT false,
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES publishing_queue(article_id)
      );
      CREATE INDEX IF NOT EXISTS idx_calendar_events_university ON calendar_events(university_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
    `);

    console.log('Publishing schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing publishing schema:', error);
    throw error;
  }
}

export const PUBLISHING_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  QUEUED: 'queued',
  PUBLISHING: 'publishing',
  PUBLISHED: 'published',
  FAILED: 'failed',
  RETRACTED: 'retracted',
  CANCELLED: 'cancelled',
};

export const NOTIFICATION_TYPES = {
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  FAILED: 'failed',
  RETRACTED: 'retracted',
  EMBARGO_RELEASED: 'embargo_released',
};
