// FitLog Workouts List Page

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Clock, Target, ChevronRight, Calendar } from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { useFitLogStore } from '@/stores/fitlog-store';
import { EmptyState } from '@/components/fitlog/common';
import type { Workout, WorkoutSession } from '@/types/fitlog';
import { DAYS_OF_WEEK } from '@/types/fitlog';

interface WorkoutsPageProps {
  params: { locale: string };
}

export default function WorkoutsPage({ params }: WorkoutsPageProps) {
  const { locale } = params;
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<{ [key: number]: number }>({});
  const [lastSessions, setLastSessions] = useState<{ [key: number]: WorkoutSession | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { activePlanId } = useFitLogStore();

  useEffect(() => {
    async function loadWorkouts() {
      if (!activePlanId) {
        setIsLoading(false);
        return;
      }

      try {
        const planWorkouts = await fitlogDb.getWorkoutsByPlan(activePlanId);
        setWorkouts(planWorkouts);

        // Load exercise counts and last sessions for each workout
        const counts: { [key: number]: number } = {};
        const sessions: { [key: number]: WorkoutSession | null } = {};

        for (const workout of planWorkouts) {
          const exercises = await fitlogDb.getExercisesByWorkout(workout.id!);
          counts[workout.id!] = exercises.length;

          const lastSession = await fitlogDb.getLastSessionForWorkout(workout.id!);
          sessions[workout.id!] = lastSession || null;
        }

        setExerciseCounts(counts);
        setLastSessions(sessions);
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkouts();
  }, [activePlanId]);

  const today = new Date().getDay();

  const formatLastSession = (session: WorkoutSession | null): string => {
    if (!session || !session.completedAt) return 'Nunca';
    
    const date = new Date(session.completedAt);
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-neutral-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!activePlanId) {
    return (
      <div className="p-4">
        <EmptyState
          title="Nenhum plano ativo"
          description="Importa um plano de treino para ver os treinos disponíveis."
          action={{
            label: 'Importar Plano',
            onClick: () => (window.location.href = `/${locale}/fitlog/plans/import`),
          }}
        />
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="Sem treinos"
          description="O plano atual não tem treinos definidos."
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Treinos da Semana</h1>

      <div className="space-y-3">
        {workouts.map((workout) => {
          const isToday = workout.dayOfWeek === today;
          const exerciseCount = exerciseCounts[workout.id!] || 0;
          const lastSession = lastSessions[workout.id!];

          return (
            <Link
              key={workout.id}
              href={`/${locale}/fitlog/workout/${workout.id}`}
              className={`block p-4 rounded-xl border transition-all ${
                isToday
                  ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-primary text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {DAYS_OF_WEEK[workout.dayOfWeek]}
                    </span>
                    {isToday && (
                      <span className="text-xs text-primary font-medium">• Hoje</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-neutral-900 mt-2">{workout.name}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>

              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {exerciseCount} exercícios
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {workout.targetDuration} min
                </span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                <span className="text-sm text-neutral-500">
                  Último: {formatLastSession(lastSession)}
                </span>
                
                {isToday && (
                  <Link
                    href={`/${locale}/fitlog/workout/${workout.id}/session`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Play className="w-4 h-4" />
                    Iniciar
                  </Link>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
