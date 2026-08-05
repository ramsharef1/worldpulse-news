# Analytics & Reporting API Documentation

## Overview

The Analytics & Reporting API provides comprehensive analytics, reporting, and predictive capabilities for the Universities Voice admin panel. This production-ready system tracks article performance, user behavior, editorial metrics, and provides AI-powered predictions for trending content, churn detection, and optimal publishing times.

## Features

### 1. **Article Performance Dashboard** (Feature #1)
- Real-time article views, engagement metrics, and trending scores
- Detailed performance breakdowns by date, category, and university
- Scroll depth, time on page, bounce rate, and click-through analysis

### 2. **University Statistics** (Feature #2)
- Content distribution across universities
- Total reach and unique visitor metrics
- Category performance breakdown
- Contributor productivity tracking

### 3. **Editorial Metrics** (Feature #3)
- Editor productivity scores and quality metrics
- Approval times and workflow efficiency
- Content output tracking
- Performance rankings

### 4. **User Behavior Analytics** (Feature #4)
- Reader demographics and engagement patterns
- Return rate calculations
- Session duration and page view tracking
- Category preferences

### 5. **Content Performance Predictions** (Feature #5)
- ML-based predictions before publishing
- Engagement forecasting
- Similar content analysis
- Confidence scoring

### 6. **Real-time Stats Widgets** (Feature #6)
- Live metrics updates
- Dashboard aggregations
- Top content highlighting
- Trending indicators

### 7. **Trending Prediction** (Feature #7)
- AI-powered trending score calculations
- Rank change tracking
- Momentum metrics
- 24h/7d trend analysis

### 8. **Churn Prediction** (Feature #8)
- Reader engagement drop detection
- Risk level classification (low/medium/high)
- Predicted churn dates
- Re-engagement recommendations

### 9. **Optimal Publish Time** (Feature #9)
- AI recommendations for publish timing
- Historical performance analysis
- Day-of-week and hour-of-day optimization
- Confidence scoring

### 10. **Performance Triggers** (Feature #10)
- Auto-promotion of trending content
- High performer identification
- Automated feature recommendations
- Custom threshold alerts

### 11. **Exportable Reports** (Feature #11)
- PDF, Excel, CSV export formats
- Scheduled report generation
- Email delivery
- Custom filtering and sorting

### 12. **Custom Report Builder** (Feature #12)
- Dynamic report creation
- Custom metric selection
- Template management
- Saved report configurations

## API Endpoints

### Dashboard Analytics

#### GET `/api/analytics/dashboard`
Get comprehensive dashboard data with key metrics overview.

**Query Parameters:**
- `university_id` (optional): Filter by university
- `period` (optional): `day`, `week`, `month`, `quarter` (default: `month`)
- `lang` (optional): `en` or `ar` (default: `en`)

**Response:**
```json
{
  "success": true,
  "period": "month",
  "summary": {
    "totalArticles": 150,
    "publishedArticles": 120,
    "totalViews": 45000,
    "avgEngagement": 68,
    "contributors": 45,
    "totalClicks": 8900,
    "totalShares": 1200,
    "totalComments": 3400
  },
  "topArticles": [...],
  "universities": [...],
  "trending": [...]
}
```

### Article Performance Analytics

#### GET `/api/analytics/articles`
Get detailed article-level performance metrics with filtering and sorting.

