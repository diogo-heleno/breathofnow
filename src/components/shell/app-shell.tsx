'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Menu,
  X,
  Home,
  Wallet,
  TrendingUp,
  Dumbbell,
  Bike,
  ChefHat,
  ScanLine,
  Settings,
  User,
  LogOut,
  Crown,
  Sparkles,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectionIndicator } from '@/components/pwa/connection-indicator';
import { ClientOnly } from '@/components/utils/client-only';
import { useAuth } from '@/contexts/auth-context';
import { locales, localeLabels, localeFlags, type Locale } from '@/i18n';
import { APPS, type AppId } from '@/types/pricing';

const APP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet,
  TrendingUp,
  Dumbbell,
  Bike,
  ChefHat,
  ScanLine,
};

const APP_ROUTES: Record<AppId, string> = {
  'expense-flow': '/expenses',
  'invest-track': '/investments',
  'fit-log': '/fitlog',
  'strava-sync': '/strava',
  'recipe-box': '/recipes',
  'label-scan': '/labels',
};

interface AppShellProps {
  children: React.ReactNode;
  locale: Locale;
}

export function AppShell({ children, locale }: AppShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { profile, isAuthenticated, isLoading: isAuthLoading, signOut, hasAccessToApp } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isLangOpen, setIsLangOpen] = React.useState(false);

  // Get the path for language switch - preserves current path with new locale
  const getLocalizedPath = React.useCallback((newLocale: string) => {
    // Check if pathname already has a locale prefix
    const localePattern = new RegExp(`^/(${locales.join('|')})`);
    const hasLocalePrefix = localePattern.test(pathname);

    if (hasLocalePrefix) {
      // Replace existing locale
      return pathname.replace(localePattern, `/${newLocale}`);
    } else {
      // Add locale prefix (for default locale paths without prefix)
      return `/${newLocale}${pathname}`;
    }
  }, [pathname]);

  // Get current active app from pathname
  const currentApp = React.useMemo(() => {
    for (const [appId, route] of Object.entries(APP_ROUTES)) {
      if (pathname.includes(route)) {
        return appId as AppId;
      }
    }
    return null;
  }, [pathname]);

  // Close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const tierBadge = React.useMemo(() => {
    if (!profile) return null;
    
    const tierConfig: Record<string, { label: string; variant: 'primary' | 'secondary' | 'accent' }> = {
      free: { label: 'Free', variant: 'secondary' },
      starter: { label: 'Starter', variant: 'primary' },
      plus: { label: 'Plus', variant: 'primary' },
      pro: { label: 'Pro', variant: 'accent' },
      founding: { label: 'Founding', variant: 'accent' },
    };
    
    return tierConfig[profile.tier];
  }, [profile]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg lg:hidden"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Right: Connection + Lang + User */}
          <div className="flex items-center gap-2">
            {/* Connection Indicator */}
            <ConnectionIndicator className="hidden sm:flex" />
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{localeFlags[locale]}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-1 z-20">
                    {locales.map((loc) => (
                      <Link
                        key={loc}
                        href={getLocalizedPath(loc)}
                        onClick={() => setIsLangOpen(false)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                          loc === locale
                            ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        )}
                      >
                        <span>{localeFlags[loc]}</span>
                        <span>{localeLabels[loc]}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User Menu - Wrapped in ClientOnly to prevent hydration mismatch */}
            <ClientOnly
              fallback={
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-full" />
              }
            >
              {isAuthLoading ? (
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-full" />
              ) : isAuthenticated && profile ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                    <ChevronDown className="w-3 h-3 text-neutral-500 hidden sm:block" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 z-20">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {profile.name || profile.email}
                          </p>
                          <p className="text-sm text-neutral-500 truncate">{profile.email}</p>
                          {tierBadge && (
                            <Badge variant={tierBadge.variant} className="mt-2">
                              {profile.isFoundingMember && <Crown className="w-3 h-3 mr-1" />}
                              {tierBadge.label}
                            </Badge>
                          )}
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href={`/${locale}/account`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <User className="w-4 h-4" />
                            {t('common.profile')}
                          </Link>
                          <Link
                            href={`/${locale}/account/settings`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Settings className="w-4 h-4" />
                            {t('common.settings')}
                          </Link>
                          {profile.tier === 'free' && (
                            <Link
                              href={`/${locale}/pricing`}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950"
                            >
                              <Sparkles className="w-4 h-4" />
                              {t('common.upgrade')}
                            </Link>
                          )}
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('common.signOut')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href={`/${locale}/auth/signin`}>
                  <Button variant="primary" size="sm">
                    {t('common.signIn')}
                  </Button>
                </Link>
              )}
            </ClientOnly>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-transform lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="flex flex-col h-full p-4">
            {/* Home Link */}
            <Link
              href={`/${locale}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2',
                !currentApp
                  ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <Home className="w-5 h-5" />
              {t('common.home')}
            </Link>

            {/* My Apps Section - Apps user has access to */}
            <div className="mt-4 mb-2">
              <p className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('nav.myApps')}
              </p>
            </div>

            <div className="space-y-1">
              {APPS.filter((app) => {
                const hasAccess = hasAccessToApp(app.id);
                const isComingSoon = app.status === 'coming-soon';
                return hasAccess && !isComingSoon;
              }).map((app) => {
                const IconComponent = APP_ICONS[app.icon];
                const route = APP_ROUTES[app.id];
                const isActive = currentApp === app.id;

                return (
                  <Link
                    key={app.id}
                    href={`/${locale}${route}`}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {IconComponent && (
                        <IconComponent
                          className={cn(
                            'w-5 h-5',
                            isActive && 'text-primary-600 dark:text-primary-400'
                          )}
                        />
                      )}
                      <span>{app.name}</span>
                    </div>

                    {app.status === 'beta' && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {t('nav.beta')}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Other Apps Section */}
            <div className="mt-6 mb-2">
              <p className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('nav.otherApps')}
              </p>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto">
              {APPS.filter((app) => {
                const hasAccess = hasAccessToApp(app.id);
                const isComingSoon = app.status === 'coming-soon';
                return !hasAccess || isComingSoon;
              }).map((app) => {
                const IconComponent = APP_ICONS[app.icon];
                const route = APP_ROUTES[app.id];
                const isActive = currentApp === app.id;
                const hasAccess = hasAccessToApp(app.id);
                const isComingSoon = app.status === 'coming-soon';

                return (
                  <Link
                    key={app.id}
                    href={isComingSoon ? '#' : `/${locale}${route}`}
                    onClick={(e) => {
                      if (isComingSoon || !hasAccess) {
                        e.preventDefault();
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {IconComponent && (
                        <IconComponent className="w-5 h-5 opacity-60" />
                      )}
                      <span>{app.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {!hasAccess && !isComingSoon && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {t('nav.testOnly')}
                        </Badge>
                      )}
                      {app.status === 'beta' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {t('nav.beta')}
                        </Badge>
                      )}
                      {isComingSoon && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {t('nav.comingSoon')}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom section - Connection status on mobile */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 lg:hidden">
              <ConnectionIndicator showLabel className="px-3 py-2" />
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
