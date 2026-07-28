'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArticleCard, Grid, Alert } from './UIComponents';

interface BookmarkedArticle {
  id: string;
  title: string;
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  category: string;
  university: string;
  date: string;
  image?: string;
  readTime?: string;
}

interface BookmarksListProps {
  language: 'ar' | 'en';
}

export function BookmarksList({ language }: BookmarksListProps) {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError(t('يجب تسجيل الدخول أولاً', 'You must be logged in'));
        setIsLoading(false);
        return;
      }

      // Fetch bookmarks from API
      const response = await fetch(
        `/api/bookmarks?userId=${userId}&limit=100`
      );

      if (response.ok) {
        const data = await response.json();
        setBookmarkedArticles(data.bookmarks || []);
      } else {
        setError(t('فشل تحميل الإشارات المرجعية', 'Failed to load bookmarks'));
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
      setError(t('حدث خطأ أثناء تحميل الإشارات المرجعية', 'Error loading bookmarks'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (articleId: string) => {
    setRemovingId(articleId);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          articleId,
          type: 'bookmark',
          action: 'remove',
        }),
      });

      if (response.ok) {
        setBookmarkedArticles(
          bookmarkedArticles.filter((a) => a.id !== articleId)
        );
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
        <Grid columns={2} gap="lg">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </Grid>
      </div>
    );
  }

  if (error && bookmarkedArticles.length === 0) {
    return (
      <Alert type="info">
        {t(
          'لم تقم بحفظ أي مقالات بعد. ابدأ بحفظ مقالاتك المفضلة!',
          'You haven\'t bookmarked any articles yet. Start saving your favorites!'
        )}
      </Alert>
    );
  }

  if (bookmarkedArticles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔖</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('لا توجد إشارات مرجعية', 'No bookmarks yet')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t(
            'اختر مقالاتك المفضلة وقم بحفظها للقراءة لاحقاً',
            'Choose your favorite articles and save them for reading later'
          )}
        </p>
        <Link href="/news">
          <span className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            {t('استكشف المقالات', 'Explore articles')}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('إشارات مرجعية', 'Bookmarks')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            `لديك ${bookmarkedArticles.length} مقالة محفوظة`,
            `You have ${bookmarkedArticles.length} saved articles`
          )}
        </p>
      </div>

      <Grid columns={2} gap="lg">
        {bookmarkedArticles.map((article) => (
          <div key={article.id} className="relative group">
            <Link href={`/article/${article.id}`}>
              <ArticleCard
                category={article.category}
                title={
                  language === 'ar' ? article.title : article.title_en
                }
                excerpt={
                  language === 'ar'
                    ? article.excerpt
                    : article.excerpt_en
                }
                date={article.date}
                university={article.university}
                readTime={article.readTime}
                image={article.image}
              />
            </Link>

            {/* Remove Button */}
            <button
              onClick={() => handleRemoveBookmark(article.id)}
              disabled={removingId === article.id}
              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 dark:bg-red-600 hover:bg-red-600"
              aria-label={t('إزالة الإشارة المرجعية', 'Remove bookmark')}
            >
              {removingId === article.id ? '...' : '✕'}
            </button>
          </div>
        ))}
      </Grid>
    </div>
  );
}
