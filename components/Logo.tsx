import React, { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  language?: 'ar' | 'en';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function Logo({ size = 'md', showText = true, language }: LogoProps) {
  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    // Always use the language prop if provided, otherwise check document
    const lang = language || (document.documentElement.lang as 'ar' | 'en') || 'ar';
    setCurrentLang(lang === 'en' ? 'en' : 'ar');
  }, [language]);

  const isArabic = currentLang === 'ar';
  // Use refined logos with language-specific text
  const logoSrc = isArabic ? '/logo-ar-refined.svg?v=2' : '/logo-en-refined.svg?v=2';

  return (
    <div className="flex items-center gap-3">
      {/* Logo Image */}
      <img
        src={logoSrc}
        alt={isArabic ? 'صوت الجامعات' : 'Universities Voice'}
        className={`${sizeMap[size]} flex-shrink-0`}
      />

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          {isArabic ? (
            <>
              <div className="text-sm font-bold tracking-tight text-blue-600 dark:text-teal-400">جامعات</div>
              <div className="text-xs font-semibold text-teal-600 dark:text-teal-300">الصوت</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400">Universities</div>
              <div className="text-xs font-semibold text-teal-600 dark:text-teal-400">Voice</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 'md', language }: { size?: 'sm' | 'md' | 'lg'; language?: 'ar' | 'en' }) {
  return <Logo size={size} showText={false} language={language} />;
}
