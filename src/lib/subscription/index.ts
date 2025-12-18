/**
 * Subscription Management
 * 
 * Simplified tier system: Free vs Pro
 * 
 * Free:
 * - 2 apps
 * - Unlimited local storage
 * - No cloud sync
 * - Ads enabled
 * 
 * Pro (€4.99/month):
 * - All apps
 * - Unlimited local storage
 * - Cloud sync enabled
 * - No ads
 */

import { createClient } from '@/lib/supabase/client';

// Types
export type SubscriptionTier = 'free' | 'pro';

export interface UserSubscription {
  tier: SubscriptionTier;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface TierFeatures {
  name: string;
  price: number; // Monthly price in EUR
  maxApps: number;
  cloudSync: boolean;
  adsEnabled: boolean;
  features: string[];
}

// Tier definitions
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    name: 'Free',
    price: 0,
    maxApps: 2,
    cloudSync: false,
    adsEnabled: true,
    features: [
      '2 apps of your choice',
      'Unlimited local storage',
      'Works offline',
      'Privacy-first data',
    ],
  },
  pro: {
    name: 'Pro',
    price: 4.99,
    maxApps: Infinity,
    cloudSync: true,
    adsEnabled: false,
    features: [
      'All apps included',
      'Unlimited local storage',
      'Cloud sync across devices',
      'No ads',
      'Priority support',
      'Early access to new apps',
    ],
  },
};

// Available apps
export const AVAILABLE_APPS = [
  { id: 'expenses', name: 'ExpenseFlow', status: 'available' as const },
  { id: 'investments', name: 'InvestTrack', status: 'beta' as const },
  { id: 'fitlog', name: 'FitLog', status: 'available' as const },
  { id: 'strava', name: 'StravaSync', status: 'coming-soon' as const },
  { id: 'recipes', name: 'RecipeBox', status: 'coming-soon' as const },
  { id: 'labels', name: 'LabelScan', status: 'coming-soon' as const },
] as const;

export type AppId = typeof AVAILABLE_APPS[number]['id'];
export type AppStatus = 'available' | 'beta' | 'coming-soon';

/**
 * Get user's current subscription tier from Supabase
 */
export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { tier: 'free' };
  }

  try {
    // Get profile with subscription info
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier, subscription_id, subscription_end')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      return { tier: 'free' };
    }

    const tier = (profile.tier as SubscriptionTier) || 'free';
    
    return {
      tier,
      stripeSubscriptionId: profile.subscription_id || undefined,
      currentPeriodEnd: profile.subscription_end 
        ? new Date(profile.subscription_end) 
        : undefined,
    };
  } catch (error) {
    console.error('[Subscription] Error getting user subscription:', error);
    return { tier: 'free' };
  }
}

/**
 * Check if user has access to a specific app
 */
export async function hasAppAccess(
  appId: AppId,
  selectedApps: AppId[],
  subscription: UserSubscription
): Promise<boolean> {
  // Pro users have access to all apps
  if (subscription.tier === 'pro') {
    return true;
  }

  // Free users: check if app is in their selected apps
  const tierFeatures = TIER_FEATURES[subscription.tier];
  
  // Can only use up to maxApps
  if (selectedApps.length > tierFeatures.maxApps) {
    // If they have too many selected, only allow the first N
    return selectedApps.slice(0, tierFeatures.maxApps).includes(appId);
  }

  return selectedApps.includes(appId);
}

/**
 * Check if cloud sync is enabled for user
 */
export function isCloudSyncEnabled(subscription: UserSubscription): boolean {
  return TIER_FEATURES[subscription.tier].cloudSync;
}

/**
 * Check if ads should be shown to user
 */
export function shouldShowAds(subscription: UserSubscription): boolean {
  return TIER_FEATURES[subscription.tier].adsEnabled;
}

/**
 * Get the maximum number of apps user can select
 */
export function getMaxApps(subscription: UserSubscription): number {
  return TIER_FEATURES[subscription.tier].maxApps;
}

/**
 * Calculate yearly price with discount
 */
export function getYearlyPrice(tier: SubscriptionTier, discountPercent = 20): number {
  const monthlyPrice = TIER_FEATURES[tier].price;
  const yearlyBase = monthlyPrice * 12;
  const discount = yearlyBase * (discountPercent / 100);
  return yearlyBase - discount;
}

/**
 * Get user's selected apps from Supabase or localStorage
 */
export async function getSelectedApps(): Promise<AppId[]> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_apps')
        .eq('id', session.user.id)
        .single();

      if (profile?.selected_apps) {
        return profile.selected_apps as AppId[];
      }
    } catch (error) {
      console.error('[Subscription] Error getting selected apps:', error);
    }
  }

  // Fallback to localStorage
  const stored = localStorage.getItem('breathofnow_selected_apps');
  if (stored) {
    try {
      return JSON.parse(stored) as AppId[];
    } catch {
      return [];
    }
  }

  // Default to ExpenseFlow
  return ['expenses'];
}

/**
 * Save user's selected apps
 */
export async function saveSelectedApps(apps: AppId[]): Promise<void> {
  // Always save to localStorage first
  localStorage.setItem('breathofnow_selected_apps', JSON.stringify(apps));

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    try {
      await supabase
        .from('profiles')
        .update({ selected_apps: apps })
        .eq('id', session.user.id);
    } catch (error) {
      console.error('[Subscription] Error saving selected apps:', error);
    }
  }
}

/**
 * Hook-friendly subscription check
 * Returns current subscription state for use in components
 */
export interface SubscriptionState {
  tier: SubscriptionTier;
  features: TierFeatures;
  isLoading: boolean;
  isPro: boolean;
  canSync: boolean;
  showAds: boolean;
  selectedApps: AppId[];
  maxApps: number;
}

/**
 * Get initial subscription state (for use in hooks)
 */
export function getInitialSubscriptionState(): SubscriptionState {
  return {
    tier: 'free',
    features: TIER_FEATURES.free,
    isLoading: true,
    isPro: false,
    canSync: false,
    showAds: true,
    selectedApps: [],
    maxApps: 2,
  };
}
