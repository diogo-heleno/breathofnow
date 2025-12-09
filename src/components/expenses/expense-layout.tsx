'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Tag,
  Target,
  Settings,
  Plus,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdBanner } from '@/components/ads/ad-banner';
import { SyncIndicator } from '@/components/expenses/sync-status';
import { useShowAds } from '@/hooks/use-premium';

interface ExpenseLayoutProps {
  children: ReactNode;
  locale: string;
}

const NAV_ITEMS = [
  { key: 'dashboard', href: '/expenses', icon: LayoutDashboard },
  { key: 'transactions', href: '/expenses/transactions', icon: Receipt },
  { key: 'reports', href: '/expenses/reports', icon: PieChart },
  { key: 'categories', href: '/expenses/categories', icon: Tag },
  { key: 'budgets', href: '/expenses/budgets', icon: Target },
  { key: 'settings', href: '/expenses/settings', icon: Settings },
];

export function ExpenseLayout({ children, locale }: ExpenseLayoutProps) {
  const t = useTranslations('expenseFlow.nav');
  const pathname = usePathname();
  const showAds = useShowAds();

  const isActive = (href: string) => {
    const fullHref = `/${locale}${href}`;
    if (href === '/expenses') {
      return pathname === fullHref;
    }
    return pathname.startsWith(fullHref);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Top Ad Banner - Only for free users */}
      {showAds && (
        <AdBanner
          position="top"
          slot="expenseflow-top"
          className="border-b border-neutral-200 dark:border-neutral-800"
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo / App Name */}
          <Link 
            href={`/${locale}/expenses`}
            className="flex items-center gap-2 font-display font-semibold text-lg text-neutral-900 dark:text-neutral-100"
          >
            <Receipt className="w-5 h-5 text-primary-600" />
            <span>ExpenseFlow</span>
          </Link>

          {/* Right side: Sync + Quick Add */}
          <div className="flex items-center gap-2">
            <SyncIndicator />
            
            <Link href={`/${locale}/expenses/add`}>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('addTransaction')}</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-20 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.key}
                    href={`/${locale}${item.href}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {t(item.key)}
                  </Link>
                );
              })}

              {/* Import Link */}
              <Link
                href={`/${locale}/expenses/import`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.includes('/import')
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                <Upload className="w-5 h-5" />
                {t('import')}
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-40">
        {/* Bottom Ad - Only for free users (above nav) */}
        {showAds && (
          <AdBanner
            position="bottom"
            slot="expenseflow-bottom"
            className="border-b border-neutral-200 dark:border-neutral-800"
          />
        )}
        
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{t(`${item.key}Short`)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}
