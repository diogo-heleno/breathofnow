'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Clock, Lock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { App, AppId, PlanTier } from '@/types/pricing';

// App selection status
export type AppSelectionStatus = 'available' | 'selected' | 'testing' | 'locked';

interface AppCardProps {
  app: App;
  status: AppSelectionStatus;
  tier: PlanTier;
  onSelect?: (appId: AppId) => void;
  onDeselect?: (appId: AppId) => void;
  onMakePrimary?: (appId: AppId) => void;
  canChange: boolean;
  daysUntilChange?: number;
  isLoading?: boolean;
}

const STATUS_BADGES = {
  available: {
    variant: 'success' as const,
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: Sparkles,
    labelKey: 'account.apps.status.available',
  },
  selected: {
    variant: 'success' as const,
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: Check,
    labelKey: 'account.apps.status.selected',
  },
  testing: {
    variant: 'warning' as const,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
    labelKey: 'account.apps.status.testing',
  },
  locked: {
    variant: 'outline' as const,
    className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    icon: Lock,
    labelKey: 'account.apps.status.locked',
  },
};

export function AppCard({
  app,
  status,
  tier,
  onSelect,
  onDeselect,
  onMakePrimary,
  canChange,
  daysUntilChange,
  isLoading = false,
}: AppCardProps) {
  const t = useTranslations();
  const [isHovered, setIsHovered] = useState(false);

  const badgeConfig = STATUS_BADGES[status];
  const BadgeIcon = badgeConfig.icon;

  const isClickable = status === 'available' || (status === 'testing' && canChange);
  const showSelectButton = status === 'available' && canChange;
  const showMakePrimaryButton = status === 'testing' && tier === 'free' && canChange;
  const showDeselectButton = status === 'selected' && tier !== 'free' && canChange;
  const showUpgradeButton = status === 'locked';
  const showCantChangeMessage = (status === 'selected' || status === 'testing') && tier === 'free' && !canChange && daysUntilChange;

  const handleClick = () => {
    if (isLoading) return;

    if (status === 'available' && onSelect) {
      onSelect(app.id);
    } else if (status === 'testing' && tier === 'free' && canChange && onMakePrimary) {
      onMakePrimary(app.id);
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
        isClickable && !isLoading && 'cursor-pointer hover:border-primary-300 hover:bg-primary-50/50',
        status === 'selected' && 'border-green-200 bg-green-50/30',
        status === 'testing' && 'border-amber-200 bg-amber-50/30',
        status === 'locked' && 'opacity-60',
        isLoading && 'opacity-70 pointer-events-none'
      )}
      onClick={isClickable ? handleClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4">
        {/* App Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200"
          style={{ backgroundColor: `${app.color}15` }}
        >
          <span
            className="text-xl font-semibold"
            style={{ color: app.color }}
          >
            {app.name.charAt(0)}
          </span>
        </div>

        {/* App Info */}
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-neutral-900">{app.name}</h4>
            {app.status === 'beta' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Beta
              </Badge>
            )}
          </div>
          <p className="text-sm text-neutral-500">{app.description}</p>

          {/* Testing data warning */}
          {status === 'testing' && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('account.apps.testingDataWarning')}
            </p>
          )}

          {/* Can't change message */}
          {showCantChangeMessage && (
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('account.apps.canChangeIn', { days: daysUntilChange })}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Badge and Actions */}
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <Badge className={cn('flex items-center gap-1', badgeConfig.className)}>
          <BadgeIcon className="w-3 h-3" />
          {t(badgeConfig.labelKey)}
        </Badge>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {showSelectButton && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(app.id);
              }}
              disabled={isLoading}
            >
              {t('account.apps.actions.select')}
            </Button>
          )}

          {showMakePrimaryButton && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMakePrimary?.(app.id);
              }}
              disabled={isLoading}
            >
              {t('account.apps.actions.makePrimary')}
            </Button>
          )}

          {showDeselectButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeselect?.(app.id);
              }}
              disabled={isLoading}
              className="text-neutral-500 hover:text-neutral-700"
            >
              {t('account.apps.actions.deselect')}
            </Button>
          )}

          {showUpgradeButton && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to pricing
                window.location.href = `/${window.location.pathname.split('/')[1]}/pricing`;
              }}
            >
              {t('account.apps.actions.upgrade')}
            </Button>
          )}
        </div>
      </div>

      {/* Hover overlay for clickable cards */}
      {isClickable && isHovered && !isLoading && (
        <div className="absolute inset-0 rounded-xl border-2 border-primary-400 pointer-events-none" />
      )}
    </div>
  );
}

// Helper function to determine app status
export function getAppSelectionStatus(
  appId: AppId,
  tier: PlanTier,
  selectedApps: string[],
  maxApps: number | 'all'
): AppSelectionStatus {
  // Pro and Founding have all apps selected
  if (maxApps === 'all') {
    return 'selected';
  }

  // App is selected
  if (selectedApps.includes(appId)) {
    return 'selected';
  }

  // User hasn't selected all their available slots
  if (selectedApps.length < maxApps) {
    return 'available';
  }

  // Free tier: non-selected apps are in testing mode
  if (tier === 'free') {
    return 'testing';
  }

  // Other tiers: non-selected apps are locked when slots are full
  return 'locked';
}
