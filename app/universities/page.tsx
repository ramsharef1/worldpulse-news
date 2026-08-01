'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Badge, Divider } from '@/components/UIComponents';
import { NAV_ITEMS, FOOTER_LINKS } from '@/lib/constants';
import { UNIVERSITIES_DATA } from '@/lib/universities-data';

export default function UniversitiesPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const query = search.trim().toLowerCase();
  const filteredUniversities = UNIVERSITIES_DATA.filter(
    (uni) =>
      !query ||
      uni.name_ar.toLowerCase().includes(query) ||
      uni.name_en.toLowerCase().includes(query) ||
      uni.city_ar.toLowerCase().includes(query) ||
      uni.city_en.toLowerCase().includes(query)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="md" showText={true} language={language} />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition"
              aria-label={t('تبديل اللغة', 'Toggle language')}
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label={t('تبديل الوضع المظلم', 'Toggle dark mode')}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
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

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            {t('الرئيسية', 'Home')}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400">{t('الجامعات', 'Universities')}</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('الجامعات الأردنية', 'Jordanian Universities')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          {t(
            'استكشف أخبار وأحداث الجامعات الأردنية الحكومية والخاصة',
            'Explore news and events from public and private Jordanian universities'
          )}
        </p>

        {/* Search Box */}
        <div className="mb-8 max-w-xl">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ابحث عن جامعة...', 'Search for a university...')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('البحث عن جامعة', 'Search universities')}
          />
        </div>

        {filteredUniversities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniversities.map((uni) => (
              <Link
                key={uni.slug}
                href={`/universities/${uni.slug}`}
                className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t(uni.name_ar, uni.name_en)}
                  </h3>
                  <Badge variant={uni.type === 'public' ? 'primary' : 'info'}>
                    {uni.type === 'public' ? t('حكومية', 'Public') : t('خاصة', 'Private')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                  {t(uni.name_en, uni.name_ar)}
                </p>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>📍 {t(uni.city_ar, uni.city_en)}</span>
                  <span>🗓️ {uni.founded}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                  {t('عرض الأخبار ←', 'View news →')}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('لا توجد نتائج مطابقة لبحثك', 'No universities match your search')}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
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
    </div>
  );
}
