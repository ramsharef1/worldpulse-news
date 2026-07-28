/**
 * Authentication Utilities
 * Helper functions for authentication, validation, and token management
 */

/**
 * Validates email format
 * @param email Email string to validate
 * @returns true if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * Requirements: minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 * @param password Password string to validate
 * @returns true if password meets minimum strength requirements
 */
export const isPasswordStrong = (password: string): boolean => {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLength && hasUpper && hasLower && hasNumber;
};

/**
 * Calculates password strength score (0-4)
 * @param password Password string to evaluate
 * @returns Strength score where 0=very weak, 4=very strong
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  return strength;
};

/**
 * Gets human-readable password strength label
 * @param strength Strength score (0-4)
 * @param language Language for label ('ar' or 'en')
 * @returns Translated strength label
 */
export const getStrengthLabel = (strength: number, language: 'ar' | 'en' = 'en'): string => {
  const labels = {
    ar: ['ضعيف جداً', 'ضعيف', 'متوسط', 'قوي', 'قوي جداً'],
    en: ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'],
  };
  return labels[language][strength] || labels[language][0];
};

/**
 * Gets color class for password strength indicator
 * @param strength Strength score (0-4)
 * @returns Tailwind color class
 */
export const getStrengthColor = (strength: number): string => {
  if (strength <= 1) return 'bg-red-500';
  if (strength === 2) return 'bg-yellow-500';
  if (strength === 3) return 'bg-blue-500';
  return 'bg-green-500';
};

/**
 * Parses JWT token (mock - for demo only)
 * In production, never decode JWT in client - trust the server
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const parseJWT = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if JWT token is expired
 * @param token JWT token string
 * @returns true if token is expired or invalid
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

/**
 * Validates name (non-empty, reasonable length)
 * @param name Name string to validate
 * @returns true if valid name
 */
export const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

/**
 * Sanitizes user input to prevent XSS
 * @param input User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generates a unique user ID
 * @returns Unique ID string
 */
export const generateUserId = (): string => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Validates form data before submission
 * @param data Form data object
 * @returns Object with isValid and errors
 */
export const validateSignupForm = (data: {
  name_ar: string;
  name_en: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name_ar.trim()) {
    errors.name_ar = 'Arabic name is required';
  }

  if (!data.name_en.trim()) {
    errors.name_en = 'English name is required';
  }

  if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!isPasswordStrong(data.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates login form data
 * @param data Form data object
 * @returns Object with isValid and errors
 */
export const validateLoginForm = (data: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Gets time remaining until token expiration
 * @param token JWT token string
 * @returns Time in milliseconds until expiration, or -1 if expired
 */
export const getTokenExpirationTime = (token: string): number => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return -1;

  const expirationTime = payload.exp * 1000;
  const timeRemaining = expirationTime - Date.now();

  return timeRemaining > 0 ? timeRemaining : -1;
};

/**
 * Formats time remaining in a human-readable format
 * @param milliseconds Time in milliseconds
 * @param language Language for format ('ar' or 'en')
 * @returns Formatted time string
 */
export const formatTimeRemaining = (milliseconds: number, language: 'ar' | 'en' = 'en'): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (language === 'ar') {
    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    if (minutes > 0) return `${minutes} دقيقة`;
    return `${seconds} ثانية`;
  } else {
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
};
