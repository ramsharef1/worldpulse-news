'use client';

import { useState, useEffect } from 'react';
import { EnhancedHeader, EnhancedNav, EnhancedFooter } from '@/components/EnhancedLayout';

export default function Notifications() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 1,
      type: 'news',
      title: t('أخبار جديدة', 'New Article Published'),
      description: t('تم نشر مقالة جديدة في التصنيف المفضل لديك', 'A new article was published in your favorite category'),
      time: t('قبل 2 دقيقة', '2 minutes ago'),
      read: false,
      icon: '📰',
    },
    {
      id: 2,
      type: 'event',
      title: t('حدث قادم', 'Upcoming Event'),
      description: t('لا تفوت هذا الحدث المهم في جامعة الأردن', 'Don\'t miss this important event at University of Jordan'),
      time: t('قبل 15 دقيقة', '15 minutes ago'),
      read: false,
      icon: '📅',
    },
    {
      id: 3,
      type: 'job',
      title: t('فرصة عمل جديدة', 'New Job Opportunity'),
      description: t('وظيفة تطابق مهاراتك متاحة الآن', 'A job matching your skills is now available'),
      time: t('قبل 1 ساعة', '1 hour ago'),
      read: true,
      icon: '💼',
    },
    {
      id: 4,
      type: 'comment',
      title: t('تعليق جديد', 'New Comment'),
      description: t('أضاف شخص ما تعليقاً على مقالتك', 'Someone commented on your article'),
      time: t('قبل 2 ساعة', '2 hours ago'),
      read: true,
      icon: '💬',
    },
  ]);

  function t(ar: string, en: string) {
    return language === 'ar' ? ar : en;
  }

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <EnhancedHeader
        language={language}
        darkMode={darkMode}
        onLanguageChange={setLanguage}
        onDarkModeChange={setDarkMode}
      />

      <EnhancedNav language={language} items={[]} />

      {/* Header */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">🔔 {t('الإشعارات', 'Notifications')}</h1>
              <p className="text-lg text-white/90">
                {unreadCount > 0
                  ? t(`لديك ${unreadCount} إشعارات جديدة`, `You have ${unreadCount} new notifications`)
                  : t('لا توجد إشعارات جديدة', 'No new notifications')}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 font-semibold transition"
              >
                {t('تحديد الكل كمقروء', 'Mark all as read')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-30 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('الكل', 'All')} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('لم تقرأ', 'Unread')} ({unreadCount})
            </button>
          </div>
        </div>
      </section>

      {/* Notifications List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`p-6 rounded-xl border-2 transition cursor-pointer ${
                    notification.read
                      ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                      : 'border-blue-300 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-400'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-xl">
                      {notification.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className={`font-bold ${notification.read ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{notification.description}</p>

                      <p className="text-xs text-gray-500 dark:text-gray-500">{notification.time}</p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition text-xl"
                      title={t('حذف', 'Delete')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-xl font-bold mb-2">
                  {filter === 'unread' ? t('لا توجد إشعارات جديدة', 'No unread notifications') : t('لا توجد إشعارات', 'No notifications')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('سيظهر كل شيء هنا عندما يكون لديك شيء جديد', 'Everything will appear here when you have something new')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Settings Link */}
      <section className="py-12 text-center border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('تحكم في تفضيلات الإشعارات الخاصة بك', 'Manage your notification preferences')}
          </p>
          <a
            href="/settings/notifications"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {t('إعدادات الإشعارات', 'Notification Settings')}
          </a>
        </div>
      </section>

      <EnhancedFooter language={language} />
    </>
  );
}
