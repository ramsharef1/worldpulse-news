import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import { suggestChange, acceptChange, rejectChange } from '@/lib/workflow-utils';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/change-requests
// Get change requests with filtering
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
    const status = searchParams.get('status');
    const changeType = searchParams.get('change_type');

    if (!articleId && !draftId) {
      return badRequest('Either article_id or draft_id is required');
    }

    let sql = `
      SELECT cr.*, u.name as suggested_by_name, u.avatar as suggested_by_avatar,
             ru.name as reviewed_by_name
      FROM change_requests cr
      LEFT JOIN users u ON cr.suggested_by_id = u.id
      LEFT JOIN users ru ON cr.reviewed_by_id = ru.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (articleId) {
      sql += ` AND cr.article_id = $${paramIndex}`;
      params.push(articleId);
      paramIndex++;
    }

    if (draftId) {
      sql += ` AND cr.draft_id = $${paramIndex}`;
      params.push(draftId);
      paramIndex++;
    }

    if (status) {
      sql += ` AND cr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (changeType) {
      sql += ` AND cr.change_type = $${paramIndex}`;
      params.push(changeType);
      paramIndex++;
    }

    sql += ` ORDER BY cr.created_at DESC LIMIT 100`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      changes: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching change requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch change requests' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/change-requests
// Suggest a change
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:suggest_changes')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to suggest changes');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.article_id || !body.draft_id || !body.field_name || !body.suggested_text || !body.change_reason) {
      return badRequest(
        'Missing required fields: article_id, draft_id, field_name, suggested_text, change_reason'
      );
    }

    const result = await suggestChange(
      body.article_id,
      body.draft_id,
      body.field_name,
      body.original_text || null,
      body.suggested_text,
      body.change_reason,
      auth.user.userId,
      body.change_type || 'text_edit'
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get full change request with author info
    const fullChange = await query(
      `SELECT cr.*, u.name as suggested_by_name, u.avatar as suggested_by_avatar
       FROM change_requests cr
       LEFT JOIN users u ON cr.suggested_by_id = u.id
       WHERE cr.id = $1`,
      [result.changeRequest.id]
    );

    return NextResponse.json({
      success: true,
      changeRequest: fullChange.rows[0],
      message: 'Change suggestion created successfully',
    });
  } catch (error) {
    console.error('Error creating change request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create change request' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/change-requests
// Accept or reject a change
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const body = await request.json();

    if (!body.change_id || !body.action) {
      return badRequest('Missing required fields: change_id, action (accept/reject)');
    }

    if (!['accept', 'reject'].includes(body.action)) {
      return badRequest('Action must be either "accept" or "reject"');
    }

    // Get change request
    const changeResult = await query(
      'SELECT * FROM change_requests WHERE id = $1',
      [body.change_id]
    );

    if (changeResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Change request not found' },
        { status: 404 }
      );
    }

    const change = changeResult.rows[0];

    // Check permission (only reviewers can accept/reject)
    if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin' && auth.user.role !== 'editor') {
      return forbidden('You do not have permission to review changes');
    }

    let result;

    if (body.action === 'accept') {
      result = await acceptChange(body.change_id, auth.user.userId, body.notes);
    } else {
      if (!body.reason) {
        return badRequest('Rejection reason is required');
      }
      result = await rejectChange(body.change_id, auth.user.userId, body.reason);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get updated change with reviewer info
    const updated = await query(
      `SELECT cr.*, u.name as reviewed_by_name
       FROM change_requests cr
       LEFT JOIN users u ON cr.reviewed_by_id = u.id
       WHERE cr.id = $1`,
      [body.change_id]
    );

    return NextResponse.json({
      success: true,
      changeRequest: updated.rows[0],
      message: `Change ${body.action}ed successfully`,
    });
  } catch (error) {
    console.error('Error updating change request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update change request' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/workflow/change-requests/[id]
// Delete a change suggestion
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const changeId = searchParams.get('id');

    if (!changeId) {
      return badRequest('Missing required parameter: id');
    }

    // Get change request
    const changeResult = await query(
      'SELECT * FROM change_requests WHERE id = $1',
      [changeId]
    );

    if (changeResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Change request not found' },
        { status: 404 }
      );
    }

    const change = changeResult.rows[0];

    // Check if user is suggester or admin
    if (change.suggested_by_id !== auth.user.userId && auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return forbidden('You can only delete your own suggestions');
    }

    // Only allow deletion if pending
    if (change.status !== 'pending') {
      return badRequest('Only pending change requests can be deleted');
    }

    // Delete change request
    await query(
      'DELETE FROM change_requests WHERE id = $1',
      [changeId]
    );

    return NextResponse.json({
      success: true,
      message: 'Change request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting change request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete change request' },
      { status: 500 }
    );
  }
}
