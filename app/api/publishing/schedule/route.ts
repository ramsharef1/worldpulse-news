import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { addToPublishingQueue } from '@/lib/publishing-queue';
import { localToUTC } from '@/lib/publishing-scheduler';
import { sendPublishingNotification, createNotificationMessage } from '@/lib/publishing-notifications';
import { query } from '@/lib/db';

/**
 * POST /api/publishing/schedule
 * Schedule content for future publishing
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
      scheduledTime, // ISO string or local time
      timezone = 'UTC',
      embargoDate,
      retractionDate,
      priority = 0,
    } = body;

    if (!articleId || !scheduledTime) {
      return NextResponse.json(
        { error: 'Article ID and scheduled time are required' },
        { status: 400 }
      );
    }

    // Convert local time to UTC if timezone is provided
    const utcTime = timezone !== 'UTC' ? localToUTC(scheduledTime, timezone) : new Date(scheduledTime);

    if (utcTime < new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Add to queue
    const job = await addToPublishingQueue({
      article_id: articleId,
      university_id: auth.user.universityId,
      status: 'scheduled',
      scheduled_time: utcTime.toISOString(),
      timezone,
      embargo_date: embargoDate,
      retraction_date: retractionDate,
      priority,
      created_by: auth.user.userId,
    });

    // Add to calendar
    await query(
      `INSERT INTO calendar_events
       (article_id, university_id, event_date, event_type, timezone, created_by)
       VALUES ($1, $2, $3, 'scheduled_publish', $4, $5)`,
      [articleId, auth.user.universityId, utcTime, timezone, auth.user.userId]
    );

    // Send notification
    try {
      const publishingSettings = await query(
        `SELECT notification_emails FROM publishing_settings WHERE university_id = $1`,
        [auth.user.universityId]
      );

      const emails = publishingSettings.rows[0]?.notification_emails || [auth.user.email];

      if (emails && emails.length > 0) {
        const notifMsg = createNotificationMessage('scheduled', {
          articleTitle: articleId,
          scheduledTime: utcTime.toISOString(),
        });

        for (const email of emails) {
          await sendPublishingNotification({
            articleId,
            universityId: auth.user.universityId,
            notificationType: 'scheduled',
            recipientEmail: email,
            subject: notifMsg.subject,
            message: notifMsg.message,
          }).catch((err) => console.error('Notification error:', err));
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail scheduling if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        job,
        message: `Content scheduled for ${utcTime.toISOString()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error scheduling content:', error);
    return NextResponse.json(
      { error: 'Failed to schedule content', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publishing/schedule
 * Get scheduled content for a university
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

    const result = await query(
      `SELECT
        article_id,
        scheduled_time,
        timezone,
        embargo_date,
        retraction_date,
        priority,
        status,
        EXTRACT(EPOCH FROM (scheduled_time - NOW()))::INTEGER as seconds_until_publish,
        created_by,
        created_at
      FROM publishing_queue
      WHERE university_id = $1 AND status IN ('scheduled', 'queued')
      ORDER BY scheduled_time ASC
      LIMIT $2 OFFSET $3`,
      [auth.user.universityId, limit, offset]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM publishing_queue
       WHERE university_id = $1 AND status IN ('scheduled', 'queued')`,
      [auth.user.universityId]
    );

    return NextResponse.json({
      success: true,
      scheduled: result.rows,
      pagination: {
        limit,
        offset,
        total: totalResult.rows[0].total,
      },
    });
  } catch (error) {
    console.error('Error fetching scheduled content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled content' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/publishing/schedule
 * Update scheduled publishing time
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { articleId, scheduledTime, timezone = 'UTC' } = body;

    if (!articleId || !scheduledTime) {
      return NextResponse.json(
        { error: 'Article ID and scheduled time are required' },
        { status: 400 }
      );
    }

    const utcTime = timezone !== 'UTC' ? localToUTC(scheduledTime, timezone) : new Date(scheduledTime);

    if (utcTime < new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE publishing_queue
       SET scheduled_time = $1, timezone = $2, updated_at = NOW()
       WHERE article_id = $3 AND university_id = $4 AND status IN ('scheduled', 'queued')
       RETURNING *`,
      [utcTime, timezone, articleId, auth.user.universityId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Scheduled item not found' }, { status: 404 });
    }

    // Update calendar event
    await query(
      `UPDATE calendar_events
       SET event_date = $1, updated_at = NOW()
       WHERE article_id = $2 AND event_type = 'scheduled_publish'`,
      [utcTime, articleId]
    );

    return NextResponse.json({
      success: true,
      job: result.rows[0],
      message: `Scheduled time updated to ${utcTime.toISOString()}`,
    });
  } catch (error) {
    console.error('Error updating scheduled time:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled time' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publishing/schedule
 * Cancel scheduled publishing
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE publishing_queue
       SET status = 'cancelled', updated_at = NOW()
       WHERE article_id = $1 AND university_id = $2 AND status IN ('scheduled', 'queued')
       RETURNING *`,
      [articleId, auth.user.universityId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Scheduled item not found' }, { status: 404 });
    }

    // Delete calendar event
    await query(
      `DELETE FROM calendar_events WHERE article_id = $1 AND event_type = 'scheduled_publish'`,
      [articleId]
    );

    return NextResponse.json({
      success: true,
      message: 'Scheduled publishing cancelled',
    });
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    return NextResponse.json(
      { error: 'Failed to cancel schedule' },
      { status: 500 }
    );
  }
}
