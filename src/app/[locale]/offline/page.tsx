'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { WifiOff, Home, RefreshCw, HardDrive, CheckCircle, Wallet, Dumbbell, TrendingUp } from 'lucide-react';
import { useServiceWorker } from '@/hooks/use-service-worker';

export default function OfflinePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { isOnline } = useServiceWorker();
  const [isRetrying, setIsRetrying] = useState(false);

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
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-warm-600 mb-8 leading-relaxed">
          Don't worry! Your data is safely stored locally. You can continue using
          <span className="font-semibold text-primary-600"> Breath of Now </span>
          offline. Any changes will sync automatically when you're back online.
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
          <div className="grid grid-cols-3 gap-3">
            <Link
              href={`/${locale}/expenses`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-warm-700">Expenses</span>
            </Link>
            <Link
              href={`/${locale}/fitlog`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-warm-700">FitLog</span>
            </Link>
            <Link
              href={`/${locale}/investments`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-warm-700">Invest</span>
            </Link>
          </div>
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

          <Link
            href={`/${locale}`}
            className="w-full px-6 py-3 bg-warm-200 hover:bg-warm-300 text-warm-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
        </div>

        {/* PWA Tip */}
        <p className="mt-6 text-sm text-warm-500">
          💡 Tip: Install this app on your device for the best offline experience
        </p>
      </div>
    </div>
  );
}
