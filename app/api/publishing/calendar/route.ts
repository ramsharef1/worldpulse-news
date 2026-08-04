import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

/**
 * GET /api/publishing/calendar
 * Returns calendar events for publishing schedule
 * Supports filtering by date range, university, and status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const universityId = searchParams.get('universityId') || auth.user.universityId;
    const viewType = searchParams.get('viewType') || 'month'; // month, week, day

    let whereClause = 'ce.university_id = $1';
    const params: any[] = [universityId];

    if (startDate) {
      whereClause += ` AND ce.event_date >= $${params.length + 1}::TIMESTAMP`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND ce.event_date <= $${params.length + 1}::TIMESTAMP`;
      params.push(endDate);
    }

    const result = await query(
      `SELECT
        ce.id,
        ce.article_id,
        ce.event_date,
        ce.event_type,
        ce.title,
        ce.description,
        ce.color,
        ce.is_all_day,
        ce.timezone,
        pq.status as publish_status,
        pq.priority
      FROM calendar_events ce
      LEFT JOIN publishing_queue pq ON ce.article_id = pq.article_id
      WHERE ${whereClause}
      ORDER BY ce.event_date ASC`,
      params
    );

    // Format response for calendar display
    const events = result.rows.map((event) => ({
      id: event.id,
      articleId: event.article_id,
      date: event.event_date,
      type: event.event_type,
      title: event.title,
      description: event.description,
      color: event.color || '#3B82F6',
      allDay: event.is_all_day,
      timezone: event.timezone,
      publishStatus: event.publish_status,
      priority: event.priority,
    }));

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
      viewType,
      range: { startDate, endDate },
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publishing/calendar
 * Create a calendar event for content scheduling
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { articleId, eventDate, eventType, title, description, timezone, isAllDay } = body;

    // Validate required fields
    if (!articleId || !eventDate || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create calendar event
    const result = await query(
      `INSERT INTO calendar_events
       (article_id, university_id, event_date, event_type, title, description,
        timezone, is_all_day, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        articleId,
        auth.user.universityId,
        eventDate,
        eventType,
        title || `Event for ${articleId}`,
        description || '',
        timezone || 'UTC',
        isAllDay || false,
        auth.user.userId,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        event: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/publishing/calendar
 * Update calendar event
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json();
    const { eventId, eventDate, title, description, color } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE calendar_events
       SET event_date = COALESCE($1, event_date),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           color = COALESCE($4, color),
           updated_at = NOW()
       WHERE id = $5 AND university_id = $6
       RETURNING *`,
      [eventDate, title, description, color, eventId, auth.user.universityId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publishing/calendar
 * Delete calendar event
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM calendar_events
       WHERE id = $1 AND university_id = $2
       RETURNING *`,
      [eventId, auth.user.universityId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted',
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
