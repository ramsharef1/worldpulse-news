import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authMiddleware, requireAdminAuth, forbidden, badRequest } from '@/lib/auth-middleware';
import {
  prepareArticlePerformanceExport,
  prepareUniversityStatsExport,
  prepareEditorialMetricsExport,
} from '@/lib/analytics-export';

/**
 * GET /api/analytics/reports
 * List all reports defined by the user or system
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const isPublic = searchParams.get('is_public') === 'true';

    let query_str = `
      SELECT
        id,
        name,
        description,
        report_type,
        owner_id,
        is_public,
        is_scheduled,
        created_at,
        updated_at
      FROM report_definitions
    `;

    const params: any[] = [];

    if (reportType) {
      query_str += ` WHERE report_type = $1`;
      params.push(reportType);

      if (isPublic) {
        query_str += ` AND is_public = true`;
      } else {
        query_str += ` AND owner_id = '${auth.user.userId}'`;
      }
    } else {
      query_str += ` WHERE owner_id = '${auth.user.userId}' OR is_public = true`;
    }

    query_str += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await query(query_str, params);

    return NextResponse.json(
      {
        success: true,
        reports: result.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          type: row.report_type,
          owner: row.owner_id === auth.user.userId ? 'you' : 'shared',
          isScheduled: row.is_scheduled,
          isPublic: row.is_public,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reports list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/reports
 * Create a new report definition
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const {
      name,
      description,
      reportType,
      filters,
      columns,
      sortBy,
      sortOrder,
      language,
    } = await request.json();

    // Validate required fields
    if (!name || !reportType) {
      return badRequest('Name and report type are required');
    }

    const result = await query(
      `
      INSERT INTO report_definitions
        (name, description, report_type, owner_id, filters, columns, sort_by, sort_order, language, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, name, report_type, created_at
    `,
      [
        name,
        description || null,
        reportType,
        auth.user.userId,
        JSON.stringify(filters || {}),
        JSON.stringify(columns || []),
        sortBy || 'created_at',
        sortOrder || 'DESC',
        language || 'en',
      ]
    );

    const report = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        report: {
          id: report.id,
          name: report.name,
          type: report.report_type,
          createdAt: report.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Report creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/reports
 * Delete a report
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return badRequest('Report ID is required');
    }

    // Verify ownership
    const ownerResult = await query(
      'SELECT owner_id FROM report_definitions WHERE id = $1',
      [reportId]
    );

    if (
      ownerResult.rows.length === 0 ||
      ownerResult.rows[0].owner_id !== auth.user.userId
    ) {
      return forbidden('You do not have permission to delete this report');
    }

    await query('DELETE FROM report_definitions WHERE id = $1', [reportId]);

    return NextResponse.json(
      { success: true, message: 'Report deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Report deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
