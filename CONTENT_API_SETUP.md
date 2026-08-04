# Content Management API - Setup & Implementation Guide

## Quick Start

The Content Management API provides a complete admin panel backend for Universities Voice with 12 core features.

### Installation

1. **Database Migration**
   ```bash
   psql -U postgres -d universities_voice -f migrations/002_content_management_schema.sql
   ```

2. **Install Dependencies** (if needed)
   ```bash
   npm install sharp # For image optimization
   npm install aws-sdk # For S3 integration
   npm install elasticsearch # For search enhancement
   ```

3. **Environment Variables**
   ```env
   # Database
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=universities_voice

   # S3 Configuration
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=your-bucket-name
   AWS_S3_REGION=us-east-1

   # Redis (optional, for caching)
   REDIS_URL=redis://localhost:6379

   # Elasticsearch (optional, for advanced search)
   ELASTICSEARCH_HOST=localhost:9200
   ```

---

## 12 Core Features Implementation

### 1. Article/Event/Job/Faculty CRUD Operations

**Location**: `/app/api/content/articles/`, `/events/`, `/jobs/`, `/faculty/`

**Key Capabilities**:
- Full CRUD (Create, Read, Update, Delete)
- Soft deletes (status-based archiving)
- Multi-language support (EN/AR)
- Filtering by status, university, category
- Pagination with customizable limits

**Example Usage**:
```javascript
// Create article
const response = await fetch('/api/content/articles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user-123'
  },
  body: JSON.stringify({
    title_en: "New Article",
    title_ar: "مقالة جديدة",
    content_en: "Content...",
    content_ar: "المحتوى...",
    university_id: "uni-123",
    category_id: "cat-456",
    status: "draft"
  })
});
```

### 2. Rich Text Editor with Formatting Support

**Location**: `/lib/content-validation.ts`

**Implementation**:
- Store raw HTML in `content_en` and `content_ar` fields
- Client-side: Use TipTap, Slate, or Draft.js for rich editing
- Support for: bold, italic, lists, links, headings, images, code blocks
- Auto-save via draft status
- Extract plain text for search indexing

**Example Frontend Integration**:
```javascript
const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    Link
  ],
  content: article.content_en,
  onUpdate: ({ editor }) => {
    setArticleContent(editor.getHTML());
  }
});
```

### 3. Media Library with Optimization

**Location**: `/app/api/content/media/`, `/lib/media-handler.ts`

**Features**:
- Upload up to 50MB files
- Support for images, videos, documents
- Automatic thumbnail generation (client-side using Sharp)
- Metadata: alt text (EN/AR), dimensions
- Search by filename/alt text
- Usage statistics
- Soft delete (archive)

**Upload Example**:
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('alt_text_en', 'Image description');
formData.append('alt_text_ar', 'وصف الصورة');

const response = await fetch('/api/content/media', {
  method: 'POST',
  headers: { 'X-User-Id': 'user-123' },
  body: formData
});
```

### 4. Batch Operations (Bulk Edit, Delete)

**Location**: `/app/api/content/batch/route.ts`

**Operations Supported**:
- `bulk_create` - Create multiple with duplicate detection
- `bulk_update` - Update multiple simultaneously
- `bulk_delete` - Soft delete multiple
- `bulk_publish` - Publish multiple
- `bulk_change_university` - Move to different university
- `bulk_check_duplicates` - Validate all items
- `export` - Export to JSON/CSV

**Example**:
```javascript
// Bulk update articles
const response = await fetch('/api/content/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user-123'
  },
  body: JSON.stringify({
    action: 'bulk_update',
    items: ['art-1', 'art-2', 'art-3'],
    updates: {
      status: 'published',
      is_featured: true
    }
  })
});
```

### 5. Content Versioning with Rollback

**Location**: `/app/api/content/versions/`, `/lib/content-versioning.ts`

**Features**:
- Auto-create versions on update
- Full history with version numbers
- Rollback to any previous version
- Change tracking (who changed what)
- Annotations on versions

**Get History Example**:
```javascript
const response = await fetch(
  '/api/content/versions?content_id=art-789&entity_type=article'
);
const { versions } = await response.json();

