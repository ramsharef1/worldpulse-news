'use client';

import React from 'react';

/**
 * Universities-Voice UI Component Library
 * All components follow the refined design system:
 * - Academic & professional aesthetic
 * - Image-heavy cards with generous spacing
 * - Flat & minimal button styles
 * - Humanist sans-serif typography
 * - Blue (#1E40AF) + Teal (#1AA89D) color scheme
 */

// ============ BUTTONS ============

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500',
    secondary: 'border border-gray-300 text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800',
    text: 'text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline dark:text-blue-400 dark:hover:text-blue-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

// ============ CARDS ============

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 transition-transform duration-200 hover:scale-105 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ============ ARTICLE CARD (Image-Heavy) ============

interface ArticleCardProps {
  image?: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  university: string;
  readTime?: string;
  onClick?: () => void;
}

export function ArticleCard({
  image,
  category,
  title,
  excerpt,
  date,
  university,
  readTime,
  onClick,
}: ArticleCardProps) {
  return (
    <Card onClick={onClick} className="overflow-hidden flex flex-col h-full">
      {/* Large Image Section - 60% of card */}
      {image && (
        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content Section - Generous padding */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        {/* Category Label */}
        <p className="text-xs font-semibold tracking-wide text-teal-600 dark:text-teal-400 uppercase">
          {category}
        </p>

        {/* Headline */}
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 text-wrap:balance">
          {title}
        </h4>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
          {excerpt}
        </p>

        {/* Metadata */}
        <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
          {date} • {university}
          {readTime && ` • ${readTime}`}
        </p>
      </div>
    </Card>
  );
}

// ============ INPUTS ============

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </label>
      )}
      <input
        className={`px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ============ SECTION ============

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Section({ children, title, className = '' }: SectionProps) {
  return (
    <section className={`py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 md:mb-12 text-wrap:balance">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}

// ============ GRID ============

interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ children, columns = 3, gap = 'lg', className = '' }: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4 md:gap-6',
    md: 'gap-6 md:gap-8',
    lg: 'gap-8 md:gap-10 lg:gap-12',
  };

  return (
    <div className={`grid ${colClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// ============ BADGE ============

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ============ DIVIDER ============

export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`h-px bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}

// ============ LOADING SKELETON ============

export function SkeletonCard() {
  return (
    <Card>
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-6 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </Card>
  );
}

// ============ ALERT ============

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Alert({ type, title, children, onClose }: AlertProps) {
  const colors = {
    success: 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800',
    error: 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    info: 'bg-cyan-50 text-cyan-900 dark:bg-cyan-900/20 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[type]}`} role="alert">
      <div className="flex items-start justify-between">
        <div>
          {title && <h3 className="font-semibold">{title}</h3>}
          <p className="text-sm mt-1">{children}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-4 text-lg hover:opacity-70">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
