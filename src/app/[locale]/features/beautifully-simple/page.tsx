import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Sparkles, Zap, Target, Clock, Layers, Minimize2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { locales, type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: PageProps) {
  return {
    title: 'Beautifully Simple - Breath of Now',
    description: 'No bloat, no complexity. Each app does one thing and does it exceptionally well.',
  };
}

export default function BeautifullySimplePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const principles = [
    {
      icon: Target,
      title: 'One App, One Purpose',
      description: 'Each app is designed to do exactly one thing exceptionally well. No feature bloat, no confusion.',
    },
    {
      icon: Zap,
      title: 'Fast by Design',
      description: 'Common actions take under 3 seconds. Add an expense in seconds, not minutes.',
    },
    {
      icon: Minimize2,
      title: 'Minimal Interface',
      description: 'Clean, distraction-free designs that let you focus on what matters.',
    },
    {
      icon: Clock,
      title: 'Respect Your Time',
      description: 'No onboarding flows, no tutorials needed. Just open and start using.',
    },
    {
      icon: Layers,
      title: 'Progressive Complexity',
      description: 'Simple by default, with advanced features available when you need them.',
    },
    {
      icon: Sparkles,
      title: 'Thoughtful Details',
      description: 'Every interaction is crafted with care. Smooth animations, intuitive gestures.',
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 mb-8">
                <Sparkles className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                Beautifully Simple
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                No bloat, no complexity. Each app does one thing and does it exceptionally well.
                We believe less is more.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/auth/signup`}>
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link href="https://www.breathofnow.site/#apps">
                  <Button variant="outline" size="lg">
                    Explore Apps
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Principles Section */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Our Design Principles
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Simplicity isn't about removing features—it's about making the right features effortless
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {principles.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {principle.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {principle.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Speed Stats */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Speed Matters
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  We obsess over performance so you don't have to wait
                </p>
              </div>

              <div className="grid grid-cols-3 gap-8 text-center">
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="text-4xl font-bold text-primary-600 mb-2">&lt;3s</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Add an expense</div>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="text-4xl font-bold text-primary-600 mb-2">&lt;1s</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">App load time</div>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="text-4xl font-bold text-primary-600 mb-2">0</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Required tutorials</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  The Breath of Now Approach
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl border-2 border-red-200 bg-red-50/50 dark:bg-red-900/10">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4">❌ What We Avoid</h3>
                  <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <li>• Feature creep and bloated interfaces</li>
                    <li>• Complicated onboarding flows</li>
                    <li>• Notifications and interruptions</li>
                    <li>• Gamification and dopamine tricks</li>
                    <li>• Dark patterns and confusion</li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl border-2 border-green-200 bg-green-50/50 dark:bg-green-900/10">
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-4">✓ What We Embrace</h3>
                  <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <li>• Focused, single-purpose apps</li>
                    <li>• Intuitive, learnable interfaces</li>
                    <li>• Respect for your attention</li>
                    <li>• Genuine usefulness over engagement</li>
                    <li>• Clear, honest design</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-purple-600 dark:bg-purple-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                Experience Simplicity
              </h2>
              <p className="text-lg text-purple-100 mb-8">
                Tools that respect your time and attention. Start using apps that just work.
              </p>
              <Link href={`/${locale}/auth/signup`}>
                <Button variant="secondary" size="lg" className="bg-white text-purple-700 hover:bg-purple-50">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
