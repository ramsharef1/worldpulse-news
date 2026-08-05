import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import settingsManager from '@/lib/settings-manager';

// ============================================
// GET /api/settings/audit-log
// Get configuration audit log entries
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const changeType = request.nextUrl.searchParams.get('changeType');
    const entityType = request.nextUrl.searchParams.get('entityType');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    let auditLogs = await settingsManager.getConfigurationAuditLog(
      universityId,
      limit,
      offset
    );

    // Apply optional filters
    if (changeType) {
      auditLogs = auditLogs.filter((log: any) => log.change_type === changeType);
    }

    if (entityType) {
      auditLogs = auditLogs.filter((log: any) => log.entity_type === entityType);
    }

    return NextResponse.json(
      {
        logs: auditLogs,
        pagination: { limit, offset },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit log GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit log' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/settings/audit-log/stats
// Get audit log statistics
// ============================================

export async function HEAD(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const { query } = await import('@/lib/db');

    // Get statistics
    const stats = await query(
      `SELECT
         COUNT(*) as total_entries,
         COUNT(DISTINCT change_type) as unique_change_types,
         COUNT(DISTINCT created_by) as unique_users,
         MAX(created_at) as last_change,
         COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h_changes
       FROM configuration_audit_log
       WHERE university_id = $1`,
      [universityId]
    );

    return NextResponse.json(
      { stats: stats.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit log stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit statistics' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/audit-log
// Clear old audit log entries
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const daysToKeep = parseInt(request.nextUrl.searchParams.get('daysToKeep') || '90');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const { query } = await import('@/lib/db');

    // Delete old audit entries
    const result = await query(
      `DELETE FROM configuration_audit_log
       WHERE university_id = $1 AND created_at < NOW() - INTERVAL '${daysToKeep} days'`,
      [universityId]
    );

    return NextResponse.json(
      {
        message: `Deleted ${result.rowCount} audit log entries older than ${daysToKeep} days`,
        deletedCount: result.rowCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit log DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete audit log entries' },
      { status: 500 }
    );
  }
}
