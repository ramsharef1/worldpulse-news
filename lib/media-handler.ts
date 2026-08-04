// Media library and optimization utilities

import { query } from './db';

export interface MediaFile {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  s3_key: string;
  s3_url: string;
  thumbnail_url?: string;
  alt_text_en?: string;
  alt_text_ar?: string;
  uploaded_by: string;
  created_at: Date;
}

export interface MediaMetadata {
  id: string;
  media_id: string;
  format: string;
  file_size: number;
  width: number;
  height: number;
  has_transparency: boolean;
  created_at: Date;
}

export interface ImageOptimization {
  original: {
    size: number;
    url: string;
  };
  optimized: {
    size: number;
    url: string;
    format: string;
  };
  thumbnail: {
    size: number;
    url: string;
    dimensions: string;
  };
  savings: {
    bytes: number;
    percentage: number;
  };
}

// Validate media file
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedMimes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum of ${maxSize} bytes`,
    };
  }

  return { valid: true };
}

// Get media library with pagination and filtering
export async function getMediaLibrary(
  userId: string,
  page: number = 1,
  limit: number = 50,
  mimeType?: string,
  sortBy: 'date' | 'size' | 'name' = 'date'
) {
  let query_str = `SELECT id, filename, mime_type, size, width, height, s3_url, thumbnail_url, alt_text_en, alt_text_ar, uploaded_by, created_at
  FROM media_files
  WHERE uploaded_by = $1`;

  const params: any[] = [userId];

  if (mimeType) {
    params.push(mimeType);
    query_str += ` AND mime_type = $${params.length}`;
  }

  // Sorting
  const sortMap = {
    date: 'created_at DESC',
    size: 'size DESC',
    name: 'filename ASC',
  };

  query_str += ` ORDER BY ${sortMap[sortBy]}`;

  // Pagination
  const offset = (page - 1) * limit;
  params.push(limit);
  params.push(offset);
  query_str += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await query(query_str, params);

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM media_files WHERE uploaded_by = $1${mimeType ? ` AND mime_type = $2` : ''}`,
    mimeType ? [userId, mimeType] : [userId]
  );

  return {
    files: result.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      mime_type: row.mime_type,
      size: row.size,
      width: row.width,
      height: row.height,
      s3_url: row.s3_url,
      thumbnail_url: row.thumbnail_url,
      alt_text_en: row.alt_text_en,
      alt_text_ar: row.alt_text_ar,
      uploaded_by: row.uploaded_by,
      created_at: new Date(row.created_at),
    })),
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  };
}

// Search media files
export async function searchMedia(userId: string, searchTerm: string, limit: number = 20) {
  const result = await query(
    `SELECT id, filename, mime_type, size, s3_url, thumbnail_url, created_at
    FROM media_files
    WHERE uploaded_by = $1 AND (filename ILIKE $2 OR alt_text_en ILIKE $2 OR alt_text_ar ILIKE $2)
    ORDER BY created_at DESC
    LIMIT $3`,
    [userId, `%${searchTerm}%`, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    mime_type: row.mime_type,
    size: row.size,
    s3_url: row.s3_url,
    thumbnail_url: row.thumbnail_url,
    created_at: new Date(row.created_at),
  }));
}

// Save media file metadata
export async function saveMediaFile(
  filename: string,
  mimeType: string,
  size: number,
  s3Key: string,
  s3Url: string,
  thumbnailUrl: string | undefined,
  uploadedBy: string,
  altTextEn?: string,
  altTextAr?: string,
  width?: number,
  height?: number
): Promise<MediaFile> {
  const result = await query(
    `INSERT INTO media_files
    (filename, mime_type, size, width, height, s3_key, s3_url, thumbnail_url, alt_text_en, alt_text_ar, uploaded_by, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    RETURNING id, filename, mime_type, size, width, height, s3_url, thumbnail_url, alt_text_en, alt_text_ar, uploaded_by, created_at`,
    [filename, mimeType, size, width, height, s3Key, s3Url, thumbnailUrl, altTextEn, altTextAr, uploadedBy]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    filename: row.filename,
    mime_type: row.mime_type,
    size: row.size,
    width: row.width,
    height: row.height,
    s3_key: s3Key,
    s3_url: row.s3_url,
    thumbnail_url: row.thumbnail_url,
    alt_text_en: row.alt_text_en,
    alt_text_ar: row.alt_text_ar,
    uploaded_by: row.uploaded_by,
    created_at: new Date(row.created_at),
  };
}