// Rollback to version 3
const rollbackResponse = await fetch('/api/content/versions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user-123'
  },
  body: JSON.stringify({
    action: 'rollback',
    content_id: 'art-789',
    entity_type: 'article',
    version_number: 3
  })
});
```

### 6. Change Tracking & Annotations

**Location**: `/lib/content-versioning.ts`

**Tracked Information**:
- Field-level changes (old vs. new values)
- User who made changes
- Timestamp of change
- Reason for change
- Annotations/notes on versions

**Add Annotation Example**:
```javascript
const response = await fetch('/api/content/versions', {
  method: 'POST',
  body: JSON.stringify({
    action: 'annotate',
    version_id: 'ver-123',
    field: 'title_en',
    note: 'Updated for clarity and SEO'
  })
});
```

### 7. Template System (Reusable Structures)

**Location**: `/app/api/content/templates/route.ts`

**Features**:
- Pre-built templates for each entity type
- Variable substitution: `{{variable_name}}`
- Track template usage
- Organize by category
- Apply template to pre-populate content

**Create Template Example**:
```javascript
const response = await fetch('/api/content/templates', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Breaking News Template',
    entity_type: 'article',
    category: 'news',
    template_content: {
      title_en: 'BREAKING: {{headline}}',
      title_ar: 'عاجل: {{headline_ar}}',
      content_en: '📰 BREAKING NEWS\n\n{{body}}\n\n[More details to follow...]',
      is_breaking: true,
      tags: ['breaking', 'news']
    }
  })
});

// Apply template
const applyResponse = await fetch('/api/content/templates', {
  method: 'PATCH',
  body: JSON.stringify({
    action: 'apply_template',
    template_id: 'temp-123',
    entity_type: 'article',
    variables: {
      headline: 'Major Announcement',
      headline_ar: 'إعلان هام',
      body: 'Details about the announcement...'
    }
  })
});
```

### 8. Duplicate Detection & Warnings

**Location**: `/lib/duplicate-detection.ts`

**Algorithm**:
- Levenshtein distance for similarity scoring
- Configurable threshold (default 75%)
- Proximity checking for events
- Context-aware (same university)

**Implementation**:
- Automatically triggered on create/update
- Returns matches with similarity scores
- Optional skip_duplicates flag
- Prevents accidental content duplication

**Check Duplicates Example**:
```javascript
const response = await fetch('/api/content/batch', {
  method: 'POST',
  body: JSON.stringify({
    action: 'bulk_check_duplicates',
    items: [
      {
        title_en: 'New Article',
        title_ar: 'مقالة جديدة',
        type: 'article',
        university_id: 'uni-123'
      }
    ]
  })
});

// Response includes duplicates found and similarity scores
```

### 9. Content Search & Filtering

**Location**: `/app/api/content/search/route.ts`

**Features**:
- Full-text search across all content types
- Search in title, content, excerpt (EN/AR)
- Filter by entity type, status, university, date
- Advanced search with complex filters
- Pagination and result ranking
- Indexed queries for performance

**Search Example**:
```javascript
// Simple search
const response = await fetch(
  '/api/content/search?q=artificial%20intelligence&page=1&limit=20'
);

// Advanced search with filters
const advancedResponse = await fetch('/api/content/search', {
  method: 'POST',
  body: JSON.stringify({
    query: 'AI',
    filters: {
      type: 'article',
      university_id: 'uni-123',
      status: 'published',
      date_from: '2026-01-01',
      date_to: '2026-12-31'
    },
    page: 1,
    limit: 20
  })
});
```

### 10. Multi-Language Support (AR/EN)

**Location**: Throughout all endpoints

**Implementation**:
- Separate `_en` and `_ar` fields for all content
- Language preference tracking
- Bilingual search
- Original language indication
- Meta-translation support

**Multi-Language Example**:
```javascript
const article = {
  title_en: 'University Announcement',
  title_ar: 'إعلان الجامعة',
  content_en: 'English content...',
  content_ar: 'المحتوى العربي...',
  excerpt_en: 'Brief English summary',
  excerpt_ar: 'ملخص عربي موجز',
  language_original: 'en', // Original language
  location_en: 'Campus Main Building',
  location_ar: 'مبنى الحرم الجامعي الرئيسي'
};
```

### 11. Auto-Save (Prevent Data Loss)

**Location**: Draft status functionality + `/app/api/content/articles/[id]/route.ts`

**Implementation**:
- Store as "draft" status by default
- Client-side periodic saves
- Version created only on publish
- Recover from drafts anytime

**Auto-Save Flow**:
```javascript
// Save as draft (frequent, lightweight)
const saveDraft = async () => {
  await fetch('/api/content/articles/art-789', {
    method: 'PUT',
    body: JSON.stringify({
      ...articleData,
      status: 'draft',
      change_reason: 'Auto-save'
    })
  });
};

