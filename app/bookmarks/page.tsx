'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookmarksList } from '@/components/BookmarksList';
import { Button, Divider } from '@/components/UIComponents';
import { useLanguage } from '@/lib/LanguageContext';

export default function BookmarksPage() {
  const { language, t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setIsAuthenticated(!!userId);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4 mb-8" />
        <div className="grid grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
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
    );
  }

  return (
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
  );
}
