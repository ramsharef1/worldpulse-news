'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">{t('شروط الخدمة', 'Terms of Service')}</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('القبول', 'Acceptance')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('باستخدام هذه الخدمة، أنت توافق على جميع الشروط.', 'By using this service, you agree to all terms.')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('الاستخدام المقبول', 'Acceptable Use')}</h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>• {t('عدم نشر محتوى غير قانوني', 'No illegal content')}</li>
          <li>• {t('احترام حقوق الآخرين', 'Respect others rights')}</li>
          <li>• {t('عدم محاولة اختراق النظام', 'No hacking attempts')}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('إخلاء المسؤولية', 'Disclaimer')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('الخدمة تُقدم كما هي بدون ضمانات.', 'Service provided as is without warranties.')}</p>
      </section>
    </div>
  );
}
