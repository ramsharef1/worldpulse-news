'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function HelpPage() {
  const { language, t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs = [
    { id: '1', q_ar: 'كيف أبحث؟', q_en: 'How to search?', a_ar: 'استخدم شريط البحث في الرأس', a_en: 'Use the search bar at top' },
    { id: '2', q_ar: 'كيف أشترك؟', q_en: 'How to subscribe?', a_ar: 'أدخل بريدك الإلكتروني', a_en: 'Enter your email address' },
    { id: '3', q_ar: 'كيف أغير اللغة؟', q_en: 'How to change language?', a_ar: 'انقر على زر AR/EN', a_en: 'Click the AR/EN button' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">{t('المساعدة', 'Help')}</h1>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
              <h3 className="font-bold text-lg">{language === 'ar' ? faq.q_ar : faq.q_en}</h3>
              <span className="text-2xl" style={{transform: expandedId === faq.id ? 'rotate(180deg)' : 'rotate(0)'}}>▼</span>
            </button>
            {expandedId === faq.id && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">{language === 'ar' ? faq.a_ar : faq.a_en}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{t('هل تحتاج مساعدة؟', 'Need Help?')}</h2>
        <Link href="/contact" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-block">{t('اتصل بنا', 'Contact Us')}</Link>
      </div>
    </div>
  );
}
