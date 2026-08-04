import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import { reassignApproval, logWorkflowAction } from '@/lib/workflow-utils';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/approvals/[id]
// Get single approval with full details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const { id } = params;

    // Get approval with related data
    const result = await query(
      `SELECT
        a.*,
        ad.title,
        ad.state as draft_state,
        ad.deadline as draft_deadline,
        ast.display_name as stage_name,
        u1.name as assigned_to_name,
        u2.name as assigned_by_name,
        u3.name as previous_assignee_name,
        (SELECT COUNT(*) FROM approval_reassignments WHERE approval_id = a.id) as reassignment_count
      FROM approvals a
      JOIN article_drafts ad ON a.draft_id = ad.id
      JOIN approval_stages ast ON a.stage_id = ast.id
      LEFT JOIN users u1 ON a.assigned_to_id = u1.id
      LEFT JOIN users u2 ON a.assigned_by_id = u2.id
      LEFT JOIN users u3 ON a.previous_assignee_id = u3.id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      );
    }

    const approval = result.rows[0];

    // Get related comments
    const commentsResult = await query(
      `SELECT ec.*, u.name as author_name
       FROM editorial_comments ec
       LEFT JOIN users u ON ec.author_id = u.id
       WHERE ec.article_id = $1 AND ec.is_resolved = FALSE
       ORDER BY ec.created_at DESC
       LIMIT 20`,
      [approval.article_id]
    );

    // Get related change requests
    const changesResult = await query(
      `SELECT cr.*, u.name as suggested_by_name
       FROM change_requests cr
       LEFT JOIN users u ON cr.suggested_by_id = u.id
       WHERE cr.article_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC
       LIMIT 20`,
      [approval.article_id]
    );

    // Get related flags
    const flagsResult = await query(
      `SELECT cf.*, u.name as flagged_by_name
       FROM content_flags cf
       LEFT JOIN users u ON cf.flagged_by_id = u.id
       WHERE cf.article_id = $1 AND cf.status = 'open'
       ORDER BY cf.severity DESC, cf.created_at DESC
       LIMIT 20`,
      [approval.article_id]
    );

    return NextResponse.json({
      success: true,
      approval,
      relatedComments: commentsResult.rows,
      relatedChanges: changesResult.rows,
      relatedFlags: flagsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/approvals/[id]
// Reassign approval to another user
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:reassign')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to reassign approvals');
    }

    const { id } = params;
    const body = await request.json();

    if (!body.new_assignee_id) {
      return badRequest('Missing required field: new_assignee_id');
    }

    const result = await reassignApproval(
      id,
      body.new_assignee_id,
      auth.user.userId,
      body.reason
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      approval: result.approval,
      message: 'Approval reassigned successfully',
    });
  } catch (error) {
    console.error('Error reassigning approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reassign approval' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/workflow/approvals/[id]
// Cancel/remove approval (admin only)
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:*')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to delete approvals');
    }

    const { id } = params;
    const body = await request.json();

    // Get approval before deletion
    const approvalResult = await query(
      'SELECT * FROM approvals WHERE id = $1',
      [id]
    );

    if (approvalResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      );
    }

    const approval = approvalResult.rows[0];

    // Delete approval
    await query('DELETE FROM approvals WHERE id = $1', [id]);

    // Log action
    await logWorkflowAction(
      approval.article_id,
      approval.draft_id,
      'approval_deleted',
      auth.user.userId,
      { reason: body.reason || 'No reason provided' },
      id
    );

    return NextResponse.json({
      success: true,
      message: 'Approval deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete approval' },
      { status: 500 }
    );
  }
}
