import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { BackupManager } from '@/lib/backup-manager';
import settingsManager from '@/lib/settings-manager';
import { query } from '@/lib/db';

// ============================================
// GET /api/settings/dashboard
// Get system settings dashboard data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    // Get admin settings
    const settings = await settingsManager.getSettings(universityId);

    // Get backup statistics
    const backupManager = new BackupManager();
    const backupStats = await backupManager.getBackupStats(universityId);

    // Get custom fields count
    const customFieldsResult = await query(
      `SELECT entity_type, COUNT(*) as count
       FROM custom_fields
       WHERE university_id = $1
       GROUP BY entity_type`,
      [universityId]
    );

    // Get email templates count
    const emailTemplatesResult = await query(
      `SELECT COUNT(*) as count FROM email_templates WHERE university_id = $1`,
      [universityId]
    );

    // Get backup schedules count
    const backupSchedulesResult = await query(
      `SELECT COUNT(*) as count FROM backup_schedules WHERE university_id = $1`,
      [universityId]
    );

    // Get recent audit log entries
    const auditLogResult = await query(
      `SELECT change_type, entity_type, entity_name, created_by, created_at
       FROM configuration_audit_log
       WHERE university_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [universityId]
    );

    // Get users count
    const usersResult = await query(
      `SELECT COUNT(*) as count FROM users`
    );

    // Get articles count
    const articlesResult = await query(
      `SELECT COUNT(*) as count FROM articles WHERE university_id = $1`,
      [universityId]
    );

    const customFieldsByType = customFieldsResult.rows.reduce(
      (acc: any, row: any) => {
        acc[row.entity_type] = parseInt(row.count);
        return acc;
      },
      {}
    );

    return NextResponse.json(
      {
        dashboard: {
          settings: {
            organizationName: settings?.organizationName,
            themeMode: settings?.themeMode,
            defaultLanguage: settings?.defaultLanguage,
            timezone: settings?.timezone,
            enforce2FA: settings?.enforce2FA,
            emailNotificationsEnabled: settings?.emailNotificationsEnabled,
          },
          stats: {
            totalUsers: parseInt(usersResult.rows[0]?.count || '0'),
            totalArticles: parseInt(articlesResult.rows[0]?.count || '0'),
            customFieldsCount: {
              total: customFieldsResult.rows.length,
              byType: customFieldsByType,
            },
            emailTemplatesCount: parseInt(
              emailTemplatesResult.rows[0]?.count || '0'
            ),
            backupSchedulesCount: parseInt(
              backupSchedulesResult.rows[0]?.count || '0'
            ),
          },
          backup: {
            totalBackups: backupStats.totalBackups,
            completedBackups: backupStats.completedBackups,
            failedBackups: backupStats.failedBackups,
            totalSizeBytes: backupStats.totalSizeBytes,
            totalSizeGB: (backupStats.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
            lastBackupTime: backupStats.lastBackupTime,
            nextScheduledBackup: backupStats.nextScheduledBackup,
          },
          recentActivity: auditLogResult.rows.map((row: any) => ({
            changeType: row.change_type,
            entityType: row.entity_type,
            entityName: row.entity_name,
            createdBy: row.created_by,
            createdAt: row.created_at,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    );
  }
}
