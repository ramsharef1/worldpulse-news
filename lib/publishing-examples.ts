/**
 * Publishing & Scheduling API - Usage Examples
 * Real-world examples for using the publishing system
 */

/**
 * Example 1: Schedule an article for future publishing
 */
export async function exampleScheduleArticle() {
  const token = 'your-jwt-token';
  const articleId = 'article-123';

  const response = await fetch('/api/publishing/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      timezone: 'Asia/Amman',
      priority: 1,
    }),
  });

  const data = await response.json();
  console.log('Article scheduled:', data.job);
  return data;
}

/**
 * Example 2: Publish article immediately
 */
export async function examplePublishNow() {
  const token = 'your-jwt-token';
  const articleId = 'article-123';

  const response = await fetch('/api/publishing/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId,
      force: false, // Respects embargo dates
    }),
  });

  const data = await response.json();
  console.log('Article published:', data);
  return data;
}

/**
 * Example 3: Schedule with embargo (hidden until release date)
 */
export async function exampleScheduleWithEmbargo() {
  const token = 'your-jwt-token';
  const articleId = 'article-123';

  const now = new Date();
  const embargoUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 2 days from now
  const publishTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 3 days from now

  const response = await fetch('/api/publishing/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId,
      scheduledTime: publishTime.toISOString(),
      timezone: 'Asia/Amman',
      embargoDate: embargoUntil.toISOString(), // Content is hidden until this date
    }),
  });

  const data = await response.json();
  console.log('Article scheduled with embargo:', data.job);
  return data;
}

/**
 * Example 4: Bulk schedule multiple articles
 */
export async function exampleBulkSchedule() {
  const token = 'your-jwt-token';
  const articleIds = ['article-1', 'article-2', 'article-3'];

  const response = await fetch('/api/publishing/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      operation: 'schedule',
      articleIds,
      scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
      timezone: 'Asia/Amman',
      priority: 2,
    }),
  });

  const data = await response.json();
  console.log(`Scheduled ${data.results.succeeded}/${data.results.total} articles`);
  return data;
}

/**
 * Example 5: Create weekly recurring schedule
 */
export async function exampleRecurringWeekly() {
  const token = 'your-jwt-token';
  const articleId = 'article-newsletter';

  const response = await fetch('/api/publishing/recurring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId,
      baseScheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      timezone: 'Asia/Amman',
      recurrence: {
        frequency: 'WEEKLY',
        byDay: ['MO', 'WE', 'FR'], // Monday, Wednesday, Friday
        until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      },
    }),
  });

  const data = await response.json();
  console.log('Recurring schedule created:', data.job);
  return data;
}

/**
 * Example 6: Get calendar view for a month
 */
export async function exampleGetCalendar() {
  const token = 'your-jwt-token';

  const startDate = new Date(2026, 7, 1); // August 1, 2026
  const endDate = new Date(2026, 7, 31); // August 31, 2026

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    viewType: 'month',
  });

  const response = await fetch(`/api/publishing/calendar?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log(`Found ${data.events.length} calendar events`);
  data.events.forEach((event: any) => {
    console.log(`- ${event.title}: ${new Date(event.date).toLocaleString()}`);
  });
  return data;
}

/**
 * Example 7: Get publishing queue status
 */
export async function exampleGetQueueStatus() {
  const token = 'your-jwt-token';

  const response = await fetch('/api/publishing/queue?limit=100', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log('Publishing Queue Status:');
  console.log(`  Total: ${data.stats.total}`);
  console.log(`  Scheduled: ${data.stats.scheduled}`);
  console.log(`  Published: ${data.stats.published}`);
  console.log(`  Failed: ${data.stats.failed}`);

  // Show next 5 items to publish
  console.log('\nNext to publish:');
  data.items.slice(0, 5).forEach((item: any, index: number) => {
    const minutesUntilPublish = Math.ceil(item.seconds_until_publish / 60);
    console.log(
      `  ${index + 1}. ${item.article_id} - ${minutesUntilPublish} minutes`
    );
  });

  return data;
}

/**
 * Example 8: Retract published content
 */
export async function exampleRetractContent() {
  const token = 'your-jwt-token';
  const articleId = 'article-123';

  const response = await fetch('/api/publishing/history/revert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId,
      reason: 'Contains factual errors that need correction',
    }),
  });

  const data = await response.json();
  console.log('Content retracted:', data);
  return data;
}

/**
 * Example 9: View publishing history
 */
export async function exampleGetPublishingHistory() {
  const token = 'your-jwt-token';
  const articleId = 'article-123';

  const params = new URLSearchParams({
    articleId,
    limit: '50',
    offset: '0',
  });

  const response = await fetch(`/api/publishing/history?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log(`Publishing history for ${articleId}:`);

  data.history.forEach((entry: any) => {
    const date = new Date(entry.created_at).toLocaleString();
    console.log(`  - ${entry.action} by ${entry.user_name} at ${date}`);
  });

  return data;
}

