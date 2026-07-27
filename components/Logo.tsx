import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Mark */}
      <svg
        className={`${sizeMap[size]} flex-shrink-0`}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Outer circle */}
        <circle cx="100" cy="100" r="95" stroke="#1E40AF" strokeWidth="2" opacity="0.2" />

        {/* Open book shape */}
        <g transform="translate(100, 100)">
          {/* Left page - Blue */}
          <path
            d="M -35 -45 L -8 -45 L -8 45 L -35 50 Q -40 45 -40 35 L -40 -35 Q -40 -45 -35 -45"
            fill="#1E40AF"
            opacity="0.9"
          />

          {/* Right page - Purple */}
          <path
            d="M 8 -45 L 35 -45 Q 40 -45 40 -35 L 40 35 Q 40 45 35 50 L 8 45 L 8 -45"
            fill="#7C3AED"
            opacity="0.7"
          />

          {/* Voice waves - Blue */}
          <path d="M 20 -20 Q 35 -28 45 -20" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M 15 0 Q 38 -10 55 0"
            stroke="#1E40AF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 20 20 Q 35 28 45 20"
            stroke="#1E40AF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Center dot - Purple */}
          <circle cx="8" cy="0" r="4" fill="#7C3AED" />
        </g>
      </svg>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400">Universities</div>
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">Voice</div>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <Logo size={size} showText={false} />;
}
