# Data Management & Settings API Documentation

## Overview

The Data Management & Settings API provides comprehensive administration and data management capabilities for Universities Voice, including settings management, backups, data export/import, custom fields, email templates, notification preferences, and audit logging.

**API Base URL:** `/api`

---

## Table of Contents

1. [Settings Management](#settings-management)
2. [Backup Management](#backup-management)
3. [Data Export](#data-export)
4. [Data Import](#data-import)
5. [Custom Fields](#custom-fields)
6. [Email Templates](#email-templates)
7. [Notification Preferences](#notification-preferences)
8. [Custom Permissions](#custom-permissions)
9. [Configuration Audit Log](#configuration-audit-log)
10. [System Dashboard](#system-dashboard)
11. [Data Management](#data-management)
12. [Utilities](#utilities)

---

## Settings Management

### GET /api/settings
Retrieve admin settings for a university.

**Parameters:**
- `universityId` (required): University identifier

**Response:**
```json
{
  "settings": {
    "id": "uuid",
    "organizationName": "University Name",
    "logoUrl": "https://...",
    "themeMode": "light|dark|auto",
    "defaultLanguage": "en|ar",
    "timezone": "UTC",
    "enforce2FA": false,
    "emailNotificationsEnabled": true,
    "dataRetentionDays": 2555,
    "autoBackupEnabled": true,
    "backupFrequency": "daily"
  }
}
```

### POST /api/settings
Create or update admin settings.

**Request Body:**
```json
{
  "universityId": "uuid",
  "settings": {
    "organizationName": "University Name",
    "logoUrl": "https://...",
    "primaryColor": "#0066CC",
    "themeMode": "light",
    "defaultLanguage": "en",
    "timezone": "America/New_York",
    "enforce2FA": true,
    "sessionTimeoutMinutes": 60,
    "dataRetentionDays": 2555,
    "autoBackupEnabled": true,
    "backupFrequency": "daily"
  }
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "settings": { /* updated settings */ }
}
```

### PUT /api/settings
Partially update settings.

**Request Body:**
```json
{
  "universityId": "uuid",
  "settings": {
    "themeMode": "dark",
    "enforce2FA": true
  }
}
```

---

## Backup Management

### GET /api/settings/backups
List backups or retrieve backup statistics.

**Parameters:**
- `universityId` (required): University identifier
- `action` (optional): "list" or "stats" - default is "list"
- `limit` (optional): Number of backups to retrieve (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (List):**
```json
{
  "backups": [
    {
      "id": "uuid",
      "backup_name": "backup_...",
      "status": "completed|failed|in_progress",
      "size_bytes": 1024000,
      "file_count": 150,
      "created_at": "2026-08-04T10:00:00Z",
      "end_time": "2026-08-04T10:15:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0 }
}
```

**Response (Stats):**
```json
{
  "stats": {
    "totalBackups": 10,
    "completedBackups": 8,
    "failedBackups": 2,
    "totalSizeBytes": 10240000,
    "lastBackupTime": "2026-08-04T10:00:00Z",
    "nextScheduledBackup": "2026-08-05T02:00:00Z"
  }
}
```

### POST /api/settings/backups
Create a new backup.

**Request Body:**
```json
{
  "universityId": "uuid",
  "backupName": "manual_backup_20260804",
  "backupType": "full|incremental|differential",
  "includeEntities": ["articles", "users", "comments"],
  "retentionPolicy": "daily|weekly|monthly|permanent"
}
```

**Response:**
```json
{
  "message": "Backup created successfully",
  "backup": {
    "id": "uuid",
    "name": "backup_...",
    "status": "in_progress",
    "startTime": "2026-08-04T10:00:00Z"
  }
}
```

### DELETE /api/settings/backups
Delete a backup.

**Parameters:**
- `id` (required): Backup ID
- `universityId` (required): University identifier

---

### GET /api/settings/backups/schedules
List backup schedules.

**Parameters:**
- `universityId` (required): University identifier

**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid",
      "schedule_name": "Daily Backup",
      "frequency": "daily|hourly|weekly|monthly",
      "run_time": "02:00",
      "retention_days": 30,
      "is_active": true,
      "next_run_at": "2026-08-05T02:00:00Z"
    }
  ]
}
```

### POST /api/settings/backups/schedules
Create a backup schedule.

**Request Body:**
```json
{
  "universityId": "uuid",
  "schedule": {
    "scheduleName": "Daily Backup",
    "frequency": "daily|hourly|weekly|monthly",
    "runTime": "02:00",
    "dayOfWeek": 0,
    "dayOfMonth": 1,
    "retentionDays": 30,
    "maxBackupsToKeep": 10,
    "notifyOnFailure": true,
    "notificationEmails": ["admin@university.edu"]
  }
}
```

### PUT /api/settings/backups/schedules
Update a backup schedule.

**Parameters:**
- `id` (required): Schedule ID
- `universityId` (required): University identifier

### DELETE /api/settings/backups/schedules
Delete a backup schedule.

**Parameters:**
- `id` (required): Schedule ID
- `universityId` (required): University identifier

---

### POST /api/settings/backups/[id]/restore
Restore from a backup.

**Request Body:**
```json
{
  "universityId": "uuid"
}
```

**Response:**
```json
{
  "message": "Backup ... restored successfully",
  "success": true
}
```

### GET /api/settings/backups/[id]/restore
Get restore status/details.

**Response:**
```json
{
  "backup": { /* backup details */ },
  "canRestore": true
}
```

---

## Data Export

### GET /api/settings/exports
List export jobs.

**Parameters:**
- `universityId` (required): University identifier
- `limit` (optional): Default 50
- `offset` (optional): Default 0

### POST /api/settings/exports
Create a data export job.

**Request Body:**
```json
{
  "universityId": "uuid",
  "exportName": "Articles Export Q3",
  "entityType": "article|user|comment",
  "exportFormat": "csv|json|xml",
  "filters": {
    "status": "published",
    "dateFrom": "2026-07-01",
    "dateTo": "2026-09-30"
  },
  "includedFields": ["id", "title_en", "title_ar", "author_id"]
}
```

**Response:**
```json
{
  "message": "Data export created successfully",
  "export": {
    "id": "uuid",
    "status": "completed",
    "totalRecords": 150,
    "data": "...export data..."
  }
}
```

### DELETE /api/settings/exports
Delete an export job.

**Parameters:**
- `id` (required): Export ID
- `universityId` (required): University identifier

---

## Data Import

### GET /api/settings/imports
List import jobs.

**Parameters:**
- `universityId` (required): University identifier
- `limit` (optional): Default 50
- `offset` (optional): Default 0

### POST /api/settings/imports
Create a data import job.

**Request Body:**
```json
{
  "universityId": "uuid",
  "importName": "Articles Bulk Import",
  "entityType": "article|user|comment",
  "importFormat": "csv|json|xml",
  "fileContent": "...file content...",
  "skipOnError": false,
  "createNewRecords": true,
  "updateExistingRecords": true,
  "duplicateHandling": "skip|update|error"
}
```

**Response:**
```json
{
  "message": "Data import completed",
  "import": {
    "id": "uuid",
    "status": "completed|completed_with_errors",
    "totalRecords": 100,
    "successfulRecords": 98,
    "failedRecords": 2,
    "errors": [
      {
        "row": 5,
        "field": "title_en",
        "message": "Required field missing"
      }
    ]
  }
}
```

---

## Custom Fields

### GET /api/settings/custom-fields
List custom fields.

**Parameters:**
- `universityId` (required): University identifier
- `entityType` (optional): Filter by entity type (article, user, etc.)

### POST /api/settings/custom-fields
Create a custom field.

**Request Body:**
```json
{
  "universityId": "uuid",
  "field": {
    "entityType": "article",
    "fieldName": "research_area",
    "fieldLabelEn": "Research Area",
    "fieldLabelAr": "مجال البحث",
    "fieldType": "select|text|number|email|url|date|checkbox|textarea|rich_text",
    "fieldPlaceholderEn": "Select a research area",
    "isRequired": false,
    "minLength": 3,
    "maxLength": 255,
    "options": [
      { "label": "Physics", "value": "physics" },
      { "label": "Chemistry", "value": "chemistry" }
    ],
    "fieldOrder": 1,
    "isSearchable": true,
    "showInListView": true
  }
}
```

### PUT /api/settings/custom-fields
Update a custom field.

**Parameters:**
- `id` (required): Field ID
- `universityId` (required): University identifier

### DELETE /api/settings/custom-fields
Delete a custom field.

**Parameters:**
- `id` (required): Field ID
- `universityId` (required): University identifier

---

## Email Templates

### GET /api/settings/email-templates
List email templates.

**Parameters:**
- `universityId` (required): University identifier

### POST /api/settings/email-templates
Create an email template.

**Request Body:**
```json
{
  "universityId": "uuid",
  "template": {
    "templateName": "Article Published Notification",
    "templateSlug": "article_published",
    "subjectEn": "New article published: {{article_title}}",
    "subjectAr": "تم نشر مقالة جديدة: {{article_title}}",
    "bodyHtmlEn": "<p>Hello {{user_name}},</p><p>{{article_title}} has been published.</p>",
    "bodyHtmlAr": "<p>مرحبا {{user_name}},</p><p>تم نشر {{article_title}}.</p>",
    "variables": ["user_name", "article_title", "article_url"],
    "isActive": true,
    "useBranding": true
  }
}
```

### PUT /api/settings/email-templates
Update an email template.

**Parameters:**
- `id` (required): Template ID
- `universityId` (required): University identifier

### DELETE /api/settings/email-templates
Delete an email template.

**Parameters:**
- `id` (required): Template ID
- `universityId` (required): University identifier

---

## Notification Preferences

### GET /api/settings/notifications
Get user notification preferences.

**Response:**
```json
{
  "preferences": {
    "emailOnArticlePublished": true,
    "emailOnComment": true,
    "emailOnReply": true,
    "emailDigestFrequency": "daily|weekly|never",
    "inAppNotificationsEnabled": true,
    "notifySystemUpdates": true,
    "notifySecurityAlerts": true,
    "quietHoursEnabled": false,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  }
}
```

### POST /api/settings/notifications
Update user notification preferences.

**Request Body:**
```json
{
  "emailOnArticlePublished": true,
  "emailOnComment": true,
  "emailDigestFrequency": "weekly",
  "inAppNotificationsEnabled": true,
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

### PUT /api/settings/notifications
Partially update notification preferences.

### DELETE /api/settings/notifications
Reset notification preferences to defaults.

---

## Custom Permissions

### GET /api/settings/custom-permissions
List custom permission rules.

**Parameters:**
- `universityId` (required): University identifier
- `activeOnly` (optional): Only return active rules (true|false)

### POST /api/settings/custom-permissions
Create a custom permission rule.

**Request Body:**
```json
{
  "universityId": "uuid",
  "rule": {
    "ruleName": "Faculty Only Article Creation",
    "ruleDescription": "Only faculty members can create articles",
    "resource": "article",
    "action": "create",
    "conditions": {
      "role": "faculty"
    },
    "appliesToRoles": ["faculty"],
    "allow": true,
    "priority": 10,
    "isActive": true
  }
}
```

### PUT /api/settings/custom-permissions
Update a custom permission rule.

**Parameters:**
- `id` (required): Rule ID
- `universityId` (required): University identifier

### DELETE /api/settings/custom-permissions
Delete a custom permission rule.

**Parameters:**
- `id` (required): Rule ID
- `universityId` (required): University identifier

---

## Configuration Audit Log

### GET /api/settings/audit-log
Get configuration audit log entries.

**Parameters:**
- `universityId` (required): University identifier
- `changeType` (optional): Filter by change type
- `entityType` (optional): Filter by entity type
- `limit` (optional): Default 100
- `offset` (optional): Default 0

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "change_type": "settings_updated|custom_field_created|etc",
      "entity_type": "admin_settings|custom_field|etc",
      "entity_id": "uuid",
      "entity_name": "Setting Name",
      "changes": {
        "field_name": {
          "old_value": "...",
          "new_value": "..."
        }
      },
      "created_at": "2026-08-04T10:00:00Z",
      "created_by": "uuid"
    }
  ],
  "pagination": { "limit": 100, "offset": 0 }
}
```

### HEAD /api/settings/audit-log
Get audit log statistics.

**Parameters:**
- `universityId` (required): University identifier

**Response:**
```json
{
  "stats": {
    "total_entries": 500,
    "unique_change_types": 8,
    "unique_users": 12,
    "last_change": "2026-08-04T10:00:00Z",
    "last_24h_changes": 25
  }
}
```

### DELETE /api/settings/audit-log
Clear old audit log entries.

**Parameters:**
- `universityId` (required): University identifier
- `daysToKeep` (optional): Keep logs newer than N days (default: 90)

**Response:**
```json
{
  "message": "Deleted 150 audit log entries older than 90 days",
  "deletedCount": 150
}
```

---

## System Dashboard

### GET /api/settings/dashboard
Get system settings dashboard data.

**Parameters:**
- `universityId` (required): University identifier

**Response:**
```json
{
  "dashboard": {
    "settings": {
      "organizationName": "University Name",
      "themeMode": "light",
      "defaultLanguage": "en",
      "timezone": "UTC",
      "enforce2FA": false,
      "emailNotificationsEnabled": true
    },
    "stats": {
      "totalUsers": 500,
      "totalArticles": 1200,
      "customFieldsCount": {
        "total": 5,
        "byType": {
          "article": 3,
          "user": 2
        }
      },
      "emailTemplatesCount": 8,
      "backupSchedulesCount": 3
    },
    "backup": {
      "totalBackups": 10,
      "completedBackups": 8,
      "failedBackups": 2,
      "totalSizeBytes": 10240000,
      "totalSizeGB": "0.01",
      "lastBackupTime": "2026-08-04T10:00:00Z",
      "nextScheduledBackup": "2026-08-05T02:00:00Z"
    },
    "recentActivity": [
      {
        "changeType": "settings_updated",
        "entityType": "admin_settings",
        "entityName": "Admin Settings",
        "createdBy": "uuid",
        "createdAt": "2026-08-04T10:00:00Z"
      }
    ]
  }
}
```

---

## Data Management

### GET /api/data
Get data management configuration and status.

**Parameters:**
- `universityId` (required): University identifier
- `action` (optional): "retention-policies" or "encryption-keys"

### POST /api/data
Manage data retention and encryption.

**Request Body Examples:**

**Create Retention Policy:**
```json
{
  "universityId": "uuid",
  "action": "create-retention-policy",
  "policyName": "Archive Articles After 1 Year",
  "entityType": "article",
  "retentionDays": 365,
  "archiveAfterDays": 180,
  "deleteAfterDays": null,
  "appliesToStatus": ["published"],
  "actionBeforeDelete": "backup"
}
```

**Test Encryption:**
```json
{
  "universityId": "uuid",
  "action": "test-encryption",
  "encryptionKeyId": "default_key_v1"
}
```

**Cleanup Old Data:**
```json
{
  "universityId": "uuid",
  "action": "cleanup-old-data",
  "entityType": "article",
  "daysOld": 365
}
```

### DELETE /api/data
Delete or purge data.

**Request Body Examples:**

**Purge Deleted Data:**
```json
{
  "universityId": "uuid",
  "action": "purge-deleted-data",
  "entityType": "article",
  "daysOld": 30
}
```

**Delete Retention Policy:**
```json
{
  "universityId": "uuid",
  "action": "delete-retention-policy",
  "policyId": "uuid"
}
```

---

## Utilities

### Encryption Utilities

The system provides AES-256-GCM encryption for sensitive data:

```typescript
import {
  encryptData,
  decryptData,
  encryptWithPassword,
  decryptWithPassword,
  generateChecksum,
  verifyChecksum,
} from '@/lib/encryption-utils';

// Encrypt with key
const encrypted = encryptData('sensitive data', key);
const decrypted = decryptData(encrypted, key);

// Encrypt with password
const encrypted = encryptWithPassword('sensitive data', password);
const decrypted = decryptWithPassword(encrypted, password);
```

### Data Validation

```typescript
import {
  SchemaValidator,
  CommonSchemas,
} from '@/lib/data-validation';

const validator = new SchemaValidator();
const result = validator.validate(data, CommonSchemas.adminSettings);

if (!result.valid) {
  console.log(result.errors);
}
```

### Backup Manager

```typescript
import { BackupManager } from '@/lib/backup-manager';

const backupManager = new BackupManager();
const backup = await backupManager.createBackup(
  universityId,
  options,
  userId
);
```

### Export/Import

```typescript
import {
  DataExporter,
  DataImporter,
} from '@/lib/data-export-import';

const exporter = new DataExporter();
const csv = await exporter.exportArticles(universityId, filters, 'csv');

const importer = new DataImporter();
const data = await importer.parseData(content, 'csv');
const validation = await importer.validateImportData(
  data,
  'article',
  requiredFields
);
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

---

## Authentication

All endpoints require:
- **Authorization Header**: `Authorization: Bearer <access_token>`
- **User Roles**: Super Admin or Admin (except notification preferences which work for any authenticated user)

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Current limits:
- 100 requests per minute per user
- 1000 requests per hour per IP

---

## Version

**API Version:** 1.0.0
**Last Updated:** 2026-08-04
**Status:** Production Ready
