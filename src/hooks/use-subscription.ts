/**
 * useSubscription Hook
 * 
 * Simplified subscription management following v4 architecture
 * Two tiers: Free vs Pro
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getUserSubscription,
  getSelectedApps,
  saveSelectedApps,
  hasAppAccess,
  isCloudSyncEnabled,
  shouldShowAds,
  getMaxApps,
  TIER_FEATURES,
  type SubscriptionTier,
  type AppId,
  type UserSubscription,
  type TierFeatures,
} from '@/lib/subscription';

interface UseSubscriptionReturn {
  // State
  subscription: UserSubscription;
  tier: SubscriptionTier;
  features: TierFeatures;
  selectedApps: AppId[];
  isLoading: boolean;
  
  // Computed
  isPro: boolean;
  canSync: boolean;
  showAds: boolean;
  maxApps: number;
  
  // Actions
  checkAppAccess: (appId: AppId) => boolean;
  selectApp: (appId: AppId) => Promise<void>;
  deselectApp: (appId: AppId) => Promise<void>;
  setSelectedApps: (apps: AppId[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription>({ tier: 'free' });
  const [selectedApps, setSelectedAppsState] = useState<AppId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription and selected apps
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sub, apps] = await Promise.all([
        getUserSubscription(),
        getSelectedApps(),
      ]);
      setSubscription(sub);
      setSelectedAppsState(apps);
    } catch (error) {
      console.error('[useSubscription] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for auth changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [loadData]);

  // Computed values
  const tier = subscription.tier;
  const features = TIER_FEATURES[tier];
  const isPro = tier === 'pro';
  const canSync = isCloudSyncEnabled(subscription);
  const showAds = shouldShowAds(subscription);
  const maxApps = getMaxApps(subscription);

  // Check if user has access to a specific app
  const checkAppAccess = useCallback((appId: AppId): boolean => {
    // Pro users have access to everything
    if (isPro) return true;
    
    // Check if app is in selected apps (respecting max limit)
    const effectiveApps = selectedApps.slice(0, maxApps);
    return effectiveApps.includes(appId);
  }, [isPro, selectedApps, maxApps]);

  // Select an app
  const selectApp = useCallback(async (appId: AppId) => {
    if (selectedApps.includes(appId)) return;
    
    // Check if user can add more apps
    if (!isPro && selectedApps.length >= maxApps) {
      // Remove oldest app if at limit
      const newApps = [...selectedApps.slice(1), appId];
      await saveSelectedApps(newApps);
      setSelectedAppsState(newApps);
    } else {
      const newApps = [...selectedApps, appId];
      await saveSelectedApps(newApps);
      setSelectedAppsState(newApps);
    }
  }, [selectedApps, isPro, maxApps]);

  // Deselect an app
  const deselectApp = useCallback(async (appId: AppId) => {
    if (!selectedApps.includes(appId)) return;
    
    const newApps = selectedApps.filter(id => id !== appId);
    await saveSelectedApps(newApps);
    setSelectedAppsState(newApps);
  }, [selectedApps]);

  // Set all selected apps at once
  const setSelectedApps = useCallback(async (apps: AppId[]) => {
    // Respect max apps limit for free users
    const effectiveApps = isPro ? apps : apps.slice(0, maxApps);
    await saveSelectedApps(effectiveApps);
    setSelectedAppsState(effectiveApps);
  }, [isPro, maxApps]);

  // Refresh subscription data
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    subscription,
    tier,
    features,
    selectedApps,
    isLoading,
    isPro,
    canSync,
    showAds,
    maxApps,
    checkAppAccess,
    selectApp,
    deselectApp,
    setSelectedApps,
    refresh,
  };
}

/**
 * Simple hook to check if ads should be shown
 */
export function useShowAds(): boolean {
  const { showAds, isLoading } = useSubscription();
  
  // Don't show ads while loading to avoid flicker
  if (isLoading) return false;
  
  return showAds;
}

/**
 * Hook to check if user can use cloud sync
 */
export function useCanSync(): boolean {
  const { canSync, isLoading } = useSubscription();
  
  if (isLoading) return false;
  
  return canSync;
}

/**
 * Hook to check app access
 */
export function useAppAccess(appId: AppId): {
  hasAccess: boolean;
  isLoading: boolean;
  tier: SubscriptionTier;
} {
  const { checkAppAccess, isLoading, tier } = useSubscription();
  
  return {
    hasAccess: checkAppAccess(appId),
    isLoading,
    tier,
  };
}
