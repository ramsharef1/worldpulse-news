import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRole,
  ROLE_PERMISSIONS,
  PERMISSION_HIERARCHY,
} from '@/lib/auth-middleware';
import { unauthorized, forbidden, badRequest } from '@/lib/auth-middleware';

// ============================================
// GET /api/auth/permissions - Get current user permissions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const requireAdmin = await requireRole(['super_admin', 'admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Get user's permissions
    const permissionsResult = await query(
      `SELECT DISTINCT
        resource,
        action,
        CONCAT(resource, ':', action) as permission
       FROM permissions
       WHERE role_id = (SELECT role_id FROM users WHERE id = $1)
       ORDER BY resource, action`,
      [auth.user.userId]
    );

    const permissions = permissionsResult.rows.map((p) => p.permission);

    // Get user role info
    const roleResult = await query(
      `SELECT r.id, r.name, r.description FROM roles r
       WHERE r.id = (SELECT role_id FROM users WHERE id = $1)`,
      [auth.user.userId]
    );

    const role = roleResult.rows[0];

    return NextResponse.json(
      {
        success: true,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
        permissions,
        hierarchy: PERMISSION_HIERARCHY[role.name] || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST /api/auth/permissions - Grant permission to role
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { roleId, resource, action } = await request.json();

    if (!roleId || !resource || !action) {
      return badRequest('Role ID, resource, and action are required');
    }

    const requireAdmin = await requireRole(['super_admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Check if role exists
    const roleCheck = await query('SELECT id FROM roles WHERE id = $1', [roleId]);

    if (roleCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Grant permission
    const permissionResult = await query(
      `INSERT INTO permissions (role_id, resource, action)
       VALUES ($1, $2, $3)
       ON CONFLICT (role_id, resource, action) DO NOTHING
       RETURNING id`,
      [roleId, resource, action]
    );

    if (permissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Permission already exists for this role' },
        { status: 409 }
      );
    }

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, changes)
       VALUES ($1, $2, $3, $4)`,
      [
        auth.user.userId,
        'grant_permission',
        'permission',
        JSON.stringify({ resource, action }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: `Permission ${resource}:${action} granted`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Grant permission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/auth/permissions - Revoke permission from role
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { roleId, resource, action } = await request.json();

    if (!roleId || !resource || !action) {
      return badRequest('Role ID, resource, and action are required');
    }

    const requireAdmin = await requireRole(['super_admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Revoke permission
    const result = await query(
      `DELETE FROM permissions
       WHERE role_id = $1 AND resource = $2 AND action = $3`,
      [roleId, resource, action]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, changes)
       VALUES ($1, $2, $3, $4)`,
      [
        auth.user.userId,
        'revoke_permission',
        'permission',
        JSON.stringify({ resource, action }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: `Permission ${resource}:${action} revoked`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke permission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// GET /api/auth/permissions/roles - List all roles
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const requireAdmin = await requireRole(['super_admin', 'admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Get all roles
    const rolesResult = await query(
      `SELECT
        r.id,
        r.name,
        r.description,
        COUNT(p.id) as permission_count
       FROM roles r
       LEFT JOIN permissions p ON r.id = p.role_id
       GROUP BY r.id, r.name, r.description
       ORDER BY r.name`
    );

    const roles = rolesResult.rows.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissionCount: role.permission_count,
      hierarchy: PERMISSION_HIERARCHY[role.name] || 0,
      permissions: ROLE_PERMISSIONS[role.name] || [],
    }));

    return NextResponse.json(
      {
        success: true,
        roles,
        total: roles.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/auth/permissions/user - Update user role
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const { userId, roleId } = await request.json();

    if (!userId || !roleId) {
      return badRequest('User ID and role ID are required');
    }

    const requireAdmin = await requireRole(['super_admin']);
    const auth = await requireAdmin(request);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    // Check if role exists
    const roleCheck = await query('SELECT name FROM roles WHERE id = $1', [roleId]);

    if (roleCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Get old role for audit
    const oldRoleResult = await query(
      'SELECT role_id FROM users WHERE id = $1',
      [userId]
    );

    if (oldRoleResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRoleId = oldRoleResult.rows[0].role_id;

    // Update user role
    await query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, userId]);

    // Log audit event
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        auth.user.userId,
        'update_user_role',
        'user',
        userId,
        JSON.stringify({ oldRoleId, newRoleId: roleId }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: `User role updated to ${roleCheck.rows[0].name}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
