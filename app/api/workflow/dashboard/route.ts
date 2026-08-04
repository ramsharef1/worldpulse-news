import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, unauthorized } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/dashboard
// Get workflow dashboard data for admin panel
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get article statistics
    const articleStats = await query(
      `SELECT state, COUNT(*) as count
       FROM article_drafts
       GROUP BY state`
    );

    // Get pending approvals for current user
    const userPending = await query(
      `SELECT COUNT(*) as count
       FROM approvals
       WHERE assigned_to_id = $1 AND status = 'pending'`,
      [auth.user.userId]
    );

    // Get overdue items
    const overdue = await query(
      `SELECT COUNT(*) as count
       FROM article_drafts
       WHERE deadline < NOW() AND state NOT IN ('published', 'rejected')`
    );

    // Get open flags by severity
    const flagsBySeverity = await query(
      `SELECT severity, COUNT(*) as count
       FROM content_flags
       WHERE status = 'open'
       GROUP BY severity
       ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END`
    );

    // Get total open flags
    const openFlags = await query(
      `SELECT COUNT(*) as count FROM content_flags WHERE status = 'open'`
    );

    // Get unresolved comments count
    const unresolvedComments = await query(
      `SELECT COUNT(*) as count FROM editorial_comments WHERE is_resolved = FALSE`
    );

    // Get pending changes count
    const pendingChanges = await query(
      `SELECT COUNT(*) as count FROM change_requests WHERE status = 'pending'`
    );

    // Get recent activity
    const recentActivity = await query(
      `SELECT wh.*, u.name as actor_name, ad.title
       FROM workflow_history wh
       LEFT JOIN users u ON wh.actor_id = u.id
       LEFT JOIN article_drafts ad ON wh.draft_id = ad.id
       ORDER BY wh.created_at DESC
       LIMIT 20`
    );

    // Get approval chain health
    const approvalChains = await query(
      `SELECT ac.status, COUNT(*) as count
       FROM approval_chains ac
       GROUP BY ac.status`
    );

    // Get user workflow summary (their articles)
    const userWorkflow = await query(
      `SELECT ad.state, COUNT(*) as count
       FROM article_drafts ad
       WHERE ad.author_id = $1
       GROUP BY ad.state`,
      [auth.user.userId]
    );

    // Get items due soon (next 7 days)
    const dueSoon = await query(
      `SELECT COUNT(*) as count
       FROM article_drafts
       WHERE deadline IS NOT NULL
       AND deadline > NOW()
       AND deadline < NOW() + INTERVAL '7 days'
       AND state NOT IN ('published', 'rejected')`
    );

    // Get articles by stage in workflow
    const byStage = await query(
      `SELECT ast.display_name, COUNT(DISTINCT a.article_id) as count
       FROM approvals a
       JOIN approval_stages ast ON a.stage_id = ast.id
       WHERE a.status = 'pending'
       GROUP BY ast.display_name, ast.stage_order
       ORDER BY ast.stage_order`
    );

    return NextResponse.json({
      success: true,
      dashboard: {
        articleStats: {
          byState: articleStats.rows.reduce((acc, row) => {
            acc[row.state] = parseInt(row.count);
            return acc;
          }, {} as Record<string, number>),
        },
        userPending: parseInt(userPending.rows[0]?.count || 0),
        overdue: parseInt(overdue.rows[0]?.count || 0),
        dueSoon: parseInt(dueSoon.rows[0]?.count || 0),
        flags: {
          total: parseInt(openFlags.rows[0]?.count || 0),
          bySeverity: flagsBySeverity.rows,
        },
        comments: {
          unresolved: parseInt(unresolvedComments.rows[0]?.count || 0),
        },
        changes: {
          pending: parseInt(pendingChanges.rows[0]?.count || 0),
        },
        approvalChains: approvalChains.rows,
        userWorkflow: userWorkflow.rows,
        byStage: byStage.rows,
        recentActivity: recentActivity.rows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/workflow/dashboard/my-tasks
// Get current user's workflow tasks
// ============================================

export async function GET_MY_TASKS(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get pending approvals
    const pendingApprovals = await query(
      `SELECT a.*, ad.title, ad.deadline, ast.display_name as stage_name, u.name as author_name
       FROM approvals a
       JOIN article_drafts ad ON a.draft_id = ad.id
       JOIN approval_stages ast ON a.stage_id = ast.id
       LEFT JOIN users u ON ad.author_id = u.id
       WHERE a.assigned_to_id = $1 AND a.status = 'pending'
       ORDER BY a.deadline ASC NULLS LAST, a.created_at DESC`,
      [auth.user.userId]
    );

    // Get assigned flags
    const assignedFlags = await query(
      `SELECT cf.*, ad.title
       FROM content_flags cf
       JOIN article_drafts ad ON cf.draft_id = ad.id
       WHERE cf.assigned_to_id = $1 AND cf.status = 'investigating'
       ORDER BY CASE cf.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, cf.created_at DESC`,
      [auth.user.userId]
    );

    // Get user's articles in progress
    const articlesInProgress = await query(
      `SELECT ad.*,
              (SELECT COUNT(*) FROM approvals WHERE draft_id = ad.id AND status = 'pending') as pending_approvals,
              (SELECT COUNT(*) FROM content_flags WHERE draft_id = ad.id AND status = 'open') as open_flags
       FROM article_drafts ad
       WHERE ad.author_id = $1 AND ad.state IN ('pending_review', 'in_review')
       ORDER BY ad.deadline ASC NULLS LAST, ad.updated_at DESC`,
      [auth.user.userId]
    );

    // Count statistics
    const stats = {
      pendingApprovalsCount: pendingApprovals.rows.length,
      assignedFlagsCount: assignedFlags.rows.length,
      articlesInProgressCount: articlesInProgress.rows.length,
      overdueTasks: pendingApprovals.rows.filter(
        (a) => a.deadline && new Date(a.deadline) < new Date()
      ).length,
    };

    return NextResponse.json({
      success: true,
      tasks: {
        pendingApprovals: pendingApprovals.rows,
        assignedFlags: assignedFlags.rows,
        articlesInProgress: articlesInProgress.rows,
      },
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user tasks' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/workflow/dashboard/reports
// Get workflow analytics and reports
// ============================================

export async function GET_REPORTS(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'summary';
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate average approval time
    const approvalTime = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600) as avg_hours
       FROM approvals
       WHERE status = 'approved' AND approved_at > NOW() - INTERVAL '1 day' * $1`,
      [days]
    );

    // Get approval rate by stage
    const approvalRates = await query(
      `SELECT
        ast.display_name,
        COUNT(*) as total_approvals,
        SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND(100.0 * SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 2) as approval_rate
       FROM approvals a
       JOIN approval_stages ast ON a.stage_id = ast.id
       WHERE a.created_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY ast.display_name, ast.stage_order
       ORDER BY ast.stage_order`,
      [days]
    );

    // Get content flags trend
    const flagsTrend = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, severity
       FROM content_flags
       WHERE created_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at), severity
       ORDER BY date DESC`,
      [days]
    );

    // Get most active reviewers
    const topReviewers = await query(
      `SELECT u.name, COUNT(*) as approvals_count,
              SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
              SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
       FROM approvals a
       LEFT JOIN users u ON a.assigned_to_id = u.id
       WHERE a.created_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY u.id, u.name
       ORDER BY approvals_count DESC
       LIMIT 10`,
      [days]
    );

    // Get most problematic content types (by rejection rate)
    const rejectionRates = await query(
      `SELECT ad.category,
              COUNT(*) as total_approvals,
              SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
              ROUND(100.0 * SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) / COUNT(*), 2) as rejection_rate
       FROM approvals a
       JOIN article_drafts ad ON a.draft_id = ad.id
       WHERE a.created_at > NOW() - INTERVAL '1 day' * $1
       GROUP BY ad.category
       HAVING COUNT(*) > 5
       ORDER BY rejection_rate DESC`,
      [days]
    );

    return NextResponse.json({
      success: true,
      reports: {
        period: `${days} days`,
        averageApprovalHours: approvalTime.rows[0]?.avg_hours || 0,
        approvalRatesByStage: approvalRates.rows,
        flagsTrend: flagsTrend.rows,
        topReviewers: topReviewers.rows,
        rejectionRatesByCategory: rejectionRates.rows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
