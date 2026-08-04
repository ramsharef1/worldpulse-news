# Content Management API Documentation

Complete Content Management API for Universities Voice admin panel with 12 core features.

## API Endpoints Overview

### 1. Articles Management
- **GET** `/api/content/articles` - List articles with pagination, filtering, and search
- **POST** `/api/content/articles` - Create new article with versioning and duplicate detection
- **PATCH** `/api/content/articles` - Batch update articles
- **DELETE** `/api/content/articles` - Batch soft delete articles

- **GET** `/api/content/articles/[id]` - Retrieve single article (with optional version history)
- **PUT** `/api/content/articles/[id]` - Update article with versioning
- **POST** `/api/content/articles/[id]` - Special actions (publish, preview, rollback, duplicate)
- **DELETE** `/api/content/articles/[id]` - Soft delete single article

### 2. Events Management
- **GET** `/api/content/events` - List events with filtering
- **POST** `/api/content/events` - Create new event with duplicate detection
- **PATCH** `/api/content/events` - Batch update events
- **DELETE** `/api/content/events` - Batch soft delete events

### 3. Jobs Management
- **GET** `/api/content/jobs` - List job postings with filtering
- **POST** `/api/content/jobs` - Create job posting with duplicate detection
- **PATCH** `/api/content/jobs` - Batch update jobs
- **DELETE** `/api/content/jobs` - Batch soft delete jobs

### 4. Faculty Management
- **GET** `/api/content/faculty` - List faculty with filtering
- **POST** `/api/content/faculty` - Add faculty member
- **PATCH** `/api/content/faculty` - Batch update faculty
- **DELETE** `/api/content/faculty` - Remove faculty

### 5. Media Library
- **GET** `/api/content/media` - List media files with pagination and search
- **POST** `/api/content/media` - Upload media or update metadata
- **PATCH** `/api/content/media` - Batch update media metadata
- **DELETE** `/api/content/media` - Batch delete media files

### 6. Templates
- **GET** `/api/content/templates` - List templates with filtering
- **POST** `/api/content/templates` - Create new template
- **PATCH** `/api/content/templates` - Update template or apply template
- **DELETE** `/api/content/templates` - Deactivate template

### 7. Search
- **GET** `/api/content/search` - Full-text search across all content
- **POST** `/api/content/search` - Advanced search with filters

### 8. Batch Operations
- **POST** `/api/content/batch` - Bulk operations (create, update, delete, publish, etc.)

### 9. Version Management
- **GET** `/api/content/versions` - Get version history and compare versions
- **POST** `/api/content/versions` - Rollback or annotate versions
- **DELETE** `/api/content/versions` - Archive version

---

## Feature Details

### 1. CRUD Operations
All entities support full CRUD with:
- Create: POST to collection endpoint
- Read: GET from collection or single resource
- Update: PUT for single item, PATCH for batch
- Delete: DELETE (soft deletes, status-based)

### 2. Rich Text Editor Support
Content fields (`content_en`, `content_ar`) support:
- HTML formatting stored directly
- Raw text extraction for search
- Markdown to HTML conversion (client-side)
- Auto-save via draft status

### 3. Media Library
- Upload files up to 50MB
- Support for images, videos, documents
- Automatic thumbnail generation
- Metadata: alt text (EN/AR), dimensions
- Soft delete (archived)
- Search by filename or alt text
- Usage statistics and quotas

### 4. Batch Operations
Supported bulk operations:
- `bulk_create` - Create multiple items with duplicate detection
- `bulk_update` - Update multiple items simultaneously
- `bulk_delete` - Soft delete multiple items
- `bulk_publish` - Publish multiple articles/events
- `bulk_change_university` - Move items to different university
- `bulk_check_duplicates` - Check all items for duplicates
- `export` - Export data (JSON/CSV)

### 5. Content Versioning
- Automatic version creation on update
- Full history with version numbers
- Track who changed what and when
- Rollback to any previous version
- Change annotations and notes
- Diff comparison between versions

