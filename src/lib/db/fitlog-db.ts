// FitLog Database - Dexie.js (IndexedDB)

import Dexie, { Table } from 'dexie';
import type {
  WorkoutPlan,
  Workout,
  Exercise,
  WorkoutSession,
  ExerciseSet,
  FitLogPreferences,
  CustomExercise,
} from '@/types/fitlog';

export class FitLogDatabase extends Dexie {
  workoutPlans!: Table<WorkoutPlan>;
  workouts!: Table<Workout>;
  exercises!: Table<Exercise>;
  workoutSessions!: Table<WorkoutSession>;
  exerciseSets!: Table<ExerciseSet>;
  fitLogPreferences!: Table<FitLogPreferences>;
  customExercises!: Table<CustomExercise>;

  constructor() {
    super('fitlog');

    this.version(1).stores({
      workoutPlans: '++id, planName, isActive, importedAt, syncId',
      workouts: '++id, planId, workoutId, dayOfWeek, order, syncId',
      exercises: '++id, workoutId, exerciseId, name, order, syncId',
      workoutSessions: '++id, planId, workoutId, startedAt, completedAt, syncId',
      exerciseSets: '++id, sessionId, exerciseId, setNumber, completedAt, syncId',
      fitLogPreferences: '++id, syncId',
      customExercises: '++id, name, createdAt, syncId',
    });
  }

  // ============================================
  // WORKOUT PLANS
  // ============================================

  async getActivePlan(): Promise<WorkoutPlan | undefined> {
    return this.workoutPlans.where('isActive').equals(1).first();
  }

  async setActivePlan(planId: number): Promise<void> {
    await this.transaction('rw', this.workoutPlans, async () => {
      // Desativar todos os planos
      await this.workoutPlans.toCollection().modify({ isActive: false });
      // Ativar o plano selecionado
      await this.workoutPlans.update(planId, { isActive: true });
    });
  }

  async getAllPlans(): Promise<WorkoutPlan[]> {
    return this.workoutPlans.orderBy('importedAt').reverse().toArray();
  }

  async deletePlan(planId: number): Promise<void> {
    await this.transaction(
      'rw',
      [this.workoutPlans, this.workouts, this.exercises, this.workoutSessions, this.exerciseSets],
      async () => {
        // Buscar workouts do plano
        const workouts = await this.workouts.where('planId').equals(planId).toArray();
        const workoutIds = workouts.map((w) => w.id!);

        // Buscar exercícios dos workouts
        const exercises = await this.exercises
          .where('workoutId')
          .anyOf(workoutIds)
          .toArray();
        const exerciseIds = exercises.map((e) => e.id!);

        // Buscar sessões do plano
        const sessions = await this.workoutSessions.where('planId').equals(planId).toArray();
        const sessionIds = sessions.map((s) => s.id!);

        // Deletar em ordem
        await this.exerciseSets.where('sessionId').anyOf(sessionIds).delete();
        await this.workoutSessions.where('planId').equals(planId).delete();
        await this.exercises.where('workoutId').anyOf(workoutIds).delete();
        await this.workouts.where('planId').equals(planId).delete();
        await this.workoutPlans.delete(planId);
      }
    );
  }

  // ============================================
  // WORKOUTS
  // ============================================

  async getWorkoutsByPlan(planId: number): Promise<Workout[]> {
    return this.workouts.where('planId').equals(planId).sortBy('order');
  }

  async getWorkoutWithExercises(workoutId: number): Promise<{
    workout: Workout;
    exercises: Exercise[];
  } | null> {
    const workout = await this.workouts.get(workoutId);
    if (!workout) return null;

    const exercises = await this.exercises.where('workoutId').equals(workoutId).sortBy('order');

    return { workout, exercises };
  }

  async getTodayWorkout(planId: number): Promise<Workout | undefined> {
    const today = new Date().getDay(); // 0 = Domingo
    return this.workouts
      .where('[planId+dayOfWeek]')
      .equals([planId, today])
      .first();
  }

  // ============================================
  // EXERCISES
  // ============================================

  async getExercisesByWorkout(workoutId: number): Promise<Exercise[]> {
    return this.exercises.where('workoutId').equals(workoutId).sortBy('order');
  }

  // ============================================
  // WORKOUT SESSIONS
  // ============================================

  async startSession(planId: number, workoutId: number, workoutName: string): Promise<number> {
    const session: WorkoutSession = {
      planId,
      workoutId,
      workoutName,
      startedAt: new Date(),
      totalVolume: 0,
      totalSets: 0,
    };
    return this.workoutSessions.add(session);
  }

  async completeSession(
    sessionId: number,
    feeling?: 1 | 2 | 3 | 4 | 5,
    notes?: string
  ): Promise<void> {
    const session = await this.workoutSessions.get(sessionId);
    if (!session) return;

    const sets = await this.exerciseSets.where('sessionId').equals(sessionId).toArray();

    // Calcular volume total e sets
    let totalVolume = 0;
    let totalSets = 0;
    sets.forEach((set) => {
      if (!set.skipped && set.weight && set.reps) {
        totalVolume += set.weight * set.reps;
        totalSets++;
      }
    });

    const completedAt = new Date();
    const duration = Math.round((completedAt.getTime() - session.startedAt.getTime()) / 60000);

    await this.workoutSessions.update(sessionId, {
      completedAt,
      duration,
      totalVolume,
      totalSets,
      feeling,
      notes,
    });
  }

