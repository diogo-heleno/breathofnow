// Currency Service - Frankfurter API Integration
// https://www.frankfurter.app/docs/

import { db } from '@/lib/db';

const FRANKFURTER_API = 'https://api.frankfurter.app';

// Popular currencies with their symbols and names
export const CURRENCIES = {
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  MXN: { symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  PLN: { symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  DKK: { symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  RON: { symbol: 'lei', name: 'Romanian Leu', flag: '🇷🇴' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev', flag: '🇧🇬' },
  TRY: { symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  ZAR: { symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  KRW: { symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  THB: { symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  date: string;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Fetch exchange rate from Frankfurter API
async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  try {
    const response = await fetch(
      `${FRANKFURTER_API}/latest?from=${from}&to=${to}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.rates[to];
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    throw error;
  }
}

// Get exchange rate (with caching)
export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from === to) return 1;

  const today = getTodayDate();

  // Check cache first
  try {
    const cached = await db.exchangeRates
      .where('[fromCurrency+toCurrency+date]')
      .equals([from, to, today])
      .first();

    if (cached) {
      return cached.rate;
    }
  } catch {
    // Cache miss, continue to fetch
  }

  // Fetch from API
  const rate = await fetchExchangeRate(from, to);

  // Cache the result
  try {
    await db.exchangeRates.put({
      fromCurrency: from,
      toCurrency: to,
      rate,
      date: today,
      createdAt: new Date(),
    });
  } catch {
    // Caching failed, but we have the rate
  }

  return rate;
}

// Convert amount between currencies
export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<{ convertedAmount: number; rate: number }> {
  const rate = await getExchangeRate(from, to);
  return {
    convertedAmount: amount * rate,
    rate,
  };
}

// Get all available currencies from Frankfurter
export async function getAvailableCurrencies(): Promise<string[]> {
  try {
    const response = await fetch(`${FRANKFURTER_API}/currencies`);
    if (!response.ok) throw new Error('Failed to fetch currencies');
    const data = await response.json();
    return Object.keys(data);
  } catch {
    // Fallback to our predefined list
    return Object.keys(CURRENCIES);
  }
}

// Format currency amount
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get currency info
export function getCurrencyInfo(code: string) {
  return CURRENCIES[code as CurrencyCode] || {
    symbol: code,
    name: code,
    flag: '🏳️',
  };
}
