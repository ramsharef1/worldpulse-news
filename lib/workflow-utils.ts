import { query } from './db';

// ============================================
// WORKFLOW STATE MACHINE
// ============================================

export enum WorkflowState {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REASSIGNED = 'reassigned',
}

export enum FlagSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ============================================
// STATE TRANSITION LOGIC
// ============================================

export const VALID_STATE_TRANSITIONS: Record<string, string[]> = {
  [WorkflowState.DRAFT]: [
    WorkflowState.PENDING_REVIEW,
  ],
  [WorkflowState.PENDING_REVIEW]: [
    WorkflowState.IN_REVIEW,
    WorkflowState.REJECTED,
  ],
  [WorkflowState.IN_REVIEW]: [
    WorkflowState.APPROVED,
    WorkflowState.REJECTED,
    WorkflowState.PENDING_REVIEW, // Send back for modifications
  ],
  [WorkflowState.APPROVED]: [
    WorkflowState.PUBLISHED,
    WorkflowState.PENDING_REVIEW, // Reopen if needed
  ],
  [WorkflowState.REJECTED]: [
    WorkflowState.PENDING_REVIEW, // Resubmit after fixes
  ],
  [WorkflowState.PUBLISHED]: [], // Terminal state
};

export const isValidStateTransition = (
  fromState: string,
  toState: string
): boolean => {
  const allowedTransitions = VALID_STATE_TRANSITIONS[fromState] || [];
  return allowedTransitions.includes(toState);
};

// ============================================
// DRAFT MANAGEMENT
// ============================================

export const createDraft = async (
  articleId: string,
  title: string,
  excerpt: string,
  content: string,
  authorId: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const result = await query(
      `INSERT INTO article_drafts (
        article_id, title, excerpt, content, author_id, state, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        articleId,
        title,
        excerpt,
        content,
        authorId,
        WorkflowState.DRAFT,
        JSON.stringify(metadata),
      ]
    );
    return { success: true, draft: result.rows[0] };
  } catch (error) {
    console.error('Error creating draft:', error);
    return { success: false, error: 'Failed to create draft' };
  }
};

export const getDraft = async (draftId: string) => {
  try {
    const result = await query(
      'SELECT * FROM article_drafts WHERE id = $1',
      [draftId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting draft:', error);
    return null;
  }
};

export const updateDraftState = async (
  draftId: string,
  newState: string,
  updatedBy: string
) => {
  try {
    const draft = await getDraft(draftId);
    if (!draft) return { success: false, error: 'Draft not found' };

    if (!isValidStateTransition(draft.state, newState)) {
      return { success: false, error: `Cannot transition from ${draft.state} to ${newState}` };
    }

    const result = await query(
      `UPDATE article_drafts
       SET state = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newState, draftId]
    );

    // Log to history
    await logWorkflowAction(
      draft.article_id,
      draftId,
      'state_change',
      updatedBy,
      { from_state: draft.state, to_state: newState }
    );

    return { success: true, draft: result.rows[0] };
  } catch (error) {
    console.error('Error updating draft state:', error);
    return { success: false, error: 'Failed to update draft state' };
  }
};

// ============================================
// APPROVAL WORKFLOW
// ============================================

export const getApprovalStages = async () => {
  try {
    const result = await query(
      'SELECT * FROM approval_stages ORDER BY stage_order ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching approval stages:', error);
    return [];
  }
};

export const getNextApprovalStage = async (draftId: string) => {
  try {
    // Get all stages
    const stages = await getApprovalStages();

    // Get approvals for this draft
    const result = await query(
      `SELECT DISTINCT stage_id FROM approvals
       WHERE draft_id = $1 AND status IN ('approved', 'reassigned')
       ORDER BY created_at DESC`,
      [draftId]
    );

    const completedStageIds = result.rows.map((r) => r.stage_id);

    // Find first incomplete stage
    for (const stage of stages) {
      if (!completedStageIds.includes(stage.id)) {
        return stage;
      }
    }

    return null; // All stages completed
  } catch (error) {
    console.error('Error getting next approval stage:', error);
    return null;
  }
};

