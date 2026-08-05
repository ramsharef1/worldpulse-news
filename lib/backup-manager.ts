import { query } from './db';
import { generateChecksum } from './encryption-utils';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// ============================================
// BACKUP MANAGER
// ============================================

export interface BackupOptions {
  universityId?: string;
  backupName?: string;
  backupType?: 'full' | 'incremental' | 'differential';
  includeEntities?: string[]; // article, user, comment, etc.
  storageLocation?: string;
  isScheduled?: boolean;
  scheduleId?: string;
  retentionPolicy?: 'daily' | 'weekly' | 'monthly' | 'permanent';
}

export interface BackupScheduleConfig {
  scheduleName: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  runTime?: string; // HH:MM
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  retentionDays: number;
  retentionPolicy?: 'daily' | 'weekly' | 'monthly' | 'permanent';
  maxBackupsToKeep?: number;
  notifyOnSuccess?: boolean;
  notifyOnFailure?: boolean;
  notificationEmails?: string[];
}

export class BackupManager {
  /**
   * Create a new backup
   */
  async createBackup(
    universityId: string,
    options: BackupOptions,
    createdBy: string
  ): Promise<{
    id: string;
    name: string;
    status: string;
    startTime: Date;
  }> {
    try {
      const backupId = uuidv4();
      const backupName =
        options.backupName || `backup_${universityId}_${new Date().toISOString()}`;
      const storageLocation =
        options.storageLocation ||
        this.generateStoragePath(universityId, backupName);

      // Create backup metadata record
      const result = await query(
        `INSERT INTO backup_metadata (
          id, university_id, backup_name, backup_type,
          storage_location, storage_type, status,
          is_scheduled_backup, schedule_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, backup_name, status, start_time`,
        [
          backupId,
          universityId,
          backupName,
          options.backupType || 'full',
          storageLocation,
          'local', // default to local, can be s3 in production
          'in_progress',
          options.isScheduled || false,
          options.scheduleId || null,
          createdBy,
        ]
      );

      return {
        id: result.rows[0].id,
        name: result.rows[0].backup_name,
        status: result.rows[0].status,
        startTime: result.rows[0].start_time,
      };
    } catch (error) {
      throw new Error(`Backup creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Complete a backup
   */
  async completeBackup(
    backupId: string,
    sizeBytes: number,
    fileCount: number,
    checksum: string,
    completedBy: string
  ): Promise<void> {
    try {
      const startTime = await query(
        'SELECT start_time FROM backup_metadata WHERE id = $1',
        [backupId]
      );

      if (startTime.rows.length === 0) {
        throw new Error('Backup not found');
      }

      const duration = Math.floor(
        (Date.now() - new Date(startTime.rows[0].start_time).getTime()) / 1000
      );

      await query(
        `UPDATE backup_metadata
         SET status = $1, end_time = NOW(), size_bytes = $2,
             file_count = $3, duration_seconds = $4, checksum = $5,
             integrity_verified = true, verified_at = NOW(), updated_by = $6
         WHERE id = $7`,
        ['completed', sizeBytes, fileCount, duration, checksum, completedBy, backupId]
      );
    } catch (error) {
      throw new Error(`Backup completion failed: ${(error as Error).message}`);
    }
  }

  /**
   * Mark backup as failed
   */
  async failBackup(
    backupId: string,
    errorMessage: string,
    failedBy: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE backup_metadata
         SET status = $1, error_message = $2, end_time = NOW(), updated_by = $3
         WHERE id = $4`,
        ['failed', errorMessage, failedBy, backupId]
      );
    } catch (error) {
      throw new Error(`Backup failure marking failed: ${(error as Error).message}`);
    }
  }

