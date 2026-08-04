# Universities Voice Publishing & Scheduling API

Complete publishing and content scheduling system for the Universities Voice admin panel with 10 key features.

## Features

1. **Content Calendar** - Visual scheduling interface with calendar view
2. **Scheduled Publishing** - Auto-publish content at specified times
3. **Embargo Dates & Release Scheduling** - Hidden content until release date
4. **Publishing Queue Management** - View, prioritize, and manage publishing queue
5. **One-Click Publish** - Immediately publish content with one action
6. **Bulk Publishing** - Perform batch operations on multiple articles
7. **Recurring Content Scheduling** - Schedule content to publish on recurring basis
8. **Publishing History** - Complete audit trail with full history
9. **Publish Notifications** - Automated notifications for publishing events
10. **Revert Published Content** - Undo/retract published articles

## Installation

### 1. Initialize Database Schema

```typescript
import { initializePublishingSchema } from '@/lib/publishing-schema';

// Run once during application startup
await initializePublishingSchema();
```

### 2. Configure Publishing Settings

```typescript
import { configurePublishingSettings } from '@/lib/publishing-init';

// Configure for each university
await configurePublishingSettings('university-123', {
  autoPublishEnabled: true,
  defaultTimezone: 'Asia/Amman',
  embargoByDefault: false,
  requireApproval: false,
  notificationEmails: ['admin@university.edu', 'editor@university.edu'],
  retryOnFailure: true,
  maxRetries: 3,
  retryIntervalMinutes: 5,
});
```

### 3. Set Up Background Job Processing

For production, integrate with a job scheduler to run periodically:

```typescript
import { processPublishingQueue } from '@/lib/publishing-init';

// Run every minute via cron job or task scheduler
setInterval(async () => {
  const result = await processPublishingQueue();
  console.log('Publishing queue processed:', result);
}, 60000); // Every minute
```

## API Endpoints

### Scheduling Content

#### Schedule for Future Publishing
```http
POST /api/publishing/schedule
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "scheduledTime": "2026-08-15T14:30:00",
  "timezone": "Asia/Amman",
  "embargoDate": "2026-08-14T00:00:00",
  "retractionDate": "2026-08-20T23:59:59",
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "article_id": "article-123",
    "status": "scheduled",
    "scheduled_time": "2026-08-15T12:30:00.000Z",
    "timezone": "Asia/Amman"
  }
}
```

#### Get Scheduled Content
```http
GET /api/publishing/schedule?limit=50&offset=0
Authorization: Bearer {token}
```

#### Update Scheduled Time
```http
PUT /api/publishing/schedule
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "scheduledTime": "2026-08-16T14:30:00",
  "timezone": "Asia/Amman"
}
```

#### Cancel Scheduled Publishing
```http
DELETE /api/publishing/schedule?articleId=article-123
Authorization: Bearer {token}
```

### Publishing Content

#### Immediately Publish (One-Click)
```http
POST /api/publishing/publish
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content published successfully",
  "publishedAt": "2026-08-15T12:30:00.000Z"
}
```

#### Get Publish Status
```http
GET /api/publishing/publish?articleId=article-123
Authorization: Bearer {token}
```

### Queue Management

#### Get Publishing Queue
```http
GET /api/publishing/queue?limit=50&offset=0&status=scheduled
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "article_id": "article-123",
      "status": "scheduled",
      "scheduled_time": "2026-08-15T12:30:00.000Z",
      "priority": 1,
      "seconds_until_publish": 3600
    }
  ],
  "stats": {
    "total": 45,
    "scheduled": 30,
    "queued": 10,
    "published": 100,
    "failed": 5
  }
}
```

#### Update Queue Item (Cancel, Retry, Reprioritize)
```http
PATCH /api/publishing/queue
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "action": "cancel|retry|move_up|move_down",
  "reason": "Optional reason for cancellation"
}
```

