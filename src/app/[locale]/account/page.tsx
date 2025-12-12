'use client';

import { useState, useCallback } from 'react';
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
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/shell';
import { AdBanner } from '@/components/ads/ad-banner';
import { ClientOnly } from '@/components/utils/client-only';
import { AppCard, getAppSelectionStatus } from '@/components/account/app-card';
import { AppSelectionModal } from '@/components/account/app-selection-modal';
import {
  APPS,
  getPlanById,
  getMaxAppsForTier,
  getAppById,
  type AppId,
  type PlanTier,
  type App,
} from '@/types/pricing';
import { type Locale } from '@/i18n';

// Helper function to calculate days since a date
function getDaysSinceChange(date: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

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

// Simple loading skeleton - NO AppShell to avoid hydration issues
function AccountLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4" />
          <div className="h-48 bg-neutral-200 rounded-xl" />
          <div className="h-32 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function AccountPage({ params: { locale } }: PageProps) {
  return (
    <ClientOnly fallback={<AccountLoadingSkeleton />}>
      <AccountPageContent locale={locale} />
    </ClientOnly>
  );
}

function AccountPageContent({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const { profile, isAuthenticated, isLoading, showAds, refreshProfile } = useAuth();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'select' | 'change' | 'deselect'>('select');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [currentPrimaryApp, setCurrentPrimaryApp] = useState<App | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate days until change from profile
  const lastAppChange = profile?.lastAppChange ? new Date(profile.lastAppChange) : null;
  const canChange = profile?.tier === 'free'
    ? (!lastAppChange || !profile?.selectedApps?.length || getDaysSinceChange(lastAppChange) >= 30)
    : true;
  const daysUntilChange = lastAppChange && profile?.selectedApps?.length
    ? Math.max(0, 30 - getDaysSinceChange(lastAppChange))
    : 0;

  // Handle app selection
  const handleSelectApp = useCallback((appId: AppId) => {
    const app = getAppById(appId);
    if (!app) return;

    setSelectedApp(app);
    setModalType('select');
    setModalOpen(true);
  }, []);

  // Handle make primary (for free tier changing app)
  const handleMakePrimary = useCallback((appId: AppId) => {
    const app = getAppById(appId);
    if (!app || !profile?.selectedApps?.length) return;

    const currentAppId = profile.selectedApps[0] as AppId;
    const currentApp = getAppById(currentAppId);

    setSelectedApp(app);
    setCurrentPrimaryApp(currentApp || null);
    setModalType('change');
    setModalOpen(true);
  }, [profile?.selectedApps]);

  // Handle deselect (for paid tiers)
  const handleDeselectApp = useCallback((appId: AppId) => {
    const app = getAppById(appId);
    if (!app) return;

    setSelectedApp(app);
    setModalType('deselect');
    setModalOpen(true);
  }, []);

  // Confirm selection
  const handleConfirmSelection = useCallback(async () => {
    if (!selectedApp || !profile) return;

    setIsSubmitting(true);

    try {
      const action = modalType === 'change' ? 'make-primary' : modalType;

      const response = await fetch('/api/profile/select-apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp.id,
          action,
        }),
      });

      if (response.ok) {
        // Refresh profile to get updated data
        await refreshProfile();
        setModalOpen(false);
      } else {
        const data = await response.json();
        console.error('Error selecting app:', data.error);
        // Could show a toast here
      }
    } catch (error) {
      console.error('Error selecting app:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedApp, modalType, profile, refreshProfile]);

  if (isLoading) {
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

  if (!isAuthenticated || !profile) {
    return (
      <AppShell locale={locale}>
        <div className="p-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                {t('account.signInToView')}
              </h2>
              <p className="text-neutral-600 mb-6">
                {t('account.signInDescription')}
              </p>
              <Link href={`/${locale}/auth/signin`}>
                <Button variant="primary">{t('common.signIn')}</Button>
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
              <h3 className="text-lg font-semibold text-neutral-900">{t('account.apps.title')}</h3>
              {maxApps !== 'all' && (
                <span className="text-sm text-neutral-500">
                  {selectedAppsCount} / {maxApps} {t('account.apps.selected')}
                </span>
              )}
            </div>

            {/* Tier-specific info banners */}
            {profile.tier === 'free' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      {t('account.apps.freeTierTitle')}
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      {t('account.apps.freeTierDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(profile.tier === 'starter' || profile.tier === 'plus') && selectedAppsCount < (maxApps as number) && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      {t('account.apps.slotsAvailable', {
                        available: (maxApps as number) - selectedAppsCount,
                        total: maxApps
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Available Apps */}
            <div className="space-y-3">
              {APPS.filter(app => app.status !== 'coming-soon').map((app) => {
                const status = getAppSelectionStatus(
                  app.id,
                  profile.tier,
                  profile.selectedApps || [],
                  maxApps
                );

                return (
                  <AppCard
                    key={app.id}
                    app={app}
                    status={status}
                    tier={profile.tier}
                    onSelect={handleSelectApp}
                    onDeselect={handleDeselectApp}
                    onMakePrimary={handleMakePrimary}
                    canChange={canChange}
                    daysUntilChange={daysUntilChange}
                    isLoading={isSubmitting}
                  />
                );
              })}

              {/* Coming Soon Apps */}
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                  {t('account.apps.comingSoon')}
                </p>
                {APPS.filter(app => app.status === 'coming-soon').map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg opacity-60 mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${app.color}15` }}
                      >
                        <span style={{ color: app.color }} className="font-medium">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-700">{app.name}</p>
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

            {profile.tier === 'free' && selectedAppsCount === 0 && (
              <div className="mt-4 p-4 bg-primary-50 rounded-xl">
                <p className="text-sm text-primary-800">
                  <strong>{t('common.tip')}:</strong> {t('account.apps.selectFirstApp')}
                </p>
              </div>
            )}

            {profile.tier === 'free' && selectedAppsCount > 0 && (
              <div className="mt-4 p-4 bg-primary-50 rounded-xl">
                <p className="text-sm text-primary-800">
                  <strong>{t('common.tip')}:</strong> {t('account.apps.upgradeForMore')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-4">{t('account.dangerZone.title')}</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{t('account.dangerZone.deleteAccount')}</p>
                  <p className="text-sm text-neutral-500">
                    {t('account.dangerZone.deleteAccountDescription')}
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  {t('account.dangerZone.deleteAccount')}
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

      {/* App Selection Modal */}
      {selectedApp && (
        <AppSelectionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirmSelection}
          type={modalType}
          app={selectedApp}
          currentApp={currentPrimaryApp || undefined}
          tier={profile.tier}
          isLoading={isSubmitting}
        />
      )}
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
