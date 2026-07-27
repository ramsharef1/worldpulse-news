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
    // Get language from document or prop
    if (language) {
      setCurrentLang(language);
    } else {
      const docLang = document.documentElement.lang as 'ar' | 'en';
      setCurrentLang(docLang === 'en' ? 'en' : 'ar');
    }
  }, [language]);

  const isArabic = currentLang === 'ar';
  const logoSrc = isArabic ? '/logo-ar.svg' : '/logo-en.svg';

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
              <div className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400">جامعات</div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">الصوت</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400">Universities</div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">Voice</div>
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
