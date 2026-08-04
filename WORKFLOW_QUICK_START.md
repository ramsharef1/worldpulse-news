# Editorial Workflow API - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Run Database Migration

```bash
# Connect to PostgreSQL and run:
psql -U postgres -d universities_voice -f migrations/003_editorial_workflow_system.sql
```

This creates all necessary tables, indexes, views, and permissions.

### 2. Verify Installation

```bash
# Test database connection
curl -X GET http://localhost:3000/api/workflow/approvals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should return: `{"success": true, "approvals": [], "total": 0}`

---

## 🚀 Common Tasks

### Create an Article Draft

```bash
curl -X POST http://localhost:3000/api/workflow/approvals \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_id": "550e8400-e29b-41d4-a716-446655440000",
    "draft_id": "550e8400-e29b-41d4-a716-446655440001",
    "stage_id": "STAGE_ID_FROM_DB",
    "assigned_to_id": "EDITOR_USER_ID"
  }'
```

### Get My Pending Approvals

```bash
curl -X GET "http://localhost:3000/api/workflow/approvals?assigned_to=YOUR_USER_ID&status=pending" \
  -H "Authorization: Bearer TOKEN"
```

### Approve an Article

```bash
curl -X PATCH http://localhost:3000/api/workflow/approvals \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_id": "APPROVAL_ID",
    "action": "approve",
    "notes": "Looks good to publish"
  }'
```

### Add an Editorial Comment

```bash
curl -X POST http://localhost:3000/api/workflow/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_id": "ARTICLE_ID",
    "draft_id": "DRAFT_ID",
    "content": "@john Please review the statistics",
    "comment_type": "note",
    "section": "content",
    "mentions": ["john_user_id"]
  }'
```

### Suggest an Edit

```bash
curl -X POST http://localhost:3000/api/workflow/change-requests \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_id": "ARTICLE_ID",
    "draft_id": "DRAFT_ID",
    "field_name": "title",
    "original_text": "Old Title",
    "suggested_text": "Improved Title",
    "change_reason": "More engaging",
    "change_type": "text_edit"
  }'
```

### Flag Content for Review

```bash
curl -X POST http://localhost:3000/api/workflow/flags \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_id": "ARTICLE_ID",
    "draft_id": "DRAFT_ID",
    "flag_type": "factual_error",
    "severity": "high",
    "description": "Statistics citation is outdated"
  }'
```

### Resolve a Flag

```bash
curl -X PATCH http://localhost:3000/api/workflow/flags \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flag_id": "FLAG_ID",
    "action": "resolve",
    "resolution_notes": "Updated statistics to 2024"
  }'
```

### Get Dashboard

```bash
curl -X GET http://localhost:3000/api/workflow/dashboard \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔐 Required Permissions

Grant these to users based on role:

```sql
-- For Editors
INSERT INTO user_permissions (user_id, permission)
VALUES 
  ('editor_id', 'articles:comment'),
  ('editor_id', 'articles:suggest_changes'),
  ('editor_id', 'articles:approve');

-- For Reviewers
INSERT INTO user_permissions (user_id, permission)
VALUES 
  ('reviewer_id', 'articles:review_queue'),
  ('reviewer_id', 'articles:approve'),
  ('reviewer_id', 'articles:comment');

-- For Publishers
INSERT INTO user_permissions (user_id, permission)
VALUES 
  ('publisher_id', 'articles:approve'),
  ('publisher_id', 'articles:manage_rules'),
  ('publisher_id', 'articles:reassign');
```

---

## 📊 Key Endpoints at a Glance

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/workflow/approvals` | List all approvals |
| POST | `/workflow/approvals` | Create approval |
| PATCH | `/workflow/approvals` | Approve/reject |
| GET | `/workflow/approvals/[id]` | Approval details |
| PATCH | `/workflow/approvals/[id]` | Reassign approval |
| GET | `/workflow/comments` | Get comments |
| POST | `/workflow/comments` | Add comment |
| PATCH | `/workflow/comments` | Resolve comment |
| GET | `/workflow/change-requests` | List changes |
| POST | `/workflow/change-requests` | Suggest edit |
| PATCH | `/workflow/change-requests` | Accept/reject change |
| GET | `/workflow/flags` | List flags |
| POST | `/workflow/flags` | Flag content |
| PATCH | `/workflow/flags` | Resolve flag |
| GET | `/workflow/states` | Get workflow state |
| POST | `/workflow/states` | Transition state |
| GET | `/workflow/rules` | List rules |
| POST | `/workflow/rules` | Create rule |
| PATCH | `/workflow/rules/[id]` | Update rule |
| GET | `/workflow/dashboard` | Dashboard data |
| GET | `/workflow/dashboard/my-tasks` | User tasks |
| GET | `/workflow/dashboard/reports` | Analytics |

---

## 🎯 Workflow States

```
DRAFT
  ↓
PENDING_REVIEW
  ↓
IN_REVIEW  ← Can loop back
  ↓
APPROVED
  ↓
PUBLISHED (final)
  ↓
