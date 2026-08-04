import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  generateAccessToken,
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
  generateRandomToken,
  checkRateLimit,
} from '@/lib/auth-security';
import { authMiddleware, unauthorized, badRequest } from '@/lib/auth-middleware';

// ============================================
// POST /api/auth/password/change - Change password
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return badRequest('All fields are required');
    }

    if (newPassword !== confirmPassword) {
      return badRequest('Passwords do not match');
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [
      auth.user.userId,
    ]);

    if (userResult.rows.length === 0) {
      return unauthorized('User not found');
    }

    const user = userResult.rows[0];

    // Verify current password
    const passwordValid = await verifyPassword(currentPassword, user.password_hash);

    if (!passwordValid) {
      return unauthorized('Current password is incorrect');
    }

    // Validate new password policy
    const passwordValidation = validatePasswordPolicy(newPassword);

    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet policy requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Store old password in history
    await query(
      `INSERT INTO password_history (user_id, password_hash, changed_at)
       VALUES ($1, $2, NOW())`,
      [auth.user.userId, user.password_hash]
    );

    // Update password
    await query(
      `UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2`,
      [hashedPassword, auth.user.userId]
    );

    // Invalidate all sessions except current
    await query(
      `DELETE FROM sessions WHERE user_id = $1 AND id != $2`,
      [auth.user.userId, auth.user.sessionId]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [auth.user.userId, 'change_password', 'security']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully. All other sessions have been revoked.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/password/reset-request - Request password reset
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return badRequest('Email is required');
    }

    // Rate limit reset requests
    const rateLimitKey = `password_reset_${email}`;
    if (!checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) {
      // 3 requests per hour
      return NextResponse.json(
        { error: 'Too many reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user
    const userResult = await query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      return NextResponse.json(
        {
          success: true,
          message: 'If email exists, reset link has been sent',
        },
        { status: 200 }
      );
    }

    const userId = userResult.rows[0].id;

    // Generate reset token
    const resetToken = generateRandomToken(32);
    const resetTokenHash = await hashPassword(resetToken);

    // Store reset token with expiry (30 minutes)
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = NOW() + INTERVAL '30 minutes'`,
      [userId, resetTokenHash]
    );

    // In production, send email with reset link
    // Email would contain: https://app.example.com/reset-password?token=${resetToken}

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [userId, 'request_password_reset', 'security']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'If email exists, reset link has been sent',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/password/reset - Complete password reset
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const { resetToken, newPassword, confirmPassword } = await request.json();

    if (!resetToken || !newPassword || !confirmPassword) {
      return badRequest('All fields are required');
    }

    if (newPassword !== confirmPassword) {
      return badRequest('Passwords do not match');
    }

    // Validate new password policy
    const passwordValidation = validatePasswordPolicy(newPassword);

    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet policy requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const resetTokenResult = await query(
      `SELECT user_id FROM password_reset_tokens
       WHERE expires_at > NOW()
       LIMIT 1`
    );

    if (resetTokenResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const userId = resetTokenResult.rows[0].user_id;

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Store old password in history
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length > 0) {
      await query(
        `INSERT INTO password_history (user_id, password_hash, changed_at)
         VALUES ($1, $2, NOW())`,
        [userId, userResult.rows[0].password_hash]
      );
    }

    // Update password
    await query(
      `UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Delete reset token
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

    // Invalidate all sessions
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [userId, 'reset_password', 'security']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully. Please log in again.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/auth/password/policy - Get password policy
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get user's password change status
    const userResult = await query(
      `SELECT
        password_changed_at,
        EXTRACT(DAY FROM (NOW() - password_changed_at)) as days_since_change
       FROM users WHERE id = $1`,
      [auth.user.userId]
    );

    if (userResult.rows.length === 0) {
      return unauthorized('User not found');
    }

    const user = userResult.rows[0];
    const passwordExpired =
      user.days_since_change > 90; // 90 day policy

    return NextResponse.json(
      {
        success: true,
        policy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90,
        },
        userStatus: {
          daysSinceChange: user.days_since_change || 0,
          passwordExpired,
          daysUntilExpiry: Math.max(0, 90 - (user.days_since_change || 0)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get password policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
