import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  generateAPIKey,
  hashAPIKey,
  generateRandomToken,
} from '@/lib/auth-security';
import { authMiddleware, unauthorized, badRequest } from '@/lib/auth-middleware';

// ============================================
// GET /api/auth/apikeys - List API keys
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    const keysResult = await query(
      `SELECT
        id,
        name,
        key_hash,
        last_used,
        expires_at,
        created_at,
        SUBSTRING(key_hash, 1, 8) || '...' as key_preview
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [auth.user.userId]
    );

    const keys = keysResult.rows.map((key) => ({
      id: key.id,
      name: key.name || 'Unnamed Key',
      keyPreview: key.key_preview,
      lastUsed: key.last_used,
      expiresAt: key.expires_at,
      createdAt: key.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        keys,
        total: keys.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/apikeys - Create API key
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { name, expiresIn = 365 } = await request.json();

    if (!name) {
      return badRequest('API key name is required');
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Generate API key
    const { publicKey, secretKey } = generateAPIKey();
    const keyHash = hashAPIKey(secretKey);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Store key
    const keyResult = await query(
      `INSERT INTO api_keys (user_id, key_hash, name, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [auth.user.userId, keyHash, name, expiresAt]
    );

    const keyId = keyResult.rows[0].id;

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [auth.user.userId, 'create_api_key', 'api_key', keyId]
    );

    return NextResponse.json(
      {
        success: true,
        key: {
          id: keyId,
          name,
          secretKey, // Only shown once!
          publicKey,
          expiresAt,
          createdAt: new Date(),
        },
        message: 'Keep your secret key safe. It will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/auth/apikeys/:keyId - Update API key
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const { keyId, name } = await request.json();

    if (!keyId) {
      return badRequest('API key ID is required');
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Verify key belongs to user
    const keyResult = await query(
      'SELECT user_id FROM api_keys WHERE id = $1',
      [keyId]
    );

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (keyResult.rows[0].user_id !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Cannot modify other user API keys' },
        { status: 403 }
      );
    }

    // Update key
    if (name) {
      await query('UPDATE api_keys SET name = $1 WHERE id = $2', [name, keyId]);
    }

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [auth.user.userId, 'update_api_key', 'api_key', keyId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'API key updated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/auth/apikeys/:keyId - Revoke API key
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const keyId = pathParts[pathParts.length - 1];

    if (!keyId || keyId === 'route.ts') {
      return badRequest('API key ID is required');
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Verify key belongs to user
    const keyResult = await query(
      'SELECT user_id FROM api_keys WHERE id = $1',
      [keyId]
    );

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (keyResult.rows[0].user_id !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Cannot revoke other user API keys' },
        { status: 403 }
      );
    }

    // Delete key
    await query('DELETE FROM api_keys WHERE id = $1', [keyId]);

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [auth.user.userId, 'revoke_api_key', 'api_key', keyId]
    );

    return NextResponse.json(
      { success: true, message: 'API key revoked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
