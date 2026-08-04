import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const entityType = searchParams.get('entity_type'); // article, event, job, faculty
    const search = searchParams.get('search');

    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];

    if (entityType) {
      params.push(entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM content_templates ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT id, name, description, entity_type, template_content, category, preview_url,
      is_active, usage_count, created_at, updated_at
      FROM content_templates ${whereClause}
      ORDER BY usage_count DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id');

    if (!body.name || !body.entity_type || !body.template_content) {
      return NextResponse.json(
        { success: false, error: 'Name, entity_type, and template_content are required' },
        { status: 400 }
      );
    }

    const allowedEntityTypes = ['article', 'event', 'job', 'faculty'];
    if (!allowedEntityTypes.includes(body.entity_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO content_templates
      (name, description, entity_type, template_content, category, preview_url, is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, name, entity_type, category, created_at`,
      [
        body.name,
        body.description || null,
        body.entity_type,
        JSON.stringify(body.template_content),
        body.category || null,
        body.preview_url || null,
        body.is_active !== undefined ? body.is_active : true,
        userId || 'system',
      ]
    );

    const template = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: 'Template created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Update template or use template to create content
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id');

    if (body.action === 'apply_template') {
      // Apply template to create new content
      const { template_id, entity_type, variables } = body;

      if (!template_id || !entity_type) {
        return NextResponse.json(
          { success: false, error: 'Template ID and entity type required' },
          { status: 400 }
        );
      }

      // Get template
      const templateResult = await query('SELECT template_content FROM content_templates WHERE id = $1', [template_id]);

      if (templateResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }

      const templateContent = JSON.parse(templateResult.rows[0].template_content);

      // Substitute variables in template
      let contentStr = JSON.stringify(templateContent);
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          contentStr = contentStr.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
      }

      const populatedContent = JSON.parse(contentStr);

      // Increment usage count
      await query('UPDATE content_templates SET usage_count = usage_count + 1 WHERE id = $1', [template_id]);

      return NextResponse.json({
        success: true,
        data: populatedContent,
        message: 'Template applied successfully',
      });
    }

    // Regular template update
    const { id, name, description, is_active, template_content } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID required' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (description) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (template_content) {
      updateFields.push(`template_content = $${paramIndex}`);
      values.push(JSON.stringify(template_content));
      paramIndex++;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE content_templates SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, is_active`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Remove template
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Template ID required' }, { status: 400 });
    }

    const result = await query('UPDATE content_templates SET is_active = false WHERE id = $1 RETURNING id', [body.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Template deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template', details: (error as Error).message },
      { status: 500 }
    );
  }
}
