'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
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
    </div>
  );
}
