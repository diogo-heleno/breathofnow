/**
 * Premium Gate Component
 * 
 * Bloqueia acesso a features premium e mostra upsell
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Lock, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsPremium, useFeatureAccess } from '@/hooks/use-premium';

type PremiumFeature = 'cloudSync' | 'googleDrive' | 'prioritySupport' | 'noAds';

interface PremiumGateProps {
  /** Feature a verificar */
  feature: PremiumFeature;
  /** Conteúdo a mostrar se tiver acesso */
  children: ReactNode;
  /** Mensagem personalizada */
  message?: string;
  /** Modo de exibição quando bloqueado */
  fallback?: 'blur' | 'lock' | 'replace' | 'hide';
  /** Locale para links */
  locale?: string;
  /** Classes adicionais */
  className?: string;
}

export function PremiumGate({
  feature,
  children,
  message,
  fallback = 'replace',
  locale = 'en',
  className,
}: PremiumGateProps) {
  const t = useTranslations('premium');
  const { hasAccess, isLoading } = useFeatureAccess(feature);
  
  // Enquanto carrega, mostrar loading ou children
  if (isLoading) {
    return <>{children}</>;
  }
  
  // Se tem acesso, mostrar conteúdo
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Sem acesso - mostrar fallback
  const featureMessages: Record<PremiumFeature, string> = {
    cloudSync: t('features.cloudSync'),
    googleDrive: t('features.googleDrive'),
    prioritySupport: t('features.prioritySupport'),
    noAds: t('features.noAds'),
  };
  
  const displayMessage = message || featureMessages[feature];
  
  switch (fallback) {
    case 'hide':
      return null;
      
    case 'blur':
      return (
        <div className={cn('relative', className)}>
          <div className="blur-sm pointer-events-none select-none">
            {children}
          </div>
          <PremiumOverlay message={displayMessage} locale={locale} />
        </div>
      );
      
    case 'lock':
      return (
        <div className={cn('relative', className)}>
          <div className="opacity-30 pointer-events-none select-none">
            {children}
          </div>
          <PremiumOverlay message={displayMessage} locale={locale} />
        </div>
      );
      
    case 'replace':
    default:
      return (
        <PremiumUpsellCard
          feature={feature}
          message={displayMessage}
          locale={locale}
          className={className}
        />
      );
  }
}

/**
 * Overlay para conteúdo bloqueado
 */
function PremiumOverlay({
  message,
  locale,
}: {
  message: string;
  locale: string;
}) {
  const t = useTranslations('premium');
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl">
      <div className="text-center p-6 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <p className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">
          {t('locked')}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {message}
        </p>
        <Link href={`/${locale}/pricing`}>
          <Button size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
            {t('upgrade')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Card de upsell para premium
 */
interface PremiumUpsellCardProps {
  feature: PremiumFeature;
  message: string;
  locale: string;
  className?: string;
}

function PremiumUpsellCard({
  feature,
  message,
  locale,
  className,
}: PremiumUpsellCardProps) {
  const t = useTranslations('premium');
  
  const featureIcons: Record<PremiumFeature, typeof Lock> = {
    cloudSync: Zap,
    googleDrive: Zap,
    prioritySupport: Crown,
    noAds: Sparkles,
  };
  
  const Icon = featureIcons[feature];
  
  return (
    <Card className={cn('border-primary-200 dark:border-primary-800', className)}>
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        
        <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('premiumFeature')}
        </h3>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          <Link href={`/${locale}/pricing`}>
            <Button className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
              {t('viewPlans')}
            </Button>
          </Link>
          
          <p className="text-xs text-neutral-500">
            {t('startingAt', { price: '€1.99/mês' })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Badge premium para mostrar em features
 */
export function PremiumBadge({ className }: { className?: string }) {
  const t = useTranslations('premium');
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-gradient-to-r from-primary-100 to-accent-100',
        'dark:from-primary-900/30 dark:to-accent-900/30',
        'text-xs font-medium text-primary-700 dark:text-primary-300',
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      {t('premium')}
    </span>
  );
}

/**
 * Wrapper que mostra badge premium se feature for premium
 */
export function WithPremiumBadge({
  feature,
  children,
  className,
}: {
  feature: PremiumFeature;
  children: ReactNode;
  className?: string;
}) {
  const { hasAccess } = useFeatureAccess(feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return (
    <div className={cn('relative', className)}>
      {children}
      <PremiumBadge className="absolute -top-2 -right-2" />
    </div>
  );
}
