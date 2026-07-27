'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function JobsPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <div>
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">{t('الوظائف', 'Jobs')}</Link>
          <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="px-3 py-2 rounded-lg border">
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">{t('فرص العمل', 'Job Opportunities')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('قريباً - قائمة الوظائف الشاغرة', 'Coming Soon - Job listings')}
        </p>
      </main>
    </div>
  );
}
