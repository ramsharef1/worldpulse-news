'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User interface matching the database schema
export interface AuthUser {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  profile_image?: string;
  role: 'guest' | 'student' | 'faculty' | 'university_admin' | 'platform_admin';
  language_preference: 'ar' | 'en';
  theme_preference: 'light' | 'dark' | 'auto';
}

// Auth Context type
export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (
    name_ar: string,
    name_en: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  updateProfile: (user: Partial<AuthUser>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Mock JWT token generator (for demo - replace with real backend)
  const generateMockJWT = (email: string): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      })
    );
    const signature = btoa('mock_signature_' + email + Date.now());
    return `${header}.${payload}.${signature}`;
  };

  // Validate password strength
  const isPasswordStrong = (password: string): boolean => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLength && hasUpper && hasLower && hasNumber;
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const signup = async (
    name_ar: string,
    name_en: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Validation
      if (!name_ar.trim() || !name_en.trim()) {
        throw new Error('Name is required');
      }

      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!isPasswordStrong(password)) {
        throw new Error(
          'Password must be at least 8 characters with uppercase, lowercase, and numbers'
        );
      }

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
      if (existingUsers[email]) {
        throw new Error('Email already registered');
      }

      // Create new user
      const newUser: AuthUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name_ar,
        name_en,
        email,
        role: 'student',
        language_preference: 'ar',
        theme_preference: 'auto',
      };

      // Store user (mock - in real app, send to backend)
      existingUsers[email] = {
        ...newUser,
        password_hash: btoa(password), // Mock hash - never do this in production
      };

      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Generate mock token
      const newToken = generateMockJWT(email);

      // Save to localStorage
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Validation
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // Get user from storage
      const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const storedUser = existingUsers[email];

      if (!storedUser) {
        throw new Error('Email not found');
      }

      // Verify password (mock - in real app, backend should handle this)
      if (btoa(password) !== storedUser.password_hash) {
        throw new Error('Invalid password');
      }

      // Generate token
      const newToken = generateMockJWT(email);

      // Extract user data (exclude password hash)
      const { password_hash, ...userData } = storedUser;
      const loginUser: AuthUser = userData;

      // Save to localStorage
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(loginUser));

      if (rememberMe) {
        localStorage.setItem('remember_me', email);
      }

      setToken(newToken);
      setUser(loginUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('remember_me');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    updateUser(updates);
  };

  const deleteAccount = async () => {
    if (user) {
      localStorage.removeItem(`profile_${user.id}`);
    }
    logout();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
    token,
    login,
    signup,
    logout,
    updateUser,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
