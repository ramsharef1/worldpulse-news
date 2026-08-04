import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import {
  createApproval,
  approveItem,
  rejectItem,
  getApprovalStages,
  listUserPendingApprovals,
  logWorkflowAction,
} from '@/lib/workflow-utils';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/approvals
// List approvals with filters
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const articleId = searchParams.get('article_id');
    const draftId = searchParams.get('draft_id');
    const stage = searchParams.get('stage');

    let sql = `
      SELECT a.*, ad.title, ad.deadline, ast.display_name as stage_name, u.name as assigned_to_name
      FROM approvals a
      JOIN article_drafts ad ON a.draft_id = ad.id
      JOIN approval_stages ast ON a.stage_id = ast.id
      LEFT JOIN users u ON a.assigned_to_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      sql += ` AND a.assigned_to_id = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (articleId) {
      sql += ` AND a.article_id = $${paramIndex}`;
      params.push(articleId);
      paramIndex++;
    }

    if (draftId) {
      sql += ` AND a.draft_id = $${paramIndex}`;
      params.push(draftId);
      paramIndex++;
    }

    if (stage) {
      sql += ` AND a.stage_id = $${paramIndex}`;
      params.push(stage);
      paramIndex++;
    }

    sql += ` ORDER BY a.deadline ASC, a.created_at DESC LIMIT 100`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      approvals: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error listing approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list approvals' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/approvals
// Create new approval
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:approve')(request);
    if (!permission.authorized) {
      return forbidden();
    }

    const body = await request.json();

    // Validate required fields
    if (!body.article_id || !body.draft_id || !body.stage_id || !body.assigned_to_id) {
      return badRequest('Missing required fields: article_id, draft_id, stage_id, assigned_to_id');
    }

    const deadline = body.deadline ? new Date(body.deadline) : undefined;

    const result = await createApproval(
      body.article_id,
      body.draft_id,
      body.stage_id,
      body.assigned_to_id,
      auth.user.userId,
      deadline
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
      message: 'Approval created successfully',
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create approval' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/approvals
// Approve or reject an approval
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const body = await request.json();

    if (!body.approval_id || !body.action) {
      return badRequest('Missing required fields: approval_id, action (approve/reject)');
    }

    if (!['approve', 'reject'].includes(body.action)) {
      return badRequest('Action must be either "approve" or "reject"');
    }

    // Get approval to check permissions
    const approvalResult = await query(
      `SELECT * FROM approvals WHERE id = $1`,
      [body.approval_id]
    );

    if (approvalResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      );
    }

    const approval = approvalResult.rows[0];

    // Verify current user is assigned to this approval
    if (approval.assigned_to_id !== auth.user.userId) {
      return forbidden('You are not assigned to this approval');
    }

    let result;

    if (body.action === 'approve') {
      result = await approveItem(body.approval_id, auth.user.userId, body.notes);
    } else {
      if (!body.reason) {
        return badRequest('Rejection reason is required');
      }
      result = await rejectItem(body.approval_id, auth.user.userId, body.reason);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      approval: result.approval,
      message: `Approval ${body.action}d successfully`,
    });
  } catch (error) {
    console.error('Error updating approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update approval' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/workflow/approvals/pending
// Get pending approvals for current user
// ============================================

export async function GET_PENDING(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const approvals = await listUserPendingApprovals(auth.user.userId);

    return NextResponse.json({
      success: true,
      approvals,
      total: approvals.length,
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}
