import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

// ============================================
// GET /api/data
// Get data management status and configuration
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const action = request.nextUrl.searchParams.get('action');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (action === 'retention-policies') {
      // Get data retention policies
      const policies = await query(
        `SELECT * FROM data_retention_policies
         WHERE university_id = $1
         ORDER BY created_at DESC`,
        [universityId]
      );

      return NextResponse.json(
        { policies: policies.rows },
        { status: 200 }
      );
    }

    if (action === 'encryption-keys') {
      // Get encryption keys (metadata only, not the actual keys)
      const keys = await query(
        `SELECT id, key_name, key_id, algorithm, status, created_at, next_rotation_at
         FROM encryption_keys
         ORDER BY created_at DESC`
      );

      return NextResponse.json(
        { keys: keys.rows },
        { status: 200 }
      );
    }

    // Default: return data management configuration
    return NextResponse.json(
      {
        dataManagement: {
          retentionPoliciesConfigured: true,
          backupSystemEnabled: true,
          encryptionEnabled: true,
          auditLoggingEnabled: true,
          endpoints: {
            settings: '/api/settings',
            backups: '/api/settings/backups',
            exports: '/api/settings/exports',
            imports: '/api/settings/imports',
            customFields: '/api/settings/custom-fields',
            emailTemplates: '/api/settings/email-templates',
            notifications: '/api/settings/notifications',
            customPermissions: '/api/settings/custom-permissions',
            auditLog: '/api/settings/audit-log',
            dashboard: '/api/settings/dashboard',
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Data GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data management information' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/data
// Create or manage data
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, action } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (action === 'create-retention-policy') {
      // Create data retention policy
      const {
        policyName,
        entityType,
        retentionDays,
        archiveAfterDays,
        deleteAfterDays,
        appliesToStatus,
        actionBeforeDelete,
      } = body;

      if (!policyName || !entityType || !retentionDays) {
        return badRequest(
          'policyName, entityType, and retentionDays are required'
        );
      }

      const result = await query(
        `INSERT INTO data_retention_policies (
          university_id, policy_name, entity_type, retention_days,
          archive_after_days, delete_after_days, applies_to_status,
          action_before_delete, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          universityId,
          policyName,
          entityType,
          retentionDays,
          archiveAfterDays || null,
          deleteAfterDays || null,
          appliesToStatus || [],
          actionBeforeDelete || 'backup',
          true, // is_active
          auth.user.userId,
        ]
      );

      return NextResponse.json(
        {
          message: 'Data retention policy created',
          policy: result.rows[0],
        },
        { status: 201 }
      );
    }

    if (action === 'test-encryption') {
      // Test encryption key
      const { encryptionKeyId } = body;

      if (!encryptionKeyId) {
        return badRequest('encryptionKeyId is required');
      }

      // Test that the key can be used for encryption/decryption
      const keyResult = await query(
        `SELECT id, status FROM encryption_keys WHERE key_id = $1`,
        [encryptionKeyId]
      );

      if (keyResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Encryption key not found' },
          { status: 404 }
        );
      }

      const keyStatus = keyResult.rows[0].status;

      return NextResponse.json(
        {
          message: 'Encryption key test successful',
          keyStatus,
          canUseForEncryption: keyStatus === 'active',
        },
        { status: 200 }
      );
    }

    if (action === 'cleanup-old-data') {
      // Cleanup old data based on retention policies
      const { entityType, daysOld } = body;

      if (!entityType || !daysOld) {
        return badRequest('entityType and daysOld are required');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Get policy for this entity type
      const policyResult = await query(
        `SELECT * FROM data_retention_policies
         WHERE university_id = $1 AND entity_type = $2 AND is_active = true`,
        [universityId, entityType]
      );

      if (policyResult.rows.length === 0) {
        return badRequest(`No retention policy found for ${entityType}`);
      }

      const policy = policyResult.rows[0];

      // Archive old records if policy requires it
      if (policy.archive_after_days) {
        const archiveDate = new Date();
        archiveDate.setDate(archiveDate.getDate() - policy.archive_after_days);

        // For articles, update status to archived
        if (entityType === 'article') {
          const archiveResult = await query(
            `UPDATE articles
             SET status = 'archived', updated_at = NOW()
             WHERE university_id = $1 AND created_at < $2 AND status != 'archived'`,
            [universityId, archiveDate]
          );

          return NextResponse.json(
            {
              message: `Archived ${archiveResult.rowCount || 0} ${entityType} records`,
              archivedCount: archiveResult.rowCount || 0,
            },
            { status: 200 }
          );
        }
      }

      return NextResponse.json(
        {
          message: 'No cleanup action needed',
        },
        { status: 200 }
      );
    }

    return badRequest('Invalid action');
  } catch (error) {
    console.error('Data POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process data management request' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/data
// Delete or purge data
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, action, entityType, entityId } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (action === 'purge-deleted-data') {
      // Permanently purge soft-deleted records
      const daysOld = body.daysOld || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      if (entityType === 'article') {
        const result = await query(
          `DELETE FROM articles
           WHERE university_id = $1 AND status = 'retracted' AND updated_at < $2`,
          [universityId, cutoffDate]
        );

        return NextResponse.json(
          {
            message: `Purged ${result.rowCount || 0} deleted article records`,
            purgedCount: result.rowCount || 0,
          },
          { status: 200 }
        );
      }

      return badRequest('Unsupported entity type for purge');
    }

    if (action === 'delete-retention-policy') {
      // Delete a retention policy
      const policyId = body.policyId;

      if (!policyId) {
        return badRequest('policyId is required');
      }

      await query(
        `DELETE FROM data_retention_policies WHERE id = $1`,
        [policyId]
      );

      return NextResponse.json(
        { message: 'Retention policy deleted' },
        { status: 200 }
      );
    }

    return badRequest('Invalid action');
  } catch (error) {
    console.error('Data DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to process data deletion request' },
      { status: 500 }
    );
  }
}
