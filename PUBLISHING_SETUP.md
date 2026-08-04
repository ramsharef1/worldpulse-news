# Publishing & Scheduling API - Quick Start Guide

Get the Publishing & Scheduling API up and running in 5 minutes.

## Step 1: Initialize Database Schema

Add this to your application startup (e.g., in a migration or initialization script):

```typescript
// app/api/init/route.ts or your startup file
import { initializePublishingSchema } from '@/lib/publishing-schema';

export async function GET(request) {
  try {
    await initializePublishingSchema();
    return Response.json({ success: true, message: 'Publishing schema initialized' });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
```

Run once:
```bash
curl http://localhost:3000/api/init
```

## Step 2: Configure Publishing Settings

For each university, configure default settings:

```typescript
// app/api/admin/publishing/setup/route.ts
import { configurePublishingSettings } from '@/lib/publishing-init';

export async function POST(request) {
  const { universityId, config } = await request.json();

  await configurePublishingSettings(universityId, {
    autoPublishEnabled: true,
    defaultTimezone: 'Asia/Amman',
    notificationEmails: ['admin@university.edu'],
    retryOnFailure: true,
    maxRetries: 3,
    retryIntervalMinutes: 5,
  });

  return Response.json({ success: true });
}
```

## Step 3: Set Up Background Processing

Add background job processing to run every minute. Choose your method:

### Option A: Node.js Interval (Development)
```typescript
// lib/background-jobs.ts
import { processPublishingQueue } from '@/lib/publishing-init';

export function startBackgroundJobs() {
  // Process publishing queue every 60 seconds
  setInterval(async () => {
    try {
      const result = await processPublishingQueue();
      console.log('Publishing queue processed:', result);
    } catch (error) {
      console.error('Error processing publishing queue:', error);
    }
  }, 60000);

  console.log('Background jobs started');
}

// pages/_app.tsx or next.config.js
import { startBackgroundJobs } from '@/lib/background-jobs';

startBackgroundJobs();
```

### Option B: Cron Job (Production)
```bash
# Add to crontab: crontab -e
* * * * * curl -X POST http://localhost:3000/api/internal/publishing/process \
  -H "Authorization: Bearer YOUR_SERVICE_TOKEN"
```

### Option C: External Service (AWS Lambda, Google Cloud, etc.)
Create an endpoint that calls `processPublishingQueue()` and configure external scheduler to call it every minute.

## Step 4: Test the API

### Schedule an Article
```bash
curl -X POST http://localhost:3000/api/publishing/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "articleId": "test-article-1",
    "scheduledTime": "'$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%S)'",
    "timezone": "Asia/Amman",
    "priority": 1
  }'
```

### Get Queue Status
```bash
curl http://localhost:3000/api/publishing/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Publish Immediately
```bash
curl -X POST http://localhost:3000/api/publishing/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "articleId": "test-article-1",
    "force": false
  }'
```

## Step 5: Integrate into Admin Panel

Add publishing UI components to your admin panel:

```typescript
// app/admin/publishing/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PublishingDashboard() {
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    const fetchQueue = async () => {
      const response = await fetch('/api/publishing/queue');
      const data = await response.json();
      setQueue(data.stats);
    };
    
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, []);

  if (!queue) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Publishing Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-2xl font-bold">{queue.scheduled}</div>
          <div className="text-gray-600">Scheduled</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <div className="text-2xl font-bold">{queue.queued}</div>
          <div className="text-gray-600">Queued</div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold">{queue.published}</div>
          <div className="text-gray-600">Published</div>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <div className="text-2xl font-bold">{queue.failed}</div>
          <div className="text-gray-600">Failed</div>
        </div>
      </div>

      {/* Add calendar view, queue management, etc. */}
    </div>
  );
}
```

## Database Requirements

Verify PostgreSQL is running and database exists:

```bash
# Connect to your database
psql -U postgres -d universities_voice

# Check tables were created
\dt publishing_*

# Should show:
# - publishing_queue
# - publishing_history
# - publishing_settings
# - publishing_notifications
# - scheduled_jobs
# - calendar_events
```

## Environment Variables

Add to your `.env.local`:

```env
# Database Connection
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=universities_voice

# JWT Secret
JWT_SECRET=your_jwt_secret

