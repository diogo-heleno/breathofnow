import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Domain configuration
export const DOMAINS = {
  www: 'https://www.breathofnow.site',
  app: 'https://app.breathofnow.site',
} as const;

/**
 * Check if we're in a development/preview environment
 */
function isDevelopment(): boolean {
  // Server-side check
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    return true;
  }

  // Client-side check
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('vercel.app')) {
      return true;
    }
  }

  return false;
}

/**
 * Get the URL for the app subdomain
 * In development, returns relative paths
 * In production, returns absolute URLs to app.breathofnow.site
 */
export function getAppUrl(path: string = '/'): string {
  if (isDevelopment()) {
    return path;
  }
  return `${DOMAINS.app}${path}`;
}

/**
 * Get the URL for the www subdomain
 * In development, returns relative paths
 * In production, returns absolute URLs to www.breathofnow.site
 */
export function getWwwUrl(path: string = '/'): string {
  if (isDevelopment()) {
    return path;
  }
  return `${DOMAINS.www}${path}`;
}

/**
 * Check if we're on the app subdomain
 */
export function isAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.host.startsWith('app.');
}

/**
 * Check if we're on the www subdomain
 */
export function isWwwSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.host;
  return host.startsWith('www.') || (!host.startsWith('app.') && host.includes('breathofnow'));
}
