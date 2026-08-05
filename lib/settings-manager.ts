import { query } from './db';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// SETTINGS MANAGER
// ============================================

export interface AdminSettingsInput {
  organizationName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  themeMode?: 'light' | 'dark' | 'auto';
  customCSS?: string;
  defaultLanguage?: 'en' | 'ar';
  supportedLanguages?: string[];
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  emailNotificationsEnabled?: boolean;
  inAppNotificationsEnabled?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'never';
  ipWhitelist?: string[];
  enforce2FA?: boolean;
  sessionTimeoutMinutes?: number;
  passwordPolicyEnabled?: boolean;
  dataRetentionDays?: number;
  autoBackupEnabled?: boolean;
  backupFrequency?: 'hourly' | 'daily' | 'weekly';
}

export class SettingsManager {
  /**
   * Get admin settings
   */
  async getSettings(universityId: string, userId?: string): Promise<any> {
    try {
      let query_str =
        'SELECT * FROM admin_settings WHERE university_id = $1';
      const params = [universityId];

      if (userId) {
        query_str += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await query(query_str, params);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatSettings(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get settings: ${(error as Error).message}`);
    }
  }

  /**
   * Create or update admin settings
   */
  async updateSettings(
    universityId: string,
    userId: string,
    settings: AdminSettingsInput,
    updatedBy: string
  ): Promise<any> {
    try {
      const existing = await this.getSettings(universityId, userId);

      if (existing) {
        // Update existing settings
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (settings.organizationName !== undefined) {
          updates.push(`organization_name = $${paramCount++}`);
          values.push(settings.organizationName);
        }

        if (settings.logoUrl !== undefined) {
          updates.push(`logo_url = $${paramCount++}`);
          values.push(settings.logoUrl);
        }

        if (settings.primaryColor !== undefined) {
          updates.push(`primary_color = $${paramCount++}`);
          values.push(settings.primaryColor);
        }

        if (settings.themeMode !== undefined) {
          updates.push(`theme_mode = $${paramCount++}`);
          values.push(settings.themeMode);
        }

        if (settings.defaultLanguage !== undefined) {
          updates.push(`default_language = $${paramCount++}`);
          values.push(settings.defaultLanguage);
        }

        if (settings.timezone !== undefined) {
          updates.push(`timezone = $${paramCount++}`);
          values.push(settings.timezone);
        }

        if (settings.enforce2FA !== undefined) {
          updates.push(`enforce_2fa = $${paramCount++}`);
          values.push(settings.enforce2FA);
        }

        if (settings.sessionTimeoutMinutes !== undefined) {
          updates.push(`session_timeout_minutes = $${paramCount++}`);
          values.push(settings.sessionTimeoutMinutes);
        }

        if (settings.dataRetentionDays !== undefined) {
          updates.push(`data_retention_days = $${paramCount++}`);
          values.push(settings.dataRetentionDays);
        }

        updates.push(`updated_at = NOW()`);
        updates.push(`updated_by = $${paramCount++}`);
        values.push(updatedBy);

        values.push(universityId);
        values.push(userId);

        const result = await query(
          `UPDATE admin_settings
           SET ${updates.join(', ')}
           WHERE university_id = $${paramCount} AND user_id = $${paramCount + 1}
           RETURNING *`,
          values
        );

        return this.formatSettings(result.rows[0]);
      } else {
        // Create new settings
        const result = await query(
          `INSERT INTO admin_settings (
            university_id, user_id,
            organization_name, logo_url, favicon_url,
            primary_color, secondary_color, accent_color, background_color,
            theme_mode, custom_css,
            default_language, supported_languages, timezone, date_format, time_format,
            email_notifications_enabled, in_app_notifications_enabled, digest_frequency,
            ip_whitelist, enforce_2fa, session_timeout_minutes, password_policy_enabled,
            data_retention_days, auto_backup_enabled, backup_frequency,
            created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26, $27, $28
          )
          RETURNING *`,
          [
            universityId,
            userId,
            settings.organizationName || null,
            settings.logoUrl || null,
            settings.faviconUrl || null,
            settings.primaryColor || '#0066CC',
            settings.secondaryColor || '#E8E8E8',
            settings.accentColor || '#FF6B35',
            settings.backgroundColor || '#FFFFFF',
            settings.themeMode || 'light',
            settings.customCSS || null,
            settings.defaultLanguage || 'en',
            settings.supportedLanguages || ['en', 'ar'],
            settings.timezone || 'UTC',
            settings.dateFormat || 'YYYY-MM-DD',
            settings.timeFormat || 'HH:MM:SS',
            settings.emailNotificationsEnabled !== false,
            settings.inAppNotificationsEnabled !== false,
            settings.digestFrequency || 'daily',
            settings.ipWhitelist || [],
            settings.enforce2FA || false,
            settings.sessionTimeoutMinutes || 60,
            settings.passwordPolicyEnabled !== false,
            settings.dataRetentionDays || 2555,
            settings.autoBackupEnabled !== false,
            settings.backupFrequency || 'daily',
            updatedBy,
            updatedBy,
          ]
        );

        return this.formatSettings(result.rows[0]);
      }
    } catch (error) {
      throw new Error(`Failed to update settings: ${(error as Error).message}`);
    }
  }

  /**
   * Create custom field
   */
  async createCustomField(
    universityId: string,
    fieldData: any,
    createdBy: string
  ): Promise<any> {
    try {
      const fieldId = uuidv4();
      const result = await query(
        `INSERT INTO custom_fields (
          id, university_id, entity_type, field_name,
          field_label_en, field_label_ar, field_type,
          field_placeholder_en, field_placeholder_ar,
          is_required, validation_pattern, min_length, max_length,
          min_value, max_value, options, default_value,
          field_order, is_visible, is_searchable, show_in_list_view,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING *`,
        [
          fieldId,
          universityId,
          fieldData.entityType,
          fieldData.fieldName,
          fieldData.fieldLabelEn,
          fieldData.fieldLabelAr,
          fieldData.fieldType,
          fieldData.fieldPlaceholderEn || null,
          fieldData.fieldPlaceholderAr || null,
          fieldData.isRequired || false,
          fieldData.validationPattern || null,
          fieldData.minLength || null,
          fieldData.maxLength || null,
          fieldData.minValue || null,
          fieldData.maxValue || null,
          fieldData.options ? JSON.stringify(fieldData.options) : null,
          fieldData.defaultValue || null,
          fieldData.fieldOrder || 0,
          fieldData.isVisible !== false,
          fieldData.isSearchable || false,
          fieldData.showInListView || false,
          createdBy,
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create custom field: ${(error as Error).message}`);
    }
  }

  /**
   * Get custom fields
   */
  async getCustomFields(
    universityId: string,
    entityType?: string
  ): Promise<any[]> {
    try {
      let query_str = 'SELECT * FROM custom_fields WHERE university_id = $1';
      const params = [universityId];

      if (entityType) {
        query_str += ' AND entity_type = $2';
        params.push(entityType);
      }

      query_str += ' ORDER BY field_order, created_at';

      const result = await query(query_str, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get custom fields: ${(error as Error).message}`);
    }
  }

  /**
   * Update custom field
   */
  async updateCustomField(
    fieldId: string,
    fieldData: any
  ): Promise<any> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (fieldData.fieldLabelEn !== undefined) {
        updates.push(`field_label_en = $${paramCount++}`);
        values.push(fieldData.fieldLabelEn);
      }

      if (fieldData.fieldLabelAr !== undefined) {
        updates.push(`field_label_ar = $${paramCount++}`);
        values.push(fieldData.fieldLabelAr);
      }

      if (fieldData.isRequired !== undefined) {
        updates.push(`is_required = $${paramCount++}`);
        values.push(fieldData.isRequired);
      }

      if (fieldData.isSearchable !== undefined) {
        updates.push(`is_searchable = $${paramCount++}`);
        values.push(fieldData.isSearchable);
      }

      if (fieldData.fieldOrder !== undefined) {
        updates.push(`field_order = $${paramCount++}`);
        values.push(fieldData.fieldOrder);
      }

      updates.push(`updated_at = NOW()`);

      values.push(fieldId);

      const result = await query(
        `UPDATE custom_fields
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update custom field: ${(error as Error).message}`);
    }
  }

  /**
   * Delete custom field
   */
  async deleteCustomField(fieldId: string): Promise<void> {
    try {
      await query('DELETE FROM custom_fields WHERE id = $1', [fieldId]);
    } catch (error) {
      throw new Error(`Failed to delete custom field: ${(error as Error).message}`);
    }
  }

  /**
   * Create email template
   */
  async createEmailTemplate(
    universityId: string,
    templateData: any,
    createdBy: string
  ): Promise<any> {
    try {
      const templateId = uuidv4();
      const result = await query(
        `INSERT INTO email_templates (
          id, university_id, template_name, template_slug,
          subject_en, subject_ar, body_html_en, body_html_ar,
          body_text_en, body_text_ar, variables, reply_to_email,
          is_default, is_active, use_branding, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16
        )
        RETURNING *`,
        [
          templateId,
          universityId,
          templateData.templateName,
          templateData.templateSlug,
          templateData.subjectEn,
          templateData.subjectAr,
          templateData.bodyHtmlEn,
          templateData.bodyHtmlAr,
          templateData.bodyTextEn || null,
          templateData.bodyTextAr || null,
          templateData.variables ? JSON.stringify(templateData.variables) : null,
          templateData.replyToEmail || null,
          templateData.isDefault || false,
          templateData.isActive !== false,
          templateData.useBranding !== false,
          createdBy,
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Failed to create email template: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get email templates
   */
  async getEmailTemplates(universityId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM email_templates
         WHERE university_id = $1
         ORDER BY created_at DESC`,
        [universityId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get email templates: ${(error as Error).message}`);
    }
  }

  /**
   * Create notification preferences for user
   */
  async setNotificationPreferences(
    userId: string,
    preferences: any
  ): Promise<any> {
    try {
      const existing = await query(
        'SELECT id FROM user_notification_preferences WHERE user_id = $1',
        [userId]
      );

      if (existing.rows.length > 0) {
        // Update existing
        const result = await query(
          `UPDATE user_notification_preferences
           SET email_on_article_published = COALESCE($1, email_on_article_published),
               email_on_comment = COALESCE($2, email_on_comment),
               email_on_reply = COALESCE($3, email_on_reply),
               email_digest_frequency = COALESCE($4, email_digest_frequency),
               in_app_notifications_enabled = COALESCE($5, in_app_notifications_enabled),
               notify_system_updates = COALESCE($6, notify_system_updates),
               notify_security_alerts = COALESCE($7, notify_security_alerts),
               updated_at = NOW()
           WHERE user_id = $8
           RETURNING *`,
          [
            preferences.emailOnArticlePublished,
            preferences.emailOnComment,
            preferences.emailOnReply,
            preferences.emailDigestFrequency,
            preferences.inAppNotificationsEnabled,
            preferences.notifySystemUpdates,
            preferences.notifySecurityAlerts,
            userId,
          ]
        );

        return result.rows[0];
      } else {
        // Create new
        const result = await query(
          `INSERT INTO user_notification_preferences (
            user_id, email_on_article_published, email_on_comment,
            email_on_reply, email_digest_frequency, in_app_notifications_enabled,
            notify_system_updates, notify_security_alerts
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            userId,
            preferences.emailOnArticlePublished !== false,
            preferences.emailOnComment !== false,
            preferences.emailOnReply !== false,
            preferences.emailDigestFrequency || 'daily',
            preferences.inAppNotificationsEnabled !== false,
            preferences.notifySystemUpdates !== false,
            preferences.notifySecurityAlerts !== false,
          ]
        );

        return result.rows[0];
      }
    } catch (error) {
      throw new Error(
        `Failed to set notification preferences: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const result = await query(
        'SELECT * FROM user_notification_preferences WHERE user_id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Failed to get notification preferences: ${(error as Error).message}`
      );
    }
  }

  /**
   * Log configuration change to audit log
   */
  async logConfigurationChange(
    universityId: string,
    changeType: string,
    entityType: string,
    entityId: string | null,
    entityName: string | null,
    changes: any,
    createdBy: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO configuration_audit_log (
          university_id, change_type, entity_type, entity_id,
          entity_name, changes, ip_address, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          universityId,
          changeType,
          entityType,
          entityId,
          entityName,
          JSON.stringify(changes),
          ipAddress || null,
          createdBy,
        ]
      );
    } catch (error) {
      console.error('Failed to log configuration change:', error);
      // Don't throw - logging should not block operations
    }
  }

