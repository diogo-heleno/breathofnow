'use client';

import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { runningDb } from '@/lib/db/running-db';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  Lightbulb,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { WORKOUT_TYPE_INFO, WorkoutSegment } from '@/types/running';
import { cn } from '@/lib/utils';

export default function WorkoutDetailPage() {
  const t = useTranslations('runLog');
  const params = useParams();
  const router = useRouter();
  const workoutId = parseInt(params.id as string);
  const [showWhy, setShowWhy] = useState(true);

  const workout = useLiveQuery(
    () => runningDb.runningWorkouts.get(workoutId),
    [workoutId]
  );

  const session = useLiveQuery(
    () => workout?.id ? runningDb.getSessionByWorkout(workout.id) : undefined,
    [workout?.id]
  );

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/running/plan" className="inline-flex items-center gap-2 text-primary-600 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>
          <div className="text-center py-12">
            <p className="text-gray-500">{t('workout.notFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = WORKOUT_TYPE_INFO[workout.type];
  const workoutDate = parseISO(workout.scheduledDate);
  const isWorkoutToday = isToday(workoutDate);
  const isWorkoutPast = isPast(workoutDate) && !isWorkoutToday;
  const isCompleted = !!session?.completedAt;

  // Parse segments
  let segments: WorkoutSegment[] = [];
  try {
    segments = JSON.parse(workout.segmentsJson || '[]');
  } catch {
    segments = [];
  }

  const handleMarkAsDone = async () => {
    if (!workout.id) return;

    // Create a session and mark it as completed immediately
    const sessionId = await runningDb.startSession(
      workout.planId,
      workout.id,
      workout.title,
      workout.type,
      workout.scheduledDate
    );

    // Complete the session with the planned distance
    await runningDb.completeSession(sessionId, {
      actualDistanceKm: workout.totalDistanceKm,
      feeling: 4, // Default to "good"
    });

    // Refresh page to show completion state
    router.refresh();
  };

  const getSegmentDescription = (segment: WorkoutSegment) => {
    const parts = [];

    if (segment.distanceKm) {
      parts.push(`${segment.distanceKm} km`);
    } else if (segment.durationMinutes) {
      parts.push(`${segment.durationMinutes} min`);
    } else if (segment.durationSeconds) {
      parts.push(`${segment.durationSeconds}"`);
    }

    if (segment.targetPace?.min && segment.targetPace?.max) {
      parts.push(`a ${segment.targetPace.min}-${segment.targetPace.max}`);
    } else if (segment.targetPace?.min) {
      parts.push(`a ${segment.targetPace.min}/km`);
    }

    if (segment.recoveryDurationSeconds) {
      const mins = Math.floor(segment.recoveryDurationSeconds / 60);
      parts.push(`(${mins}' rec)`);
    } else if (segment.recoveryDistanceM) {
      parts.push(`(${segment.recoveryDistanceM}m rec)`);
    }

    return parts.join(' ');
  };

  const getSegmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      warmup: 'Aquecimento',
      cooldown: 'Retorno à calma',
      work: 'Trabalho',
      recovery: 'Recuperação',
      strides: 'Strides',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pb-24">
      {/* Header */}
      <div
        className="text-white p-4 pb-8"
        style={{ backgroundColor: `var(--${typeInfo.color}-600, #16a34a)` }}
      >
        <div className="max-w-4xl mx-auto">
          <Link href="/running/plan" className="inline-flex items-center gap-2 text-white/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
              {typeInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/80 text-sm">
                  {t('dashboard.week')} {workout.weekNumber}
                </span>
                {isCompleted && (
                  <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Concluído
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">{workout.title}</h1>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(workoutDate, "EEEE, d MMM", { locale: pt })}
                </span>
                {workout.totalDistanceKm && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {workout.totalDistanceKm} km
                  </span>
                )}
                {workout.estimatedDurationMin && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~{workout.estimatedDurationMin} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 -mt-4 space-y-4">
        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-2">{t('workout.description')}</h2>
          <p className="text-gray-700">{workout.description}</p>
        </div>

        {/* Why Explanation */}
        {workout.whyExplanation && (
          <div className="bg-amber-50 rounded-xl shadow-sm p-4 border border-amber-200">
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold text-amber-900">{t('workout.whyTitle')}</h2>
              </div>
              <ChevronRight className={cn(
                "w-5 h-5 text-amber-600 transition-transform",
                showWhy && "rotate-90"
              )} />
            </button>
            {showWhy && (
              <p className="text-amber-800 mt-3">{workout.whyExplanation}</p>
            )}
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600" />
              {t('workout.segments')}
            </h2>
            <div className="space-y-2">
              {segments.map((segment, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    segment.type === 'warmup' && "bg-blue-50 border-blue-400",
                    segment.type === 'cooldown' && "bg-purple-50 border-purple-400",
                    segment.type === 'work' && "bg-orange-50 border-orange-400",
                    segment.type === 'recovery' && "bg-gray-50 border-gray-400",
                    segment.type === 'strides' && "bg-pink-50 border-pink-400",
                    !['warmup', 'cooldown', 'work', 'recovery', 'strides'].includes(segment.type) && "bg-gray-50 border-gray-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {segment.repetitions && segment.repetitions > 1 ? `${segment.repetitions}× ` : ''}
                        {getSegmentTypeLabel(segment.type)}
                      </span>
                      {segment.notes && (
                        <span className="text-gray-500 ml-2">({segment.notes})</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {getSegmentDescription(segment)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week Notes */}
        {workout.weekNotes && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h2 className="font-semibold text-gray-700 mb-2">Notas da Semana</h2>
            <p className="text-gray-600">{workout.weekNotes}</p>
          </div>
        )}

        {/* Race Info */}
        {workout.isRace && (
          <div className="bg-accent-50 rounded-xl shadow-sm p-4 border-2 border-accent-200">
            <h2 className="font-semibold text-accent-900 mb-2 flex items-center gap-2">
              🏁 {workout.raceName}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-accent-600">Tempo Alvo</div>
                <div className="text-xl font-bold text-accent-900">{workout.raceTargetTime}</div>
              </div>
              <div>
                <div className="text-sm text-accent-600">Ritmo Alvo</div>
                <div className="text-xl font-bold text-accent-900">{workout.raceTargetPace}/km</div>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Done Button */}
        {!isCompleted && (
          <button
            onClick={handleMarkAsDone}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors shadow-lg"
          >
            <CheckCircle className="w-6 h-6" />
            {t('workout.markAsDone')}
          </button>
        )}

        {isCompleted && (
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">{t('workout.completed')}</p>
            <Link
              href="/running/history"
              className="text-green-600 underline text-sm mt-1 inline-block"
            >
              Ver detalhes da sessão
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
