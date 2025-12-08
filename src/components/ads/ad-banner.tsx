'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'inline';
  className?: string;
}

export function AdBanner({ position = 'bottom', className }: AdBannerProps) {
  const t = useTranslations('ads');
  const { showAds, user } = useAppStore();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Don't show if premium user or ads disabled
  if (!showAds || user?.isPremium || isDismissed) {
    return null;
  }

  const positions = {
    top: 'fixed top-16 md:top-20 left-0 right-0 z-40',
    bottom: 'fixed bottom-0 left-0 right-0 z-40',
    inline: 'relative',
  };

  return (
    <div
      className={cn(
        'bg-neutral-100 dark:bg-neutral-900',
        'border-neutral-200 dark:border-neutral-800',
        position === 'top' && 'border-b',
        position === 'bottom' && 'border-t',
        position === 'inline' && 'border rounded-xl',
        positions[position],
        className
      )}
    >
      <div className="container-app py-3 px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Ad content placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                {t('banner')}
              </span>
              {/* 
                This is where you would integrate Google AdSense or similar.
                Example AdSense code would go here:
                <ins 
                  className="adsbygoogle"
                  style={{ display: 'inline-block', width: '728px', height: '90px' }}
                  data-ad-client="ca-pub-XXXXXXX"
                  data-ad-slot="XXXXXXX"
                />
              */}
              <div className="bg-neutral-200 dark:bg-neutral-800 rounded-lg px-6 py-2 text-sm text-neutral-500">
                Ad Space - 728x90
              </div>
            </div>
          </div>

          {/* Dismiss button (only for inline) */}
          {position === 'inline' && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Upgrade prompt */}
          <a
            href="/pricing"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap"
          >
            {t('removeAds')}
          </a>
        </div>
      </div>
    </div>
  );
}

// Hook to add bottom padding when ad banner is visible
export function useAdBannerPadding() {
  const { showAds, user } = useAppStore();
  return showAds && !user?.isPremium ? 'pb-16' : '';
}
