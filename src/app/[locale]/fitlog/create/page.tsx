// FitLog Create Plan Page - Questionnaire

'use client';

import { WorkoutQuestionnaire } from '@/components/fitlog/questionnaire';

interface CreatePageProps {
  params: { locale: string };
}

export default function CreatePage({ params }: CreatePageProps) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Criar Plano de Treino
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
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
