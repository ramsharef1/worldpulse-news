import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authMiddleware, forbidden, badRequest } from '@/lib/auth-middleware';
import {
  generateExportFile,
  prepareArticlePerformanceExport,
  prepareUniversityStatsExport,
  prepareEditorialMetricsExport,
  generatePDFExport,
} from '@/lib/analytics-export';

/**
 * POST /api/analytics/reports/export
 * Generate and export a report in CSV, Excel, or PDF format
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const { reportId, format, reportType, startDate, endDate, universityId } =
      await request.json();

    // Validate inputs
    if (!reportType || !format) {
      return badRequest('Report type and format are required');
    }

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return badRequest('Invalid format. Use csv, excel, or pdf');
    }

    // Validate date range
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (start > end) {
      return badRequest('Start date must be before end date');
    }

    let exportData: any = [];
    let reportTitle = '';

    // Generate report data based on type
    switch (reportType) {
      case 'article_performance':
        reportTitle = 'Article Performance Report';
        exportData = await prepareArticlePerformanceExport(
          start,
          end,
          universityId
        );
        break;

      case 'university_stats':
        reportTitle = 'University Statistics Report';
        exportData = await prepareUniversityStatsExport(start, end);
        break;

      case 'editorial_metrics':
        reportTitle = 'Editorial Team Metrics Report';
        exportData = await prepareEditorialMetricsExport(start, end);
        break;

      default:
        return badRequest(`Unknown report type: ${reportType}`);
    }

    if (!exportData || exportData.length === 0) {
      return NextResponse.json(
        {
          error: 'No data available for the specified criteria',
        },
        { status: 400 }
      );
    }

    // Generate export file
    const exportResult = await generateExportFile(exportData, {
      format: format as 'csv' | 'excel' | 'pdf',
      filename: `${reportType}_${new Date().toISOString().slice(0, 10)}`,
    });

    // Log report generation
    if (reportId) {
      await query(
        `
        INSERT INTO generated_reports
          (report_id, generated_by, file_format, data_json, period_start, period_end, row_count, generated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `,
        [
          reportId,
          auth.user.userId,
          format,
          JSON.stringify(exportData),
          start,
          end,
          exportData.length,
        ]
      );
    }

    // Log the download
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Return appropriate response based on format
    if (format === 'pdf') {
      // For PDF, return HTML that can be printed/converted
      return new NextResponse(exportResult.buffer as string, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${exportResult.filename}"`,
        },
      });
    } else {
      // For CSV and Excel, return binary data
      return new NextResponse(exportResult.buffer as Buffer, {
        status: 200,
        headers: {
          'Content-Type': exportResult.contentType,
          'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
          'Content-Length': (
            exportResult.buffer as Buffer
          ).length.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Report export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report export' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/reports/export
 * Get export template or preview
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('report_id');
    const action = searchParams.get('action') || 'preview'; // preview or download

    if (!reportId) {
      return badRequest('Report ID is required');
    }

    // Get report details
    const reportResult = await query(
      `
      SELECT
        id,
        name,
        report_type,
        owner_id,
        filters,
        columns,
        language
      FROM report_definitions
      WHERE id = $1
    `,
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = reportResult.rows[0];

    // Verify access
    if (report.owner_id !== auth.user.userId && auth.user.role !== 'super_admin') {
      return forbidden('You do not have permission to access this report');
    }

    if (action === 'preview') {
      // Get sample data
      const limit = 10;
      let sampleData: any = [];

      switch (report.report_type) {
        case 'article_performance':
          const articleResult = await query(
            `
            SELECT
              a.id,
              a.title_en,
              a.status,
              SUM(apm.views) as views
            FROM articles a
            LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
            WHERE a.status = 'published'
            GROUP BY a.id
            LIMIT $1
          `,
            [limit]
          );
          sampleData = articleResult.rows;
          break;

        case 'university_stats':
          const uniResult = await query(
            `
            SELECT
              u.id,
              u.name_en,
              COUNT(DISTINCT a.id) as articles
            FROM universities u
            LEFT JOIN articles a ON u.id = a.university_id
            GROUP BY u.id
            LIMIT $1
          `,
            [limit]
          );
          sampleData = uniResult.rows;
          break;
      }

      return NextResponse.json(
        {
          success: true,
          report: {
            id: report.id,
            name: report.name,
            type: report.report_type,
            filters: JSON.parse(report.filters),
            columns: JSON.parse(report.columns),
          },
          preview: sampleData,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Report preview error:', error);
    return NextResponse.json(
      { error: 'Failed to get report preview' },
      { status: 500 }
    );
  }
}
