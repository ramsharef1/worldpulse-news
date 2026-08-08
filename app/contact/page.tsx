'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
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
    </div>
  );
}
