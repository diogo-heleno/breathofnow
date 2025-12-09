// FitLog Workout Detail Page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Clock,
  Target,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { MuscleBadge, VideoLink, EmptyState } from '@/components/fitlog/common';
import type { Workout, Exercise, WorkoutSession } from '@/types/fitlog';
import { DAYS_OF_WEEK } from '@/types/fitlog';

interface WorkoutDetailPageProps {
  params: { locale: string; id: string };
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const { locale, id } = params;
  const router = useRouter();
  const workoutId = parseInt(id, 10);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  useEffect(() => {
    async function loadWorkout() {
      try {
        const data = await fitlogDb.getWorkoutWithExercises(workoutId);
        if (data) {
          setWorkout(data.workout);
          setExercises(data.exercises);

          const session = await fitlogDb.getLastSessionForWorkout(workoutId);
          setLastSession(session || null);
        }
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkout();
  }, [workoutId]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
        <div className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="p-4">
        <EmptyState
          title="Treino não encontrado"
          description="Este treino não existe ou foi eliminado."
          action={{
            label: 'Voltar',
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  const formatLastSession = (session: WorkoutSession | null): string => {
    if (!session || !session.completedAt) return 'Nunca realizado';

    const date = new Date(session.completedAt);
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;

    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="pb-24">
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
          <span className="text-sm text-primary font-medium">
            {DAYS_OF_WEEK[workout.dayOfWeek]}
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 mt-1">{workout.name}</h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {exercises.length} exercícios
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {workout.targetDuration} min
          </span>
        </div>

        {lastSession && (
          <div className="p-3 bg-neutral-100 rounded-lg">
            <p className="text-sm text-neutral-600">
              Último treino: <span className="font-medium text-neutral-900">{formatLastSession(lastSession)}</span>
              {lastSession.duration && ` · ${lastSession.duration} min`}
              {lastSession.feeling && ` · ${['😫', '😕', '😐', '😊', '🤩'][lastSession.feeling - 1]}`}
            </p>
          </div>
        )}
      </div>

      {/* Warmup */}
      {workout.warmupDescription && (
        <div className="px-4 mb-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-1">
              🔥 Aquecimento ({workout.warmupDuration || 5} min)
            </h3>
            <p className="text-sm text-amber-700">{workout.warmupDescription}</p>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="px-4 space-y-3">
        <h2 className="font-semibold text-neutral-900">Exercícios</h2>

        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id!)
              }
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{exercise.name}</h3>
                    <p className="text-sm text-primary font-medium mt-0.5">
                      {exercise.sets} × {exercise.reps}
                    </p>
                  </div>
                </div>
                {expandedExercise === exercise.id ? (
                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                )}
              </div>
            </button>

            {expandedExercise === exercise.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <span>Descanso: {exercise.restSeconds}s</span>
                  {exercise.equipmentNeeded && <span>{exercise.equipmentNeeded}</span>}
                </div>

                {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscleGroups.map((muscle) => (
                      <MuscleBadge key={muscle} muscle={muscle} />
                    ))}
                  </div>
                )}

                {exercise.notes && (
                  <p className="text-sm text-neutral-600 p-3 bg-neutral-50 rounded-lg">
                    💡 {exercise.notes}
                  </p>
                )}

                {exercise.videoUrl && (
                  <VideoLink url={exercise.videoUrl} exerciseName={exercise.name} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cardio */}
      {workout.cardioDescription && (
        <div className="px-4 mt-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-1">
              🏃 Cardio Final ({workout.cardioDuration || 10} min)
            </h3>
            <p className="text-sm text-blue-700">{workout.cardioDescription}</p>
            {workout.cardioAlternatives && workout.cardioAlternatives.length > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                Alternativas: {workout.cardioAlternatives.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Start Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white">
        <div className="max-w-lg mx-auto">
          <Link
            href={`/${locale}/fitlog/workout/${workout.id}/session`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Play className="w-5 h-5" />
            Iniciar Treino
          </Link>
        </div>
      </div>
    </div>
  );
}
