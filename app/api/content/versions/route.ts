import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getVersionHistory, rollbackToVersion, annotateVersion, getVersionAnnotations, compareVersions } from '@/lib/content-versioning';

// GET - Get version history for content
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contentId = searchParams.get('content_id');
    const entityType = searchParams.get('entity_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');

    if (!contentId || !entityType) {
      return NextResponse.json(
        { success: false, error: 'Content ID and entity type required' },
        { status: 400 }
      );
    }

    if (action === 'compare') {
      // Compare two versions
      const version1Id = searchParams.get('version1_id');
      const version2Id = searchParams.get('version2_id');

      if (!version1Id || !version2Id) {
        return NextResponse.json(
          { success: false, error: 'Both version IDs required for comparison' },
          { status: 400 }
        );
      }

      const v1Result = await query('SELECT * FROM content_versions WHERE id = $1', [version1Id]);
      const v2Result = await query('SELECT * FROM content_versions WHERE id = $1', [version2Id]);

      if (v1Result.rows.length === 0 || v2Result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
      }

      const version1 = {
        ...v1Result.rows[0],
        data: JSON.parse(v1Result.rows[0].data),
        changes: JSON.parse(v1Result.rows[0].changes),
      };

      const version2 = {
        ...v2Result.rows[0],
        data: JSON.parse(v2Result.rows[0].data),
        changes: JSON.parse(v2Result.rows[0].changes),
      };

      const diff = compareVersions(version1, version2);

      return NextResponse.json({
        success: true,
        version1: {
          id: version1.id,
          version_number: version1.version_number,
          created_at: version1.created_at,
          changed_by: version1.changed_by,
        },
        version2: {
          id: version2.id,
          version_number: version2.version_number,
          created_at: version2.created_at,
          changed_by: version2.changed_by,
        },
        diff,
      });
    }

    // Default: Get version history
    const versions = await getVersionHistory(contentId, entityType, limit);

    // Get annotations for each version
    const versionsWithAnnotations = await Promise.all(
      versions.map(async (version) => {
        const annotations = await getVersionAnnotations(version.id);
        return {
          ...version,
          annotations,
        };
      })
    );

    return NextResponse.json({
      success: true,
      contentId,
      entityType,
      totalVersions: versionsWithAnnotations.length,
      versions: versionsWithAnnotations,
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Rollback or annotate versions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const userId = request.headers.get('X-User-Id') || 'system';

    if (action === 'rollback') {
      const { content_id, entity_type, version_number } = body;

      if (!content_id || !entity_type || !version_number) {
        return NextResponse.json(
          { success: false, error: 'Content ID, entity type, and version number required' },
          { status: 400 }
        );
      }

      try {
        const rolledBackData = await rollbackToVersion(content_id, entity_type, version_number, userId);

        return NextResponse.json({
          success: true,
          message: `Successfully rolled back to version ${version_number}`,
          data: rolledBackData,
        });
      } catch (err) {
        return NextResponse.json(
          { success: false, error: (err as Error).message },
          { status: 404 }
        );
      }
    }

    if (action === 'annotate') {
      const { version_id, field, note } = body;

      if (!version_id || !field || !note) {
        return NextResponse.json(
          { success: false, error: 'Version ID, field, and note required' },
          { status: 400 }
        );
      }

      const annotation = await annotateVersion(version_id, field, note, userId);

      return NextResponse.json({
        success: true,
        message: 'Annotation added successfully',
        annotation,
      });
    }

    if (action === 'get_annotations') {
      const { version_id } = body;

      if (!version_id) {
        return NextResponse.json(
          { success: false, error: 'Version ID required' },
          { status: 400 }
        );
      }

      const annotations = await getVersionAnnotations(version_id);

      return NextResponse.json({
        success: true,
        versionId: version_id,
        annotations,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing version action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete version (archive)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { version_id } = body;

    if (!version_id) {
      return NextResponse.json(
        { success: false, error: 'Version ID required' },
        { status: 400 }
      );
    }

    // Soft delete version by marking it as archived
    const result = await query(
      'UPDATE content_versions SET archived_at = NOW() WHERE id = $1 RETURNING id',
      [version_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Version archived successfully',
    });
  } catch (error) {
    console.error('Error archiving version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive version', details: (error as Error).message },
      { status: 500 }
    );
  }
}
