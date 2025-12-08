import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { 
  Wallet, 
  TrendingUp, 
  Dumbbell, 
  Activity, 
  ChefHat, 
  ScanLine,
  Shield,
  Wifi,
  Sparkles,
  Heart,
  Eye,
  Leaf,
  ArrowRight,
  Check
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdBanner } from '@/components/ads/ad-banner';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export async function generateMetadata({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function HomePage({ params: { locale } }: PageProps) {
  const t = useTranslations();

  const apps = [
    {
      id: 'expenses',
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      status: 'available' as const,
    },
    {
      id: 'investments',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      status: 'beta' as const,
    },
    {
      id: 'workouts',
      icon: Dumbbell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      status: 'comingSoon' as const,
    },
    {
      id: 'strava',
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      status: 'comingSoon' as const,
    },
    {
      id: 'recipes',
      icon: ChefHat,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      status: 'comingSoon' as const,
    },
    {
      id: 'labels',
      icon: ScanLine,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      status: 'comingSoon' as const,
    },
  ];

  const features = [
    { id: 'privacy', icon: Shield },
    { id: 'offline', icon: Wifi },
    { id: 'simple', icon: Sparkles },
    { id: 'fair', icon: Heart },
    { id: 'open', icon: Eye },
    { id: 'sustainable', icon: Leaf },
  ];

  const statusColors = {
    available: 'success',
    beta: 'warning',
    comingSoon: 'secondary',
  } as const;

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              {/* Animated badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                {t('hero.privacy')}
              </div>

              {/* Main heading */}
              <h1 className="font-display text-display-lg md:text-display-xl lg:text-display-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 animate-fade-in-up">
                {t('hero.title')}{' '}
                <span className="text-gradient">{t('hero.titleHighlight')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-100">
                {t('hero.subtitle')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-200">
                <Link href="/apps">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {t('hero.cta')}
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">
                    {t('hero.ctaSecondary')}
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-16 flex flex-wrap items-center justify-center gap-8 animate-fade-in-up animation-delay-300">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span className="text-sm">{t('hero.privacyDesc')}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Wifi className="w-5 h-5 text-primary-600" />
                  <span className="text-sm">{t('hero.offlineDesc')}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Heart className="w-5 h-5 text-primary-600" />
                  <span className="text-sm">{t('hero.fairDesc')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Apps Section */}
        <section className="section bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('apps.title')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                {t('apps.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app, index) => {
                const Icon = app.icon;
                return (
                  <Card
                    key={app.id}
                    variant="interactive"
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${app.bgColor}`}>
                          <Icon className={`w-6 h-6 ${app.color}`} />
                        </div>
                        <Badge variant={statusColors[app.status]}>
                          {t(`apps.status.${app.status}`)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                        {t(`apps.${app.id}.name`)}
                      </h3>
                      <p className="text-sm text-primary-600 dark:text-primary-400 mb-3">
                        {t(`apps.${app.id}.tagline`)}
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                        {t(`apps.${app.id}.description`)}
                      </p>
                      
                      <ul className="space-y-2 mb-6">
                        {(t.raw(`apps.${app.id}.features`) as string[]).map((feature: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Link 
                        href={app.status === 'available' ? `/apps/${app.id}` : '/pricing'}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        {app.status === 'available' ? t('apps.tryFree') : t('apps.viewApp')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('features.title')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="text-center animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 mb-4">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {t(`features.${feature.id}.title`)}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {t(`features.${feature.id}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section bg-primary-600 dark:bg-primary-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="container-app relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                {t('pricing.payWhatYouWant')}
              </h2>
              <p className="text-lg text-primary-100 mb-8">
                {t('pricing.pwywDescription')}
              </p>
              <Link href="/pricing">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white text-primary-700 hover:bg-primary-50"
                >
                  {t('pricing.free.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AdBanner position="bottom" />
    </>
  );
}emerald-900/30',
      status: 'available' as const,
    },
    {
      id: 'investments',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      status: 'beta' as const,
    },
    {
      id: 'workouts',
      icon: Dumbbell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      status: 'comingSoon' as const,
    },
    {
      id: 'strava',
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      status: 'comingSoon' as const,
    },
    {
      id: 'recipes',
      icon: ChefHat,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      status: 'comingSoon' as const,
    },
    {
      id: 'labels',
      icon: ScanLine,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      status: 'comingSoon' as const,
    },
  ];

  const features = [
    { id: 'privacy', icon: Shield },
    { id: 'offline', icon: Wifi },
    { id: 'simple', icon: Sparkles },
    { id: 'fair', icon: Heart },
    { id: 'open', icon: Eye },
    { id: 'sustainable', icon: Leaf },
  ];

  const statusColors = {
    available: 'success',
    beta: 'warning',
    comingSoon: 'secondary',
  } as const;

  return (
    <>
      <Header locale={locale} />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl animate-breathe" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl animate-breathe animation-delay-200" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-200/20 dark:bg-secondary-900/10 rounded-full blur-3xl" />
          </div>

          <div className="container-app py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              {/* Animated badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                {t('common.tagline')}
              </div>

              {/* Main heading */}
              <h1 className="font-display text-display-lg md:text-display-xl lg:text-display-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 animate-fade-in-up">
                {t('hero.title')}{' '}
                <span className="text-gradient">{t('hero.titleHighlight')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-100 text-balance">
                {t('hero.subtitle')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-200">
                <Link href="/apps">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    {t('hero.cta')}
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">
                    {t('hero.ctaSecondary')}
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
                <div className="flex flex-col items-center gap-2 p-4">
                  <Shield className="w-8 h-8 text-primary-600" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {t('hero.privacy')}
                  </span>
                  <span className="text-sm text-neutral-500">{t('hero.privacyDesc')}</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <Wifi className="w-8 h-8 text-primary-600" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {t('hero.offline')}
                  </span>
                  <span className="text-sm text-neutral-500">{t('hero.offlineDesc')}</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <Heart className="w-8 h-8 text-primary-600" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {t('hero.fair')}
                  </span>
                  <span className="text-sm text-neutral-500">{t('hero.fairDesc')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-neutral-300 dark:border-neutral-700 rounded-full flex justify-center">
              <div className="w-1.5 h-3 bg-neutral-400 dark:bg-neutral-600 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </section>

        {/* Apps Section */}
        <section className="section bg-white dark:bg-neutral-900" id="apps">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('apps.title')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                {t('apps.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app, index) => {
                const Icon = app.icon;
                return (
                  <Card 
                    key={app.id} 
                    variant="interactive" 
                    padding="lg"
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`w-14 h-14 rounded-2xl ${app.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 ${app.color}`} />
                        </div>
                        <Badge variant={statusColors[app.status]}>
                          {t(`apps.status.${app.status}`)}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                          {t(`apps.${app.id}.name`)}
                        </h3>
                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                          {t(`apps.${app.id}.tagline`)}
                        </p>
                      </div>

                      <p className="text-neutral-600 dark:text-neutral-400">
                        {t(`apps.${app.id}.description`)}
                      </p>

                      <ul className="space-y-2">
                        {(t.raw(`apps.${app.id}.features`) as string[]).map((feature: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Check className="w-4 h-4 text-primary-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2">
                        {app.status === 'available' ? (
                          <Link href={`/apps/${app.id}`}>
                            <Button variant="primary" className="w-full">
                              {t('apps.tryFree')}
                            </Button>
                          </Link>
                        ) : app.status === 'beta' ? (
                          <Link href={`/apps/${app.id}`}>
                            <Button variant="secondary" className="w-full">
                              {t('apps.viewApp')}
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="ghost" className="w-full" disabled>
                            {t('common.comingSoon')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section" id="features">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('features.title')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={feature.id}
                    className="text-center p-6 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {t(`features.${feature.id}.title`)}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {t(`features.${feature.id}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section bg-primary-600 dark:bg-primary-900 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container-app text-center">
            <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
              {t('common.getStarted')}
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-10">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-primary-700 hover:bg-neutral-100"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t('pricing.free.cta')}
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t('nav.pricing')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AdBanner position="bottom" />
    </>
  );
}