export const createApproval = async (
  articleId: string,
  draftId: string,
  stageId: string,
  assignedToId: string,
  assignedById: string,
  deadline?: Date
) => {
  try {
    const result = await query(
      `INSERT INTO approvals (
        article_id, draft_id, stage_id, assigned_to_id, assigned_by_id, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [articleId, draftId, stageId, assignedToId, assignedById, deadline || null]
    );

    const approval = result.rows[0];

    // Log action
    await logWorkflowAction(
      articleId,
      draftId,
      'approval_created',
      assignedById,
      { approval_id: approval.id, stage_id: stageId },
      approval.id
    );

    // Create deadline tracking if deadline provided
    if (deadline) {
      await query(
        `INSERT INTO workflow_deadlines (
          article_id, draft_id, deadline, deadline_type, approval_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [articleId, draftId, deadline, 'approval_deadline', approval.id]
      );
    }

    return { success: true, approval };
  } catch (error) {
    console.error('Error creating approval:', error);
    return { success: false, error: 'Failed to create approval' };
  }
};

export const approveItem = async (
  approvalId: string,
  approvedById: string,
  notes?: string
) => {
  try {
    const result = await query(
      `UPDATE approvals
       SET status = $1, approved_at = NOW(), approval_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [ApprovalStatus.APPROVED, notes || null, approvalId]
    );

    const approval = result.rows[0];

    // Log action
    await logWorkflowAction(
      approval.article_id,
      approval.draft_id,
      'approval_granted',
      approvedById,
      { notes },
      approvalId
    );

    // Update deadline status if exists
    await query(
      `UPDATE workflow_deadlines
       SET status = 'met'
       WHERE approval_id = $1 AND status = 'active'`,
      [approvalId]
    );

    return { success: true, approval };
  } catch (error) {
    console.error('Error approving item:', error);
    return { success: false, error: 'Failed to approve item' };
  }
};

export const rejectItem = async (
  approvalId: string,
  rejectedById: string,
  reason: string
) => {
  try {
    const result = await query(
      `UPDATE approvals
       SET status = $1, rejected_at = NOW(), rejection_reason = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [ApprovalStatus.REJECTED, reason, approvalId]
    );

    const approval = result.rows[0];

    // Update draft state to pending_review
    await updateDraftState(
      approval.draft_id,
      WorkflowState.PENDING_REVIEW,
      rejectedById
    );

    // Log action
    await logWorkflowAction(
      approval.article_id,
      approval.draft_id,
      'approval_rejected',
      rejectedById,
      { reason },
      approvalId
    );

    return { success: true, approval };
  } catch (error) {
    console.error('Error rejecting item:', error);
    return { success: false, error: 'Failed to reject item' };
  }
};

// ============================================
// REASSIGNMENT
// ============================================

export const reassignApproval = async (
  approvalId: string,
  newAssigneeId: string,
  reassignedById: string,
  reason?: string
) => {
  try {
    const approval = await query(
      'SELECT * FROM approvals WHERE id = $1',
      [approvalId]
    );

    if (approval.rows.length === 0) {
      return { success: false, error: 'Approval not found' };
    }

    const oldApproval = approval.rows[0];

    // Update approval
    const result = await query(
      `UPDATE approvals
       SET assigned_to_id = $1, previous_assignee_id = $2, reassigned_at = NOW(), status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [newAssigneeId, oldApproval.assigned_to_id, ApprovalStatus.REASSIGNED, approvalId]
    );

    const updatedApproval = result.rows[0];

    // Log reassignment
    await query(
      `INSERT INTO approval_reassignments (
        approval_id, article_id, from_user_id, to_user_id, reassigned_by_id, reason
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        approvalId,
        oldApproval.article_id,
        oldApproval.assigned_to_id,
        newAssigneeId,
        reassignedById,
        reason || null,
      ]
    );

    // Log action
    await logWorkflowAction(
      oldApproval.article_id,
      oldApproval.draft_id,
      'approval_reassigned',
      reassignedById,
      { from_user: oldApproval.assigned_to_id, to_user: newAssigneeId, reason },
      approvalId
    );

    return { success: true, approval: updatedApproval };
  } catch (error) {
    console.error('Error reassigning approval:', error);
    return { success: false, error: 'Failed to reassign approval' };
  }
};

