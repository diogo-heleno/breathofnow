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
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });
  return {
    title: t('title'),
  };
}

export default function PrivacyPage({ params: { locale } }: PageProps) {
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
              {t('legal.privacy.title')}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('legal.privacy.lastUpdated', { date: lastUpdated })}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="lead">{t('legal.privacy.intro')}</p>

            <h2>1. Information We Collect</h2>
            <p>Breath of Now is designed with privacy at its core. By default, we collect minimal information:</p>
            <ul>
              <li><strong>Account Information:</strong> If you create an account, we collect your email address for authentication purposes.</li>
              <li><strong>Local Data:</strong> All app data (expenses, investments, workouts, recipes, etc.) is stored locally on your device by default.</li>
              <li><strong>Optional Cloud Backup:</strong> If you enable cloud backup, your encrypted data is stored on our servers.</li>
              <li><strong>Analytics:</strong> We collect anonymous usage analytics to improve our apps.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Process payments (if you choose to support us)</li>
              <li>Send important updates about our services</li>
              <li>Improve our apps based on anonymous usage patterns</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <ul>
              <li><strong>Local Storage:</strong> By default, all your data is stored in your browser IndexedDB.</li>
              <li><strong>Encryption:</strong> If you enable cloud backup, your data is encrypted using AES-256.</li>
              <li><strong>No Third-Party Access:</strong> We never share your personal data with third parties.</li>
            </ul>

            <h2>4. Advertising</h2>
            <p>Free users see discrete advertising banners. These ads are served through privacy-respecting networks and can be removed by upgrading to premium.</p>

            <h2>5. Your Rights</h2>
            <ul>
              <li>Access your personal data</li>
              <li>Export your data at any time</li>
              <li>Delete your account and all associated data</li>
              <li>Opt-out of analytics and non-essential cookies</li>
            </ul>

            <h2>6. Contact Us</h2>
            <p>Email: support@breathofnow.site</p>
            <p>Address: M21 Global, Lda., Sardoal, Portugal</p>
          </div>
        </article>
      </main>

      <Footer locale={locale} />
    </>
  );
}
