/**
 * Authentication Hooks for Comments System
 * Use these hooks to integrate comments with your authentication system
 */

import { useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'guest' | 'student' | 'faculty' | 'admin';
}

/**
 * Mock hook for demonstration
 * Replace with your actual authentication provider
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user from your auth system
    const fetchUser = async () => {
      try {
        // Example implementation - replace with your auth
        // const response = await fetch('/api/auth/user');
        // const data = await response.json();
        // if (data.user) {
        //   setUser(data.user);
        // }

        setUser(null); // Default: not authenticated
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isLoading, error };
}

/**
 * Hook to check if user can moderate comments
 */
export function useCanModerate(user: AuthUser | null): boolean {
  return !!user && (user.role === 'faculty' || user.role === 'admin');
}

/**
 * Hook to check if user owns a comment
 */
export function useOwnsComment(comment: { userId: string }, user: AuthUser | null): boolean {
  return !!user && user.id === comment.userId;
}

/**
 * Hook for user session
 * Integrate with your authentication library (NextAuth, Clerk, etc.)
 */
export function useSession() {
  const [session, setSession] = useState<{ user: AuthUser } | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Example with NextAuth:
        // const sessionResponse = await fetch('/api/auth/session');
        // const sessionData = await sessionResponse.json();
        // if (sessionData.user) {
        //   setSession({ user: sessionData.user });
        //   setStatus('authenticated');
        // } else {
        //   setStatus('unauthenticated');
        // }

        setStatus('unauthenticated'); // Default
      } catch (error) {
        console.error('Session check failed:', error);
        setStatus('unauthenticated');
      }
    };

    checkSession();
  }, []);

  return { data: session, status };
}

/**
 * Hook for comment mutations
 */
export function useCommentMutations(articleId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = useCallback(
    async (content: string, userName: string, userId: string, userAvatar?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId,
            content,
            userName,
            userId,
            userAvatar,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add comment');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [articleId]
  );

  const deleteComment = useCallback(
    async (commentId: string, userId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/comments?id=${commentId}&userId=${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete comment');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    addComment,
    deleteComment,
    isLoading,
    error,
  };
}

/**
 * Hook for fetching comments
 */
export function useComments(articleId: string) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments?articleId=${articleId}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
      } else {
        throw new Error(data.error || 'Failed to fetch comments');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { comments, isLoading, error, refetch };
}
