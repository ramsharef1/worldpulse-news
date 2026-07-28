'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface UserMenuProps {
  language: 'ar' | 'en';
}

/**
 * UserMenu Component
 * Displays user avatar/name and dropdown menu with profile/logout options
 * Shows login/signup links if not authenticated
 */
export function UserMenu({ language }: UserMenuProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Translation function
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex gap-2">
        <a
          href="/auth/login"
          className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg font-medium"
        >
          {t('تسجيل الدخول', 'Login')}
        </a>
        <a
          href="/auth/signup"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          {t('تسجيل', 'Sign Up')}
        </a>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
          {user.name_en[0].toUpperCase()}
        </div>

        {/* User Name */}
        <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:inline">
          {language === 'ar' ? user.name_ar : user.name_en}
        </span>

        {/* Dropdown Arrow */}
        <span className={`text-gray-600 dark:text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {language === 'ar' ? user.name_ar : user.name_en}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <a
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          >
            {t('الملف الشخصي', 'Profile')}
          </a>

          <a
            href="#settings"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
            className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          >
            {t('الإعدادات', 'Settings')}
          </a>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm border-t border-gray-200 dark:border-gray-800"
          >
            {t('تسجيل الخروج', 'Logout')}
          </button>
        </div>
      )}
    </div>
  );
}
