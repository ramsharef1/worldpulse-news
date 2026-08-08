'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/LanguageContext';

export default function SearchPage() {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'views'>('relevance');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    if (query) performSearch(query);
  }, []);

  const performSearch = async (query: string) => {
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
    if (!articles.length) return;

    let results = articles.filter((article: any) => {
      const query = searchQuery.toLowerCase();
      const title = (language === 'ar' ? (article.title || '') : (article.title_en || '')).toLowerCase();
      const excerpt = (language === 'ar' ? (article.excerpt || '') : (article.excerpt_en || '')).toLowerCase();
      return title.includes(query) || excerpt.includes(query);
    });

    if (selectedCategory) results = results.filter((a: any) => a.category === selectedCategory);
    if (sortBy === 'newest') results.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sortBy === 'views') results.sort((a: any, b: any) => b.views - a.views);

    setFilteredArticles(results);
  }, [articles, searchQuery, selectedCategory, sortBy, language]);

  const getUniqueUniversities = () => Array.from(new Set(articles.map((a: any) => a.university))).sort();

  return (
    <>
      <section className="py-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">{t('البحث عن الأخبار', 'Search News')}</h1>
          <div className="flex gap-4 mb-6">
            <label htmlFor="search-input" className="sr-only">{t('ابحث عن الأخبار', 'Search articles')}</label>
            <input id="search-input" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('ابحث عن الأخبار...', 'Search articles...')} className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" />
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">{t('بحث', 'Search')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('التصنيف', 'Category')}</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white">
                <option value="">{t('جميع التصنيفات', 'All Categories')}</option>
                {CATEGORIES.map((cat) => <option key={cat.id} value={cat.slug}>{language === 'ar' ? cat.name_ar : cat.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('الجامعة', 'University')}</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white">
                <option value="">{t('جميع الجامعات', 'All Universities')}</option>
                {getUniqueUniversities().map((uni) => <option key={uni} value={uni}>{uni}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('الترتيب', 'Sort')}</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white">
                <option value="relevance">{t('الملاءمة', 'Relevance')}</option>
                <option value="newest">{t('الأحدث', 'Newest')}</option>
                <option value="views">{t('الأكثر مشاهدة', 'Most Viewed')}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <p className="text-gray-600 dark:text-gray-400 mb-8">{filteredArticles.length} {t('نتيجة', 'result')} {t('عن', 'for')} "{searchQuery}"</p>
          {isLoading ? <div className="text-center py-12 text-gray-500">{t('جاري البحث...', 'Searching...')}</div> : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article: any) => (
                <Link key={article.id} href={`/article/${article.id}`} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition">
                  <div className="h-40 bg-gradient-to-r from-blue-400 to-teal-400 flex items-center justify-center"><span className="text-white text-sm font-semibold">{article.category}</span></div>
                  <div className="p-4">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">{article.category}</p>
                    <h4 className="font-bold mb-2 line-clamp-2">{language === 'ar' ? article.title : article.title_en}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{language === 'ar' ? article.excerpt : article.excerpt_en}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{article.date} • {article.university} • {article.views} {t('مشاهدة', 'views')}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">{t('لم يتم العثور على نتائج', 'No results found')}</p>
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">{t('العودة إلى الرئيسية', 'Back to Home')}</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
