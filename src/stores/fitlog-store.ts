// FitLog Store - Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkoutPlan,
  Workout,
  Exercise,
  WorkoutSession,
  ExerciseSet,
  SetInput,
  Difficulty,
  Feeling,
} from '@/types/fitlog';

// ============================================
// ACTIVE SESSION STORE
// ============================================

interface ActiveSessionState {
  // Session data
  sessionId: number | null;
  workoutId: number | null;
  planId: number | null;
  workoutName: string | null;
  startedAt: Date | null;

  // Current exercise tracking
  exercises: Exercise[];
  currentExerciseIndex: number;
  setsData: Map<number, SetInput[]>; // exerciseId -> sets

  // Timer
  timerSeconds: number;
  timerRunning: boolean;
  timerTargetSeconds: number;

  // Actions
  startSession: (
    sessionId: number,
    planId: number,
    workoutId: number,
    workoutName: string,
    exercises: Exercise[]
  ) => void;
  endSession: () => void;
  
  setCurrentExercise: (index: number) => void;
  nextExercise: () => void;
  prevExercise: () => void;
  
  updateSet: (exerciseId: number, setNumber: number, data: Partial<SetInput>) => void;
  getExerciseSets: (exerciseId: number) => SetInput[];
  
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
}

export const useActiveSessionStore = create<ActiveSessionState>((set, get) => ({
  sessionId: null,
  workoutId: null,
  planId: null,
  workoutName: null,
  startedAt: null,
  exercises: [],
  currentExerciseIndex: 0,
  setsData: new Map(),
  timerSeconds: 0,
  timerRunning: false,
  timerTargetSeconds: 90,

  startSession: (sessionId, planId, workoutId, workoutName, exercises) => {
    // Inicializar sets para cada exercício
    const setsData = new Map<number, SetInput[]>();
    exercises.forEach((ex) => {
      const sets: SetInput[] = [];
      for (let i = 1; i <= ex.sets; i++) {
        sets.push({
          setNumber: i,
          weight: undefined,
          reps: undefined,
          duration: undefined,
          difficulty: 2,
          skipped: false,
        });
      }
      setsData.set(ex.id!, sets);
    });

    set({
      sessionId,
      planId,
      workoutId,
      workoutName,
      startedAt: new Date(),
      exercises,
      currentExerciseIndex: 0,
      setsData,
      timerSeconds: 0,
      timerRunning: false,
    });
  },

  endSession: () => {
    set({
      sessionId: null,
      workoutId: null,
      planId: null,
      workoutName: null,
      startedAt: null,
      exercises: [],
      currentExerciseIndex: 0,
      setsData: new Map(),
      timerSeconds: 0,
      timerRunning: false,
    });
  },

  setCurrentExercise: (index) => {
    const { exercises } = get();
    if (index >= 0 && index < exercises.length) {
      set({ currentExerciseIndex: index });
    }
  },

  nextExercise: () => {
    const { currentExerciseIndex, exercises } = get();
    if (currentExerciseIndex < exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },

  prevExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      set({ currentExerciseIndex: currentExerciseIndex - 1 });
    }
  },

  updateSet: (exerciseId, setNumber, data) => {
    const { setsData } = get();
    const exerciseSets = setsData.get(exerciseId) || [];
    const setIndex = exerciseSets.findIndex((s) => s.setNumber === setNumber);

    if (setIndex !== -1) {
      exerciseSets[setIndex] = { ...exerciseSets[setIndex], ...data };
      const newSetsData = new Map(setsData);
      newSetsData.set(exerciseId, [...exerciseSets]);
      set({ setsData: newSetsData });
    }
  },

  getExerciseSets: (exerciseId) => {
    const { setsData } = get();
    return setsData.get(exerciseId) || [];
  },

  startTimer: (seconds) => {
    set({ timerTargetSeconds: seconds, timerSeconds: seconds, timerRunning: true });
  },

  stopTimer: () => {
    set({ timerRunning: false });
  },

  tickTimer: () => {
    const { timerSeconds, timerRunning } = get();
    if (timerRunning && timerSeconds > 0) {
      set({ timerSeconds: timerSeconds - 1 });
    } else if (timerSeconds === 0) {
      set({ timerRunning: false });
    }
  },

  resetTimer: () => {
    const { timerTargetSeconds } = get();
    set({ timerSeconds: timerTargetSeconds, timerRunning: false });
  },
}));

// ============================================
// FITLOG APP STORE
// ============================================

interface FitLogState {
  // Current plan
  activePlanId: number | null;
  activePlan: WorkoutPlan | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Cached data
  todayWorkout: Workout | null;
  weekWorkouts: Workout[];
  recentSessions: WorkoutSession[];

  // Actions
  setActivePlan: (plan: WorkoutPlan | null) => void;
  setActivePlanId: (id: number | null) => void;
  setTodayWorkout: (workout: Workout | null) => void;
  setWeekWorkouts: (workouts: Workout[]) => void;
  setRecentSessions: (sessions: WorkoutSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useFitLogStore = create<FitLogState>()(
  persist(
    (set) => ({
      activePlanId: null,
      activePlan: null,
      isLoading: false,
      error: null,
      todayWorkout: null,
      weekWorkouts: [],
      recentSessions: [],

      setActivePlan: (plan) => set({ activePlan: plan, activePlanId: plan?.id || null }),
      setActivePlanId: (id) => set({ activePlanId: id }),
      setTodayWorkout: (workout) => set({ todayWorkout: workout }),
      setWeekWorkouts: (workouts) => set({ weekWorkouts: workouts }),
      setRecentSessions: (sessions) => set({ recentSessions: sessions }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'fitlog-store',
      partialize: (state) => ({
        activePlanId: state.activePlanId,
      }),
    }
  )
);

// ============================================
// PREFERENCES STORE
// ============================================

interface FitLogPreferencesState {
  defaultRestTimer: number;
  weightUnit: 'kg' | 'lb';
  showVideoLinks: boolean;
  autoStartTimer: boolean;
  vibrationEnabled: boolean;

  setDefaultRestTimer: (seconds: number) => void;
  setWeightUnit: (unit: 'kg' | 'lb') => void;
  setShowVideoLinks: (show: boolean) => void;
  setAutoStartTimer: (auto: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
}

export const useFitLogPreferences = create<FitLogPreferencesState>()(
  persist(
    (set) => ({
      defaultRestTimer: 90,
      weightUnit: 'kg',
      showVideoLinks: true,
      autoStartTimer: false,
      vibrationEnabled: true,

      setDefaultRestTimer: (seconds) => set({ defaultRestTimer: seconds }),
      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setShowVideoLinks: (show) => set({ showVideoLinks: show }),
      setAutoStartTimer: (auto) => set({ autoStartTimer: auto }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
    }),
    {
      name: 'fitlog-preferences',
    }
  )
);
