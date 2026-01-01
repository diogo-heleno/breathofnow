// RunLog Layout with Unified Header

'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  Calendar,
  History,
  Upload,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedAppHeader } from '@/components/shell/unified-app-header';
import { type Locale } from '@/i18n';
import { runningDb, isRunningDbAvailable } from '@/lib/db/running-db';
import { useRunningStore } from '@/stores/running-store';

// Running icon component
function RunningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="17" cy="4" r="2" />
      <path d="M10 20L13 16L10 13L7 17L4 15" />
      <path d="M13 16L16 19L19 16" />
      <path d="M16 11L13 8L10 10L13 13" />
      <path d="M10 10L7 7" />
    </svg>
  );
}

interface RunLogLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function RunLogLayout({ children, params }: RunLogLayoutProps) {
  const { locale } = params;
  const pathname = usePathname();
  const t = useTranslations('runLog');
  const { setActivePlan, setActivePlanId } = useRunningStore();

  // Load active plan on mount
  useEffect(() => {
    async function loadActivePlan() {
      if (!isRunningDbAvailable()) return;

      try {
        const activePlan = await runningDb.getActivePlan();
        if (activePlan) {
          setActivePlan(activePlan);
        } else {
          // Check if any plans exist and activate the first one
          const allPlans = await runningDb.getAllPlans();
          if (allPlans.length > 0) {
            await runningDb.setActivePlan(allPlans[0].id!);
            setActivePlan(allPlans[0]);
          }
        }
      } catch (error) {
        console.error('Error loading active plan:', error);
      }
    }

    loadActivePlan();
  }, [setActivePlan, setActivePlanId]);

  const navItems = [
    { href: `/${locale}/running`, icon: Home, label: t('nav.home'), exactMatch: true },
    { href: `/${locale}/running/plan`, icon: Calendar, label: t('nav.plan') },
    { href: `/${locale}/running/history`, icon: History, label: t('nav.history') },
    { href: `/${locale}/running/export`, icon: Upload, label: t('nav.export') },
    { href: `/${locale}/running/import`, icon: Download, label: t('nav.import') },
  ];

  const isActive = (href: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Unified Header */}
      <UnifiedAppHeader
        locale={locale as Locale}
        appTitle={t('title')}
        appIcon={<RunningIcon className="w-5 h-5 text-primary-600" />}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exactMatch);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors',
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
