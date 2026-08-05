# Analytics & Reporting API - Quick Start Guide

## 5-Minute Setup

### Step 1: Apply Database Migration
```bash
# Run the migration
psql -U your_user -d your_database < migrations/004_analytics_reporting.sql

# Verify tables created
psql -U your_user -d your_database -c "\dt"
# Should see new analytics tables
```

### Step 2: Test Dashboard Endpoint
```bash
# Get your auth token (from existing auth system)
TOKEN="your-jwt-token"

# Test dashboard
curl -X GET "http://localhost:3000/api/analytics/dashboard?period=month&lang=en" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "summary": {
    "totalArticles": 150,
    "publishedArticles": 120,
    "totalViews": 45000,
    "avgEngagement": 68
  }
}
```

### Step 3: Test Event Tracking
```bash
# Track an article view (no auth required)
curl -X POST "http://localhost:3000/api/analytics/events" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "view",
    "entityType": "article",
    "entityId": "article-uuid",
    "sessionId": "session-uuid",
    "metadata": {"timeOnPage": 240}
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Event tracked"
}
```

### Step 4: Test Predictions
```bash
# Get trending articles and churn predictions
curl -X GET "http://localhost:3000/api/analytics/predictions?type=all" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response includes:
- Trending articles with scores
- Churn risk predictions
- Optimal publish times

## Common Use Cases

### Get Article Performance
```bash
curl -X GET "http://localhost:3000/api/analytics/articles?limit=10&sort_by=views" \
  -H "Authorization: Bearer $TOKEN"
```

### Get University Stats
```bash
curl -X GET "http://localhost:3000/api/analytics/universities?period=month" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Editorial Metrics
```bash
curl -X GET "http://localhost:3000/api/analytics/editorial?period=month" \
  -H "Authorization: Bearer $TOKEN"
```

### Export Report
```bash
curl -X POST "http://localhost:3000/api/analytics/reports/export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "reportType": "article_performance",
    "startDate": "2024-07-01",
    "endDate": "2024-08-04"
  }' \
  --output report.csv
```

### Get User Behavior
```bash
curl -X GET "http://localhost:3000/api/analytics/user-behavior?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Create Report Definition
```bash
curl -X POST "http://localhost:3000/api/analytics/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Performance Report",
    "description": "All articles performance",
    "reportType": "article_performance",
    "filters": {"dateRange": "week"},
    "columns": ["views", "engagement_score"],
    "language": "en"
  }'
```

## Testing with Postman

### Import Collection
1. Create new Postman collection
2. Add these requests:

#### Request 1: Dashboard
```
GET /api/analytics/dashboard?period=month&lang=en
Header: Authorization: Bearer {{token}}
```

#### Request 2: Track Event
```
POST /api/analytics/events
Body (JSON):
{
  "eventType": "view",
  "entityType": "article",
  "entityId": "test-article",
  "sessionId": "test-session"
}
```

#### Request 3: Articles
```
GET /api/analytics/articles?limit=10
Header: Authorization: Bearer {{token}}
```

#### Request 4: Trending
```
GET /api/analytics/trending?limit=5
Header: Authorization: Bearer {{token}}
```

#### Request 5: Predictions
```
GET /api/analytics/predictions?type=churn
Header: Authorization: Bearer {{token}}
```

## TypeScript Integration

### Using the Analytics API in Frontend

```typescript
// types/analytics.ts
export interface DashboardData {
  summary: {
    totalArticles: number;
    totalViews: number;
    avgEngagement: number;
  };
  topArticles: Article[];
  trending: TrendingArticle[];
}

export interface Article {
  id: string;
  title: string;
  metrics: {
    views: number;
    engagementScore: number;
  };
}

// hooks/useAnalytics.ts
import { useAuth } from './useAuth';

