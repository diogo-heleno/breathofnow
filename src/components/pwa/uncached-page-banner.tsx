'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WifiOff, X, RefreshCw, Home } from 'lucide-react';
import { useServiceWorker } from '@/hooks/use-service-worker';

export function UncachedPageBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOnline } = useServiceWorker();
  const [isVisible, setIsVisible] = useState(false);
  const [originalPath, setOriginalPath] = useState<string | null>(null);

  useEffect(() => {
    const offline = searchParams.get('offline');
    const path = searchParams.get('path');

    if (offline === 'uncached' && path) {
      setOriginalPath(decodeURIComponent(path));
      setIsVisible(true);
    }
  }, [searchParams]);

  // When back online, try to navigate to the original page
  useEffect(() => {
    if (isOnline && originalPath && isVisible) {
      const timer = setTimeout(() => {
        router.push(originalPath);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, originalPath, isVisible, router]);

  const handleRetry = () => {
    if (originalPath) {
      window.location.href = originalPath;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Clean up URL params
    router.replace('/');
  };

  if (!isVisible) {
    return null;
  }

  // If back online, show reconnecting message
  if (isOnline) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <h2 className="font-display text-xl font-bold text-neutral-900 mb-2">
            De volta online!
          </h2>
          <p className="text-neutral-600 mb-4">
            A redirecionar para a página solicitada...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <WifiOff className="w-8 h-8 text-amber-600" />
        </div>

        {/* Title */}
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-2 text-center">
          Estás offline
        </h2>

        {/* Description */}
        <p className="text-neutral-600 text-center mb-4">
          A página que tentaste aceder ainda não foi carregada enquanto estavas online.
        </p>

        {/* Path info */}
        {originalPath && (
          <div className="bg-neutral-100 rounded-lg p-3 mb-6">
            <p className="text-sm text-neutral-500 mb-1">Página solicitada:</p>
            <code className="text-sm font-mono text-neutral-700 break-all">
              {originalPath}
            </code>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>Dica:</strong> As páginas que visitares enquanto estiveres online
            ficarão disponíveis offline automaticamente.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar novamente
          </button>
          <button
            onClick={handleDismiss}
            className="w-full px-4 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Continuar na Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
