import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateJob } from '@/lib/content-validation';
import { checkJobDuplicates, logDuplicateCheck } from '@/lib/duplicate-detection';
import { createVersion } from '@/lib/content-versioning';

// GET - List job postings with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'open';
    const university_id = searchParams.get('university_id');
    const position_type = searchParams.get('position_type');
    const search = searchParams.get('search');

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

    if (position_type) {
      params.push(position_type);
      whereClause += ` AND position_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (title_en ILIKE $${params.length} OR title_ar ILIKE $${params.length} OR description_en ILIKE $${params.length})`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM jobs ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT id, title_en, title_ar, description_en, description_ar, position_type,
      posted_by_id, status, expires_at, university_id, created_at, updated_at
      FROM jobs ${whereClause}
      ORDER BY created_at DESC
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
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create new job posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id') || 'system';

    // Validate job data
    const validation = validateJob(body);
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
    const duplicateCheck = await checkJobDuplicates(body.title_en, body.title_ar, body.university_id);

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Potential duplicate job posting detected',
          duplicates: duplicateCheck.matches,
          recommendation: duplicateCheck.recommendation,
        },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO jobs
      (title_en, title_ar, description_en, description_ar, position_type,
      posted_by_id, status, expires_at, university_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, title_en, title_ar, position_type, status, created_at`,
      [
        body.title_en,
        body.title_ar,
        body.description_en,
        body.description_ar,
        body.position_type,
        body.posted_by_id || userId,
        body.status || 'open',
        body.expires_at,
        body.university_id,
      ]
    );

    const job = result.rows[0];

    // Create initial version
    await createVersion(job.id, 'job', body, {}, userId, 'Initial creation');

    // Log duplicate check
    await logDuplicateCheck(job.id, 'job', duplicateCheck.matches, false);

    return NextResponse.json(
      {
        success: true,
        data: job,
        message: duplicateCheck.matches.length > 0 ? 'Job created with similar postings found' : 'Job created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Batch update jobs
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No job IDs provided' },
        { status: 400 }
      );
    }

    const updateFields = body.updates || {};
    const allowedFields = ['status'];
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
      `UPDATE jobs SET ${fieldsToUpdate.join(', ')} WHERE id IN (${placeholders}) RETURNING id`,
      values
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.rows.length} jobs`,
      updated: result.rows.length,
    });
  } catch (error) {
    console.error('Error updating jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update jobs', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete jobs
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No job IDs provided' }, { status: 400 });
    }

    const placeholders = body.ids.map((_, i) => `$${i + 1}`).join(',');

    await query(`UPDATE jobs SET status = 'closed', updated_at = NOW() WHERE id IN (${placeholders})`, body.ids);

    return NextResponse.json({
      success: true,
      message: `Closed ${body.ids.length} job postings`,
    });
  } catch (error) {
    console.error('Error closing jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to close jobs', details: (error as Error).message },
      { status: 500 }
    );
  }
}