export function useAnalytics() {
  const { token } = useAuth();

  const fetchDashboard = async () => {
    const res = await fetch(
      '/api/analytics/dashboard?period=month&lang=en',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.json() as Promise<DashboardData>;
  };

  const trackEvent = async (eventType: string, entityId: string) => {
    await fetch('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        eventType,
        entityType: 'article',
        entityId,
        sessionId: getSessionId(),
        metadata: { timestamp: Date.now() }
      })
    });
  };

  const fetchPredictions = async () => {
    const res = await fetch('/api/analytics/predictions?type=all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  };

  return {
    fetchDashboard,
    trackEvent,
    fetchPredictions
  };
}

// Component usage
export function Dashboard() {
  const { fetchDashboard } = useAnalytics();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboard().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Total Articles: {data.summary.totalArticles}</div>
      <div>Total Views: {data.summary.totalViews}</div>
      <div>Avg Engagement: {data.summary.avgEngagement}</div>
    </div>
  );
}
```

## Database Verification

```sql
-- Check all analytics tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%analytics%' OR table_name LIKE '%event%';

-- Verify indexes
SELECT schemaname, tablename, indexname FROM pg_indexes 
WHERE tablename LIKE '%analytics%';

-- Check materialized views
SELECT schemaname, matviewname FROM pg_matviews;

-- Count rows in key tables
SELECT 'event_logs' as table_name, COUNT(*) as row_count FROM event_logs
UNION ALL
SELECT 'article_performance_metrics', COUNT(*) FROM article_performance_metrics
UNION ALL
SELECT 'trending_articles', COUNT(*) FROM trending_articles;
```

## Debugging Tips

### Enable Query Logging
```sql
-- In PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();
```

### Check Cache Status
```bash
curl -X GET "http://localhost:3000/api/analytics/settings" \
  -H "Authorization: Bearer $TOKEN"
```

### Monitor Events
```sql
-- See recent events
SELECT event_type, entity_type, COUNT(*) as count
FROM event_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY event_type, entity_type;
```

### Check Predictions
```sql
-- View trending calculations
SELECT article_id, score, rank, momentum
FROM trending_articles
ORDER BY score DESC
LIMIT 10;

-- View churn predictions
SELECT reader_session_id, churn_probability, risk_level
FROM churn_predictions
WHERE risk_level IN ('high', 'medium')
ORDER BY churn_probability DESC;
```

## Common Issues & Solutions

### Issue: "Event tracked" but data not appearing
**Solution**: 
- Verify `reader_sessions` exists
- Check event_logs table permissions
- Ensure session_id format is valid

### Issue: Dashboard returns empty data
**Solution**:
- Run `SELECT COUNT(*) FROM articles` to check article data
- Verify `article_performance_metrics` has data
- Check date filters in query

### Issue: Export fails
**Solution**:
- Check disk space: `df -h`
- Verify PostgreSQL temp space
- Check data format compatibility

### Issue: Slow performance on large datasets
**Solution**:
- Run materialized view refresh: `REFRESH MATERIALIZED VIEW mv_top_articles_by_engagement`
- Check for missing indexes: `EXPLAIN ANALYZE` on slow queries
- Consider archiving old event logs (>90 days)

## Production Checklist

- [ ] Database backup configured
- [ ] Monitoring alerts set up
- [ ] Cache warm-up runs on startup
- [ ] Data retention policies enabled
- [ ] Materialized views refresh scheduled
- [ ] Error logging configured
- [ ] Rate limiting tested
- [ ] API documentation published
- [ ] User training completed
- [ ] Performance baseline established

## Next Steps

1. **Frontend Integration**: Integrate analytics dashboard component
2. **Real-time Updates**: Add WebSocket support
3. **Advanced ML**: Implement Prophet for better predictions
4. **Custom Alerts**: Set up threshold-based notifications
5. **Mobile Optimization**: Create mobile-friendly reports

## Support Resources

- **API Docs**: See `lib/ANALYTICS_API.md`
- **Implementation Guide**: See `ANALYTICS_IMPLEMENTATION.md`
- **Database Schema**: See `migrations/004_analytics_reporting.sql`
- **Code Examples**: See inline documentation in lib files

## Performance Baseline

Expected response times on production server:

| Endpoint | Response Time | Cache |
|----------|---------------|-------|
| Dashboard | 200-300ms | 2h |
| Articles | 150-250ms | 2h |
| Trending | 50-100ms | 1h |
| Events (track) | 50-150ms | N/A |
| Predictions | 500-800ms | 2h |
| Export | 2-5s | N/A |

---

**Ready to go!** 🚀

Start with testing the dashboard endpoint, then gradually integrate other endpoints as needed.
