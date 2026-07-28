'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { BookmarksList } from '@/components/BookmarksList';
import { Button, Divider } from '@/components/UIComponents';
import { NAV_ITEMS, FOOTER_LINKS } from '@/lib/constants';

export default function BookmarksPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  // Update document language and theme
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  // Check authentication
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setIsAuthenticated(!!userId);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header language={language} setLanguage={setLanguage} darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
        <Navigation language={language} t={t} />
        <main className="container mx-auto px-4 py-12">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4 mb-8" />
          <div className="grid grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        <Header language={language} setLanguage={setLanguage} darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
        <Navigation language={language} t={t} />

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('يتطلب تسجيل دخول', 'Authentication Required')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t(
                'يجب تسجيل الدخول لعرض إشاراتك المرجعية المحفوظة',
                'Please log in to view your saved bookmarks'
              )}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="primary" size="lg">
                  {t('العودة إلى الرئيسية', 'Back to Home')}
                </Button>
              </Link>
              <Button variant="secondary" size="lg">
                {t('تسجيل الدخول', 'Sign In')}
              </Button>
            </div>
          </div>
        </main>

        <Footer language={language} t={t} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header language={language} setLanguage={setLanguage} darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
      <Navigation language={language} t={t} />

      <main className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 flex gap-2 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {t('الرئيسية', 'Home')}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('الإشارات المرجعية', 'Bookmarks')}
            </span>
          </nav>

          <Divider className="mb-8" />

          {/* Bookmarks List Component */}
          <BookmarksList language={language} />
        </div>
      </main>

      <Footer language={language} t={t} />
    </div>
  );
}

// Header Component
function Header({
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  t,
}: {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  t: (ar: string, en: string) => string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition">
          <Logo size="md" showText={true} language={language} />
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
            aria-label={t('تبديل اللغة', 'Toggle language')}
          >
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('تبديل الوضع المظلم', 'Toggle dark mode')}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}

// Navigation Component
function Navigation({ language, t }: { language: 'ar' | 'en'; t: (ar: string, en: string) => string }) {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-6 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-sm font-medium transition-colors"
            >
              {t(item.name_ar, item.name_en)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

// Footer Component
function Footer({ language, t }: { language: 'ar' | 'en'; t: (ar: string, en: string) => string }) {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('عن المنصة', 'About')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  'منصة أخبار شاملة لجميع الجامعات الأردنية',
                  'A comprehensive news platform for all Jordanian universities'
                )}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('الروابط السريعة', 'Quick Links')}
              </h3>
              <ul className="space-y-2 text-sm">
                {Object.values(FOOTER_LINKS).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t(link.name_ar, link.name_en)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Divider className="my-8" />

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              &copy; 2024 {t('صوت الجامعات', 'Universities-Voice')}. {t('جميع الحقوق محفوظة', 'All rights reserved')}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
