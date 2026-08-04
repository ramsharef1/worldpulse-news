import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getMediaLibrary, searchMedia, saveMediaFile, updateMediaMetadata, deleteMediaFile, batchDeleteMedia, getMediaUsageStats, validateMediaFile, formatBytes } from '@/lib/media-handler';

// GET - List media files with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = request.headers.get('X-User-Id');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 401 });
    }

    if (action === 'search') {
      const searchTerm = searchParams.get('q');
      if (!searchTerm) {
        return NextResponse.json({ success: false, error: 'Search term required' }, { status: 400 });
      }

      const results = await searchMedia(userId, searchTerm);
      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    if (action === 'stats') {
      const stats = await getMediaUsageStats(userId);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Default: list media with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const mimeType = searchParams.get('mime_type');
    const sortBy = (searchParams.get('sort_by') || 'date') as 'date' | 'size' | 'name';

    const result = await getMediaLibrary(userId, page, limit, mimeType, sortBy);

    return NextResponse.json({
      success: true,
      data: result.files,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Upload media file or update metadata
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type');

    // Handle file upload
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const altTextEn = formData.get('alt_text_en') as string;
      const altTextAr = formData.get('alt_text_ar') as string;

      if (!file) {
        return NextResponse.json({ success: false, error: 'File required' }, { status: 400 });
      }

      // Validate file
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      // In production, upload to S3
      // For now, simulate S3 upload
      const fileName = `${Date.now()}_${file.name}`;
      const s3Key = `uploads/${userId}/${fileName}`;
      const s3Url = `https://your-bucket.s3.amazonaws.com/${s3Key}`;
      const thumbnailUrl = `https://your-bucket.s3.amazonaws.com/thumbnails/${s3Key}`;

      const media = await saveMediaFile(
        file.name,
        file.type,
        file.size,
        s3Key,
        s3Url,
        thumbnailUrl,
        userId,
        altTextEn,
        altTextAr
      );

      return NextResponse.json(
        {
          success: true,
          data: media,
          message: 'File uploaded successfully',
        },
        { status: 201 }
      );
    }

    // Handle metadata update
    const body = await request.json();
    if (body.action === 'update_metadata') {
      const { media_id, alt_text_en, alt_text_ar } = body;
      if (!media_id) {
        return NextResponse.json({ success: false, error: 'Media ID required' }, { status: 400 });
      }

      const updated = await updateMediaMetadata(media_id, alt_text_en, alt_text_ar);
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Media metadata updated',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error processing media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process media', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Batch update media metadata
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 401 });
    }

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No media IDs provided' },
        { status: 400 }
      );
    }

    const updates: any[] = [];

    for (const mediaId of body.ids) {
      const mediaUpdate = body.updates?.[mediaId];
      if (mediaUpdate) {
        updates.push(
          updateMediaMetadata(mediaId, mediaUpdate.alt_text_en, mediaUpdate.alt_text_ar)
        );
      }
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} media items`,
      updated: updates.length,
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Remove media files
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 401 });
    }

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No media IDs provided' }, { status: 400 });
    }

    // Verify ownership before deleting
    const checkOwnership = await query(
      `SELECT id FROM media_files WHERE id = ANY($1) AND uploaded_by = $2`,
      [body.ids, userId]
    );

    if (checkOwnership.rows.length !== body.ids.length) {
      return NextResponse.json(
        { success: false, error: 'Some files do not belong to you' },
        { status: 403 }
      );
    }

    await batchDeleteMedia(body.ids);

    return NextResponse.json({
      success: true,
      message: `Deleted ${body.ids.length} media files`,
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media', details: (error as Error).message },
      { status: 500 }
    );
  }
}
