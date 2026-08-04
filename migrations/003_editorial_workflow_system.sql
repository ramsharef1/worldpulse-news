-- Editorial Workflow System for Universities Voice
-- Features: Draft management, multi-stage approvals, conditional routing, comments, change requests

-- ============================================
-- DRAFT STATE MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS article_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(2048),
  category VARCHAR(100),
  university UUID,
  author_id UUID NOT NULL,
  state VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, pending_review, in_review, approved, rejected, published
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP,
  flagged_at TIMESTAMP,
  flag_reason TEXT,
  deadline TIMESTAMP,
  metadata JSONB DEFAULT '{}',

  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_article_drafts_state ON article_drafts(state);
CREATE INDEX IF NOT EXISTS idx_article_drafts_author ON article_drafts(author_id);
CREATE INDEX IF NOT EXISTS idx_article_drafts_deadline ON article_drafts(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_article_drafts_updated ON article_drafts(updated_at);

-- ============================================
-- MULTI-STAGE APPROVAL WORKFLOW
-- ============================================

CREATE TABLE IF NOT EXISTS approval_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_name VARCHAR(100) NOT NULL UNIQUE, -- author, editor, reviewer, publisher
  display_name VARCHAR(150) NOT NULL,
  stage_order INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(stage_order)
);

