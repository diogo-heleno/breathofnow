'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';
import { WifiOff, Wifi, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ConnectivityStatus() {
  const { isOnline, updateAvailable, updateServiceWorker } = useServiceWorker();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Mostrar banner quando ficar offline
    if (!isOnline) {
      setShowBanner(true);
    } else {
      // Esconder após 3 segundos quando voltar online
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Não mostrar nada se online e sem atualizações
  if (isOnline && !updateAvailable && !showBanner) {
    return null;
  }

  return (
    <>
      {/* Banner de status de conectividade */}
      {showBanner && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-soft-lg flex items-center gap-3 animate-fade-in-up ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-warm-800 text-white'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Back online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">You're offline</span>
            </>
          )}
        </div>
      )}

      {/* Banner de atualização disponível */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent-500 text-white px-4 py-3 rounded-lg shadow-soft-lg flex items-center gap-3 animate-fade-in-down">
          <Download className="w-5 h-5" />
          <span className="font-medium">Update available</span>
          <button
            onClick={updateServiceWorker}
            className="ml-2 px-3 py-1 bg-white text-accent-600 rounded-md text-sm font-medium hover:bg-warm-50 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}
    </>
  );
}
