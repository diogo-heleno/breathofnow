import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { locales, type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'legal.terms' });
  return {
    title: t('title'),
  };
}

export default function TermsPage({ params: { locale } }: PageProps) {
  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations();
  const lastUpdated = new Date('2024-01-15').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-32 pb-20">
        <article className="container-narrow">
          <div className="mb-12">
            <h1 className="font-display text-display-md md:text-display-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('legal.terms.title')}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('legal.terms.lastUpdated', { date: lastUpdated })}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="lead">{t('legal.terms.intro')}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Breath of Now applications and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Breath of Now provides a collection of privacy-focused micro-applications for personal productivity, including expense tracking, investment monitoring, workout logging, recipe management, and more.
            </p>

            <h2>3. User Accounts</h2>
            <ul>
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must notify us immediately of any unauthorized use</li>
              <li>One person or entity may not maintain multiple accounts</li>
            </ul>

            <h2>4. User Data and Privacy</h2>
            <ul>
              <li>By default, your data is stored locally on your device</li>
              <li>You retain full ownership of your data</li>
              <li>We do not sell or share your personal data with third parties</li>
              <li>See our Privacy Policy for detailed information</li>
            </ul>

            <h2>5. Payment Terms</h2>
            <ul>
              <li>Free tier is available with limited features and discrete advertising</li>
              <li>Premium plans are billed according to the selected payment schedule</li>
              <li>Lifetime purchases include 1 year of updates</li>
              <li>Pay What You Want pricing is honored as stated</li>
              <li>Refunds are available within 14 days of purchase</li>
            </ul>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              Breath of Now and its original content, features, and functionality are owned by M21 Global, Lda. and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h2>8. Disclaimer of Warranties</h2>
            <p>
              The service is provided as is without any warranties. We do not guarantee that the service will be uninterrupted, secure, or error-free. Financial tracking tools are for informational purposes only and should not be considered financial advice.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              M21 Global, Lda. shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2>10. Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue the service at any time. We will provide reasonable notice before making significant changes.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These terms shall be governed by the laws of Portugal. Any disputes shall be resolved in the courts of Portugal.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li>Email: support@breathofnow.site</li>
              <li>Address: M21 Global, Lda., Sardoal, Portugal</li>
              <li>Website: <a href="https://www.m21global.com">www.m21global.com</a></li>
            </ul>
          </div>
        </article>
      </main>

      <Footer locale={locale} />
    </>
  );
}
