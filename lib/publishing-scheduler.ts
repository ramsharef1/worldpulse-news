import { query } from './db';

/**
 * Timezone-aware scheduling utilities
 */

export interface ScheduleConfig {
  timezone: string;
  embargo?: string; // ISO date string
  retraction?: string; // ISO date string
  recurrence?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number; // every N days/weeks/months
  byDay?: string[]; // for weekly: ['MO', 'WE', 'FR']
  byMonthDay?: number[]; // for monthly: [15]
  until?: string; // ISO date string
  count?: number; // number of occurrences
}

/**
 * Convert local time to UTC using timezone
 */
export function localToUTC(localTime: string, timezone: string): Date {
  try {
    // Create a date formatter using the timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse the input time
    const date = new Date(localTime);

    // Get the offset
    const parts = formatter.formatToParts(date);
    const partsObj: any = {};
    parts.forEach((part) => {
      partsObj[part.type] = part.value;
    });

    // Create UTC date from local time parts
    const utcDate = new Date(
      Date.UTC(
        parseInt(partsObj.year),
        parseInt(partsObj.month) - 1,
        parseInt(partsObj.day),
        parseInt(partsObj.hour),
        parseInt(partsObj.minute),
        parseInt(partsObj.second)
      )
    );

    // Calculate offset
    const localDate = new Date(
      parseInt(partsObj.year),
      parseInt(partsObj.month) - 1,
      parseInt(partsObj.day),
      parseInt(partsObj.hour),
      parseInt(partsObj.minute),
      parseInt(partsObj.second)
    );

    const offset = localDate.getTime() - utcDate.getTime();
    return new Date(date.getTime() - offset);
  } catch (error) {
    console.error('Error converting local to UTC:', error);
    // Fallback: treat as UTC
    return new Date(localTime);
  }
}

/**
 * Convert UTC to local time using timezone
 */
export function utcToLocal(utcTime: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(utcTime);
  } catch (error) {
    console.error('Error converting UTC to local:', error);
    return utcTime.toISOString();
  }
}

/**
 * Check if content is currently embargoed
 */
export function isEmbargoed(embargoDate?: string): boolean {
  if (!embargoDate) return false;
  return new Date(embargoDate) > new Date();
}

/**
 * Check if content should be retracted
 */
export function shouldBeRetracted(retractionDate?: string): boolean {
  if (!retractionDate) return false;
  return new Date(retractionDate) <= new Date();
}

/**
 * Calculate next occurrence from recurrence rule
 */
export function calculateNextOccurrence(
  baseDate: Date,
  rule: RecurrenceRule,
  occurrenceCount: number = 0
): Date | null {
  const date = new Date(baseDate);

  try {
    switch (rule.frequency) {
      case 'DAILY':
        const dayInterval = rule.interval || 1;
        date.setDate(date.getDate() + dayInterval);
        break;

      case 'WEEKLY':
        const weekInterval = rule.interval || 1;
        date.setDate(date.getDate() + 7 * weekInterval);

        // If specific days are set, align to the first matching day
        if (rule.byDay && rule.byDay.length > 0) {
          const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const currentDay = dayNames[date.getDay()];

          // Find the next matching day
          for (let i = 0; i < 7; i++) {
            if (rule.byDay.includes(dayNames[date.getDay()])) {
              break;
            }
            date.setDate(date.getDate() + 1);
          }
        }
        break;

      case 'MONTHLY':
        const monthInterval = rule.interval || 1;
        date.setMonth(date.getMonth() + monthInterval);

        if (rule.byMonthDay && rule.byMonthDay.length > 0) {
          date.setDate(rule.byMonthDay[0]);
        }
        break;

      case 'YEARLY':
        const yearInterval = rule.interval || 1;
        date.setFullYear(date.getFullYear() + yearInterval);
        break;
    }

    // Check until and count limits
    if (rule.until && date > new Date(rule.until)) {
      return null;
    }

    if (rule.count && occurrenceCount >= rule.count) {
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error calculating next occurrence:', error);
    return null;
  }
}

/**
 * Create a recurring publishing schedule
 */
export async function createRecurringSchedule(
  articleId: string,
  universityId: string,
  baseScheduledTime: Date,
  config: ScheduleConfig,
  createdBy: string
) {
  try {
    if (!config.recurrence) {
      throw new Error('Recurrence configuration is required');
    }

    const jobId = `recurring-${articleId}-${Date.now()}`;
    const nextRun = calculateNextOccurrence(baseScheduledTime, config.recurrence);

    if (!nextRun) {
      throw new Error('Unable to calculate next occurrence');
    }

    const result = await query(
      `INSERT INTO scheduled_jobs
       (job_id, article_id, university_id, job_type, timezone, next_run,
        cron_expression, is_active, created_by, config)
       VALUES ($1, $2, $3, 'recurring_publish', $4, $5, $6, true, $7, $8)
       RETURNING *`,
      [
        jobId,
        articleId,
        universityId,
        config.timezone || 'UTC',
        nextRun,
        JSON.stringify(config.recurrence),
        createdBy,
        JSON.stringify(config),
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating recurring schedule:', error);
    throw error;
  }
}

/**
 * Get next scheduled jobs to process
 */
export async function getNextScheduledJobs(limit: number = 10) {
  try {
    const result = await query(
      `SELECT * FROM scheduled_jobs
       WHERE is_active = true
       AND next_run <= NOW()
       ORDER BY next_run ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting next scheduled jobs:', error);
    throw error;
  }
}

/**
 * Update scheduled job's next run time
 */
export async function updateNextRun(jobId: string, nextRun: Date) {
  try {
    const result = await query(
      `UPDATE scheduled_jobs
       SET next_run = $1, last_run = NOW(), updated_at = NOW()
       WHERE job_id = $2
       RETURNING *`,
      [nextRun, jobId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating next run:', error);
    throw error;
  }
}

/**
 * Disable recurring schedule
 */
export async function disableRecurringSchedule(jobId: string) {
  try {
    const result = await query(
      `UPDATE scheduled_jobs
       SET is_active = false, updated_at = NOW()
       WHERE job_id = $1
       RETURNING *`,
      [jobId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error disabling recurring schedule:', error);
    throw error;
  }
}

/**
 * Get embargo status for multiple articles
 */
export async function getEmbargoesByUniversity(universityId: string) {
  try {
    const result = await query(
      `SELECT article_id, embargo_date, retraction_date
       FROM publishing_queue
       WHERE university_id = $1
       AND (embargo_date IS NOT NULL OR retraction_date IS NOT NULL)
       ORDER BY embargo_date ASC`,
      [universityId]
    );

    return result.rows.map((row) => ({
      articleId: row.article_id,
      embargoed: isEmbargoed(row.embargo_date),
      embargoDate: row.embargo_date,
      retractionDate: row.retraction_date,
      shouldRetract: shouldBeRetracted(row.retraction_date),
    }));
  } catch (error) {
    console.error('Error getting embargoes:', error);
    throw error;
  }
}

/**
 * Release embargoed content
 */
export async function releaseEmbargo(articleId: string) {
  try {
    const client = await require('./db').getClient();

    try {
      await client.query('BEGIN');

      // Update embargo date to past
      await client.query(
        `UPDATE publishing_queue
         SET embargo_date = NULL, updated_at = NOW()
         WHERE article_id = $1`,
        [articleId]
      );

      // Add to history
      await client.query(
        `INSERT INTO publishing_history
         (article_id, action, action_type, user_id)
         SELECT $1, 'embargo_released', 'system', 'system'`,
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
    console.error('Error releasing embargo:', error);
    throw error;
  }
}