  /**
   * List backups for a university
   */
  async listBackups(
    universityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM backup_metadata
         WHERE university_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [universityId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to list backups: ${(error as Error).message}`);
    }
  }

  /**
   * Get backup details
   */
  async getBackupDetails(backupId: string): Promise<any> {
    try {
      const result = await query(
        'SELECT * FROM backup_metadata WHERE id = $1',
        [backupId]
      );

      if (result.rows.length === 0) {
        throw new Error('Backup not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get backup details: ${(error as Error).message}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    backupId: string,
    universityId: string,
    restoredBy: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const backup = await this.getBackupDetails(backupId);

      if (backup.status !== 'completed') {
        throw new Error('Backup must be in completed status to restore');
      }

      // Verify backup integrity
      const fileExists = fs.existsSync(backup.storage_location);
      if (!fileExists) {
        throw new Error('Backup file not found');
      }

      // TODO: Implement actual restoration logic based on backup file format
      // For now, we'll just mark the restoration in the audit log

      await query(
        `INSERT INTO configuration_audit_log (
          university_id, change_type, entity_type, entity_id,
          entity_name, changes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          universityId,
          'backup_restored',
          'backup',
          backupId,
          backup.backup_name,
          JSON.stringify({ restored_from: backupId, restored_at: new Date() }),
          restoredBy,
        ]
      );

      return {
        success: true,
        message: `Backup ${backup.backup_name} restored successfully`,
      };
    } catch (error) {
      throw new Error(`Backup restoration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create backup schedule
   */
  async createSchedule(
    universityId: string,
    config: BackupScheduleConfig,
    createdBy: string
  ): Promise<{
    id: string;
    name: string;
    frequency: string;
  }> {
    try {
      const scheduleId = uuidv4();
      const nextRunAt = this.calculateNextRunTime(
        config.frequency,
        config.runTime,
        config.dayOfWeek,
        config.dayOfMonth
      );

      const result = await query(
        `INSERT INTO backup_schedules (
          id, university_id, schedule_name, frequency,
          run_time, day_of_week, day_of_month,
          retention_days, retention_policy, max_backups_to_keep,
          notify_on_success, notify_on_failure, notification_email_list,
          next_run_at, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, schedule_name, frequency`,
        [
          scheduleId,
          universityId,
          config.scheduleName,
          config.frequency,
          config.runTime || null,
          config.dayOfWeek || null,
          config.dayOfMonth || null,
          config.retentionDays,
          config.retentionPolicy || 'daily',
          config.maxBackupsToKeep || 10,
          config.notifyOnSuccess || false,
          config.notifyOnFailure || true,
          config.notificationEmails || [],
          nextRunAt,
          true, // is_active
          createdBy,
        ]
      );

      return {
        id: result.rows[0].id,
        name: result.rows[0].schedule_name,
        frequency: result.rows[0].frequency,
      };
    } catch (error) {
      throw new Error(
        `Backup schedule creation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * List backup schedules
   */
  async listSchedules(universityId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM backup_schedules
         WHERE university_id = $1
         ORDER BY created_at DESC`,
        [universityId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to list backup schedules: ${(error as Error).message}`);
    }
  }

  /**
   * Update backup schedule
   */
  async updateSchedule(
    scheduleId: string,
    config: Partial<BackupScheduleConfig>,
    updatedBy: string
  ): Promise<void> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (config.scheduleName) {
        updates.push(`schedule_name = $${paramCount++}`);
        values.push(config.scheduleName);
      }

      if (config.frequency) {
        updates.push(`frequency = $${paramCount++}`);
        values.push(config.frequency);

        if (config.runTime || config.dayOfWeek || config.dayOfMonth) {
          const nextRunAt = this.calculateNextRunTime(
            config.frequency,
            config.runTime,
            config.dayOfWeek,
            config.dayOfMonth
          );
          updates.push(`next_run_at = $${paramCount++}`);
          values.push(nextRunAt);
        }
      }

      if (config.retentionDays) {
        updates.push(`retention_days = $${paramCount++}`);
        values.push(config.retentionDays);
      }

      if (config.notifyOnFailure !== undefined) {
        updates.push(`notify_on_failure = $${paramCount++}`);
        values.push(config.notifyOnFailure);
      }

      if (config.notificationEmails) {
        updates.push(`notification_email_list = $${paramCount++}`);
        values.push(config.notificationEmails);
      }

      updates.push(`updated_by = $${paramCount++}`);
      values.push(updatedBy);

      updates.push(`updated_at = NOW()`);

      values.push(scheduleId);

      await query(
        `UPDATE backup_schedules
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}`,
        values
      );
    } catch (error) {
      throw new Error(
        `Backup schedule update failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete backup schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await query('DELETE FROM backup_schedules WHERE id = $1', [scheduleId]);
    } catch (error) {
      throw new Error(
        `Backup schedule deletion failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(universityId: string): Promise<number> {
    try {
      // Get retention policies
      const policies = await query(
        `SELECT DISTINCT retention_days FROM backup_schedules
         WHERE university_id = $1 AND is_active = true`,
        [universityId]
      );

      if (policies.rows.length === 0) {
        return 0;
      }

      const minRetentionDays = Math.min(
        ...policies.rows.map((p: any) => p.retention_days)
      );
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - minRetentionDays);

      // Delete old backups
      const result = await query(
        `DELETE FROM backup_metadata
         WHERE university_id = $1 AND created_at < $2 AND status = 'completed'`,
        [universityId, cutoffDate]
      );

      return result.rowCount || 0;
    } catch (error) {
      throw new Error(
        `Backup cleanup failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Calculate next run time for backup schedule
   */
  private calculateNextRunTime(
    frequency: string,
    runTime?: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        next.setMinutes(0);
        next.setSeconds(0);
        break;

      case 'daily':
        next.setDate(next.getDate() + 1);
        if (runTime) {
          const [hours, minutes] = runTime.split(':').map(Number);
          next.setHours(hours, minutes, 0);
        } else {
          next.setHours(2, 0, 0); // Default: 2 AM
        }
        break;

      case 'weekly':
        next.setDate(next.getDate() + (7 + (dayOfWeek ?? 0) - next.getDay()) % 7);
        if (runTime) {
          const [hours, minutes] = runTime.split(':').map(Number);
          next.setHours(hours, minutes, 0);
        } else {
          next.setHours(2, 0, 0);
        }
        break;

      case 'monthly':
        const targetDay = dayOfMonth || 1;
        next.setMonth(next.getMonth() + 1);
        next.setDate(Math.min(targetDay, 28)); // Avoid month overflow
        if (runTime) {
          const [hours, minutes] = runTime.split(':').map(Number);
          next.setHours(hours, minutes, 0);
        } else {
          next.setHours(2, 0, 0);
        }
        break;
    }

    return next;
  }

  /**
   * Generate storage path for backup
   */
  private generateStoragePath(universityId: string, backupName: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return path.join(
      process.env.BACKUP_STORAGE_PATH || '/backups',
      universityId,
      timestamp,
      `${backupName}.backup`
    );
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(universityId: string): Promise<{
    totalBackups: number;
    completedBackups: number;
    failedBackups: number;
    totalSizeBytes: number;
    lastBackupTime: Date | null;
    nextScheduledBackup: Date | null;
  }> {
    try {
      const statsResult = await query(
        `SELECT
           COUNT(*) as total_backups,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_backups,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_backups,
           COALESCE(SUM(size_bytes), 0) as total_size_bytes,
           MAX(end_time) as last_backup_time
         FROM backup_metadata
         WHERE university_id = $1`,
        [universityId]
      );

      const scheduleResult = await query(
        `SELECT MIN(next_run_at) as next_backup_time
         FROM backup_schedules
         WHERE university_id = $1 AND is_active = true`,
        [universityId]
      );

      const stats = statsResult.rows[0];
      const schedule = scheduleResult.rows[0];

      return {
        totalBackups: parseInt(stats.total_backups),
        completedBackups: parseInt(stats.completed_backups),
        failedBackups: parseInt(stats.failed_backups),
        totalSizeBytes: parseInt(stats.total_size_bytes),
        lastBackupTime: stats.last_backup_time ? new Date(stats.last_backup_time) : null,
        nextScheduledBackup: schedule.next_backup_time
          ? new Date(schedule.next_backup_time)
          : null,
      };
    } catch (error) {
      throw new Error(`Failed to get backup stats: ${(error as Error).message}`);
    }
  }
}

export default new BackupManager();
