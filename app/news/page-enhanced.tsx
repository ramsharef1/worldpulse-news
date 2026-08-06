'use client';

import { useState, useEffect } from 'react';
import { EnhancedHeader, EnhancedNav, EnhancedFooter, ContentCard, Section } from '@/components/EnhancedLayout';
import { CATEGORIES } from '@/lib/constants';
import { UNIVERSITIES_DATA } from '@/lib/universities-data';

export default function NewsEnhanced() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'views'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/articles?limit=100');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let results = articles;

    if (selectedCategory) {
      results = results.filter((a) => a.category === selectedCategory);
    }
    if (selectedUniversity) {
      results = results.filter((a) => a.university === selectedUniversity);
    }

    if (sortBy === 'trending') {
      results.sort((a, b) => (b.views || 0) * 0.7 + (b.likes || 0) * 1.5 - (a.views || 0) * 0.7 - (a.likes || 0) * 1.5);
    } else if (sortBy === 'views') {
      results.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setFilteredArticles(results);
    setCurrentPage(1);
  }, [articles, selectedCategory, selectedUniversity, sortBy]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const paginatedArticles = filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);

  return (
    <>
      <EnhancedHeader
        language={language}
        darkMode={darkMode}
        onLanguageChange={setLanguage}
        onDarkModeChange={setDarkMode}
      />

      <EnhancedNav language={language} items={[]} />

      {/* Hero */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('أخبار الجامعات', 'University News')}</h1>
          <p className="text-lg text-white/90">{t('تصفح آخر الأخبار من جميع الجامعات الأردنية', 'Browse the latest news from all Jordanian universities')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                {/* Category Filter */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">{t('التصنيفات', 'Categories')}</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        !selectedCategory
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('جميع التصنيفات', 'All Categories')}
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          selectedCategory === cat.slug
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {cat.icon} {language === 'ar' ? cat.name_ar : cat.name_en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* University Filter */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">{t('الجامعات', 'Universities')}</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => setSelectedUniversity('')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        !selectedUniversity
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t('جميع الجامعات', 'All Universities')}
                    </button>
                    {UNIVERSITIES_DATA.map((uni) => (
                      <button
                        key={uni.slug}
                        onClick={() => setSelectedUniversity(uni.name_en)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedUniversity === uni.name_en
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {language === 'ar' ? uni.name_ar : uni.name_en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">{t('الترتيب', 'Sort')}</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'newest', label: t('الأحدث أولاً', 'Newest First') },
                      { value: 'trending', label: t('الأكثر تداولاً', 'Trending') },
                      { value: 'views', label: t('الأكثر مشاهدة', 'Most Viewed') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as any)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          sortBy === option.value
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">{t('الإحصائيات', 'Statistics')}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('إجمالي المقالات', 'Total Articles')}</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredArticles.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('إجمالي المشاهدات', 'Total Views')}</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {filteredArticles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Articles Grid */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {filteredArticles.length} {t('مقالة', 'articles')}
                </h2>
                {selectedCategory || selectedUniversity ? (
                  <div className="flex gap-2 flex-wrap">
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                      >
                        {selectedCategory}
                        <span>×</span>
                      </button>
                    )}
                    {selectedUniversity && (
                      <button
                        onClick={() => setSelectedUniversity('')}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                      >
                        {selectedUniversity}
                        <span>×</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : paginatedArticles.length > 0 ? (
                <>
                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {paginatedArticles.map((article: any, idx: number) => (
                      <ContentCard
                        key={article.id}
                        title={language === 'ar' ? article.title : article.title_en}
                        description={language === 'ar' ? article.excerpt : article.excerpt_en}
                        category={article.category}
                        href={`/article/${article.id}`}
                        image={`https://images.unsplash.com/photo-${1600000 + idx}-?w=500&h=300&fit=crop`}
                        variant="elevated"
                        metadata={
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{article.university}</span>
                            <span>{article.views || 0} views</span>
                          </div>
                        }
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {t('السابق', 'Previous')}
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {t('التالي', 'Next')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">{t('لم يتم العثور على مقالات', 'No articles found')}</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedUniversity('');
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    {t('حذف الفلاتر', 'Clear Filters')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <EnhancedFooter language={language} />
    </>
  );
}
