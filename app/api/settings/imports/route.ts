import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { DataImporter } from '@/lib/data-export-import';
import settingsManager from '@/lib/settings-manager';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// GET /api/settings/imports
// List import jobs
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
      `SELECT * FROM data_import_jobs
       WHERE university_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [universityId, limit, offset]
    );

    return NextResponse.json(
      {
        imports: result.rows,
        pagination: { limit, offset },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Imports GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve imports' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/imports
// Create a new data import job
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
      importName,
      entityType,
      importFormat,
      fileContent,
      skipOnError,
      createNewRecords,
      updateExistingRecords,
      duplicateHandling,
    } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!entityType) {
      return badRequest('entityType is required');
    }

    if (!importFormat || !['csv', 'json', 'xml'].includes(importFormat)) {
      return badRequest('importFormat must be one of: csv, json, xml');
    }

    if (!fileContent) {
      return badRequest('fileContent is required');
    }

    const importer = new DataImporter();
    const importId = uuidv4();

    try {
      // Parse the import data
      const data = await importer.parseData(fileContent, importFormat);

      // Validate the import data
      const requiredFields = getRequiredFieldsForEntityType(entityType);
      const validation = await importer.validateImportData(
        data,
        entityType,
        requiredFields
      );

      if (!validation.valid && !skipOnError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            errors: validation.errors,
          },
          { status: 400 }
        );
      }

      // Create import job record
      const result = await query(
        `INSERT INTO data_import_jobs (
          id, university_id, import_name, entity_type, import_format,
          total_records, status, skip_on_error, create_new_records,
          update_existing_records, duplicate_handling, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          importId,
          universityId,
          importName || `${entityType}_import_${Date.now()}`,
          entityType,
          importFormat,
          data.length,
          'in_progress',
          skipOnError || false,
          createNewRecords !== false,
          updateExistingRecords !== false,
          duplicateHandling || 'skip',
          auth.user.userId,
        ]
      );

      const importJob = result.rows[0];

      // Perform the import based on entity type
      let importResult: any = { successful: 0, failed: 0, errors: [] };

      if (entityType === 'article') {
        importResult = await importer.importArticles(
          universityId,
          data,
          auth.user.userId,
          {
            entityType,
            format: importFormat,
            skipOnError: skipOnError || false,
            createNewRecords: createNewRecords !== false,
            updateExistingRecords: updateExistingRecords !== false,
            duplicateHandling: duplicateHandling || 'skip',
          }
        );
      }

      // Update import job status
      await query(
        `UPDATE data_import_jobs
         SET status = $1, processed_records = $2, successful_records = $3,
             failed_records = $4, progress_percent = 100, completed_at = NOW(),
             validation_errors = $5
         WHERE id = $6`,
        [
          importResult.failed === 0 ? 'completed' : 'completed_with_errors',
          importResult.successful + importResult.failed,
          importResult.successful,
          importResult.failed,
          JSON.stringify(importResult.errors),
          importId,
        ]
      );

      // Log to audit
      await settingsManager.logConfigurationChange(
        universityId,
        'data_import_completed',
        'data_import',
        importId,
        importName,
        {
          entity_type: entityType,
          format: importFormat,
          successful: importResult.successful,
          failed: importResult.failed,
        },
        auth.user.userId,
        request.headers.get('x-forwarded-for')?.split(',')[0]
      );

      return NextResponse.json(
        {
          message: 'Data import completed',
          import: {
            ...importJob,
            status: importResult.failed === 0 ? 'completed' : 'completed_with_errors',
            result: importResult,
          },
        },
        { status: 201 }
      );
    } catch (importError) {
      // Mark as failed
      await query(
        `UPDATE data_import_jobs
         SET status = $1, error_message = $2, completed_at = NOW()
         WHERE id = $3`,
        ['failed', (importError as Error).message, importId]
      );

      throw importError;
    }
  } catch (error) {
    console.error('Imports POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create import' },
      { status: 500 }
    );
  }
}

/**
 * Get required fields for entity type
 */
function getRequiredFieldsForEntityType(entityType: string): string[] {
  const fieldsMap: Record<string, string[]> = {
    article: ['title_en', 'title_ar'],
    user: ['email'],
    comment: ['content', 'article_id'],
  };

  return fieldsMap[entityType] || [];
}
