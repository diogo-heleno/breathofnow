// Pricing Types and Constants for Breath of Now

// Plan tiers
export type PlanTier = 'free' | 'starter' | 'plus' | 'pro' | 'founding';

// Billing periods
export type BillingPeriod = 'monthly' | 'yearly';

// App identifiers
export type AppId =
  | 'expense-flow'
  | 'invest-track'
  | 'fit-log'
  | 'strava-sync'
  | 'recipe-box'
  | 'label-scan';

// Storage types
export type StorageType = 'local' | 'google-drive' | 'cloud';

// App status
export type AppStatus = 'available' | 'beta' | 'coming-soon';

// App definition
export interface App {
  id: AppId;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  status: AppStatus;
  color: string;
}

// Plan features
export interface PlanFeatures {
  appsIncluded: number | 'all';
  canChooseApps: boolean;
  storageOptions: StorageType[];
  hasAds: boolean;
  hasPrioritySupport: boolean;
  hasFoundingBadge: boolean;
  hasEarlyAccess: boolean;
}

// Plan definition
export interface Plan {
  id: PlanTier;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  lifetimePrice: number | null;
  features: PlanFeatures;
  featureList: string[];
  featureListKeys: string[];
  isPopular?: boolean;
  isLimited?: boolean;
  limitedSpots?: number;
  ctaKey: string;
}

// Apps available in the ecosystem
export const APPS: App[] = [
  {
    id: 'expense-flow',
    name: 'ExpenseFlow',
    nameKey: 'apps.expenseFlow.name',
    description: 'Mindful money tracking',
    descriptionKey: 'apps.expenseFlow.description',
    icon: 'Wallet',
    status: 'available',
    color: '#22c55e',
  },
  {
    id: 'invest-track',
    name: 'InvestTrack',
    nameKey: 'apps.investTrack.name',
    description: 'Your portfolio, your way',
    descriptionKey: 'apps.investTrack.description',
    icon: 'TrendingUp',
    status: 'beta',
    color: '#3b82f6',
  },
  {
    id: 'fit-log',
    name: 'FitLog',
    nameKey: 'apps.fitLog.name',
    description: 'Every rep counts',
    descriptionKey: 'apps.fitLog.description',
    icon: 'Dumbbell',
    status: 'available',
    color: '#f97316',
  },
  {
    id: 'strava-sync',
    name: 'StravaSync',
    nameKey: 'apps.stravaSync.name',
    description: 'Your runs, enhanced',
    descriptionKey: 'apps.stravaSync.description',
    icon: 'Bike',
    status: 'coming-soon',
    color: '#ec4899',
  },
  {
    id: 'recipe-box',
    name: 'RecipeBox',
    nameKey: 'apps.recipeBox.name',
    description: 'Your digital cookbook',
    descriptionKey: 'apps.recipeBox.description',
    icon: 'ChefHat',
    status: 'coming-soon',
    color: '#8b5cf6',
  },
  {
    id: 'label-scan',
    name: 'LabelScan',
    nameKey: 'apps.labelScan.name',
    description: 'Know what you eat',
    descriptionKey: 'apps.labelScan.description',
    icon: 'ScanLine',
    status: 'coming-soon',
    color: '#14b8a6',
  },
];

