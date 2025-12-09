/**
 * useIsPremium Hook
 * 
 * Verifica se o utilizador tem acesso premium
 */

'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useSubscriptionStore } from '@/stores/pricing-store';
import { createClient } from '@/lib/supabase/client';

interface PremiumStatus {
  isPremium: boolean;
  tier: 'free' | 'starter' | 'plus' | 'pro' | 'founding';
  isFoundingMember: boolean;
  expiresAt: Date | null;
  isLoading: boolean;
  canUseCloudSync: boolean;
  canUseGoogleDrive: boolean;
  hasAds: boolean;
  hasPrioritySupport: boolean;
}

export function useIsPremium(): PremiumStatus {
  const appUser = useAppStore((state) => state.user);
  const subscription = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [serverPremiumStatus, setServerPremiumStatus] = useState<{
    isPremium: boolean;
    tier: string;
    expiresAt: string | null;
  } | null>(null);
  
  // Verificar estado premium no servidor
  useEffect(() => {
    async function checkPremiumStatus() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Buscar estado de subscrição do utilizador
        // Nota: Isto requer uma tabela de subscriptions no Supabase
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('tier, is_active, expires_at')
          .eq('user_id', session.user.id)
          .single();
        
        if (data && !error) {
          setServerPremiumStatus({
            isPremium: data.is_active && data.tier !== 'free',
            tier: data.tier,
            expiresAt: data.expires_at,
          });
        }
      } catch {
        // Tabela pode não existir ainda - usar estado local
      }
      
      setIsLoading(false);
    }
    
    checkPremiumStatus();
  }, [appUser]);
  
  // Combinar estado local com servidor
  const isPremium = serverPremiumStatus?.isPremium ?? 
    appUser?.isPremium ?? 
    subscription.currentTier !== 'free';
  
  const tier = (serverPremiumStatus?.tier ?? subscription.currentTier) as PremiumStatus['tier'];
  
  const expiresAt = serverPremiumStatus?.expiresAt 
    ? new Date(serverPremiumStatus.expiresAt)
    : subscription.expiresAt 
      ? new Date(subscription.expiresAt)
      : null;
  
  return {
    isPremium,
    tier,
    isFoundingMember: tier === 'founding' || subscription.isFoundingMember,
    expiresAt,
    isLoading,
    canUseCloudSync: subscription.canUseCloudSync(),
    canUseGoogleDrive: subscription.canUseGoogleDrive(),
    hasAds: subscription.hasAds(),
    hasPrioritySupport: subscription.hasPrioritySupport(),
  };
}

/**
 * Hook simples para verificar se tem ads
 */
export function useShowAds(): boolean {
  const { hasAds, isLoading } = useIsPremium();
  const showAds = useAppStore((state) => state.showAds);
  
  // Não mostrar ads enquanto carrega estado premium
  if (isLoading) return false;
  
  return hasAds && showAds;
}

/**
 * Hook para verificar acesso a feature específica
 */
export function useFeatureAccess(feature: 'cloudSync' | 'googleDrive' | 'prioritySupport' | 'noAds'): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const premium = useIsPremium();
  
  let hasAccess = false;
  
  switch (feature) {
    case 'cloudSync':
      hasAccess = premium.canUseCloudSync;
      break;
    case 'googleDrive':
      hasAccess = premium.canUseGoogleDrive;
      break;
    case 'prioritySupport':
      hasAccess = premium.hasPrioritySupport;
      break;
    case 'noAds':
      hasAccess = !premium.hasAds;
      break;
  }
  
  return {
    hasAccess,
    isLoading: premium.isLoading,
  };
}
