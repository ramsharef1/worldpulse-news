export const dynamic = 'force-dynamic';
export const revalidate = 0;

'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES, NAV_ITEMS, FOOTER_LINKS } from '@/lib/constants';
import { Logo } from '@/components/Logo';

export default function Home() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  const fetchFeaturedArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/articles?featured=true&limit=6');
      const data = await response.json();
      setFeaturedArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="hover:opacity-80 transition flex items-center gap-2">
            <span className="text-xs bg-yellow-400 px-2 py-1 rounded">LOGO</span>
            <Logo size="md" showText={true} />
          </a>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-sm font-medium"
              >
                {t(item.name_ar, item.name_en)}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold mb-4">
              {t('أخبار الجامعات الأردنية', 'Jordanian University News')}
            </h2>
            <p className="text-lg opacity-90 mb-6">
              {t(
                'تابع أحدث الأخبار من جميع الجامعات الأردنية',
                'Stay updated with news from all Jordanian universities'
              )}
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={t('ابحث عن الأخبار...', 'Search news...')}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
                {t('بحث', 'Search')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8">{t('التصنيفات', 'Categories')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`/news?category=${cat.slug}`}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 transition text-center"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="text-sm font-medium">{language === 'ar' ? cat.name_ar : cat.name_en}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8">{t('المقالات المميزة', 'Featured Articles')}</h3>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">{t('جاري التحميل...', 'Loading...')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition"
                >
                  <div className="h-40 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  <div className="p-4">
                    <p className="text-sm text-blue-600 font-semibold mb-2">{t('أكاديمي', 'Academic')}</p>
                    <h4 className="font-bold mb-2">{t('عنوان المقالة', 'Article Title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('ملخص المقالة يظهر هنا', 'Article summary appears here')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Universities */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8">{t('الجامعات', 'Universities')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['UoJ', 'JUST', 'HU', 'YU', 'BAU', 'MU', 'AAAU', 'MEU'].map((uni, idx) => (
              <a
                key={idx}
                href={`/universities/${idx}`}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 transition text-center"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-blue-600">
                  {uni}
                </div>
                <p className="text-xs font-medium">{uni}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">{t('كن جزءاً من المجتمع', 'Join Our Community')}</h3>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
            {t('التسجيل الآن', 'Sign Up Now')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 Universities-Voice. {t('جميع الحقوق محفوظة', 'All rights reserved')}.</p>
        </div>
      </footer>
    </>
  );
}
