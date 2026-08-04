import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { getQueuedItems, getQueueStats, cancelJob, retryFailedJob } from '@/lib/publishing-queue';

/**
 * GET /api/publishing/queue
 * Get publishing queue for a university
 * Returns all scheduled/queued items with their status
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
    const status = searchParams.get('status');
    const universityId = auth.user.universityId;

    // Get queue items
    let items = await getQueuedItems(universityId, Math.min(limit, 100), offset);

    // Filter by status if provided
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // Get stats
    const stats = await getQueueStats(universityId);

    return NextResponse.json({
      success: true,
      items,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    });
  } catch (error) {
    console.error('Error fetching publishing queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publishing queue' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/publishing/queue
 * Update queue item status (cancel, retry, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { articleId, action, reason } = body;

    if (!articleId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'cancel':
        result = await cancelJob(articleId, reason);
        break;

      case 'retry':
        result = await retryFailedJob(articleId);
        break;

      case 'move_up':
        // Increase priority
        const { query } = await import('@/lib/db');
        const updateResult = await query(
          `UPDATE publishing_queue
           SET priority = priority + 1
           WHERE article_id = $1
           RETURNING *`,
          [articleId]
        );
        result = updateResult.rows[0];
        break;

      case 'move_down':
        // Decrease priority
        const updateResult2 = await query(
          `UPDATE publishing_queue
           SET priority = GREATEST(priority - 1, 0)
           WHERE article_id = $1
           RETURNING *`,
          [articleId]
        );
        result = updateResult2.rows[0];
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: result,
      action,
    });
  } catch (error) {
    console.error('Error updating queue item:', error);
    return NextResponse.json(
      { error: 'Failed to update queue item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publishing/queue
 * Remove item from queue (delete)
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

    const { removeFromQueue } = await import('@/lib/publishing-queue');
    const result = await removeFromQueue(articleId);

    if (!result) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from queue',
      item: result,
    });
  } catch (error) {
    console.error('Error removing queue item:', error);
    return NextResponse.json(
      { error: 'Failed to remove queue item' },
      { status: 500 }
    );
  }
}