// ============================================
// CONDITIONAL ROUTING RULES
// ============================================

export const evaluateRoutingRules = async (
  draftId: string,
  draftData: Record<string, any>
) => {
  try {
    const rules = await query(
      `SELECT * FROM approval_rules WHERE is_active = TRUE ORDER BY priority DESC`
    );

    const matchedRules = [];

    for (const rule of rules.rows) {
      const conditions = rule.conditions || {};

      // Check views threshold
      if (conditions.views_threshold && draftData.views < conditions.views_threshold) {
        continue;
      }

      // Check other conditions as needed
      // This is extensible for custom business logic

      matchedRules.push(rule);
    }

    return matchedRules;
  } catch (error) {
    console.error('Error evaluating routing rules:', error);
    return [];
  }
};

// ============================================
// CONTENT FLAGGING
// ============================================

export const flagContent = async (
  articleId: string,
  draftId: string,
  flagType: string,
  severity: string,
  description: string,
  flaggedById: string
) => {
  try {
    const result = await query(
      `INSERT INTO content_flags (
        article_id, draft_id, flag_type, severity, description, flagged_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [articleId, draftId, flagType, severity, description, flaggedById]
    );

    const flag = result.rows[0];

    // Update draft flagged_at timestamp
    await query(
      `UPDATE article_drafts
       SET flagged_at = NOW(), flag_reason = $1
       WHERE id = $2`,
      [flagType, draftId]
    );

    // Log action
    await logWorkflowAction(
      articleId,
      draftId,
      'content_flagged',
      flaggedById,
      { flag_type: flagType, severity },
      null,
      flag.id
    );

    return { success: true, flag };
  } catch (error) {
    console.error('Error flagging content:', error);
    return { success: false, error: 'Failed to flag content' };
  }
};

export const resolveFlag = async (
  flagId: string,
  resolvedById: string,
  notes: string
) => {
  try {
    const result = await query(
      `UPDATE content_flags
       SET status = 'resolved', resolved_at = NOW(), resolved_by_id = $1, resolution_notes = $2
       WHERE id = $3
       RETURNING *`,
      [resolvedById, notes, flagId]
    );

    const flag = result.rows[0];

    // Log action
    await logWorkflowAction(
      flag.article_id,
      flag.draft_id,
      'flag_resolved',
      resolvedById,
      { resolution: notes },
      null,
      flagId
    );

    return { success: true, flag };
  } catch (error) {
    console.error('Error resolving flag:', error);
    return { success: false, error: 'Failed to resolve flag' };
  }
};

// ============================================
// EDITORIAL COMMENTS
// ============================================

export const addEditorialComment = async (
  articleId: string,
  draftId: string,
  content: string,
  authorId: string,
  commentType: string = 'comment',
  section?: string,
  lineNumber?: number,
  mentions: string[] = []
) => {
  try {
    const result = await query(
      `INSERT INTO editorial_comments (
        article_id, draft_id, content, comment_type, author_id, section, line_number, mentions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        articleId,
        draftId,
        content,
        commentType,
        authorId,
        section || null,
        lineNumber || null,
        JSON.stringify(mentions),
      ]
    );

    const comment = result.rows[0];

    // Log action
    await logWorkflowAction(
      articleId,
      draftId,
      'editorial_comment_added',
      authorId,
      { comment_type: commentType, mentions },
      null,
      null,
      comment.id
    );

    return { success: true, comment };
  } catch (error) {
    console.error('Error adding editorial comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
};

export const resolveComment = async (
  commentId: string,
  resolvedById: string
) => {
  try {
    const result = await query(
      `UPDATE editorial_comments
       SET is_resolved = TRUE, resolved_at = NOW(), resolved_by_id = $1
       WHERE id = $2
       RETURNING *`,
      [resolvedById, commentId]
    );

    return { success: true, comment: result.rows[0] };
  } catch (error) {
    console.error('Error resolving comment:', error);
    return { success: false, error: 'Failed to resolve comment' };
  }
};

// ============================================
// CHANGE REQUESTS
// ============================================

export const suggestChange = async (
  articleId: string,
  draftId: string,
  fieldName: string,
  originalText: string | null,
  suggestedText: string,
  changeReason: string,
  suggestedById: string,
  changeType: string = 'text_edit'
) => {
  try {
    const result = await query(
      `INSERT INTO change_requests (
        article_id, draft_id, field_name, original_text, suggested_text, change_reason, suggested_by_id, change_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        articleId,
        draftId,
        fieldName,
        originalText,
        suggestedText,
        changeReason,
        suggestedById,
        changeType,
      ]
    );

    const changeRequest = result.rows[0];

    // Log action
    await logWorkflowAction(
      articleId,
      draftId,
      'change_suggested',
      suggestedById,
      { field: fieldName, change_type: changeType },
      null
    );

    return { success: true, changeRequest };
  } catch (error) {
    console.error('Error suggesting change:', error);
    return { success: false, error: 'Failed to suggest change' };
  }
};

export const acceptChange = async (
  changeRequestId: string,
  reviewedById: string,
  notes?: string
) => {
  try {
    const result = await query(
      `UPDATE change_requests
       SET status = 'accepted', accepted_at = NOW(), reviewed_by_id = $1, review_notes = $2
       WHERE id = $3
       RETURNING *`,
      [reviewedById, notes || null, changeRequestId]
    );

    const changeRequest = result.rows[0];

    // Log action
    await logWorkflowAction(
      changeRequest.article_id,
      changeRequest.draft_id,
      'change_accepted',
      reviewedById,
      { notes }
    );

    return { success: true, changeRequest };
  } catch (error) {
    console.error('Error accepting change:', error);
    return { success: false, error: 'Failed to accept change' };
  }
};

export const rejectChange = async (
  changeRequestId: string,
  reviewedById: string,
  reason: string
) => {
  try {
    const result = await query(
      `UPDATE change_requests
       SET status = 'rejected', rejected_at = NOW(), reviewed_by_id = $1, review_notes = $2
       WHERE id = $3
       RETURNING *`,
      [reviewedById, reason, changeRequestId]
    );

    const changeRequest = result.rows[0];

    // Log action
    await logWorkflowAction(
      changeRequest.article_id,
      changeRequest.draft_id,
      'change_rejected',
      reviewedById,
      { reason }
    );

    return { success: true, changeRequest };
  } catch (error) {
    console.error('Error rejecting change:', error);
    return { success: false, error: 'Failed to reject change' };
  }
};

// ============================================
// WORKFLOW HISTORY & AUDIT TRAIL
// ============================================

export const logWorkflowAction = async (
  articleId: string,
  draftId: string,
  actionType: string,
  actorId: string,
  changes: Record<string, any> = {},
  approvalId?: string,
  flagId?: string,
  commentId?: string
) => {
  try {
    await query(
      `INSERT INTO workflow_history (
        article_id, draft_id, action_type, actor_id, changes, approval_id, flag_id, comment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        articleId,
        draftId,
        actionType,
        actorId,
        JSON.stringify(changes),
        approvalId || null,
        flagId || null,
        commentId || null,
      ]
    );
  } catch (error) {
    console.error('Error logging workflow action:', error);
  }
};

export const getWorkflowHistory = async (articleId: string) => {
  try {
    const result = await query(
      `SELECT * FROM workflow_history
       WHERE article_id = $1
       ORDER BY created_at DESC`,
      [articleId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    return [];
  }
};

// ============================================
// WORKFLOW STATUS
// ============================================

export const getWorkflowStatus = async (draftId: string) => {
  try {
    const result = await query(
      `SELECT * FROM workflow_status_view WHERE draft_id = $1`,
      [draftId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    return null;
  }
};

export const listUserPendingApprovals = async (userId: string) => {
  try {
    const result = await query(
      `SELECT a.*, ad.title, ad.deadline, ast.display_name as stage_name
       FROM approvals a
       JOIN article_drafts ad ON a.draft_id = ad.id
       JOIN approval_stages ast ON a.stage_id = ast.id
       WHERE a.assigned_to_id = $1 AND a.status = 'pending'
       ORDER BY a.deadline ASC, a.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
};
