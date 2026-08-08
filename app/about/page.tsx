'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
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
    </div>
  );
}