**Query Parameters:**
- `article_id` (optional): Get specific article
- `university_id` (optional): Filter by university
- `category` (optional): Filter by category
- `status` (optional): Article status filter (default: `published`)
- `sort_by` (optional): `views`, `engagement_score`, `bounce_rate`, etc.
- `sort_order` (optional): `ASC` or `DESC`
- `start_date`, `end_date` (optional): Date range filter
- `limit` (optional): Max 500, default 50
- `offset` (optional): Pagination offset
- `lang` (optional): `en` or `ar`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "article-uuid",
      "title": "Article Title",
      "university": "University Name",
      "category": "Academic",
      "status": "published",
      "metrics": {
        "views": 5000,
        "uniqueViews": 3200,
        "avgTimeOnPage": 245,
        "scrollDepth": 68.5,
        "bounceRate": 12.3,
        "clicks": 450,
        "shares": 120,
        "comments": 45,
        "reactions": 230,
        "engagementScore": 78
      },
      "trackingDays": 15
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 500,
    "hasMore": true
  }
}
```

### University Statistics

#### GET `/api/analytics/universities`
Get university-level statistics including content distribution and reach.

**Query Parameters:**
- `university_id` (optional): Get specific university
- `period` (optional): `week`, `month`, `quarter` (default: `month`)
- `lang` (optional): `en` or `ar`

**Response:**
```json
{
  "success": true,
  "universities": [
    {
      "id": "uni-uuid",
      "name": "University Name",
      "country": "Jordan",
      "content": {
        "total": 250,
        "published": 200,
        "draft": 30,
        "inReview": 20
      },
      "reach": {
        "totalViews": 125000,
        "uniqueVisitors": 45000,
        "totalClicks": 12500,
        "totalShares": 3200
      },
      "engagement": {
        "avgScore": 72,
        "contributors": 35
      },
      "categories": [
        {
          "category": "Academic",
          "articles": 80,
          "views": 45000,
          "engagement": 75
        }
      ]
    }
  ]
}
```

### Editorial Performance Metrics

#### GET `/api/analytics/editorial`
Get editorial team productivity and quality metrics.

**Query Parameters:**
- `user_id` (optional): Get specific editor
- `period` (optional): `week`, `month`, `quarter` (default: `month`)
- `lang` (optional): Language preference

**Response:**
```json
{
  "success": true,
  "editors": [
    {
      "id": "user-uuid",
      "name": "Editor Name",
      "email": "editor@example.com",
      "output": {
        "total": 45,
        "published": 38,
        "draft": 5,
        "pending": 2,
        "monthlyPublished": 12
      },
      "quality": {
        "qualityScore": 85,
        "productivityScore": 88,
        "avgApprovalHours": 4.5
      },
      "approvals": {
        "total": 150,
        "approved": 140,
        "rejected": 5,
        "pending": 5,
        "avgHours": 3.2
      }
    }
  ],
  "summary": {
    "totalEditors": 15,
    "totalArticles": 450,
    "totalPublished": 380,
    "avgApprovalHours": 4.2,
    "topPerformers": [...]
  }
}
```

### Trending Articles

#### GET `/api/analytics/trending`
Get trending articles with real-time trending scores.

**Query Parameters:**
- `limit` (optional): Max 100, default 20
- `period` (optional): `24h`, `7d`, `30d` (default: `24h`)
- `lang` (optional): `en` or `ar`
- `university_id` (optional): Filter by university

**Response:**
```json
{
  "success": true,
  "count": 20,
  "trending": [
    {
      "id": "article-uuid",
      "title": "Article Title",
      "excerpt": "Short excerpt...",
      "university": "University Name",
      "category": "Research",
      "trending": {
        "rank": 1,
        "score": 89.5,
        "rankChange": 3,
        "trend": "up",
        "momentum": 45.2,
        "views24h": 5000,
        "engagement24h": 450
      }
    }
  ]
}
```

### AI Predictions

#### GET `/api/analytics/predictions`
Get AI-powered predictions for churn, optimal publish times, and content performance.

**Query Parameters:**
- `type` (optional): `all`, `churn`, `publish_time`, `content` (default: `all`)
- `university_id` (required for `publish_time`)
- `threshold` (optional): Churn probability threshold (default: 70)

**Response:**
```json
{
  "success": true,
  "churn": {
    "predictions": [
      {
        "readerId": "session-uuid",
        "churnProbability": 85,
        "riskLevel": "high",
        "daysInactive": 14,
        "predictedChurnDate": "2024-08-25",
        "recommendation": "re_engagement_campaign"
      }
    ],
    "summary": {
      "total": 150,
      "high": 45,
      "medium": 60,
      "low": 45
    }
  },
  "optimalPublishTimes": {
    "universityId": "uni-uuid",
    "predictions": [
      {
        "dayOfWeek": "Tuesday",
        "hour": 10,
        "avgEngagement": 82,
        "historicalViews": 15000,
        "recommendationScore": 92
      }
    ],
    "topRecommendation": {...}
  },
  "contentPerformance": [
    {
      "articleId": "article-uuid",
      "title": "Draft Article",
      "prediction": {
        "predictedViews": 8500,
        "predictedEngagement": 72,
        "trend": "up",
        "confidence": 78,
        "recommendation": "promote_on_homepage"
      }
    }
  ]
}
```

### Event Tracking

#### POST `/api/analytics/events`
Track user events (views, clicks, shares). Public endpoint for client-side tracking.

**Request Body:**
```json
{
  "eventType": "view",
  "entityType": "article",
  "entityId": "article-uuid",
  "sessionId": "session-uuid",
  "userId": "user-uuid (optional)",
  "metadata": {
    "timeOnPage": 245,
    "scrollDepth": 68.5,
    "referrer": "google.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event tracked"
}
```

#### GET `/api/analytics/events`
Retrieve event logs for analysis (admin only).

**Query Parameters:**
- `event_type`: Filter by event type
- `entity_type`: Filter by entity type
- `entity_id`: Filter by entity ID
- `start_date`, `end_date`: Date range
- `limit`: Max 1000
- `offset`: Pagination

### User Behavior Analytics

#### GET `/api/analytics/user-behavior`
Get user behavior analytics with engagement patterns and churn risk.

**Query Parameters:**
- `user_id` (optional): Specific user
- `session_id` (optional): Specific session
- `churn_risk` (optional): `low`, `medium`, `high`
- `limit`: Max 500
- `offset`: Pagination

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "behavior-uuid",
      "userId": "user-uuid",
      "sessionId": "session-uuid",
      "engagement": {
        "lastVisit": "2024-08-04T14:30:00Z",
        "visitFrequency": 4.5,
        "avgSessionDuration": 320,
        "totalTimeOnPlatform": 12500,
        "articlesRead": 45,
        "avgArticlesPerVisit": 2.3
      },
      "preferences": {
        "favoriteCategories": ["Academic", "Research"],
        "lastEngagement": "2024-08-04T10:15:00Z"
      },
      "retention": {
        "churnRisk": 32,
        "lifetimeValue": 125.50
      }
    }
  ],
  "summary": {
    "totalUsers": 5000,
    "riskDistribution": {
      "high": 450,
      "medium": 1200,
      "low": 3350
    },
    "averages": {
      "churnRisk": 42,
      "visitFrequency": 3.2,
      "timeOnPlatform": 8500,
      "lifetimeValue": 98.75
    }
  },
  "pagination": {...}
}
```

#### POST `/api/analytics/user-behavior`
Track or update user behavior data.

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "visitFrequency": 4.5,
  "avgSessionDuration": 320,
  "articlesRead": 45,
  "preferredCategories": ["Academic", "Research"]
}
```

### Reports Management

#### GET `/api/analytics/reports`
List all reports.

**Query Parameters:**
- `type` (optional): Filter by report type
- `is_public` (optional): `true` or `false`

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "report-uuid",
      "name": "Monthly Article Performance",
      "description": "...",
      "type": "article_performance",
      "owner": "you",
      "isScheduled": true,
      "isPublic": false,
      "createdAt": "2024-08-01T10:00:00Z",
      "updatedAt": "2024-08-04T14:30:00Z"
    }
  ]
}
```

