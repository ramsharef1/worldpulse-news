/**
 * Publishing & Scheduling System Initialization
 * Run this once to set up all required tables and indexes
 */

import { initializePublishingSchema } from './publishing-schema';

export async function initializePublishingSystem() {
  console.log('Initializing Publishing & Scheduling System...');

  try {
    // Initialize database schema
    await initializePublishingSchema();

    console.log('✓ Publishing schema initialized');
    console.log('\nPublishing System Ready!');
    console.log('\nAvailable API Endpoints:');
    console.log('  POST   /api/publishing/schedule       - Schedule content for future publishing');
    console.log('  GET    /api/publishing/schedule       - Get scheduled content');
    console.log('  PUT    /api/publishing/schedule       - Update scheduled time');
    console.log('  DELETE /api/publishing/schedule       - Cancel scheduled publishing');
    console.log('');
    console.log('  POST   /api/publishing/publish        - Immediately publish content');
    console.log('  GET    /api/publishing/publish        - Get publish status');
    console.log('');
    console.log('  GET    /api/publishing/queue          - Get publishing queue');
    console.log('  PATCH  /api/publishing/queue          - Update queue item (cancel, retry, etc)');
    console.log('  DELETE /api/publishing/queue          - Remove from queue');
    console.log('');
    console.log('  GET    /api/publishing/calendar       - Get calendar events');
    console.log('  POST   /api/publishing/calendar       - Create calendar event');
    console.log('  PUT    /api/publishing/calendar       - Update calendar event');
    console.log('  DELETE /api/publishing/calendar       - Delete calendar event');
    console.log('');
    console.log('  GET    /api/publishing/history        - Get publishing history');
    console.log('  POST   /api/publishing/history/revert - Revert/retract published content');
    console.log('  DELETE /api/publishing/history        - Delete old history entries');
    console.log('');
    console.log('  POST   /api/publishing/bulk           - Perform bulk operations');
    console.log('  GET    /api/publishing/bulk/preview   - Preview bulk operation');
    console.log('');
    console.log('  POST   /api/publishing/recurring      - Create recurring schedule');
    console.log('  GET    /api/publishing/recurring      - Get recurring schedules');
    console.log('  PUT    /api/publishing/recurring      - Update recurring schedule');
    console.log('  DELETE /api/publishing/recurring      - Disable recurring schedule');
    console.log('  POST   /api/publishing/recurring/process - Process next scheduled jobs');
    console.log('  GET    /api/publishing/recurring/preview - Preview upcoming occurrences');
    console.log('');
    console.log('Features Enabled:');
    console.log('  ✓ Content Calendar (visual scheduling)');
    console.log('  ✓ Scheduled Publishing (auto-publish at time)');
    console.log('  ✓ Embargo Dates & Release Scheduling');
    console.log('  ✓ Publishing Queue Management');
    console.log('  ✓ One-Click Publish');
    console.log('  ✓ Bulk Publishing');
    console.log('  ✓ Recurring Content Scheduling');
    console.log('  ✓ Publishing History');
    console.log('  ✓ Publish Notifications');
    console.log('  ✓ Revert Published Content');

    return true;
  } catch (error) {
    console.error('Failed to initialize publishing system:', error);
    throw error;
  }
}

/**
 * Configure publishing settings for a university
 */
