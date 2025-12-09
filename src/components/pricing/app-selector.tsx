'use client';

import { useTranslations } from 'next-intl';
import {
  Wallet,
  TrendingUp,
  Dumbbell,
  Bike,
  ChefHat,
  ScanLine,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APPS, type AppId, type App } from '@/types/pricing';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet,
  TrendingUp,
  Dumbbell,
  Bike,
  ChefHat,
  ScanLine,
};

interface AppSelectorProps {
  maxApps: number;
  selectedApps: AppId[];
  onAppToggle: (appId: AppId) => void;
  compact?: boolean;
  className?: string;
}

export function AppSelector({
  maxApps,
  selectedApps,
  onAppToggle,
  compact = false,
  className,
}: AppSelectorProps) {
  const t = useTranslations('pricing');

  const canSelectMore = selectedApps.length < maxApps;

  if (compact) {
    return (
      <AppSelectorCompact
        maxApps={maxApps}
        selectedApps={selectedApps}
        onAppToggle={onAppToggle}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('appSelector.title')}
        </h3>
        <span className="text-sm text-neutral-500">
          {selectedApps.length}/{maxApps} {t('appSelector.selected')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {APPS.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            isSelected={selectedApps.includes(app.id)}
            isDisabled={
              app.status === 'coming-soon' ||
              (!selectedApps.includes(app.id) && !canSelectMore)
            }
            onToggle={() => onAppToggle(app.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface AppCardProps {
  app: App;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

function AppCard({ app, isSelected, isDisabled, onToggle }: AppCardProps) {
  const t = useTranslations('pricing');
  const Icon = ICON_MAP[app.icon] || Wallet;

  const statusLabels = {
    available: t('appSelector.status.available'),
    beta: t('appSelector.status.beta'),
    'coming-soon': t('appSelector.status.comingSoon'),
  };

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
        isDisabled && !isSelected && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* App icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: `${app.color}20` }}
      >
        <span style={{ color: app.color }}>
          <Icon className="w-6 h-6" />
        </span>
      </div>

      {/* App name */}
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {app.name}
      </span>

      {/* Status badge */}
      <span
        className={cn(
          'mt-1 text-xs px-2 py-0.5 rounded-full',
          app.status === 'available' &&
            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
          app.status === 'beta' &&
            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
          app.status === 'coming-soon' &&
            'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
        )}
      >
        {statusLabels[app.status]}
      </span>
    </button>
  );
}

// Compact version for inline display in pricing cards
interface AppSelectorCompactProps {
  maxApps: number;
  selectedApps: AppId[];
  onAppToggle: (appId: AppId) => void;
  className?: string;
}

export function AppSelectorCompact({
  maxApps,
  selectedApps,
  onAppToggle,
  className,
}: AppSelectorCompactProps) {
  const t = useTranslations('pricing');
  const canSelectMore = selectedApps.length < maxApps;
  const availableApps = APPS.filter((app) => app.status !== 'coming-soon');

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500">{t('appSelector.chooseApps')}</span>
        <span className="font-medium text-primary-600 dark:text-primary-400">
          {selectedApps.length}/{maxApps}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableApps.map((app) => {
          const Icon = ICON_MAP[app.icon] || Wallet;
          const isSelected = selectedApps.includes(app.id);
          const isDisabled = !isSelected && !canSelectMore;

          return (
            <button
              key={app.id}
              onClick={() => onAppToggle(app.id)}
              disabled={isDisabled}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all',
                'border',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400',
                isDisabled && !isSelected && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{app.name}</span>
              {isSelected && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
