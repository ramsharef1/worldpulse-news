'use client';

import React, { useState, useEffect } from 'react';
import { CommentForm } from './CommentForm';
import { Divider } from './UIComponents';

interface CommentData {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  replies: CommentData[];
}

interface CommentsProps {
  articleId: string;
  language: 'ar' | 'en';
  isAuthenticated: boolean;
  userName?: string;
  userId?: string;
  userAvatar?: string;
}

export function Comments({
  articleId,
  language,
  isAuthenticated,
  userName = 'Guest',
  userId = 'guest-' + Date.now(),
  userAvatar,
}: CommentsProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/comments?articleId=${articleId}`);
        const data = await response.json();

        if (data.success) {
          setComments(data.comments);
        } else {
          setError(data.error || t('فشل في تحميل التعليقات', 'Failed to load comments'));
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError(t('حدث خطأ ما', 'An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [articleId, t]);

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string, ownerId: string) => {
    if (!window.confirm(t('هل تريد حقاً حذف هذا التعليق؟', 'Are you sure you want to delete this comment?'))) {
      return;
    }

    try {
      const response = await fetch(`/api/comments?id=${commentId}&userId=${ownerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove comment from state
        setComments((prev) =>
          prev.filter((c) => {
            if (c.id === commentId) return false;
            if (c.replies.length > 0) {
              c.replies = c.replies.filter((r) => r.id !== commentId);
            }
            return true;
          })
        );
      } else {
        alert(data.error || t('فشل في حذف التعليق', 'Failed to delete comment'));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(t('حدث خطأ ما', 'An error occurred'));
    }
  };

  // Handle new comment added
  const handleCommentAdded = async () => {
    const response = await fetch(`/api/comments?articleId=${articleId}`);
    const data = await response.json();
    if (data.success) {
      setComments(data.comments);
      setReplyingTo(null);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('الآن', 'now');
    if (diffMins < 60) return t(`قبل ${diffMins} دقيقة`, `${diffMins}m ago`);
    if (diffHours < 24) return t(`قبل ${diffHours} ساعة`, `${diffHours}h ago`);
    if (diffDays < 7) return t(`قبل ${diffDays} يوم`, `${diffDays}d ago`);

    return date.toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US');
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <section className={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Section Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('التعليقات', 'Comments')} ({comments.length})
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('شارك رأيك وآرائك مع المجتمع', 'Share your thoughts and feedback with the community')}
        </p>
      </div>

      <Divider className="mb-8" />

      {/* Comment Form */}
      {isAuthenticated ? (
        <div className="mb-8">
          <CommentForm
            articleId={articleId}
            language={language}
            isAuthenticated={isAuthenticated}
            userName={userName}
            userId={userId}
            userAvatar={userAvatar}
            onCommentSubmitted={handleCommentAdded}
          />
        </div>
      ) : (
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {t('يجب أن تكون مسجلاً لإضافة تعليق', 'Please sign in to add a comment')}
          </p>
          <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {t('تسجيل الدخول', 'Sign In')}
          </button>
        </div>
      )}

      <Divider className="mb-8" />

      {/* Sort Controls */}
      {comments.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('إظهار التعليقات:', 'Showing')} {comments.length} {t('تعليق', 'comments')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder('newest')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortOrder === 'newest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('الأحدث أولاً', 'Newest')}
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortOrder === 'oldest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('الأقدم أولاً', 'Oldest')}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && comments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('لا توجد تعليقات حتى الآن', 'No comments yet')}
          </p>
          {isAuthenticated && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('كن أول من يعلق على هذه المقالة', 'Be the first to comment on this article')}
            </p>
          )}
        </div>
      )}

      {/* Comments List */}
      {!isLoading && !error && comments.length > 0 && (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              language={language}
              isAuthenticated={isAuthenticated}
              currentUserId={userId}
              onDelete={handleDeleteComment}
              onReply={() => setReplyingTo(comment.id)}
              isReplying={replyingTo === comment.id}
              onReplySubmitted={handleCommentAdded}
              onCancelReply={() => setReplyingTo(null)}
              currentUserName={userName}
              currentUserAvatar={userAvatar}
              formatTime={formatTime}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Single Comment Thread Component
function CommentThread({
  comment,
  language,
  isAuthenticated,
  currentUserId,
  onDelete,
  onReply,
  isReplying,
  onReplySubmitted,
  onCancelReply,
  currentUserName,
  currentUserAvatar,
  formatTime,
  t,
}: any) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6">
      {/* Main Comment */}
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={comment.userAvatar}
            alt={comment.userName}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {comment.userName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTime(comment.timestamp)}
              </p>
            </div>

            {/* Delete Button */}
            {isAuthenticated && currentUserId === comment.userId && (
              <button
                onClick={() => onDelete(comment.id, comment.userId)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                aria-label={t('حذف التعليق', 'Delete comment')}
                title={t('حذف التعليق', 'Delete comment')}
              >
                🗑️
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-gray-700 dark:text-gray-300 mb-4 break-words">
            {comment.content}
          </p>

          {/* Reply Button */}
          {isAuthenticated && (
            <button
              onClick={onReply}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('رد', 'Reply')}
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && isAuthenticated && (
        <CommentForm
          articleId={comment.articleId}
          language={language}
          isAuthenticated={isAuthenticated}
          userName={currentUserName}
          userId={currentUserId}
          userAvatar={currentUserAvatar}
          parentCommentId={comment.id}
          onCommentSubmitted={onReplySubmitted}
          onCancel={onCancelReply}
          isReply={true}
        />
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-6 space-y-4">
          {comment.replies.map((reply: any) => (
            <div key={reply.id} className="flex gap-4">
              {/* Reply Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={reply.userAvatar}
                  alt={reply.userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>

              {/* Reply Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {reply.userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(reply.timestamp)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  {isAuthenticated && currentUserId === reply.userId && (
                    <button
                      onClick={() => onDelete(reply.id, reply.userId)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      aria-label={t('حذف الرد', 'Delete reply')}
                      title={t('حذف الرد', 'Delete reply')}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
