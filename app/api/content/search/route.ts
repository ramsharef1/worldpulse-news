import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Search across all content types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const entityType = searchParams.get('entity_type'); // article, event, job, faculty - optional filter
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const university_id = searchParams.get('university_id');

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query required' },
        { status: 400 }
      );
    }

    const searchTerm = `%${q}%`;
    const offset = (page - 1) * limit;

    let results: any = {};
    let totalResults = 0;

    // Search articles
    if (!entityType || entityType === 'article') {
      let articleQuery = `SELECT id, title_en, title_ar, excerpt_en, 'article' as type, status, created_at
        FROM articles
        WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR content_en ILIKE $1 OR content_ar ILIKE $1 OR excerpt_en ILIKE $1)`;

      const articleParams: any[] = [searchTerm];

      if (university_id) {
        articleParams.push(university_id);
        articleQuery += ` AND university_id = $${articleParams.length}`;
      }

      articleQuery += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const articleResult = await query(articleQuery, articleParams);
      results.articles = articleResult.rows;

      // Get total count
      let countQuery = 'SELECT COUNT(*) as count FROM articles WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR content_en ILIKE $1 OR content_ar ILIKE $1 OR excerpt_en ILIKE $1)';

      if (university_id) {
        articleParams.length = 2;
        articleParams[1] = university_id;
        countQuery += ` AND university_id = $2`;
      }

      const countResult = await query(countQuery, articleParams.slice(0, university_id ? 2 : 1));
      results.articleCount = parseInt(countResult.rows[0].count);
      totalResults += results.articleCount;
    }

    // Search events
    if (!entityType || entityType === 'event') {
      let eventQuery = `SELECT id, title_en, title_ar, description_en, 'event' as type, status, start_date, created_at
        FROM events
        WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR description_en ILIKE $1 OR description_ar ILIKE $1)`;

      const eventParams: any[] = [searchTerm];

      if (university_id) {
        eventParams.push(university_id);
        eventQuery += ` AND university_id = $${eventParams.length}`;
      }

      eventQuery += ` ORDER BY start_date DESC LIMIT ${limit} OFFSET ${offset}`;

      const eventResult = await query(eventQuery, eventParams);
      results.events = eventResult.rows;

      let countQuery = 'SELECT COUNT(*) as count FROM events WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR description_en ILIKE $1 OR description_ar ILIKE $1)';

      if (university_id) {
        eventParams.length = 2;
        eventParams[1] = university_id;
        countQuery += ` AND university_id = $2`;
      }

      const countResult = await query(countQuery, eventParams.slice(0, university_id ? 2 : 1));
      results.eventCount = parseInt(countResult.rows[0].count);
      totalResults += results.eventCount;
    }

    // Search jobs
    if (!entityType || entityType === 'job') {
      let jobQuery = `SELECT id, title_en, title_ar, description_en, 'job' as type, status, position_type, created_at
        FROM jobs
        WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR description_en ILIKE $1 OR description_ar ILIKE $1)`;

      const jobParams: any[] = [searchTerm];

      if (university_id) {
        jobParams.push(university_id);
        jobQuery += ` AND university_id = $${jobParams.length}`;
      }

      jobQuery += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const jobResult = await query(jobQuery, jobParams);
      results.jobs = jobResult.rows;

      let countQuery = 'SELECT COUNT(*) as count FROM jobs WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR description_en ILIKE $1 OR description_ar ILIKE $1)';

      if (university_id) {
        jobParams.length = 2;
        jobParams[1] = university_id;
        countQuery += ` AND university_id = $2`;
      }

      const countResult = await query(countQuery, jobParams.slice(0, university_id ? 2 : 1));
      results.jobCount = parseInt(countResult.rows[0].count);
      totalResults += results.jobCount;
    }

    // Search faculty
    if (!entityType || entityType === 'faculty') {
      let facultyQuery = `SELECT id, name, email, 'faculty' as type, bio, created_at
        FROM faculty
        WHERE (name ILIKE $1 OR email ILIKE $1 OR bio ILIKE $1 OR research_interests ILIKE $1)`;

      const facultyParams: any[] = [searchTerm];

      if (university_id) {
        facultyParams.push(university_id);
        facultyQuery += ` AND university_id = $${facultyParams.length}`;
      }

      facultyQuery += ` ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`;

      const facultyResult = await query(facultyQuery, facultyParams);
      results.faculty = facultyResult.rows;

      let countQuery = 'SELECT COUNT(*) as count FROM faculty WHERE (name ILIKE $1 OR email ILIKE $1 OR bio ILIKE $1 OR research_interests ILIKE $1)';

      if (university_id) {
        facultyParams.length = 2;
        facultyParams[1] = university_id;
        countQuery += ` AND university_id = $2`;
      }

      const countResult = await query(countQuery, facultyParams.slice(0, university_id ? 2 : 1));
      results.facultyCount = parseInt(countResult.rows[0].count);
      totalResults += results.facultyCount;
    }

    // Flatten results for easier consumption
    const allResults = [
      ...(results.articles || []),
      ...(results.events || []),
      ...(results.jobs || []),
      ...(results.faculty || []),
    ];

    return NextResponse.json({
      success: true,
      query: q,
      totalResults,
      results: {
        articles: results.articles || [],
        events: results.events || [],
        jobs: results.jobs || [],
        faculty: results.faculty || [],
      },
      counts: {
        articles: results.articleCount || 0,
        events: results.eventCount || 0,
        jobs: results.jobCount || 0,
        faculty: results.facultyCount || 0,
      },
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error searching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search content', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Advanced search with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query: searchQuery, filters } = body;
    const page = body.page || 1;
    const limit = body.limit || 20;

    if (!searchQuery) {
      return NextResponse.json(
        { success: false, error: 'Search query required' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${searchQuery}%`;

    let results: any = {};

    // Search with filters
    if (!filters?.type || filters.type === 'article') {
      let sql = `SELECT id, title_en, title_ar, excerpt_en, 'article' as type, status, university_id, created_at
        FROM articles
        WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR content_en ILIKE $1 OR content_ar ILIKE $1)`;

      const params: any[] = [searchTerm];
      let paramIndex = 2;

      if (filters?.university_id) {
        params.push(filters.university_id);
        sql += ` AND university_id = $${paramIndex++}`;
      }

      if (filters?.status) {
        params.push(filters.status);
        sql += ` AND status = $${paramIndex++}`;
      }

      if (filters?.date_from) {
        params.push(filters.date_from);
        sql += ` AND created_at >= $${paramIndex++}`;
      }

      if (filters?.date_to) {
        params.push(filters.date_to);
        sql += ` AND created_at <= $${paramIndex++}`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(sql, params);
      results.articles = result.rows;
    }

    if (!filters?.type || filters.type === 'event') {
      let sql = `SELECT id, title_en, title_ar, description_en, 'event' as type, status, university_id, start_date, created_at
        FROM events
        WHERE (title_en ILIKE $1 OR title_ar ILIKE $1 OR description_en ILIKE $1 OR description_ar ILIKE $1)`;

      const params: any[] = [searchTerm];
      let paramIndex = 2;

      if (filters?.university_id) {
        params.push(filters.university_id);
        sql += ` AND university_id = $${paramIndex++}`;
      }

      if (filters?.upcoming_only) {
        sql += ` AND start_date >= NOW()`;
      }

      sql += ` ORDER BY start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(sql, params);
      results.events = result.rows;
    }

    return NextResponse.json({
      success: true,
      query: searchQuery,
      results,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error in advanced search:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform search', details: (error as Error).message },
      { status: 500 }
    );
  }
}
