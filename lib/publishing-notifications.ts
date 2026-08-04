import { query } from './db';

/**
 * Publishing notification service
 * Handles sending notifications for publishing events
 */

export interface NotificationPayload {
  articleId: string;
  universityId: string;
  notificationType: string;
  recipientEmail: string;
  subject: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Send publishing notification
 */
export async function sendPublishingNotification(payload: NotificationPayload) {
  try {
    // Insert notification record
    const result = await query(
      `INSERT INTO publishing_notifications
       (article_id, university_id, notification_type, recipient_email, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [payload.articleId, payload.universityId, payload.notificationType, payload.recipientEmail]
    );

    const notification = result.rows[0];

    try {
      // Simulate sending email
      await sendEmailNotification(payload);

      // Mark as sent
      await query(
        `UPDATE publishing_notifications
         SET status = 'sent', sent_at = NOW()
         WHERE id = $1`,
        [notification.id]
      );

      console.log(`Notification sent to ${payload.recipientEmail}`);
      return { success: true, notificationId: notification.id };
    } catch (error) {
      // Mark as failed
      await query(
        `UPDATE publishing_notifications
         SET status = 'failed', error_message = $2
         WHERE id = $1`,
        [notification.id, String(error)]
      );

      console.error('Error sending notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in sendPublishingNotification:', error);
    throw error;
  }
}

/**
 * Simulate email notification sending
 * In production, integrate with SendGrid, AWS SES, etc.
 */
async function sendEmailNotification(payload: NotificationPayload) {
  // In production, integrate with email service
  // For now, we'll log it
  console.log(`Email Notification:
    To: ${payload.recipientEmail}
    Subject: ${payload.subject}
    Message: ${payload.message}
    Type: ${payload.notificationType}
    Article: ${payload.articleId}`);

  // Simulate async email sending
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ messageId: `msg-${Date.now()}` });
    }, 100);
  });
}

/**
 * Send bulk notifications to team
 */
export async function sendBulkNotifications(
  articleId: string,
  universityId: string,
  notificationType: string,
  recipientEmails: string[],
  subject: string,
  message: string
) {
  try {
    const notifications = await Promise.allSettled(
      recipientEmails.map((email) =>
        sendPublishingNotification({
          articleId,
          universityId,
          notificationType,
          recipientEmail: email,
          subject,
          message,
        })
      )
    );

    const results = {
      total: notifications.length,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    };

    notifications.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          email: recipientEmails[index],
          error: result.reason?.message,
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
}

/**
 * Get notification history for an article
 */
export async function getNotificationHistory(articleId: string, limit: number = 50) {
  try {
    const result = await query(
      `SELECT * FROM publishing_notifications
       WHERE article_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [articleId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting notification history:', error);
    throw error;
  }
}

/**
 * Get notification stats
 */
export async function getNotificationStats(universityId: string) {
  try {
    const result = await query(
      `SELECT status, COUNT(*) as count, notification_type
       FROM publishing_notifications
       WHERE university_id = $1
       GROUP BY status, notification_type`,
      [universityId]
    );

    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      byType: {} as Record<string, any>,
    };

    result.rows.forEach((row) => {
      stats.total += row.count;
      if (row.status === 'sent') stats.sent += row.count;
      if (row.status === 'failed') stats.failed += row.count;
      if (row.status === 'pending') stats.pending += row.count;

      if (!stats.byType[row.notification_type]) {
        stats.byType[row.notification_type] = {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
        };
      }

      stats.byType[row.notification_type].total += row.count;
      stats.byType[row.notification_type][row.status] += row.count;
    });

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
}

/**
 * Retry failed notifications
 */
export async function retryFailedNotifications(limit: number = 10) {
  try {
    const result = await query(
      `SELECT * FROM publishing_notifications
       WHERE status = 'failed'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );

    const notifications = result.rows;
    const retryResults = {
      total: notifications.length,
      succeeded: 0,
      failed: 0,
    };

    for (const notification of notifications) {
      try {
        await sendEmailNotification({
          articleId: notification.article_id,
          universityId: notification.university_id,
          notificationType: notification.notification_type,
          recipientEmail: notification.recipient_email,
          subject: `Retry: ${notification.notification_type}`,
          message: `Retrying notification for article ${notification.article_id}`,
        });

        await query(
          `UPDATE publishing_notifications
           SET status = 'sent', sent_at = NOW()
           WHERE id = $1`,
          [notification.id]
        );

        retryResults.succeeded++;
      } catch (error) {
        retryResults.failed++;
        console.error(`Failed to retry notification ${notification.id}:`, error);
      }
    }

    return retryResults;
  } catch (error) {
    console.error('Error retrying failed notifications:', error);
    throw error;
  }
}

/**
 * Create templated notification message
 */
export function createNotificationMessage(
  type: string,
  context: Record<string, any>
): { subject: string; message: string } {
  const templates: Record<string, any> = {
    scheduled: {
      subject: `Content Scheduled: ${context.articleTitle}`,
      message: `Your article "${context.articleTitle}" has been scheduled for publishing on ${context.scheduledTime}.`,
    },
    published: {
      subject: `Content Published: ${context.articleTitle}`,
      message: `Your article "${context.articleTitle}" has been published successfully.`,
    },
    failed: {
      subject: `Publishing Failed: ${context.articleTitle}`,
      message: `Failed to publish "${context.articleTitle}". Error: ${context.error}`,
    },
    retracted: {
      subject: `Content Retracted: ${context.articleTitle}`,
      message: `Your article "${context.articleTitle}" has been retracted. Reason: ${context.reason}`,
    },
    embargo_released: {
      subject: `Embargo Released: ${context.articleTitle}`,
      message: `The embargo on "${context.articleTitle}" has been released and is now published.`,
    },
    approval_needed: {
      subject: `Approval Required: ${context.articleTitle}`,
      message: `Your article "${context.articleTitle}" is pending approval. Please review and approve/reject.`,
    },
  };

  return templates[type] || templates.published;
}
