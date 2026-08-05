import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminAuth, forbidden } from '@/lib/auth-middleware';
import {
  predictChurn,
  predictOptimalPublishTimes,
  predictContentPerformance,
} from '@/lib/analytics-predictions';

/**
 * GET /api/analytics/predictions
 * Get AI-powered predictions including churn, optimal publish times, and content performance
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(false, false);

    if (!auth.authorized) {
      return forbidden(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const predictionType = searchParams.get('type') || 'all'; // all, churn, publish_time, content
    const universityId = searchParams.get('university_id');
    const threshold = parseInt(searchParams.get('threshold') || '70');

    const result: any = {
      success: true,
    };

    // Churn predictions
    if (predictionType === 'all' || predictionType === 'churn') {
      try {
        const churnPredictions = await predictChurn(threshold);

        result.churn = {
          predictions: churnPredictions.map((p) => ({
            readerId: p.readerId,
            churnProbability: p.churnProbability,
            riskLevel: p.riskLevel,
            daysInactive: p.daysSinceActivity,
            predictedChurnDate: p.predictedChurnDate,
            recommendation: p.recommendedAction,
          })),
          summary: {
            total: churnPredictions.length,
            high: churnPredictions.filter((p) => p.riskLevel === 'high')
              .length,
            medium: churnPredictions.filter((p) => p.riskLevel === 'medium')
              .length,
            low: churnPredictions.filter((p) => p.riskLevel === 'low')
              .length,
          },
        };
      } catch (error) {
        console.error('Churn prediction error:', error);
        result.churn = { error: 'Failed to calculate churn predictions' };
      }
    }

    // Optimal publish times
    if (predictionType === 'all' || predictionType === 'publish_time') {
      try {
        if (universityId) {
          const publishTimes = await predictOptimalPublishTimes(
            universityId,
            'UTC'
          );

          result.optimalPublishTimes = {
            universityId,
            predictions: publishTimes,
            topRecommendation: publishTimes[0] || null,
          };
        } else {
          result.optimalPublishTimes = {
            error: 'university_id required for publish time predictions',
          };
        }
      } catch (error) {
        console.error('Publish time prediction error:', error);
        result.optimalPublishTimes = {
          error: 'Failed to calculate optimal times',
        };
      }
    }

    // Content performance predictions
    if (predictionType === 'all' || predictionType === 'content') {
      try {
        // Example prediction for draft articles
        const draftArticles = await query(
          `
          SELECT id, title_en, category, university_id
          FROM articles
          WHERE status = 'draft'
          LIMIT 5
        `
        );

        const contentPredictions = [];

        for (const article of draftArticles.rows) {
          const prediction = await predictContentPerformance(
            article.title_en,
            article.category,
            article.university_id
          );

          contentPredictions.push({
            articleId: article.id,
            title: article.title_en,
            prediction: {
              predictedViews: prediction.predictedViews,
              predictedEngagement: prediction.predictedEngagementScore,
              trend: prediction.trendDirection,
              confidence: prediction.confidenceScore,
              recommendation: prediction.recommendation,
            },
          });
        }

        result.contentPerformance = {
          predictions: contentPredictions,
          count: contentPredictions.length,
        };
      } catch (error) {
        console.error('Content prediction error:', error);
        result.contentPerformance = {
          error: 'Failed to predict content performance',
        };
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
