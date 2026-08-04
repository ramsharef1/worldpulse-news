import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/db';
import { sendPublishingNotification, createNotificationMessage } from '@/lib/publishing-notifications';

/**
 * GET /api/publishing/history
 * Get publishing history for a university or article
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const action = searchParams.get('action'); // publish, retract, embargo_released, etc.
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'ph.university_id = $1';
    const params: any[] = [auth.user.universityId];

    if (articleId) {
      whereClause += ` AND ph.article_id = $${params.length + 1}`;
      params.push(articleId);
    }

    if (action) {
      whereClause += ` AND ph.action = $${params.length + 1}`;
      params.push(action);
    }

    const result = await query(
      `SELECT
        ph.*,
        EXTRACT(EPOCH FROM (NOW() - ph.created_at))::INTEGER as seconds_since_action
      FROM publishing_history ph
      WHERE ${whereClause}
      ORDER BY ph.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM publishing_history WHERE ${whereClause}`,
      params
    );

    return NextResponse.json({
      success: true,
      history: result.rows,
      pagination: {
        limit,
        offset,
        total: totalResult.rows[0].total,
      },
    });
  } catch (error) {
    console.error('Error fetching publishing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publishing history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publishing/history/revert
 * Revert published content (unpublish/retract)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { articleId, reason = 'Manual revert' } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    const client = await require('@/lib/db').getClient();

    try {
      await client.query('BEGIN');

      // Get the article
      const queueResult = await client.query(
        `SELECT * FROM publishing_queue WHERE article_id = $1 FOR UPDATE`,
        [articleId]
      );

      if (queueResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Article not found in queue' }, { status: 404 });
      }

      const queueItem = queueResult.rows[0];

      if (queueItem.status !== 'published') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Only published content can be reverted' },
          { status: 400 }
        );
      }

      // Update article as unpublished
      await client.query(
        `UPDATE articles SET published = false WHERE id = $1`,
        [articleId]
      );

      // Update queue status to retracted
      await client.query(
        `UPDATE publishing_queue
         SET status = 'retracted', updated_at = NOW()
         WHERE article_id = $1`,
        [articleId]
      );

      // Add to history
      await client.query(
        `INSERT INTO publishing_history
         (article_id, university_id, action, action_type, retracted_time, user_id, user_name, reason)
         VALUES ($1, $2, 'retract', 'manual', NOW(), $3, $4, $5)`,
        [articleId, auth.user.universityId, auth.user.userId, auth.user.name, reason]
      );

      await client.query('COMMIT');

      // Send notifications
      try {
        const publishingSettings = await query(
          `SELECT notification_emails FROM publishing_settings WHERE university_id = $1`,
          [auth.user.universityId]
        );

        const emails = publishingSettings.rows[0]?.notification_emails || [auth.user.email];

        if (emails && emails.length > 0) {
          const notifMsg = createNotificationMessage('retracted', {
            articleTitle: articleId,
            reason,
          });

          for (const email of emails) {
            await sendPublishingNotification({
              articleId,
              universityId: auth.user.universityId,
              notificationType: 'retracted',
              recipientEmail: email,
              subject: notifMsg.subject,
              message: notifMsg.message,
            }).catch((err) => console.error('Notification error:', err));
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Content retracted successfully',
        retractionTime: new Date().toISOString(),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reverting content:', error);
    return NextResponse.json(
      { error: 'Failed to revert content', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publishing/history/stats
 * Get publishing statistics
 */
export async function GET_STATS(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const result = await query(
      `SELECT
        action,
        COUNT(*) as count,
        COUNT(DISTINCT article_id) as unique_articles
      FROM publishing_history
      WHERE university_id = $1
      GROUP BY action
      ORDER BY count DESC`,
      [auth.user.universityId]
    );

    const stats = {
      total: 0,
      byAction: {} as Record<string, any>,
    };

    result.rows.forEach((row) => {
      stats.total += row.count;
      stats.byAction[row.action] = {
        count: row.count,
        uniqueArticles: row.unique_articles,
      };
    });

    // Get recent activity
    const recentResult = await query(
      `SELECT
        DATE(created_at) as date,
        action,
        COUNT(*) as count
      FROM publishing_history
      WHERE university_id = $1
      AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), action
      ORDER BY date DESC`,
      [auth.user.universityId]
    );

    return NextResponse.json({
      success: true,
      stats,
      recentActivity: recentResult.rows,
    });
  } catch (error) {
    console.error('Error getting history stats:', error);
    return NextResponse.json(
      { error: 'Failed to get history stats' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publishing/history
 * Delete history entries (for cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '90');
    const articleId = searchParams.get('articleId');

    let whereClause = 'university_id = $1 AND created_at < NOW() - INTERVAL \'1 day\' * $2';
    const params: any[] = [auth.user.universityId, olderThanDays];

    if (articleId) {
      whereClause += ` AND article_id = $${params.length + 1}`;
      params.push(articleId);
    }

    const result = await query(
      `DELETE FROM publishing_history WHERE ${whereClause} RETURNING id`,
      params
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.rows.length,
      message: `Deleted ${result.rows.length} history entries older than ${olderThanDays} days`,
    });
  } catch (error) {
    console.error('Error deleting history:', error);
    return NextResponse.json(
      { error: 'Failed to delete history' },
      { status: 500 }
    );
  }
}
