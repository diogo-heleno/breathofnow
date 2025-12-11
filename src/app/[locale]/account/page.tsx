'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  User,
  Mail,
  Crown,
  Shield,
  Sparkles,
  Star,
  Zap,
  Settings,
  Calendar,
  Check,
  X,
  ChevronRight,
  Clock,
  AlertTriangle,
  Lock,
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/shell';
import { AdBanner } from '@/components/ads/ad-banner';
import { ClientOnly } from '@/components/utils/client-only';
import {
  APPS,
  PLANS,
  getPlanById,
  getMaxAppsForTier,
  canChangeSelectedApp,
  daysUntilNextAppChange,
  type AppId,
  type PlanTier,
} from '@/types/pricing';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

const TIER_ICONS = {
  free: Zap,
  starter: Star,
  plus: Sparkles,
  pro: Shield,
  founding: Crown,
};

const TIER_COLORS = {
  free: 'bg-neutral-100 text-neutral-700',
  starter: 'bg-blue-100 text-blue-700',
  plus: 'bg-purple-100 text-purple-700',
  pro: 'bg-green-100 text-green-700',
  founding: 'bg-amber-100 text-amber-700',
};

const TIER_LABELS = {
  free: 'Free',
  starter: 'Starter',
  plus: 'Plus',
  pro: 'Pro',
  founding: 'Founding Member',
};

