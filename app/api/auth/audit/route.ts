import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, badRequest, forbidden } from '@/lib/auth-middleware';
import { authMiddleware } from '@/lib/auth-middleware';

// ============================================
// GET /api/auth/audit - Get audit logs
// ============================================

export async function GET(request: NextRequest) {
  try {
    const requireAdmin = await requireRole(['super_admin', 'admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const days = parseInt(url.searchParams.get('days') || '30');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let queryStr = `
      SELECT
        a.id,
        a.user_id,
        u.email,
        u.first_name,
        u.last_name,
        a.action,
        a.entity_type,
        a.entity_id,
        a.changes,
        a.ip_address,
        a.timestamp
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.timestamp > NOW() - INTERVAL '${days} days'
    `;

    const params: any[] = [];

    if (userId) {
      queryStr += ` AND a.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (action) {
      queryStr += ` AND a.action = $${params.length + 1}`;
      params.push(action);
    }

    queryStr += ` ORDER BY a.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const logsResult = await query(queryStr, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as count
      FROM audit_log a
      WHERE a.timestamp > NOW() - INTERVAL '${days} days'
    `;

    const countParams: any[] = [];

    if (userId) {
      countQuery += ` AND a.user_id = $${countParams.length + 1}`;
      countParams.push(userId);
    }

    if (action) {
      countQuery += ` AND a.action = $${countParams.length + 1}`;
      countParams.push(action);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const logs = logsResult.rows.map((log) => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.email,
      userName: `${log.first_name} ${log.last_name}`,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      changes: log.changes,
      ipAddress: log.ip_address,
      timestamp: log.timestamp,
    }));

    return NextResponse.json(
      {
        success: true,
        logs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/auth/audit/summary - Get audit summary
// ============================================

export async function POST(request: NextRequest) {
  try {
    const requireAdmin = await requireRole(['super_admin', 'admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Get audit summary
    const summaryResult = await query(`
      SELECT
        action,
        COUNT(*) as count,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM audit_log
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY action
      ORDER BY count DESC
    `);

    const summary = summaryResult.rows.map((item) => ({
      action: item.action,
      count: parseInt(item.count),
      firstOccurrence: item.first_occurrence,
      lastOccurrence: item.last_occurrence,
    }));

    // Get user activity
    const userActivityResult = await query(`
      SELECT
        a.user_id,
        u.email,
        COUNT(*) as action_count,
        COUNT(DISTINCT a.action) as unique_actions
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.timestamp > NOW() - INTERVAL '7 days'
      GROUP BY a.user_id, u.email
      ORDER BY action_count DESC
      LIMIT 10
    `);

    const userActivity = userActivityResult.rows.map((item) => ({
      userId: item.user_id,
      email: item.email,
      actionCount: parseInt(item.action_count),
      uniqueActions: parseInt(item.unique_actions),
    }));

    return NextResponse.json(
      {
        success: true,
        summary: {
          byAction: summary,
          topUsers: userActivity,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get audit summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/auth/audit/user/:userId - Get user's audit history
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return badRequest('User ID is required');
    }

    // Users can only view their own audit logs unless they're admin
    if (
      auth.user.userId !== userId &&
      !['super_admin', 'admin'].includes(auth.user.role)
    ) {
      return forbidden('Cannot view other user audit logs');
    }

    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const logsResult = await query(
      `SELECT
        id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        timestamp
       FROM audit_log
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as count FROM audit_log WHERE user_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);

    const logs = logsResult.rows.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      changes: log.changes,
      ipAddress: log.ip_address,
      timestamp: log.timestamp,
    }));

    return NextResponse.json(
      {
        success: true,
        logs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user audit history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/auth/audit - Archive/delete old audit logs
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const requireAdmin = await requireRole(['super_admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { olderThanDays = 365 } = await request.json();

    // Delete logs older than specified days
    const result = await query(
      `DELETE FROM audit_log
       WHERE timestamp < NOW() - INTERVAL '${olderThanDays} days'`,
    );

    // Log this action
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, changes)
       VALUES ($1, $2, $3, $4)`,
      [
        auth.user.userId,
        'archive_audit_logs',
        'audit',
        JSON.stringify({ deletedCount: result.rowCount, olderThanDays }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: `${result.rowCount} audit logs archived`,
        deletedCount: result.rowCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Archive audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