#### Remove from Queue
```http
DELETE /api/publishing/queue?articleId=article-123
Authorization: Bearer {token}
```

### Calendar Management

#### Get Calendar Events
```http
GET /api/publishing/calendar?startDate=2026-08-01&endDate=2026-08-31&viewType=month
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": 1,
      "articleId": "article-123",
      "date": "2026-08-15T12:30:00.000Z",
      "type": "scheduled_publish",
      "title": "Product Launch Announcement",
      "description": "Major product launch",
      "color": "#3B82F6",
      "allDay": false,
      "timezone": "Asia/Amman",
      "publishStatus": "scheduled",
      "priority": 1
    }
  ],
  "viewType": "month"
}
```

#### Create Calendar Event
```http
POST /api/publishing/calendar
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "eventDate": "2026-08-15T14:30:00",
  "eventType": "scheduled_publish|embargo_release|scheduled_retraction",
  "title": "Product Launch",
  "description": "Major product announcement",
  "timezone": "Asia/Amman",
  "isAllDay": false
}
```

### Publishing History & Revert

#### Get Publishing History
```http
GET /api/publishing/history?limit=100&action=publish&articleId=article-123
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "article_id": "article-123",
      "action": "publish",
      "action_type": "manual|auto",
      "publish_time": "2026-08-15T12:30:00.000Z",
      "user_id": "user-456",
      "user_name": "John Doe",
      "created_at": "2026-08-15T12:30:00.000Z"
    }
  ]
}
```

#### Revert/Retract Published Content
```http
POST /api/publishing/history/revert
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "reason": "Contains incorrect information"
}
```

#### Delete Old History Entries
```http
DELETE /api/publishing/history?olderThanDays=90&articleId=article-123
Authorization: Bearer {token}
```

### Bulk Operations

#### Perform Bulk Operation
```http
POST /api/publishing/bulk
Content-Type: application/json
Authorization: Bearer {token}

{
  "operation": "schedule|publish|retract|cancel",
  "articleIds": ["article-1", "article-2", "article-3"],
  "scheduledTime": "2026-08-15T14:30:00",
  "timezone": "Asia/Amman",
  "priority": 1,
  "reason": "Optional reason for retraction"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "operation": "schedule",
    "total": 3,
    "succeeded": 3,
    "failed": 0,
    "items": [
      {
        "articleId": "article-1",
        "scheduledTime": "2026-08-15T12:30:00.000Z"
      }
    ]
  }
}
```

#### Preview Bulk Operation
```http
GET /api/publishing/bulk/preview?operation=schedule&articleIds=article-1,article-2
Authorization: Bearer {token}
```

### Recurring Schedules

#### Create Recurring Schedule
```http
POST /api/publishing/recurring
Content-Type: application/json
Authorization: Bearer {token}

{
  "articleId": "article-123",
  "baseScheduledTime": "2026-08-15T14:30:00",
  "timezone": "Asia/Amman",
  "recurrence": {
    "frequency": "WEEKLY",
    "interval": 1,
    "byDay": ["MO", "WE", "FR"],
    "until": "2026-12-31T23:59:59",
    "count": null
  },
  "embargoDate": null,
  "retractionDate": null
}
```

**Recurrence Frequency Options:**
- `DAILY` - Every day
- `WEEKLY` - Every week (use `byDay` for specific days)
- `MONTHLY` - Every month (use `byMonthDay` for specific dates)
- `YEARLY` - Every year

**Response:**
```json
{
  "success": true,
  "job": {
    "job_id": "recurring-article-123-1692000000000",
    "article_id": "article-123",
    "job_type": "recurring_publish",
    "next_run": "2026-08-18T12:30:00.000Z",
    "is_active": true
  }
}
```

#### Get Recurring Schedules
```http
GET /api/publishing/recurring?limit=50&activeOnly=true
Authorization: Bearer {token}
```

