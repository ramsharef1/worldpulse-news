'use client';

/**
 * EXAMPLE: How to Integrate Comments with Authentication
 *
 * This file shows the recommended way to integrate the Comments component
 * with a real authentication system. Replace the mock auth with your actual
 * authentication provider (NextAuth, Clerk, Firebase, etc.)
 */

import { useState, useEffect } from 'react';
import { Comments } from './Comments';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CommentsWithAuthProps {
  articleId: string;
  language: 'ar' | 'en';
}

export function CommentsWithAuth({ articleId, language }: CommentsWithAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Example: Fetch current user from auth system
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Replace this with your actual auth check
        // Example with NextAuth:
        // const session = await getSession();
        // if (session?.user) {
        //   setUser({
        //     id: session.user.id,
        //     name: session.user.name,
        //     email: session.user.email,
        //     avatar: session.user.image,
        //   });
        // }

        // For demo purposes, comment is not authenticated
        setUser(null);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <Comments
      articleId={articleId}
      language={language}
      isAuthenticated={!!user}
      userName={user?.name || 'Guest User'}
      userId={user?.id || 'guest-' + Date.now()}
      userAvatar={user?.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`}
    />
  );
}

/**
 * INTEGRATION EXAMPLES:
 *
 * 1. WITH NEXTAUTH (RECOMMENDED):
 * ================================
 * import { useSession } from 'next-auth/react';
 *
 * export function CommentsWithNextAuth({ articleId, language }) {
 *   const { data: session } = useSession();
 *
 *   return (
 *     <Comments
 *       articleId={articleId}
 *       language={language}
 *       isAuthenticated={!!session}
 *       userName={session?.user?.name}
 *       userId={session?.user?.id}
 *       userAvatar={session?.user?.image}
 *     />
 *   );
 * }
 *
 *
 * 2. WITH CLERK:
 * ==============
 * import { useAuth, useUser } from '@clerk/nextjs';
 *
 * export function CommentsWithClerk({ articleId, language }) {
 *   const { isSignedIn, userId } = useAuth();
 *   const { user } = useUser();
 *
 *   return (
 *     <Comments
 *       articleId={articleId}
 *       language={language}
 *       isAuthenticated={isSignedIn}
 *       userName={user?.fullName}
 *       userId={userId}
 *       userAvatar={user?.profileImageUrl}
 *     />
 *   );
 * }
 *
 *
 * 3. WITH FIREBASE:
 * =================
 * import { useAuthState } from 'react-firebase-hooks/auth';
 * import { auth } from '@/lib/firebase';
 *
 * export function CommentsWithFirebase({ articleId, language }) {
 *   const [user] = useAuthState(auth);
 *
 *   return (
 *     <Comments
 *       articleId={articleId}
 *       language={language}
 *       isAuthenticated={!!user}
 *       userName={user?.displayName}
 *       userId={user?.uid}
 *       userAvatar={user?.photoURL}
 *     />
 *   );
 * }
 */
