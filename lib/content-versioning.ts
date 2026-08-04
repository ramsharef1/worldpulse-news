// Content versioning and change tracking utilities

import { query } from './db';

export interface ContentVersion {
  id: string;
  content_id: string;
  entity_type: 'article' | 'event' | 'job' | 'faculty';
  version_number: number;
  data: Record<string, any>;
  changes: Record<string, { old: any; new: any }>;
  change_summary: string;
  changed_by: string;
  change_reason?: string;
  created_at: Date;
}

export interface ChangeAnnotation {
  id: string;
  version_id: string;
  field: string;
  old_value: any;
  new_value: any;
  note: string;
  annotated_by: string;
  created_at: Date;
}

// Create a new version when content is updated
export async function createVersion(
  contentId: string,
  entityType: 'article' | 'event' | 'job' | 'faculty',
  newData: Record<string, any>,
  oldData: Record<string, any>,
  userId: string,
  changeReason?: string
): Promise<ContentVersion> {
  const changes: Record<string, { old: any; new: any }> = {};
  const changedFields: string[] = [];

  // Compare old and new data
  Object.keys(newData).forEach((key) => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = { old: oldData[key], new: newData[key] };
      changedFields.push(key);
    }
  });

  // Generate change summary
  const changeSummary = changedFields.join(', ');

  const versionNumber = await getNextVersionNumber(contentId, entityType);

  const result = await query(
    `INSERT INTO content_versions
    (content_id, entity_type, version_number, data, changes, change_summary, changed_by, change_reason, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id, content_id, entity_type, version_number, data, changes, change_summary, changed_by, change_reason, created_at`,
    [contentId, entityType, versionNumber, JSON.stringify(newData), JSON.stringify(changes), changeSummary, userId, changeReason || null]
  );

  const version = result.rows[0];
  return {
    id: version.id,
    content_id: version.content_id,
    entity_type: version.entity_type,
    version_number: version.version_number,
    data: JSON.parse(version.data),
    changes: JSON.parse(version.changes),
    change_summary: version.change_summary,
    changed_by: version.changed_by,
    change_reason: version.change_reason,
    created_at: new Date(version.created_at),
  };
}

// Get version history for content
export async function getVersionHistory(contentId: string, entityType: string, limit: number = 50) {
  const result = await query(
    `SELECT id, content_id, entity_type, version_number, data, changes, change_summary, changed_by, change_reason, created_at
    FROM content_versions
    WHERE content_id = $1 AND entity_type = $2
    ORDER BY version_number DESC
    LIMIT $3`,
    [contentId, entityType, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    content_id: row.content_id,
    entity_type: row.entity_type,
    version_number: row.version_number,
    data: JSON.parse(row.data),
    changes: JSON.parse(row.changes),
    change_summary: row.change_summary,
    changed_by: row.changed_by,
    change_reason: row.change_reason,
    created_at: new Date(row.created_at),
  }));
}

// Rollback to specific version
export async function rollbackToVersion(contentId: string, entityType: string, versionNumber: number, userId: string) {
  const result = await query(
    `SELECT data FROM content_versions
    WHERE content_id = $1 AND entity_type = $2 AND version_number = $3`,
    [contentId, entityType, versionNumber]
  );

  if (result.rows.length === 0) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  const versionData = JSON.parse(result.rows[0].data);

  // Update the main entity with the old data
  if (entityType === 'article') {
    await query(
      `UPDATE articles SET
      title_en = $1, title_ar = $2, content_en = $3, content_ar = $4,
      excerpt_en = $5, excerpt_ar = $6, updated_at = NOW()
      WHERE id = $7`,
      [
        versionData.title_en,
        versionData.title_ar,
        versionData.content_en,
        versionData.content_ar,
        versionData.excerpt_en,
        versionData.excerpt_ar,
        contentId,
      ]
    );
  }

  // Create a new version documenting the rollback
  const nextVersion = await getNextVersionNumber(contentId, entityType);
  await query(
    `INSERT INTO content_versions
    (content_id, entity_type, version_number, data, changes, change_summary, changed_by, change_reason, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      contentId,
      entityType,
      nextVersion,
      JSON.stringify(versionData),
      JSON.stringify({}),
      'Rollback',
      userId,
      `Rolled back to version ${versionNumber}`,
    ]
  );

  return versionData;
}

// Add annotation to version
export async function annotateVersion(versionId: string, field: string, note: string, userId: string) {
  const result = await query(
    `INSERT INTO change_annotations
    (version_id, field, note, annotated_by, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, version_id, field, note, annotated_by, created_at`,
    [versionId, field, note, userId]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    version_id: row.version_id,
    field: row.field,
    note: row.note,
    annotated_by: row.annotated_by,
    created_at: new Date(row.created_at),
  };
}

// Get annotations for version
export async function getVersionAnnotations(versionId: string) {
  const result = await query(
    `SELECT id, version_id, field, note, annotated_by, created_at
    FROM change_annotations
    WHERE version_id = $1
    ORDER BY created_at DESC`,
    [versionId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    version_id: row.version_id,
    field: row.field,
    note: row.note,
    annotated_by: row.annotated_by,
    created_at: new Date(row.created_at),
  }));
}

// Compare two versions
export function compareVersions(version1: ContentVersion, version2: ContentVersion) {
  const diff: Record<string, { version1: any; version2: any }> = {};

  const allKeys = new Set([...Object.keys(version1.data), ...Object.keys(version2.data)]);

  allKeys.forEach((key) => {
    if (JSON.stringify(version1.data[key]) !== JSON.stringify(version2.data[key])) {
      diff[key] = {
        version1: version1.data[key],
        version2: version2.data[key],
      };
    }
  });

  return diff;
}

// Get next version number
async function getNextVersionNumber(contentId: string, entityType: string): Promise<number> {
  const result = await query(
    `SELECT MAX(version_number) as max_version FROM content_versions
    WHERE content_id = $1 AND entity_type = $2`,
    [contentId, entityType]
  );

  const maxVersion = result.rows[0]?.max_version || 0;
  return maxVersion + 1;
}

// Generate version diff for display
export function generateVersionDiff(changes: Record<string, { old: any; new: any }>) {
  const diffHtml: string[] = [];

  Object.entries(changes).forEach(([field, change]) => {
    diffHtml.push(`<div class="diff-field">`);
    diffHtml.push(`<p><strong>${field}</strong></p>`);
    diffHtml.push(`<p class="old-value"><span class="label">Old:</span> ${JSON.stringify(change.old)}</p>`);
    diffHtml.push(`<p class="new-value"><span class="label">New:</span> ${JSON.stringify(change.new)}</p>`);
    diffHtml.push(`</div>`);
  });

  return diffHtml.join('\n');
}
