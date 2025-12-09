import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanTier, BillingPeriod, AppId } from '@/types/pricing';
import { PLANS, APPS, getPlanById } from '@/types/pricing';

// Pricing selection store (for checkout flow)
interface PricingState {
  selectedTier: PlanTier;
  billingPeriod: BillingPeriod;
  selectedApps: AppId[];

  // Actions
  setSelectedTier: (tier: PlanTier) => void;
  setBillingPeriod: (period: BillingPeriod) => void;
  selectApp: (appId: AppId) => void;
  deselectApp: (appId: AppId) => void;
  toggleApp: (appId: AppId) => void;
  clearSelectedApps: () => void;

  // Computed helpers
  canSelectMoreApps: () => boolean;
  getMaxApps: () => number | 'all';
  isAppSelected: (appId: AppId) => boolean;
  getSelectedPlan: () => typeof PLANS[0] | undefined;
  getCurrentPrice: () => number;
}

export const usePricingStore = create<PricingState>()((set, get) => ({
  selectedTier: 'free',
  billingPeriod: 'monthly',
  selectedApps: [],

  setSelectedTier: (tier) => {
    const plan = getPlanById(tier);
    set({
      selectedTier: tier,
      // Clear selected apps if the new plan doesn't allow choosing
      selectedApps: plan?.features.canChooseApps ? get().selectedApps : [],
    });
  },

  setBillingPeriod: (period) => set({ billingPeriod: period }),

  selectApp: (appId) => {
    const state = get();
    const plan = getPlanById(state.selectedTier);
    if (!plan) return;

    const maxApps = plan.features.appsIncluded;
    if (maxApps === 'all') return; // Can't select specific apps

    if (
      !state.selectedApps.includes(appId) &&
      state.selectedApps.length < maxApps
    ) {
      set({ selectedApps: [...state.selectedApps, appId] });
    }
  },

  deselectApp: (appId) => {
    set({ selectedApps: get().selectedApps.filter((id) => id !== appId) });
  },

  toggleApp: (appId) => {
    const state = get();
    if (state.selectedApps.includes(appId)) {
      state.deselectApp(appId);
    } else {
      state.selectApp(appId);
    }
  },

  clearSelectedApps: () => set({ selectedApps: [] }),

  canSelectMoreApps: () => {
    const state = get();
    const plan = getPlanById(state.selectedTier);
    if (!plan) return false;

    const maxApps = plan.features.appsIncluded;
    if (maxApps === 'all') return false;
    return state.selectedApps.length < maxApps;
  },

  getMaxApps: () => {
    const plan = getPlanById(get().selectedTier);
    return plan?.features.appsIncluded ?? 'all';
  },

  isAppSelected: (appId) => get().selectedApps.includes(appId),

  getSelectedPlan: () => getPlanById(get().selectedTier),

  getCurrentPrice: () => {
    const state = get();
    const plan = getPlanById(state.selectedTier);
    if (!plan) return 0;

    if (plan.lifetimePrice !== null) {
      return plan.lifetimePrice;
    }

    return state.billingPeriod === 'yearly'
      ? plan.yearlyPrice ?? 0
      : plan.monthlyPrice ?? 0;
  },
}));

// Subscription state store (persisted, represents actual user subscription)
interface SubscriptionState {
  currentTier: PlanTier;
  activeApps: AppId[];
  isActive: boolean;
  expiresAt: string | null;
  isFoundingMember: boolean;

  // Actions
  setSubscription: (tier: PlanTier, apps: AppId[], expiresAt?: string) => void;
  clearSubscription: () => void;

  // Computed helpers
  hasAccessToApp: (appId: AppId) => boolean;
  canUseCloudSync: () => boolean;
  canUseGoogleDrive: () => boolean;
  hasAds: () => boolean;
  hasPrioritySupport: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentTier: 'free',
      activeApps: [],
      isActive: true,
      expiresAt: null,
      isFoundingMember: false,

      setSubscription: (tier, apps, expiresAt) => {
        set({
          currentTier: tier,
          activeApps: apps,
          isActive: true,
          expiresAt: expiresAt ?? null,
          isFoundingMember: tier === 'founding',
        });
      },

      clearSubscription: () => {
        set({
          currentTier: 'free',
          activeApps: [],
          isActive: true,
          expiresAt: null,
          isFoundingMember: false,
        });
      },

      hasAccessToApp: (appId) => {
        const state = get();
        const plan = getPlanById(state.currentTier);
        if (!plan) return false;

        // Free and Pro/Founding have access to all apps
        if (plan.features.appsIncluded === 'all') return true;

        // For Starter/Plus, check if the app is in active apps
        return state.activeApps.includes(appId);
      },

      canUseCloudSync: () => {
        const plan = getPlanById(get().currentTier);
        return plan?.features.storageOptions.includes('cloud') ?? false;
      },

      canUseGoogleDrive: () => {
        const plan = getPlanById(get().currentTier);
        return plan?.features.storageOptions.includes('google-drive') ?? false;
      },

      hasAds: () => {
        const plan = getPlanById(get().currentTier);
        return plan?.features.hasAds ?? true;
      },

      hasPrioritySupport: () => {
        const plan = getPlanById(get().currentTier);
        return plan?.features.hasPrioritySupport ?? false;
      },
    }),
    {
      name: 'bon-subscription',
      partialize: (state) => ({
        currentTier: state.currentTier,
        activeApps: state.activeApps,
        isActive: state.isActive,
        expiresAt: state.expiresAt,
        isFoundingMember: state.isFoundingMember,
      }),
    }
  )
);
