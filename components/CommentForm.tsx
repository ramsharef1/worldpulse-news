'use client';

import React, { useState } from 'react';
import { Button } from './UIComponents';

interface CommentFormProps {
  articleId: string;
  language: 'ar' | 'en';
  isAuthenticated: boolean;
  userName?: string;
  userId?: string;
  userAvatar?: string;
  onCommentSubmitted?: () => void;
  parentCommentId?: string;
  onCancel?: () => void;
  isReply?: boolean;
}

export function CommentForm({
  articleId,
  language,
  isAuthenticated,
  userName = 'Guest',
  userId = 'guest-' + Date.now(),
  userAvatar,
  onCommentSubmitted,
  parentCommentId,
  onCancel,
  isReply = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const MAX_CHARS = 500;
  const charCount = content.length;
  const remainingChars = MAX_CHARS - charCount;

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate
    if (!content.trim()) {
      setError(t('الرجاء إدخال تعليق', 'Please enter a comment'));
      return;
    }

    if (charCount > MAX_CHARS) {
      setError(t('تجاوز التعليق الحد الأقصى للأحرف', 'Comment exceeds maximum character limit'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          content: content.trim(),
          userName,
          userId,
          userAvatar,
          parentCommentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('فشل في إضافة التعليق', 'Failed to post comment'));
      }

      setSuccess(true);
      setContent('');
      onCommentSubmitted?.();

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('حدث خطأ ما', 'An error occurred');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not authenticated UI
  if (!isAuthenticated) {
    return (
      <div className={`p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${isReply ? 'mt-4' : ''}`}>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {t('يجب أن تكون مسجلاً لإضافة تعليق', 'Please sign in to add a comment')}
        </p>
        <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          {t('تسجيل الدخول', 'Sign In')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${isReply ? 'ml-8 mt-4 pt-4 border-l-2 border-gray-300 dark:border-gray-600 pl-4' : ''}`}
    >
      {/* User Info (for replies) */}
      {isReply && userName && (
        <div className="flex items-center gap-2 text-sm">
          {userAvatar && (
            <img
              src={userAvatar}
              alt={userName}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>
        </div>
      )}

      {/* Textarea */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t(
            'اكتب تعليقك هنا...',
            'Write your comment here...'
          )}
          className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            remainingChars < 50 && remainingChars >= 0 ? 'ring-2 ring-yellow-500' : ''
          } ${charCount > MAX_CHARS ? 'ring-2 ring-red-500' : ''}`}
          rows={3}
          disabled={isSubmitting}
          aria-label={t('نص التعليق', 'Comment text')}
        />
      </div>

      {/* Character Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className={`${
          charCount > MAX_CHARS
            ? 'text-red-600 dark:text-red-400 font-semibold'
            : remainingChars < 50
              ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
              : 'text-gray-500 dark:text-gray-400'
        }`}>
          {t('الأحرف المتبقية:', 'Characters remaining:')} {remainingChars}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            {t('تم إضافة التعليق بنجاح', 'Comment posted successfully!')}
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        {isReply && onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('إلغاء', 'Cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting || charCount === 0 || charCount > MAX_CHARS}
          className="whitespace-nowrap"
        >
          {isSubmitting
            ? t('جاري الإرسال...', 'Posting...')
            : isReply
              ? t('أرسل الرد', 'Post Reply')
              : t('أرسل التعليق', 'Post Comment')}
        </Button>
      </div>
    </form>
  );
}
