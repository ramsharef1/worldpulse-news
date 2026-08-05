import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import settingsManager from '@/lib/settings-manager';
import { SchemaValidator, CommonSchemas } from '@/lib/data-validation';

// ============================================
// GET /api/settings/custom-fields
// List custom fields
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const universityId = request.nextUrl.searchParams.get('universityId');
    const entityType = request.nextUrl.searchParams.get('entityType');

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const fields = await settingsManager.getCustomFields(universityId, entityType || undefined);

    return NextResponse.json({ fields }, { status: 200 });
  } catch (error) {
    console.error('Custom fields GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve custom fields' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/custom-fields
// Create a custom field
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, field } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!field) {
      return badRequest('field configuration is required');
    }

    // Validate field
    const validator = new SchemaValidator();
    const validation = validator.validate(field, CommonSchemas.customField);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const createdField = await settingsManager.createCustomField(
      universityId,
      field,
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'custom_field_created',
      'custom_field',
      createdField.id,
      field.fieldName,
      field,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Custom field created successfully',
        field: createdField,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Custom fields POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create custom field' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/settings/custom-fields?id=...
// Update a custom field
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const fieldId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!fieldId) {
      return badRequest('Field ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const body = await request.json();

    const updatedField = await settingsManager.updateCustomField(fieldId, body);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'custom_field_updated',
      'custom_field',
      fieldId,
      body.fieldName || null,
      body,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Custom field updated successfully',
        field: updatedField,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Custom fields PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update custom field' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/custom-fields?id=...
// Delete a custom field
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const fieldId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!fieldId) {
      return badRequest('Field ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    await settingsManager.deleteCustomField(fieldId);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'custom_field_deleted',
      'custom_field',
      fieldId,
      null,
      {},
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      { message: 'Custom field deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Custom fields DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom field' },
      { status: 500 }
    );
  }
}
