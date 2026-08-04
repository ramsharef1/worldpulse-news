import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  generateTOTPSecret,
  verifyTOTP,
  generateAccessToken,
  checkRateLimit,
} from '@/lib/auth-security';
import { authMiddleware, unauthorized, forbidden, badRequest } from '@/lib/auth-middleware';

// ============================================
// POST /api/auth/2fa/setup - Initialize 2FA
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Check if 2FA is already enabled
    const userResult = await query('SELECT two_fa_enabled FROM users WHERE id = $1', [
      auth.user.userId,
    ]);

    if (userResult.rows.length === 0) {
      return unauthorized('User not found');
    }

    if (userResult.rows[0].two_fa_enabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' },
        { status: 400 }
      );
    }

    // Generate TOTP secret
    const { secret, qrCode } = generateTOTPSecret();

    // Store temporary secret (not yet confirmed)
    await query(
      `INSERT INTO auth_temp_secrets (user_id, secret, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET secret = $2, created_at = NOW()`,
      [auth.user.userId, secret]
    );

    return NextResponse.json(
      {
        success: true,
        secret,
        qrCode,
        message: 'Scan QR code with authenticator app and verify with code',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/2fa/verify - Verify OTP Code
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const { otp, action = 'setup' } = await request.json();

    if (!otp) {
      return badRequest('OTP code is required');
    }

    // Rate limit OTP attempts
    const rateLimitKey = `otp_${Date.now().toString().slice(-6)}`;
    if (!checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many OTP attempts. Try again later.' },
        { status: 429 }
      );
    }

    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    // Get temporary secret
    const secretResult = await query(
      'SELECT secret FROM auth_temp_secrets WHERE user_id = $1',
      [auth.user.userId]
    );

    if (secretResult.rows.length === 0) {
      return NextResponse.json(
        { error: '2FA setup not initiated. Please start over.' },
        { status: 400 }
      );
    }

    const tempSecret = secretResult.rows[0].secret;

    // Verify OTP
    if (!verifyTOTP(tempSecret, otp)) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    if (action === 'setup') {
      // Enable 2FA for user
      await query(
        `UPDATE users SET two_fa_enabled = true, two_fa_secret = $1 WHERE id = $2`,
        [tempSecret, auth.user.userId]
      );

      // Clean up temporary secret
      await query('DELETE FROM auth_temp_secrets WHERE user_id = $1', [
        auth.user.userId,
      ]);

      // Log audit event
      await query(
        `INSERT INTO audit_log (user_id, action, entity_type)
         VALUES ($1, $2, $3)`,
        [auth.user.userId, 'enable_2fa', 'security']
      );

      return NextResponse.json(
        {
          success: true,
          message: '2FA enabled successfully',
        },
        { status: 200 }
      );
    } else if (action === 'verify') {
      // Just verify - used during login
      const userResult = await query(
        'SELECT two_fa_secret FROM users WHERE id = $1',
        [auth.user.userId]
      );

      if (userResult.rows.length === 0) {
        return unauthorized('User not found');
      }

      const userSecret = userResult.rows[0].two_fa_secret;

      if (!verifyTOTP(userSecret, otp)) {
        return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
      }

      // Log audit event
      await query(
        `INSERT INTO audit_log (user_id, action, entity_type)
         VALUES ($1, $2, $3)`,
        [auth.user.userId, '2fa_verify', 'security']
      );

      return NextResponse.json(
        {
          success: true,
          message: '2FA verified successfully',
        },
        { status: 200 }
      );
    }

    return badRequest('Invalid action');
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/2fa/disable - Disable 2FA
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return badRequest('Password is required to disable 2FA');
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

    if (!user.two_fa_enabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Verify password
    const { verifyPassword } = await import('@/lib/auth-security');
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return unauthorized('Invalid password');
    }

    // Disable 2FA
    await query(
      'UPDATE users SET two_fa_enabled = false, two_fa_secret = NULL WHERE id = $1',
      [auth.user.userId]
    );

    // Clean up temporary secret
    await query('DELETE FROM auth_temp_secrets WHERE user_id = $1', [
      auth.user.userId,
    ]);

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [auth.user.userId, 'disable_2fa', 'security']
    );

    return NextResponse.json(
      {
        success: true,
        message: '2FA disabled successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/auth/2fa/status - Check 2FA Status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return unauthorized();
    }

    const userResult = await query(
      'SELECT two_fa_enabled FROM users WHERE id = $1',
      [auth.user.userId]
    );

    if (userResult.rows.length === 0) {
      return unauthorized('User not found');
    }

    return NextResponse.json(
      {
        success: true,
        twoFAEnabled: userResult.rows[0].two_fa_enabled,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
