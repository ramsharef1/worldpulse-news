'use client';

import React, { useState, useEffect } from 'react';
import type { SavedArticle } from '@/lib/types';

interface SavedArticlesProps {
  savedArticleIds: string[];
  onRemove: (articleId: string) => void;
  language: 'ar' | 'en';
}

export function SavedArticles({ savedArticleIds, onRemove, language }: SavedArticlesProps) {
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    const loadSavedArticles = async () => {
      try {
        setIsLoading(true);
        // Load mock articles from localStorage or simulate API call
        const stored = localStorage.getItem('univerisitiesvoice_saved_articles');
        if (stored) {
          const savedArticles = JSON.parse(stored);
          // Filter to only show the ones in savedArticleIds
          const filtered = savedArticles.filter((article: SavedArticle) =>
            savedArticleIds.includes(article.id)
          );
          setArticles(filtered);
        }
      } catch (error) {
        console.error('Failed to load saved articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedArticles();
  }, [savedArticleIds]);

  const handleRemove = (articleId: string) => {
    setArticles((prev) => prev.filter((article) => article.id !== articleId));
    onRemove(articleId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">{t('جارٍ التحميل...', 'Loading...')}</div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">📑</div>
        <p className="text-lg">{t('لا توجد مقالات محفوظة', 'No saved articles yet')}</p>
        <p className="text-sm mt-2">{t('احفظ المقالات لقراءتها لاحقاً', 'Save articles to read them later')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <div
          key={article.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
        >
          {/* Image */}
          {article.image && (
            <div className="h-40 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-4 flex flex-col h-full">
            {/* Category Badge */}
            <div className="mb-2">
              <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-semibold px-3 py-1 rounded-full">
                {article.category}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg mb-2 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
              <a href={`/article/${article.id}`}>{article.title}</a>
            </h3>

            {/* Excerpt */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {article.excerpt}
            </p>

            {/* Meta Info */}
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 mb-4 flex-grow">
              <div>{article.university}</div>
              <div>{article.date}</div>
              {article.readTime && <div>{article.readTime}</div>}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={`/article/${article.id}`}
                className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-medium transition-colors"
              >
                {t('اقرأ', 'Read')}
              </a>
              <button
                onClick={() => handleRemove(article.id)}
                className="px-3 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 text-sm font-medium transition-colors"
                title={t('إزالة من المحفوظات', 'Remove from bookmarks')}
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
