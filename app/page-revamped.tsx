'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES, NAV_ITEMS } from '@/lib/constants';
import { UNIVERSITIES_DATA } from '@/lib/universities-data';
import { EnhancedHeader, EnhancedNav, HeroSection, ContentCard, Section, EnhancedFooter } from '@/components/EnhancedLayout';
import { TrendingWidget } from '@/components/TrendingWidget';

export default function HomeRevamped() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // Fetch featured articles
      const featuredRes = await fetch('/api/articles?featured=true&limit=6');
      const featuredData = await featuredRes.json();
      setFeaturedArticles(featuredData.articles || []);

      // Fetch latest articles
      const latestRes = await fetch('/api/articles?limit=12');
      const latestData = await latestRes.json();
      setLatestArticles(latestData.articles || []);

      // Fetch trending articles
      const trendingRes = await fetch('/api/trending?limit=6');
      const trendingData = await trendingRes.json();
      setTrendingArticles(trendingData.articles || []);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    icon: {
      news: '📰',
      trending: '🔥',
      jobs: '💼',
      events: '📅',
      faculty: '👨‍🏫',
      universities: '🎓',
    }[item.href.replace('/', '')] || '📌',
  }));

  return (
    <>
      {/* Enhanced Header */}
      <EnhancedHeader
        language={language}
        darkMode={darkMode}
        onLanguageChange={setLanguage}
        onDarkModeChange={setDarkMode}
      />

      {/* Enhanced Navigation */}
      <EnhancedNav language={language} items={navItems} activeHref="/" />

      {/* Hero Section with Improved Design */}
      <HeroSection
        title={t('أخبار الجامعات الأردنية', 'Jordanian University News')}
        subtitle={t('ابقَ على اطلاع بأحدث الأخبار والأحداث من جميع الجامعات الأردنية', 'Stay updated with the latest news and events from all Jordanian universities')}
        cta={{
          text: t('استكشف الآن', 'Explore Now'),
          href: '/news',
        }}
      />

      {/* Categories Section */}
      <Section
        title={t('التصنيفات الرئيسية', 'Main Categories')}
        subtitle={t('اختر ما يهمك', 'Choose what interests you')}
        variant="light"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`/news?category=${cat.slug}`}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-center group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition">{cat.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? cat.name_ar : cat.name_en}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {language === 'ar' ? '+ مقالات' : '+ articles'}
              </p>
            </a>
          ))}
        </div>
      </Section>

      {/* Featured Articles Section */}
      <Section
        title={t('المقالات المميزة', 'Featured Articles')}
        subtitle={t('أفضل المحتوى المنتقى بعناية', 'Best curated content')}
        variant="dark"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-gray-700 dark:bg-gray-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.length > 0 ? (
              featuredArticles.map((article: any) => (
                <ContentCard
                  key={article.id}
                  title={language === 'ar' ? article.title : article.title_en}
                  description={language === 'ar' ? article.excerpt : article.excerpt_en}
                  category={article.category}
                  image={`https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}-?w=500&h=300&fit=crop`}
                  href={`/article/${article.id}`}
                  metadata={
                    <p className="text-xs text-gray-500">
                      {article.university} • {article.views} {t('مشاهدة', 'views')}
                    </p>
                  }
                  variant="elevated"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                {t('لا توجد مقالات متاحة', 'No articles available')}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Featured + Trending Sidebar Layout */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Latest Articles (2/3) */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-8">{t('أحدث الأخبار', 'Latest News')}</h2>
              <div className="space-y-6">
                {latestArticles.length > 0 ? (
                  latestArticles.slice(0, 8).map((article: any, idx: number) => (
                    <a
                      key={article.id}
                      href={`/article/${article.id}`}
                      className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-blue-300 transition group"
                    >
                      <div className="w-32 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex-shrink-0 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                          {article.category}
                        </p>
                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-600 transition">
                          {language === 'ar' ? article.title : article.title_en}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {language === 'ar' ? article.excerpt : article.excerpt_en}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {article.university} • {article.views} views
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t('لا توجد مقالات', 'No articles')}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar (1/3) */}
            <aside className="space-y-8">
              {/* Trending Widget */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-lg mb-4">🔥 {t('الأكثر تداولاً', 'Trending')}</h3>
                <div className="space-y-3">
                  {trendingArticles.slice(0, 5).map((article: any, idx: number) => (
                    <a
                      key={article.id}
                      href={`/article/${article.id}`}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 w-8 flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm line-clamp-2 hover:text-blue-600 transition">
                          {language === 'ar' ? article.title : article.title_en}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{article.views} views</p>
                      </div>
                    </a>
                  ))}
                </div>
                <a
                  href="/trending"
                  className="mt-4 block text-center py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {t('عرض الكل', 'View All')}
                </a>
              </div>

              {/* Universities Quick Links */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-lg mb-4">🎓 {t('الجامعات', 'Universities')}</h3>
                <div className="space-y-2">
                  {UNIVERSITIES_DATA.slice(0, 6).map((uni) => (
                    <a
                      key={uni.slug}
                      href={`/universities/${uni.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500 group-hover:scale-125 transition" />
                      <span className="text-sm font-medium group-hover:text-blue-600 transition">
                        {language === 'ar' ? uni.name_ar : uni.name_en}
                      </span>
                    </a>
                  ))}
                </div>
                <a
                  href="/universities"
                  className="mt-4 block text-center py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  {t('عرض جميع الجامعات', 'View All Universities')}
                </a>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2">{t('البقاء على اطلاع', 'Stay Updated')}</h3>
                <p className="text-sm text-white/90 mb-4">{t('اشترك في النشرة البريدية للحصول على أحدث الأخبار', 'Subscribe to our newsletter for the latest news')}</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder={t('بريدك الإلكتروني', 'Your email')}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder:text-white/60 border border-white/30 focus:border-white focus:outline-none"
                  />
                  <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                    {t('اشترك', 'Subscribe')}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('كن جزءاً من مجتمعنا', 'Join Our Community')}</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {t('شارك أخبارك وأحداثك مع آلاف الطلاب والأكاديميين', 'Share your news and events with thousands of students and academics')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/auth/signup"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              {t('التسجيل مجاناً', 'Sign Up Free')}
            </a>
            <a
              href="/about"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition"
            >
              {t('تعرف علينا', 'Learn More')}
            </a>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <EnhancedFooter language={language} />
    </>
  );
}
