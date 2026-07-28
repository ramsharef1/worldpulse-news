'use client';

import React, { useState, useEffect } from 'react';
import type { UserComment } from '@/lib/types';

interface UserCommentsProps {
  comments: UserComment[];
  onDelete: (commentId: string) => void;
  language: 'ar' | 'en';
}

export function UserComments({ comments, onDelete, language }: UserCommentsProps) {
  const [displayedComments, setDisplayedComments] = useState<UserComment[]>(comments);
  const [isLoading, setIsLoading] = useState(false);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    setDisplayedComments(comments);
  }, [comments]);

  const handleDelete = async (commentId: string) => {
    if (!window.confirm(t('هل أنت متأكد من حذف هذا التعليق؟', 'Are you sure you want to delete this comment?'))) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDisplayedComments((prev) => prev.filter((comment) => comment.id !== commentId));
      onDelete(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('للتو', 'just now');
    if (diffMins < 60) return t(`قبل ${diffMins} دقيقة`, `${diffMins}m ago`);
    if (diffHours < 24) return t(`قبل ${diffHours} ساعة`, `${diffHours}h ago`);
    if (diffDays < 30) return t(`قبل ${diffDays} يوم`, `${diffDays}d ago`);

    return date.toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US');
  };

  if (displayedComments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">💬</div>
        <p className="text-lg">{t('لم تقم بأي تعليقات بعد', 'No comments yet')}</p>
        <p className="text-sm mt-2">{t('شارك آرائك حول المقالات', 'Share your thoughts on articles')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {displayedComments.map((comment) => (
        <div
          key={comment.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
        >
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold dark:text-white mb-1">
                <a
                  href={`/article/${comment.articleId}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {comment.articleTitle}
                </a>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
                {comment.createdAt !== comment.updatedAt && (
                  <span className="ms-2">{t('(معدّل)', '(edited)')}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => handleDelete(comment.id)}
              disabled={isLoading}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900 transition-colors disabled:opacity-50"
              title={t('حذف التعليق', 'Delete comment')}
            >
              🗑️
            </button>
          </div>

          {/* Comment Content */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3">
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>

          {/* Comment Footer */}
          <div className="flex items-center gap-4">
            <a
              href={`/article/${comment.articleId}`}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('اذهب إلى المقالة', 'Go to article')} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