# Service Token for background jobs
PUBLISHING_SERVICE_TOKEN=your_service_token

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@universities-voice.edu
```

## File Structure

After setup, your project structure will include:

```
news/
├── app/api/publishing/
│   ├── calendar/route.ts         ← Calendar view endpoints
│   ├── queue/route.ts            ← Queue management
│   ├── publish/route.ts          ← One-click publish
│   ├── schedule/route.ts         ← Schedule for future
│   ├── history/route.ts          ← History & revert
│   ├── bulk/route.ts             ← Bulk operations
│   └── recurring/route.ts        ← Recurring schedules
│
├── lib/
│   ├── publishing-schema.ts      ← Database schema
│   ├── publishing-queue.ts       ← Queue management
│   ├── publishing-scheduler.ts   ← Scheduling logic
│   ├── publishing-notifications.ts ← Notifications
│   ├── publishing-init.ts        ← Initialization
│   └── publishing-examples.ts    ← Usage examples
│
└── Documentation/
    ├── PUBLISHING_API.md         ← Full API documentation
    ├── PUBLISHING_SETUP.md       ← This file
    └── PUBLISHING_IMPLEMENTATION_SUMMARY.md ← Overview
```

## Verification Checklist

- [ ] Database schema initialized (tables exist)
- [ ] Publishing settings configured for your university
- [ ] Background job processor running (every 60 seconds)
- [ ] API endpoints accessible and authenticated
- [ ] Calendar view working
- [ ] Schedule endpoint working
- [ ] Publish endpoint working
- [ ] Notifications configured (optional)

## Common First Steps

### 1. Schedule Your First Article
```bash
curl -X POST http://localhost:3000/api/publishing/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "articleId": "article-123",
    "scheduledTime": "2026-08-15T14:00:00",
    "timezone": "Asia/Amman"
  }'
```

### 2. View the Queue
```bash
curl http://localhost:3000/api/publishing/queue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. View Calendar Events
```bash
curl "http://localhost:3000/api/publishing/calendar?viewType=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Publishing History
```bash
curl http://localhost:3000/api/publishing/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Schema Initialization Fails
- Check database connection: `psql -U postgres -d universities_voice`
- Verify tables don't already exist: `\dt publishing_*`
- Check PostgreSQL version (9.6+ required)

### Background Jobs Not Processing
- Check job processor is running: `ps aux | grep publishing`
- Verify database connectivity
- Check application logs for errors
- Ensure `processPublishingQueue()` is called every 60 seconds

### API Returns 401 Unauthorized
- Verify JWT token is valid
- Check token includes proper claims
- Verify Authorization header format: `Bearer {token}`

### Notifications Not Sending
- Check notification emails in publishing_settings table
- Verify SMTP configuration in environment
- Check publishing_notifications table for errors
- Test with `/api/publishing/history` endpoint

### Scheduling Not Working
- Verify timezone is IANA identifier (e.g., 'Asia/Amman')
- Check scheduled_time is in future
- Verify article exists in articles table
- Check embargo_date if set (prevents publishing)

## Next Steps

1. **Read Full Documentation**: See `PUBLISHING_API.md` for complete endpoint reference
2. **Review Examples**: Check `lib/publishing-examples.ts` for 15+ usage examples
3. **Implement UI**: Build admin panel using the API endpoints
4. **Configure Notifications**: Set up email service integration
5. **Monitor Queue**: Set up logging and monitoring for background jobs

## Support Resources

- **API Documentation**: `PUBLISHING_API.md`
- **Implementation Guide**: `PUBLISHING_IMPLEMENTATION_SUMMARY.md`
- **Code Examples**: `lib/publishing-examples.ts`
- **Database Schema**: `lib/publishing-schema.ts`
- **API Endpoints**: `/app/api/publishing/*/route.ts`

## Features Now Available

✅ Content Calendar - Visual scheduling interface
✅ Scheduled Publishing - Auto-publish at specified time
✅ Embargo Dates - Hide content until release date
✅ Publishing Queue - View and manage all queued items
✅ One-Click Publish - Immediately publish content
✅ Bulk Publishing - Batch operations
✅ Recurring Schedules - Repeat on schedule
✅ Publishing History - Full audit trail
✅ Notifications - Automated alerts
✅ Revert Content - Undo/retract published articles

## Production Deployment

For production:

1. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
2. **Background Jobs**: Use cloud scheduler (AWS Lambda, Google Cloud Tasks, etc.)
3. **Notifications**: Integrate with SendGrid, AWS SES, or Mailgun
4. **Monitoring**: Set up CloudWatch, Datadog, or similar
5. **Backups**: Enable automated database backups
6. **Load Balancing**: Deploy multiple instances behind load balancer

See `PUBLISHING_API.md` for production best practices.
