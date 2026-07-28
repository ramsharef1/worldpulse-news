'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Button, Badge, Grid, Card, ArticleCard, Divider } from '@/components/UIComponents';
import { CATEGORIES, NAV_ITEMS, FOOTER_LINKS } from '@/lib/constants';

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
  author?: string;
  content?: string;
  content_en?: string;
  readTime?: string;
  image?: string;
}

interface ShareMetadata {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params?.id as string;

  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Update document language and theme
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  // Fetch article data
  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/articles?limit=100');
        const data = await response.json();

        if (data.success && data.articles) {
          const foundArticle = data.articles.find((a: Article) => a.id === articleId);

          if (!foundArticle) {
            setError('Article not found');
            setArticle(null);
            return;
          }

          // Enhance article with additional fields
          const enhancedArticle: Article = {
            ...foundArticle,
            readTime: calculateReadTime(foundArticle.excerpt),
            content: foundArticle.excerpt,
            content_en: foundArticle.excerpt_en,
          };

          setArticle(enhancedArticle);

          // Fetch related articles (same category)
          fetchRelatedArticles(foundArticle.category, foundArticle.id);
        } else {
          setError('Failed to load article');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchRelatedArticles = async (category: string, excludeId: string) => {
    try {
      const response = await fetch(`/api/articles?category=${encodeURIComponent(category)}&limit=6`);
      const data = await response.json();

      if (data.success && data.articles) {
        const related = data.articles
          .filter((a: Article) => a.id !== excludeId)
          .slice(0, 3)
          .map((a: Article) => ({
            ...a,
            readTime: calculateReadTime(a.excerpt),
          }));
        setRelatedArticles(related);
      }
    } catch (err) {
      console.error('Error fetching related articles:', err);
    }
  };

  const calculateReadTime = (text: string): string => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!email || !email.includes('@')) {
        setShareMessage(t('الرجاء إدخال بريد إلكتروني صحيح', 'Please enter a valid email'));
        setIsSubscribing(false);
        return;
      }

      setEmailSubscribed(true);
      setShareMessage(t('شكراً لاشتراكك في نشرتنا الإخبارية', 'Thank you for subscribing to our newsletter!'));
      setEmail('');

