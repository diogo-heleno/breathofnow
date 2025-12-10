'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import type { User, Session } from '@supabase/supabase-js';

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
  isFoundingMember: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasAccessToApp: (appId: string) => boolean;
  canUseCloudSync: boolean;
  showAds: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { setUser: setAppUser, setShowAds } = useAppStore();

  // Fetch user profile from Supabase
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.full_name || data.name,
        avatarUrl: data.avatar_url,
        tier: data.subscription_tier || 'free',
        tierExpiresAt: data.subscription_expires_at,
        selectedApps: data.selected_apps || [],
        isFoundingMember: data.is_founding_member || false,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const newProfile = await fetchProfile(user.id);
    if (newProfile) {
      setProfile(newProfile);
      // Update app store
      setAppUser({
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        avatarUrl: newProfile.avatarUrl,
        isPremium: newProfile.tier !== 'free',
        premiumUntil: newProfile.tierExpiresAt,
      });
      setShowAds(newProfile.tier === 'free');
    }
  }, [user, fetchProfile, setAppUser, setShowAds]);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setAppUser(null);
    setShowAds(true);
  }, [setAppUser, setShowAds]);

  // Check if user has access to a specific app
  const hasAccessToApp = useCallback((appId: string): boolean => {
    if (!profile) return true; // Allow access for non-authenticated users (free tier)
    
    const { tier, selectedApps } = profile;
    
    // Free, Pro, and Founding have access to all
    if (tier === 'free' || tier === 'pro' || tier === 'founding') {
      return true;
    }
    
    // Starter (1 app) and Plus (3 apps) - check selected apps
    if (tier === 'starter' || tier === 'plus') {
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

  // Initialize auth state
  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setUser(initialSession.user);
          setSession(initialSession);
          
          const userProfile = await fetchProfile(initialSession.user.id);
          if (userProfile) {
            setProfile(userProfile);
            setAppUser({
              id: userProfile.id,
              email: userProfile.email,
              name: userProfile.name,
              avatarUrl: userProfile.avatarUrl,
              isPremium: userProfile.tier !== 'free',
              premiumUntil: userProfile.tierExpiresAt,
            });
            setShowAds(userProfile.tier === 'free');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
          
          const userProfile = await fetchProfile(newSession.user.id);
          if (userProfile) {
            setProfile(userProfile);
            setAppUser({
              id: userProfile.id,
              email: userProfile.email,
              name: userProfile.name,
              avatarUrl: userProfile.avatarUrl,
              isPremium: userProfile.tier !== 'free',
              premiumUntil: userProfile.tierExpiresAt,
            });
            setShowAds(userProfile.tier === 'free');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSession(null);
          setAppUser(null);
          setShowAds(true);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, setAppUser, setShowAds]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshProfile,
        hasAccessToApp,
        canUseCloudSync,
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
