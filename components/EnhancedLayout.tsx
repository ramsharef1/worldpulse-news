/**
 * Enhanced Layout Components
 * Modern, professional layouts with improved UX
 */

'use client';

import React from 'react';
import { designSystem } from '@/lib/design-system';

interface EnhancedHeaderProps {
  language: 'ar' | 'en';
  darkMode: boolean;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onDarkModeChange: (isDark: boolean) => void;
  onSearchFocus?: () => void;
}

export function EnhancedHeader({
  language,
  darkMode,
  onLanguageChange,
  onDarkModeChange,
  onSearchFocus,
}: EnhancedHeaderProps) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              UV
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Universities Voice
              </h1>
              <p className="text-xs text-gray-500">{t('أخبار الجامعات الأردنية', 'Jordan University News')}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('ابحث عن أخبار...', 'Search news...')}
                onFocus={onSearchFocus}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-blue-500 focus:outline-none transition"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium"
              title={t('تبديل اللغة', 'Toggle language')}
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              onClick={() => onDarkModeChange(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title={t('تبديل الوضع الليلي', 'Toggle dark mode')}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('ابحث...', 'Search...')}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:outline-none transition"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}

interface EnhancedNavProps {
  language: 'ar' | 'en';
  items: Array<{ name_ar: string; name_en: string; href: string; icon?: string }>;
  activeHref?: string;
}

export function EnhancedNav({ language, items, activeHref }: EnhancedNavProps) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`px-4 py-3 whitespace-nowrap font-medium text-sm transition border-b-2 ${
                activeHref === item.href
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {t(item.name_ar, item.name_en)}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  cta?: {
    text: string;
    href: string;
  };
  children?: React.ReactNode;
}

export function HeroSection({ title, subtitle, backgroundImage, cta, children }: HeroSectionProps) {
  return (
    <section
      className="relative py-20 md:py-28 overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">{title}</h1>
          {subtitle && <p className="text-lg md:text-xl text-white/90 mb-8">{subtitle}</p>}
          {cta && (
            <a
              href={cta.href}
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              {cta.text}
            </a>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

interface ContentCardProps {
  title: string;
  description?: string;
  image?: string;
  category?: string;
  metadata?: React.ReactNode;
  href?: string;
  variant?: 'base' | 'elevated' | 'ghost';
  children?: React.ReactNode;
}

export function ContentCard({
  title,
  description,
  image,
  category,
  metadata,
  href,
  variant = 'base',
  children,
}: ContentCardProps) {
  const baseClasses =
    'rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group';
  const variantClasses = {
    base: 'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm',
    elevated: 'bg-white dark:bg-gray-900 shadow-lg',
    ghost: 'border border-gray-200 dark:border-gray-800 bg-transparent',
  };

  const content = (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {image && (
        <div className="h-48 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition" />
        </div>
      )}

      <div className="p-5">
        {category && <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-2">{category}</p>}

        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition line-clamp-2">{title}</h3>

        {description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{description}</p>}

        {metadata && <div className="text-xs text-gray-500 dark:text-gray-500">{metadata}</div>}

        {children}
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    content
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
}

export function Section({ title, subtitle, children, variant = 'light' }: SectionProps) {
  const bgClasses = variant === 'light' ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800';

  return (
    <section className={`${bgClasses} py-16 md:py-20`}>
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

interface FooterProps {
  language: 'ar' | 'en';
}

export function EnhancedFooter({ language }: FooterProps) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold mb-4">
              UV
            </div>
            <h3 className="font-bold text-lg mb-2">Universities Voice</h3>
            <p className="text-gray-400 text-sm">{t('منصة أخبار الجامعات الأردنية', 'Jordan University News Platform')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('الروابط', 'Links')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/news" className="hover:text-white transition">{t('الأخبار', 'News')}</a></li>
              <li><a href="/events" className="hover:text-white transition">{t('الأحداث', 'Events')}</a></li>
              <li><a href="/jobs" className="hover:text-white transition">{t('الوظائف', 'Jobs')}</a></li>
              <li><a href="/universities" className="hover:text-white transition">{t('الجامعات', 'Universities')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('قانوني', 'Legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/about" className="hover:text-white transition">{t('حول', 'About')}</a></li>
              <li><a href="/privacy" className="hover:text-white transition">{t('الخصوصية', 'Privacy')}</a></li>
              <li><a href="/terms" className="hover:text-white transition">{t('الشروط', 'Terms')}</a></li>
              <li><a href="/contact" className="hover:text-white transition">{t('اتصل بنا', 'Contact')}</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">{t('تابعنا', 'Follow')}</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white transition">LinkedIn</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © 2024 Universities Voice. {t('جميع الحقوق محفوظة', 'All rights reserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
