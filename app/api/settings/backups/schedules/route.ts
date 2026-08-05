import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { BackupManager } from '@/lib/backup-manager';
import settingsManager from '@/lib/settings-manager';
import { SchemaValidator, CommonSchemas } from '@/lib/data-validation';

// ============================================
// GET /api/settings/backups/schedules
// List backup schedules
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

    const backupManager = new BackupManager();
    const schedules = await backupManager.listSchedules(universityId);

    return NextResponse.json({ schedules }, { status: 200 });
  } catch (error) {
    console.error('Backup schedules GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve schedules' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/backups/schedules
// Create a backup schedule
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, schedule } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!schedule) {
      return badRequest('schedule configuration is required');
    }

    // Validate schedule
    const validator = new SchemaValidator();
    const validation = validator.validate(schedule, CommonSchemas.backupSchedule);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const backupManager = new BackupManager();

    const createdSchedule = await backupManager.createSchedule(
      universityId,
      {
        scheduleName: schedule.scheduleName,
        frequency: schedule.frequency,
        runTime: schedule.runTime,
        dayOfWeek: schedule.dayOfWeek,
        dayOfMonth: schedule.dayOfMonth,
        retentionDays: schedule.retentionDays,
        retentionPolicy: schedule.retentionPolicy,
        maxBackupsToKeep: schedule.maxBackupsToKeep,
        notifyOnSuccess: schedule.notifyOnSuccess,
        notifyOnFailure: schedule.notifyOnFailure,
        notificationEmails: schedule.notificationEmails,
      },
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'backup_schedule_created',
      'backup_schedule',
      createdSchedule.id,
      createdSchedule.name,
      schedule,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Backup schedule created successfully',
        schedule: createdSchedule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Backup schedules POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup schedule' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/settings/backups/schedules?id=...
// Update a backup schedule
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const scheduleId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!scheduleId) {
      return badRequest('Schedule ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const body = await request.json();

    const backupManager = new BackupManager();

    await backupManager.updateSchedule(scheduleId, body, auth.user.userId);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'backup_schedule_updated',
      'backup_schedule',
      scheduleId,
      null,
      body,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      { message: 'Backup schedule updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backup schedules PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update backup schedule' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/backups/schedules?id=...
// Delete a backup schedule
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const scheduleId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!scheduleId) {
      return badRequest('Schedule ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const backupManager = new BackupManager();
    await backupManager.deleteSchedule(scheduleId);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'backup_schedule_deleted',
      'backup_schedule',
      scheduleId,
      null,
      {},
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      { message: 'Backup schedule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Backup schedules DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup schedule' },
      { status: 500 }
    );
  }
}
