import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Eye, FileText, MessageSquare, Code, BookOpen, ArrowRight, Check, ExternalLink } from 'lucide-react';
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
    title: 'Open & Transparent - Breath of Now',
    description: 'We\'re clear about how our apps work and what they do with your data.',
  };
}

export default function OpenTransparentPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const transparencyItems = [
    {
      icon: FileText,
      title: 'Clear Privacy Policy',
      description: 'Our privacy policy is written in plain language, not legal jargon. You\'ll actually understand what we do with your data.',
    },
    {
      icon: Eye,
      title: 'No Hidden Data Collection',
      description: 'We tell you exactly what data we collect and why. Spoiler: it\'s almost nothing.',
    },
    {
      icon: MessageSquare,
      title: 'Direct Communication',
      description: 'Have questions? Email us directly. You\'ll get a response from a real person, not a bot.',
    },
    {
      icon: Code,
      title: 'Technical Transparency',
      description: 'We explain how our technology works, from local storage to encryption to sync.',
    },
    {
      icon: BookOpen,
      title: 'Changelog & Updates',
      description: 'Every update is documented. You know exactly what changed and why.',
    },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-200/30 dark:bg-cyan-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 mb-8">
                <Eye className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                Open & Transparent
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                We&apos;re clear about how our apps work and what they do with your data.
                No surprises, no fine print, no hidden agendas.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/privacy`}>
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Read Privacy Policy
                  </Button>
                </Link>
                <Link href="https://www.breathofnow.site/faq">
                  <Button variant="outline" size="lg">
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency Items */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Our Transparency Commitments
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                We believe trust is built through openness, not marketing speak
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {transparencyItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} variant="interactive">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* What We Don't Do */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  What We Don&apos;t Do
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Practices we&apos;ll never engage in
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Sell your data to third parties',
                  'Use deceptive dark patterns',
                  'Hide fees or surprise charges',
                  'Make cancellation difficult',
                  'Send spam or unwanted emails',
                  'Track you across the web',
                  'Use manipulative urgency tactics',
                  'Bury important information in fine print',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <span className="text-red-500 text-lg">✕</span>
                    <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  What We Do Instead
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Our commitments to you
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Keep your data on your device by default',
                  'Use clear, simple language everywhere',
                  'Show prices upfront—no hidden fees',
                  'Make cancellation a one-click process',
                  'Only email when you ask us to',
                  'Respect Do Not Track settings',
                  'Let you decide at your own pace',
                  'Explain everything in accessible terms',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Read More
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Privacy Policy', desc: 'How we handle your data', href: `/${locale}/privacy` },
                  { title: 'Terms of Service', desc: 'Our terms and conditions', href: `/${locale}/terms` },
                  { title: 'FAQ', desc: 'Common questions answered', href: 'https://www.breathofnow.site/faq' },
                ].map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{link.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{link.desc}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-neutral-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-cyan-600 dark:bg-cyan-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                Questions? Just Ask
              </h2>
              <p className="text-lg text-cyan-100 mb-8">
                We&apos;re always happy to explain how things work. No question is too small.
              </p>
              <a href="mailto:support@breathofnow.site">
                <Button variant="secondary" size="lg" className="bg-white text-cyan-700 hover:bg-cyan-50">
                  Contact Us
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
