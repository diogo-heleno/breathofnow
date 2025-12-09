/**
 * Ad Banner Component
 * 
 * Mostra anúncios para utilizadores free
 * Suporta Google AdSense quando configurado
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  position: 'top' | 'bottom' | 'inline';
  slot: string;
  className?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
}

export function AdBanner({
  position,
  slot,
  className,
  format = 'auto',
}: AdBannerProps) {
  const t = useTranslations('ads');
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if AdSense is configured
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isAdsenseEnabled = !!adsenseClientId;

  useEffect(() => {
    if (!isAdsenseEnabled || !adRef.current) return;

    try {
      // Load AdSense script if not already loaded
      if (!window.adsbygoogle) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          pushAd();
        };
        script.onerror = () => {
          setHasError(true);
        };
        document.head.appendChild(script);
      } else {
        pushAd();
      }
    } catch {
      setHasError(true);
    }
  }, [isAdsenseEnabled, adsenseClientId]);

  const pushAd = () => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setIsLoaded(true);
    } catch {
      setHasError(true);
    }
  };

  // Placeholder dimensions based on position
  const getDimensions = () => {
    switch (position) {
      case 'top':
        return 'h-[90px] max-h-[90px]';
      case 'bottom':
        return 'h-[50px] max-h-[50px]';
      case 'inline':
        return 'h-[250px] max-h-[250px]';
      default:
        return 'h-[90px]';
    }
  };

  // If AdSense not configured, show placeholder
  if (!isAdsenseEnabled) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-neutral-100 dark:bg-neutral-800',
          getDimensions(),
          className
        )}
      >
        <div className="text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {t('banner')}
          </p>
          <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1">
            {slot}
          </p>
        </div>
      </div>
    );
  }

  // If there was an error loading ads
  if (hasError) {
    return null; // Don't show anything if ads fail to load
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 overflow-hidden',
        getDimensions(),
        className
      )}
    >
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {/* AdSense Ad Unit */}
      <div ref={adRef} className="w-full h-full">
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>

      {/* Ad label */}
      <span className="absolute top-1 right-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
        Ad
      </span>
    </div>
  );
}

/**
 * Inline ad for content feeds
 */
export function InlineAd({
  slot,
  className,
}: {
  slot: string;
  className?: string;
}) {
  return (
    <AdBanner
      position="inline"
      slot={slot}
      format="rectangle"
      className={cn('rounded-lg my-4', className)}
    />
  );
}

/**
 * Native ad component (for future implementation)
 */
export function NativeAd({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations('ads');

  return (
    <div
      className={cn(
        'p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
        {t('banner')}
      </p>
      <div className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
    </div>
  );
}

// Global type declaration for AdSense
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}
