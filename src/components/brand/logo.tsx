'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Abstract breathing/wave symbol */}
      <svg
        className={cn(sizes[size].icon, 'text-primary-600')}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="opacity-20"
        />
        <path
          d="M10 20C10 20 13 14 20 14C27 14 30 20 30 20C30 20 27 26 20 26C13 26 10 20 10 20Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle
          cx="20"
          cy="20"
          r="3"
          fill="currentColor"
        />
      </svg>
      
      {showText && (
        <span className={cn(
          'font-display font-semibold tracking-tight',
          'text-neutral-900 dark:text-neutral-100',
          sizes[size].text
        )}>
          Breath<span className="text-primary-600">of</span>Now
        </span>
      )}
    </div>
  );
}
