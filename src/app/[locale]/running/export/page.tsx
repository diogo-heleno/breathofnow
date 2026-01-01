// RunLog Export Page - Generate prompts for LLM plan updates

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { runningDb, isRunningDbAvailable } from '@/lib/db/running-db';
import { useRunningStore } from '@/stores/running-store';
import type { RunningSession, RunningWorkout, ExportedRunningHistory } from '@/types/running';
import { WORKOUT_TYPE_INFO } from '@/types/running';

interface ExportPageProps {
  params: { locale: string };
}

export default function ExportPage({ params }: ExportPageProps) {
  const { locale } = params;
  const t = useTranslations('runLog.export');
  const tc = useTranslations('common');
  const { activePlanId, activePlan } = useRunningStore();

  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<RunningWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [weeksToInclude, setWeeksToInclude] = useState(4);
  const [promptType, setPromptType] = useState<'update' | 'feedback'>('update');

  useEffect(() => {
    async function loadData() {
      if (!activePlanId || !isRunningDbAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        // Load recent sessions
        const recentSessions = await runningDb.getSessionHistory(50);
        setSessions(recentSessions.filter(s => s.completedAt && s.planId === activePlanId));

        // Load upcoming workouts
        const today = new Date().toISOString().split('T')[0];
        const allWorkouts = await runningDb.getWorkoutsByPlan(activePlanId);
        const upcoming = allWorkouts
          .filter(w => w.scheduledDate >= today && w.type !== 'rest')
          .slice(0, 20);
        setUpcomingWorkouts(upcoming);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [activePlanId]);

  const generatePrompt = useCallback(() => {
    if (!activePlan) return '';

    const FEELING_LABELS = ['', 'Terrível', 'Mau', 'OK', 'Bom', 'Excelente'];

    // Calculate stats
    const totalDistance = sessions.reduce((sum, s) => sum + (s.actualDistanceKm || 0), 0);
    const totalDuration = sessions.reduce((sum, s) => sum + (s.actualDurationMin || 0), 0);
    const feelings = sessions.filter(s => s.feeling).map(s => s.feeling!);
    const avgFeeling = feelings.length > 0
      ? feelings.reduce((a, b) => a + b, 0) / feelings.length
      : 0;

    // Format sessions
    const sessionsText = sessions
      .slice(0, weeksToInclude * 3) // ~3 sessions per week
      .map(s => {
        const date = new Date(s.scheduledDate).toLocaleDateString('pt-PT');
        const typeInfo = WORKOUT_TYPE_INFO[s.workoutType];
        const feeling = s.feeling ? FEELING_LABELS[s.feeling] : '-';
        const rpe = s.perceivedEffort ? `RPE ${s.perceivedEffort}/10` : '';

        return `- ${date}: ${s.workoutTitle} (${typeInfo.name})
  Planeado: ${s.workoutTitle}
  Real: ${s.actualDistanceKm || '-'}km em ${s.actualDurationMin || '-'}min (${s.actualPaceAvg || '-'}/km)
  ${s.avgHeartRate ? `FC média: ${s.avgHeartRate} bpm` : ''}
  Sensação: ${feeling} ${rpe}
  ${s.notes ? `Notas: ${s.notes}` : ''}`;
      })
      .join('\n\n');

    // Format upcoming workouts
    const upcomingText = upcomingWorkouts
      .slice(0, 12)
      .map(w => {
        const date = new Date(w.scheduledDate).toLocaleDateString('pt-PT');
        return `- ${date} (Semana ${w.weekNumber}): ${w.title}
  ${w.description}`;
      })
      .join('\n\n');

    if (promptType === 'update') {
      return `# Pedido de Atualização do Plano de Corrida

## Informações do Atleta
- Nome: ${activePlan.athleteName || 'Atleta'}
- Plano: ${activePlan.name}
- Semana atual: ${Math.floor((Date.now() - new Date(activePlan.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))} de ${activePlan.totalWeeks}

## Objetivos
${activePlan.goalRaces?.map(r => `- ${r.name} (${r.date}): ${r.distance} em ${r.targetTime} (${r.targetPace}/km)`).join('\n') || 'Sem provas definidas'}

## Resumo das Últimas ${weeksToInclude} Semanas
- Treinos completados: ${sessions.length}
- Distância total: ${totalDistance.toFixed(1)} km
- Tempo total: ${Math.round(totalDuration)} minutos
- Sensação média: ${avgFeeling.toFixed(1)}/5

## Histórico de Treinos Recentes
${sessionsText || 'Sem treinos registados ainda.'}

## Próximos Treinos Planeados
${upcomingText || 'Sem treinos futuros definidos.'}

---

## Pedido
Com base no histórico acima, por favor:
1. Analisa a progressão e identifica pontos fortes/fracos
2. Sugere ajustes aos próximos treinos se necessário
3. Mantém o formato JSON compatível com a app

Responde com:
1. **Análise** (breve)
2. **Recomendações** (bullets)
3. **Plano Atualizado** (JSON no formato abaixo)

### Formato JSON esperado:
\`\`\`json
{
  "planName": "${activePlan.name}",
  "athleteName": "${activePlan.athleteName || ''}",
  "startDate": "${activePlan.startDate}",
  "goals": [...],
  "weeks": [
    {
      "weekNumber": 1,
      "dates": "DD/MM–DD/MM/YYYY",
      "phase": "build|peak|taper|recovery|race",
      "notes": "Notas da semana",
      "workouts": [
        {
          "dayOfWeek": 3,
          "title": "Título do treino",
          "description": "Descrição completa",
          "type": "easy|long|tempo|intervals|fartlek|hills|recovery|race|strides|progression",
          "totalDistanceKm": 10,
          "segments": [
            {
              "type": "warmup|work|recovery|cooldown|strides|easy",
              "description": "Descrição",
              "distanceKm": 2,
              "pace": { "min": "5:30", "max": "5:40" }
            }
          ],
          "whyExplanation": "Explicação do porquê deste treino",
          "isRace": false
        }
      ]
    }
  ]
}
\`\`\``;
    } else {
      return `# Feedback sobre Treino de Corrida

## Atleta
- Nome: ${activePlan.athleteName || 'Atleta'}
- Plano: ${activePlan.name}

## Últimos Treinos
${sessionsText || 'Sem treinos registados.'}

## Perguntas
1. Estou a progredir bem para os meus objetivos?
2. Devo ajustar alguma coisa nos próximos treinos?
3. Há sinais de overtraining ou fadiga acumulada?

Por favor, dá-me feedback construtivo sobre a minha progressão.`;
    }
  }, [activePlan, sessions, upcomingWorkouts, weeksToInclude, promptType]);

  const handleCopy = async () => {
    const prompt = generatePrompt();
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-yellow-900">{t('noPlan')}</h2>
          <p className="text-yellow-700 mt-1">{t('noPlanDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="text-neutral-600 mt-1">{t('description')}</p>
      </div>

      {/* How it works */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {t('howItWorks')}
        </h3>
        <ol className="space-y-3 text-sm text-primary-800">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-200 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>{t('step1')}</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-200 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>{t('step2')}</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-200 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>{t('step3')}</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-200 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <span>{t('step4')}</span>
          </li>
        </ol>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">
            {t('promptType')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPromptType('update')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                promptType === 'update'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="font-medium text-neutral-900">{t('typeUpdate')}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('typeUpdateDescription')}</p>
            </button>
            <button
              onClick={() => setPromptType('feedback')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                promptType === 'feedback'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="font-medium text-neutral-900">{t('typeFeedback')}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('typeFeedbackDescription')}</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">
            {t('weeksToInclude')}
          </label>
          <div className="flex gap-2">
            {[2, 4, 6, 8].map(weeks => (
              <button
                key={weeks}
                onClick={() => setWeeksToInclude(weeks)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  weeksToInclude === weeks
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {weeks} {t('weeks')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-neutral-700">{t('preview')}</label>
          <span className="text-xs text-neutral-500">
            {generatePrompt().length} {t('characters')}
          </span>
        </div>
        <div className="bg-neutral-800 text-neutral-100 p-4 rounded-xl max-h-96 overflow-auto">
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {generatePrompt()}
          </pre>
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            {t('copied')}
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            {t('copyPrompt')}
          </>
        )}
      </button>

      {/* Stats */}
      <div className="bg-neutral-100 rounded-xl p-4">
        <h3 className="font-semibold text-neutral-900 mb-3">{t('dataIncluded')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">{t('sessionsIncluded')}</p>
            <p className="font-semibold text-neutral-900">{Math.min(sessions.length, weeksToInclude * 3)}</p>
          </div>
          <div>
            <p className="text-neutral-500">{t('upcomingWorkouts')}</p>
            <p className="font-semibold text-neutral-900">{Math.min(upcomingWorkouts.length, 12)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
