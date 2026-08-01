'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

interface Article {
  id: string;
  title: string;
  title_en: string;
  category: string;
  university: string;
  excerpt: string;
  excerpt_en: string;
  date: string;
  views: number;
  featured: boolean;
}

interface CategoryStat {
  category: string;
  count: number;
  totalViews: number;
}

interface UniversityStat {
  university: string;
  count: number;
  totalViews: number;
}

export default function StatsPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/articles?limit=100')
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // Compute stats
  const totalArticles = articles.length;
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const uniqueUniversities = new Set(articles.map((a) => a.university)).size;
  const uniqueCategories = new Set(articles.map((a) => a.category)).size;

  const categoryMap: Record<string, CategoryStat> = {};
  articles.forEach((a) => {
    if (!categoryMap[a.category]) {
      categoryMap[a.category] = { category: a.category, count: 0, totalViews: 0 };
    }
    categoryMap[a.category].count++;
    categoryMap[a.category].totalViews += a.views;
  });
  const categoryStats = Object.values(categoryMap).sort((a, b) => b.totalViews - a.totalViews);
  const maxCategoryViews = categoryStats[0]?.totalViews || 1;

  const universityMap: Record<string, UniversityStat> = {};
  articles.forEach((a) => {
    if (!universityMap[a.university]) {
      universityMap[a.university] = { university: a.university, count: 0, totalViews: 0 };
    }
    universityMap[a.university].count++;
    universityMap[a.university].totalViews += a.views;
  });
  const universityStats = Object.values(universityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mostViewed = articles.length
    ? [...articles].sort((a, b) => b.views - a.views)[0]
    : null;

  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Page title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📊 {t('إحصائيات المنصة', 'Platform Statistics')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('نظرة شاملة على محتوى ونشاط منصة صوت الجامعات', 'A comprehensive overview of platform content and activity')}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* Hero row */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label={t('إجمالي المقالات', 'Total Articles')}
                  value={totalArticles.toLocaleString()}
                  icon="📰"
                  color="blue"
                />
                <StatCard
                  label={t('إجمالي المشاهدات', 'Total Views')}
                  value={totalViews.toLocaleString()}
                  icon="👁"
                  color="teal"
                />
                <StatCard
                  label={t('الجامعات المغطاة', 'Universities Covered')}
                  value={uniqueUniversities.toLocaleString()}
                  icon="🏛️"
                  color="purple"
                />
                <StatCard
                  label={t('التصنيفات', 'Categories')}
                  value={uniqueCategories.toLocaleString()}
                  icon="🏷️"
                  color="orange"
                />
              </div>
            </section>

            {/* Views by category */}
            <section>
              <h2 className="text-xl font-bold mb-4">
                {t('المشاهدات حسب التصنيف', 'Views by Category')}
              </h2>
              <div className="space-y-3">
                {categoryStats.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {cat.category}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {cat.count} {t('مقال', 'articles')} · {cat.totalViews.toLocaleString()} {t('مشاهدة', 'views')}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-700"
                        style={{ width: `${(cat.totalViews / maxCategoryViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top universities */}
            <section>
              <h2 className="text-xl font-bold mb-4">
                {t('أفضل 10 جامعات بعدد المقالات', 'Top 10 Universities by Article Count')}
              </h2>
              <div className="space-y-2">
                {universityStats.map((uni, index) => (
                  <div
                    key={uni.university}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900"
                  >
                    <span className="text-lg font-black text-gray-300 dark:text-gray-600 w-8 text-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {uni.university}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      <span>
                        {uni.count} {t('مقال', 'art.')}
                      </span>
                      <span>
                        👁 {uni.totalViews.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Most viewed article */}
            {mostViewed && (
              <section>
                <h2 className="text-xl font-bold mb-4">
                  {t('أكثر مقال مشاهدة', 'Most Viewed Article')}
                </h2>
                <Link
                  href={`/article/${mostViewed.id}`}
                  className="group block rounded-2xl border-2 border-blue-700 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-5 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                        {mostViewed.university} · {mostViewed.category}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition mb-2">
                        {t(mostViewed.title, mostViewed.title_en)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {t(mostViewed.excerpt, mostViewed.excerpt_en)}
                      </p>
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
                        {mostViewed.views.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('مشاهدة', 'views')}
                      </p>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Most recent articles */}
            <section>
              <h2 className="text-xl font-bold mb-4">
                {t('أحدث المقالات', 'Most Recent Articles')}
              </h2>
              <div className="space-y-2">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:border-teal-400 dark:hover:border-teal-600 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition truncate">
                        {t(article.title, article.title_en)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {article.university}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {article.date}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        👁 {article.views.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: 'blue' | 'teal' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    teal: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400',
    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-medium opacity-75 mt-1">{label}</p>
    </div>
  );
}