#### Update Recurring Schedule
```http
PUT /api/publishing/recurring
Content-Type: application/json
Authorization: Bearer {token}

{
  "jobId": "recurring-article-123-1692000000000",
  "recurrence": {
    "frequency": "WEEKLY",
    "byDay": ["MO", "WE"]
  },
  "timezone": "Asia/Amman",
  "isActive": true
}
```

#### Disable Recurring Schedule
```http
DELETE /api/publishing/recurring?jobId=recurring-article-123-1692000000000
Authorization: Bearer {token}
```

#### Preview Upcoming Occurrences
```http
GET /api/publishing/recurring/preview?jobId=recurring-article-123-1692000000000&occurrences=10
Authorization: Bearer {token}
```

#### Process Recurring Jobs
```http
POST /api/publishing/recurring/process
Authorization: Bearer {token}
```

## Timezone Support

The system supports all IANA timezone identifiers. Common examples:

- `UTC` - Coordinated Universal Time
- `Asia/Amman` - Jordan Standard Time
- `America/New_York` - Eastern Time
- `Europe/London` - British Time
- `Asia/Dubai` - Gulf Standard Time

**Example Usage:**
```typescript
import { localToUTC, utcToLocal } from '@/lib/publishing-scheduler';

// Convert local time to UTC
const utcTime = localToUTC('2026-08-15T14:30:00', 'Asia/Amman');

// Convert UTC to local
const localTime = utcToLocal(new Date(), 'Asia/Amman');
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created (POST)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

**Error Response Example:**
```json
{
  "error": "Content is still under embargo",
  "embargoDate": "2026-08-14T00:00:00.000Z",
  "details": "Optional additional details"
}
```

## Embargo & Retraction

### Embargo Dates
Content with an embargo date will not be published until the embargo date passes, even if manually triggered.

```typescript
{
  "articleId": "article-123",
  "scheduledTime": "2026-08-15T14:30:00",
  "embargoDate": "2026-08-14T00:00:00" // Won't publish before this
}
```

### Retraction Dates
Content with a retraction date will automatically be unpublished when that date is reached.

```typescript
{
  "articleId": "article-123",
  "scheduledTime": "2026-08-15T14:30:00",
  "retractionDate": "2026-08-20T23:59:59" // Auto-unpublish after this
}
```

## Database Schema

### publishing_queue
- `id` - Primary key
- `article_id` - Article to publish
- `university_id` - University publishing
- `status` - draft, scheduled, queued, publishing, published, failed, retracted, cancelled
- `scheduled_time` - When to publish
- `publish_time` - When actually published
- `timezone` - Timezone for scheduling
- `embargo_date` - Don't publish before this
- `retraction_date` - Auto-unpublish after this
- `priority` - Publishing priority (higher = sooner)
- `retry_count` - Failed attempts
- `last_error` - Last error message

### publishing_history
- `id` - Primary key
- `article_id` - Article ID
- `action` - publish, retract, embargo_released, etc.
- `action_type` - manual, auto, bulk
- `user_id` - Who performed action
- `user_name` - User's display name
- `reason` - Why action was taken
- `metadata` - Additional JSON data

### scheduled_jobs
- `job_id` - Unique job identifier
- `article_id` - Article for recurring schedule
- `job_type` - Type of job (recurring_publish, etc.)
- `cron_expression` - Recurrence rule as JSON
- `next_run` - When job will next run
- `last_run` - When job last ran
- `is_active` - Whether job is active

### publishing_notifications
- `id` - Primary key
- `article_id` - Article that triggered notification
- `notification_type` - scheduled, published, failed, retracted, embargo_released
- `recipient_email` - Who to notify
- `status` - pending, sent, failed
- `sent_at` - When notification was sent
- `error_message` - Error if failed

### calendar_events
- `id` - Primary key
- `article_id` - Article associated with event
- `event_date` - When event occurs
- `event_type` - scheduled_publish, embargo_release, scheduled_retraction
- `title` - Event title
- `description` - Event description
- `color` - Hex color code for calendar display

## Background Job Processing

The system requires periodic processing of scheduled jobs. Set up a cron job to run the processor:

### Node.js/Express Example
```typescript
import { processPublishingQueue } from '@/lib/publishing-init';

