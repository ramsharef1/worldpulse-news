import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateArticle, calculateReadingTime } from '@/lib/content-validation';
import { createVersion, getVersionHistory, rollbackToVersion } from '@/lib/content-versioning';

// GET - Retrieve single article with version history option
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const includeVersions = request.nextUrl.searchParams.get('include_versions') === 'true';

    const result = await query(
      `SELECT id, title_en, title_ar, slug, content_en, content_ar, excerpt_en, excerpt_ar,
      university_id, category_id, author_id, featured_image_url, gallery_urls, status,
      views, likes_count, comments_count, bookmarks_count, reading_time, tags,
      is_featured, is_breaking, language_original, published_at, created_at, updated_at
      FROM articles WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const article = result.rows[0];

    // Increment view count
    await query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    let response: any = {
      success: true,
      data: article,
    };

    if (includeVersions) {
      const versions = await getVersionHistory(id, 'article');
      response.versions = versions;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update article with versioning
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const userId = request.headers.get('X-User-Id') || 'system';

    // Get current article
    const currentResult = await query('SELECT * FROM articles WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const currentArticle = currentResult.rows[0];

    // Validate new data
    const validation = validateArticle(body);
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

    // Calculate reading time if content changed
    const readingTime = body.content_en ? calculateReadingTime(body.content_en) : currentArticle.reading_time;

    // Update article
    const updateResult = await query(
      `UPDATE articles SET
      title_en = $1, title_ar = $2, content_en = $3, content_ar = $4,
      excerpt_en = $5, excerpt_ar = $6, featured_image_url = $7, gallery_urls = $8,
      status = $9, tags = $10, is_featured = $11, is_breaking = $12,
      reading_time = $13, updated_at = NOW()
      WHERE id = $14
      RETURNING id, title_en, title_ar, status, updated_at`,
      [
        body.title_en || currentArticle.title_en,
        body.title_ar || currentArticle.title_ar,
        body.content_en || currentArticle.content_en,
        body.content_ar || currentArticle.content_ar,
        body.excerpt_en || currentArticle.excerpt_en,
        body.excerpt_ar || currentArticle.excerpt_ar,
        body.featured_image_url || currentArticle.featured_image_url,
        body.gallery_urls ? JSON.stringify(body.gallery_urls) : currentArticle.gallery_urls,
        body.status || currentArticle.status,
        body.tags ? JSON.stringify(body.tags) : currentArticle.tags,
        body.is_featured !== undefined ? body.is_featured : currentArticle.is_featured,
        body.is_breaking !== undefined ? body.is_breaking : currentArticle.is_breaking,
        readingTime,
        id,
      ]
    );

    const updatedArticle = updateResult.rows[0];

    // Create version record
    const version = await createVersion(
      id,
      'article',
      {
        ...currentArticle,
        title_en: body.title_en || currentArticle.title_en,
        title_ar: body.title_ar || currentArticle.title_ar,
        content_en: body.content_en || currentArticle.content_en,
        content_ar: body.content_ar || currentArticle.content_ar,
        status: body.status || currentArticle.status,
      },
      currentArticle,
      userId,
      body.change_reason
    );

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      version: version.version_number,
      message: 'Article updated successfully',
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update article', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Special endpoints via body action
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const action = body.action;
    const userId = request.headers.get('X-User-Id') || 'system';

    if (action === 'preview') {
      // Get article for frontend preview rendering
      const result = await query('SELECT * FROM articles WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        preview: result.rows[0],
        frontendUrl: `/article/${result.rows[0].slug}`,
      });
    }

    if (action === 'rollback') {
      if (!body.version_number) {
        return NextResponse.json({ success: false, error: 'Version number required' }, { status: 400 });
      }

      const rolledBackData = await rollbackToVersion(id, 'article', body.version_number, userId);

      return NextResponse.json({
        success: true,
        message: `Rolled back to version ${body.version_number}`,
        data: rolledBackData,
      });
    }

    if (action === 'publish') {
      const result = await query('UPDATE articles SET status = $1, published_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *', [
        'published',
        id,
      ]);

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
      }

      // Create version record for publish
      await createVersion(id, 'article', result.rows[0], {}, userId, 'Article published');

      return NextResponse.json({
        success: true,
        message: 'Article published successfully',
        data: result.rows[0],
      });
    }

    if (action === 'duplicate') {
      // Create a duplicate of the article
      const sourceResult = await query('SELECT * FROM articles WHERE id = $1', [id]);
      if (sourceResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
      }

      const source = sourceResult.rows[0];
      const newTitle = `${source.title_en} (Copy)`;
      const newSlug = `${source.slug}-copy-${Date.now()}`;

      const duplicateResult = await query(
        `INSERT INTO articles
        (title_en, title_ar, slug, content_en, content_ar, excerpt_en, excerpt_ar,
        university_id, category_id, author_id, featured_image_url, gallery_urls,
        status, reading_time, tags, is_featured, is_breaking, language_original, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING id, title_en, slug, status`,
        [
          newTitle,
          source.title_ar,
          newSlug,
          source.content_en,
          source.content_ar,
          source.excerpt_en,
          source.excerpt_ar,
          source.university_id,
          source.category_id,
          userId,
          source.featured_image_url,
          source.gallery_urls,
          'draft',
          source.reading_time,
          source.tags,
          false,
          false,
          source.language_original,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Article duplicated successfully',
        data: duplicateResult.rows[0],
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing article action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete article
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const result = await query('UPDATE articles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id', ['archived', id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Article archived successfully',
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete article', details: (error as Error).message },
      { status: 500 }
    );
  }
}
