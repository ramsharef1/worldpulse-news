'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/UIComponents';
import { UNIVERSITIES_DATA } from '@/lib/universities-data';
import { useLanguage } from '@/lib/LanguageContext';

export default function UniversitiesPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

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
    <>
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
    </>
  );
}
