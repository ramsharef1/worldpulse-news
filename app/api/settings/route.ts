import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import { query } from '@/lib/db';
import settingsManager from '@/lib/settings-manager';
import { SchemaValidator, CommonSchemas } from '@/lib/data-validation';

// ============================================
// GET /api/settings
// Retrieve admin settings
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    if (!universityId) {
      return badRequest('universityId is required');
    }

    const settings = await settingsManager.getSettings(universityId);

    if (!settings) {
      return NextResponse.json(
        {
          message: 'No settings found for this university',
          settings: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings
// Create or update admin settings
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, settings } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!settings) {
      return badRequest('settings object is required');
    }

    // Validate settings
    const validator = new SchemaValidator();
    const validation = validator.validate(settings, CommonSchemas.adminSettings);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Update settings
    const updatedSettings = await settingsManager.updateSettings(
      universityId,
      auth.user.userId,
      settings,
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'settings_updated',
      'admin_settings',
      null,
      'Admin Settings',
      settings,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Settings updated successfully',
        settings: updatedSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/settings
// Update specific settings fields
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, settings } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    // Partial update
    const updatedSettings = await settingsManager.updateSettings(
      universityId,
      auth.user.userId,
      settings,
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'settings_updated',
      'admin_settings',
      null,
      'Admin Settings',
      { updated_fields: Object.keys(settings) },
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Settings updated successfully',
        settings: updatedSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