#### POST `/api/analytics/reports`
Create a new report definition.

**Request Body:**
```json
{
  "name": "Weekly Performance Report",
  "description": "Weekly metrics for all universities",
  "reportType": "article_performance",
  "filters": {
    "dateRange": "week",
    "status": "published"
  },
  "columns": ["views", "engagement_score", "bounce_rate"],
  "sortBy": "views",
  "sortOrder": "DESC",
  "language": "en"
}
```

#### DELETE `/api/analytics/reports?id=report-uuid`
Delete a report definition.

### Report Export

#### POST `/api/analytics/reports/export`
Generate and export a report in CSV, Excel, or PDF format.

**Request Body:**
```json
{
  "reportId": "report-uuid (optional)",
  "format": "csv",
  "reportType": "article_performance",
  "startDate": "2024-07-01",
  "endDate": "2024-08-04",
  "universityId": "uni-uuid (optional)"
}
```

**Response:**
Returns binary file data with appropriate content type header.

#### GET `/api/analytics/reports/export?report_id=uuid&action=preview`
Get export template or preview data.

### Analytics Settings

#### GET `/api/analytics/settings`
Get all analytics configuration settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "tracking": [
      {
        "key": "track_page_views",
        "value": true,
        "description": "Enable page view tracking",
        "type": "boolean"
      }
    ],
    "retention": [
      {
        "key": "event_log_retention_days",
        "value": 90,
        "description": "Days to retain event logs",
        "type": "number"
      }
    ]
  }
}
```

#### PUT `/api/analytics/settings`
Update analytics settings (super admin only).

**Request Body:**
```json
{
  "settingKey": "track_page_views",
  "settingValue": "true"
}
```

## Authentication

All endpoints except `/api/analytics/events` (POST) require JWT authentication via the `Authorization: Bearer <token>` header.

Admin-only endpoints require `super_admin` or `admin` role.

## Rate Limiting

- **Event tracking**: 100 requests per minute per IP
- **API queries**: 50 requests per minute per user
- **Report generation**: 5 requests per minute per user

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message description",
  "statusCode": 400
}
```

