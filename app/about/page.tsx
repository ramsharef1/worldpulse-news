'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { UNIVERSITIES_DATA } from '@/lib/universities-data';
import { CATEGORIES } from '@/lib/constants';

export default function AboutPage() {
  const { language, t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">{t('عن صوت الجامعات', 'About Universities-Voice')}</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">{t('مهمتنا', 'Our Mission')}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t(
            'نهدف إلى توفير منصة شاملة لأخبار الجامعات الأردنية، تجمع بين المحتوى الأكاديمي والإخباري والأنشطة الطلابية في مكان واحد.',
            'We aim to provide a comprehensive platform for Jordanian university news, bringing together academic content, news coverage, and student activities in one place.'
          )}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">{t('ماذا نغطي', 'What We Cover')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t(
            `نغطي أخبار من ${UNIVERSITIES_DATA.length} جامعة أردنية:`,
            `We cover news from ${UNIVERSITIES_DATA.length} Jordanian universities:`
          )}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {UNIVERSITIES_DATA.map((uni) => (
            <Link
              key={uni.slug}
              href={`/universities/${uni.slug}`}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
            >
              {language === 'ar' ? uni.name_ar : uni.name_en}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">{t('التصنيفات', 'Categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/news/${cat.slug}`}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
            >
              <span className="text-2xl block mb-1">{cat.icon}</span>
              <span className="text-sm font-medium">{t(cat.name_ar, cat.name_en)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{t('تصفح الأخبار', 'Browse News')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t(
            'اطلع على آخر الأخبار والمستجدات من الجامعات الأردنية.',
            'Stay up to date with the latest news from Jordanian universities.'
          )}
        </p>
        <Link href="/news" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-block">
          {t('استكشف الأخبار', 'Explore News')}
        </Link>
      </section>
    </div>
  );
}