  /**
   * Get configuration audit log
   */
  async getConfigurationAuditLog(
    universityId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM configuration_audit_log
         WHERE university_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [universityId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      throw new Error(
        `Failed to get configuration audit log: ${(error as Error).message}`
      );
    }
  }

  /**
   * Format settings for response
   */
  private formatSettings(settings: any): any {
    return {
      id: settings.id,
      universityId: settings.university_id,
      userId: settings.user_id,
      organizationName: settings.organization_name,
      logoUrl: settings.logo_url,
      faviconUrl: settings.favicon_url,
      primaryColor: settings.primary_color,
      secondaryColor: settings.secondary_color,
      accentColor: settings.accent_color,
      backgroundColor: settings.background_color,
      themeMode: settings.theme_mode,
      customCSS: settings.custom_css,
      defaultLanguage: settings.default_language,
      supportedLanguages: settings.supported_languages,
      timezone: settings.timezone,
      dateFormat: settings.date_format,
      timeFormat: settings.time_format,
      emailNotificationsEnabled: settings.email_notifications_enabled,
      inAppNotificationsEnabled: settings.in_app_notifications_enabled,
      digestFrequency: settings.digest_frequency,
      ipWhitelist: settings.ip_whitelist,
      enforce2FA: settings.enforce_2fa,
      sessionTimeoutMinutes: settings.session_timeout_minutes,
      passwordPolicyEnabled: settings.password_policy_enabled,
      dataRetentionDays: settings.data_retention_days,
      autoBackupEnabled: settings.auto_backup_enabled,
      backupFrequency: settings.backup_frequency,
      encryptionKeyId: settings.encryption_key_id,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
      createdBy: settings.created_by,
      updatedBy: settings.updated_by,
    };
  }
}

export default new SettingsManager();