INSERT INTO approval_stages (stage_name, display_name, stage_order, description) VALUES
  ('author', 'Author', 1, 'Initial draft creation'),
  ('editor', 'Editor', 2, 'Editorial review and formatting'),
  ('reviewer', 'Reviewer', 3, 'Content review and fact-checking'),
  ('publisher', 'Publisher', 4, 'Final approval and publication')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  assigned_to_id UUID NOT NULL,
  assigned_by_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, reassigned
  approval_type VARCHAR(50) NOT NULL DEFAULT 'mandatory', -- mandatory, conditional, optional
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  reassigned_at TIMESTAMP,
  previous_assignee_id UUID,

  approval_notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deadline TIMESTAMP,

  -- Conditional approval routing
  condition_rule_id UUID,
  override_reason TEXT,

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES approval_stages(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (previous_assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (condition_rule_id) REFERENCES approval_rules(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_article ON approvals(article_id);
CREATE INDEX IF NOT EXISTS idx_approvals_draft ON approvals(draft_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_assigned_to ON approvals(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_approvals_stage ON approvals(stage_id);
CREATE INDEX IF NOT EXISTS idx_approvals_deadline ON approvals(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_approvals_created ON approvals(created_at);

-- ============================================
-- CONDITIONAL APPROVAL ROUTING RULES
-- ============================================

CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Rule conditions (JSONB for flexibility)
  conditions JSONB NOT NULL, -- e.g., {"views_threshold": 1000, "requires_ceo": true}

  -- Rule actions
  target_stage_id UUID,
  target_assignee_id UUID,
  approval_type VARCHAR(50),
  priority INT DEFAULT 0,

  created_by_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_stage_id) REFERENCES approval_stages(id) ON DELETE SET NULL,
  FOREIGN KEY (target_assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_rules_active ON approval_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_approval_rules_priority ON approval_rules(priority DESC);

-- ============================================
-- CONTENT FLAGGING SYSTEM (REVIEW QUEUE)
-- ============================================

CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,
  flag_type VARCHAR(50) NOT NULL, -- spam, inappropriate, factual_error, formatting, other
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  description TEXT NOT NULL,
  flagged_by_id UUID NOT NULL,
  assigned_to_id UUID,

  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, investigating, resolved, dismissed
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by_id UUID,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (flagged_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_content_flags_article ON content_flags(article_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_severity ON content_flags(severity);
CREATE INDEX IF NOT EXISTS idx_content_flags_created ON content_flags(created_at);

-- ============================================
-- COLLABORATIVE COMMENTS & EDITORIAL NOTES
-- ============================================

CREATE TABLE IF NOT EXISTS editorial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,

  -- Comment content
  content TEXT NOT NULL,
  comment_type VARCHAR(50) NOT NULL DEFAULT 'comment', -- comment, note, question

  -- Threading support
  parent_comment_id UUID,

  -- Author
  author_id UUID NOT NULL,

  -- Mentions (@mentions for notifications)
  mentions JSONB DEFAULT '[]', -- Array of user IDs mentioned

  -- Editorial focus
  line_number INT, -- For specific line comments
  section VARCHAR(100), -- title, excerpt, content, metadata

  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by_id UUID,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES editorial_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_editorial_comments_article ON editorial_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_draft ON editorial_comments(draft_id);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_author ON editorial_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_parent ON editorial_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_resolved ON editorial_comments(is_resolved);
CREATE INDEX IF NOT EXISTS idx_editorial_comments_created ON editorial_comments(created_at);

-- ============================================
-- CHANGE REQUEST SYSTEM (SUGGEST EDITS)
-- ============================================

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,

  -- Change details
  change_type VARCHAR(50) NOT NULL, -- text_edit, structure, fact_check, style, other
  field_name VARCHAR(100), -- title, excerpt, content, etc

  -- Original vs suggested
  original_text TEXT,
  suggested_text TEXT,
  change_reason TEXT NOT NULL,

  -- Author
  suggested_by_id UUID NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, superseded
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,

  reviewed_by_id UUID,
  review_notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_by_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_change_requests_article ON change_requests(article_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_draft ON change_requests(draft_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_suggested_by ON change_requests(suggested_by_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_created ON change_requests(created_at);

-- ============================================
-- APPROVAL CHAIN TRACKING (SEQUENTIAL SIGN-OFFS)
-- ============================================

CREATE TABLE IF NOT EXISTS approval_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,

  -- Chain configuration
  chain_name VARCHAR(200),
  is_sequential BOOLEAN DEFAULT TRUE,

  -- All approvals in chain
  approval_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],

  -- Current status
  completed_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, blocked

  -- Completion
  completed_at TIMESTAMP,
  completion_notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_approval_chains_article ON approval_chains(article_id);
CREATE INDEX IF NOT EXISTS idx_approval_chains_draft ON approval_chains(draft_id);
CREATE INDEX IF NOT EXISTS idx_approval_chains_status ON approval_chains(status);

-- ============================================
-- WORKFLOW HISTORY & AUDIT TRAIL
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,

  -- Action details
  action_type VARCHAR(50) NOT NULL, -- state_change, approval_granted, approval_rejected, comment_added, flag_created, etc
  actor_id UUID,

  -- State transition
  from_state VARCHAR(50),
  to_state VARCHAR(50),

  -- Changes
  changes JSONB DEFAULT '{}',
  details TEXT,

  -- Related IDs
  approval_id UUID,
  comment_id UUID,
  flag_id UUID,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE SET NULL,
  FOREIGN KEY (comment_id) REFERENCES editorial_comments(id) ON DELETE SET NULL,
  FOREIGN KEY (flag_id) REFERENCES content_flags(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_history_article ON workflow_history(article_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_draft ON workflow_history(draft_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_action ON workflow_history(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_history_actor ON workflow_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created ON workflow_history(created_at);

-- ============================================
-- DEADLINE TRACKING & ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  draft_id UUID NOT NULL,

  -- Deadline
  deadline TIMESTAMP NOT NULL,
  deadline_type VARCHAR(50) NOT NULL, -- stage_deadline, approval_deadline, publication_deadline

  -- Related entity
  stage_id UUID,
  approval_id UUID,

  -- Alert tracking
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, met, missed, extended

  notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES article_drafts(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES approval_stages(id) ON DELETE SET NULL,
  FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_deadlines_article ON workflow_deadlines(article_id);
CREATE INDEX IF NOT EXISTS idx_workflow_deadlines_deadline ON workflow_deadlines(deadline);
CREATE INDEX IF NOT EXISTS idx_workflow_deadlines_status ON workflow_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_workflow_deadlines_alert ON workflow_deadlines(alert_sent) WHERE NOT alert_sent;

-- ============================================
-- REASSIGNMENT AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS approval_reassignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL,
  article_id UUID NOT NULL,

  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  reassigned_by_id UUID NOT NULL,

  reason TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES article_drafts(article_id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reassigned_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_reassignments_approval ON approval_reassignments(approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_reassignments_article ON approval_reassignments(article_id);
CREATE INDEX IF NOT EXISTS idx_approval_reassignments_from_user ON approval_reassignments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_approval_reassignments_to_user ON approval_reassignments(to_user_id);

-- ============================================
-- PERMISSIONS AND ROLES FOR WORKFLOW
-- ============================================

-- Insert workflow-specific permissions if they don't exist
INSERT INTO permissions (permission_name, description) VALUES
  ('articles:submit_for_review', 'Submit article draft for approval'),
  ('articles:approve', 'Approve articles at assigned stage'),
  ('articles:reject', 'Reject articles with feedback'),
  ('articles:review_queue', 'Access flagged content review queue'),
  ('articles:comment', 'Add editorial comments and notes'),
  ('articles:suggest_changes', 'Suggest edits to articles'),
  ('articles:reassign', 'Reassign approvals to other users'),
  ('articles:view_history', 'View workflow history and audit trail'),
  ('articles:manage_rules', 'Create and manage approval routing rules'),
  ('articles:bypass_approval', 'Bypass approval workflow (super admin only)')
ON CONFLICT (permission_name) DO NOTHING;

-- ============================================
-- WORKFLOW STATUS VIEW
-- ============================================

CREATE VIEW IF NOT EXISTS workflow_status_view AS
SELECT
  ad.id as draft_id,
  ad.article_id,
  ad.title,
  ad.state as current_state,
  ad.author_id,
  ad.deadline,
  ad.flagged_at,
  CASE
    WHEN ad.state = 'draft' THEN 1
    WHEN ad.state = 'pending_review' THEN 2
    WHEN ad.state = 'in_review' THEN 3
    WHEN ad.state = 'approved' THEN 4
    WHEN ad.state = 'rejected' THEN 5
    WHEN ad.state = 'published' THEN 6
  END as state_order,
  (SELECT COUNT(*) FROM approvals WHERE draft_id = ad.id AND status = 'pending') as pending_approvals,
  (SELECT COUNT(*) FROM approvals WHERE draft_id = ad.id AND status = 'approved') as approved_count,
  (SELECT COUNT(*) FROM approvals WHERE draft_id = ad.id) as total_approvals,
  (SELECT COUNT(*) FROM content_flags WHERE draft_id = ad.id AND status = 'open') as open_flags,
  (SELECT COUNT(*) FROM editorial_comments WHERE draft_id = ad.id AND is_resolved = FALSE) as unresolved_comments,
  (SELECT COUNT(*) FROM change_requests WHERE draft_id = ad.id AND status = 'pending') as pending_changes,
  CASE
    WHEN ad.deadline IS NOT NULL AND ad.deadline < NOW() AND ad.state NOT IN ('published', 'rejected') THEN 'overdue'
    WHEN ad.deadline IS NOT NULL AND (ad.deadline - NOW()) < INTERVAL '1 day' THEN 'urgent'
    WHEN ad.deadline IS NOT NULL THEN 'on_track'
    ELSE 'no_deadline'
  END as deadline_status,
  ad.created_at,
  ad.updated_at
FROM article_drafts ad;

-- ============================================
-- INDEXES FOR COMMON QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_approvals_user_pending ON approvals(assigned_to_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_article_drafts_state_deadline ON article_drafts(state, deadline) WHERE state IN ('pending_review', 'in_review');
CREATE INDEX IF NOT EXISTS idx_content_flags_open_severity ON content_flags(status, severity) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_editorial_comments_unresolved ON editorial_comments(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_change_requests_pending_by_article ON change_requests(article_id, status) WHERE status = 'pending';
