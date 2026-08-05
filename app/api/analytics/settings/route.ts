import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminAuth, forbidden, badRequest } from '@/lib/auth-middleware';

/**
 * GET /api/analytics/settings
 * Get analytics configuration settings
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Get all analytics settings
    const result = await query(
      `
      SELECT
        id,
        setting_key,
        setting_value,
        description,
        data_type,
        category,
        updated_at
      FROM analytics_settings
      ORDER BY category, setting_key
    `
    );

    // Group settings by category
    const settingsByCategory: Record<string, any[]> = {};

    result.rows.forEach((row: any) => {
      const category = row.category || 'general';
      if (!settingsByCategory[category]) {
        settingsByCategory[category] = [];
      }

      // Parse value based on data type
      let value = row.setting_value;
      if (row.data_type === 'boolean') {
        value = row.setting_value === 'true';
      } else if (row.data_type === 'number') {
        value = parseInt(row.setting_value);
      } else if (row.data_type === 'json') {
        value = JSON.parse(row.setting_value || '{}');
      }

      settingsByCategory[category].push({
        key: row.setting_key,
        value,
        description: row.description,
        type: row.data_type,
      });
    });

    return NextResponse.json(
      {
        success: true,
        settings: settingsByCategory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/settings
 * Update analytics settings
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized || auth.user.role !== 'super_admin') {
      return forbidden('Only super admins can modify settings');
    }

    const { settingKey, settingValue } = await request.json();

    if (!settingKey) {
      return badRequest('Setting key is required');
    }

    // Validate that setting exists
    const existingResult = await query(
      `SELECT data_type FROM analytics_settings WHERE setting_key = $1`,
      [settingKey]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    // Update setting
    await query(
      `
      UPDATE analytics_settings
      SET setting_value = $1, updated_at = NOW()
      WHERE setting_key = $2
    `,
      [String(settingValue), settingKey]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Setting updated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/settings/retention-policies
 * Get data retention policies
 */
export async function GET_retention(request: NextRequest) {
  try {
    const result = await query(
      `
      SELECT
        id,
        data_type,
        retention_days,
        archive_after_days,
        auto_delete,
        description,
        created_at
      FROM data_retention_policies
      ORDER BY data_type
    `
    );

    return NextResponse.json(
      {
        success: true,
        policies: result.rows.map((row: any) => ({
          id: row.id,
          dataType: row.data_type,
          retentionDays: row.retention_days,
          archiveAfter: row.archive_after_days,
          autoDelete: row.auto_delete,
          description: row.description,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Retention policies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch retention policies' },
      { status: 500 }
    );
  }
}
