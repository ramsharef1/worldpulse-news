/**
 * Utilities for managing reactions and bookmarks
 * Uses localStorage for mock persistence
 */

export interface ReactionData {
  id: string;
  userId: string;
  articleId: string;
  type: 'like' | 'bookmark';
  timestamp: string;
}

export interface ArticleReactionCounts {
  likes: number;
  bookmarks: number;
}

export interface UserReaction {
  isLiked: boolean;
  isBookmarked: boolean;
}

// Key for storing user ID
const USER_ID_KEY = 'userId';
const REACTIONS_PREFIX = 'reactions_';
const ARTICLE_METADATA_PREFIX = 'article_metadata_';

/**
 * Get or create user ID
 */
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Get stored reactions for an article
 */
export function getStoredReactions(
  articleId: string,
  userId: string
): ReactionData[] {
  const key = `${REACTIONS_PREFIX}${articleId}_${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Add or update reaction
 */
export function storeReaction(
  articleId: string,
  userId: string,
  type: 'like' | 'bookmark'
): ReactionData {
  const key = `${REACTIONS_PREFIX}${articleId}_${userId}`;
  const reactions = getStoredReactions(articleId, userId);

  // Check if reaction already exists
  const existingIndex = reactions.findIndex((r) => r.type === type);

  const reaction: ReactionData = {
    id: `reaction_${Date.now()}_${Math.random()}`,
    userId,
    articleId,
    type,
    timestamp: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    reactions[existingIndex] = reaction;
  } else {
    reactions.push(reaction);
  }

  localStorage.setItem(key, JSON.stringify(reactions));
  return reaction;
}

/**
 * Remove reaction
 */
export function removeStoredReaction(
  articleId: string,
  userId: string,
  type: 'like' | 'bookmark'
): void {
  const key = `${REACTIONS_PREFIX}${articleId}_${userId}`;
  const reactions = getStoredReactions(articleId, userId);
  const filtered = reactions.filter((r) => r.type !== type);

  if (filtered.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(filtered));
  }
}

/**
 * Get article metadata (counts)
 */
export function getArticleMetadata(
  articleId: string
): ArticleReactionCounts {
  const key = `${ARTICLE_METADATA_PREFIX}${articleId}`;
  const stored = localStorage.getItem(key);
  return stored
    ? JSON.parse(stored)
    : { likes: 0, bookmarks: 0 };
}

/**
 * Update article metadata
 */
export function updateArticleMetadata(
  articleId: string,
  metadata: ArticleReactionCounts
): void {
  const key = `${ARTICLE_METADATA_PREFIX}${articleId}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      ...metadata,
      lastUpdated: new Date().toISOString(),
    })
  );
}

/**
 * Get user reactions for an article
 */
export function getUserReactions(
  articleId: string,
  userId: string
): UserReaction {
  const reactions = getStoredReactions(articleId, userId);
  return {
    isLiked: reactions.some((r) => r.type === 'like'),
    isBookmarked: reactions.some((r) => r.type === 'bookmark'),
  };
}

/**
 * Get all bookmarked article IDs for a user
 */
export function getUserBookmarks(userId: string): string[] {
  const bookmarksKey = `bookmarks_${userId}`;
  const stored = localStorage.getItem(bookmarksKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Add article to bookmarks
 */
export function addBookmark(articleId: string, userId: string): void {
  const bookmarks = getUserBookmarks(userId);
  if (!bookmarks.includes(articleId)) {
    bookmarks.push(articleId);
    localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(bookmarks));
  }
}

/**
 * Remove article from bookmarks
 */
export function removeBookmark(articleId: string, userId: string): void {
  const bookmarks = getUserBookmarks(userId);
  const filtered = bookmarks.filter((id) => id !== articleId);
  localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(filtered));
}

/**
 * Check if article is bookmarked
 */
export function isArticleBookmarked(articleId: string, userId: string): boolean {
  const bookmarks = getUserBookmarks(userId);
  return bookmarks.includes(articleId);
}

/**
 * Clear all reactions for testing
 */
export function clearAllReactions(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (
      key.startsWith(REACTIONS_PREFIX) ||
      key.startsWith(ARTICLE_METADATA_PREFIX) ||
      key.startsWith('bookmarks_')
    ) {
      localStorage.removeItem(key);
    }
  });
}
