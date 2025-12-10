// ExpenseFlow Layout with Unified Header

'use client';

import { useEffect, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  Tags,
  PieChart,
  Settings,
  Receipt,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { initializeExpenseFlow } from '@/lib/db';
import { useExpenseStore } from '@/stores/expense-store';
import { getExpenseCategories } from '@/lib/db';
import { UnifiedAppHeader } from '@/components/shell/unified-app-header';
import { type Locale } from '@/i18n';

interface ExpenseLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function ExpenseLayout({ children, params: { locale } }: ExpenseLayoutProps) {
  const t = useTranslations('expenseFlow');
  const pathname = usePathname();
  const { setCategories, setIsInitialized, isInitialized } = useExpenseStore();

  // Initialize ExpenseFlow data on mount
  useEffect(() => {
    async function init() {
      if (!isInitialized) {
        await initializeExpenseFlow();
        const categories = await getExpenseCategories();
        setCategories(categories);
        setIsInitialized(true);
      }
    }
    init();
  }, [isInitialized, setCategories, setIsInitialized]);

  const navigation = [
    {
      name: t('dashboard.title'),
      shortName: 'Dashboard',
      href: `/${locale}/expenses`,
      icon: LayoutDashboard,
      exactMatch: true,
    },
    {
      name: t('quickAdd.title'),
      shortName: 'Adicionar',
      href: `/${locale}/expenses/add`,
      icon: PlusCircle,
    },
    {
      name: t('transactions.title'),
      shortName: 'Transações',
      href: `/${locale}/expenses/transactions`,
      icon: List,
    },
    {
      name: t('categories.title'),
      shortName: 'Categorias',
      href: `/${locale}/expenses/categories`,
      icon: Tags,
    },
    {
      name: t('reports.title'),
      shortName: 'Relatórios',
      href: `/${locale}/expenses/reports`,
      icon: PieChart,
    },
    {
      name: t('settings.title'),
      shortName: 'Definições',
      href: `/${locale}/expenses/settings`,
      icon: Settings,
    },
  ];

  const isActive = (href: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Unified Header */}
      <UnifiedAppHeader
        locale={locale as Locale}
        appTitle="ExpenseFlow"
        appIcon={<Receipt className="w-5 h-5 text-primary-600" />}
        rightContent={
          <Link href={`/${locale}/expenses/add`}>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.addTransaction')}</span>
            </button>
          </Link>
        }
      />

      {/* Main content with sidebar on desktop */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar navigation - desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-32 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exactMatch);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      active
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      {/* Bottom navigation - mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exactMatch);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.shortName.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
