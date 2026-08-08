'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { FOOTER_LINKS, CATEGORIES } from '@/lib/constants';

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">{t('صوت الجامعات', 'Universities Voice')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                'منصة أخبار شاملة لجميع الجامعات الأردنية',
                'Comprehensive news platform for all Jordanian universities'
              )}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('روابط سريعة', 'Quick Links')}</h4>
            <ul className="space-y-2 text-sm">
              {Object.values(FOOTER_LINKS).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                    {t(link.name_ar, link.name_en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('التصنيفات', 'Categories')}</h4>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/news/${cat.slug}`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                    {t(cat.name_ar, cat.name_en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>&copy; 2026 Universities-Voice. {t('جميع الحقوق محفوظة', 'All rights reserved.')}</p>
        </div>
      </div>
    </footer>
  );
}
