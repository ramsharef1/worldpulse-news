'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Button, Grid, ArticleCard, Divider, Badge } from '@/components/UIComponents';
import { CATEGORIES, NAV_ITEMS, FOOTER_LINKS, PAGINATION } from '@/lib/constants';
import { getUniversityBySlug } from '@/lib/universities-data';

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
  readTime?: string;
  image?: string;
}

export default function UniversityDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const university = getUniversityBySlug(slug);

  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [displayedCount, setDisplayedCount] = useState(PAGINATION.ARTICLES_PER_PAGE);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    if (!university) {
      setIsLoading(false);
      return;
    }
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/articles?university=${encodeURIComponent(university.name_ar)}&limit=100`
        );
        const data = await response.json();
        if (data.success && data.articles) {
          setArticles(
            data.articles.map((article: Article) => ({
              ...article,
              readTime: calculateReadTime(article.excerpt),
            }))
          );
        } else {
          setError('Failed to load articles');
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const calculateReadTime = (text: string): string => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  // 404-style state for unknown slug
  if (!university) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('الجامعة غير موجودة', 'University Not Found')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('لم نتمكن من العثور على هذه الجامعة', 'We could not find this university')}
        </p>
        <Link href="/universities">
          <Button variant="primary" size="md">
            {t('العودة إلى الجامعات', 'Back to Universities')}
          </Button>
        </Link>
      </div>
    );
  }

  // Categories present in this university's articles
  const availableCategories = CATEGORIES.filter((cat) =>
    articles.some((a) => a.category === cat.name_en)
  );

  const filteredArticles =
    selectedCategory === 'all'
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  const sortedArticles = [...filteredArticles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const displayedArticles = sortedArticles.slice(0, displayedCount);
  const hasMore = displayedCount < sortedArticles.length;

  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  const universityName = t(university.name_ar, university.name_en);

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
          <Link href="/universities" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            {t('الجامعات', 'Universities')}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400">{universityName}</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* University Header */}
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">🏛️</div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {universityName}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-3">
                {t(university.name_en, university.name_ar)}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {t(university.description_ar, university.description_en)}
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                <Badge variant="primary">
                  📍 {t(university.city_ar, university.city_en)}
                </Badge>
                <Badge variant="info">
                  🗓️ {t('تأسست', 'Founded')} {university.founded}
                </Badge>
                <Badge variant="info">
                  {university.type === 'public' ? t('حكومية', 'Public') : t('خاصة', 'Private')}
                </Badge>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  🌐 {t('الموقع الرسمي', 'Official Website')}
                </a>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {articles.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('مقالة', 'Articles')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalViews.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('مشاهدة', 'Total Views')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {availableCategories.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('تصنيف', 'Categories')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {new Date().getFullYear() - university.founded}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('سنة من العطاء', 'Years of Excellence')}
              </div>
            </div>
          </div>

          <Divider />
        </div>

        {/* Category Filter Chips */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('أخبار الجامعة', 'University News')}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setDisplayedCount(PAGINATION.ARTICLES_PER_PAGE);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t('الكل', 'All')} ({articles.length})
            </button>
            {availableCategories.map((cat) => {
              const count = articles.filter((a) => a.category === cat.name_en).length;
              return (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setSelectedCategory(cat.name_en);
                    setDisplayedCount(PAGINATION.ARTICLES_PER_PAGE);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.name_en
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat.icon} {t(cat.name_ar, cat.name_en)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">{t('خطأ', 'Error')}</h3>
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        ) : displayedArticles.length > 0 ? (
          <>
            <Grid columns={1} gap="lg">
              {displayedArticles.map((article) => {
                const cat = CATEGORIES.find((c) => c.name_en === article.category);
                return (
                  <Link key={article.id} href={`/article/${article.id}`} className="block">
                    <ArticleCard
                      category={language === 'ar' ? cat?.name_ar || article.category : article.category}
                      title={language === 'ar' ? article.title : article.title_en}
                      excerpt={language === 'ar' ? article.excerpt : article.excerpt_en}
                      date={article.date}
                      university={article.university}
                      readTime={article.readTime}
                      image={article.image}
                    />
                  </Link>
                );
              })}
            </Grid>

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setDisplayedCount((prev) => prev + PAGINATION.ARTICLES_PER_PAGE)}
                  className="min-w-48"
                >
                  {t('تحميل المزيد', 'Load More')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedCategory === 'all'
                ? t('لا توجد مقالات من هذه الجامعة حالياً', 'No articles from this university yet')
                : t('لا توجد مقالات في هذا التصنيف', 'No articles found in this category')}
            </p>
            <Link href="/universities" className="inline-block mt-4">
              <Button variant="secondary" size="md">
                {t('العودة إلى الجامعات', 'Back to Universities')}
              </Button>
            </Link>
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
