import { query } from './db';

/**
 * Simple job queue implementation for publishing tasks
 * Replaces BullMQ with database-backed queue for simplicity
 */

export interface PublishingJob {
  id?: number;
  article_id: string;
  university_id: string;
  status: string;
  scheduled_time: string;
  timezone: string;
  embargo_date?: string;
  retraction_date?: string;
  priority: number;
  created_by: string;
  retry_count?: number;
  last_error?: string;
}

export interface QueueStats {
  total: number;
  scheduled: number;
  queued: number;
  publishing: number;
  published: number;
  failed: number;
  retracted: number;
}

/**
 * Add a publishing job to the queue
 */
export async function addToPublishingQueue(job: PublishingJob) {
  try {
    const result = await query(
      `INSERT INTO publishing_queue
       (article_id, university_id, status, scheduled_time, timezone,
        embargo_date, retraction_date, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        job.article_id,
        job.university_id,
        job.status || 'scheduled',
        job.scheduled_time,
        job.timezone || 'UTC',
        job.embargo_date,
        job.retraction_date,
        job.priority || 0,
        job.created_by,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error adding to publishing queue:', error);
    throw error;
  }
}

/**
 * Get queue status grouped by status type
 */
export async function getQueueStats(universityId: string): Promise<QueueStats> {
  try {
    const result = await query(
      `SELECT status, COUNT(*) as count FROM publishing_queue
       WHERE university_id = $1
       GROUP BY status`,
      [universityId]
    );

    const stats: QueueStats = {
      total: 0,
      scheduled: 0,
      queued: 0,
      publishing: 0,
      published: 0,
      failed: 0,
      retracted: 0,
    };

    result.rows.forEach((row) => {
      stats.total += row.count;
      if (row.status === 'scheduled') stats.scheduled += row.count;
      if (row.status === 'queued') stats.queued += row.count;
      if (row.status === 'publishing') stats.publishing += row.count;
      if (row.status === 'published') stats.published += row.count;
      if (row.status === 'failed') stats.failed += row.count;
      if (row.status === 'retracted') stats.retracted += row.count;
    });

    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
}

/**
 * Get jobs ready for publishing (past scheduled time, not embargoed)
 */
export async function getReadyJobs(limit: number = 10) {
  try {
    const result = await query(
      `SELECT * FROM publishing_queue
       WHERE status = 'scheduled'
       AND scheduled_time <= NOW()
       AND (embargo_date IS NULL OR embargo_date <= NOW())
       AND (retraction_date IS NULL OR retraction_date > NOW())
       ORDER BY priority DESC, scheduled_time ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting ready jobs:', error);
    throw error;
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(articleId: string, status: string, error?: string) {
  try {
    const result = await query(
      `UPDATE publishing_queue
       SET status = $1,
           updated_at = NOW(),
           last_error = $3,
           retry_count = CASE WHEN $1 = 'failed' THEN retry_count + 1 ELSE retry_count END
       WHERE article_id = $2
       RETURNING *`,
      [status, articleId, error || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}

/**
 * Process a publishing job
 */
export async function publishJob(articleId: string, userId: string) {
  try {
    const client = await require('./db').getClient();

    try {
      await client.query('BEGIN');

      // Get the job
      const jobResult = await client.query(
        'SELECT * FROM publishing_queue WHERE article_id = $1 FOR UPDATE',
        [articleId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error('Job not found');
      }

      const job = jobResult.rows[0];

      // Check embargo
      if (job.embargo_date && new Date(job.embargo_date) > new Date()) {
        throw new Error('Content is still under embargo');
      }

      // Update status to publishing
      await client.query(
        `UPDATE publishing_queue SET status = 'publishing', publish_time = NOW()
         WHERE article_id = $1`,
        [articleId]
      );

      // Update article published status
      await client.query(
        `UPDATE articles SET published = true, published_at = NOW()
         WHERE id = $1`,
        [articleId]
      );

      // Add to history
      await client.query(
        `INSERT INTO publishing_history
         (article_id, university_id, action, action_type, publish_time, user_id, user_name)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
        [articleId, job.university_id, 'publish', 'auto', userId, 'System']
      );

      // Update status to published
      await client.query(
        `UPDATE publishing_queue SET status = 'published', updated_at = NOW()
         WHERE article_id = $1`,
        [articleId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error publishing job:', error);
    await updateJobStatus(articleId, 'failed', String(error));
    throw error;
  }
}

/**
 * Cancel a scheduled job
 */
export async function cancelJob(articleId: string, reason?: string) {
  try {
    const result = await query(
      `UPDATE publishing_queue
       SET status = 'cancelled', updated_at = NOW(), last_error = $2
       WHERE article_id = $1 AND status IN ('scheduled', 'queued')
       RETURNING *`,
      [articleId, reason || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error cancelling job:', error);
    throw error;
  }
}

/**
 * Retry failed job
 */
export async function retryFailedJob(articleId: string) {
  try {
    const result = await query(
      `UPDATE publishing_queue
       SET status = 'queued', updated_at = NOW(), last_error = NULL
       WHERE article_id = $1 AND status = 'failed' AND retry_count < 5
       RETURNING *`,
      [articleId]
    );

    if (result.rows.length === 0) {
      throw new Error('Job not found or max retries exceeded');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error retrying job:', error);
    throw error;
  }
}

/**
 * Get queued items for publishing
 */
export async function getQueuedItems(
  universityId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const result = await query(
      `SELECT pq.*,
              COALESCE(
                EXTRACT(EPOCH FROM (pq.scheduled_time - NOW()))::INTEGER,
                0
              ) as seconds_until_publish
       FROM publishing_queue pq
       WHERE pq.university_id = $1
       ORDER BY pq.priority DESC, pq.scheduled_time ASC
       LIMIT $2 OFFSET $3`,
      [universityId, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting queued items:', error);
    throw error;
  }
}

/**
 * Remove from queue (delete job)
 */
export async function removeFromQueue(articleId: string) {
  try {
    const result = await query(
      `DELETE FROM publishing_queue WHERE article_id = $1 RETURNING *`,
      [articleId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error removing from queue:', error);
    throw error;
  }
}