// Update media metadata
export async function updateMediaMetadata(mediaId: string, altTextEn?: string, altTextAr?: string) {
  const result = await query(
    `UPDATE media_files
    SET alt_text_en = COALESCE($2, alt_text_en), alt_text_ar = COALESCE($3, alt_text_ar), updated_at = NOW()
    WHERE id = $1
    RETURNING id, filename, mime_type, size, s3_url, alt_text_en, alt_text_ar, created_at`,
    [mediaId, altTextEn || null, altTextAr || null]
  );

  if (result.rows.length === 0) {
    throw new Error('Media file not found');
  }

  return result.rows[0];
}

// Delete media file (soft delete)
export async function deleteMediaFile(mediaId: string) {
  await query(
    `UPDATE media_files
    SET deleted_at = NOW()
    WHERE id = $1`,
    [mediaId]
  );
}

// Get image dimensions
export async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number } | null> {
  // This would normally use a library like sharp
  // For now, returning a placeholder implementation
  return null;
}

// Calculate media optimization suggestions
export function calculateOptimization(originalSize: number, optimizedSize: number): ImageOptimization {
  const savings = originalSize - optimizedSize;
  const savingsPercentage = (savings / originalSize) * 100;

  return {
    original: {
      size: originalSize,
      url: '', // Would be populated with actual URL
    },
    optimized: {
      size: optimizedSize,
      url: '', // Would be populated with actual URL
      format: 'webp',
    },
    thumbnail: {
      size: Math.floor(optimizedSize * 0.1), // Estimate
      url: '', // Would be populated with actual URL
      dimensions: '300x300',
    },
    savings: {
      bytes: savings,
      percentage: savingsPercentage,
    },
  };
}

// Get media usage statistics
export async function getMediaUsageStats(userId: string) {
  const result = await query(
    `SELECT
    COUNT(*) as total_files,
    SUM(size) as total_size,
    COUNT(DISTINCT mime_type) as file_types,
    MAX(created_at) as last_uploaded
    FROM media_files
    WHERE uploaded_by = $1 AND deleted_at IS NULL`,
    [userId]
  );

  const stats = result.rows[0];
  return {
    totalFiles: parseInt(stats.total_files) || 0,
    totalSize: parseInt(stats.total_size) || 0,
    totalSizeFormatted: formatBytes(parseInt(stats.total_size) || 0),
    fileTypes: parseInt(stats.file_types) || 0,
    lastUploaded: stats.last_uploaded ? new Date(stats.last_uploaded) : null,
  };
}

// Format bytes for display
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Batch media operations
export async function batchDeleteMedia(mediaIds: string[]) {
  if (mediaIds.length === 0) return;

  const placeholders = mediaIds.map((_, i) => `$${i + 1}`).join(',');
  await query(`UPDATE media_files SET deleted_at = NOW() WHERE id IN (${placeholders})`, mediaIds);
}

// Get media by content ID
export async function getMediaByContent(contentId: string, entityType: string) {
  const result = await query(
    `SELECT mf.id, mf.filename, mf.mime_type, mf.size, mf.s3_url, mf.thumbnail_url, mf.alt_text_en, mf.alt_text_ar
    FROM media_files mf
    JOIN content_media cm ON mf.id = cm.media_id
    WHERE cm.content_id = $1 AND cm.entity_type = $2 AND mf.deleted_at IS NULL`,
    [contentId, entityType]
  );

  return result.rows;
}
