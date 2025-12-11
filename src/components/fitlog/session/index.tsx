// FitLog Session Components

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Check,
  X,
  Clock,
  ExternalLink,
  SkipForward,
  MessageSquare,
} from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { useActiveSessionStore, useFitLogPreferences } from '@/stores/fitlog-store';
import { RestTimer, DifficultySelector, FeelingSelector, MuscleBadge, VideoLink } from '../common';
import type { Exercise, SetInput, ExerciseSet, Feeling } from '@/types/fitlog';

// ============================================
// SESSION HEADER
// ============================================

interface SessionHeaderProps {
  workoutName: string;
  startedAt: Date;
  exerciseIndex: number;
  totalExercises: number;
  onExit: () => void;
}

export function SessionHeader({
  workoutName,
  startedAt,
  exerciseIndex,
  totalExercises,
  onExit,
}: SessionHeaderProps) {
  const t = useTranslations('fitLog.session');
  const tCommon = useTranslations('common');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((exerciseIndex + 1) / totalExercises) * 100;

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900"
        >
          <X className="w-5 h-5" />
          <span className="text-sm">{tCommon('exit')}</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h1 className="font-semibold text-neutral-900 truncate">{workoutName}</h1>
        <span className="text-sm text-neutral-500">
          {exerciseIndex + 1}/{totalExercises}
        </span>
      </div>

      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// EXERCISE TRACKER
// ============================================

interface ExerciseTrackerProps {
  exercise: Exercise;
  sets: SetInput[];
  lastSessionSets?: ExerciseSet[];
  onUpdateSet: (setNumber: number, data: Partial<SetInput>) => void;
  onStartTimer: () => void;
}

export function ExerciseTracker({
  exercise,
  sets,
  lastSessionSets,
  onUpdateSet,
  onStartTimer,
}: ExerciseTrackerProps) {
  const { showVideoLinks } = useFitLogPreferences();
  const [expandedNotes, setExpandedNotes] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState<{ [key: number]: string }>({});

  // Get last session data for this exercise
  const getLastWeight = (setNumber: number): number | undefined => {
    if (!lastSessionSets) return undefined;
    const lastSet = lastSessionSets.find((s) => s.setNumber === setNumber);
    return lastSet?.weight;
  };

  const getLastReps = (setNumber: number): number | undefined => {
    if (!lastSessionSets) return undefined;
    const lastSet = lastSessionSets.find((s) => s.setNumber === setNumber);
    return lastSet?.reps;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Exercise Info */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-neutral-900">{exercise.name}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-medium text-primary-600">
            {exercise.sets} × {exercise.reps}
          </span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-600">Descanso: {exercise.restSeconds}s</span>
        </div>

        {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {exercise.muscleGroups.map((muscle) => (
              <MuscleBadge key={muscle} muscle={muscle} />
            ))}
          </div>
        )}

        {exercise.notes && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">💡 {exercise.notes}</p>
          </div>
        )}

        {showVideoLinks && exercise.videoUrl && (
          <VideoLink url={exercise.videoUrl} exerciseName={exercise.name} />
        )}
      </div>

      {/* Last Session Reference */}
      {lastSessionSets && lastSessionSets.length > 0 && (
        <div className="p-3 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-600 mb-1">Último treino:</p>
          <p className="font-medium text-neutral-900">
            {lastSessionSets[0]?.weight}kg × {lastSessionSets[0]?.reps} reps
          </p>
        </div>
      )}

      {/* Sets Input */}
      <div className="space-y-3">
        <h3 className="font-semibold text-neutral-700">Séries</h3>

        {sets.map((set, index) => (
          <SetInputRow
            key={set.setNumber}
            setNumber={set.setNumber}
            data={set}
            lastWeight={getLastWeight(set.setNumber)}
            lastReps={getLastReps(set.setNumber)}
            targetReps={exercise.reps}
            onChange={(data) => onUpdateSet(set.setNumber, data)}
            onStartTimer={onStartTimer}
            isExpanded={expandedNotes === set.setNumber}
            onToggleNotes={() =>
              setExpandedNotes(expandedNotes === set.setNumber ? null : set.setNumber)
            }
            noteValue={noteInput[set.setNumber] || ''}
            onNoteChange={(note) => setNoteInput({ ...noteInput, [set.setNumber]: note })}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// SET INPUT ROW
// ============================================

interface SetInputRowProps {
  setNumber: number;
  data: SetInput;
  lastWeight?: number;
  lastReps?: number;
  targetReps: string;
  onChange: (data: Partial<SetInput>) => void;
  onStartTimer: () => void;
  isExpanded: boolean;
  onToggleNotes: () => void;
  noteValue: string;
  onNoteChange: (note: string) => void;
}

function SetInputRow({
  setNumber,
  data,
  lastWeight,
  lastReps,
  targetReps,
  onChange,
  onStartTimer,
  isExpanded,
  onToggleNotes,
  noteValue,
  onNoteChange,
}: SetInputRowProps) {
  const isCompleted = data.weight !== undefined && data.reps !== undefined;

  const handleComplete = () => {
    if (isCompleted) {
      onStartTimer();
    }
  };

  if (data.skipped) {
    return (
      <div className="flex items-center justify-between p-3 bg-neutral-100 rounded-xl opacity-60">
        <span className="font-medium text-neutral-500">Série {setNumber}</span>
        <button
          onClick={() => onChange({ skipped: false })}
          className="text-sm text-primary-600 hover:underline"
        >
          Desfazer skip
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-neutral-200'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Set number */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            isCompleted
              ? 'bg-green-500 text-white'
              : 'bg-neutral-200 text-neutral-600'
          }`}
        >
          {isCompleted ? <Check className="w-4 h-4" /> : setNumber}
        </div>

        {/* Weight input */}
        <div className="flex-1">
          <label className="text-xs text-neutral-500 block mb-1">
            Peso (kg)
            {lastWeight && <span className="text-neutral-400 ml-1">(último: {lastWeight})</span>}
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder={lastWeight?.toString() || '0'}
            value={data.weight ?? ''}
            onChange={(e) =>
              onChange({ weight: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Reps input */}
        <div className="flex-1">
          <label className="text-xs text-neutral-500 block mb-1">
            Reps
            {lastReps && <span className="text-neutral-400 ml-1">(último: {lastReps})</span>}
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder={targetReps}
            value={data.reps ?? ''}
            onChange={(e) =>
              onChange({ reps: e.target.value ? parseInt(e.target.value, 10) : undefined })
            }
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-xs text-neutral-500 block mb-1 text-center">Dif.</label>
          <DifficultySelector
            value={data.difficulty}
            onChange={(difficulty) => onChange({ difficulty })}
          />
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleNotes}
            className={`flex items-center gap-1 text-sm ${
              isExpanded || noteValue ? 'text-primary-600' : 'text-neutral-500'
            } hover:text-primary-600`}
          >
            <MessageSquare className="w-4 h-4" />
            Nota
          </button>
          <button
            onClick={() => onChange({ skipped: true })}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        </div>

        {isCompleted && (
          <button
            onClick={handleComplete}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
          >
            <Clock className="w-4 h-4" />
            Timer
          </button>
        )}
      </div>

      {/* Notes expansion */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <textarea
            value={noteValue}
            onChange={(e) => {
              onNoteChange(e.target.value);
              onChange({ notes: e.target.value });
            }}
            placeholder={t('notesPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// SESSION NAVIGATION
// ============================================

interface SessionNavigationProps {
  currentIndex: number;
  totalExercises: number;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function SessionNavigation({
  currentIndex,
  totalExercises,
  onPrev,
  onNext,
  onFinish,
}: SessionNavigationProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalExercises - 1;

  return (
    <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-colors ${
            isFirst
              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
              : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {isLast ? (
          <button
            onClick={onFinish}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
          >
            <Check className="w-5 h-5" />
            Concluir Treino
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Próximo
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// SESSION TIMER MODAL
// ============================================

interface SessionTimerModalProps {
  seconds: number;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionTimerModal({ seconds, isOpen, onClose }: SessionTimerModalProps) {
  const t = useTranslations('fitLog.session');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-center mb-6">{t('restTime')}</h3>
        <RestTimer initialSeconds={seconds} onComplete={onClose} autoStart />
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          {tCommon('close')}
        </button>
      </div>
    </div>
  );
}

// ============================================
// SESSION SUMMARY MODAL
// ============================================

interface SessionSummaryModalProps {
  isOpen: boolean;
  sessionId: number;
  duration: number;
  totalSets: number;
  totalVolume: number;
  onSave: (feeling: Feeling | undefined, notes: string) => void;
  onCancel: () => void;
}

export function SessionSummaryModal({
  isOpen,
  sessionId,
  duration,
  totalSets,
  totalVolume,
  onSave,
  onCancel,
}: SessionSummaryModalProps) {
  const t = useTranslations('fitLog.session');
  const tCommon = useTranslations('common');
  const [feeling, setFeeling] = useState<Feeling | undefined>();
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} toneladas`;
    }
    return `${kg} kg`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md sm:m-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Treino Concluído! 🎉</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-neutral-100 rounded-xl">
            <p className="text-2xl font-bold text-neutral-900">{duration}</p>
            <p className="text-xs text-neutral-500">minutos</p>
          </div>
          <div className="text-center p-3 bg-neutral-100 rounded-xl">
            <p className="text-2xl font-bold text-neutral-900">{totalSets}</p>
            <p className="text-xs text-neutral-500">séries</p>
          </div>
          <div className="text-center p-3 bg-neutral-100 rounded-xl">
            <p className="text-lg font-bold text-neutral-900">{formatVolume(totalVolume)}</p>
            <p className="text-xs text-neutral-500">volume</p>
          </div>
        </div>

        {/* Feeling selector */}
        <div className="mb-6">
          <FeelingSelector value={feeling} onChange={setFeeling} />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('howWasWorkout')}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={() => onSave(feeling, notes)}
            className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            {tCommon('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXIT CONFIRMATION MODAL
// ============================================

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
}: ExitConfirmationModalProps) {
  const t = useTranslations('fitLog.session');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('confirmCancel')}</h3>
        <p className="text-neutral-600 mb-6">
          {t('cancelWorkoutWarning')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-neutral-300 rounded-xl font-medium hover:bg-neutral-100 transition-colors"
          >
            {tCommon('continue')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            {tCommon('exit')}
          </button>
        </div>
      </div>
    </div>
  );
}
