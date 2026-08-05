import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import settingsManager from '@/lib/settings-manager';
import { SchemaValidator, CommonSchemas } from '@/lib/data-validation';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// GET /api/settings/custom-permissions
// List custom permission rules
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';

    if (!universityId) {
      return badRequest('universityId is required');
    }

    let query_str = `SELECT * FROM custom_permission_rules
                     WHERE university_id = $1`;

    if (activeOnly) {
      query_str += ' AND is_active = true';
    }

    query_str += ' ORDER BY priority DESC, created_at DESC';

    const result = await query(query_str, [universityId]);

    return NextResponse.json({ rules: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Custom permissions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve custom permissions' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/custom-permissions
// Create a custom permission rule
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, rule } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!rule) {
      return badRequest('rule configuration is required');
    }

    // Validate rule
    const validator = new SchemaValidator();
    const validation = validator.validate(rule, CommonSchemas.customPermissionRule);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const ruleId = uuidv4();

    const result = await query(
      `INSERT INTO custom_permission_rules (
        id, university_id, rule_name, rule_description,
        resource, action, conditions, applies_to_roles,
        applies_to_users, allow, priority, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        ruleId,
        universityId,
        rule.ruleName,
        rule.ruleDescription || null,
        rule.resource,
        rule.action,
        JSON.stringify(rule.conditions || {}),
        rule.appliestoRoles || [],
        rule.appliesToUsers || [],
        rule.allow !== false,
        rule.priority || 0,
        rule.isActive !== false,
        auth.user.userId,
      ]
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'permission_rule_created',
      'permission_rule',
      ruleId,
      rule.ruleName,
      rule,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Permission rule created successfully',
        rule: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Custom permissions POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create permission rule' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/settings/custom-permissions?id=...
// Update a custom permission rule
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const ruleId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!ruleId) {
      return badRequest('Rule ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (body.ruleName !== undefined) {
      updates.push(`rule_name = $${paramCount++}`);
      values.push(body.ruleName);
    }

    if (body.ruleDescription !== undefined) {
      updates.push(`rule_description = $${paramCount++}`);
      values.push(body.ruleDescription);
    }

    if (body.resource !== undefined) {
      updates.push(`resource = $${paramCount++}`);
      values.push(body.resource);
    }

    if (body.action !== undefined) {
      updates.push(`action = $${paramCount++}`);
      values.push(body.action);
    }

    if (body.allow !== undefined) {
      updates.push(`allow = $${paramCount++}`);
      values.push(body.allow);
    }

    if (body.priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(body.priority);
    }

    if (body.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(body.isActive);
    }

    updates.push(`updated_at = NOW()`);

    values.push(ruleId);

    const result = await query(
      `UPDATE custom_permission_rules
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'permission_rule_updated',
      'permission_rule',
      ruleId,
      body.ruleName || null,
      body,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Permission rule updated successfully',
        rule: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Custom permissions PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update permission rule' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/custom-permissions?id=...
// Delete a custom permission rule
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const ruleId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!ruleId) {
      return badRequest('Rule ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    await query('DELETE FROM custom_permission_rules WHERE id = $1', [ruleId]);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'permission_rule_deleted',
      'permission_rule',
      ruleId,
      null,
      {},
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      { message: 'Permission rule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Custom permissions DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission rule' },
      { status: 500 }
    );
  }
}
