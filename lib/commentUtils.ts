/**
 * Comment Utilities
 * Helper functions for comment management and formatting
 */

export interface CommentData {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  replies: CommentData[];
  parentCommentId?: string;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string, language: 'ar' | 'en'): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return language === 'ar' ? 'الآن' : 'now';
  if (diffMins < 60) return language === 'ar' ? `قبل ${diffMins} دقيقة` : `${diffMins}m ago`;
  if (diffHours < 24) return language === 'ar' ? `قبل ${diffHours} ساعة` : `${diffHours}h ago`;
  if (diffDays < 7) return language === 'ar' ? `قبل ${diffDays} يوم` : `${diffDays}d ago`;

  return date.toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US');
}

/**
 * Validate comment content
 */
export function validateComment(content: string, maxLength: number = 500): {
  isValid: boolean;
  error?: string;
} {
  if (!content.trim()) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }

  if (content.length > maxLength) {
    return { isValid: false, error: `Comment exceeds maximum length of ${maxLength} characters` };
  }

  return { isValid: true };
}

/**
 * Count total comments including replies
 */
export function countTotalComments(comments: CommentData[]): number {
  return comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);
}

/**
 * Get comments sorted by date
 */
export function sortComments(
  comments: CommentData[],
  order: 'newest' | 'oldest' = 'newest'
): CommentData[] {
  return [...comments].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return order === 'newest' ? timeB - timeA : timeA - timeB;
  });
}

/**
 * Filter comments by search term
 */
export function searchComments(
  comments: CommentData[],
  searchTerm: string
): CommentData[] {
  const term = searchTerm.toLowerCase();

  return comments.filter((comment) => {
    const matchesContent = comment.content.toLowerCase().includes(term);
    const matchesAuthor = comment.userName.toLowerCase().includes(term);

    // Also check replies
    const hasMatchingReply = comment.replies?.some(
      (reply) =>
        reply.content.toLowerCase().includes(term) ||
        reply.userName.toLowerCase().includes(term)
    );

    return matchesContent || matchesAuthor || hasMatchingReply;
  });
}

/**
 * Flatten nested comments for easier processing
 */
export function flattenComments(comments: CommentData[]): CommentData[] {
  const flattened: CommentData[] = [];

  comments.forEach((comment) => {
    flattened.push(comment);
    if (comment.replies?.length) {
      flattened.push(...comment.replies);
    }
  });

  return flattened;
}

/**
 * Check if user can edit/delete comment
 */
export function canModifyComment(
  comment: CommentData,
  currentUserId: string,
  maxEditMinutes: number = 30
): boolean {
  if (comment.userId !== currentUserId) {
    return false;
  }

  const editDeadline = new Date(comment.timestamp);
  editDeadline.setMinutes(editDeadline.getMinutes() + maxEditMinutes);

  return new Date() < editDeadline;
}

/**
 * Get mentions from comment content (e.g., @username)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = content.match(mentionRegex) || [];
  return mentions.map((mention) => mention.substring(1));
}

/**
 * Sanitize comment content (basic XSS prevention)
 */
export function sanitizeComment(content: string): string {
  // Remove HTML tags
  let sanitized = content.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  return sanitized.trim();
}

/**
 * Truncate comment for preview
 */
export function truncateComment(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Format comment statistics
 */
export interface CommentStats {
  totalComments: number;
  totalReplies: number;
  averageCharacterLength: number;
  mostActiveUser: string | null;
}

export function getCommentStats(comments: CommentData[]): CommentStats {
  const flattened = flattenComments(comments);

  const totalReplies = comments.reduce((total, c) => total + (c.replies?.length || 0), 0);

  const avgLength =
    flattened.length > 0
      ? Math.round(
          flattened.reduce((sum, c) => sum + c.content.length, 0) / flattened.length
        )
      : 0;

  // Find most active user
  const userCounts: Record<string, number> = {};
  flattened.forEach((comment) => {
    userCounts[comment.userName] = (userCounts[comment.userName] || 0) + 1;
  });

  const mostActiveUser = Object.entries(userCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  return {
    totalComments: comments.length,
    totalReplies,
    averageCharacterLength: avgLength,
    mostActiveUser,
  };
}
