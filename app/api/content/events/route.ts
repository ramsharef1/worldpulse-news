import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateEvent } from '@/lib/content-validation';
import { checkEventDuplicates, logDuplicateCheck } from '@/lib/duplicate-detection';
import { createVersion } from '@/lib/content-versioning';

// GET - List events with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const university_id = searchParams.get('university_id');
    const upcomingOnly = searchParams.get('upcoming_only') === 'true';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (university_id) {
      params.push(university_id);
      whereClause += ` AND university_id = $${params.length}`;
    }

    if (upcomingOnly) {
      whereClause += ` AND start_date >= NOW()`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM events ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT id, title_en, title_ar, description_en, description_ar, start_date, end_date,
      location_en, location_ar, image_url, link, is_featured, status, university_id, created_at, updated_at
      FROM events ${whereClause}
      ORDER BY start_date ASC
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
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id') || 'system';

    // Validate event data
    const validation = validateEvent(body);
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

    // Check for duplicates
    const duplicateCheck = await checkEventDuplicates(
      body.title_en,
      body.title_ar,
      new Date(body.start_date),
      body.university_id
    );

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Potential duplicate event detected',
          duplicates: duplicateCheck.matches,
          recommendation: duplicateCheck.recommendation,
        },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO events
      (title_en, title_ar, description_en, description_ar, start_date, end_date,
      location_en, location_ar, image_url, link, is_featured, status, university_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, title_en, title_ar, status, created_at`,
      [
        body.title_en,
        body.title_ar,
        body.description_en,
        body.description_ar,
        body.start_date,
        body.end_date,
        body.location_en,
        body.location_ar,
        body.image_url || null,
        body.link || null,
        body.is_featured || false,
        body.status || 'published',
        body.university_id,
      ]
    );

    const event = result.rows[0];

    // Create initial version
    await createVersion(event.id, 'event', body, {}, userId, 'Initial creation');

    // Log duplicate check
    await logDuplicateCheck(event.id, 'event', duplicateCheck.matches, false);

    return NextResponse.json(
      {
        success: true,
        data: event,
        message: duplicateCheck.matches.length > 0 ? 'Event created with similar items found' : 'Event created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Batch update events
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No event IDs provided' },
        { status: 400 }
      );
    }

    const updateFields = body.updates || {};
    const allowedFields = ['status', 'is_featured'];
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
      `UPDATE events SET ${fieldsToUpdate.join(', ')} WHERE id IN (${placeholders}) RETURNING id`,
      values
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.rows.length} events`,
      updated: result.rows.length,
    });
  } catch (error) {
    console.error('Error updating events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update events', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete events
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No event IDs provided' }, { status: 400 });
    }

    const placeholders = body.ids.map((_, i) => `$${i + 1}`).join(',');

    await query(`UPDATE events SET status = 'completed', updated_at = NOW() WHERE id IN (${placeholders})`, body.ids);

    return NextResponse.json({
      success: true,
      message: `Archived ${body.ids.length} events`,
    });
  } catch (error) {
    console.error('Error archiving events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive events', details: (error as Error).message },
      { status: 500 }
    );
  }
}
