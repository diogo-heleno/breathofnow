// lib/fair-pricing.ts
// Regional pricing based on cost of living

export type PricingTier = {
  id: string;
  name: string;
  factor: number; // 1.0 = full price, 0.5 = 50% of price
  countries: string[]; // ISO country codes
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'tier-1',
    name: 'High Income',
    factor: 1.0,
    countries: ['US', 'CH', 'NO', 'LU', 'IE', 'DK', 'IS', 'SG', 'QA', 'AE'],
  },
  {
    id: 'tier-2',
    name: 'Upper Middle',
    factor: 0.8,
    countries: [
      'DE', 'GB', 'FR', 'NL', 'BE', 'AT', 'FI', 'SE', 'AU', 'CA',
      'JP', 'KR', 'IT', 'ES', 'NZ',
    ],
  },
  {
    id: 'tier-3',
    name: 'Middle',
    factor: 0.6,
    countries: [
      'PT', 'PL', 'CZ', 'GR', 'HU', 'SK', 'HR', 'RO', 'BG', 'CL',
      'UY', 'CR', 'PA', 'MX', 'MY', 'TH',
    ],
  },
  {
    id: 'tier-4',
    name: 'Lower Middle',
    factor: 0.4,
    countries: [
      'BR', 'AR', 'CO', 'PE', 'ZA', 'TR', 'RU', 'UA', 'CN', 'ID',
      'PH', 'VN', 'EG', 'MA',
    ],
  },
  {
    id: 'tier-5',
    name: 'Low Income',
    factor: 0.25,
    countries: [
      'IN', 'BD', 'PK', 'NG', 'KE', 'GH', 'ET', 'TZ', 'UG', 'NP',
      'MM', 'KH', 'LA', 'AO', 'MZ', 'CV',
    ],
  },
];

// Base prices in EUR
export const BASE_PRICES = {
  starter: {
    monthly: 2.99,
    yearly: 29.90,
  },
  plus: {
    monthly: 4.99,
    yearly: 49.90,
  },
  pro: {
    monthly: 9.99,
    yearly: 99.90,
  },
  founding: {
    lifetime: 599,
  },
};

// Find tier by country
export function getTierByCountry(countryCode: string): PricingTier {
  const tier = PRICING_TIERS.find((t) =>
    t.countries.includes(countryCode.toUpperCase())
  );
  // Default: tier-3 (middle) if country not found
  return tier || PRICING_TIERS[2];
}

// Calculate adjusted price
export function getFairPrice(
  basePrice: number,
  countryCode: string
): {
  originalPrice: number;
  fairPrice: number;
  discount: number;
  tier: PricingTier;
} {
  const tier = getTierByCountry(countryCode);
  const fairPrice = Math.round(basePrice * tier.factor * 100) / 100;
  const discount = Math.round((1 - tier.factor) * 100);

  return {
    originalPrice: basePrice,
    fairPrice,
    discount,
    tier,
  };
}

// Get all prices for a country
export function getAllPrices(countryCode: string) {
  const tier = getTierByCountry(countryCode);
  
  return {
    tier: {
      id: tier.id,
      name: tier.name,
      factor: tier.factor,
    },
    starter: {
      monthly: getFairPrice(BASE_PRICES.starter.monthly, countryCode),
      yearly: getFairPrice(BASE_PRICES.starter.yearly, countryCode),
    },
    plus: {
      monthly: getFairPrice(BASE_PRICES.plus.monthly, countryCode),
      yearly: getFairPrice(BASE_PRICES.plus.yearly, countryCode),
    },
    pro: {
      monthly: getFairPrice(BASE_PRICES.pro.monthly, countryCode),
      yearly: getFairPrice(BASE_PRICES.pro.yearly, countryCode),
    },
    founding: {
      lifetime: getFairPrice(BASE_PRICES.founding.lifetime, countryCode),
    },
  };
}

// Format price with currency
export function formatFairPrice(
  price: number,
  locale: string = 'en',
  currency: string = 'EUR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}
