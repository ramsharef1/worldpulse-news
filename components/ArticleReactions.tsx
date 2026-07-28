'use client';

import { useState, useEffect } from 'react';
import { Button } from './UIComponents';

interface ArticleReactionsProps {
  articleId: string;
  language: 'ar' | 'en';
  onReactionChange?: (type: 'like' | 'bookmark', count: number, isActive: boolean) => void;
}

interface ReactionCounts {
  likes: number;
  bookmarks: number;
}

interface UserReactions {
  isLiked: boolean;
  isBookmarked: boolean;
}

export function ArticleReactions({
  articleId,
  language,
  onReactionChange,
}: ArticleReactionsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [counts, setCounts] = useState<ReactionCounts>({ likes: 0, bookmarks: 0 });
  const [userReactions, setUserReactions] = useState<UserReactions>({
    isLiked: false,
    isBookmarked: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [animatingReaction, setAnimatingReaction] = useState<'like' | 'bookmark' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  // Load reactions from localStorage and API on mount
  useEffect(() => {
    loadReactions();
  }, [articleId]);

  const loadReactions = async () => {
    setIsLoading(true);
    try {
      // Get user ID from localStorage (mock auth)
      const userId = localStorage.getItem('userId');

      if (!userId) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Fetch reactions from API
      const response = await fetch(
        `/api/reactions?articleId=${articleId}&userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        setCounts({
          likes: data.likeCount || 0,
          bookmarks: data.bookmarkCount || 0,
        });
        setUserReactions({
          isLiked: data.userLiked || false,
          isBookmarked: data.userBookmarked || false,
        });
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
      // Load from localStorage as fallback
      const storedReactions = localStorage.getItem(
        `reactions_${articleId}`
      );
      if (storedReactions) {
        const parsed = JSON.parse(storedReactions);
        setCounts(parsed.counts);
        setUserReactions(parsed.userReactions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    setAnimatingReaction('like');
    setTimeout(() => setAnimatingReaction(null), 600);

    try {
      const isCurrentlyLiked = userReactions.isLiked;
      const newCount = isCurrentlyLiked ? counts.likes - 1 : counts.likes + 1;

      // Optimistic update
      setUserReactions({
        ...userReactions,
        isLiked: !isCurrentlyLiked,
      });
      setCounts({ ...counts, likes: newCount });

      // Show feedback
      setFeedbackMessage(
        !isCurrentlyLiked
          ? t('تم إضافة الإعجاب', 'Liked!')
          : t('تم إزالة الإعجاب', 'Unliked')
      );
      setTimeout(() => setFeedbackMessage(''), 2000);

      // Send to API
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          articleId,
          type: 'like',
          action: isCurrentlyLiked ? 'remove' : 'add',
        }),
      });

      if (!response.ok) {
        // Revert on error
        setUserReactions(userReactions);
        setCounts({ ...counts, likes: counts.likes });
      }

      onReactionChange?.('like', newCount, !isCurrentlyLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      setFeedbackMessage(t('حدث خطأ ما', 'Error occurred'));
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    setAnimatingReaction('bookmark');
    setTimeout(() => setAnimatingReaction(null), 600);

    try {
      const isCurrentlyBookmarked = userReactions.isBookmarked;
      const newCount = isCurrentlyBookmarked
        ? counts.bookmarks - 1
        : counts.bookmarks + 1;

      // Optimistic update
      setUserReactions({
        ...userReactions,
        isBookmarked: !isCurrentlyBookmarked,
      });
      setCounts({ ...counts, bookmarks: newCount });

      // Show feedback
      setFeedbackMessage(
        !isCurrentlyBookmarked
          ? t('تم الحفظ', 'Saved!')
          : t('تم إزالة الحفظ', 'Removed from bookmarks')
      );
      setTimeout(() => setFeedbackMessage(''), 2000);

      // Send to API
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          articleId,
          type: 'bookmark',
          action: isCurrentlyBookmarked ? 'remove' : 'add',
        }),
      });

      if (!response.ok) {
        // Revert on error
        setUserReactions(userReactions);
        setCounts({ ...counts, bookmarks: counts.bookmarks });
      }

      onReactionChange?.('bookmark', newCount, !isCurrentlyBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setFeedbackMessage(t('حدث خطأ ما', 'Error occurred'));
    }
  };

  const handleShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: t('شارك هذه المقالة', 'Check out this article'),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setFeedbackMessage(t('تم نسخ الرابط', 'Link copied to clipboard!'));
        setTimeout(() => setFeedbackMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 items-center">
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Login Prompt */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            {t('يجب تسجيل الدخول للتفاعل مع المقالات', 'You must log in to interact with articles')}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" size="sm">
              {t('تسجيل الدخول', 'Sign In')}
            </Button>
            <Button variant="secondary" size="sm">
              {t('إنشاء حساب', 'Sign Up')}
            </Button>
          </div>
        </div>
      )}

      {/* Reactions Container */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Like Button */}
        <div className="relative">
          <Button
            variant={userReactions.isLiked ? 'primary' : 'secondary'}
            size="md"
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-2 transition-all duration-300 ${
              animatingReaction === 'like'
                ? 'scale-110 shadow-lg'
                : 'scale-100'
            }`}
            aria-label={t('إعجاب', 'Like')}
          >
            <span
              className={`text-xl transition-all ${
                userReactions.isLiked ? 'scale-125' : ''
              }`}
            >
              ❤️
            </span>
            <span className="font-semibold">{counts.likes}</span>
            <span className="text-sm hidden sm:inline">
              {t('إعجاب', 'Like')}
            </span>
          </Button>
        </div>

        {/* Bookmark Button */}
        <div className="relative">
          <Button
            variant={userReactions.isBookmarked ? 'primary' : 'secondary'}
            size="md"
            onClick={handleBookmark}
            disabled={!isAuthenticated}
            className={`flex items-center gap-2 transition-all duration-300 ${
              animatingReaction === 'bookmark'
                ? 'scale-110 shadow-lg'
                : 'scale-100'
            }`}
            aria-label={t('حفظ', 'Bookmark')}
          >
            <span
              className={`text-xl transition-all ${
                userReactions.isBookmarked ? 'scale-125' : ''
              }`}
            >
              🔖
            </span>
            <span className="font-semibold">{counts.bookmarks}</span>
            <span className="text-sm hidden sm:inline">
              {t('حفظ', 'Save')}
            </span>
          </Button>
        </div>

        {/* Share Button */}
        <Button
          variant="secondary"
          size="md"
          onClick={handleShare}
          className="flex items-center gap-2"
          aria-label={t('مشاركة', 'Share')}
        >
          <span className="text-xl">📤</span>
          <span className="text-sm hidden sm:inline">
            {t('مشاركة', 'Share')}
          </span>
        </Button>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg inline-block">
          <p className="text-sm text-green-800 dark:text-green-200">
            {feedbackMessage}
          </p>
        </div>
      )}
    </div>
  );
}
