import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/db';
import { sendPublishingNotification, createNotificationMessage } from '@/lib/publishing-notifications';

/**
 * POST /api/publishing/publish
 * Immediately publish content (one-click publish)
 * Bypasses scheduled time, respects embargo dates
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { articleId, force } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    const client = await require('@/lib/db').getClient();

    try {
      await client.query('BEGIN');

      // Get the article and queue item
      const queueResult = await client.query(
        `SELECT * FROM publishing_queue WHERE article_id = $1 FOR UPDATE`,
        [articleId]
      );

      if (queueResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Article not found in queue' }, { status: 404 });
      }

      const queueItem = queueResult.rows[0];

      // Check embargo (unless force flag is set)
      if (!force && queueItem.embargo_date && new Date(queueItem.embargo_date) > new Date()) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Content is still under embargo', embargoDate: queueItem.embargo_date },
          { status: 403 }
        );
      }

      // Check if already published
      if (queueItem.status === 'published') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Article is already published' },
          { status: 400 }
        );
      }

      // Update queue status
      await client.query(
        `UPDATE publishing_queue
         SET status = 'publishing', publish_time = NOW(), updated_at = NOW()
         WHERE article_id = $1`,
        [articleId]
      );

      // Update article as published
      await client.query(
        `UPDATE articles
         SET published = true, published_at = NOW()
         WHERE id = $1`,
        [articleId]
      );

      // Add to publishing history
      await client.query(
        `INSERT INTO publishing_history
         (article_id, university_id, action, action_type, publish_time, user_id, user_name)
         VALUES ($1, $2, 'publish', 'manual', NOW(), $3, $4)`,
        [articleId, auth.user.universityId, auth.user.userId, auth.user.name]
      );

      // Update status to published
      await client.query(
        `UPDATE publishing_queue
         SET status = 'published', updated_at = NOW()
         WHERE article_id = $1`,
        [articleId]
      );

      await client.query('COMMIT');

      // Send notification asynchronously
      try {
        const publishingSettings = await query(
          `SELECT notification_emails FROM publishing_settings WHERE university_id = $1`,
          [auth.user.universityId]
        );

        const emails = publishingSettings.rows[0]?.notification_emails || [auth.user.email];

        if (emails && emails.length > 0) {
          const notifMsg = createNotificationMessage('published', {
            articleTitle: articleId,
            publishedTime: new Date().toISOString(),
          });

          for (const email of emails) {
            await sendPublishingNotification({
              articleId,
              universityId: auth.user.universityId,
              notificationType: 'published',
              recipientEmail: email,
              subject: notifMsg.subject,
              message: notifMsg.message,
            });
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the publish if notification fails
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Content published successfully',
          publishedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error publishing content:', error);
    return NextResponse.json(
      { error: 'Failed to publish content', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publishing/publish
 * Get publish status for an article
 */
export async function GET(request: NextRequest) {
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
      `SELECT
        pq.article_id,
        pq.status,
        pq.scheduled_time,
        pq.publish_time,
        pq.embargo_date,
        pq.retraction_date,
        pq.priority,
        EXTRACT(EPOCH FROM (pq.scheduled_time - NOW()))::INTEGER as seconds_until_publish,
        CASE
          WHEN pq.embargo_date IS NOT NULL AND pq.embargo_date > NOW() THEN 'embargoed'
          WHEN pq.retraction_date IS NOT NULL AND pq.retraction_date <= NOW() THEN 'retracted'
          ELSE 'available'
        END as publish_status
      FROM publishing_queue pq
      WHERE pq.article_id = $1`,
      [articleId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const status = result.rows[0];

    return NextResponse.json({
      success: true,
      status: {
        articleId: status.article_id,
        publishStatus: status.status,
        scheduledTime: status.scheduled_time,
        publishedTime: status.publish_time,
        embargoDate: status.embargo_date,
        retractionDate: status.retraction_date,
        priority: status.priority,
        availabilityStatus: status.publish_status,
        secondsUntilPublish: status.seconds_until_publish,
      },
    });
  } catch (error) {
    console.error('Error getting publish status:', error);
    return NextResponse.json(
      { error: 'Failed to get publish status' },
      { status: 500 }
    );
  }
}
