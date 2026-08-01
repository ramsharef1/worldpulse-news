'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: string;
  title: string;
  title_en: string;
  category: string;
  university: string;
  views: number;
  trendingScore: number;
}

export interface TrendingWidgetProps {
  language: 'ar' | 'en';
}

export function TrendingWidget({ language }: TrendingWidgetProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/trending?limit=5');
        const data = await res.json();
        setArticles(data.trending || []);
      } catch {
        // silently fail; widget stays empty
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-gray-100">
        🔥 {t('الأخبار الرائجة', 'Trending Now')}
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-full" />
                <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('لا توجد مقالات رائجة', 'No trending articles')}
        </p>
      ) : (
        <ol className="space-y-3">
          {articles.map((article, idx) => (
            <li key={article.id}>
              <a
                href={`/article/${article.id}`}
                className="flex gap-3 group"
              >
                {/* Rank number */}
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
                    {(language === 'ar' ? article.title : article.title_en)?.slice(0, 80) ||
                      article.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-medium">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {article.views?.toLocaleString()} {t('مشاهدة', 'views')}
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ol>
      )}

      <a
        href="/trending"
        className="mt-4 block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {t('عرض كل الرائج ←', 'View all trending →')}
      </a>
    </div>
  );
}
