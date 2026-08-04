import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authMiddleware, unauthorized } from '@/lib/auth-middleware';

// ============================================
// GET /api/auth/sessions - List all user sessions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get all active sessions for user
    const sessionsResult = await query(
      `SELECT
        id,
        ip_address,
        user_agent,
        created_at,
        expires_at,
        CASE WHEN id = $1 THEN true ELSE false END as is_current
       FROM sessions
       WHERE user_id = $2 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [auth.user.sessionId, auth.user.userId]
    );

    const sessions = sessionsResult.rows.map((session) => ({
      id: session.id,
      ipAddress: session.ip_address,
      device: parseUserAgent(session.user_agent),
      createdAt: session.created_at,
      expiresAt: session.expires_at,
      isCurrent: session.is_current,
    }));

    return NextResponse.json(
      {
        success: true,
        sessions,
        total: sessions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/sessions/revoke - Revoke specific session
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Verify session belongs to user
    const sessionResult = await query(
      'SELECT user_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionResult.rows[0].user_id !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Cannot revoke other user sessions' },
        { status: 403 }
      );
    }

    // Delete session
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [auth.user.userId, 'revoke_session', 'session', sessionId]
    );

    return NextResponse.json(
      { success: true, message: 'Session revoked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/sessions/revoke-all - Revoke all sessions
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get current session to exclude it
    const currentSessionId = auth.user.sessionId;

    // Delete all other sessions
    const result = await query(
      `DELETE FROM sessions
       WHERE user_id = $1 AND id != $2
       RETURNING id`,
      [auth.user.userId, currentSessionId]
    );

    const revokedCount = result.rows.length;

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [auth.user.userId, 'revoke_all_sessions', 'security']
    );

    return NextResponse.json(
      {
        success: true,
        message: `${revokedCount} sessions revoked`,
        revokedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/auth/sessions/:sessionId - Delete specific session
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    // Extract sessionId from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];

    if (!sessionId || sessionId === 'route.ts') {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Verify session belongs to user
    const sessionResult = await query(
      'SELECT user_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionResult.rows[0].user_id !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Cannot revoke other user sessions' },
        { status: 403 }
      );
    }

    // Don't allow revoking current session via DELETE
    if (sessionId === auth.user.sessionId) {
      return NextResponse.json(
        { error: 'Use /logout to revoke current session' },
        { status: 400 }
      );
    }

    // Delete session
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [auth.user.userId, 'revoke_session', 'session', sessionId]
    );

    return NextResponse.json(
      { success: true, message: 'Session revoked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Device';

  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('Linux')) return 'Linux';

  return 'Unknown Device';
}