  async getSessionHistory(limit = 20): Promise<WorkoutSession[]> {
    return this.workoutSessions
      .orderBy('startedAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSessionsByPlan(planId: number): Promise<WorkoutSession[]> {
    return this.workoutSessions
      .where('planId')
      .equals(planId)
      .reverse()
      .sortBy('startedAt');
  }

  async getSessionWithSets(sessionId: number): Promise<{
    session: WorkoutSession;
    sets: ExerciseSet[];
  } | null> {
    const session = await this.workoutSessions.get(sessionId);
    if (!session) return null;

    const sets = await this.exerciseSets
      .where('sessionId')
      .equals(sessionId)
      .sortBy('completedAt');

    return { session, sets };
  }

  async getLastSessionForWorkout(workoutId: number): Promise<WorkoutSession | undefined> {
    return this.workoutSessions
      .where('workoutId')
      .equals(workoutId)
      .filter((s) => !!s.completedAt)
      .reverse()
      .sortBy('completedAt')
      .then((sessions) => sessions[0]);
  }

  async getSessionsInDateRange(startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
    return this.workoutSessions
      .where('startedAt')
      .between(startDate, endDate)
      .toArray();
  }

  // ============================================
  // EXERCISE SETS
  // ============================================

  async addSet(set: Omit<ExerciseSet, 'id'>): Promise<number> {
    return this.exerciseSets.add(set as ExerciseSet);
  }

  async updateSet(setId: number, data: Partial<ExerciseSet>): Promise<void> {
    await this.exerciseSets.update(setId, data);
  }

  async getSetsBySession(sessionId: number): Promise<ExerciseSet[]> {
    return this.exerciseSets.where('sessionId').equals(sessionId).toArray();
  }

  async getLastSetsForExercise(
    exerciseId: number,
    limit = 1
  ): Promise<ExerciseSet[]> {
    return this.exerciseSets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('completedAt')
      .then((sets) => sets.slice(0, limit));
  }

  // ============================================
  // PREFERENCES
  // ============================================

  async getPreferences(): Promise<FitLogPreferences> {
    const prefs = await this.fitLogPreferences.toCollection().first();
    if (prefs) return prefs;

    // Criar preferências padrão
    const defaultPrefs: FitLogPreferences = {
      defaultRestTimer: 90,
      weightUnit: 'kg',
      showVideoLinks: true,
      autoStartTimer: false,
      vibrationEnabled: true,
      reminderDays: [1, 3, 5], // Seg, Qua, Sex
    };
    await this.fitLogPreferences.add(defaultPrefs);
    return defaultPrefs;
  }

  async updatePreferences(prefs: Partial<FitLogPreferences>): Promise<void> {
    const current = await this.getPreferences();
    if (current.id) {
      await this.fitLogPreferences.update(current.id, prefs);
    }
  }

  // ============================================
  // CUSTOM EXERCISES
  // ============================================

  async addCustomExercise(exercise: Omit<CustomExercise, 'id' | 'createdAt'>): Promise<number> {
    return this.customExercises.add({
      ...exercise,
      createdAt: new Date(),
    } as CustomExercise);
  }

  async getAllCustomExercises(): Promise<CustomExercise[]> {
    return this.customExercises.orderBy('name').toArray();
  }

  // ============================================
  // STATS & ANALYTICS
  // ============================================

  async getWeeklyStats(): Promise<{
    sessionsThisWeek: number;
    totalVolume: number;
    totalDuration: number;
    avgFeeling: number;
  }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sessions = await this.workoutSessions
      .where('startedAt')
      .aboveOrEqual(startOfWeek)
      .filter((s) => !!s.completedAt)
      .toArray();

    const totalVolume = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const feelings = sessions.filter((s) => s.feeling).map((s) => s.feeling!);
    const avgFeeling = feelings.length > 0
      ? feelings.reduce((a, b) => a + b, 0) / feelings.length
      : 0;

    return {
      sessionsThisWeek: sessions.length,
      totalVolume,
      totalDuration,
      avgFeeling,
    };
  }

  async getExerciseProgression(
    exerciseId: number,
    limit = 10
  ): Promise<{ date: Date; maxWeight: number; totalReps: number }[]> {
    const sets = await this.exerciseSets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .sortBy('completedAt');

    // Agrupar por sessão
    const bySession = new Map<number, ExerciseSet[]>();
    sets.forEach((set) => {
      if (!bySession.has(set.sessionId)) {
        bySession.set(set.sessionId, []);
      }
      bySession.get(set.sessionId)!.push(set);
    });

    const results: { date: Date; maxWeight: number; totalReps: number }[] = [];

    for (const [sessionId, sessionSets] of Array.from(bySession.entries())) {
      const session = await this.workoutSessions.get(sessionId);
      if (!session) continue;

      const maxWeight = Math.max(...sessionSets.map((s) => s.weight || 0));
      const totalReps = sessionSets.reduce((sum, s) => sum + (s.reps || 0), 0);

      results.push({
        date: session.startedAt,
        maxWeight,
        totalReps,
      });

      if (results.length >= limit) break;
    }

    return results.reverse();
  }
}

// Singleton instance
export const fitlogDb = new FitLogDatabase();

// Helper para verificar se a DB está disponível (client-side only)
export const isFitLogDbAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
};
