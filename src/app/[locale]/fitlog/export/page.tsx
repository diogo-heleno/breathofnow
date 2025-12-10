// FitLog Export Page

'use client';

import { ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExportOptions } from '@/components/fitlog/plans';

interface ExportPageProps {
  params: { locale: string };
}

export default function ExportPage({ params }: ExportPageProps) {
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
        <h1 className="text-xl font-bold text-neutral-900">Exportar para AI</h1>
        <p className="text-neutral-600">
          Gera prompts para criar ou ajustar o teu plano de treino com ChatGPT ou Claude.
        </p>
      </div>

      {/* Quick action - Questionnaire */}
      <Link
        href={`/${locale}/fitlog/create`}
        className="block p-4 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl text-white"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Criar Novo Plano com Questionário</h3>
            <p className="text-white/80 text-sm mt-1">
              Responde a um questionário detalhado e gera automaticamente uma prompt
              personalizada para o ChatGPT ou Claude criar o teu plano.
            </p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium">
              Começar questionário →
            </span>
          </div>
        </div>
      </Link>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-sm text-neutral-500">ou usa as opções rápidas</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      {/* Export Options */}
      <ExportOptions locale={locale} />

      {/* Instructions */}
      <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
        <h3 className="font-semibold text-neutral-900 mb-3">Como usar</h3>
        <ol className="text-sm text-neutral-600 space-y-3">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </span>
            <span>
              <strong className="text-neutral-900">Gera o prompt</strong> - Escolhe se queres criar
              um novo plano ou ajustar o atual com base no teu histórico.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </span>
            <span>
              <strong className="text-neutral-900">Cola no ChatGPT ou Claude</strong> - Abre o
              chatbot de AI da tua preferência e cola o prompt gerado.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </span>
            <span>
              <strong className="text-neutral-900">Responde às perguntas</strong> - Se for um novo
              plano, a AI vai fazer-te perguntas para personalizar o treino.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              4
            </span>
            <span>
              <strong className="text-neutral-900">Copia o JSON</strong> - Quando a AI gerar o
              plano, copia o JSON completo.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              5
            </span>
            <span>
              <strong className="text-neutral-900">Importa</strong> - Vai à página de &quot;Importar
              Plano&quot; e cola o JSON para adicionar à app.
            </span>
          </li>
        </ol>
      </div>

      {/* Tips */}
      <div className="p-4 bg-neutral-100 rounded-xl">
        <h3 className="font-semibold text-neutral-900 mb-2">💡 Dicas</h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• Exporta o histórico a cada 2-4 semanas para ajustar progressivamente</li>
          <li>• Inclui notas de como te sentiste para melhor personalização</li>
          <li>• Pede ao AI para explicar as alterações que fez ao plano</li>
          <li>• Guarda os planos antigos para comparar evolução</li>
        </ul>
      </div>
    </div>
  );
}
