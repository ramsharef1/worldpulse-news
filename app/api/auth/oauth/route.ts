import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  generateAccessToken,
  generateRefreshToken,
  generateSessionToken,
  generateRandomToken,
  normalizeIP,
} from '@/lib/auth-security';
import { authMiddleware, badRequest, unauthorized } from '@/lib/auth-middleware';

// ============================================
// OAuth2/SAML Configuration
// ============================================

const OAUTH_PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
  },
};

// ============================================
// POST /api/auth/oauth/initiate - Start OAuth flow
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { provider, redirectUri } = await request.json();

    if (!provider || !redirectUri) {
      return badRequest('Provider and redirect URI are required');
    }

    if (!OAUTH_PROVIDERS[provider as keyof typeof OAUTH_PROVIDERS]) {
      return badRequest('Unsupported OAuth provider');
    }

    const providerConfig = OAUTH_PROVIDERS[provider as keyof typeof OAUTH_PROVIDERS];

    if (!providerConfig.clientId) {
      return NextResponse.json(
        { error: 'OAuth provider not configured' },
        { status: 503 }
      );
    }

    // Generate state for CSRF protection
    const state = generateRandomToken(32);
    const codeVerifier = generateRandomToken(43); // PKCE

    // Store state temporarily
    await query(
      `INSERT INTO oauth_states (state, provider, code_verifier, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [state, provider, codeVerifier]
    );

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        provider === 'google'
          ? 'openid email profile'
          : 'openid email profile',
      state,
      prompt: 'select_account',
    });

    const authUrl = `${providerConfig.authUrl}?${params.toString()}`;

    return NextResponse.json(
      {
        success: true,
        authUrl,
        state,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OAuth initiate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/oauth/callback - Handle OAuth callback
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const { provider, code, state } = await request.json();

    if (!provider || !code || !state) {
      return badRequest('Provider, code, and state are required');
    }

    const providerConfig = OAUTH_PROVIDERS[provider as keyof typeof OAUTH_PROVIDERS];

    if (!providerConfig) {
      return badRequest('Unsupported OAuth provider');
    }

    // Verify state
    const stateResult = await query(
      `SELECT code_verifier FROM oauth_states
       WHERE state = $1 AND expires_at > NOW()`,
      [state]
    );

    if (stateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired state' },
        { status: 400 }
      );
    }

    // In production, exchange code for token
    // For now, we'll simulate the token exchange
    const userInfo = {
      email: `user-${Date.now()}@example.com`,
      name: 'OAuth User',
      picture: null,
    };

    // Find or create user
    let userResult = await query('SELECT * FROM users WHERE email = $1', [
      userInfo.email,
    ]);

    let user;
    const defaultRoleResult = await query(
      "SELECT id FROM roles WHERE name = 'editor' LIMIT 1"
    );

    if (userResult.rows.length === 0) {
      // Create new user
      const createResult = await query(
        `INSERT INTO users (email, first_name, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id, email, first_name, role_id, two_fa_enabled`,
        [
          userInfo.email,
          userInfo.name,
          'oauth_user', // No password for OAuth users
          defaultRoleResult.rows[0].id,
        ]
      );
      user = createResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Create session
    const sessionToken = generateSessionToken();
    const sessionResult = await query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
       RETURNING id, expires_at`,
      [
        user.id,
        sessionToken,
        normalizeIP(
          request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        ),
        `OAuth (${provider})`,
      ]
    );

    const session = sessionResult.rows[0];

    // Fetch role
    const roleResult = await query(
      'SELECT name FROM roles WHERE id = $1',
      [user.role_id]
    );

    const role = roleResult.rows[0]?.name || 'viewer';

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role,
      permissions: [],
      sessionId: session.id,
      twoFAVerified: !user.two_fa_enabled,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, changes)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'oauth_login',
        'user',
        JSON.stringify({ provider }),
      ]
    );

    // Clean up state
    await query('DELETE FROM oauth_states WHERE state = $1', [state]);

    return NextResponse.json(
      {
        success: true,
        accessToken,
        refreshToken,
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.first_name,
          role,
        },
        expiresAt: session.expires_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/auth/oauth/connect - Link OAuth to existing account
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get user's linked OAuth providers
    const providersResult = await query(
      `SELECT DISTINCT provider FROM oauth_accounts WHERE user_id = $1`,
      [auth.user.userId]
    );

    const linkedProviders = providersResult.rows.map((p) => p.provider);
    const availableProviders = Object.keys(OAUTH_PROVIDERS).filter(
      (p) => !linkedProviders.includes(p)
    );

    return NextResponse.json(
      {
        success: true,
        linkedProviders,
        availableProviders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get OAuth status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/auth/oauth/disconnect - Unlink OAuth provider
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider) {
      return badRequest('Provider is required');
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Check if user has other auth methods
    const authResult = await query(
      `SELECT COUNT(*) as count FROM oauth_accounts WHERE user_id = $1 AND provider != $2`,
      [auth.user.userId, provider]
    );

    const hasPassword = (
      await query('SELECT password_hash FROM users WHERE id = $1', [
        auth.user.userId,
      ])
    ).rows[0]?.password_hash !== 'oauth_user';

    if (authResult.rows[0].count === 0 && !hasPassword) {
      return NextResponse.json(
        { error: 'Cannot unlink only authentication method' },
        { status: 400 }
      );
    }

    // Disconnect OAuth account
    await query(
      'DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2',
      [auth.user.userId, provider]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, changes)
       VALUES ($1, $2, $3, $4)`,
      [
        auth.user.userId,
        'disconnect_oauth',
        'oauth',
        JSON.stringify({ provider }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: `${provider} disconnected`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Disconnect OAuth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