// Loading skeleton component for SSR and initial load
function AccountLoadingSkeleton({ locale }: { locale: Locale }) {
  return (
    <AppShell locale={locale}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4" />
          <div className="h-48 bg-neutral-200 rounded-xl" />
          <div className="h-32 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}

export default function AccountPage({ params: { locale } }: PageProps) {
  return (
    <ClientOnly fallback={<AccountLoadingSkeleton locale={locale} />}>
      <AccountPageContent locale={locale} />
    </ClientOnly>
  );
}

function AccountPageContent({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const { profile, isAuthenticated, isLoading, hasAccessToApp, showAds } = useAuth();
  const [lastAppChange, setLastAppChange] = useState<Date | null>(null);

  // Simulate loading last app change date (in real app, fetch from profile)
  useEffect(() => {
    if (profile?.tier === 'free') {
      // This would come from the database in a real implementation
      const storedDate = localStorage.getItem('bon_last_app_change');
      if (storedDate) {
        setLastAppChange(new Date(storedDate));
      }
    }
  }, [profile?.tier]);

  if (isLoading) {
    return <AccountLoadingSkeleton locale={locale} />;
  }

  if (!isAuthenticated || !profile) {
    return (
      <AppShell locale={locale}>
        <div className="p-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Sign in to view your account
              </h2>
              <p className="text-neutral-600 mb-6">
                Create an account or sign in to manage your subscription and settings.
              </p>
              <Link href={`/${locale}/auth/signin`}>
                <Button variant="primary">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const TierIcon = TIER_ICONS[profile.tier];
  const plan = getPlanById(profile.tier);
  const maxApps = getMaxAppsForTier(profile.tier);
  const selectedAppsCount = profile.selectedApps?.length ?? 0;

  // For free tier, check if user can change app
  const canChangeApp = canChangeSelectedApp(profile.tier, lastAppChange);
  const daysUntilChange = daysUntilNextAppChange(lastAppChange);

  return (
    <AppShell locale={locale}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Ad Banner for free users */}
        {showAds && (
          <AdBanner position="top" slot="account-top" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">My Account</h1>
          <Link href={`/${locale}/account/settings`}>
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'User'}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600" />
                  </div>
                )}
                {profile.isFoundingMember && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {profile.name || 'User'}
                </h2>
                <p className="text-neutral-600 flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                <div className="mt-3">
                  <Badge className={TIER_COLORS[profile.tier]}>
                    <TierIcon className="w-3.5 h-3.5 mr-1" />
                    {TIER_LABELS[profile.tier]}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Subscription</h3>
            
            <div className="space-y-4">
              {/* Current Plan */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TIER_COLORS[profile.tier]}`}>
                    <TierIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{TIER_LABELS[profile.tier]}</p>
                    {profile.tierExpiresAt && (
                      <p className="text-sm text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Renews {new Date(profile.tierExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                    {profile.tier === 'founding' && (
                      <p className="text-sm text-amber-600">Lifetime access</p>
                    )}
                    {plan && (
                      <p className="text-sm text-neutral-500">
                        {maxApps === 'all' ? 'All apps' : `${maxApps} app${maxApps !== 1 ? 's' : ''}`} included
                      </p>
                    )}
                  </div>
                </div>
                
                {profile.tier !== 'founding' && (
                  <Link href={`/${locale}/pricing`}>
                    <Button variant="secondary" size="sm">
                      {profile.tier === 'free' ? 'Upgrade' : 'Manage'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Plan Features */}
              <div className="grid grid-cols-2 gap-3">
                <FeatureItem
                  label="Cloud Sync"
                  enabled={['pro', 'founding'].includes(profile.tier)}
                />
                <FeatureItem
                  label="Google Drive"
                  enabled={['starter', 'plus', 'pro', 'founding'].includes(profile.tier)}
                />
                <FeatureItem
                  label="Ad-Free"
                  enabled={profile.tier !== 'free'}
                />
                <FeatureItem
                  label="Priority Support"
                  enabled={['plus', 'pro', 'founding'].includes(profile.tier)}
                />
                <FeatureItem
                  label="Early Access"
                  enabled={['pro', 'founding'].includes(profile.tier)}
                />
                <FeatureItem
                  label="WhatsApp Support"
                  enabled={profile.tier === 'founding'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Access Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">App Access</h3>
              {maxApps !== 'all' && (
                <span className="text-sm text-neutral-500">
                  {selectedAppsCount} / {maxApps} selected
                </span>
              )}
            </div>

            {/* Free tier warning about app switching */}
            {profile.tier === 'free' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      Free tier: 1 app with permanent data
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      You can try other apps, but their data will be deleted after 24 hours.
                      {!canChangeApp && (
                        <span className="block mt-1">
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          You can change your main app in {daysUntilChange} days.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {APPS.filter(app => app.status !== 'coming-soon').map((app) => {
                const hasAccess = hasAccessToApp(app.id);
                const isSelected = profile.selectedApps?.includes(app.id);
                const isTrialApp = profile.tier === 'free' && !isSelected;
                
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${app.color}20` }}
                      >
                        <span style={{ color: app.color }} className="font-medium">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{app.name}</p>
                        <p className="text-xs text-neutral-500">{app.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {app.status === 'beta' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Beta
                        </Badge>
                      )}
                      
                      {hasAccess || maxApps === 'all' ? (
                        isTrialApp ? (
                          <Badge variant="warning" className="bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 mr-1" />
                            24h Trial
                          </Badge>
                        ) : (
                          <Badge variant="success" className="bg-green-100 text-green-700">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-neutral-500">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Coming Soon Apps */}
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Coming Soon
                </p>
                {APPS.filter(app => app.status === 'coming-soon').map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${app.color}20` }}
                      >
                        <span style={{ color: app.color }} className="font-medium">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{app.name}</p>
                        <p className="text-xs text-neutral-500">{app.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Soon
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {(profile.tier === 'free' || profile.tier === 'starter' || profile.tier === 'plus') && (
              <div className="mt-4 p-4 bg-primary-50 rounded-xl">
                <p className="text-sm text-primary-800">
                  {profile.tier === 'free' ? (
                    <>
                      <strong>Tip:</strong> Upgrade to get more apps and remove ads.
                    </>
                  ) : (
                    <>
                      <strong>Tip:</strong> You can change your selected apps in settings.
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Delete Account</p>
                  <p className="text-sm text-neutral-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Ad Banner for free users */}
        {showAds && (
          <AdBanner position="bottom" slot="account-bottom" />
        )}
      </div>
    </AppShell>
  );
}

function FeatureItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50">
      {enabled ? (
        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-600" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center">
          <X className="w-3 h-3 text-neutral-400" />
        </div>
      )}
      <span className={enabled ? 'text-neutral-900' : 'text-neutral-400'}>{label}</span>
    </div>
  );
}