// Process every minute
setInterval(async () => {
  try {
    const result = await processPublishingQueue();
    if (!result.success) {
      console.error('Queue processing error:', result.error);
    }
  } catch (error) {
    console.error('Critical error:', error);
  }
}, 60000);
```

### Cron Job Example
```bash
# Run queue processor every minute
* * * * * node /path/to/queue-processor.js
```

### AWS Lambda/CloudWatch Example
Create a Lambda function that calls `processPublishingQueue()` and schedule it to run every 60 seconds using CloudWatch Events.

## Performance Optimization

### Indexes
The system automatically creates indexes on:
- `publishing_queue(status, scheduled_time, university_id)`
- `publishing_history(article_id, created_at, university_id)`
- `scheduled_jobs(job_type, is_active, next_run)`
- `publishing_notifications(article_id, status, created_at)`
- `calendar_events(university_id, event_date)`

### Query Limits
All paginated endpoints support:
- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

### Cleanup
Regularly clean up old history entries:
```http
DELETE /api/publishing/history?olderThanDays=90
Authorization: Bearer {token}
```

## Notifications

The system sends notifications for:
1. **Content Scheduled** - When article is scheduled for publishing
2. **Content Published** - When article is published
3. **Publishing Failed** - When publishing fails after retries
4. **Content Retracted** - When published content is retracted
5. **Embargo Released** - When embargo date passes
6. **Approval Needed** - When article needs approval (optional)

Notifications are sent to emails configured in publishing settings.

## Security

All endpoints require:
- Valid JWT token via `Authorization: Bearer {token}` header
- User must be admin or super_admin role
- Supports IP whitelisting and 2FA verification

The system uses database transactions for consistency and implements proper error recovery.

## Examples

### Schedule Article for Future Publishing
```typescript
const response = await fetch('/api/publishing/schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    articleId: 'article-456',
    scheduledTime: '2026-08-20T09:00:00',
    timezone: 'Asia/Amman',
    priority: 1,
  }),
});

const data = await response.json();
console.log('Scheduled:', data.job);
```

### Bulk Publish Multiple Articles
```typescript
const response = await fetch('/api/publishing/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    operation: 'publish',
    articleIds: ['article-1', 'article-2', 'article-3'],
  }),
});

const data = await response.json();
console.log(`Published ${data.results.succeeded} articles`);
```

### Create Weekly Recurring Schedule
```typescript
const response = await fetch('/api/publishing/recurring', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    articleId: 'article-789',
    baseScheduledTime: '2026-08-18T09:00:00',
    timezone: 'Asia/Amman',
    recurrence: {
      frequency: 'WEEKLY',
      byDay: ['MO', 'WE', 'FR'],
      until: '2026-12-31T23:59:59',
    },
  }),
});

const data = await response.json();
console.log('Recurring schedule:', data.job);
```

## Troubleshooting

### Queue Not Processing
- Check that background job processor is running
- Verify database connectivity
- Check logs for errors in `processPublishingQueue()`

### Notifications Not Sending
- Verify email configuration in publishing settings
- Check notification status: `GET /api/publishing/history`
- Retry failed notifications via API

### Embargo Not Working
- Ensure embargo_date is in ISO format
- Verify timezone conversion is correct
- Check embargo status: `GET /api/publishing/publish?articleId={id}`

### Recurring Schedules Not Processing
- Ensure `processPublishingQueue()` is being called periodically
- Verify recurrence rule JSON format
- Check scheduled_jobs table for active jobs

## Support & Documentation

For more information:
- View API reference: `/api/publishing/*`
- Check implementation: `/lib/publishing-*.ts`
- See usage examples: `/app/api/publishing/*/route.ts`
