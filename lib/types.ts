// Type definitions for Universities-Voice

/**
 * Comment Interface for Article Comments
 * Supports nested replies and threaded discussions
 */
export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  replies: Comment[];
  parentCommentId?: string;
}

export interface UserComment {
  id: string;
  articleId: string;
  articleTitle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  bio?: string;
  university?: string;
  role: 'student' | 'faculty' | 'guest' | 'university_admin' | 'platform_admin';
  badges?: string[];
  savedArticles: string[]; // Array of article IDs
  comments: UserComment[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  role: 'student' | 'faculty' | 'guest' | 'university_admin' | 'platform_admin';
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  category: string;
  university: string;
  author: string;
  date: string;
  readTime?: string;
  featured: boolean;
}

export interface SavedArticle extends Article {
  savedAt: string;
}
