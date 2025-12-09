// FitLog Session Detail Page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Dumbbell,
  Check,
  SkipForward,
} from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { EmptyState, MuscleBadge } from '@/components/fitlog/common';
import type { WorkoutSession, ExerciseSet, Exercise } from '@/types/fitlog';

interface SessionDetailPageProps {
  params: { locale: string; sessionId: string };
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { locale, sessionId: sessionIdParam } = params;
  const router = useRouter();
  const sessionId = parseInt(sessionIdParam, 10);

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [exercises, setExercises] = useState<{ [key: number]: Exercise }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await fitlogDb.getSessionWithSets(sessionId);
        if (data) {
          setSession(data.session);
          setSets(data.sets);

          // Load exercise details
          const exerciseIds = [...new Set(data.sets.map((s) => s.exerciseId))];
          const exerciseMap: { [key: number]: Exercise } = {};

          for (const exId of exerciseIds) {
            const exercise = await fitlogDb.exercises.get(exId);
            if (exercise) {
              exerciseMap[exId] = exercise;
            }
          }

          setExercises(exerciseMap);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
        <div className="h-48 bg-neutral-200 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4">
        <EmptyState
          title="Sessão não encontrada"
          description="Esta sessão não existe ou foi eliminada."
          action={{
            label: 'Voltar',
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} toneladas`;
    }
    return `${kg} kg`;
  };

  // Group sets by exercise
  const setsByExercise = sets.reduce((groups, set) => {
    if (!groups[set.exerciseId]) {
      groups[set.exerciseId] = [];
    }
    groups[set.exerciseId].push(set);
    return groups;
  }, {} as { [key: number]: ExerciseSet[] });

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="p-4 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {session.workoutName || 'Treino'}
          </h1>
          <p className="text-neutral-500 mt-1">{formatDate(session.startedAt)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-xl border border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Duração</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {session.duration || 0} min
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {formatTime(session.startedAt)} -{' '}
              {session.completedAt ? formatTime(session.completedAt) : '?'}
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Volume Total</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {formatVolume(session.totalVolume || 0)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {session.totalSets || 0} séries completadas
            </p>
          </div>
        </div>

        {session.feeling && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-neutral-200 flex items-center gap-3">
            <span className="text-3xl">
              {['😫', '😕', '😐', '😊', '🤩'][session.feeling - 1]}
            </span>
            <div>
              <p className="text-sm text-neutral-500">Como te sentiste</p>
              <p className="font-medium text-neutral-900">
                {['Péssimo', 'Mau', 'Normal', 'Bom', 'Excelente'][session.feeling - 1]}
              </p>
            </div>
          </div>
        )}

        {session.notes && (
          <div className="mt-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-sm text-neutral-500 mb-1">Notas</p>
            <p className="text-neutral-900">{session.notes}</p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="px-4 space-y-4">
        <h2 className="font-semibold text-neutral-900">Exercícios</h2>

        {Object.entries(setsByExercise).map(([exerciseIdStr, exerciseSets]) => {
          const exerciseId = parseInt(exerciseIdStr, 10);
          const exercise = exercises[exerciseId];
          const exerciseName = exercise?.name || exerciseSets[0]?.exerciseName || 'Exercício';

          // Calculate exercise stats
          const completedSets = exerciseSets.filter((s) => !s.skipped);
          const maxWeight = Math.max(...completedSets.map((s) => s.weight || 0));
          const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);

          return (
            <div
              key={exerciseId}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              <div className="p-4 border-b border-neutral-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{exerciseName}</h3>
                    {exercise?.muscleGroups && exercise.muscleGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exercise.muscleGroups.map((muscle) => (
                          <MuscleBadge key={muscle} muscle={muscle} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">
                      {completedSets.length}/{exerciseSets.length} séries
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Max: {maxWeight}kg · {totalReps} reps
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-neutral-100">
                {exerciseSets.map((set, index) => (
                  <div
                    key={set.id}
                    className={`flex items-center justify-between p-3 ${
                      set.skipped ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                          set.skipped
                            ? 'bg-neutral-200 text-neutral-500'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {set.skipped ? (
                          <SkipForward className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-medium text-neutral-900">
                          Série {set.setNumber}
                        </p>
                        {!set.skipped && (
                          <p className="text-sm text-neutral-500">
                            {set.weight}kg × {set.reps} reps
                          </p>
                        )}
                        {set.skipped && (
                          <p className="text-sm text-neutral-400">Pulada</p>
                        )}
                      </div>
                    </div>

                    {!set.skipped && (
                      <span className="text-xl">
                        {['😊', '😐', '😓'][set.difficulty - 1]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
