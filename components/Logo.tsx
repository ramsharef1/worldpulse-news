import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function Logo({ size = 'md', showText = true, variant = 'auto' }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Mark */}
      <svg
        className={`${sizeMap[size]} flex-shrink-0`}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Outer circle */}
        <circle cx="100" cy="100" r="95" stroke="url(#logoGradient)" strokeWidth="2" opacity="0.1" />

        {/* Open book shape */}
        <g transform="translate(100, 100)">
          {/* Left page */}
          <path
            d="M -35 -45 L -8 -45 L -8 45 L -35 50 Q -40 45 -40 35 L -40 -35 Q -40 -45 -35 -45"
            fill="url(#logoGradient)"
            opacity="0.9"
          />

          {/* Right page */}
          <path
            d="M 8 -45 L 35 -45 Q 40 -45 40 -35 L 40 35 Q 40 45 35 50 L 8 45 L 8 -45"
            fill="url(#logoGradient)"
            opacity="0.7"
          />

          {/* Voice waves */}
          <path d="M 20 -20 Q 35 -28 45 -20" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M 15 0 Q 38 -10 55 0"
            stroke="url(#logoGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 20 20 Q 35 28 45 20"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Center dot */}
          <circle cx="8" cy="0" r="4" fill="url(#logoGradient)" />
        </g>
      </svg>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="text-sm font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Universities
          </div>
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Voice</div>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <Logo size={size} showText={false} />;
}