### 6. Change Tracking
- Record all changes in `changes` field
- Compare old vs. new values
- User attribution (who made changes)
- Change reason/comment support
- Timestamp all modifications

### 7. Template System
- Pre-built templates for common content types
- Variable substitution: `{{variable_name}}`
- Usage tracking
- Category organization
- Apply template to auto-populate content

### 8. Duplicate Detection
- Similarity scoring (Levenshtein distance)
- Configurable threshold (default 75%)
- Check across same university
- Date/time proximity for events
- Prevents accidental duplicates
- Detailed match information

### 9. Content Search
Full-text search capabilities:
- Search across title and content (EN/AR)
- Filter by entity type, status, university
- Filter by date range
- Pagination support
- Result ranking/relevance
- Multi-language support

### 10. Multi-Language Support
All content supports:
- English (EN) and Arabic (AR) fields
- Language preference tracking
- Original language indication
- Separate excerpt translations
- Bilingual search

### 11. Auto-Save
Draft status prevents data loss:
- Auto-save via draft state
- Version created on publish
- Explicit status transitions
- Recovery from drafts

### 12. Content Preview
Frontend rendering preview:
- Preview before publishing
- See how content will appear
- Frontend URL generation
- Full HTML rendering

---

## Request/Response Examples

### Create Article
```bash
POST /api/content/articles
Content-Type: application/json
X-User-Id: user123

{
  "title_en": "University Announces New Program",
  "title_ar": "الجامعة تعلن عن برنامج جديد",
  "content_en": "Detailed content here...",
  "content_ar": "محتوى التفاصيل هنا...",
  "excerpt_en": "Brief summary...",
  "excerpt_ar": "ملخص موجز...",
  "university_id": "uni-123",
  "category_id": "cat-456",
  "featured_image_url": "https://...",
  "tags": ["news", "academics"],
  "status": "draft",
  "is_featured": true
}

Response:
{
  "success": true,
  "data": {
    "id": "art-789",
    "title_en": "University Announces New Program",
    "status": "draft",
    "created_at": "2026-08-04T10:30:00Z"
  },
  "version": 1,
  "message": "Article created successfully"
}
```

### List Articles with Filters
```bash
GET /api/content/articles?page=1&limit=20&status=published&university_id=uni-123&search=new

Response:
{
  "success": true,
  "data": [
    { /* article object */ },
    { /* article object */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Update Article with Versioning
```bash
PUT /api/content/articles/art-789
Content-Type: application/json
X-User-Id: user123

{
  "title_en": "Updated Title",
  "status": "review",
  "change_reason": "Fixed typos and updated content"
}

Response:
{
  "success": true,
  "data": { /* updated article */ },
  "version": 2,
  "message": "Article updated successfully"
}
```

### Publish Article
```bash
POST /api/content/articles/art-789
Content-Type: application/json
X-User-Id: user123

{
  "action": "publish"
}

Response:
{
  "success": true,
  "message": "Article published successfully",
  "data": { /* published article */ }
}
```

### Check Article Duplicates
```bash
POST /api/content/articles
Content-Type: application/json

{
  "title_en": "Similar Title",
  "title_ar": "عنوان مشابه",
  "content_en": "..."
}

Response (409):
{
  "success": false,
  "error": "Potential duplicate detected",
  "duplicates": [
    {
      "id": "art-456",
      "title": "Existing Article / المقالة الموجودة",
      "similarity_score": 92.5,
      "created_at": "2026-07-20T..."
    }
  ],
  "recommendation": "This appears to be a duplicate..."
}
```

### Batch Update Operations
```bash
PATCH /api/content/articles
Content-Type: application/json

{
  "ids": ["art-1", "art-2", "art-3"],
  "updates": {
    "status": "published",
    "is_featured": true
  }
}

Response:
{
  "success": true,
  "message": "Updated 3 articles",
  "updated": 3
}
```

### Get Version History
```bash
GET /api/content/versions?content_id=art-789&entity_type=article&limit=50