REJECTED (can loop back)
```

---

## 🚨 Common Error Codes

```json
{
  "401": "Unauthorized - Missing or invalid token",
  "403": "Forbidden - Insufficient permissions",
  "400": "Bad Request - Invalid parameters",
  "404": "Not Found - Resource doesn't exist",
  "500": "Server Error - Check logs"
}
```

---

## 💡 Best Practices

### 1. Always Include Deadlines
```json
{
  "deadline": "2024-08-15T10:00:00Z"
}
```

### 2. Use Comments for Collaboration
Better than chat - keeps everything in context and creates audit trail.

### 3. Route with Rules
Instead of manual assignment, create rules for automatic routing:
- High-view articles → CEO
- Breaking news → Fast track
- Sensitive topics → Legal review

### 4. Monitor Dashboard
Check `/workflow/dashboard` for:
- Overdue items
- Critical flags
- Bottlenecks in approval chain

### 5. Resolve Comments
Always resolve comment threads when addressed. Helps track completeness.

---

## 🔍 Query Examples

### Get All Pending Approvals for Me
```bash
curl -X GET "http://localhost:3000/api/workflow/approvals?status=pending&assigned_to=MY_ID" \
  -H "Authorization: Bearer TOKEN"
```

### Get Critical Flags (Review Queue)
```bash
curl -X GET "http://localhost:3000/api/workflow/flags?status=open&severity=critical" \
  -H "Authorization: Bearer TOKEN"
```

### Get All Comments on Article
```bash
curl -X GET "http://localhost:3000/api/workflow/comments?article_id=ARTICLE_ID" \
  -H "Authorization: Bearer TOKEN"
```

### Get Pending Changes on Draft
```bash
curl -X GET "http://localhost:3000/api/workflow/change-requests?draft_id=DRAFT_ID&status=pending" \
  -H "Authorization: Bearer TOKEN"
```

### Get Workflow History
```bash
curl -X GET "http://localhost:3000/api/workflow/states?article_id=ARTICLE_ID" \
  -H "Authorization: Bearer TOKEN"
```

### Get Analytics
```bash
curl -X GET "http://localhost:3000/api/workflow/dashboard/reports?days=30" \
  -H "Authorization: Bearer TOKEN"
```

---

## 🧪 Integration Testing

### Test Full Workflow

```bash
#!/bin/bash
TOKEN="your_jwt_token"
ARTICLE_ID="550e8400-e29b-41d4-a716-446655440000"
DRAFT_ID="550e8400-e29b-41d4-a716-446655440001"

# 1. Create approval
APPROVAL=$(curl -X POST http://localhost:3000/api/workflow/approvals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"article_id\":\"$ARTICLE_ID\",\"draft_id\":\"$DRAFT_ID\",\"stage_id\":\"STAGE_ID\",\"assigned_to_id\":\"USER_ID\"}")

APPROVAL_ID=$(echo $APPROVAL | jq -r '.approval.id')

# 2. Add comment
curl -X POST http://localhost:3000/api/workflow/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"article_id\":\"$ARTICLE_ID\",\"draft_id\":\"$DRAFT_ID\",\"content\":\"Test comment\"}"

# 3. Approve
curl -X PATCH http://localhost:3000/api/workflow/approvals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"approval_id\":\"$APPROVAL_ID\",\"action\":\"approve\",\"notes\":\"Approved\"}"

# 4. Check dashboard
curl -X GET http://localhost:3000/api/workflow/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Mobile-Friendly Dashboard

All endpoints support JSON response for easy mobile app integration:

```javascript
// React example
const getPendingApprovals = async (token) => {
  const response = await fetch(
    'http://api.example.com/api/workflow/approvals?status=pending',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.json();
};
```

---

## 🔄 Approval Chain Example

```
Article Submitted
    ↓
Editor Review (STAGE 1)
    ↓
Fact Checker (STAGE 2)
    ↓
Legal Review (STAGE 3 - if needed)
    ↓
Publisher Sign-Off (STAGE 4)
    ↓
Published
```

---

## 📊 Important Queries

```sql
-- Get overdue articles
SELECT * FROM workflow_status_view 
WHERE deadline_status = 'overdue';

-- Get articles by stage
SELECT current_state, COUNT(*) 
FROM workflow_status_view 
GROUP BY current_state;

-- Get stuck articles (pending too long)
SELECT * FROM article_drafts 
WHERE state = 'in_review' 
AND updated_at < NOW() - INTERVAL '5 days';

-- Get user's metrics
SELECT COUNT(*) as approvals_count
FROM approvals 
WHERE assigned_to_id = 'USER_ID' 
AND approved_at > NOW() - INTERVAL '30 days';
```

---

## 🎓 Learning Path

1. **Beginner**: Create & approve an article (5 mins)
2. **Intermediate**: Add comments and suggestions (10 mins)
3. **Advanced**: Set up conditional routing rules (20 mins)
4. **Expert**: Analyze dashboard reports and optimize workflow (30 mins)

---

## 🆘 Support

- **API Docs**: See `EDITORIAL_WORKFLOW_API.md`
- **Database Schema**: See `migrations/003_editorial_workflow_system.sql`
- **Utilities**: See `lib/workflow-utils.ts`
- **Error Logs**: Check server logs for detailed errors

---

**Ready to go!** Start with the common tasks above and explore the full API documentation as needed.
