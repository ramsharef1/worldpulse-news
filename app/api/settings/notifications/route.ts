import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, badRequest, forbidden } from '@/lib/auth-middleware';
import settingsManager from '@/lib/settings-manager';

// ============================================
// GET /api/settings/notifications
// Get user notification preferences
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const preferences = await settingsManager.getNotificationPreferences(
      auth.user.userId
    );

    return NextResponse.json(
      {
        preferences: preferences || {
          emailOnArticlePublished: true,
          emailOnComment: true,
          emailOnReply: true,
          emailDigestFrequency: 'daily',
          inAppNotificationsEnabled: true,
          notifySystemUpdates: true,
          notifySecurityAlerts: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notification preferences' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/notifications
// Update user notification preferences
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const body = await request.json();

    if (!body) {
      return badRequest('Preferences object is required');
    }

    const preferences = await settingsManager.setNotificationPreferences(
      auth.user.userId,
      body
    );

    return NextResponse.json(
      {
        message: 'Notification preferences updated successfully',
        preferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification preferences POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/settings/notifications
// Partially update notification preferences
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const body = await request.json();

    const preferences = await settingsManager.setNotificationPreferences(
      auth.user.userId,
      body
    );

    return NextResponse.json(
      {
        message: 'Notification preferences updated successfully',
        preferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification preferences PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/notifications
// Reset notification preferences to defaults
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);

    if (!auth.authenticated) {
      return forbidden('Unauthorized');
    }

    const defaultPreferences = {
      emailOnArticlePublished: true,
      emailOnComment: true,
      emailOnReply: true,
      emailDigestFrequency: 'daily',
      inAppNotificationsEnabled: true,
      notifySystemUpdates: true,
      notifySecurityAlerts: true,
    };

    const preferences = await settingsManager.setNotificationPreferences(
      auth.user.userId,
      defaultPreferences
    );

    return NextResponse.json(
      {
        message: 'Notification preferences reset to defaults',
        preferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification preferences DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to reset notification preferences' },
      { status: 500 }
    );
  }
}
