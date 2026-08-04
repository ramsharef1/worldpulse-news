import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import { flagContent, resolveFlag, logWorkflowAction } from '@/lib/workflow-utils';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/flags
// List content flags (review queue)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'open';
    const severity = searchParams.get('severity');
    const flagType = searchParams.get('flag_type');
    const sortBy = searchParams.get('sort_by') || 'severity';

    let sql = `
      SELECT cf.*, ad.title, ad.deadline, u.name as flagged_by_name,
             au.name as assigned_to_name
      FROM content_flags cf
      JOIN article_drafts ad ON cf.draft_id = ad.id
      LEFT JOIN users u ON cf.flagged_by_id = u.id
      LEFT JOIN users au ON cf.assigned_to_id = au.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND cf.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (severity) {
      sql += ` AND cf.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (flagType) {
      sql += ` AND cf.flag_type = $${paramIndex}`;
      params.push(flagType);
      paramIndex++;
    }

    if (sortBy === 'severity') {
      sql += ` ORDER BY CASE cf.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, cf.created_at DESC`;
    } else if (sortBy === 'recent') {
      sql += ` ORDER BY cf.created_at DESC`;
    } else if (sortBy === 'deadline') {
      sql += ` ORDER BY ad.deadline ASC NULLS LAST`;
    }

    sql += ` LIMIT 200`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      flags: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching flags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flags' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/flags
// Create new content flag
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:review_queue')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to flag content');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.article_id || !body.draft_id || !body.flag_type || !body.description) {
      return badRequest(
        'Missing required fields: article_id, draft_id, flag_type, description'
      );
    }

    if (!['spam', 'inappropriate', 'factual_error', 'formatting', 'other'].includes(body.flag_type)) {
      return badRequest('Invalid flag_type. Must be: spam, inappropriate, factual_error, formatting, or other');
    }

    if (!['low', 'medium', 'high', 'critical'].includes(body.severity || 'medium')) {
      return badRequest('Invalid severity. Must be: low, medium, high, or critical');
    }

    const result = await flagContent(
      body.article_id,
      body.draft_id,
      body.flag_type,
      body.severity || 'medium',
      body.description,
      auth.user.userId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get full flag with user info
    const fullFlag = await query(
      `SELECT cf.*, ad.title, u.name as flagged_by_name
       FROM content_flags cf
       JOIN article_drafts ad ON cf.draft_id = ad.id
       LEFT JOIN users u ON cf.flagged_by_id = u.id
       WHERE cf.id = $1`,
      [result.flag.id]
    );

    return NextResponse.json({
      success: true,
      flag: fullFlag.rows[0],
      message: 'Content flagged successfully',
    });
  } catch (error) {
    console.error('Error creating flag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create flag' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/flags
// Resolve or reassign flag
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const body = await request.json();

    if (!body.flag_id || !body.action) {
      return badRequest('Missing required fields: flag_id, action (resolve/assign)');
    }

    if (!['resolve', 'assign'].includes(body.action)) {
      return badRequest('Action must be either "resolve" or "assign"');
    }

    // Get flag
    const flagResult = await query(
      'SELECT * FROM content_flags WHERE id = $1',
      [body.flag_id]
    );

    if (flagResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flag not found' },
        { status: 404 }
      );
    }

    const flag = flagResult.rows[0];

    if (body.action === 'resolve') {
      if (!body.resolution_notes) {
        return badRequest('Resolution notes are required');
      }

      const result = await resolveFlag(body.flag_id, auth.user.userId, body.resolution_notes);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      const updated = await query(
        `SELECT cf.*, ad.title, u.name as resolved_by_name
         FROM content_flags cf
         JOIN article_drafts ad ON cf.draft_id = ad.id
         LEFT JOIN users u ON cf.resolved_by_id = u.id
         WHERE cf.id = $1`,
        [body.flag_id]
      );

      return NextResponse.json({
        success: true,
        flag: updated.rows[0],
        message: 'Flag resolved successfully',
      });
    } else if (body.action === 'assign') {
      if (!body.assigned_to_id) {
        return badRequest('assigned_to_id is required for assignment');
      }

      // Update assignment
      const result = await query(
        `UPDATE content_flags
         SET assigned_to_id = $1, status = 'investigating'
         WHERE id = $2
         RETURNING *`,
        [body.assigned_to_id, body.flag_id]
      );

      const updated = await query(
        `SELECT cf.*, ad.title, u.name as assigned_to_name
         FROM content_flags cf
         JOIN article_drafts ad ON cf.draft_id = ad.id
         LEFT JOIN users u ON cf.assigned_to_id = u.id
         WHERE cf.id = $1`,
        [body.flag_id]
      );

      return NextResponse.json({
        success: true,
        flag: updated.rows[0],
        message: 'Flag assigned successfully',
      });
    }
  } catch (error) {
    console.error('Error updating flag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update flag' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/workflow/flags/queue
// Get review queue dashboard stats
// ============================================

export async function GET_QUEUE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get flag counts by status
    const statusCounts = await query(
      `SELECT status, COUNT(*) as count
       FROM content_flags
       WHERE status IN ('open', 'investigating', 'resolved')
       GROUP BY status`
    );

    // Get flag counts by severity
    const severityCounts = await query(
      `SELECT severity, COUNT(*) as count
       FROM content_flags
       WHERE status = 'open'
       GROUP BY severity
       ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END`
    );

    // Get flag counts by type
    const typeCounts = await query(
      `SELECT flag_type, COUNT(*) as count
       FROM content_flags
       WHERE status = 'open'
       GROUP BY flag_type`
    );

    // Get oldest open flag
    const oldestFlag = await query(
      `SELECT cf.*, ad.title FROM content_flags cf
       JOIN article_drafts ad ON cf.draft_id = ad.id
       WHERE cf.status = 'open'
       ORDER BY cf.created_at ASC
       LIMIT 1`
    );

    // Get user's assigned flags
    const userFlags = await query(
      `SELECT COUNT(*) as count FROM content_flags
       WHERE assigned_to_id = $1 AND status = 'investigating'`,
      [auth.user.userId]
    );

    return NextResponse.json({
      success: true,
      queue: {
        byStatus: statusCounts.rows,
        bySeverity: severityCounts.rows,
        byType: typeCounts.rows,
        oldestOpen: oldestFlag.rows[0] || null,
        userAssignedCount: userFlags.rows[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue stats' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/workflow/flags/[id]
// Dismiss a flag
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const flagId = searchParams.get('id');

    if (!flagId) {
      return badRequest('Missing required parameter: id');
    }

    // Get flag
    const flagResult = await query(
      'SELECT * FROM content_flags WHERE id = $1',
      [flagId]
    );

    if (flagResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flag not found' },
        { status: 404 }
      );
    }

    const flag = flagResult.rows[0];

    // Only allow dismissal if open
    if (flag.status !== 'open') {
      return badRequest('Only open flags can be dismissed');
    }

    // Update flag to dismissed
    await query(
      `UPDATE content_flags
       SET status = 'dismissed'
       WHERE id = $1`,
      [flagId]
    );

    return NextResponse.json({
      success: true,
      message: 'Flag dismissed successfully',
    });
  } catch (error) {
    console.error('Error dismissing flag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to dismiss flag' },
      { status: 500 }
    );
  }
}
