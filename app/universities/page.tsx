'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UNIVERSITIES } from '@/lib/constants';

export default function UniversitiesPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">{t('الجامعات', 'Universities')}</Link>
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
        <h1 className="text-4xl font-bold mb-8">{t('الجامعات الأردنية', 'Jordanian Universities')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {UNIVERSITIES.map((uni, idx) => (
            <div key={idx} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-bold mb-2">{uni}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('اضغط لعرض الأخبار', 'Click to view news')}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
