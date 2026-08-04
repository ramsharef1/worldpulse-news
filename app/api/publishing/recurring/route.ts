import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import {
  createRecurringSchedule,
  getNextScheduledJobs,
  updateNextRun,
  disableRecurringSchedule,
  calculateNextOccurrence,
  type RecurrenceRule,
} from '@/lib/publishing-scheduler';
import { addToPublishingQueue } from '@/lib/publishing-queue';
import { query } from '@/lib/db';

/**
 * POST /api/publishing/recurring
 * Create a recurring publishing schedule
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const {
      articleId,
      baseScheduledTime,
      timezone = 'UTC',
      recurrence, // { frequency: 'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY', interval?, byDay?, byMonthDay?, until?, count? }
      embargoDate,
      retractionDate,
    } = body;

    if (!articleId || !baseScheduledTime || !recurrence) {
      return NextResponse.json(
        { error: 'Article ID, base scheduled time, and recurrence are required' },
        { status: 400 }
      );
    }

    const baseDate = new Date(baseScheduledTime);

    // Validate recurrence
    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(recurrence.frequency)) {
      return NextResponse.json({ error: 'Invalid recurrence frequency' }, { status: 400 });
    }

    // Create the recurring schedule
    const scheduledJob = await createRecurringSchedule(
      articleId,
      auth.user.universityId,
      baseDate,
      {
        timezone,
        embargo: embargoDate,
        retraction: retractionDate,
        recurrence,
      },
      auth.user.userId
    );

    // Add initial schedule
    const nextRun = scheduledJob.next_run;
    if (nextRun) {
      await addToPublishingQueue({
        article_id: articleId,
        university_id: auth.user.universityId,
        status: 'scheduled',
        scheduled_time: new Date(nextRun).toISOString(),
        timezone,
        embargo_date: embargoDate,
        retraction_date: retractionDate,
        priority: 0,
        created_by: auth.user.userId,
      });
    }

    return NextResponse.json(
      {
        success: true,
        job: scheduledJob,
        message: 'Recurring schedule created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recurring schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring schedule', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publishing/recurring
 * Get all recurring schedules for a university
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let whereClause = 'university_id = $1';
    const params: any[] = [auth.user.universityId];

    if (activeOnly) {
      whereClause += ' AND is_active = true';
    }

    const result = await query(
      `SELECT *,
              EXTRACT(EPOCH FROM (next_run - NOW()))::INTEGER as seconds_until_next_run
       FROM scheduled_jobs
       WHERE ${whereClause}
       ORDER BY next_run ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM scheduled_jobs WHERE ${whereClause}`,
      params
    );

    return NextResponse.json({
      success: true,
      jobs: result.rows,
      pagination: {
        limit,
        offset,
        total: totalResult.rows[0].total,
      },
    });
  } catch (error) {
    console.error('Error fetching recurring schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring schedules' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/publishing/recurring
 * Update recurring schedule configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { jobId, recurrence, timezone, isActive } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (recurrence) {
      updates.push(`cron_expression = $${values.length + 1}`);
      values.push(JSON.stringify(recurrence));
    }

    if (timezone) {
      updates.push(`timezone = $${values.length + 1}`);
      values.push(timezone);
    }

    if (typeof isActive === 'boolean') {
      updates.push(`is_active = $${values.length + 1}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(jobId);

    const result = await query(
      `UPDATE scheduled_jobs
       SET ${updates.join(', ')}
       WHERE job_id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Recurring schedule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating recurring schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publishing/recurring
 * Disable a recurring schedule
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const result = await disableRecurringSchedule(jobId);

    if (!result) {
      return NextResponse.json({ error: 'Recurring schedule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring schedule disabled',
      job: result,
    });
  } catch (error) {
    console.error('Error disabling recurring schedule:', error);
    return NextResponse.json(
      { error: 'Failed to disable recurring schedule' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publishing/recurring/process
 * Process next scheduled recurring jobs (run periodically)
 */
export async function POST_PROCESS(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    // Get next jobs to process
    const jobs = await getNextScheduledJobs(10);

    const results = {
      total: jobs.length,
      processed: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const job of jobs) {
      try {
        // Create a new publishing queue entry for this occurrence
        await addToPublishingQueue({
          article_id: job.article_id,
          university_id: job.university_id,
          status: 'scheduled',
          scheduled_time: new Date(job.next_run).toISOString(),
          timezone: job.timezone,
          created_by: 'system',
          priority: 0,
        });

        // Calculate next occurrence
        const recurrence = JSON.parse(job.cron_expression) as RecurrenceRule;
        const nextRun = calculateNextOccurrence(
          new Date(job.next_run),
          recurrence,
          1
        );

        if (nextRun) {
          // Update next run time
          await updateNextRun(job.job_id, nextRun);
        } else {
          // No more occurrences, disable the job
          await disableRecurringSchedule(job.job_id);
        }

        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          jobId: job.job_id,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error processing recurring jobs:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring jobs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publishing/recurring/preview
 * Preview upcoming occurrences of a recurring schedule
 */
export async function GET_PREVIEW(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const occurrences = parseInt(searchParams.get('occurrences') || '5');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get the job
    const result = await query(
      `SELECT * FROM scheduled_jobs WHERE job_id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = result.rows[0];
    const recurrence = JSON.parse(job.cron_expression) as RecurrenceRule;

    // Calculate next occurrences
    const upcomingOccurrences = [];
    let currentDate = new Date(job.next_run);

    for (let i = 0; i < occurrences; i++) {
      upcomingOccurrences.push({
        occurrence: i + 1,
        date: currentDate.toISOString(),
      });

      const nextDate = calculateNextOccurrence(currentDate, recurrence, i + 1);
      if (!nextDate) break;
      currentDate = nextDate;
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.job_id,
        frequency: recurrence.frequency,
        timezone: job.timezone,
      },
      upcomingOccurrences,
    });
  } catch (error) {
    console.error('Error previewing recurring schedule:', error);
    return NextResponse.json(
      { error: 'Failed to preview recurring schedule' },
      { status: 500 }
    );
  }
}
