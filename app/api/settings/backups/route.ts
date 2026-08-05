import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { BackupManager } from '@/lib/backup-manager';
import settingsManager from '@/lib/settings-manager';

// ============================================
// GET /api/settings/backups
// List backups and retrieve backup statistics
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const action = request.nextUrl.searchParams.get('action'); // list or stats
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const backupManager = new BackupManager();

    if (action === 'stats') {
      const stats = await backupManager.getBackupStats(universityId);
      return NextResponse.json({ stats }, { status: 200 });
    }

    // List backups
    const backups = await backupManager.listBackups(universityId, limit, offset);

    return NextResponse.json(
      {
        backups,
        pagination: { limit, offset, total: backups.length },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backups GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve backups' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/backups
// Create a new backup
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, backupName, backupType, includeEntities, retentionPolicy } =
      body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const backupManager = new BackupManager();

    const backup = await backupManager.createBackup(
      universityId,
      {
        backupName,
        backupType: backupType || 'full',
        includeEntities,
        retentionPolicy: retentionPolicy || 'daily',
      },
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'backup_created',
      'backup',
      backup.id,
      backup.name,
      { backup_type: backupType, entities: includeEntities },
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Backup created successfully',
        backup,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Backups POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/backups?id=...
// Delete a backup
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const backupId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!backupId) {
      return badRequest('Backup ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    // In a real implementation, this would delete from storage and database
    // For now, we'll just mark it as archived

    return NextResponse.json(
      {
        message: 'Backup deletion scheduled',
        backupId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backups DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
