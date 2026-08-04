import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import { addEditorialComment, resolveComment, logWorkflowAction } from '@/lib/workflow-utils';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/comments
// Get editorial comments with filtering
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('article_id');
    const draftId = searchParams.get('draft_id');
    const resolved = searchParams.get('resolved');
    const type = searchParams.get('type');

    if (!articleId && !draftId) {
      return badRequest('Either article_id or draft_id is required');
    }

    let sql = `
      SELECT ec.*, u.name as author_name, u.avatar as author_avatar
      FROM editorial_comments ec
      LEFT JOIN users u ON ec.author_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (articleId) {
      sql += ` AND ec.article_id = $${paramIndex}`;
      params.push(articleId);
      paramIndex++;
    }

    if (draftId) {
      sql += ` AND ec.draft_id = $${paramIndex}`;
      params.push(draftId);
      paramIndex++;
    }

    if (resolved !== null) {
      const isResolved = resolved === 'true';
      sql += ` AND ec.is_resolved = $${paramIndex}`;
      params.push(isResolved);
      paramIndex++;
    }

    if (type) {
      sql += ` AND ec.comment_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    sql += ` ORDER BY ec.parent_comment_id NULLS FIRST, ec.created_at DESC`;

    const result = await query(sql, params);

    // Organize comments into threads
    const threadMap: Record<string, any> = {};
    const replies: Record<string, any[]> = {};

    for (const comment of result.rows) {
      if (comment.parent_comment_id) {
        if (!replies[comment.parent_comment_id]) {
          replies[comment.parent_comment_id] = [];
        }
        replies[comment.parent_comment_id].push(comment);
      } else {
        threadMap[comment.id] = comment;
      }
    }

    // Attach replies to parent comments
    for (const commentId in threadMap) {
      threadMap[commentId].replies = replies[commentId] || [];
    }

    const threads = Object.values(threadMap);

    return NextResponse.json({
      success: true,
      comments: threads,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/comments
// Add new editorial comment or reply
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:comment')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to comment');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.article_id || !body.draft_id || !body.content) {
      return badRequest('Missing required fields: article_id, draft_id, content');
    }

    const result = await addEditorialComment(
      body.article_id,
      body.draft_id,
      body.content,
      auth.user.userId,
      body.comment_type || 'comment',
      body.section,
      body.line_number,
      body.mentions || []
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get full comment with author info
    const fullComment = await query(
      `SELECT ec.*, u.name as author_name, u.avatar as author_avatar
       FROM editorial_comments ec
       LEFT JOIN users u ON ec.author_id = u.id
       WHERE ec.id = $1`,
      [result.comment.id]
    );

    return NextResponse.json({
      success: true,
      comment: fullComment.rows[0],
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/comments
// Resolve/unresolve comment
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const body = await request.json();

    if (!body.comment_id) {
      return badRequest('Missing required field: comment_id');
    }

    // Get comment
    const commentResult = await query(
      `SELECT * FROM editorial_comments WHERE id = $1`,
      [body.comment_id]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = commentResult.rows[0];

    if (body.action === 'resolve') {
      const result = await resolveComment(body.comment_id, auth.user.userId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        comment: result.comment,
        message: 'Comment resolved successfully',
      });
    } else if (body.action === 'unresolve') {
      // Unresolve a comment
      const result = await query(
        `UPDATE editorial_comments
         SET is_resolved = FALSE, resolved_at = NULL, resolved_by_id = NULL
         WHERE id = $1
         RETURNING *`,
        [body.comment_id]
      );

      return NextResponse.json({
        success: true,
        comment: result.rows[0],
        message: 'Comment unresolved successfully',
      });
    } else {
      return badRequest('Action must be "resolve" or "unresolve"');
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/workflow/comments/[id]
// Delete a comment (author or admin only)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('id');

    if (!commentId) {
      return badRequest('Missing required parameter: id');
    }

    // Get comment
    const commentResult = await query(
      `SELECT * FROM editorial_comments WHERE id = $1`,
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = commentResult.rows[0];

    // Check if user is author or admin
    if (comment.author_id !== auth.user.userId && auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return forbidden('You can only delete your own comments');
    }

    // Delete comment
    await query(
      `DELETE FROM editorial_comments WHERE id = $1`,
      [commentId]
    );

    // Log action
    await logWorkflowAction(
      comment.article_id,
      comment.draft_id,
      'comment_deleted',
      auth.user.userId,
      { comment_id: commentId }
    );

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
