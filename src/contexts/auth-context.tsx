'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import type { User, Session } from '@supabase/supabase-js';

// Storage keys for offline persistence
const STORAGE_KEYS = {
  PROFILE: 'bon_cached_profile',
  USER: 'bon_cached_user',
  LAST_SYNC: 'bon_last_sync',
} as const;

// Subscription tier types
export type SubscriptionTier = 'free' | 'starter' | 'plus' | 'pro' | 'founding';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  tierExpiresAt?: string;
  selectedApps?: string[]; // For starter/plus tiers
  lastAppChange?: string; // Last time user changed their selected app
  isFoundingMember: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  isOfflineMode: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasAccessToApp: (appId: string) => boolean;
  canUseCloudSync: boolean;
  showAds: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely access localStorage
function getStoredData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage might be full or disabled
  }
}

function removeStoredData(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const { setUser: setAppUser, setShowAds } = useAppStore();

  // Update app state with profile data
  const updateAppState = useCallback((userProfile: UserProfile | null) => {
    if (userProfile) {
      setAppUser({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl,
        isPremium: userProfile.tier !== 'free',
        premiumUntil: userProfile.tierExpiresAt,
      });
      setShowAds(userProfile.tier === 'free');
    } else {
      setAppUser(null);
      setShowAds(true);
    }
  }, [setAppUser, setShowAds]);

  // Fetch user profile from Supabase with timeout
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    // Create a timeout promise to prevent infinite hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
    });

    try {
      const supabase = createClient();

      // Race between the query and timeout
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        timeoutPromise
      ]) as { data: Record<string, unknown> | null; error: { message: string } | null };

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }

      if (!data) {
        return null;
      }

      const userProfile: UserProfile = {
        id: data.id as string,
        email: data.email as string,
        name: (data.full_name || data.name) as string | undefined,
        avatarUrl: data.avatar_url as string | undefined,
        tier: (data.subscription_tier || 'free') as SubscriptionTier,
        tierExpiresAt: data.subscription_expires_at as string | undefined,
        selectedApps: (data.selected_apps || []) as string[],
        lastAppChange: data.apps_selected_at as string | undefined,
        isFoundingMember: (data.is_founding_member || false) as boolean,
        createdAt: data.created_at as string,
      };

      // Cache the profile for offline use
      setStoredData(STORAGE_KEYS.PROFILE, userProfile);
      setStoredData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      return userProfile;
    } catch (error) {
      console.error('Error fetching profile:', error instanceof Error ? error.message : error);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    if (!isOnline) {
      // In offline mode, use cached profile
      const cachedProfile = getStoredData<UserProfile>(STORAGE_KEYS.PROFILE);
      if (cachedProfile && cachedProfile.id === user.id) {
        setProfile(cachedProfile);
        updateAppState(cachedProfile);
      }
      return;
    }

    const newProfile = await fetchProfile(user.id);
    if (newProfile) {
      setProfile(newProfile);
      updateAppState(newProfile);
    }
  }, [user, isOnline, fetchProfile, updateAppState]);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsOfflineMode(false);
    updateAppState(null);

    // Clear cached data on logout
    removeStoredData(STORAGE_KEYS.PROFILE);
    removeStoredData(STORAGE_KEYS.USER);
    removeStoredData(STORAGE_KEYS.LAST_SYNC);
  }, [updateAppState]);

  // Check if user has access to a specific app
  const hasAccessToApp = useCallback((appId: string): boolean => {
    if (!profile) return true; // Allow access for non-authenticated users (shows all apps initially)

    const { tier, selectedApps } = profile;

    // Pro and Founding have access to all apps
    if (tier === 'pro' || tier === 'founding') {
      return true;
    }

    // Free (1 app), Starter (2 apps), Plus (5 apps) - check selected apps
    if (tier === 'free' || tier === 'starter' || tier === 'plus') {
      return selectedApps?.includes(appId) ?? false;
    }

    return false;
  }, [profile]);

  // Check if user can use cloud sync
  const canUseCloudSync = profile
    ? ['plus', 'pro', 'founding'].includes(profile.tier)
    : false;

  // Check if ads should be shown
  const showAds = !profile || profile.tier === 'free';

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, try to refresh profile
      if (user) {
        refreshProfile();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, refreshProfile]);

  // Initialize auth state
  useEffect(() => {
    const supabase = createClient();

    // Get initial session with OPTIMISTIC LOADING
    const initAuth = async () => {
      // 1. IMMEDIATELY show cached data if available (Optimistic UI)
      const cachedProfile = getStoredData<UserProfile>(STORAGE_KEYS.PROFILE);
      const cachedUser = getStoredData<Partial<User>>(STORAGE_KEYS.USER);

      if (cachedProfile && cachedUser) {
        // Show UI immediately with cached data
        setProfile(cachedProfile);
        setUser(cachedUser as User);
        updateAppState(cachedProfile);
        setIsLoading(false); // UI renders NOW!

        // If offline, we're done - use cached data
        if (!navigator.onLine) {
          setIsOfflineMode(true);
          return;
        }
      }

      // 2. UPDATE in background (doesn't block UI)
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession?.user) {
          // Update user if different from cache
          if (!cachedUser || cachedUser.id !== initialSession.user.id) {
            setUser(initialSession.user);
          }
          setSession(initialSession);
          setIsOfflineMode(false);

          // Cache user data for offline use
          setStoredData(STORAGE_KEYS.USER, {
            id: initialSession.user.id,
            email: initialSession.user.email,
            user_metadata: initialSession.user.user_metadata,
          });

          // Fetch fresh profile in background
          const freshProfile = await fetchProfile(initialSession.user.id);

          if (freshProfile) {
            // Only update if data changed (avoids unnecessary re-renders)
            if (JSON.stringify(freshProfile) !== JSON.stringify(cachedProfile)) {
              setProfile(freshProfile);
              updateAppState(freshProfile);
            }
          } else if (cachedProfile && cachedProfile.id === initialSession.user.id) {
            // Keep cached profile if fetch fails
            setProfile(cachedProfile);
            updateAppState(cachedProfile);
          }
        } else if (cachedProfile && cachedUser) {
          // No active session but we have cached data
          setIsOfflineMode(true);
        } else {
          // No session and no cache - user is not logged in
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);

        // On error, use cached data if available (already set above)
        if (cachedProfile && cachedUser) {
          setIsOfflineMode(true);
        }
      } finally {
        // Ensure loading is false even if no cache was available
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
          setIsOfflineMode(false);

          // Cache user data
          setStoredData(STORAGE_KEYS.USER, {
            id: newSession.user.id,
            email: newSession.user.email,
            user_metadata: newSession.user.user_metadata,
          });

          const userProfile = await fetchProfile(newSession.user.id);
          if (userProfile) {
            setProfile(userProfile);
            updateAppState(userProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsOfflineMode(false);
          updateAppState(null);

          // Clear cached data
          removeStoredData(STORAGE_KEYS.PROFILE);
          removeStoredData(STORAGE_KEYS.USER);
          removeStoredData(STORAGE_KEYS.LAST_SYNC);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setIsOfflineMode(false);

          // Update cached user data
          setStoredData(STORAGE_KEYS.USER, {
            id: newSession.user.id,
            email: newSession.user.email,
            user_metadata: newSession.user.user_metadata,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, updateAppState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user || !!profile,
        isOnline,
        isOfflineMode,
        signOut,
        refreshProfile,
        hasAccessToApp,
        canUseCloudSync: canUseCloudSync && !isOfflineMode,
        showAds,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
