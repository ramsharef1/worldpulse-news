import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { addToPublishingQueue, updateJobStatus } from '@/lib/publishing-queue';
import { localToUTC } from '@/lib/publishing-scheduler';
import { sendBulkNotifications, createNotificationMessage } from '@/lib/publishing-notifications';
import { query } from '@/lib/db';

/**
 * POST /api/publishing/bulk
 * Perform bulk publishing operations
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const {
      operation, // 'schedule', 'publish', 'retract', 'cancel'
      articleIds,
      scheduledTime,
      timezone = 'UTC',
      embargoDate,
      retractionDate,
      priority = 0,
      reason,
    } = body;

    if (!operation || !articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: 'Operation, articleIds array are required' },
        { status: 400 }
      );
    }

    const results = {
      operation,
      total: articleIds.length,
      succeeded: 0,
      failed: 0,
      errors: [] as any[],
      items: [] as any[],
    };

    const client = await require('@/lib/db').getClient();

    for (const articleId of articleIds) {
      try {
        await client.query('BEGIN');

        switch (operation) {
          case 'schedule':
            if (!scheduledTime) {
              throw new Error('Scheduled time is required for schedule operation');
            }

            const utcTime = timezone !== 'UTC' ? localToUTC(scheduledTime, timezone) : new Date(scheduledTime);

            if (utcTime < new Date()) {
              throw new Error('Scheduled time must be in the future');
            }

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

            await client.query(
              `INSERT INTO calendar_events
               (article_id, university_id, event_date, event_type, timezone, created_by)
               VALUES ($1, $2, $3, 'scheduled_publish', $4, $5)`,
              [articleId, auth.user.universityId, utcTime, timezone, auth.user.userId]
            );

            results.items.push({ articleId, scheduledTime: utcTime });
            break;

          case 'publish':
            const queueResult = await client.query(
              `SELECT * FROM publishing_queue WHERE article_id = $1 FOR UPDATE`,
              [articleId]
            );

            if (queueResult.rows.length === 0) {
              throw new Error('Article not found in queue');
            }

            const queueItem = queueResult.rows[0];

            if (queueItem.embargo_date && new Date(queueItem.embargo_date) > new Date()) {
              throw new Error('Content is under embargo');
            }

            await client.query(
              `UPDATE publishing_queue
               SET status = 'publishing', publish_time = NOW()
               WHERE article_id = $1`,
              [articleId]
            );

            await client.query(
              `UPDATE articles SET published = true, published_at = NOW() WHERE id = $1`,
              [articleId]
            );

            await client.query(
              `INSERT INTO publishing_history
               (article_id, university_id, action, action_type, publish_time, user_id, user_name)
               VALUES ($1, $2, 'publish', 'bulk', NOW(), $3, $4)`,
              [articleId, auth.user.universityId, auth.user.userId, auth.user.name]
            );

            await client.query(
              `UPDATE publishing_queue SET status = 'published' WHERE article_id = $1`,
              [articleId]
            );

            results.items.push({ articleId, status: 'published', publishedAt: new Date() });
            break;

          case 'retract':
            const retractQueueResult = await client.query(
              `SELECT * FROM publishing_queue WHERE article_id = $1 FOR UPDATE`,
              [articleId]
            );

            if (retractQueueResult.rows.length === 0) {
              throw new Error('Article not found');
            }

            await client.query(
              `UPDATE articles SET published = false WHERE id = $1`,
              [articleId]
            );

            await client.query(
              `UPDATE publishing_queue
               SET status = 'retracted'
               WHERE article_id = $1`,
              [articleId]
            );

            await client.query(
              `INSERT INTO publishing_history
               (article_id, university_id, action, action_type, retracted_time, user_id, user_name, reason)
               VALUES ($1, $2, 'retract', 'bulk', NOW(), $3, $4, $5)`,
              [articleId, auth.user.universityId, auth.user.userId, auth.user.name, reason || 'Bulk retraction']
            );

            results.items.push({ articleId, status: 'retracted', retractedAt: new Date() });
            break;

          case 'cancel':
            const cancelResult = await client.query(
              `UPDATE publishing_queue
               SET status = 'cancelled'
               WHERE article_id = $1 AND status IN ('scheduled', 'queued')
               RETURNING *`,
              [articleId]
            );

            if (cancelResult.rows.length === 0) {
              throw new Error('Scheduled item not found');
            }

            results.items.push({ articleId, status: 'cancelled' });
            break;

          default:
            throw new Error(`Invalid operation: ${operation}`);
        }

        await client.query('COMMIT');
        results.succeeded++;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        results.failed++;
        results.errors.push({
          articleId,
          error: String(error),
        });
      }
    }

    client.release();

    // Send bulk notifications
    try {
      const publishingSettings = await query(
        `SELECT notification_emails FROM publishing_settings WHERE university_id = $1`,
        [auth.user.universityId]
      );

      const emails = publishingSettings.rows[0]?.notification_emails || [auth.user.email];

      if (emails && emails.length > 0) {
        const notifMsg = createNotificationMessage('published', {
          articleTitle: `Bulk ${operation}: ${results.succeeded}/${results.total}`,
          publishedTime: new Date().toISOString(),
        });

        for (const email of emails) {
          await sendBulkNotifications(
            `bulk-${operation}-${Date.now()}`,
            auth.user.universityId,
            `bulk_${operation}`,
            [email],
            notifMsg.subject,
            notifMsg.message
          ).catch((err) => console.error('Notification error:', err));
        }
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error in bulk publishing:', error);
    return NextResponse.json(
      { error: 'Failed to complete bulk operation', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publishing/bulk/preview
 * Preview bulk operation before executing
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation');
    const articleIdsParam = searchParams.get('articleIds');

    if (!operation || !articleIdsParam) {
      return NextResponse.json(
        { error: 'Operation and articleIds are required' },
        { status: 400 }
      );
    }

    const articleIds = articleIdsParam.split(',');

    // Get current status of all articles
    const result = await query(
      `SELECT
        article_id,
        status,
        scheduled_time,
        publish_time,
        embargo_date,
        retraction_date
      FROM publishing_queue
      WHERE article_id = ANY($1)`,
      [articleIds]
    );

    const articles = result.rows.map((row) => ({
      articleId: row.article_id,
      currentStatus: row.status,
      scheduledTime: row.scheduled_time,
      publishedTime: row.publish_time,
      embargoDate: row.embargo_date,
      retractionDate: row.retraction_date,
      canOperation:
        operation === 'publish' && row.status !== 'published'
          ? true
          : operation === 'retract' && row.status === 'published'
            ? true
            : operation === 'cancel' && ['scheduled', 'queued'].includes(row.status)
              ? true
              : operation === 'schedule'
                ? true
                : false,
    }));

    return NextResponse.json({
      success: true,
      operation,
      preview: {
        total: articleIds.length,
        canProcess: articles.filter((a) => a.canOperation).length,
        willFail: articles.filter((a) => !a.canOperation).length,
        articles,
      },
    });
  } catch (error) {
    console.error('Error previewing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to preview bulk operation' },
      { status: 500 }
    );
  }
}
