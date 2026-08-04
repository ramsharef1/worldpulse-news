import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateArticle, calculateReadingTime, generateSlug } from '@/lib/content-validation';
import { createVersion, getVersionHistory } from '@/lib/content-versioning';
import { checkArticleDuplicates, logDuplicateCheck } from '@/lib/duplicate-detection';

// GET - List articles with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const university_id = searchParams.get('university_id');
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'DESC';

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

    if (category_id) {
      params.push(category_id);
      whereClause += ` AND category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (title_en ILIKE $${params.length} OR title_ar ILIKE $${params.length} OR content_en ILIKE $${params.length})`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM articles ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const allowedSorts = ['created_at', 'updated_at', 'title_en', 'views', 'likes_count'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    const result = await query(
      `SELECT id, title_en, title_ar, slug, content_en, content_ar, excerpt_en, excerpt_ar,
      university_id, category_id, author_id, featured_image_url, status, views, likes_count,
      comments_count, bookmarks_count, reading_time, tags, is_featured, is_breaking,
      published_at, created_at, updated_at
      FROM articles ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
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
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create new article with validation and versioning
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id') || 'system';

    // Validate article data
    const validation = validateArticle(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors.filter((e) => e.severity === 'error'),
          warnings: validation.errors.filter((e) => e.severity === 'warning'),
        },
        { status: 400 }
      );
    }

    // Check for duplicates
    const duplicateCheck = await checkArticleDuplicates(body.title_en, body.title_ar);

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Potential duplicate detected',
          duplicates: duplicateCheck.matches,
          recommendation: duplicateCheck.recommendation,
        },
        { status: 409 }
      );
    }

    // Generate slug and calculate reading time
    const slug = generateSlug(body.title_en);
    const readingTime = calculateReadingTime(body.content_en);

    // Insert article
    const result = await query(
      `INSERT INTO articles
      (title_en, title_ar, slug, content_en, content_ar, excerpt_en, excerpt_ar, university_id, category_id,
      author_id, featured_image_url, gallery_urls, status, views, likes_count, comments_count, bookmarks_count,
      reading_time, tags, is_featured, is_breaking, language_original, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 0, 0, 0, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING id, title_en, title_ar, slug, status, created_at`,
      [
        body.title_en,
        body.title_ar,
        slug,
        body.content_en,
        body.content_ar || '',
        body.excerpt_en || body.content_en.substring(0, 200),
        body.excerpt_ar || body.content_ar?.substring(0, 200) || '',
        body.university_id,
        body.category_id,
        body.author_id || userId,
        body.featured_image_url || null,
        body.gallery_urls ? JSON.stringify(body.gallery_urls) : null,
        body.status || 'draft',
        readingTime,
        body.tags ? JSON.stringify(body.tags) : JSON.stringify([]),
        body.is_featured || false,
        body.is_breaking || false,
        body.language_original || 'en',
      ]
    );

    const article = result.rows[0];

    // Create initial version
    await createVersion(article.id, 'article', body, {}, userId, 'Initial creation');

    // Log duplicate check
    await logDuplicateCheck(article.id, 'article', duplicateCheck.matches, false);

    return NextResponse.json(
      {
        success: true,
        data: article,
        version: 1,
        message: duplicateCheck.matches.length > 0 ? 'Article created with similar items found' : 'Article created successfully',
        warnings: duplicateCheck.matches.length > 0 ? duplicateCheck.matches : [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Batch update articles
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id') || 'system';

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No article IDs provided' },
        { status: 400 }
      );
    }

    const updateFields = body.updates || {};
    const allowedFields = ['status', 'is_featured', 'is_breaking'];
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    // Build update query
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

    // Add IDs to params
    const placeholders = body.ids.map((_, i) => `$${updateIndex + i}`).join(',');
    values.push(...body.ids);

    const result = await query(
      `UPDATE articles SET ${fieldsToUpdate.join(', ')} WHERE id IN (${placeholders}) RETURNING id, status`,
      values
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.rows.length} articles`,
      updated: result.rows.length,
    });
  } catch (error) {
    console.error('Error updating articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update articles', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Batch soft delete articles
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No article IDs provided' }, { status: 400 });
    }

    const placeholders = body.ids.map((_, i) => `$${i + 1}`).join(',');

    await query(`UPDATE articles SET status = 'archived', updated_at = NOW() WHERE id IN (${placeholders})`, body.ids);

    return NextResponse.json({
      success: true,
      message: `Archived ${body.ids.length} articles`,
    });
  } catch (error) {
    console.error('Error archiving articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive articles', details: (error as Error).message },
      { status: 500 }
    );
  }
}
