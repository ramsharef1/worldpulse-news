'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-lg">
      <div className="mb-8">
        <svg viewBox="0 0 200 160" className="w-48 h-40 mx-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="30" width="120" height="90" rx="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
          <line x1="60" y1="55" x2="140" y2="55" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
          <line x1="60" y1="70" x2="120" y2="70" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
          <line x1="60" y1="85" x2="130" y2="85" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
          <text x="100" y="145" textAnchor="middle" fontFamily="system-ui" fontWeight="700" fontSize="32" fill="currentColor" opacity="0.3">404</text>
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-4">
        {t('الصفحة غير موجودة', 'Page Not Found')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t(
          'لم نتمكن من العثور على الصفحة التي تبحث عنها.',
          'We couldn\'t find the page you\'re looking for.'
        )}
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        {t('العودة للرئيسية', 'Back to Home')}
      </Link>
    </div>
  );
}
