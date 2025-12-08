import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumUntil?: string;
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Region & Pricing
  country: string;
  currency: string;
  priceTier: 'high' | 'medium' | 'low';
  setRegion: (country: string, currency: string, tier: 'high' | 'medium' | 'low') => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Ads
  showAds: boolean;
  setShowAds: (show: boolean) => void;
  
  // Active App
  activeApp: string | null;
  setActiveApp: (app: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Region & Pricing
      country: 'PT',
      currency: 'EUR',
      priceTier: 'medium',
      setRegion: (country, currency, priceTier) => set({ country, currency, priceTier }),
      
      // UI State
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      
      // Ads
      showAds: true,
      setShowAds: (showAds) => set({ showAds }),
      
      // Active App
      activeApp: null,
      setActiveApp: (activeApp) => set({ activeApp }),
    }),
    {
      name: 'breathofnow-storage',
      partialize: (state) => ({
        theme: state.theme,
        country: state.country,
        currency: state.currency,
        priceTier: state.priceTier,
        showAds: state.showAds,
      }),
    }
  )
);

// Pricing store for PWYW
interface PricingState {
  suggestedMonthly: number;
  suggestedLifetime: number;
  customMonthly: number | null;
  customLifetime: number | null;
  setSuggestedPrices: (monthly: number, lifetime: number) => void;
  setCustomMonthly: (price: number | null) => void;
  setCustomLifetime: (price: number | null) => void;
  getEffectiveMonthly: () => number;
  getEffectiveLifetime: () => number;
}

export const usePricingStore = create<PricingState>((set, get) => ({
  suggestedMonthly: 5,
  suggestedLifetime: 49,
  customMonthly: null,
  customLifetime: null,
  
  setSuggestedPrices: (monthly, lifetime) => set({ 
    suggestedMonthly: monthly, 
    suggestedLifetime: lifetime 
  }),
  
  setCustomMonthly: (price) => set({ customMonthly: price }),
  setCustomLifetime: (price) => set({ customLifetime: price }),
  
  getEffectiveMonthly: () => {
    const state = get();
    return state.customMonthly ?? state.suggestedMonthly;
  },
  
  getEffectiveLifetime: () => {
    const state = get();
    return state.customLifetime ?? state.suggestedLifetime;
  },
}));