## Database Schema

The analytics system uses the following main tables:

- `event_logs`: Tracks all user events
- `reader_sessions`: Reader session management
- `article_performance_metrics`: Daily article metrics
- `university_statistics`: University-level statistics
- `editorial_performance`: Editor productivity metrics
- `user_behavior_analytics`: User engagement patterns
- `trending_articles`: Trending score tracking
- `churn_predictions`: Churn risk predictions
- `report_definitions`: Report templates
- `report_schedules`: Scheduled report runs
- `generated_reports`: Generated report history
- `analytics_cache`: Performance optimization cache

## Utility Libraries

### `lib/analytics-calculations.ts`
- `calculateEngagementScore()`: Calculate overall engagement
- `calculateProductivityScore()`: Editor productivity metrics
- `calculateBounceRate()`: Bounce rate calculations
- `calculateGrowthRate()`: Growth trend analysis
- `calculateChurnProbability()`: Churn risk scoring
- `calculateTrendingScore()`: Trending content scoring

### `lib/analytics-predictions.ts`
- `predictTrendingArticles()`: Trending content prediction
- `predictArticlePerformance()`: Performance forecasting
- `predictChurn()`: Reader churn prediction
- `predictOptimalPublishTimes()`: Publish time optimization
- `predictContentPerformance()`: Pre-publication prediction

### `lib/analytics-export.ts`
- `convertToCSV()`: CSV export generation
- `generateExcelExport()`: Excel format export
- `generatePDFExport()`: PDF format export
- `prepareArticlePerformanceExport()`: Article data preparation
- `prepareUniversityStatsExport()`: University data preparation
- `prepareEditorialMetricsExport()`: Editorial data preparation

## Example Usage

### Fetch Dashboard Data
```typescript
const response = await fetch('/api/analytics/dashboard?period=month&lang=ar', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
const data = await response.json();
```

### Track Event
```typescript
await fetch('/api/analytics/events', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'view',
    entityType: 'article',
    entityId: articleId,
    sessionId: sessionId,
    metadata: { timeOnPage: 245 }
  })
});
```

### Export Report
```typescript
const response = await fetch('/api/analytics/reports/export', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    format: 'csv',
    reportType: 'article_performance',
    startDate: '2024-07-01',
    endDate: '2024-08-04'
  })
});

const blob = await response.blob();
// Download or process blob
```

## Bilingual Support

All endpoints support bilingual content via the `lang` parameter:
- `en`: English
- `ar`: Arabic

## Performance Optimization

The system uses several optimization strategies:
- PostgreSQL materialized views for complex queries
- Redis caching for expensive calculations
- Event log aggregation and batch processing
- Automatic data retention/archival policies
- Indexed queries for fast filtering

## Future Enhancements

- WebSocket integration for real-time dashboard updates
- Advanced ML models for better predictions
- Custom dimension analysis
- A/B testing integration
- Social media metrics integration
- Video content analytics
- Audience segmentation tools

## Support & Documentation

For issues or questions, contact the development team or refer to the inline code documentation in each library file.

---
**Version**: 1.0.0  
**Last Updated**: August 4, 2024  
**Status**: Production Ready
