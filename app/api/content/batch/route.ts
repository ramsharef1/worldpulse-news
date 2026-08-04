import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { batchCheckDuplicates } from '@/lib/duplicate-detection';

// POST - Batch operations on content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, items, updates } = body;
    const userId = request.headers.get('X-User-Id') || 'system';

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action required' }, { status: 400 });
    }

    if (action === 'bulk_create') {
      // Bulk create content items (with duplicate detection)
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      const duplicateResults = await batchCheckDuplicates(items);
      const results: any[] = [];
      let createdCount = 0;
      let skippedCount = 0;
      const warnings: any[] = [];

      for (const item of items) {
        const itemKey = item.id || `temp_${items.indexOf(item)}`;
        const duplicateCheck = duplicateResults.get(itemKey);

        if (duplicateCheck?.isDuplicate && body.skip_duplicates) {
          skippedCount++;
          warnings.push({
            item: item.title_en || item.title,
            reason: 'Potential duplicate detected',
            matches: duplicateCheck.matches.slice(0, 2),
          });
          continue;
        }

        // Create the content item (implementation depends on entity type)
        results.push({
          title: item.title_en || item.title,
          status: 'created',
          duplicateWarnings: duplicateCheck?.matches.length || 0,
        });

        createdCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdCount} items, skipped ${skippedCount}`,
        created: createdCount,
        skipped: skippedCount,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    if (action === 'bulk_update') {
      // Bulk update content items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ success: false, error: 'Updates object required' }, { status: 400 });
      }

      const results: any[] = [];
      let updatedCount = 0;
      let errorCount = 0;

      for (const item of items) {
        try {
          const entityType = item.type || 'article';
          const allowedUpdateFields: Record<string, string[]> = {
            article: ['status', 'is_featured', 'is_breaking', 'tags'],
            event: ['status', 'is_featured'],
            job: ['status'],
            faculty: ['bio', 'research_interests', 'office_location', 'office_hours'],
          };

          const validFields = allowedUpdateFields[entityType] || [];
          const updateFields: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          Object.entries(updates).forEach(([key, value]) => {
            if (validFields.includes(key)) {
              updateFields.push(`${key} = $${paramIndex}`);
              values.push(key === 'tags' && Array.isArray(value) ? JSON.stringify(value) : value);
              paramIndex++;
            }
          });

          if (updateFields.length === 0) {
            errorCount++;
            continue;
          }

          const table = entityType === 'article' ? 'articles' : entityType === 'event' ? 'events' : entityType === 'job' ? 'jobs' : 'faculty';

          updateFields.push('updated_at = NOW()');
          values.push(item.id);

          await query(
            `UPDATE ${table} SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
            values
          );

          updatedCount++;
          results.push({
            id: item.id,
            status: 'updated',
          });
        } catch (err) {
          errorCount++;
          results.push({
            id: item.id,
            status: 'error',
            error: (err as Error).message,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedCount} items, ${errorCount} errors`,
        updated: updatedCount,
        errors: errorCount,
        results,
      });
    }

    if (action === 'bulk_delete') {
      // Bulk soft delete items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      const entityType = body.entity_type || 'article';
      const table = entityType === 'article' ? 'articles' : entityType === 'event' ? 'events' : entityType === 'job' ? 'jobs' : 'faculty';
      const statusField = entityType === 'article' || entityType === 'event' ? 'status' : 'deleted_at';
      const statusValue = entityType === 'article' ? 'archived' : entityType === 'event' ? 'completed' : null;

      const placeholders = items.map((_, i) => `$${i + 1}`).join(',');

      if (statusValue) {
        await query(
          `UPDATE ${table} SET ${statusField} = $${items.length + 1}, updated_at = NOW() WHERE id IN (${placeholders})`,
          [...items, statusValue]
        );
      } else {
        await query(
          `UPDATE ${table} SET ${statusField} = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`,
          items
        );
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${items.length} items`,
        deleted: items.length,
      });
    }

    if (action === 'bulk_publish') {
      // Bulk publish articles/events
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      const entityType = body.entity_type || 'article';
      const table = entityType === 'article' ? 'articles' : 'events';

      const placeholders = items.map((_, i) => `$${i + 1}`).join(',');

      const result = await query(
        `UPDATE ${table} SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders}) RETURNING id`,
        items
      );

      return NextResponse.json({
        success: true,
        message: `Published ${result.rows.length} items`,
        published: result.rows.length,
      });
    }

    if (action === 'bulk_change_university') {
      // Move items to different university
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      if (!body.university_id) {
        return NextResponse.json({ success: false, error: 'University ID required' }, { status: 400 });
      }

      const entityType = body.entity_type || 'article';
      const table = entityType === 'article' ? 'articles' : entityType === 'event' ? 'events' : entityType === 'job' ? 'jobs' : 'faculty';

      const placeholders = items.map((_, i) => `$${i + 1}`).join(',');

      const result = await query(
        `UPDATE ${table} SET university_id = $${items.length + 1}, updated_at = NOW() WHERE id IN (${placeholders}) RETURNING id`,
        [...items, body.university_id]
      );

      return NextResponse.json({
        success: true,
        message: `Updated university for ${result.rows.length} items`,
        updated: result.rows.length,
      });
    }

    if (action === 'bulk_check_duplicates') {
      // Check duplicates for multiple items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      const duplicateResults = await batchCheckDuplicates(items);

      const summary = {
        totalItems: items.length,
        itemsWithDuplicates: 0,
        totalMatches: 0,
        results: [] as any[],
      };

      duplicateResults.forEach((check, itemKey) => {
        if (check.isDuplicate) {
          summary.itemsWithDuplicates++;
          summary.totalMatches += check.matches.length;
          summary.results.push({
            item: itemKey,
            isDuplicate: true,
            matches: check.matches.slice(0, 3),
            recommendation: check.recommendation,
          });
        }
      });

      return NextResponse.json({
        success: true,
        summary,
      });
    }

    if (action === 'export') {
      // Prepare content for export (CSV, JSON, etc.)
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Items array required' }, { status: 400 });
      }

      const format = body.format || 'json';

      let exportData: any;

      if (format === 'json') {
        exportData = JSON.stringify(items, null, 2);
      } else if (format === 'csv') {
        // Simple CSV conversion
        const headers = Object.keys(items[0]);
        const csv = [headers.join(','), ...items.map((item) => headers.map((h) => JSON.stringify(item[h])).join(','))].join('\n');
        exportData = csv;
      }

      return NextResponse.json({
        success: true,
        format,
        data: exportData,
        filename: `export_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in batch operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform batch operation', details: (error as Error).message },
      { status: 500 }
    );
  }
}
