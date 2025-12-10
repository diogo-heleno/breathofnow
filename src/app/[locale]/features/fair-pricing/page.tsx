import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Heart, Globe, Users, Wallet, Scale, ArrowRight, Check } from 'lucide-react';
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
    title: 'Fair Pricing - Breath of Now',
    description: 'Pay what you can afford. Our prices adapt to your region\'s cost of living.',
  };
}

export default function FairPricingPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);

  const tiers = [
    { region: 'High Income', countries: 'US, Switzerland, Norway, UAE', discount: '0%', factor: '1.0x' },
    { region: 'Upper Middle', countries: 'Germany, UK, France, Japan', discount: '20%', factor: '0.8x' },
    { region: 'Middle', countries: 'Portugal, Poland, Mexico, Thailand', discount: '40%', factor: '0.6x' },
    { region: 'Lower Middle', countries: 'Brazil, Turkey, South Africa, India', discount: '60%', factor: '0.4x' },
    { region: 'Low Income', countries: 'Nigeria, Bangladesh, Kenya, Angola', discount: '75%', factor: '0.25x' },
  ];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/20 rounded-full blur-3xl" />
          </div>

          <div className="container-app">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-8">
                <Heart className="w-10 h-10" />
              </div>

              <h1 className="font-display text-display-lg md:text-display-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                Fair Pricing
              </h1>

              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                Pay what you can afford. Our prices automatically adapt to your region's cost of living.
                Quality tools should be accessible to everyone.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://www.breathofnow.site/pricing">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    View Pricing
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

        {/* How It Works */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                How Fair Pricing Works
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                We automatically detect your location and adjust prices accordingly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card variant="interactive">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-4">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    1. Detect Location
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    We use your IP address to determine your country automatically
                  </p>
                </CardContent>
              </Card>

              <Card variant="interactive">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-4">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    2. Calculate Fair Price
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    We apply a regional factor based on cost of living data
                  </p>
                </CardContent>
              </Card>

              <Card variant="interactive">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-4">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    3. Pay What's Fair
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    You see adjusted prices that reflect your local economy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Regional Tiers */}
        <section className="py-20">
          <div className="container-app">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Regional Pricing Tiers
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Based on GDP per capita and purchasing power parity
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">Region</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">Example Countries</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {tiers.map((tier, index) => (
                      <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {tier.region}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {tier.countries}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            tier.discount === '0%' 
                              ? 'bg-neutral-100 text-neutral-600' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {tier.discount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-center text-sm text-neutral-500 mt-4">
                * Discounts are applied automatically based on your IP location
              </p>
            </div>
          </div>
        </section>

        {/* Why We Do This */}
        <section className="py-20 bg-white dark:bg-neutral-900">
          <div className="container-app">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-display-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Why Fair Pricing?
                </h2>
              </div>

              <div className="space-y-6">
                {[
                  {
                    title: 'Access for Everyone',
                    description: 'A €10/month subscription might be affordable in Germany but not in India. We believe everyone deserves access to quality tools.',
                  },
                  {
                    title: 'Sustainable Business',
                    description: 'Regional pricing allows us to serve more users globally while maintaining a sustainable business model.',
                  },
                  {
                    title: 'Building Global Community',
                    description: 'Users from 100+ countries use our apps. Fair pricing helps us build a diverse, worldwide community.',
                  },
                  {
                    title: 'No Compromise on Quality',
                    description: 'Everyone gets the same features. The only difference is the price—matched to what\'s fair for your region.',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-rose-600 dark:bg-rose-800">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-display-sm md:text-display-md font-bold text-white mb-6">
                See Your Fair Price
              </h2>
              <p className="text-lg text-rose-100 mb-8">
                Check out our pricing page to see the fair price for your region.
              </p>
              <Link href="https://www.breathofnow.site/pricing">
                <Button variant="secondary" size="lg" className="bg-white text-rose-700 hover:bg-rose-50">
                  View Pricing
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
