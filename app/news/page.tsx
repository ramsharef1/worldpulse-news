'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

interface Article {
  id: number | string;
  title?: string;
  title_ar?: string;
  title_en?: string;
  excerpt?: string;
  excerpt_ar?: string;
  excerpt_en?: string;
  category?: string;
  category_ar?: string;
  category_en?: string;
  university?: string;
  university_ar?: string;
  university_en?: string;
  views?: number;
  created_at?: string;
  published_at?: string;
  image_url?: string;
}

function ArticleSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/articles?limit=50');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : (data.articles ?? data.data ?? []));
      } catch {
        setError(language === 'ar' ? 'فشل تحميل المقالات' : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTitle = (a: Article) =>
    language === 'ar' ? (a.title_ar || a.title || '') : (a.title_en || a.title || '');
  const getExcerpt = (a: Article) =>
    language === 'ar' ? (a.excerpt_ar || a.excerpt || '') : (a.excerpt_en || a.excerpt || '');
  const getCategory = (a: Article) =>
    language === 'ar' ? (a.category_ar || a.category || '') : (a.category_en || a.category || '');
  const getUniversity = (a: Article) =>
    language === 'ar' ? (a.university_ar || a.university || '') : (a.university_en || a.university || '');

  const rawCategories = Array.from(
    new Set(articles.map(a => a.category || a.category_en || '').filter(Boolean))
  );
  const rawUniversities = Array.from(
    new Set(articles.map(a => a.university || a.university_en || '').filter(Boolean))
  );

  const filtered = articles
    .filter(a =>
      selectedCategory === 'all' ||
      a.category === selectedCategory ||
      a.category_en === selectedCategory
    )
    .filter(a =>
      selectedUniversity === 'all' ||
      a.university === selectedUniversity ||
      a.university_en === selectedUniversity
    )
    .sort((a, b) => {
      if (sortBy === 'views') return (b.views ?? 0) - (a.views ?? 0);
      const da = new Date(a.published_at || a.created_at || 0).getTime();
      const db = new Date(b.published_at || b.created_at || 0).getTime();
      return db - da;
    });

  const visible = filtered.slice(0, visibleCount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{t('آخر الأخبار الجامعية', 'Latest University News')}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t('تابع أحدث الأخبار من الجامعات الأردنية', 'Follow the latest news from Jordanian universities')}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 flex-1">
          <button
            onClick={() => { setSelectedCategory('all'); setVisibleCount(12); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              selectedCategory === 'all'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {t('الكل', 'All')}
          </button>
          {rawCategories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setVisibleCount(12); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                selectedCategory === cat
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* University dropdown */}
        <select
          value={selectedUniversity}
          onChange={e => { setSelectedUniversity(e.target.value); setVisibleCount(12); }}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="all">{t('كل الجامعات', 'All Universities')}</option>
          {rawUniversities.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {/* Sort buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{t('ترتيب:', 'Sort:')}</span>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              sortBy === 'latest'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'
            }`}
          >
            {t('الأحدث', 'Latest')}
          </button>
          <button
            onClick={() => setSortBy('views')}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              sortBy === 'views'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'
            }`}
          >
            {t('الأكثر مشاهدة', 'Most Viewed')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <ArticleSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">{t('لا توجد مقالات', 'No articles found')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map(article => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition"
              >
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={getTitle(article)}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-700 to-teal-500 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getCategory(article) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {getCategory(article)}
                      </span>
                    )}
                    {getUniversity(article) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                        {getUniversity(article)}
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 mb-1 leading-snug">
                    {getTitle(article)}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {getExcerpt(article)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>{formatDate(article.published_at || article.created_at)}</span>
                    {article.views != null && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {article.views.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setVisibleCount(v => v + 10)}
                className="px-8 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
              >
                {t('تحميل المزيد', 'Load More')}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-4">
            {t(
              `عرض ${visible.length} من ${filtered.length} مقال`,
              `Showing ${visible.length} of ${filtered.length} articles`
            )}
          </p>
        </>
      )}
    </main>
  );
}
