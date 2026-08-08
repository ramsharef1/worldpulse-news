'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { Button, Grid, ArticleCard, Divider, Badge } from '@/components/UIComponents';
import { CATEGORIES, PAGINATION } from '@/lib/constants';

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

type CategorySlug = 'academic' | 'student-life' | 'research' | 'sports' | 'admissions' | 'careers' | 'achievements';

// Map slug to category name
const slugToCategoryMap: Record<CategorySlug, string> = {
  'academic': 'Academic',
  'student-life': 'Student Life',
  'research': 'Research',
  'sports': 'Sports',
  'admissions': 'Admissions',
  'careers': 'Career & Jobs',
  'achievements': 'Achievements',
};

export default function CategoryNewsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const categorySlug = (params?.category as CategorySlug) || 'academic';

  const categoryName = slugToCategoryMap[categorySlug] || 'Academic';
  const category = CATEGORIES.find((c) => c.slug === categorySlug);

  // State management
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');

  // Filter state
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'most-viewed'>('newest');
  const [displayedCount, setDisplayedCount] = useState(PAGINATION.ARTICLES_PER_PAGE);

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [categoryName]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [articles, selectedUniversity, sortBy]);

  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/articles?category=${encodeURIComponent(categoryName)}&limit=100`);
      const data = await response.json();

      if (data.success && data.articles) {
        const enhancedArticles = data.articles.map((article: Article) => ({
          ...article,
          readTime: calculateReadTime(article.excerpt),
        }));
        setArticles(enhancedArticles);
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

  const applyFilters = () => {
    let filtered = [...articles];

    // University filter
    if (selectedUniversity !== 'all') {
      filtered = filtered.filter((a) => a.university.toLowerCase().includes(selectedUniversity.toLowerCase()));
    }

    // Sort
    if (sortBy === 'most-viewed') {
      filtered.sort((a, b) => b.views - a.views);
    } else {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setFilteredArticles(filtered);
    setDisplayedCount(PAGINATION.ARTICLES_PER_PAGE);
  };

  const calculateReadTime = (text: string): string => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + PAGINATION.ARTICLES_PER_PAGE);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!email || !email.includes('@')) {
        setSubscribeMessage(t('الرجاء إدخال بريد إلكتروني صحيح', 'Please enter a valid email'));
        setIsSubscribing(false);
        return;
      }

      setSubscribeMessage(t('شكراً لاشتراكك في نشرتنا الإخبارية', 'Thank you for subscribing!'));
      setEmail('');

      setTimeout(() => {
        setSubscribeMessage('');
      }, 5000);
    } catch (err) {
      setSubscribeMessage(t('حدث خطأ ما. الرجاء محاولة مرة أخرى', 'Something went wrong. Please try again.'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const getCategoryLabel = (): string => {
    return language === 'ar' ? category?.name_ar || categoryName : categoryName;
  };

  const displayedArticles = filteredArticles.slice(0, displayedCount);
  const hasMore = displayedCount < filteredArticles.length;
  const uniqueUniversities = Array.from(
    new Set(articles.map((a) => a.university))
  ).filter((u) => u).slice(0, 15);

  return (
    <>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            {t('الرئيسية', 'Home')}
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/news" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            {t('الأخبار', 'News')}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400">{getCategoryLabel()}</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Category Header */}
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{category?.icon}</div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {getCategoryLabel()}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {language === 'ar'
                  ? `استكشف أحدث المقالات والأخبار من تصنيف ${getCategoryLabel()}`
                  : `Explore the latest articles and news in the ${getCategoryLabel()} category`}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="primary">{filteredArticles.length} {t('مقالة', 'articles')}</Badge>
                {displayedCount < filteredArticles.length && (
                  <Badge variant="info">{t('تحميل المزيد', 'Load more available')}</Badge>
                )}
              </div>
            </div>
          </div>
          <Divider />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Sort Filter */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
                  {t('ترتيب حسب', 'Sort by')}
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="newest"
                      checked={sortBy === 'newest'}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'most-viewed')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('الأحدث', 'Newest')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="most-viewed"
                      checked={sortBy === 'most-viewed'}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'most-viewed')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('الأكثر مشاهدة', 'Most Viewed')}</span>
                  </label>
                </div>
              </div>

              {/* University Filter */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
                  {t('الجامعة', 'University')}
                </h3>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('جميع الجامعات', 'All Universities')}</option>
                  {uniqueUniversities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories Quick Links */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
                  {t('التصنيفات', 'Categories')}
                </h3>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/news/${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        categorySlug === cat.slug
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.icon} {language === 'ar' ? cat.name_ar : cat.name_en}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-6">
                {Array(6).fill(0).map((_, i) => (
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
                  {displayedArticles.map((article) => (
                    <Link key={article.id} href={`/article/${article.id}`} className="block">
                      <ArticleCard
                        category={language === 'ar' ? category?.name_ar || article.category : article.category}
                        title={language === 'ar' ? article.title : article.title_en}
                        excerpt={language === 'ar' ? article.excerpt : article.excerpt_en}
                        date={article.date}
                        university={article.university}
                        readTime={article.readTime}
                        image={article.image}
                      />
                    </Link>
                  ))}
                </Grid>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleLoadMore}
                      className="min-w-48"
                    >
                      {t('تحميل المزيد', 'Load More')}
                    </Button>
                  </div>
                )}

                {!hasMore && filteredArticles.length > PAGINATION.ARTICLES_PER_PAGE && (
                  <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                    {t('تم عرض جميع المقالات', 'All articles displayed')}
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('لا توجد مقالات في هذا التصنيف', 'No articles found in this category')}
                </p>
                <Link href="/news" className="inline-block mt-4">
                  <Button variant="secondary" size="md">
                    {t('العودة إلى جميع الأخبار', 'Back to All News')}
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>

        <Divider className="my-12" />

        {/* Newsletter CTA */}
        <section className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('اشترك في نشرتنا الإخبارية', 'Subscribe to our newsletter')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t(
                'احصل على أحدث أخبار من تصنيف ' + getCategoryLabel() + ' مباشرة في بريدك الإلكتروني',
                `Get the latest ${getCategoryLabel()} news delivered straight to your inbox`
              )}
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder={t('بريدك الإلكتروني', 'Your email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubscribing}
                aria-label="Email for newsletter"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubscribing}
                className="whitespace-nowrap"
              >
                {isSubscribing ? t('جاري...', 'Subscribing...') : t('اشترك', 'Subscribe')}
              </Button>
            </form>

            {subscribeMessage && (
              <div className={`mt-4 p-4 rounded-lg ${
                subscribeMessage.includes('شكراً') || subscribeMessage.includes('Thank you')
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  subscribeMessage.includes('شكراً') || subscribeMessage.includes('Thank you')
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  {subscribeMessage}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
