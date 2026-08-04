import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import {
  updateDraftState,
  getWorkflowStatus,
  getWorkflowHistory,
  VALID_STATE_TRANSITIONS,
  logWorkflowAction,
  getDraft,
} from '@/lib/workflow-utils';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/states
// Get workflow status and available transitions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const draftId = searchParams.get('draft_id');
    const articleId = searchParams.get('article_id');

    if (!draftId && !articleId) {
      return badRequest('Either draft_id or article_id is required');
    }

    let draft;
    if (draftId) {
      draft = await getDraft(draftId);
    } else {
      // Get latest draft for article
      const result = await query(
        'SELECT * FROM article_drafts WHERE article_id = $1 ORDER BY created_at DESC LIMIT 1',
        [articleId]
      );
      draft = result.rows[0];
    }

    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Get workflow status
    const status = await getWorkflowStatus(draft.id);

    // Get available transitions
    const availableTransitions = VALID_STATE_TRANSITIONS[draft.state] || [];

    // Get history
    const history = await getWorkflowHistory(draft.article_id);

    return NextResponse.json({
      success: true,
      currentState: draft.state,
      availableTransitions,
      status,
      history: history.slice(0, 20), // Last 20 actions
    });
  } catch (error) {
    console.error('Error fetching workflow state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow state' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/states
// Transition draft to a new state
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:update')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to update article state');
    }

    const body = await request.json();

    if (!body.draft_id || !body.new_state) {
      return badRequest('Missing required fields: draft_id, new_state');
    }

    const result = await updateDraftState(
      body.draft_id,
      body.new_state,
      auth.user.userId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get updated status
    const status = await getWorkflowStatus(body.draft_id);

    return NextResponse.json({
      success: true,
      draft: result.draft,
      status,
      message: `Draft transitioned to ${body.new_state}`,
    });
  } catch (error) {
    console.error('Error transitioning state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transition state' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/workflow/states/history
// Get detailed workflow history
// ============================================

export async function GET_HISTORY(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('article_id');
    const draftId = searchParams.get('draft_id');
    const actionType = searchParams.get('action_type');

    if (!articleId && !draftId) {
      return badRequest('Either article_id or draft_id is required');
    }

    let sql = `
      SELECT wh.*, u.name as actor_name, u.avatar as actor_avatar
      FROM workflow_history wh
      LEFT JOIN users u ON wh.actor_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (articleId) {
      sql += ` AND wh.article_id = $${paramIndex}`;
      params.push(articleId);
      paramIndex++;
    }

    if (draftId) {
      sql += ` AND wh.draft_id = $${paramIndex}`;
      params.push(draftId);
      paramIndex++;
    }

    if (actionType) {
      sql += ` AND wh.action_type = $${paramIndex}`;
      params.push(actionType);
      paramIndex++;
    }

    sql += ` ORDER BY wh.created_at DESC LIMIT 200`;

    const result = await query(sql, params);

    // Parse changes from JSONB
    const history = result.rows.map((h) => ({
      ...h,
      changes: typeof h.changes === 'string' ? JSON.parse(h.changes) : h.changes,
    }));

    return NextResponse.json({
      success: true,
      history,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow history' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/states
// Revert to previous state (limited)
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:*')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to revert workflow state');
    }

    const body = await request.json();

    if (!body.draft_id || !body.previous_state) {
      return badRequest('Missing required fields: draft_id, previous_state');
    }

    // Get draft
    const draft = await getDraft(body.draft_id);
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Only allow reverting certain states
    const allowedRevertsFrom = ['rejected', 'pending_review'];
    if (!allowedRevertsFrom.includes(draft.state)) {
      return badRequest(
        `Cannot revert from state "${draft.state}". Can only revert from: ${allowedRevertsFrom.join(', ')}`
      );
    }

    const result = await updateDraftState(
      body.draft_id,
      body.previous_state,
      auth.user.userId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Log revert action
    await logWorkflowAction(
      draft.article_id,
      body.draft_id,
      'workflow_reverted',
      auth.user.userId,
      { from_state: draft.state, to_state: body.previous_state, reason: body.reason }
    );

    const status = await getWorkflowStatus(body.draft_id);

    return NextResponse.json({
      success: true,
      draft: result.draft,
      status,
      message: `Draft reverted to ${body.previous_state}`,
    });
  } catch (error) {
    console.error('Error reverting workflow state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revert workflow state' },
      { status: 500 }
    );
  }
}
