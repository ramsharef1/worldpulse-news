import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateFaculty } from '@/lib/content-validation';
import { createVersion } from '@/lib/content-versioning';

// GET - List faculty with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const university_id = searchParams.get('university_id');
    const department_id = searchParams.get('department_id');
    const search = searchParams.get('search');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (university_id) {
      params.push(university_id);
      whereClause += ` AND university_id = $${params.length}`;
    }

    if (department_id) {
      params.push(department_id);
      whereClause += ` AND department_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR bio ILIKE $${params.length})`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM faculty ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT id, name, email, phone, bio, research_interests, office_location, office_hours,
      profile_image_url, university_id, department_id, created_at, updated_at
      FROM faculty ${whereClause}
      ORDER BY name ASC
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
    console.error('Error fetching faculty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Add new faculty member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id') || 'system';

    // Validate faculty data
    const validation = validateFaculty(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors.filter((e) => e.severity === 'error'),
        },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const emailCheck = await query('SELECT id FROM faculty WHERE email = $1', [body.email]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Faculty member with this email already exists' },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO faculty
      (name, email, phone, bio, research_interests, office_location, office_hours,
      profile_image_url, university_id, department_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, name, email, university_id, department_id, created_at`,
      [
        body.name,
        body.email,
        body.phone || null,
        body.bio || null,
        body.research_interests || null,
        body.office_location || null,
        body.office_hours || null,
        body.profile_image_url || null,
        body.university_id,
        body.department_id,
      ]
    );

    const faculty = result.rows[0];

    // Create initial version
    await createVersion(faculty.id, 'faculty', body, {}, userId, 'Initial creation');

    return NextResponse.json(
      {
        success: true,
        data: faculty,
        message: 'Faculty member added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding faculty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add faculty', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Batch update faculty
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No faculty IDs provided' },
        { status: 400 }
      );
    }

    const updateFields = body.updates || {};
    const allowedFields = ['bio', 'research_interests', 'office_location', 'office_hours', 'profile_image_url'];
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    let updateIndex = 1;
    Object.entries(updateFields).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`${key} = $${updateIndex}`);
        values.push(value);
        updateIndex++;
      }
    });

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    fieldsToUpdate.push('updated_at = NOW()');

    const placeholders = body.ids.map((_, i) => `$${updateIndex + i}`).join(',');
    values.push(...body.ids);

    const result = await query(
      `UPDATE faculty SET ${fieldsToUpdate.join(', ')} WHERE id IN (${placeholders}) RETURNING id`,
      values
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.rows.length} faculty members`,
      updated: result.rows.length,
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update faculty', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Remove faculty member
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No faculty IDs provided' }, { status: 400 });
    }

    const placeholders = body.ids.map((_, i) => `$${i + 1}`).join(',');

    // Soft delete
    await query(
      `UPDATE faculty SET deleted_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`,
      body.ids
    );

    return NextResponse.json({
      success: true,
      message: `Removed ${body.ids.length} faculty members`,
    });
  } catch (error) {
    console.error('Error removing faculty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove faculty', details: (error as Error).message },
      { status: 500 }
    );
  }
}
