import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validatePasswordPolicy,
  isValidEmail,
  checkRateLimit,
  normalizeIP,
  sanitizeInput,
} from '@/lib/auth-security';
import { authMiddleware, badRequest, unauthorized, forbidden } from '@/lib/auth-middleware';

// ============================================
// POST /api/auth/login
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceName, ipAddress } = await request.json();

    // Validate input
    if (!email || !password) {
      return badRequest('Email and password are required');
    }

    if (!isValidEmail(email)) {
      return badRequest('Invalid email format');
    }

    // Rate limiting
    const rateLimitKey = `login_${email}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user
    const userResult = await query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (userResult.rows.length === 0) {
      return unauthorized('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      return unauthorized('Account is not active');
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return unauthorized('Invalid email or password');
    }

    // Create session
    const sessionToken = generateSessionToken();
    const normalizedIP = normalizeIP(
      ipAddress ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );

    const sessionResult = await query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
       RETURNING id, token, expires_at`,
      [
        user.id,
        sessionToken,
        normalizedIP,
        request.headers.get('user-agent') || deviceName || 'Unknown',
      ]
    );

    const session = sessionResult.rows[0];

    // Fetch user role and permissions
    const roleResult = await query(
      `SELECT r.name FROM roles r WHERE r.id = $1`,
      [user.role_id]
    );

    const role = roleResult.rows[0]?.name || 'viewer';

    // Fetch permissions
    const permissionsResult = await query(
      `SELECT DISTINCT CONCAT(resource, ':', action) as permission
       FROM permissions WHERE role_id = $1`,
      [user.role_id]
    );

    const permissions = permissionsResult.map((p) => p.permission);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role,
      permissions,
      sessionId: session.id,
      twoFAVerified: !user.two_fa_enabled, // If 2FA is enabled, require OTP
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'login', 'user', normalizedIP]
    );

    return NextResponse.json(
      {
        success: true,
        accessToken,
        refreshToken,
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role,
          twoFAEnabled: user.two_fa_enabled,
          requiresOTP: user.two_fa_enabled,
        },
        expiresAt: session.expires_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/auth/signup
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return badRequest('All fields are required');
    }

    if (!isValidEmail(email)) {
      return badRequest('Invalid email format');
    }

    // Validate password policy
    const passwordValidation = validatePasswordPolicy(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet policy requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Get default editor role
    const roleResult = await query(
      "SELECT id FROM roles WHERE name = 'editor' LIMIT 1"
    );

    if (roleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'System configuration error' },
        { status: 500 }
      );
    }

    const roleId = roleResult.rows[0].id;
    const hashedPassword = await hashPassword(password);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, email, first_name, last_name, role_id, two_fa_enabled`,
      [
        email.toLowerCase(),
        hashedPassword,
        sanitizeInput(firstName),
        sanitizeInput(lastName),
        roleId,
      ]
    );

    const newUser = userResult.rows[0];

    // Create initial session
    const sessionToken = generateSessionToken();
    const sessionResult = await query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
       RETURNING id, expires_at`,
      [
        newUser.id,
        sessionToken,
        normalizeIP(request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'),
        request.headers.get('user-agent'),
      ]
    );

    const session = sessionResult.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: 'editor',
      permissions: [],
      sessionId: session.id,
      twoFAVerified: true,
    });

    const refreshToken = generateRefreshToken({
      userId: newUser.id,
      sessionId: session.id,
    });

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [newUser.id, 'signup', 'user', normalizeIP(request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown')]
    );

    return NextResponse.json(
      {
        success: true,
        accessToken,
        refreshToken,
        sessionId: session.id,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'editor',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/auth/logout
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Invalidate session
    await query(
      'DELETE FROM sessions WHERE id = $1',
      [auth.user.sessionId]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [auth.user.userId, 'logout', 'user']
    );

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/auth/refresh
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return badRequest('Refresh token is required');
    }

    // Verify refresh token
    const { verifyRefreshToken } = await import('@/lib/auth-security');
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return unauthorized('Invalid refresh token');
    }

    // Check if session exists
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [payload.sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return unauthorized('Session expired');
    }

    const user = sessionResult.rows[0];

    // Fetch user details
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [user.user_id]
    );

    if (userResult.rows.length === 0) {
      return unauthorized('User not found');
    }

    const userData = userResult.rows[0];

    // Fetch role and permissions
    const roleResult = await query(
      `SELECT r.name FROM roles r WHERE r.id = $1`,
      [userData.role_id]
    );

    const role = roleResult.rows[0]?.name || 'viewer';

    const permissionsResult = await query(
      `SELECT DISTINCT CONCAT(resource, ':', action) as permission
       FROM permissions WHERE role_id = $1`,
      [userData.role_id]
    );

    const permissions = permissionsResult.map((p) => p.permission);

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: userData.id,
      email: userData.email,
      role,
      permissions,
      sessionId: user.id,
      twoFAVerified: !userData.two_fa_enabled,
    });

    return NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        expiresIn: '15m',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
