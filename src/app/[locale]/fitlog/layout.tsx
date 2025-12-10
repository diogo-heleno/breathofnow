// FitLog Layout with Unified Header

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Dumbbell,
  History,
  FileText,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedAppHeader } from '@/components/shell/unified-app-header';
import { type Locale } from '@/i18n';

interface FitLogLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function FitLogLayout({ children, params }: FitLogLayoutProps) {
  const { locale } = params;
  const pathname = usePathname();

  const navItems = [
    { href: `/${locale}/fitlog`, icon: Home, label: 'Início', exactMatch: true },
    { href: `/${locale}/fitlog/workout`, icon: Dumbbell, label: 'Treinos' },
    { href: `/${locale}/fitlog/history`, icon: History, label: 'Histórico' },
    { href: `/${locale}/fitlog/export`, icon: Upload, label: 'Export' },
    { href: `/${locale}/fitlog/plans`, icon: FileText, label: 'Planos' },
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
        appTitle="FitLog"
        appIcon={<Dumbbell className="w-5 h-5 text-primary-600" />}
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
