// Duplicate detection and warnings

import { query } from './db';

export interface DuplicateMatch {
  id: string;
  title: string;
  similarity_score: number;
  entity_type: 'article' | 'event' | 'job';
  created_at: Date;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
  recommendation: string;
}

// Calculate similarity between two strings (Levenshtein distance)
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = getEditDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

// Get edit distance between two strings
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

// Check for duplicate articles
export async function checkArticleDuplicates(
  title_en: string,
  title_ar: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const similarityThreshold = 75;
  const matches: DuplicateMatch[] = [];

  // Get existing articles
  const result = await query(`SELECT id, title_en, title_ar, created_at FROM articles WHERE status != 'archived'`);

  const articles = result.rows;

  for (const article of articles) {
    if (excludeId && article.id === excludeId) continue;

    const enSimilarity = calculateSimilarity(title_en, article.title_en);
    const arSimilarity = calculateSimilarity(title_ar, article.title_ar);
    const avgSimilarity = (enSimilarity + arSimilarity) / 2;

    if (avgSimilarity >= similarityThreshold) {
      matches.push({
        id: article.id,
        title: `${article.title_en} / ${article.title_ar}`,
        similarity_score: avgSimilarity,
        entity_type: 'article',
        created_at: new Date(article.created_at),
      });
    }
  }

  // Sort by similarity score (highest first)
  matches.sort((a, b) => b.similarity_score - a.similarity_score);

  const isDuplicate = matches.length > 0 && matches[0].similarity_score >= 90;
  const recommendation = isDuplicate
    ? 'This appears to be a duplicate. Consider updating existing article instead.'
    : matches.length > 0
      ? 'Similar articles found. Review before publishing.'
      : 'No duplicates detected.';

  return {
    isDuplicate,
    matches: matches.slice(0, 5), // Return top 5 matches
    recommendation,
  };
}

// Check for duplicate events
export async function checkEventDuplicates(
  title_en: string,
  title_ar: string,
  start_date: Date,
  university_id: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const similarityThreshold = 75;
  const matches: DuplicateMatch[] = [];

  // Get existing events from same university
  const result = await query(
    `SELECT id, title_en, title_ar, start_date, created_at FROM events
    WHERE status != 'completed' AND university_id = $1`,
    [university_id]
  );

  const events = result.rows;

  for (const event of events) {
    if (excludeId && event.id === excludeId) continue;

    const enSimilarity = calculateSimilarity(title_en, event.title_en);
    const arSimilarity = calculateSimilarity(title_ar, event.title_ar);
    const avgSimilarity = (enSimilarity + arSimilarity) / 2;

    // Check if dates are close (same day or adjacent days)
    const eventDate = new Date(event.start_date);
    const dateDiff = Math.abs((eventDate.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24));
    const sameDatePenalty = dateDiff < 2 ? 0 : 10; // Reduce similarity if not on same date

    const adjustedSimilarity = avgSimilarity - sameDatePenalty;

    if (adjustedSimilarity >= similarityThreshold) {
      matches.push({
        id: event.id,
        title: `${event.title_en} / ${event.title_ar}`,
        similarity_score: adjustedSimilarity,
        entity_type: 'event',
        created_at: new Date(event.created_at),
      });
    }
  }

  matches.sort((a, b) => b.similarity_score - a.similarity_score);

  const isDuplicate = matches.length > 0 && matches[0].similarity_score >= 90;
  const recommendation = isDuplicate
    ? 'This appears to be a duplicate event. Consider updating existing event instead.'
    : matches.length > 0
      ? 'Similar events found. Review before publishing.'
      : 'No duplicates detected.';

  return {
    isDuplicate,
    matches: matches.slice(0, 5),
    recommendation,
  };
}

// Check for duplicate jobs
export async function checkJobDuplicates(
  title_en: string,
  title_ar: string,
  university_id: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const similarityThreshold = 75;
  const matches: DuplicateMatch[] = [];

  // Get existing jobs from same university
  const result = await query(
    `SELECT id, title_en, title_ar, created_at FROM jobs
    WHERE status = 'open' AND university_id = $1`,
    [university_id]
  );

  const jobs = result.rows;

  for (const job of jobs) {
    if (excludeId && job.id === excludeId) continue;

    const enSimilarity = calculateSimilarity(title_en, job.title_en);
    const arSimilarity = calculateSimilarity(title_ar, job.title_ar);
    const avgSimilarity = (enSimilarity + arSimilarity) / 2;

    if (avgSimilarity >= similarityThreshold) {
      matches.push({
        id: job.id,
        title: `${job.title_en} / ${job.title_ar}`,
        similarity_score: avgSimilarity,
        entity_type: 'job',
        created_at: new Date(job.created_at),
      });
    }
  }

  matches.sort((a, b) => b.similarity_score - a.similarity_score);

  const isDuplicate = matches.length > 0 && matches[0].similarity_score >= 90;
  const recommendation = isDuplicate
    ? 'This appears to be a duplicate job posting. Consider updating existing posting instead.'
    : matches.length > 0
      ? 'Similar job postings found. Review before publishing.'
      : 'No duplicates detected.';

  return {
    isDuplicate,
    matches: matches.slice(0, 5),
    recommendation,
  };
}

// Batch duplicate detection
export async function batchCheckDuplicates(
  items: Array<{
    id?: string;
    title_en: string;
    title_ar: string;
    type: 'article' | 'event' | 'job';
    start_date?: Date;
    university_id?: string;
  }>
): Promise<Map<string, DuplicateCheckResult>> {
  const results = new Map<string, DuplicateCheckResult>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let duplicateCheck: DuplicateCheckResult;

    if (item.type === 'article') {
      duplicateCheck = await checkArticleDuplicates(item.title_en, item.title_ar, item.id);
    } else if (item.type === 'event') {
      duplicateCheck = await checkEventDuplicates(item.title_en, item.title_ar, item.start_date!, item.university_id!, item.id);
    } else {
      duplicateCheck = await checkJobDuplicates(item.title_en, item.title_ar, item.university_id!, item.id);
    }

    results.set(item.id || `temp_${i}`, duplicateCheck);
  }

  return results;
}

// Log duplicate check
export async function logDuplicateCheck(contentId: string, entityType: string, matches: DuplicateMatch[], isDuplicate: boolean) {
  const matchIds = matches.map((m) => m.id);

  await query(
    `INSERT INTO duplicate_checks
    (content_id, entity_type, matched_ids, is_duplicate, created_at)
    VALUES ($1, $2, $3, $4, NOW())`,
    [contentId, entityType, JSON.stringify(matchIds), isDuplicate]
  );
}
