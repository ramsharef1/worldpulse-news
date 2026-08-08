'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { UserMenu } from '@/components/UserMenu';
import { useLanguage } from '@/lib/LanguageContext';
import { NAV_ITEMS } from '@/lib/constants';

export function SiteHeader() {
  const { language, setLanguage, darkMode, setDarkMode, t } = useLanguage();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="md" showText={true} language={language} />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={darkMode ? t('التبديل إلى الوضع النهاري', 'Switch to light mode') : t('التبديل إلى الوضع الليلي', 'Switch to dark mode')}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <UserMenu language={language} />
          </div>
        </div>
      </header>
      <nav aria-label={t('القائمة الرئيسية', 'Main navigation')} className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-6 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t(item.name_ar, item.name_en)}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
