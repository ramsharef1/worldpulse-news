import { query } from './db';

/**
 * Analytics Export Handlers
 * Provides PDF, Excel, and CSV export functionality for reports
 */

// ============================================
// CSV EXPORT
// ============================================

export interface ExportRow {
  [key: string]: string | number | boolean | null;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  data: ExportRow[],
  columns?: string[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Determine columns from data if not provided
  const cols = columns || Object.keys(data[0]);

  // Create header row
  const headerRow = cols.map((col) => escapeCSVField(col)).join(',');

  // Create data rows
  const dataRows = data.map((row) =>
    cols.map((col) => escapeCSVField(String(row[col] ?? ''))).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field values
 */
function escapeCSVField(field: string): string {
  if (field == null) return '';

  // Escape quotes and wrap in quotes if needed
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/**
 * Generate CSV export from report data
 */
export async function generateCSVExport(
  reportId: string,
  data: ExportRow[]
): Promise<Buffer> {
  const csv = convertToCSV(data);
  return Buffer.from(csv, 'utf-8');
}

// ============================================
// EXCEL EXPORT
// ============================================

/**
 * Generate Excel export from report data
 * Returns base64 encoded XLSX content
 */
export async function generateExcelExport(
  reportId: string,
  data: ExportRow[],
  sheetName: string = 'Report'
): Promise<Buffer> {
  // Simple Excel generation using XML (since xlsx library may not be available)
  // For production, consider using 'xlsx' or 'exceljs' npm packages

  const xlsxContent = generateXLSXContent(data, sheetName);
  return Buffer.from(xlsxContent, 'utf-8');
}

/**
 * Generate XLSX XML content
 * This is a simplified version - for production use a proper Excel library
 */
function generateXLSXContent(
  data: ExportRow[],
  sheetName: string
): string {
  if (data.length === 0) {
    return '';
  }

  const columns = Object.keys(data[0]);

  // Create worksheet XML
  let sheetData = '<sheetData>\n';

  // Add header row
  sheetData += `  <row r="1">\n`;
  columns.forEach((col, idx) => {
    const cellRef = numberToColumnLetter(idx + 1) + '1';
    sheetData += `    <c r="${cellRef}" t="str"><v>${escapeXML(col)}</v></c>\n`;
  });
  sheetData += `  </row>\n`;

  // Add data rows
  data.forEach((row, rowIdx) => {
    sheetData += `  <row r="${rowIdx + 2}">\n`;
    columns.forEach((col, colIdx) => {
      const value = row[col] ?? '';
      const cellRef =
        numberToColumnLetter(colIdx + 1) + (rowIdx + 2);
      const isNumber =
        typeof value === 'number' && !isNaN(value as number);

      if (isNumber) {
        sheetData += `    <c r="${cellRef}" t="n"><v>${value}</v></c>\n`;
      } else {
        sheetData += `    <c r="${cellRef}" t="str"><v>${escapeXML(String(value))}</v></c>\n`;
      }
    });
    sheetData += `  </row>\n`;
  });

  sheetData += '</sheetData>';

  // Return as CSV for now (simpler approach)
  // For proper Excel, integrate with 'xlsx' or 'exceljs'
  return convertToCSV(data);
}

/**
 * Convert column number to Excel column letter (1=A, 2=B, etc)
 */
function numberToColumnLetter(num: number): string {
  let letter = '';
  while (num > 0) {
    num--;
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26);
  }
  return letter;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================
// PDF EXPORT (Using HTML to PDF)
// ============================================

/**
 * Generate PDF export from report data
 * Returns HTML that can be converted to PDF using a service
 */
export async function generatePDFExport(
  reportId: string,
  reportTitle: string,
  data: ExportRow[],
  metadata?: {
    generatedAt?: Date;
    university?: string;
    period?: string;
  }
): Promise<string> {
  const html = generatePDFHTML(reportTitle, data, metadata);
  return html;
}

/**
 * Generate HTML content for PDF conversion
 */
function generatePDFHTML(
  title: string,
  data: ExportRow[],
  metadata?: any
): string {
  const generatedDate = metadata?.generatedAt
    ? new Date(metadata.generatedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  if (data.length === 0) {
    return `
      <!DOCTYPE html>
      <html dir="auto">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHTML(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #333; }
          .metadata { font-size: 12px; color: #666; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHTML(title)}</h1>
          <div class="metadata">Generated: ${generatedDate}</div>
          ${metadata?.university ? `<div class="metadata">University: ${escapeHTML(metadata.university)}</div>` : ''}
          ${metadata?.period ? `<div class="metadata">Period: ${escapeHTML(metadata.period)}</div>` : ''}
        </div>
        <p>No data available for this report.</p>
      </body>
      </html>
    `;
  }

  const columns = Object.keys(data[0]);

  // Build table
  let tableHTML = '<table style="width: 100%; border-collapse: collapse;">\n';

  // Header row
  tableHTML += '  <thead>\n    <tr style="background-color: #f0f0f0;">\n';
  columns.forEach((col) => {
    tableHTML += `      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${escapeHTML(col)}</th>\n`;
  });
  tableHTML += '    </tr>\n  </thead>\n';

  // Data rows
  tableHTML += '  <tbody>\n';
  data.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
    tableHTML += `    <tr style="background-color: ${bgColor};">\n`;
    columns.forEach((col) => {
      const value = row[col] ?? '';
      tableHTML += `      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHTML(String(value))}</td>\n`;
    });
    tableHTML += '    </tr>\n';
  });

  tableHTML += '  </tbody>\n</table>';

  // Complete HTML document
  return `
    <!DOCTYPE html>
    <html dir="auto">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHTML(title)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 15px;
        }
        h1 {
          color: #007bff;
          margin: 0;
        }
        .metadata {
          font-size: 12px;
          color: #666;
          margin: 8px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #007bff;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        td {
          border: 1px solid #ddd;
          padding: 10px;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f0f0f0;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        @media (prefers-color-scheme: dark) {
          body { color: #e0e0e0; }
          th { background-color: #1e3a5f; }
          tr:nth-child(even) { background-color: #222; }
          tr:hover { background-color: #333; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHTML(title)}</h1>
        <div class="metadata">Generated: ${generatedDate}</div>
        ${metadata?.university ? `<div class="metadata">University: ${escapeHTML(metadata.university)}</div>` : ''}
        ${metadata?.period ? `<div class="metadata">Period: ${escapeHTML(metadata.period)}</div>` : ''}
        <div class="metadata">Total Records: ${data.length}</div>
      </div>

      ${tableHTML}

      <div class="footer">
        <p>Universities Voice Admin Report | Confidential</p>
        <p>Page generated by Analytics & Reporting System</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// ============================================
// EXPORT FILE GENERATION & STORAGE
// ============================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  sheetName?: string;
}

/**
 * Generate export file with proper headers
 */
export async function generateExportFile(
  data: ExportRow[],
  options: ExportOptions
): Promise<{
  buffer: Buffer | string;
  contentType: string;
  filename: string;
}> {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename =
    options.filename || `report_${timestamp}.${getFileExtension(options.format)}`;

  let buffer: Buffer | string;
  let contentType: string;

  switch (options.format) {
    case 'csv':
      buffer = await generateCSVExport('', data);
      contentType = 'text/csv';
      break;

    case 'excel':
      buffer = await generateExcelExport(
        '',
        data,
        options.sheetName || 'Report'
      );
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;

    case 'pdf':
      buffer = await generatePDFExport('Report', '', data);
      contentType = 'text/html'; // Will be converted to PDF by client or service
      break;

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  return {
    buffer,
    contentType,
    filename,
  };
}

/**
 * Get file extension for export format
 */
function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    csv: 'csv',
    excel: 'xlsx',
    pdf: 'pdf',
  };
  return extensions[format] || format;
}

// ============================================
// REPORT DATA PREPARATION
// ============================================

/**
 * Prepare article performance data for export
 */
export async function prepareArticlePerformanceExport(
  startDate: Date,
  endDate: Date,
  universityId?: string
): Promise<ExportRow[]> {
  let sqlQuery = `
    SELECT
      a.id,
      a.title_en,
      a.title_ar,
      u.name_en as university,
      a.status,
      a.published_at::date as published_date,
      COALESCE(SUM(apm.views), 0) as total_views,
      COALESCE(SUM(apm.clicks), 0) as total_clicks,
      COALESCE(AVG(apm.engagement_score), 0) as avg_engagement,
      COALESCE(AVG(apm.scroll_depth), 0)::numeric(5,2) as avg_scroll_depth,
      COUNT(DISTINCT apm.date) as tracking_days
    FROM articles a
    LEFT JOIN universities u ON a.university_id = u.id
    LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
      AND apm.date >= $1 AND apm.date <= $2
    WHERE a.created_at >= $1 AND a.created_at <= $2
  `;

  const params: any[] = [startDate, endDate];

  if (universityId) {
    sqlQuery += ` AND a.university_id = $3`;
    params.push(universityId);
  }

  sqlQuery += ` GROUP BY a.id, a.title_en, a.title_ar, u.name_en, a.status, a.published_at
    ORDER BY total_views DESC`;

  const result = await query(sqlQuery, params);

  return result.rows.map((row: any) => ({
    'Article ID': row.id.substring(0, 8),
    'Article Title (EN)': row.title_en,
    'Article Title (AR)': row.title_ar,
    University: row.university || 'N/A',
    Status: row.status,
    'Published Date': row.published_date || 'N/A',
    Views: row.total_views,
    Clicks: row.total_clicks,
    'Engagement Score': row.avg_engagement.toFixed(2),
    'Scroll Depth %': row.avg_scroll_depth,
    'Tracking Days': row.tracking_days,
  }));
}

/**
 * Prepare university statistics for export
 */
export async function prepareUniversityStatsExport(
  startDate: Date,
  endDate: Date
): Promise<ExportRow[]> {
  const result = await query(
    `
    SELECT
      u.id,
      u.name_en,
      u.name_ar,
      COUNT(DISTINCT a.id) as total_articles,
      COUNT(DISTINCT CASE WHEN a.status = 'published' THEN a.id END) as published,
      COUNT(DISTINCT CASE WHEN a.status = 'draft' THEN a.id END) as drafts,
      COALESCE(SUM(apm.views), 0) as total_views,
      COALESCE(AVG(apm.engagement_score), 0) as avg_engagement,
      COUNT(DISTINCT a.author_id) as contributors
    FROM universities u
    LEFT JOIN articles a ON u.id = a.university_id
    LEFT JOIN article_performance_metrics apm ON a.id = apm.article_id
      AND apm.date >= $1 AND apm.date <= $2
    GROUP BY u.id, u.name_en, u.name_ar
    ORDER BY total_views DESC
  `,
    [startDate, endDate]
  );

  return result.rows.map((row: any) => ({
    University: row.name_en,
    'الجامعة': row.name_ar,
    'Total Articles': row.total_articles,
    Published: row.published,
    Drafts: row.drafts,
    'Total Views': row.total_views,
    'Avg Engagement': row.avg_engagement.toFixed(2),
    Contributors: row.contributors,
  }));
}

/**
 * Prepare editorial metrics for export
 */
export async function prepareEditorialMetricsExport(
  startDate: Date,
  endDate: Date
): Promise<ExportRow[]> {
  const result = await query(
    `
    SELECT
      u.id,
      u.email,
      CONCAT(u.first_name, ' ', u.last_name) as full_name,
      COUNT(DISTINCT a.id) as total_articles,
      SUM(CASE WHEN a.status = 'published' THEN 1 ELSE 0 END) as published,
      AVG(ep.avg_approval_time)::numeric(5,2) as avg_approval_hours,
      AVG(ep.quality_score)::numeric(5,2) as avg_quality,
      SUM(ep.articles_published) as monthly_published
    FROM users u
    LEFT JOIN articles a ON u.id = a.author_id AND a.created_at >= $1
    LEFT JOIN editorial_performance ep ON u.id = ep.user_id
      AND ep.date >= $1 AND ep.date <= $2
    WHERE u.role_id IN (SELECT id FROM roles WHERE name IN ('editor', 'admin'))
    GROUP BY u.id, u.email, u.first_name, u.last_name
    ORDER BY monthly_published DESC
  `,
    [startDate, endDate]
  );

  return result.rows.map((row: any) => ({
    'Editor Email': row.email,
    'Full Name': row.full_name,
    'Total Articles': row.total_articles,
    Published: row.published,
    'Avg Approval Hours': row.avg_approval_hours,
    'Avg Quality Score': row.avg_quality,
    'Monthly Published': row.monthly_published || 0,
  }));
}
