/**
 * Subscription Store
 * 
 * Gere o estado de subscrição do utilizador
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'starter' | 'plus' | 'pro' | 'founding';

interface TierFeatures {
  cloudSync: boolean;
  googleDrive: boolean;
  prioritySupport: boolean;
  noAds: boolean;
  maxTransactions: number | null; // null = unlimited
  maxCategories: number | null;
}

const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    cloudSync: false,
    googleDrive: false,
    prioritySupport: false,
    noAds: false,
    maxTransactions: 100,
    maxCategories: 10,
  },
  starter: {
    cloudSync: true,
    googleDrive: false,
    prioritySupport: false,
    noAds: true,
    maxTransactions: 1000,
    maxCategories: 25,
  },
  plus: {
    cloudSync: true,
    googleDrive: true,
    prioritySupport: false,
    noAds: true,
    maxTransactions: null,
    maxCategories: null,
  },
  pro: {
    cloudSync: true,
    googleDrive: true,
    prioritySupport: true,
    noAds: true,
    maxTransactions: null,
    maxCategories: null,
  },
  founding: {
    cloudSync: true,
    googleDrive: true,
    prioritySupport: true,
    noAds: true,
    maxTransactions: null,
    maxCategories: null,
  },
};

interface SubscriptionState {
  currentTier: SubscriptionTier;
  isFoundingMember: boolean;
  expiresAt: string | null;
  customMonthlyPrice: number | null;
  
  // Actions
  setTier: (tier: SubscriptionTier) => void;
  setFoundingMember: (isFounder: boolean) => void;
  setExpiresAt: (date: string | null) => void;
  setCustomPrice: (price: number | null) => void;
  
  // Feature checks
  canUseCloudSync: () => boolean;
  canUseGoogleDrive: () => boolean;
  hasPrioritySupport: () => boolean;
  hasAds: () => boolean;
  getMaxTransactions: () => number | null;
  getMaxCategories: () => number | null;
  getFeatures: () => TierFeatures;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentTier: 'free',
      isFoundingMember: false,
      expiresAt: null,
      customMonthlyPrice: null,
      
      setTier: (tier) => set({ currentTier: tier }),
      setFoundingMember: (isFounder) => set({ 
        isFoundingMember: isFounder,
        currentTier: isFounder ? 'founding' : get().currentTier,
      }),
      setExpiresAt: (date) => set({ expiresAt: date }),
      setCustomPrice: (price) => set({ customMonthlyPrice: price }),
      
      canUseCloudSync: () => {
        const tier = get().currentTier;
        return TIER_FEATURES[tier].cloudSync;
      },
      
      canUseGoogleDrive: () => {
        const tier = get().currentTier;
        return TIER_FEATURES[tier].googleDrive;
      },
      
      hasPrioritySupport: () => {
        const tier = get().currentTier;
        return TIER_FEATURES[tier].prioritySupport;
      },
      
      hasAds: () => {
        const tier = get().currentTier;
        return !TIER_FEATURES[tier].noAds;
      },
      
      getMaxTransactions: () => {
        const tier = get().currentTier;
        return TIER_FEATURES[tier].maxTransactions;
      },
      
      getMaxCategories: () => {
        const tier = get().currentTier;
        return TIER_FEATURES[tier].maxCategories;
      },
      
      getFeatures: () => {
        const tier = get().currentTier;
        return TIER_FEATURES[tier];
      },
    }),
    {
      name: 'breathofnow-subscription',
      partialize: (state) => ({
        currentTier: state.currentTier,
        isFoundingMember: state.isFoundingMember,
        expiresAt: state.expiresAt,
        customMonthlyPrice: state.customMonthlyPrice,
      }),
    }
  )
);

// Pricing Store (para página de pricing)
interface PricingState {
  // Preços base (EUR)
  baseMonthlyPrice: number;
  baseYearlyPrice: number;
  baseLifetimePrice: number;
  
  // Preços regionais sugeridos
  suggestedMonthly: number;
  suggestedYearly: number;
  suggestedLifetime: number;
  
  // Preços personalizados (PWYW)
  customMonthly: number | null;
  customYearly: number | null;
  customLifetime: number | null;
  
  // Tier de preço baseado em região
  priceTier: 'high' | 'medium' | 'low';
  
  // Actions
  setPriceTier: (tier: 'high' | 'medium' | 'low') => void;
  setCustomMonthly: (price: number | null) => void;
  setCustomYearly: (price: number | null) => void;
  setCustomLifetime: (price: number | null) => void;
  setSuggestedPrices: (monthly: number, yearly: number, lifetime: number) => void;
  
  // Getters
  getEffectiveMonthly: () => number;
  getEffectiveYearly: () => number;
  getEffectiveLifetime: () => number;
}

const PRICE_MULTIPLIERS = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
};

export const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      // Preços base em EUR
      baseMonthlyPrice: 4.99,
      baseYearlyPrice: 39.99,
      baseLifetimePrice: 599,
      
      // Preços sugeridos (calculados com base na região)
      suggestedMonthly: 4.99,
      suggestedYearly: 39.99,
      suggestedLifetime: 599,
      
      // Preços personalizados
      customMonthly: null,
      customYearly: null,
      customLifetime: null,
      
      priceTier: 'medium',
      
      setPriceTier: (tier) => {
        const state = get();
        const multiplier = PRICE_MULTIPLIERS[tier];
        set({
          priceTier: tier,
          suggestedMonthly: Math.round(state.baseMonthlyPrice * multiplier * 100) / 100,
          suggestedYearly: Math.round(state.baseYearlyPrice * multiplier * 100) / 100,
          suggestedLifetime: Math.round(state.baseLifetimePrice * multiplier),
        });
      },
      
      setCustomMonthly: (price) => set({ customMonthly: price }),
      setCustomYearly: (price) => set({ customYearly: price }),
      setCustomLifetime: (price) => set({ customLifetime: price }),
      
      setSuggestedPrices: (monthly, yearly, lifetime) => set({
        suggestedMonthly: monthly,
        suggestedYearly: yearly,
        suggestedLifetime: lifetime,
      }),
      
      getEffectiveMonthly: () => {
        const state = get();
        return state.customMonthly ?? state.suggestedMonthly;
      },
      
      getEffectiveYearly: () => {
        const state = get();
        return state.customYearly ?? state.suggestedYearly;
      },
      
      getEffectiveLifetime: () => {
        const state = get();
        return state.customLifetime ?? state.suggestedLifetime;
      },
    }),
    {
      name: 'breathofnow-pricing',
      partialize: (state) => ({
        priceTier: state.priceTier,
        customMonthly: state.customMonthly,
        customYearly: state.customYearly,
        customLifetime: state.customLifetime,
      }),
    }
  )
);
