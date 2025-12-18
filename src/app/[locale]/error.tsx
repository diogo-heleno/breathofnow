'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, WifiOff, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if we're offline
    setIsOffline(!navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Log error for debugging
    console.error('[Error Boundary]', error);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  // Handle retry - if offline, do a full page reload instead of reset
  const handleRetry = () => {
    if (isOffline) {
      // Force full page reload from cache
      window.location.reload();
    } else {
      reset();
    }
  };

  // Go home with full page navigation
  const handleGoHome = () => {
    const locale = window.location.pathname.split('/')[1] || 'en';
    window.location.href = `/${locale}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-soft-lg p-8 text-center">
        <div
          className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isOffline ? 'bg-amber-100' : 'bg-red-100'
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-8 h-8 text-amber-600" />
          ) : (
            <AlertCircle className="w-8 h-8 text-red-600" />
          )}
        </div>

        <h1 className="text-2xl font-display font-bold text-warm-900 mb-3">
          {isOffline ? t('offlineTitle') : t('title')}
        </h1>

        <p className="text-warm-600 mb-6 leading-relaxed">
          {isOffline ? t('offlineDescription') : t('description')}
        </p>

        {isOffline && (
          <div className="bg-amber-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-800">
              <strong>{t('offlineNote')}</strong>
              <br />
              {t('offlineNoteDescription')}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>

          <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            {t('goHome')}
          </Button>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-warm-500 cursor-pointer">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-warm-100 rounded-lg text-xs overflow-auto">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
