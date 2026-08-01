'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

interface TrendingArticle {
  id: string;
  title: string;
  title_en: string;
  category: string;
  university: string;
  excerpt: string;
  excerpt_en: string;
  date: string;
  views: number;
  trendingScore: number;
}

export default function TrendingPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [articles, setArticles] = useState<TrendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/trending?limit=20')
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.trending || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const categories = ['all', ...Array.from(new Set(articles.map((a) => a.category)))];

  const filtered =
    activeCategory === 'all' ? articles : articles.filter((a) => a.category === activeCategory);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const categoryLabel = (cat: string) =>
    cat === 'all' ? t('الكل', 'All') : cat;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="md" showText={true} language={language} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-blue-700 dark:text-blue-400 hover:underline font-medium"
            >
              {t('الرئيسية', 'Home')}
            </Link>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition text-sm"
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🔥 {t('الأخبار الرائجة', 'Trending News')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('مرتبة حسب معدل المشاهدات مقارنةً بعمر المقال', 'Ranked by views relative to article age')}
          </p>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                activeCategory === cat
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-medium">{t('لا توجد نتائج', 'No results found')}</p>
          </div>
        )}

        {/* Top 3 hot cards */}
        {!loading && top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {top3.map((article, index) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group relative block rounded-2xl border-2 border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-5 hover:shadow-lg transition"
              >
                {/* Rank badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-orange-500">#{index + 1}</span>
                  <span className="text-lg">🔥</span>
                </div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition line-clamp-2">
                  {t(article.title, article.title_en)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {t(article.excerpt, article.excerpt_en)}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 text-xs font-medium">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>👁 {article.views.toLocaleString()}</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {article.trendingScore.toFixed(1)} {t('نقطة', 'pts')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                  {article.university}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Ranked list #4 onwards */}
        {!loading && rest.length > 0 && (
          <div className="space-y-3">
            {rest.map((article, index) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-5 py-4 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow transition"
              >
                <span className="text-2xl font-black text-gray-300 dark:text-gray-600 w-10 shrink-0 text-center pt-0.5">
                  #{index + 4}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition text-sm leading-snug mb-1 line-clamp-2">
                    {t(article.title, article.title_en)}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-2">
                    {article.university}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 text-xs font-medium">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      👁 {article.views.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {article.trendingScore.toFixed(1)} {t('نقطة', 'pts')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