      setTimeout(() => {
        setShareMessage('');
        setEmailSubscribed(false);
      }, 5000);
    } catch (err) {
      setShareMessage(t('حدث خطأ ما. الرجاء محاولة مرة أخرى', 'Something went wrong. Please try again.'));
      setIsSubscribing(false);
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    if (!article) return;

    const shareData: ShareMetadata = {
      title: language === 'ar' ? article.title : article.title_en,
      description: language === 'ar' ? article.excerpt : article.excerpt_en,
      url: typeof window !== 'undefined' ? window.location.href : '',
      image: article.image,
    };

    try {
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
            '_blank'
          );
          break;
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`,
            '_blank'
          );
          break;
        case 'copy':
          await navigator.clipboard.writeText(shareData.url);
          setShareMessage(t('تم نسخ الرابط', 'Link copied to clipboard!'));
          setTimeout(() => setShareMessage(''), 3000);
          break;
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = CATEGORIES.find((c) => c.name_en === categoryName);
    return category?.color || '#1E40AF';
  };

  const getCategoryLabel = (categoryName: string): string => {
    const category = CATEGORIES.find((c) => c.name_en === categoryName);
    return language === 'ar' ? category?.name_ar || categoryName : categoryName;
  };

  const t = (ar: string, en: string): string => (language === 'ar' ? ar : en);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header language={language} setLanguage={setLanguage} darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
        <Navigation language={language} t={t} />

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state - 404
  if (error || !article) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        <Header language={language} setLanguage={setLanguage} darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
        <Navigation language={language} t={t} />

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('المقالة غير موجودة', 'Article Not Found')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t('للأسف، لم تتمكن من العثور على المقالة التي تبحث عنها', 'Sorry, we could not find the article you are looking for.')}
            </p>
            <Link href="/news">
              <Button variant="primary" size="lg">
                {t('العودة إلى الأخبار', 'Back to News')}
              </Button>
            </Link>
          </div>
        </main>

        <Footer language={language} t={t} />
      </div>
    );
  }

  return (
    <>
      {/* Meta tags for SEO */}
      <head>
        <title>
          {language === 'ar' ? article.title : article.title_en} | Universities-Voice
        </title>
        <meta name="description" content={language === 'ar' ? article.excerpt : article.excerpt_en} />
        <meta name="keywords" content={`${article.category}, ${article.university}, أخبار جامعات`} />
        <meta property="og:title" content={language === 'ar' ? article.title : article.title_en} />
        <meta property="og:description" content={language === 'ar' ? article.excerpt : article.excerpt_en} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        {article.image && <meta property="og:image" content={article.image} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={language === 'ar' ? article.title : article.title_en} />
        <meta name="twitter:description" content={language === 'ar' ? article.excerpt : article.excerpt_en} />
        {article.image && <meta name="twitter:image" content={article.image} />}
      </head>

      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Header language={language} setLanguage={setLanguage} darkMode={darkMode} setDarkMode={setDarkMode} t={t} />
        <Navigation language={language} t={t} />

        {/* Article Content */}
        <article className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6 flex gap-2 text-sm" aria-label="Breadcrumb">
              <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t('الرئيسية', 'Home')}
              </Link>
              <span className="text-gray-400">/</span>
              <Link href="/news" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t('الأخبار', 'News')}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 dark:text-gray-400">{getCategoryLabel(article.category)}</span>
            </nav>

            {/* Category Badge */}
            <div className="mb-6">
              <Badge variant="primary" className="inline-block">
                {getCategoryLabel(article.category)}
              </Badge>
            </div>

            {/* Title - Bilingual */}
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                {language === 'ar' ? article.title : article.title_en}
              </h1>

              {/* Metadata */}
              <div className="flex flex-col gap-4 text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('الجامعة:', 'University:')}</span>
                    <span>{article.university}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-2">
                    <span>{article.date}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-2">
                    <span>{article.readTime || '3 min read'}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-2">
                    <span>{article.views.toLocaleString()} {t('مشاهدة', 'views')}</span>
                  </div>
                </div>
              </div>

              <Divider />
            </header>

            {/* Featured Image */}
            {article.image && (
              <div className="mb-12 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={article.image}
                  alt={language === 'ar' ? article.title : article.title_en}
                  className="w-full h-96 object-cover"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
                {language === 'ar' ? article.content || article.excerpt : article.content_en || article.excerpt_en}
              </p>

              {/* Featured badge */}
              {article.featured && (
                <div className="my-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    ⭐ {t('هذه المقالة مميزة', 'This is a featured article')}
                  </p>
                </div>
              )}
            </div>

            {/* Author info (if available) */}
            {article.author && (
              <div className="mb-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{article.author}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('مساهم', 'Contributor')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Divider className="my-12" />

            {/* Share Section */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('شارك هذه المقالة', 'Share this article')}
              </h3>

              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  aria-label="Share on Twitter"
                  className="flex items-center gap-2"
                >
                  𝕏
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShare('facebook')}
                  aria-label="Share on Facebook"
                  className="flex items-center gap-2"
                >
                  f
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShare('linkedin')}
                  aria-label="Share on LinkedIn"
                  className="flex items-center gap-2"
                >
                  in
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShare('copy')}
                  aria-label="Copy link"
                  className="flex items-center gap-2"
                >
                  {t('نسخ', 'Copy')}
                </Button>
              </div>

              {shareMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">{shareMessage}</p>
                </div>
              )}
            </div>

            <Divider className="my-12" />

            {/* Newsletter Signup CTA */}
            <div className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('اشترك في نشرتنا الإخبارية', 'Subscribe to our newsletter')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('احصل على أحدث الأخبار من الجامعات مباشرة في بريدك الإلكتروني', 'Get the latest university news delivered straight to your inbox')}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
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
            </div>

            <Divider className="my-12" />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                  {t('مقالات ذات صلة', 'Related articles')}
                </h2>

                <Grid columns={3} gap="lg">
                  {relatedArticles.map((relatedArticle) => (
                    <Link key={relatedArticle.id} href={`/article/${relatedArticle.id}`}>
                      <ArticleCard
                        category={getCategoryLabel(relatedArticle.category)}
                        title={language === 'ar' ? relatedArticle.title : relatedArticle.title_en}
                        excerpt={language === 'ar' ? relatedArticle.excerpt : relatedArticle.excerpt_en}
                        date={relatedArticle.date}
                        university={relatedArticle.university}
                        readTime={relatedArticle.readTime}
                        image={relatedArticle.image}
                      />
                    </Link>
                  ))}
                </Grid>

                <div className="mt-8 text-center">
                  <Link href={`/news?category=${encodeURIComponent(article.category)}`}>
                    <span className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline font-medium cursor-pointer inline-block">
                      {t('اعرض جميع مقالات', 'View all')} {getCategoryLabel(article.category)}
                    </span>
                  </Link>
                </div>
              </section>
            )}
          </div>
        </article>

        <Footer language={language} t={t} />
      </div>
    </>
  );
}

// Header Component
function Header({
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  t,
}: {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  t: (ar: string, en: string) => string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition">
          <Logo size="md" showText={true} language={language} />
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
            aria-label={t('تبديل اللغة', 'Toggle language')}
          >
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('تبديل الوضع المظلم', 'Toggle dark mode')}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}

// Navigation Component
function Navigation({ language, t }: { language: 'ar' | 'en'; t: (ar: string, en: string) => string }) {
  return (
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
  );
}

// Footer Component
function Footer({ language, t }: { language: 'ar' | 'en'; t: (ar: string, en: string) => string }) {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
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
  );
}