// Publish (creates version)
const publish = async () => {
  await fetch('/api/content/articles/art-789', {
    method: 'POST',
    body: JSON.stringify({
      action: 'publish'
    })
  });
};
```

### 12. Content Preview (Frontend Render)

**Location**: `/app/api/content/articles/[id]/route.ts` - `preview` action

**Features**:
- Preview how content will appear
- Full HTML rendering
- Frontend URL generation
- Live preview before publishing

**Preview Example**:
```javascript
const response = await fetch('/api/content/articles/art-789', {
  method: 'POST',
  body: JSON.stringify({
    action: 'preview'
  })
});

const { preview, frontendUrl } = await response.json();

// Open in iframe for preview
iframe.src = frontendUrl + '?preview=true';
```

---

## Admin Panel Integration

### Dashboard Components Needed

1. **Article Manager**
   - List with filters/search
   - Create/Edit forms
   - Batch operations
   - Version history viewer
   - Duplicate warnings

2. **Media Manager**
   - Upload interface
   - Gallery grid
   - Search/filter
   - Bulk operations
   - Alt text editor

3. **Template Builder**
   - WYSIWYG template editor
   - Variable selector
   - Preview template output
   - Usage analytics

4. **Content Calendar**
   - Published vs. draft content
   - Scheduled posts
   - Event timeline

5. **Audit Log Viewer**
   - View all changes
   - Filter by user/date/action
   - Restore from versions

---

## Performance Optimization

### Caching Strategy
```javascript
// Cache popular templates
const CACHE_TTL = 3600; // 1 hour
const cachedTemplates = await redis.get('templates:all');

if (!cachedTemplates) {
  const templates = await query('SELECT * FROM content_templates');
  await redis.setex('templates:all', CACHE_TTL, JSON.stringify(templates));
}
```

### Database Optimization
- Full-text search indexes created
- Foreign key relationships optimized
- Soft delete queries filtered with `deleted_at IS NULL`
- Pagination to avoid large result sets

### API Rate Limiting
```javascript
// Implement rate limiting for bulk operations
const rateLimit = (req, limit = 100) => {
  const key = `batch:${req.headers['x-user-id']}`;
  // Use Redis to track requests
};
```

---

## Security Considerations

1. **Authentication**: Verify `X-User-Id` header (implement JWT in production)
2. **Authorization**: Check user permissions before operations
3. **Input Validation**: All fields validated before database insert
4. **SQL Injection**: Use parameterized queries (already implemented)
5. **File Uploads**: Validate MIME types and file sizes
6. **Audit Logging**: Track all admin actions
7. **Soft Deletes**: Never hard delete (preserve history)

---

## Monitoring & Logging

```javascript
// Log all content operations
logger.info('Content action', {
  action: 'create',
  entity_type: 'article',
  entity_id: 'art-789',
  user_id: 'user-123',
  timestamp: new Date()
});
```

---

## API Testing

### Using curl
```bash
# List articles
curl http://localhost:3000/api/content/articles \
  -H "X-User-Id: user-123"

# Create article
curl -X POST http://localhost:3000/api/content/articles \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d @article.json

# Upload media
curl -X POST http://localhost:3000/api/content/media \
  -H "X-User-Id: user-123" \
  -F "file=@image.jpg" \
  -F "alt_text_en=Description"
```

### Using Postman
Import the provided Postman collection: `postman_collection.json`

---

## Troubleshooting

### Common Issues

**Issue**: Versions not created
- **Solution**: Ensure `X-User-Id` header is sent

**Issue**: Duplicates not detected
- **Solution**: Check similarity threshold (default 75%)

**Issue**: Media upload fails
- **Solution**: Verify S3 credentials and bucket permissions

**Issue**: Search returns no results
- **Solution**: Check database indexes are created (run migration)

---

## Next Steps

1. Create admin UI components
2. Add S3 integration for media uploads
3. Implement Elasticsearch for advanced search
4. Set up Redis caching
5. Add workflow approval system
6. Implement user permissions/roles
7. Add analytics dashboard
8. Set up automated backups

---

## API Documentation

Full API documentation available in `/lib/content-api.md`

For detailed endpoint specifications, request/response examples, and error codes, see the content API documentation.
