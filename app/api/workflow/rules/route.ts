import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, requirePermission, forbidden, unauthorized, badRequest } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

// ============================================
// GET /api/workflow/rules
// List approval routing rules
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');
    const sortBy = searchParams.get('sort_by') || 'priority';

    let sql = `
      SELECT ar.*, u.name as created_by_name, ast.display_name as target_stage_name,
             u2.name as target_assignee_name
      FROM approval_rules ar
      LEFT JOIN users u ON ar.created_by_id = u.id
      LEFT JOIN approval_stages ast ON ar.target_stage_id = ast.id
      LEFT JOIN users u2 ON ar.target_assignee_id = u2.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (isActive !== null) {
      const active = isActive === 'true';
      sql += ` AND ar.is_active = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    if (sortBy === 'priority') {
      sql += ` ORDER BY ar.priority DESC, ar.created_at DESC`;
    } else if (sortBy === 'recent') {
      sql += ` ORDER BY ar.created_at DESC`;
    } else {
      sql += ` ORDER BY ar.priority DESC`;
    }

    sql += ` LIMIT 100`;

    const result = await query(sql, params);

    // Parse conditions from JSONB
    const rules = result.rows.map((r) => ({
      ...r,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions) : r.conditions,
    }));

    return NextResponse.json({
      success: true,
      rules,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/rules
// Create new approval routing rule
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:manage_rules')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to manage approval rules');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.conditions) {
      return badRequest('Missing required fields: name, conditions');
    }

    // Validate conditions is an object
    if (typeof body.conditions !== 'object' || Array.isArray(body.conditions)) {
      return badRequest('Conditions must be a JSON object');
    }

    const result = await query(
      `INSERT INTO approval_rules (
        name, description, is_active, conditions, target_stage_id,
        target_assignee_id, approval_type, priority, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        body.name,
        body.description || null,
        body.is_active !== false,
        JSON.stringify(body.conditions),
        body.target_stage_id || null,
        body.target_assignee_id || null,
        body.approval_type || 'mandatory',
        body.priority || 0,
        auth.user.userId,
      ]
    );

    const rule = result.rows[0];

    return NextResponse.json({
      success: true,
      rule: {
        ...rule,
        conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
      },
      message: 'Rule created successfully',
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/workflow/rules/[id]
// Update approval routing rule
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:manage_rules')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to manage approval rules');
    }

    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return badRequest('Missing required parameter: id');
    }

    const body = await request.json();

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(body.name);
      paramIndex++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(body.description);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(body.is_active);
      paramIndex++;
    }

    if (body.conditions !== undefined) {
      updates.push(`conditions = $${paramIndex}`);
      params.push(JSON.stringify(body.conditions));
      paramIndex++;
    }

    if (body.target_stage_id !== undefined) {
      updates.push(`target_stage_id = $${paramIndex}`);
      params.push(body.target_stage_id);
      paramIndex++;
    }

    if (body.target_assignee_id !== undefined) {
      updates.push(`target_assignee_id = $${paramIndex}`);
      params.push(body.target_assignee_id);
      paramIndex++;
    }

    if (body.approval_type !== undefined) {
      updates.push(`approval_type = $${paramIndex}`);
      params.push(body.approval_type);
      paramIndex++;
    }

    if (body.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(body.priority);
      paramIndex++;
    }

    if (updates.length === 0) {
      return badRequest('No fields to update');
    }

    updates.push(`updated_at = NOW()`);

    const sql = `UPDATE approval_rules SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    params.push(ruleId);

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    const rule = result.rows[0];

    return NextResponse.json({
      success: true,
      rule: {
        ...rule,
        conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions,
      },
      message: 'Rule updated successfully',
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rule' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/workflow/rules/[id]
// Delete approval routing rule
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const permission = await requirePermission('articles:manage_rules')(request);
    if (!permission.authorized) {
      return forbidden('You do not have permission to manage approval rules');
    }

    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return badRequest('Missing required parameter: id');
    }

    // Check if rule exists
    const checkResult = await query(
      'SELECT id FROM approval_rules WHERE id = $1',
      [ruleId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Delete rule
    await query('DELETE FROM approval_rules WHERE id = $1', [ruleId]);

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/workflow/rules/test
// Test a rule against article data (dry run)
// ============================================

export async function POST_TEST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (!auth.authenticated) {
      return unauthorized();
    }

    const body = await request.json();

    if (!body.rule_id || !body.article_data) {
      return badRequest('Missing required fields: rule_id, article_data');
    }

    // Get rule
    const ruleResult = await query(
      'SELECT * FROM approval_rules WHERE id = $1',
      [body.rule_id]
    );

    if (ruleResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    const rule = ruleResult.rows[0];
    const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;

    // Test conditions against article data
    let allConditionsMet = true;

    for (const [key, value] of Object.entries(conditions)) {
      const articleValue = body.article_data[key];

      if (key === 'views_threshold') {
        if (articleValue < value) allConditionsMet = false;
      } else if (key === 'requires_ceo') {
        // Custom condition logic
      }
      // Add more condition types as needed
    }

    return NextResponse.json({
      success: true,
      ruleName: rule.name,
      conditionsMet: allConditionsMet,
      conditions,
      articleData: body.article_data,
      message: allConditionsMet ? 'Rule matches article data' : 'Rule does not match article data',
    });
  } catch (error) {
    console.error('Error testing rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test rule' },
      { status: 500 }
    );
  }
}
