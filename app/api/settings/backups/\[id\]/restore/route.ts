import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, forbidden } from '@/lib/auth-middleware';
import { BackupManager } from '@/lib/backup-manager';
import settingsManager from '@/lib/settings-manager';

// ============================================
// POST /api/settings/backups/[id]/restore
// Restore a backup
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId } = body;

    if (!universityId) {
      return NextResponse.json(
        { error: 'universityId is required' },
        { status: 400 }
      );
    }

    const backupId = params.id;

    const backupManager = new BackupManager();

    const result = await backupManager.restoreFromBackup(
      backupId,
      universityId,
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'backup_restored',
      'backup',
      backupId,
      `Restore from backup ${backupId}`,
      { restored_from: backupId, timestamp: new Date() },
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: result.message,
        success: result.success,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backup restore error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/settings/backups/[id]/restore
// Get restore status
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const backupId = params.id;
    const backupManager = new BackupManager();

    const backup = await backupManager.getBackupDetails(backupId);

    return NextResponse.json(
      {
        backup,
        canRestore: backup.status === 'completed',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backup restore GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get backup details' },
      { status: 500 }
    );
  }
}
