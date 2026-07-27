'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewsPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">{t('أخبار الجامعات', 'University News')}</Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">{t('آخر الأخبار', 'Latest News')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('قريباً - الأخبار المفصلة', 'Coming Soon - Detailed news feed')}
        </p>
      </main>
    </div>
  );
}
