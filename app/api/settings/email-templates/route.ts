import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, badRequest, forbidden } from '@/lib/auth-middleware';
import settingsManager from '@/lib/settings-manager';
import { SchemaValidator, CommonSchemas } from '@/lib/data-validation';

// ============================================
// GET /api/settings/email-templates
// List email templates
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

    const templates = await settingsManager.getEmailTemplates(universityId);

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Email templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve email templates' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/settings/email-templates
// Create an email template
// ============================================

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const body = await request.json();
    const { universityId, template } = body;

    if (!universityId) {
      return badRequest('universityId is required');
    }

    if (!template) {
      return badRequest('template configuration is required');
    }

    // Validate template
    const validator = new SchemaValidator();
    const validation = validator.validate(template, CommonSchemas.emailTemplate);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const createdTemplate = await settingsManager.createEmailTemplate(
      universityId,
      template,
      auth.user.userId
    );

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'email_template_created',
      'email_template',
      createdTemplate.id,
      template.templateName,
      template,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Email template created successfully',
        template: createdTemplate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Email templates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/settings/email-templates?id=...
// Update an email template
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const templateId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!templateId) {
      return badRequest('Template ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const body = await request.json();

    // Update in database
    const { query } = await import('@/lib/db');

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (body.subjectEn) {
      updates.push(`subject_en = $${paramCount++}`);
      values.push(body.subjectEn);
    }

    if (body.subjectAr) {
      updates.push(`subject_ar = $${paramCount++}`);
      values.push(body.subjectAr);
    }

    if (body.bodyHtmlEn) {
      updates.push(`body_html_en = $${paramCount++}`);
      values.push(body.bodyHtmlEn);
    }

    if (body.bodyHtmlAr) {
      updates.push(`body_html_ar = $${paramCount++}`);
      values.push(body.bodyHtmlAr);
    }

    if (body.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(body.isActive);
    }

    updates.push(`updated_at = NOW()`);

    values.push(templateId);

    const result = await query(
      `UPDATE email_templates
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'email_template_updated',
      'email_template',
      templateId,
      body.templateName || null,
      body,
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      {
        message: 'Email template updated successfully',
        template: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email templates PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/settings/email-templates?id=...
// Delete an email template
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false)({} as NextRequest);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const templateId = request.nextUrl.searchParams.get('id');
    const universityId = request.nextUrl.searchParams.get('universityId');

    if (!templateId) {
      return badRequest('Template ID is required');
    }

    if (!universityId) {
      return badRequest('universityId is required');
    }

    const { query } = await import('@/lib/db');

    await query('DELETE FROM email_templates WHERE id = $1', [templateId]);

    // Log to audit
    await settingsManager.logConfigurationChange(
      universityId,
      'email_template_deleted',
      'email_template',
      templateId,
      null,
      {},
      auth.user.userId,
      request.headers.get('x-forwarded-for')?.split(',')[0]
    );

    return NextResponse.json(
      { message: 'Email template deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email templates DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
