'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function ContactPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><Logo size="md" showText={true} language={language} /></Link>
          <div className="flex items-center gap-4">
            <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">{language === 'ar' ? 'EN' : 'AR'}</button>
            <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">{t('اتصل بنا', 'Contact Us')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl mb-3">📧</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">info@universitiesvoice.com</p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl mb-3">📱</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">+962 6 123 4567</p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl mb-3">📍</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('عمّان، الأردن', 'Amman, Jordan')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder={t('الاسم', 'Name')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" required />
          <input type="email" placeholder={t('البريد الإلكتروني', 'Email')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white" required />
          <textarea placeholder={t('الرسالة', 'Message')} rows={5} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white resize-none" required />
          <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">{t('إرسال', 'Send')}</button>
          {submitted && <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg text-green-800 dark:text-green-200">✓ {t('تم الإرسال', 'Sent!')}</div>}
        </form>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2026 Universities-Voice.</p>
        </div>
      </footer>
    </>
  );
}
