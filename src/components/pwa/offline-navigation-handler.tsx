'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * OfflineNavigationHandler
 *
 * This component handles the offline navigation problem in Next.js App Router.
 *
 * Problem: Next.js uses RSC (React Server Components) for client-side navigation.
 * When offline, RSC requests fail and cause the page to go blank.
 *
 * Solution: When offline, intercept link clicks and force full page navigation
 * instead of client-side navigation. Full page loads work because they're
 * served from the service worker cache.
 */
export function OfflineNavigationHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const isOfflineRef = useRef(false);

  // Update offline status
  useEffect(() => {
    const updateStatus = () => {
      isOfflineRef.current = !navigator.onLine;
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // Handle navigation when offline
  const handleClick = useCallback((e: MouseEvent) => {
    // Only handle when offline
    if (!isOfflineRef.current) return;

    // Find the closest anchor element
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');

    if (!anchor) return;

    // Get the href
    const href = anchor.getAttribute('href');
    if (!href) return;

    // Skip external links
    if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
      return;
    }

    // Skip hash links
    if (href.startsWith('#')) return;

    // Skip download links
    if (anchor.hasAttribute('download')) return;

    // Skip links with target="_blank"
    if (anchor.getAttribute('target') === '_blank') return;

    // Skip links that are already being handled by other means
    if (e.defaultPrevented) return;

    // Check if this is an internal navigation link (Next.js Link component)
    // Next.js Link uses data-* attributes or specific classes
    const isNextLink = anchor.closest('[data-next-link]') !== null;

    // Also check for typical Next.js link patterns
    const isInternalPath = href.startsWith('/') || href.startsWith('.');

    if (isNextLink || isInternalPath) {
      // Prevent Next.js client-side navigation
      e.preventDefault();
      e.stopPropagation();

      // Get absolute URL
      const absoluteUrl = new URL(href, window.location.origin).href;

      // Check if it's the same page
      if (absoluteUrl === window.location.href) {
        return;
      }

      // Force full page navigation
      console.warn('[Offline] Forcing full page navigation to:', href);
      window.location.href = href;
    }
  }, []);

  // Handle fetch errors that might indicate RSC failure
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if we're offline and the error might be from RSC
      if (isOfflineRef.current) {
        const errorMessage = event.message?.toLowerCase() || '';
        const isNetworkError =
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('failed to load');

        if (isNetworkError) {
          console.warn('[Offline] Network error detected, page may need reload');
          // Don't auto-reload as it might cause loops
          // The error boundary will handle this
        }
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Handle unhandled promise rejections (RSC fetch failures)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isOfflineRef.current) {
        const reason = event.reason?.toString()?.toLowerCase() || '';
        const isRSCError =
          reason.includes('failed to fetch') ||
          reason.includes('network') ||
          reason.includes('rsc');

        if (isRSCError) {
          console.warn('[Offline] RSC fetch failed, forcing page reload');
          // Prevent the error from propagating
          event.preventDefault();
          // Reload to get cached version
          window.location.reload();
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Add click listener with capture to intercept before Next.js
  useEffect(() => {
    // Use capture phase to intercept before React/Next.js handlers
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [handleClick]);

  // No visual output
  return null;
}
