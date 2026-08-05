import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { DataExporter } from '@/lib/data-export-import';
import settingsManager from '@/lib/settings-manager';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// GET /api/settings/exports
// List export jobs
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const result = await query(
      `SELECT * FROM data_export_jobs
       WHERE university_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [universityId, limit, offset]
    );

    return NextResponse.json(
      {
        exports: result.rows,
        pagination: { limit, offset },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Exports GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve exports' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/exports
// Create a new data export job
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const {
      universityId,
      exportName,
      entityType,
      exportFormat,
      filters,
      includedFields,
    } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!entityType) {
      return badRequest('entityType is required');
    }

    if (!exportFormat || !['csv', 'json', 'xml'].includes(exportFormat)) {
      return badRequest(
        'exportFormat must be one of: csv, json, xml'
      );
    }

    const exporter = new DataExporter();
    const exportId = uuidv4();

    // Create export job record
    const result = await query(
      `INSERT INTO data_export_jobs (
        id, university_id, export_name, entity_type, export_format,
        filters, included_fields, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        exportId,
        universityId,
        exportName || `${entityType}_export_${Date.now()}`,
        entityType,
        exportFormat,
        JSON.stringify(filters || {}),
        JSON.stringify(includedFields || []),
        'pending',
        auth.user.userId,
      ]
    );

    const exportJob = result.rows[0];

    // Trigger export based on entity type
    try {
      let exportData = '';

      if (entityType === 'article') {
        exportData = await exporter.exportArticles(
          universityId,
          filters,
          exportFormat
        );
      } else if (entityType === 'user') {
        exportData = await exporter.exportUsers(universityId, exportFormat);
      } else {
        return badRequest(`Unsupported entity type: ${entityType}`);
      }

      // Update job status to completed
      await query(
        `UPDATE data_export_jobs
         SET status = $1, total_records = $2, processed_records = $2,
             progress_percent = 100, completed_at = NOW()
         WHERE id = $3`,
        [
          'completed',
          exportData.split('\n').length - 1,
          exportId,
        ]
      );

      // Log to audit
      await settingsManager.logConfigurationChange(
        universityId,
        'data_export_created',
        'data_export',
        exportId,
        exportName,
        { entity_type: entityType, format: exportFormat },
        auth.user.userId,
        request.headers.get('x-forwarded-for')?.split(',')[0]
      );

      return NextResponse.json(
        {
          message: 'Data export created successfully',
          export: {
            ...exportJob,
            status: 'completed',
            data: exportData,
          },
        },
        { status: 201 }
      );
    } catch (exportError) {
      // Mark as failed
      await query(
        `UPDATE data_export_jobs
         SET status = $1, error_message = $2
         WHERE id = $3`,
        ['failed', (exportError as Error).message, exportId]
      );

      throw exportError;
    }
  } catch (error) {
    console.error('Exports POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/exports?id=...
// Delete an export job
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const exportId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!exportId) {
      return badRequest('Export ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    await query('DELETE FROM data_export_jobs WHERE id = $1', [exportId]);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'data_export_deleted',
      'data_export',
      exportId,
      null,
      {},
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      { message: 'Export deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Exports DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete export' },
      { status: 500 }
    );
  }
}
