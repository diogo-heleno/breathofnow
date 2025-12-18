'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isOnline: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
}

/**
 * Hook for Service Worker status and online/offline detection
 * Note: Registration is handled automatically by next-pwa
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInstalled: false,
    updateAvailable: false,
  });

  useEffect(() => {
    // Check if SW is installed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setState((prev) => ({ ...prev, isInstalled: true }));

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });
      });
    }

    // Connectivity listeners
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));

      // Trigger background sync when back online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
          .then((registration) => {
            const reg = registration as ServiceWorkerRegistration & {
              sync: { register: (tag: string) => Promise<void> };
            };
            return reg.sync?.register('sync-data');
          })
          .catch(console.error);
      }
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to activate SW update
  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }, []);

  return {
    ...state,
    updateServiceWorker,
  };
}
