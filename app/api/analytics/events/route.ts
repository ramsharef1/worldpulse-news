import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { badRequest } from '@/lib/auth-middleware';

/**
 * POST /api/analytics/events
 * Track user events (views, clicks, shares, etc.)
 * This endpoint is publicly accessible (no auth required for client-side tracking)
 */
export async function POST(request: NextRequest) {
  try {
    const {
      eventType,
      entityType,
      entityId,
      sessionId,
      userId,
      metadata,
    } = await request.json();

    // Validate required fields
    if (!eventType || !entityType) {
      return badRequest('Event type and entity type are required');
    }

    // Extract IP address
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Insert event log
    await query(
      `
      INSERT INTO event_logs
        (event_type, entity_type, entity_id, user_id, reader_session_id, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `,
      [
        eventType,
        entityType,
        entityId || null,
        userId || null,
        sessionId || null,
        JSON.stringify(metadata || {}),
      ]
    );

    // Update reader session last visit time if session exists
    if (sessionId) {
      await query(
        `
        UPDATE reader_sessions
        SET last_visit = NOW(),
            visit_count = visit_count + 1,
            total_time_spent = total_time_spent + COALESCE($1::int, 0)
        WHERE id = $2
      `,
        [metadata?.timeOnPage || 0, sessionId]
      );
    }

    return NextResponse.json(
      { success: true, message: 'Event tracked' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Event tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/events
 * Get event logs for analysis (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type');
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (eventType) {
      whereClause += ` AND event_type = $${params.length + 1}`;
      params.push(eventType);
    }

    if (entityType) {
      whereClause += ` AND entity_type = $${params.length + 1}`;
      params.push(entityType);
    }

    if (entityId) {
      whereClause += ` AND entity_id = $${params.length + 1}`;
      params.push(entityId);
    }

    if (startDate) {
      whereClause += ` AND timestamp >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await query(
      `
      SELECT
        id,
        event_type,
        entity_type,
        entity_id,
        user_id,
        reader_session_id,
        metadata,
        timestamp
      FROM event_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM event_logs ${whereClause}`,
      params
    );

    return NextResponse.json(
      {
        success: true,
        events: result.rows,
        pagination: {
          limit,
          offset,
          total: countResult.rows[0]?.total || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Event log retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event logs' },
      { status: 500 }
    );
  }
}
