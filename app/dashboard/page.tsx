'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function AnalyticsDashboard() {
  const { language, t } = useLanguage();
  const [dateRange, setDateRange] = useState('30d');

  const stats = {
    totalArticles: 1250,
    totalViews: 125400,
    activeUniversities: 8,
    avgEngagement: 4.5,
    newUsers: 342,
    returnUsers: 68,
  };

  const trendingCategories = [
    { name: t('أخبار', 'News'), articles: 450, percentage: 36 },
    { name: t('أحداث', 'Events'), articles: 280, percentage: 22 },
    { name: t('وظائف', 'Jobs'), articles: 320, percentage: 26 },
    { name: t('أعضاء هيئة', 'Faculty'), articles: 200, percentage: 16 },
  ];

  const universitiesData = [
    { name: t('جامعة الأردن', 'University of Jordan'), articles: 180, views: 15200 },
    { name: t('اليرموك', 'Yarmouk University'), articles: 150, views: 12400 },
    { name: t('العلوم والتكنولوجيا', 'JUST'), articles: 140, views: 11800 },
    { name: t('الهاشمية', 'Al-Hashemite'), articles: 120, views: 9600 },
    { name: t('مؤتة', 'Mutah University'), articles: 110, views: 8900 },
    { name: t('البلقاء', 'BAU'), articles: 95, views: 7500 },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{t('لوحة البيانات', 'Analytics Dashboard')}</h1>
              <p className="text-lg text-white/90">{t('إحصائيات المنصة والأداء', 'Platform statistics and performance')}</p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 hover:border-white transition"
            >
              <option value="7d" className="text-gray-900">{t('7 أيام', '7 Days')}</option>
              <option value="30d" className="text-gray-900">{t('30 يوم', '30 Days')}</option>
              <option value="90d" className="text-gray-900">{t('90 يوم', '90 Days')}</option>
              <option value="all" className="text-gray-900">{t('الكل', 'All Time')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">{t('المقاييس الرئيسية', 'Key Metrics')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: t('إجمالي المقالات', 'Total Articles'),
                value: stats.totalArticles,
                icon: '📄',
                trend: '+12%',
              },
              {
                title: t('إجمالي المشاهدات', 'Total Views'),
                value: stats.totalViews.toLocaleString(),
                icon: '👁️',
                trend: '+28%',
              },
              {
                title: t('الجامعات النشطة', 'Active Universities'),
                value: stats.activeUniversities,
                icon: '🎓',
                trend: '+2',
              },
              {
                title: t('متوسط الانخراط', 'Avg Engagement'),
                value: stats.avgEngagement.toFixed(1),
                icon: '💬',
                trend: '+0.5',
              },
              {
                title: t('المستخدمون الجدد', 'New Users'),
                value: stats.newUsers,
                icon: '👤',
                trend: '+45%',
              },
              {
                title: t('المستخدمون العائدون', 'Returning Users'),
                value: `${stats.returnUsers}%`,
                icon: '🔄',
                trend: '+8%',
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.trend} {t('من الفترة السابقة', 'from last period')}</p>
                  </div>
                  <span className="text-3xl">{metric.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">{t('التوزيع والاتجاهات', 'Distribution & Trends')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Categories Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-6">{t('المقالات حسب التصنيف', 'Articles by Category')}</h3>
              <div className="space-y-4">
                {trendingCategories.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-sm text-gray-500">{cat.articles} {t('مقالة', 'articles')}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Universities Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-6">{t('الجامعات الأكثر نشاطاً', 'Most Active Universities')}</h3>
              <div className="space-y-3">
                {universitiesData.map((uni, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{uni.name}</p>
                        <p className="text-xs text-gray-500">{uni.articles} {t('مقالة', 'articles')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{uni.views.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{t('مشاهدة', 'views')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">{t('المحتوى الأعلى أداءً', 'Top Performing Content')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-lg transition"
              >
                <div className="flex gap-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 w-12 flex-shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-2">
                      {t('المقالة المميزة رقم ' + (idx + 1), 'Featured Article #' + (idx + 1))}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {(5000 - idx * 1000).toLocaleString()} {t('مشاهدة', 'views')} • {language === 'ar' ? 'جامعة الأردن' : 'University of Jordan'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {language === 'ar' ? 'أخبار' : 'News'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        📈 {(100 - idx * 10)}% {t('نمو', 'growth')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">{t('تصدير البيانات', 'Export Data')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { format: 'PDF', icon: '📄', color: 'red' },
              { format: 'Excel', icon: '📊', color: 'green' },
              { format: 'CSV', icon: '📋', color: 'blue' },
            ].map((exp, idx) => (
              <button
                key={idx}
                className={`p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition text-center bg-white dark:bg-gray-900`}
              >
                <div className="text-4xl mb-4">{exp.icon}</div>
                <h3 className="font-bold mb-2">{t('تصدير كـ', 'Export as')} {exp.format}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('تحميل جميع البيانات كملف ' + exp.format, 'Download all data as ' + exp.format + ' file')}
                </p>
                <button className={`w-full px-4 py-2 rounded-lg font-semibold transition text-white bg-${exp.color}-600 hover:bg-${exp.color}-700`}>
                  {t('تحميل', 'Download')}
                </button>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