Response:
{
  "success": true,
  "contentId": "art-789",
  "entityType": "article",
  "totalVersions": 5,
  "versions": [
    {
      "id": "ver-123",
      "version_number": 5,
      "data": { /* article data */ },
      "changes": {
        "title_en": { "old": "Old Title", "new": "New Title" }
      },
      "change_summary": "title_en, content_en",
      "changed_by": "user123",
      "created_at": "2026-08-04T10:30:00Z",
      "annotations": [
        {
          "id": "ann-1",
          "field": "title_en",
          "note": "Updated for clarity",
          "annotated_by": "user456"
        }
      ]
    }
  ]
}
```

### Rollback to Previous Version
```bash
POST /api/content/versions
Content-Type: application/json
X-User-Id: user123

{
  "action": "rollback",
  "content_id": "art-789",
  "entity_type": "article",
  "version_number": 3
}

Response:
{
  "success": true,
  "message": "Successfully rolled back to version 3",
  "data": { /* article data from version 3 */ }
}
```

### Full-Text Search
```bash
GET /api/content/search?q=artificial%20intelligence&entity_type=article&university_id=uni-123&page=1&limit=20

Response:
{
  "success": true,
  "query": "artificial intelligence",
  "totalResults": 45,
  "results": {
    "articles": [ /* matching articles */ ],
    "events": [ /* matching events */ ],
    "jobs": [],
    "faculty": []
  },
  "counts": {
    "articles": 30,
    "events": 15,
    "jobs": 0,
    "faculty": 0
  }
}
```

### Upload Media
```bash
POST /api/content/media
Content-Type: multipart/form-data
X-User-Id: user123

formData:
- file: [binary file]
- alt_text_en: "Description of image"
- alt_text_ar: "وصف الصورة"

Response:
{
  "success": true,
  "data": {
    "id": "med-123",
    "filename": "image.jpg",
    "mime_type": "image/jpeg",
    "size": 245678,
    "s3_url": "https://bucket.s3.amazonaws.com/...",
    "thumbnail_url": "https://bucket.s3.amazonaws.com/...",
    "alt_text_en": "Description of image",
    "created_at": "2026-08-04T..."
  }
}
```

### Batch Operations
```bash
POST /api/content/batch
Content-Type: application/json
X-User-Id: user123

{
  "action": "bulk_update",
  "items": ["art-1", "art-2", "art-3"],
  "updates": {
    "status": "published",
    "is_featured": true
  }
}

Response:
{
  "success": true,
  "message": "Updated 3 items",
  "updated": 3,
  "errors": 0
}
```

---

## Authentication & Authorization

### Headers Required
- `X-User-Id` - User identifier (required for user-specific operations)
- `Authorization` - Bearer token (implement as needed)

### Permissions
- Admin: Full access to all operations
- University Admin: Access to university content only
- Editor: Create/edit/publish articles
- Viewer: Read-only access

---

## Error Handling

### Common Error Codes
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (missing user ID)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate detected, version conflict)
- `500` - Server Error (database/system error)

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Database Schema Requirements

Required tables:
- `articles` - Main article content
- `events` - Event postings
- `jobs` - Job postings
- `faculty` - Faculty directory
- `media_files` - Media library
- `content_templates` - Reusable templates
- `content_versions` - Version history
- `change_annotations` - Version annotations
- `duplicate_checks` - Duplicate detection log
- `content_media` - Content-media relationships

---

## Performance Considerations

- Pagination: Default 20 items, max 100
- Search: Indexed on title_en, title_ar, content_en
- Versions: Keep last 100 versions per content
- Media: Implement S3 lifecycle policies
- Cache: Use Redis for frequently accessed content
- Batch ops: Process max 1000 items per request

---

## Future Enhancements

- Elasticsearch integration for advanced search
- Redis caching layer
- S3 image optimization pipeline
- Workflow approval system
- Advanced analytics
- AI-powered duplicate detection
- Translation API integration
- Content scheduling
- Webhook support
