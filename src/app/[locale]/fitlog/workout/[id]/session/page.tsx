// FitLog Active Session Page

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { useActiveSessionStore, useFitLogPreferences, useFitLogStore } from '@/stores/fitlog-store';
import {
  SessionHeader,
  ExerciseTracker,
  SessionNavigation,
  SessionTimerModal,
  SessionSummaryModal,
  ExitConfirmationModal,
} from '@/components/fitlog/session';
import { EmptyState } from '@/components/fitlog/common';
import type { Exercise, ExerciseSet, SetInput, Feeling } from '@/types/fitlog';

interface SessionPageProps {
  params: { locale: string; id: string };
}

export default function SessionPage({ params }: SessionPageProps) {
  const { locale, id } = params;
  const router = useRouter();
  const workoutId = parseInt(id, 10);
  const { defaultRestTimer } = useFitLogPreferences();
  const { activePlanId } = useFitLogStore();

  const {
    sessionId,
    workoutName,
    startedAt,
    exercises,
    currentExerciseIndex,
    setsData,
    startSession,
    endSession,
    setCurrentExercise,
    nextExercise,
    prevExercise,
    updateSet,
    getExerciseSets,
  } = useActiveSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [lastSessionSets, setLastSessionSets] = useState<{ [key: number]: ExerciseSet[] }>({});
  const [showTimer, setShowTimer] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [summaryData, setSummaryData] = useState({
    duration: 0,
    totalSets: 0,
    totalVolume: 0,
  });

  // Initialize session
  useEffect(() => {
    async function initSession() {
      if (!activePlanId) {
        router.push(`/${locale}/fitlog`);
        return;
      }

      try {
        // Get workout and exercises
        const data = await fitlogDb.getWorkoutWithExercises(workoutId);
        if (!data) {
          router.push(`/${locale}/fitlog`);
          return;
        }

        // Start new session in DB
        const newSessionId = await fitlogDb.startSession(
          activePlanId,
          workoutId,
          data.workout.name
        );

        // Initialize session store
        startSession(
          newSessionId,
          activePlanId,
          workoutId,
          data.workout.name,
          data.exercises
        );

        // Load last session sets for each exercise
        const lastSets: { [key: number]: ExerciseSet[] } = {};
        for (const exercise of data.exercises) {
          const sets = await fitlogDb.getLastSetsForExercise(exercise.id!, 10);
          lastSets[exercise.id!] = sets;
        }
        setLastSessionSets(lastSets);

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing session:', error);
        router.push(`/${locale}/fitlog`);
      }
    }

    initSession();

    // Cleanup on unmount
    return () => {
      // Don't end session on unmount - user might navigate back
    };
  }, [workoutId, activePlanId, locale, router, startSession]);

  // Handle session completion
  const handleFinish = useCallback(async () => {
    if (!sessionId || !startedAt) return;

    // Calculate summary
    let totalSets = 0;
    let totalVolume = 0;

    for (const exercise of exercises) {
      const sets = getExerciseSets(exercise.id!);
      for (const set of sets) {
        if (!set.skipped && set.weight && set.reps) {
          totalSets++;
          totalVolume += set.weight * set.reps;
        }
      }
    }

    const duration = Math.round((Date.now() - startedAt.getTime()) / 60000);

    setSummaryData({
      duration,
      totalSets,
      totalVolume,
    });

    setShowSummary(true);
  }, [sessionId, startedAt, exercises, getExerciseSets]);

  // Save session
  const handleSaveSession = useCallback(
    async (feeling: Feeling | undefined, notes: string) => {
      if (!sessionId) return;

      try {
        // Save all sets to DB
        for (const exercise of exercises) {
          const sets = getExerciseSets(exercise.id!);
          for (const set of sets) {
            await fitlogDb.addSet({
              sessionId,
              exerciseId: exercise.id!,
              exerciseName: exercise.name,
              setNumber: set.setNumber,
              targetSets: exercise.sets,
              targetReps: exercise.reps,
              weight: set.weight,
              reps: set.reps,
              duration: set.duration,
              difficulty: set.difficulty,
              skipped: set.skipped,
              notes: set.notes,
              completedAt: new Date(),
            });
          }
        }

        // Complete session
        await fitlogDb.completeSession(sessionId, feeling, notes);

        // Clear store
        endSession();

        // Navigate to history
        router.push(`/${locale}/fitlog/history/${sessionId}`);
      } catch (error) {
        console.error('Error saving session:', error);
      }
    },
    [sessionId, exercises, getExerciseSets, endSession, locale, router]
  );

  // Handle exit
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(async () => {
    if (sessionId) {
      // Delete incomplete session
      try {
        await fitlogDb.workoutSessions.delete(sessionId);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }

    endSession();
    router.push(`/${locale}/fitlog`);
  }, [sessionId, endSession, locale, router]);

  // Handle set update
  const handleUpdateSet = useCallback(
    (setNumber: number, data: Partial<SetInput>) => {
      const currentExercise = exercises[currentExerciseIndex];
      if (currentExercise) {
        updateSet(currentExercise.id!, setNumber, data);
      }
    },
    [exercises, currentExerciseIndex, updateSet]
  );

  // Loading state
  if (isLoading || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">A iniciar treino...</p>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentSets = currentExercise ? getExerciseSets(currentExercise.id!) : [];
  const currentLastSets = currentExercise ? lastSessionSets[currentExercise.id!] : [];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <SessionHeader
        workoutName={workoutName || 'Treino'}
        startedAt={startedAt || new Date()}
        exerciseIndex={currentExerciseIndex}
        totalExercises={exercises.length}
        onExit={handleExit}
      />

      {/* Exercise Content */}
      <div className="flex-1 overflow-y-auto">
        {currentExercise && (
          <ExerciseTracker
            exercise={currentExercise}
            sets={currentSets}
            lastSessionSets={currentLastSets}
            onUpdateSet={handleUpdateSet}
            onStartTimer={() => setShowTimer(true)}
          />
        )}
      </div>

      {/* Navigation */}
      <SessionNavigation
        currentIndex={currentExerciseIndex}
        totalExercises={exercises.length}
        onPrev={prevExercise}
        onNext={nextExercise}
        onFinish={handleFinish}
      />

      {/* Timer Modal */}
      <SessionTimerModal
        seconds={currentExercise?.restSeconds || defaultRestTimer}
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
      />

      {/* Summary Modal */}
      <SessionSummaryModal
        isOpen={showSummary}
        sessionId={sessionId}
        duration={summaryData.duration}
        totalSets={summaryData.totalSets}
        totalVolume={summaryData.totalVolume}
        onSave={handleSaveSession}
        onCancel={() => setShowSummary(false)}
      />

      {/* Exit Confirmation */}
      <ExitConfirmationModal
        isOpen={showExitConfirm}
        onConfirm={confirmExit}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}
