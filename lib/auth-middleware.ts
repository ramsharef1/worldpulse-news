import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isIPWhitelisted, normalizeIP } from './auth-security';
import { query } from './db';

// ============================================
// PERMISSION LEVELS
// ============================================

export enum PermissionLevel {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export const PERMISSION_HIERARCHY: Record<string, number> = {
  super_admin: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

// ============================================
// ROLE-BASED PERMISSIONS
// ============================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'users:*',
    'articles:*',
    'settings:*',
    'audit:*',
    'permissions:*',
    'api_keys:*',
    '2fa:*',
    'sessions:*',
  ],
  admin: [
    'articles:create',
    'articles:update',
    'articles:delete',
    'articles:publish',
    'articles:approve',
    'users:read',
    'users:update',
    'audit:read',
    'api_keys:read',
  ],
  editor: [
    'articles:create',
    'articles:update',
    'articles:read',
    'api_keys:read:own',
  ],
  viewer: ['articles:read', 'users:read:own'],
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

export const authMiddleware = async (request: NextRequest) => {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authorization.slice(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
      };
    }

    // Verify session is still active
    const sessionCheck = await query(
      'SELECT id FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [payload.sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return {
        authenticated: false,
        error: 'Session expired',
      };
    }

    return {
      authenticated: true,
      user: payload,
    };
  } catch (error) {
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
};

// ============================================
// AUTHORIZATION MIDDLEWARE (ROLE-BASED)
// ============================================

export const requireRole = (allowedRoles: string[]) => {
  return async (request: NextRequest) => {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return {
        authorized: false,
        error: 'Unauthorized',
      };
    }

    if (!allowedRoles.includes(auth.user.role)) {
      return {
        authorized: false,
        error: 'Insufficient permissions',
      };
    }

    return {
      authorized: true,
      user: auth.user,
    };
  };
};

// ============================================
// PERMISSION CHECK MIDDLEWARE
// ============================================

export const requirePermission = (requiredPermission: string) => {
  return async (request: NextRequest) => {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return {
        authorized: false,
        error: 'Unauthorized',
      };
    }

    const permissions = ROLE_PERMISSIONS[auth.user.role] || [];

    // Check for exact permission or wildcard
    const hasPermission =
      permissions.includes(requiredPermission) ||
      permissions.some((p) => p.endsWith(':*'));

    if (!hasPermission) {
      return {
        authorized: false,
        error: 'Insufficient permissions',
      };
    }

    return {
      authorized: true,
      user: auth.user,
    };
  };
};

// ============================================
// IP WHITELISTING MIDDLEWARE
// ============================================

export const requireIPWhitelist = async (request: NextRequest) => {
  try {
    const ip = normalizeIP(
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        request.ip ||
        'unknown'
    );

    // Get user's IP whitelist
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return {
        authorized: false,
        error: 'Unauthorized',
        ip,
      };
    }

    const result = await query(
      `SELECT ip_whitelist FROM admin_settings WHERE user_id = $1`,
      [auth.user.userId]
    );

    const whitelist = result.rows[0]?.ip_whitelist || [];

    if (!isIPWhitelisted(ip, whitelist)) {
      return {
        authorized: false,
        error: 'IP not whitelisted',
        ip,
      };
    }

    return {
      authorized: true,
      user: auth.user,
      ip,
    };
  } catch (error) {
    return {
      authorized: false,
      error: 'IP check failed',
    };
  }
};

// ============================================
// 2FA VERIFICATION MIDDLEWARE
// ============================================

export const require2FA = async (request: NextRequest) => {
  const auth = await authMiddleware(request);

  if (!auth.authenticated) {
    return {
      authorized: false,
      error: 'Unauthorized',
    };
  }

  if (!auth.user.twoFAVerified) {
    return {
      authorized: false,
      error: '2FA verification required',
      requiresOTP: true,
    };
  }

  return {
    authorized: true,
    user: auth.user,
  };
};

// ============================================
// COMBINED MIDDLEWARE FOR ADMIN PANEL
// ============================================

export const requireAdminAuth = (
  requireIPCheck: boolean = true,
  require2FACheck: boolean = true
) => {
  return async (request: NextRequest) => {
    // First, check basic auth
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return {
        authorized: false,
        error: 'Unauthorized',
        statusCode: 401,
      };
    }

    // Check admin role
    const adminRoles = ['super_admin', 'admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return {
        authorized: false,
        error: 'Admin access required',
        statusCode: 403,
      };
    }

    // Check IP whitelist if enabled
    if (requireIPCheck) {
      const ipCheck = await requireIPWhitelist(request);
      if (!ipCheck.authorized) {
        return {
          authorized: false,
          error: ipCheck.error,
          statusCode: 403,
        };
      }
    }

    // Check 2FA if enabled
    if (require2FACheck) {
      const twoFACheck = await require2FA(request);
      if (!twoFACheck.authorized) {
        return {
          authorized: false,
          error: twoFACheck.error,
          requiresOTP: twoFACheck.requiresOTP,
          statusCode: 403,
        };
      }
    }

    return {
      authorized: true,
      user: auth.user,
      statusCode: 200,
    };
  };
};

// ============================================
// ERROR RESPONSE HELPERS
// ============================================

export const unauthorized = (message: string = 'Unauthorized') => {
  return NextResponse.json({ error: message }, { status: 401 });
};

export const forbidden = (message: string = 'Forbidden') => {
  return NextResponse.json({ error: message }, { status: 403 });
};

export const badRequest = (message: string = 'Bad request') => {
  return NextResponse.json({ error: message }, { status: 400 });
};
