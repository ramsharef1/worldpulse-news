'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function AboutPage() {
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
        <h1 className="text-4xl font-bold mb-8">{t('عن Universities-Voice', 'About Universities-Voice')}</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t('مهمتنا', 'Our Mission')}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('نهدف إلى توفير منصة شاملة لأخبار الجامعات الأردنية، تجمع بين المحتوى الأكاديمي والإخباري والأنشطة الطلابية في مكان واحد.', 'We aim to provide a comprehensive platform for Jordanian university news.')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t('ماذا نغطي', 'What We Cover')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('نغطي أخبار من 18 جامعة أردنية:', 'We cover news from 18 Jordanian universities:')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['University of Jordan', 'JUST', 'Hashemite', 'Yarmouk', 'Al-Balqa', 'Mutah', 'Al-Ahliyya', 'MEU', 'GJU', 'Jerash', 'Philadelphia', 'Amman Arab', 'Princess Sumaya', 'Isra', 'Petra', 'Applied Science', 'Aqaba', 'Al-Zaytoonah'].map((uni) => (
              <div key={uni} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">{uni}</div>
            ))}
          </div>
        </section>

        <section className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">{t('المزيد من المعلومات', 'Learn More')}</h2>
          <Link href="/news" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-block">{t('استكشف الأخبار', 'Explore News')}</Link>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2026 Universities-Voice.</p>
        </div>
      </footer>
    </>
  );
}