/**
 * Example 10: Setup automatic queue processing
 */
export async function exampleSetupAutoProcessing() {
  // This should run in a background service/cron job
  const token = 'your-service-token';

  setInterval(async () => {
    try {
      console.log('[Publishing] Processing queue...');

      // In production, call your backend queue processor
      // This would be an internal endpoint that calls processPublishingQueue()

      // Example: POST to internal API
      await fetch('/api/internal/publishing/process-queue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then((res) => res.json()).then((data) => {
        if (data.success) {
          console.log(
            `[Publishing] Processed:`,
            `Published=${data.processed.published}`,
            `Recurring=${data.processed.recurringProcessed}`,
            `Embargo released=${data.processed.embargoReleased}`
          );
        }
      });
    } catch (error) {
      console.error('[Publishing] Error processing queue:', error);
    }
  }, 60000); // Run every minute

  console.log('Queue auto-processing started (every 60 seconds)');
}

/**
 * Example 11: Preview bulk operation before executing
 */
export async function examplePreviewBulkOperation() {
  const token = 'your-jwt-token';
  const articleIds = ['article-1', 'article-2', 'article-3', 'article-4'];

  const params = new URLSearchParams({
    operation: 'publish',
    articleIds: articleIds.join(','),
  });

  const response = await fetch(`/api/publishing/bulk/preview?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  console.log('Bulk Operation Preview:');
  console.log(`  Operation: ${data.operation}`);
  console.log(
    `  Ready to process: ${data.preview.canProcess}/${data.preview.total}`
  );
  console.log(`  Will fail: ${data.preview.willFail}`);

  if (data.preview.willFail > 0) {
    console.log('\nWarning: These articles cannot be published:');
    data.preview.articles
      .filter((a: any) => !a.canOperation)
      .forEach((a: any) => {
        console.log(
          `  - ${a.articleId} (current status: ${a.currentStatus})`
        );
      });
  }

  return data;
}

/**
 * Example 12: Timezone-aware scheduling
 */
export async function exampleTimezoneSensitiveScheduling() {
  const token = 'your-jwt-token';

  // User in Middle East (Asia/Amman) wants to publish at 2 PM local time
  // But system stores everything in UTC

  const localPublishTime = '2026-08-15T14:00:00'; // 2 PM Amman time
  const timezone = 'Asia/Amman';

  const response = await fetch('/api/publishing/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId: 'article-123',
      scheduledTime: localPublishTime,
      timezone, // System automatically converts to UTC
    }),
  });

  const data = await response.json();

  console.log(`Article scheduled:`);
  console.log(
    `  Local time (${timezone}): ${localPublishTime}`
  );
  console.log(`  UTC time: ${data.job.scheduled_time}`);

  return data;
}

/**
 * Example 13: Schedule with automatic retraction
 */
export async function exampleScheduleWithAutoRetraction() {
  const token = 'your-jwt-token';
  const articleId = 'article-promotion';

  const now = new Date();
  const publishTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const retractionTime = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000
  ); // 7 days from now

  const response = await fetch('/api/publishing/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId,
      scheduledTime: publishTime.toISOString(),
      timezone: 'Asia/Amman',
      retractionDate: retractionTime.toISOString(), // Auto-unpublish after 7 days
    }),
  });

  const data = await response.json();
  console.log(
    `Promotion scheduled with auto-retraction after 7 days:`,
    data.job
  );
  return data;
}

/**
 * Example 14: Monthly recurring schedule
 */
export async function exampleRecurringMonthly() {
  const token = 'your-jwt-token';

  const response = await fetch('/api/publishing/recurring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      articleId: 'article-monthly-report',
      baseScheduledTime: new Date(2026, 7, 15, 9, 0, 0).toISOString(), // Aug 15, 9 AM
      timezone: 'Asia/Amman',
      recurrence: {
        frequency: 'MONTHLY',
        byMonthDay: [15], // 15th of each month
        until: new Date(2027, 7, 15).toISOString(), // 1 year
      },
    }),
  });

  const data = await response.json();
  console.log('Monthly report schedule created:', data.job);
  return data;
}

/**
 * Example 15: Get publishing statistics
 */
export async function exampleGetPublishingStats() {
  const token = 'your-jwt-token';

  const response = await fetch('/api/publishing/history', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  console.log('Publishing Statistics:');
  console.log(`  Total history entries: ${data.pagination.total}`);

  // Group by action
  const actions = {};
  data.history.forEach((entry: any) => {
    actions[entry.action] = (actions[entry.action] || 0) + 1;
  });

  console.log('\nBreakdown by action:');
  Object.entries(actions).forEach(([action, count]) => {
    console.log(`  ${action}: ${count}`);
  });

  return data;
}