// Pricing plans
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    nameKey: 'pricing.plans.free.name',
    description: 'Perfect for trying out all our apps',
    descriptionKey: 'pricing.plans.free.description',
    icon: 'Zap',
    monthlyPrice: 0,
    yearlyPrice: 0,
    lifetimePrice: null,
    features: {
      appsIncluded: 'all',
      canChooseApps: false,
      storageOptions: ['local'],
      hasAds: true,
      hasPrioritySupport: false,
      hasFoundingBadge: false,
      hasEarlyAccess: false,
    },
    featureList: [
      'Access to all apps with basic features',
      'Local storage only',
      'Discrete ad banners',
      'Community support',
    ],
    featureListKeys: [
      'pricing.plans.free.features.allApps',
      'pricing.plans.free.features.localStorage',
      'pricing.plans.free.features.ads',
      'pricing.plans.free.features.communitySupport',
    ],
    ctaKey: 'pricing.plans.free.cta',
  },
  {
    id: 'starter',
    name: 'Starter',
    nameKey: 'pricing.plans.starter.name',
    description: 'Focus on what matters most',
    descriptionKey: 'pricing.plans.starter.description',
    icon: 'Star',
    monthlyPrice: 1.99,
    yearlyPrice: 19.90,
    lifetimePrice: null,
    features: {
      appsIncluded: 1,
      canChooseApps: true,
      storageOptions: ['local', 'google-drive'],
      hasAds: false,
      hasPrioritySupport: false,
      hasFoundingBadge: false,
      hasEarlyAccess: false,
    },
    featureList: [
      '1 app of your choice',
      'Local + Google Drive backup',
      'Ad-free experience',
      'Email support',
    ],
    featureListKeys: [
      'pricing.plans.starter.features.oneApp',
      'pricing.plans.starter.features.googleDrive',
      'pricing.plans.starter.features.noAds',
      'pricing.plans.starter.features.emailSupport',
    ],
    ctaKey: 'pricing.plans.starter.cta',
  },
  {
    id: 'plus',
    name: 'Plus',
    nameKey: 'pricing.plans.plus.name',
    description: 'Best value for most users',
    descriptionKey: 'pricing.plans.plus.description',
    icon: 'Sparkles',
    monthlyPrice: 3.99,
    yearlyPrice: 39.90,
    lifetimePrice: null,
    features: {
      appsIncluded: 3,
      canChooseApps: true,
      storageOptions: ['local', 'google-drive', 'cloud'],
      hasAds: false,
      hasPrioritySupport: false,
      hasFoundingBadge: false,
      hasEarlyAccess: false,
    },
    featureList: [
      '3 apps of your choice',
      'Local + Google Drive + Cloud sync',
      'Ad-free experience',
      'Priority email support',
    ],
    featureListKeys: [
      'pricing.plans.plus.features.threeApps',
      'pricing.plans.plus.features.cloudSync',
      'pricing.plans.plus.features.noAds',
      'pricing.plans.plus.features.priorityEmail',
    ],
    isPopular: true,
    ctaKey: 'pricing.plans.plus.cta',
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKey: 'pricing.plans.pro.name',
    description: 'Everything, unlimited',
    descriptionKey: 'pricing.plans.pro.description',
    icon: 'Shield',
    monthlyPrice: 9.99,
    yearlyPrice: 99.90,
    lifetimePrice: null,
    features: {
      appsIncluded: 'all',
      canChooseApps: false,
      storageOptions: ['local', 'google-drive', 'cloud'],
      hasAds: false,
      hasPrioritySupport: true,
      hasFoundingBadge: false,
      hasEarlyAccess: false,
    },
    featureList: [
      'All apps included',
      'Local + Google Drive + Cloud sync',
      'Ad-free experience',
      'Priority support',
      'Early access to new features',
    ],
    featureListKeys: [
      'pricing.plans.pro.features.allApps',
      'pricing.plans.pro.features.cloudSync',
      'pricing.plans.pro.features.noAds',
      'pricing.plans.pro.features.prioritySupport',
      'pricing.plans.pro.features.earlyAccess',
    ],
    ctaKey: 'pricing.plans.pro.cta',
  },
  {
    id: 'founding',
    name: 'Founding Member',
    nameKey: 'pricing.plans.founding.name',
    description: 'Lifetime access, forever',
    descriptionKey: 'pricing.plans.founding.description',
    icon: 'Crown',
    monthlyPrice: null,
    yearlyPrice: null,
    lifetimePrice: 599,
    features: {
      appsIncluded: 'all',
      canChooseApps: false,
      storageOptions: ['local', 'google-drive', 'cloud'],
      hasAds: false,
      hasPrioritySupport: true,
      hasFoundingBadge: true,
      hasEarlyAccess: true,
    },
    featureList: [
      'Lifetime access to ALL apps',
      'All future versions included (v2, v3...)',
      'Local + Google Drive + Cloud sync',
      'Ad-free experience',
      'Priority support forever',
      'Early access (2 weeks before public)',
      'Exclusive Founding Member badge',
      'Quarterly Q&A with founder',
      'Name in Hall of Fame',
    ],
    featureListKeys: [
      'pricing.plans.founding.features.lifetime',
      'pricing.plans.founding.features.futureVersions',
      'pricing.plans.founding.features.cloudSync',
      'pricing.plans.founding.features.noAds',
      'pricing.plans.founding.features.prioritySupport',
      'pricing.plans.founding.features.earlyAccess',
      'pricing.plans.founding.features.badge',
      'pricing.plans.founding.features.qanda',
      'pricing.plans.founding.features.hallOfFame',
    ],
    isLimited: true,
    limitedSpots: 100,
    ctaKey: 'pricing.plans.founding.cta',
  },
];

// Helper functions
export function getPlanById(id: PlanTier): Plan | undefined {
  return PLANS.find(plan => plan.id === id);
}

export function getAppById(id: AppId): App | undefined {
  return APPS.find(app => app.id === id);
}

export function getAvailableApps(): App[] {
  return APPS.filter(app => app.status !== 'coming-soon');
}

export function formatPrice(price: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(price);
}

export function getYearlySavings(plan: Plan): number {
  if (!plan.monthlyPrice || !plan.yearlyPrice) return 0;
  const monthlyTotal = plan.monthlyPrice * 12;
  return monthlyTotal - plan.yearlyPrice;
}

export function getYearlySavingsPercent(plan: Plan): number {
  if (!plan.monthlyPrice || !plan.yearlyPrice) return 0;
  const monthlyTotal = plan.monthlyPrice * 12;
  return Math.round(((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100);
}