export async function configurePublishingSettings(
  universityId: string,
  config: {
    autoPublishEnabled?: boolean;
    defaultTimezone?: string;
    embargoByDefault?: boolean;
    requireApproval?: boolean;
    notificationEmails?: string[];
    retryOnFailure?: boolean;
    maxRetries?: number;
    retryIntervalMinutes?: number;
  }
) {
  const { query } = await import('./db');

  try {
    // Check if settings exist
    const existing = await query(
      'SELECT id FROM publishing_settings WHERE university_id = $1',
      [universityId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      return await query(
        `UPDATE publishing_settings
         SET auto_publish_enabled = COALESCE($2, auto_publish_enabled),
             default_timezone = COALESCE($3, default_timezone),
             embargo_by_default = COALESCE($4, embargo_by_default),
             require_approval = COALESCE($5, require_approval),
             notification_emails = COALESCE($6, notification_emails),
             retry_on_failure = COALESCE($7, retry_on_failure),
             max_retries = COALESCE($8, max_retries),
             retry_interval_minutes = COALESCE($9, retry_interval_minutes),
             updated_at = NOW()
         WHERE university_id = $1
         RETURNING *`,
        [
          universityId,
          config.autoPublishEnabled,
          config.defaultTimezone,
          config.embargoByDefault,
          config.requireApproval,
          config.notificationEmails,
          config.retryOnFailure,
          config.maxRetries,
          config.retryIntervalMinutes,
        ]
      );
    } else {
      // Insert new
      return await query(
        `INSERT INTO publishing_settings
         (university_id, auto_publish_enabled, default_timezone, embargo_by_default,
          require_approval, notification_emails, retry_on_failure, max_retries, retry_interval_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          universityId,
          config.autoPublishEnabled ?? false,
          config.defaultTimezone ?? 'UTC',
          config.embargoByDefault ?? false,
          config.requireApproval ?? false,
          config.notificationEmails ?? [],
          config.retryOnFailure ?? true,
          config.maxRetries ?? 3,
          config.retryIntervalMinutes ?? 5,
        ]
      );
    }
  } catch (error) {
    console.error('Error configuring publishing settings:', error);
    throw error;
  }
}

/**
 * Get a background job processing function for periodic execution
 * This should be called periodically (e.g., every minute) by a cron job or scheduler
 */
export async function processPublishingQueue() {
  const { getReadyJobs, publishJob } = await import('./publishing-queue');
  const { getNextScheduledJobs, updateNextRun, calculateNextOccurrence } = await import('./publishing-scheduler');

  try {
    // Process ready jobs
    const readyJobs = await getReadyJobs(10);

    for (const job of readyJobs) {
      try {
        await publishJob(job.article_id, 'system');
        console.log(`✓ Published job: ${job.article_id}`);
      } catch (error) {
        console.error(`✗ Failed to publish ${job.article_id}:`, error);
      }
    }

    // Process recurring jobs
    const nextJobs = await getNextScheduledJobs(5);

    for (const job of nextJobs) {
      try {
        // Create new publishing queue entry
        const { addToPublishingQueue } = await import('./publishing-queue');
        await addToPublishingQueue({
          article_id: job.article_id,
          university_id: job.university_id,
          status: 'scheduled',
          scheduled_time: new Date(job.next_run).toISOString(),
          timezone: job.timezone,
          created_by: 'system',
          priority: 0,
        });

        // Calculate next run
        const recurrence = JSON.parse(job.cron_expression);
        const nextRun = calculateNextOccurrence(new Date(job.next_run), recurrence, 1);

        if (nextRun) {
          await updateNextRun(job.job_id, nextRun);
        } else {
          // Disable if no more occurrences
          const { disableRecurringSchedule } = await import('./publishing-scheduler');
          await disableRecurringSchedule(job.job_id);
        }

        console.log(`✓ Processed recurring job: ${job.job_id}`);
      } catch (error) {
        console.error(`✗ Failed to process recurring job ${job.job_id}:`, error);
      }
    }

    // Process embargo releases
    const { query } = await import('./db');
    const embargoReleases = await query(
      `SELECT article_id, university_id FROM publishing_queue
       WHERE embargo_date IS NOT NULL AND embargo_date <= NOW()
       AND status != 'published'
       LIMIT 10`
    );

    for (const item of embargoReleases.rows) {
      try {
        await query(
          `UPDATE publishing_queue SET embargo_date = NULL WHERE article_id = $1`,
          [item.article_id]
        );

        // Send embargo released notification
        const { sendPublishingNotification, createNotificationMessage } = await import('./publishing-notifications');
        const notifMsg = createNotificationMessage('embargo_released', {
          articleTitle: item.article_id,
        });

        await sendPublishingNotification({
          articleId: item.article_id,
          universityId: item.university_id,
          notificationType: 'embargo_released',
          recipientEmail: 'admin@example.com',
          subject: notifMsg.subject,
          message: notifMsg.message,
        }).catch(() => {});

        console.log(`✓ Released embargo: ${item.article_id}`);
      } catch (error) {
        console.error(`✗ Failed to release embargo ${item.article_id}:`, error);
      }
    }

    // Process retraction deadlines
    const retractions = await query(
      `SELECT article_id, university_id FROM publishing_queue
       WHERE retraction_date IS NOT NULL AND retraction_date <= NOW()
       AND status = 'published'
       LIMIT 10`
    );

    for (const item of retractions.rows) {
      try {
        const { publishJob } = await import('./publishing-queue');

        await query(
          `UPDATE articles SET published = false WHERE id = $1`,
          [item.article_id]
        );

        await query(
          `UPDATE publishing_queue SET status = 'retracted' WHERE article_id = $1`,
          [item.article_id]
        );

        await query(
          `INSERT INTO publishing_history
           (article_id, university_id, action, action_type, retracted_time, user_id)
           VALUES ($1, $2, 'retract', 'auto', NOW(), 'system')`,
          [item.article_id, item.university_id]
        );

        console.log(`✓ Auto-retracted: ${item.article_id}`);
      } catch (error) {
        console.error(`✗ Failed to retract ${item.article_id}:`, error);
      }
    }

    return {
      success: true,
      processed: {
        published: readyJobs.length,
        recurringProcessed: nextJobs.length,
        embargoReleased: embargoReleases.rows.length,
        autoRetracted: retractions.rows.length,
      },
    };
  } catch (error) {
    console.error('Error processing publishing queue:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
