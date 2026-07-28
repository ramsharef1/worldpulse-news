'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';

interface HeaderProps {
  language: 'ar' | 'en';
  darkMode: boolean;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onDarkModeChange: (isDark: boolean) => void;
}

/**
 * Header Component
 * Reusable header with language toggle, dark mode, and user menu
 *
 * Usage:
 * <Header
 *   language={language}
 *   darkMode={darkMode}
 *   onLanguageChange={setLanguage}
 *   onDarkModeChange={setDarkMode}
 * />
 */
export function Header({
  language,
  darkMode,
  onLanguageChange,
  onDarkModeChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="hover:opacity-80 transition">
          <Logo size="md" showText={true} language={language} />
        </a>

        {/* Controls and User Menu */}
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            {language === 'ar' ? 'EN' : 'AR'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => onDarkModeChange(!darkMode)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={darkMode ? 'Switch to light mode' : 'التبديل إلى الوضع الليلي'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* User Menu or Login/Signup */}
          <UserMenu language={language} />
        </div>
      </div>
    </header>
  );
}

/**
 * Example usage in a page:
 * See any page component that uses Header for implementation examples
 */
