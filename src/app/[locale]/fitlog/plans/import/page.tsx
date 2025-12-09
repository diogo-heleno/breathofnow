// FitLog Import Plan Page

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { JsonImporter } from '@/components/fitlog/plans';

interface ImportPageProps {
  params: { locale: string };
}

export default function ImportPage({ params }: ImportPageProps) {
  const { locale } = params;
  const router = useRouter();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Importar Plano</h1>
        <p className="text-neutral-600">
          Cola o JSON do plano de treino gerado pelo ChatGPT ou Claude.
        </p>
      </div>

      {/* Importer */}
      <JsonImporter
        locale={locale}
        onSuccess={(planId) => {
          router.push(`/${locale}/fitlog`);
        }}
      />
    </div>
  );
}
