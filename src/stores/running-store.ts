// RunLog Store - Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RunningPlan, RunningWorkout, RunningPreferences } from '@/types/running';

interface RunningState {
  // Active plan
  activePlanId: number | null;
  activePlan: RunningPlan | null;

  // Current session
  currentSessionId: number | null;
  currentWorkoutId: number | null;

  // Preferences
  preferences: RunningPreferences | null;

  // UI State
  showWhyExplanations: boolean;

  // Actions
  setActivePlan: (plan: RunningPlan | null) => void;
  setActivePlanId: (id: number | null) => void;
  setCurrentSession: (sessionId: number | null, workoutId: number | null) => void;
  setPreferences: (prefs: RunningPreferences) => void;
  toggleWhyExplanations: () => void;
  reset: () => void;
}

export const useRunningStore = create<RunningState>()(
  persist(
    (set) => ({
      // Initial state
      activePlanId: null,
      activePlan: null,
      currentSessionId: null,
      currentWorkoutId: null,
      preferences: null,
      showWhyExplanations: true,

      // Actions
      setActivePlan: (plan) => set({
        activePlan: plan,
        activePlanId: plan?.id || null,
      }),

      setActivePlanId: (id) => set({ activePlanId: id }),

      setCurrentSession: (sessionId, workoutId) => set({
        currentSessionId: sessionId,
        currentWorkoutId: workoutId,
      }),

      setPreferences: (prefs) => set({ preferences: prefs }),

      toggleWhyExplanations: () => set((state) => ({
        showWhyExplanations: !state.showWhyExplanations,
      })),

      reset: () => set({
        activePlanId: null,
        activePlan: null,
        currentSessionId: null,
        currentWorkoutId: null,
        preferences: null,
        showWhyExplanations: true,
      }),
    }),
    {
      name: 'runlog-storage',
      partialize: (state) => ({
        activePlanId: state.activePlanId,
        showWhyExplanations: state.showWhyExplanations,
      }),
    }
  )
);
