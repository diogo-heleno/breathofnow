'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { type Locale } from '@/i18n';

interface PageProps {
  params: { locale: Locale };
}

interface FAQItem {
  question: string;
  answer: string;
}

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left"
      >
        <span className="font-display text-lg font-medium text-neutral-900 dark:text-neutral-100 pr-8">
          {item.question}
        </span>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-neutral-500 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 pb-6" : "max-h-0"
        )}
      >
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage({ params: { locale } }: PageProps) {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = t.raw('faq.items') as FAQItem[];

  return (
    <>
      <Header locale={locale} />
      
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-narrow">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display text-display-md md:text-display-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('faq.title')}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('faq.subtitle')}
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 md:px-8">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-16 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Still have questions?
            </p>
            <a 
              href="mailto:support@breathofnow.site"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Contact us at support@breathofnow.site
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
