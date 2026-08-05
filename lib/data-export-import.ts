import { query } from './db';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from 'json2csv';
import * as xml2js from 'xml2js';

// ============================================
// DATA EXPORT/IMPORT HANDLERS
// ============================================

export interface ExportOptions {
  entityType: string;
  format: 'csv' | 'json' | 'xml';
  filters?: Record<string, any>;
  includedFields?: string[];
  includeRelationships?: boolean;
  compressFile?: boolean;
}

export interface ImportOptions {
  entityType: string;
  format: 'csv' | 'json' | 'xml';
  skipOnError?: boolean;
  createNewRecords?: boolean;
  updateExistingRecords?: boolean;
  duplicateHandling?: 'skip' | 'update' | 'error';
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export class DataExporter {
  /**
   * Export data to CSV format
   */
  async exportToCSV(
    data: any[],
    fields?: string[]
  ): Promise<string> {
    try {
      if (!data || data.length === 0) {
        return ''; // Return empty string for empty datasets
      }

      // Determine fields if not provided
      const exportFields = fields || Object.keys(data[0]);

      const parser = new Parser({ fields: exportFields });
      return parser.parse(data);
    } catch (error) {
      throw new Error(`CSV export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Export data to JSON format
   */
  async exportToJSON(
    data: any[],
    pretty: boolean = true
  ): Promise<string> {
    try {
      return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    } catch (error) {
      throw new Error(`JSON export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Export data to XML format
   */
  async exportToXML(
    data: any[],
    entityName: string = 'record'
  ): Promise<string> {
    try {
      const xmlData = {
        root: {
          [entityName]: data,
        },
      };

      const builder = new xml2js.Builder({
        rootName: 'export',
        xmldec: { version: '1.0', encoding: 'UTF-8' },
      });

      return builder.buildObject(xmlData);
    } catch (error) {
      throw new Error(`XML export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Export data with format detection
   */
  async exportData(
    data: any[],
    format: 'csv' | 'json' | 'xml',
    options?: {
      fields?: string[];
      entityName?: string;
      pretty?: boolean;
    }
  ): Promise<string> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data, options?.fields);
      case 'json':
        return this.exportToJSON(data, options?.pretty !== false);
      case 'xml':
        return this.exportToXML(data, options?.entityName);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export articles
   */
  async exportArticles(
    universityId: string,
    filters?: Record<string, any>,
    format: 'csv' | 'json' | 'xml' = 'json'
  ): Promise<string> {
    try {
      let sqlQuery = `
        SELECT id, title_ar, title_en, excerpt_ar, excerpt_en,
               author_id, category, status, views, created_at, updated_at
        FROM articles
        WHERE university_id = $1
      `;

      const params: any[] = [universityId];
      let paramCount = 2;

      // Apply filters
      if (filters) {
        if (filters.status) {
          sqlQuery += ` AND status = $${paramCount}`;
          params.push(filters.status);
          paramCount++;
        }
        if (filters.category) {
          sqlQuery += ` AND category = $${paramCount}`;
          params.push(filters.category);
          paramCount++;
        }
        if (filters.dateFrom) {
          sqlQuery += ` AND created_at >= $${paramCount}`;
          params.push(filters.dateFrom);
          paramCount++;
        }
        if (filters.dateTo) {
          sqlQuery += ` AND created_at <= $${paramCount}`;
          params.push(filters.dateTo);
          paramCount++;
        }
      }

      sqlQuery += ` ORDER BY created_at DESC`;

      const result = await query(sqlQuery, params);
      return this.exportData(result.rows, format, { entityName: 'article' });
    } catch (error) {
      throw new Error(`Article export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Export users
   */
  async exportUsers(
    universityId: string,
    format: 'csv' | 'json' | 'xml' = 'json'
  ): Promise<string> {
    try {
      const result = await query(
        `SELECT id, email, first_name, last_name, role_id, status,
                two_fa_enabled, last_login, created_at
         FROM users
         WHERE role_id IN (
           SELECT id FROM roles WHERE university_id = $1
         )
         ORDER BY created_at DESC`,
        [universityId]
      );

      return this.exportData(result.rows, format, { entityName: 'user' });
    } catch (error) {
      throw new Error(`User export failed: ${(error as Error).message}`);
    }
  }
}

export class DataImporter {
  /**
   * Parse CSV data
   */
  async parseCSV(csvContent: string): Promise<any[]> {
    try {
      const lines = csvContent.split('\n').filter((line) => line.trim());
      if (lines.length === 0) {
        return [];
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const data: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: Record<string, any> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        data.push(row);
      }

      return data;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse JSON data
   */
  async parseJSON(jsonContent: string): Promise<any[]> {
    try {
      const parsed = JSON.parse(jsonContent);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      throw new Error(`JSON parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse XML data
   */
  async parseXML(xmlContent: string): Promise<any[]> {
    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);

      // Extract data from XML structure
      const rootKey = Object.keys(result)[0];
      const data = result[rootKey];

      // Find array of records
      const recordArrayKey = Object.keys(data)[0];
      const records = data[recordArrayKey];

      return Array.isArray(records) ? records : [records];
    } catch (error) {
      throw new Error(`XML parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse import data
   */
  async parseData(
    content: string,
    format: 'csv' | 'json' | 'xml'
  ): Promise<any[]> {
    switch (format) {
      case 'csv':
        return this.parseCSV(content);
      case 'json':
        return this.parseJSON(content);
      case 'xml':
        return this.parseXML(content);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Validate import data
   */
  async validateImportData(
    data: any[],
    entityType: string,
    requiredFields: string[]
  ): Promise<{
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    data.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: index + 1,
            field,
            value: row[field],
            message: `Required field "${field}" is missing`,
          });
        }
      });

      // Entity-specific validation
      switch (entityType) {
        case 'article':
          this.validateArticleRow(row, index, errors, warnings);
          break;
        case 'user':
          this.validateUserRow(row, index, errors, warnings);
          break;
        case 'comment':
          this.validateCommentRow(row, index, errors, warnings);
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Import articles
   */
  async importArticles(
    universityId: string,
    data: any[],
    createdBy: string,
    options: ImportOptions
  ): Promise<{
    successful: number;
    failed: number;
    errors: ValidationError[];
  }> {
    try {
      let successCount = 0;
      let failedCount = 0;
      const errors: ValidationError[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        try {
          // Validate required fields
          if (!row.title_en && !row.title_ar) {
            throw new Error('Either title_en or title_ar is required');
          }

          // Check for duplicates if needed
          if (options.duplicateHandling === 'error' || options.duplicateHandling === 'skip') {
            const duplicate = await query(
              `SELECT id FROM articles
               WHERE university_id = $1 AND
               ((title_en = $2 AND title_en IS NOT NULL) OR
                (title_ar = $3 AND title_ar IS NOT NULL))`,
              [universityId, row.title_en || null, row.title_ar || null]
            );

            if (duplicate.rows.length > 0) {
              if (options.duplicateHandling === 'error') {
                throw new Error('Duplicate article found');
              } else {
                successCount++;
                continue;
              }
            }
          }

          // Insert or update article
          if (row.id && options.updateExistingRecords) {
            await query(
              `UPDATE articles
               SET title_en = COALESCE($1, title_en),
                   title_ar = COALESCE($2, title_ar),
                   excerpt_en = COALESCE($3, excerpt_en),
                   excerpt_ar = COALESCE($4, excerpt_ar),
                   category = COALESCE($5, category),
                   updated_at = NOW()
               WHERE id = $6 AND university_id = $7`,
              [
                row.title_en,
                row.title_ar,
                row.excerpt_en,
                row.excerpt_ar,
                row.category,
                row.id,
                universityId,
              ]
            );
          } else if (options.createNewRecords) {
            await query(
              `INSERT INTO articles (
                university_id, title_en, title_ar, excerpt_en, excerpt_ar,
                category, author_id, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
              [
                universityId,
                row.title_en,
                row.title_ar,
                row.excerpt_en,
                row.excerpt_ar,
                row.category || 'general',
                createdBy,
                'draft',
              ]
            );
          }

          successCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            row: i + 1,
            field: 'article',
            value: row,
            message: (error as Error).message,
          });

          if (!options.skipOnError) {
            throw error;
          }
        }
      }

      return {
        successful: successCount,
        failed: failedCount,
        errors,
      };
    } catch (error) {
      throw new Error(`Article import failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate article row
   */
  private validateArticleRow(
    row: any,
    rowIndex: number,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (row.views && isNaN(parseInt(row.views))) {
      errors.push({
        row: rowIndex + 1,
        field: 'views',
        value: row.views,
        message: 'Views must be a number',
      });
    }

    if (row.status && !['draft', 'published', 'archived'].includes(row.status)) {
      errors.push({
        row: rowIndex + 1,
        field: 'status',
        value: row.status,
        message: 'Invalid status value',
      });
    }
  }

  /**
   * Validate user row
   */
  private validateUserRow(
    row: any,
    rowIndex: number,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (row.email && !this.isValidEmail(row.email)) {
      errors.push({
        row: rowIndex + 1,
        field: 'email',
        value: row.email,
        message: 'Invalid email format',
      });
    }
  }

  /**
   * Validate comment row
   */
  private validateCommentRow(
    _row: any,
    _rowIndex: number,
    _errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    // Comment validation logic
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default {
  DataExporter,
  DataImporter,
};
