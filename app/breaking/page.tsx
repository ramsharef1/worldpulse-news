'use client';

import { useState, useEffect } from 'react';
import { EnhancedHeader, EnhancedNav, EnhancedFooter } from '@/components/EnhancedLayout';

export default function BreakingNews() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const breakingNews = [
    {
      id: 1,
      title: t('إعلان هام من جامعة الأردن', 'Important Announcement from University of Jordan'),
      description: t('تم الإعلان عن موعد جديد لبدء الفصل الدراسي', 'New semester start date announced'),
      time: t('قبل دقيقة', '1 minute ago'),
      university: 'University of Jordan',
      icon: '🚨',
      views: 2345,
    },
    {
      id: 2,
      title: t('اجتماع طلابي مهم بجامعة اليرموك', 'Important Student Meeting at Yarmouk'),
      description: t('حديث عن المشاركة الطلابية والتطوير', 'Discussion on student participation'),
      time: t('قبل 5 دقائق', '5 minutes ago'),
      university: 'Yarmouk University',
      icon: '📢',
      views: 1832,
    },
    {
      id: 3,
      title: t('وظائف جديدة من شركات عملاقة', 'New Job Opportunities from Leading Companies'),
      description: t('فرص عمل جديدة للخريجين', 'Career opportunities for graduates'),
      time: t('قبل 12 دقيقة', '12 minutes ago'),
      university: 'JUST',
      icon: '💼',
      views: 3421,
    },
  ];

  return (
    <>
      <EnhancedHeader
        language={language}
        darkMode={darkMode}
        onLanguageChange={setLanguage}
        onDarkModeChange={setDarkMode}
      />

      <EnhancedNav language={language} items={[]} />

      {/* Live Ticker */}
      <div className="bg-red-600 text-white py-3 sticky top-16 z-30 border-b-4 border-red-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-300 animate-pulse" />
              <span className="font-bold whitespace-nowrap">{t('مباشر', 'LIVE')}</span>
            </div>
            <div className="text-sm font-medium whitespace-nowrap animate-marquee">
              {t('آخر الأخبار الساخنة', 'Latest Breaking News')} • {t('تحديث مستمر', 'Continuous Update')}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">🚨 {t('أحدث الأخبار', 'Breaking News')}</h1>
              <p className="text-lg text-white/90">{t('تابع أحدث التطورات لحظة بلحظة', 'Follow latest developments in real-time')}</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                autoRefresh ? 'bg-white text-red-600 hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🔄 {autoRefresh ? t('إيقاف', 'Stop') : t('تشغيل', 'Start')}
            </button>
          </div>
        </div>
      </section>

      {/* Breaking News Feed */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {breakingNews.map((news, idx) => (
              <div
                key={news.id}
                className="p-6 rounded-xl border-2 border-red-200 dark:border-red-900/30 bg-white dark:bg-gray-900 hover:shadow-lg hover:border-red-400 transition animation-delay"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex gap-4">
                  {/* Number Badge */}
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 font-bold text-red-600 dark:text-red-400">
                    {news.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {news.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{news.description}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 animate-pulse" />
                        {news.time}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600 dark:text-gray-400">{news.university}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600 dark:text-gray-400">{news.views} {t('مشاهدة', 'views')}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                        {t('اقرأ المزيد', 'Read More')}
                      </button>
                      <button className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        {t('مشاركة', 'Share')}
                      </button>
                    </div>
                  </div>

                  {/* Share Count */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">↑</div>
                    <p className="text-xs text-gray-500">{t('تصاعد', 'Trending')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notification Prompt */}
          <div className="mt-12 p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">🔔</span>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {t('هل تريد تلقي إشعارات؟', 'Want to receive notifications?')}
                </h3>
                <p className="text-blue-700 dark:text-blue-200 text-sm mb-4">
                  {t('احصل على تنبيهات فورية للأخبار العاجلة', 'Get instant alerts for breaking news')}
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    {t('تفعيل الإشعارات', 'Enable Notifications')}
                  </button>
                  <button className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
                    {t('لاحقاً', 'Later')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EnhancedFooter language={language} />
    </>
  );
}
