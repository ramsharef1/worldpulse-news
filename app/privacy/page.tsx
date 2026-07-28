'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function PrivacyPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

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

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">{t('سياسة الخصوصية', 'Privacy Policy')}</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('المقدمة', 'Introduction')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('نحن نقدر خصوصيتك. هذه السياسة تشرح كيف نجمع بيانات المستخدمين.', 'We value your privacy and explain how we collect data.')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('البيانات التي نجمعها', 'Data We Collect')}</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• {t('عنوان البريد الإلكتروني عند الاشتراك', 'Email address when subscribing')}</li>
            <li>• {t('معلومات التصفح الأساسية', 'Basic browsing information')}</li>
            <li>• {t('التفضيلات اللغوية', 'Language preferences')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('حقوقك', 'Your Rights')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('يمكنك طلب الوصول أو حذف بيانات الخاصة بك في أي وقت.', 'You can request access or deletion of your data anytime.')}</p>
        </section>

        <Link href="/contact" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-block">{t('اتصل بنا', 'Contact Us')}</Link>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2026 Universities-Voice.</p>
        </div>
      </footer>
    </>
  );
}
