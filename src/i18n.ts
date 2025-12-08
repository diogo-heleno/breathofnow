import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'pt', 'pt-BR', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale labels for display
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  pt: 'Português (PT)',
  'pt-BR': 'Português (BR)',
  es: 'Español',
  fr: 'Français',
};

// Locale flags for display
export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  pt: '🇵🇹',
  'pt-BR': '🇧🇷',
  es: '🇪🇸',
  fr: '🇫🇷',
};

// Region pricing tiers
export const regionPricing: Record<string, { tier: 'high' | 'medium' | 'low'; currency: string; symbol: string }> = {
  // High tier - US, UK, Germany, etc.
  US: { tier: 'high', currency: 'USD', symbol: '$' },
  GB: { tier: 'high', currency: 'GBP', symbol: '£' },
  DE: { tier: 'high', currency: 'EUR', symbol: '€' },
  FR: { tier: 'high', currency: 'EUR', symbol: '€' },
  CH: { tier: 'high', currency: 'CHF', symbol: 'CHF' },
  
  // Medium tier - Portugal, Spain, Italy, etc.
  PT: { tier: 'medium', currency: 'EUR', symbol: '€' },
  ES: { tier: 'medium', currency: 'EUR', symbol: '€' },
  IT: { tier: 'medium', currency: 'EUR', symbol: '€' },
  
  // Low tier - Brazil, Angola, etc.
  BR: { tier: 'low', currency: 'BRL', symbol: 'R$' },
  AO: { tier: 'low', currency: 'AOA', symbol: 'Kz' },
  MZ: { tier: 'low', currency: 'MZN', symbol: 'MT' },
  
  // Default
  default: { tier: 'medium', currency: 'EUR', symbol: '€' },
};

// Price multipliers by tier
export const priceMultipliers: Record<'high' | 'medium' | 'low', number> = {
  high: 1,
  medium: 0.6,
  low: 0.3,
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
