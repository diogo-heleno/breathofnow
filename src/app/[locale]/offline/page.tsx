'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WifiOff, Home, RefreshCw, HardDrive, CheckCircle, Wallet, Dumbbell, TrendingUp, AlertCircle } from 'lucide-react';
import { useServiceWorker } from '@/hooks/use-service-worker';

interface CachedApp {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  iconBg: string;
  isCached: boolean;
}

export default function OfflinePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { isOnline } = useServiceWorker();
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedPages, setCachedPages] = useState<string[]>([]);
  const [isCheckingCache, setIsCheckingCache] = useState(true);

  // Check which pages are cached
  const checkCachedPages = useCallback(async () => {
    if (!('caches' in window)) {
      setIsCheckingCache(false);
      return;
    }

    try {
      const cacheNames = await caches.keys();
      const allUrls: string[] = [];
      
      for (const cacheName of cacheNames) {
        if (cacheName.startsWith('breathofnow-')) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          keys.forEach(req => {
            const url = new URL(req.url);
            allUrls.push(url.pathname);
          });
        }
      }
      
      setCachedPages(allUrls);
    } catch (error) {
      console.error('Error checking cache:', error);
    } finally {
      setIsCheckingCache(false);
    }
  }, []);

  useEffect(() => {
    checkCachedPages();
  }, [checkCachedPages]);

  // Redirect when back online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = `/${locale}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, locale]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Navigate to app - use window.location to let SW handle from cache
  const navigateToApp = useCallback((path: string) => {
    // Use direct navigation so the SW can serve from cache
    window.location.href = path;
  }, []);

  // Check if a specific page is cached
  const isPageCached = useCallback((path: string): boolean => {
    // Check various path formats
    const variations = [
      path,
      path.endsWith('/') ? path.slice(0, -1) : path + '/',
      `${window.location.origin}${path}`,
    ];
    return variations.some(v => cachedPages.some(cached => cached === v || cached.startsWith(v)));
  }, [cachedPages]);

  // Define available apps
  const apps: CachedApp[] = [
    {
      id: 'expenses',
      name: 'Expenses',
      path: `/${locale}/expenses`,
      icon: <Wallet className="w-5 h-5 text-green-600" />,
      iconBg: 'bg-green-100',
      isCached: isPageCached(`/${locale}/expenses`),
    },
    {
      id: 'fitlog',
      name: 'FitLog',
      path: `/${locale}/fitlog`,
      icon: <Dumbbell className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
      isCached: isPageCached(`/${locale}/fitlog`),
    },
    {
      id: 'investments',
      name: 'Invest',
      path: `/${locale}/investments`,
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
      isCached: isPageCached(`/${locale}/investments`),
    },
  ];

  // If we're back online, show transition message
  if (isOnline) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500 animate-bounce" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-900 mb-4">
            Back Online! 🎉
          </h1>
          <p className="text-warm-600 mb-4">
            Reconnecting you to Breath of Now...
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-warm-200 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-warm-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-warm-900 mb-4">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-warm-600 mb-8 leading-relaxed">
          Don&apos;t worry! Your data is safely stored locally. You can continue using
          <span className="font-semibold text-primary-600"> Breath of Now </span>
          offline. Any changes will sync automatically when you&apos;re back online.
        </p>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 mb-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-warm-700">Connection Status</span>
            <span className="flex items-center gap-2 text-sm text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Offline
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-green-600" />
              </div>
              <span>Your data is safe locally</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span>All features available offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-600">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-green-600" />
              </div>
              <span>Auto-sync when back online</span>
            </div>
          </div>
        </div>

        {/* Quick Access to Cached Apps */}
        <div className="mb-6">
          <p className="text-sm font-medium text-warm-700 mb-3">Continue where you left off:</p>
          
          {isCheckingCache ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => navigateToApp(app.path)}
                  className={`flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all relative ${
                    app.isCached 
                      ? 'cursor-pointer hover:scale-105' 
                      : 'opacity-60 cursor-pointer'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${app.iconBg} flex items-center justify-center`}>
                    {app.icon}
                  </div>
                  <span className="text-xs font-medium text-warm-700">{app.name}</span>
                  {!app.isCached && (
                    <div className="absolute -top-1 -right-1">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {!isCheckingCache && apps.some(app => !app.isCached) && (
            <p className="mt-3 text-xs text-warm-500">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Apps with ⚠️ may need internet access to load the first time
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking connection...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Try Again
              </>
            )}
          </button>

          <button
            onClick={() => navigateToApp(`/${locale}`)}
            className="w-full px-6 py-3 bg-warm-200 hover:bg-warm-300 text-warm-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>
        </div>

        {/* PWA Tip */}
        <p className="mt-6 text-sm text-warm-500">
          💡 Tip: Install this app on your device for the best offline experience
        </p>
      </div>
    </div>
  );
}
