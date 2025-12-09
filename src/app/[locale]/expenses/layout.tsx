'use client';

import { useEffect } from 'react';
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
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { initializeExpenseFlow } from '@/lib/db';
import { useExpenseStore } from '@/stores/expense-store';
import { getExpenseCategories } from '@/lib/db';

interface ExpenseLayoutProps {
  children: React.ReactNode;
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
      href: `/${locale}/expenses`,
      icon: LayoutDashboard,
    },
    {
      name: t('quickAdd.title'),
      href: `/${locale}/expenses/add`,
      icon: PlusCircle,
    },
    {
      name: t('transactions.title'),
      href: `/${locale}/expenses/transactions`,
      icon: List,
    },
    {
      name: t('categories.title'),
      href: `/${locale}/expenses/categories`,
      icon: Tags,
    },
    {
      name: t('reports.title'),
      href: `/${locale}/expenses/reports`,
      icon: PieChart,
    },
    {
      name: t('settings.title'),
      href: `/${locale}/expenses/settings`,
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/expenses`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to home</span>
              </Link>
              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
              <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t('title')}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with sidebar on desktop */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar navigation - desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
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
            const active = isActive(item.href);
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
                <span className="text-xs">{item.name.split(' ')[0]}</span>
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
