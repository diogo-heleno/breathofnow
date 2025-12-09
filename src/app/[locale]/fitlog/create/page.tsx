// FitLog Create Plan Page - Questionnaire

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { WorkoutQuestionnaire } from '@/components/fitlog/questionnaire';

interface CreatePageProps {
  params: { locale: string };
}

export default function CreatePage({ params }: CreatePageProps) {
  const { locale } = params;
  const router = useRouter();

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Criar Plano de Treino</h1>
        <p className="text-neutral-600">
          Responde ao questionário para gerar uma prompt personalizada para o ChatGPT ou Claude.
        </p>
      </div>

      {/* Questionnaire */}
      <WorkoutQuestionnaire
        onComplete={(prompt) => {
          console.log('Prompt generated:', prompt.length, 'characters');
        }}
      />
    </div>
  );
}
