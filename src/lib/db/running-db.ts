// RunLog Database - Dexie.js (IndexedDB)

import Dexie, { Table } from 'dexie';
import type {
  RunningPlan,
  RunningWorkout,
  RunningSession,
  RunningPreferences,
  WorkoutSegment,
  WeekProgress,
  TodayWorkoutInfo,
  TrainingPhase,
} from '@/types/running';

export class RunningDatabase extends Dexie {
  runningPlans!: Table<RunningPlan>;
  runningWorkouts!: Table<RunningWorkout>;
  runningSessions!: Table<RunningSession>;
  runningPreferences!: Table<RunningPreferences>;

  constructor() {
    super('runlog');

    this.version(1).stores({
      runningPlans: '++id, name, isActive, startDate, endDate, syncId',
      runningWorkouts: '++id, planId, workoutId, weekNumber, dayOfWeek, scheduledDate, type, isRace, order, syncId',
      runningSessions: '++id, planId, workoutId, scheduledDate, startedAt, completedAt, syncId',
      runningPreferences: '++id, syncId',
    });
  }

  // ============================================
  // RUNNING PLANS
  // ============================================

  async getActivePlan(): Promise<RunningPlan | undefined> {
    return this.runningPlans.where('isActive').equals(1).first();
  }

  async setActivePlan(planId: number): Promise<void> {
    await this.transaction('rw', this.runningPlans, async () => {
      await this.runningPlans.toCollection().modify({ isActive: false });
      await this.runningPlans.update(planId, { isActive: true });
    });
  }

  async getAllPlans(): Promise<RunningPlan[]> {
    // Order by id (auto-increment) as proxy for creation order
    return this.runningPlans.orderBy('id').reverse().toArray();
  }

  async deletePlan(planId: number): Promise<void> {
    await this.transaction(
      'rw',
      [this.runningPlans, this.runningWorkouts, this.runningSessions],
      async () => {
        await this.runningSessions.where('planId').equals(planId).delete();
        await this.runningWorkouts.where('planId').equals(planId).delete();
        await this.runningPlans.delete(planId);
      }
    );
  }

  // ============================================
  // RUNNING WORKOUTS
  // ============================================

  async getWorkoutsByPlan(planId: number): Promise<RunningWorkout[]> {
    return this.runningWorkouts
      .where('planId')
      .equals(planId)
      .sortBy('scheduledDate');
  }

  async getWorkoutsByWeek(planId: number, weekNumber: number): Promise<RunningWorkout[]> {
    return this.runningWorkouts
      .where('[planId+weekNumber]')
      .equals([planId, weekNumber])
      .sortBy('order');
  }

  async getWorkoutByDate(planId: number, date: string): Promise<RunningWorkout | undefined> {
    return this.runningWorkouts
      .where('[planId+scheduledDate]')
      .equals([planId, date])
      .first();
  }

  async getTodayWorkout(planId: number): Promise<TodayWorkoutInfo> {
    const today = new Date().toISOString().split('T')[0];
    const workout = await this.getWorkoutByDate(planId, today);

    if (workout) {
      return {
        workout,
        isRestDay: workout.type === 'rest',
      };
    }

    // Procurar próximo treino
    const upcomingWorkouts = await this.runningWorkouts
      .where('planId')
      .equals(planId)
      .and(w => w.scheduledDate > today && w.type !== 'rest')
      .sortBy('scheduledDate');

    const nextWorkout = upcomingWorkouts[0];

    if (nextWorkout) {
      const todayDate = new Date(today);
      const nextDate = new Date(nextWorkout.scheduledDate);
      const daysUntil = Math.ceil((nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        workout: null,
        isRestDay: true,
        nextWorkout,
        daysUntilNext: daysUntil,
      };
    }

    return {
      workout: null,
      isRestDay: true,
    };
  }

  async getNextWorkout(planId: number): Promise<RunningWorkout | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const workouts = await this.runningWorkouts
      .where('planId')
      .equals(planId)
      .and(w => w.scheduledDate >= today && w.type !== 'rest')
      .sortBy('scheduledDate');

    return workouts[0];
  }

  async getWorkoutWithSegments(workoutId: number): Promise<{
    workout: RunningWorkout;
    segments: WorkoutSegment[];
  } | null> {
    const workout = await this.runningWorkouts.get(workoutId);
    if (!workout) return null;

    const segments: WorkoutSegment[] = JSON.parse(workout.segmentsJson || '[]');
    return { workout, segments };
  }

  // ============================================
  // RUNNING SESSIONS
  // ============================================

  async startSession(
    planId: number,
    workoutId: number,
    workoutTitle: string,
    workoutType: string,
    scheduledDate: string
  ): Promise<number> {
    const session: RunningSession = {
      planId,
      workoutId,
      workoutTitle,
      workoutType: workoutType as RunningSession['workoutType'],
      scheduledDate,
      startedAt: new Date(),
    };
    return this.runningSessions.add(session);
  }

  async completeSession(
    sessionId: number,
    data: {
      actualDistanceKm?: number;
      actualDurationMin?: number;
      actualPaceAvg?: string;
      avgHeartRate?: number;
      maxHeartRate?: number;
      feeling?: 1 | 2 | 3 | 4 | 5;
      perceivedEffort?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
      weather?: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'hot' | 'cold';
      temperature?: number;
      notes?: string;
      garminActivityId?: string;
    }
  ): Promise<void> {
    await this.runningSessions.update(sessionId, {
      ...data,
      completedAt: new Date(),
    });
  }

  async getSessionHistory(limit = 20): Promise<RunningSession[]> {
    return this.runningSessions
      .orderBy('startedAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getSessionByWorkout(workoutId: number): Promise<RunningSession | undefined> {
    return this.runningSessions
      .where('workoutId')
      .equals(workoutId)
      .and(s => !!s.completedAt)
      .first();
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<RunningSession[]> {
    return this.runningSessions
      .where('scheduledDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getCompletedSessionsCount(planId: number): Promise<number> {
    return this.runningSessions
      .where('planId')
      .equals(planId)
      .filter(s => !!s.completedAt)
      .count();
  }

  // ============================================
  // WEEK PROGRESS
  // ============================================

  async getWeekProgress(planId: number, weekNumber: number): Promise<WeekProgress> {
    const workouts = await this.getWorkoutsByWeek(planId, weekNumber);
    const today = new Date().toISOString().split('T')[0];

    // Obter sessões completadas para estes workouts
    const workoutIds = workouts.map(w => w.id!);
    const sessions = await this.runningSessions
      .where('workoutId')
      .anyOf(workoutIds)
      .and(s => !!s.completedAt)
      .toArray();

    const sessionByWorkout = new Map(sessions.map(s => [s.workoutId, s]));

    const workoutsWithProgress = workouts
      .filter(w => w.type !== 'rest')
      .map(w => {
        const session = sessionByWorkout.get(w.id!);
        return {
          workout: w,
          session,
          isCompleted: !!session,
          isToday: w.scheduledDate === today,
          isPast: w.scheduledDate < today,
        };
      });

    const completedWorkouts = workoutsWithProgress.filter(w => w.isCompleted).length;
    const plannedWorkouts = workoutsWithProgress.length;

    const plannedDistanceKm = workouts
      .filter(w => w.type !== 'rest')
      .reduce((sum, w) => sum + (w.totalDistanceKm || 0), 0);

    const completedDistanceKm = sessions.reduce(
      (sum, s) => sum + (s.actualDistanceKm || 0),
      0
    );

    // Determinar fase (simplificado - pode ser melhorado)
    const firstWorkout = workouts[0];
    const phase: TrainingPhase = firstWorkout?.weekNotes?.toLowerCase().includes('taper')
      ? 'taper'
      : firstWorkout?.weekNotes?.toLowerCase().includes('recupera')
      ? 'recovery'
      : firstWorkout?.weekNotes?.toLowerCase().includes('alívio')
      ? 'recovery'
      : firstWorkout?.isRace
      ? 'race'
      : 'build';

    return {
      weekNumber,
      phase,
      plannedWorkouts,
      completedWorkouts,
      plannedDistanceKm,
      completedDistanceKm,
      workouts: workoutsWithProgress,
    };
  }

  async getCurrentWeekNumber(planId: number): Promise<number> {
    const plan = await this.runningPlans.get(planId);
    if (!plan) return 1;

    const today = new Date();
    const startDate = new Date(plan.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

    return Math.max(0, Math.min(diffWeeks, plan.totalWeeks - 1));
  }

  // ============================================
  // STATS
  // ============================================

  async getWeeklyStats(planId: number): Promise<{
    sessionsThisWeek: number;
    totalDistanceKm: number;
    totalDurationMin: number;
    avgPace: string;
    avgFeeling: number;
  }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const sessions = await this.runningSessions
      .where('planId')
      .equals(planId)
      .and(s => s.scheduledDate >= startDate && s.scheduledDate <= endDate && !!s.completedAt)
      .toArray();

    const totalDistanceKm = sessions.reduce((sum, s) => sum + (s.actualDistanceKm || 0), 0);
    const totalDurationMin = sessions.reduce((sum, s) => sum + (s.actualDurationMin || 0), 0);

    // Calcular pace médio
    let avgPace = '-';
    if (totalDistanceKm > 0 && totalDurationMin > 0) {
      const pacePerKm = totalDurationMin / totalDistanceKm;
      const mins = Math.floor(pacePerKm);
      const secs = Math.round((pacePerKm - mins) * 60);
      avgPace = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const feelings = sessions.filter(s => s.feeling).map(s => s.feeling!);
    const avgFeeling = feelings.length > 0
      ? feelings.reduce((a, b) => a + b, 0) / feelings.length
      : 0;

    return {
      sessionsThisWeek: sessions.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMin: Math.round(totalDurationMin),
      avgPace,
      avgFeeling: Math.round(avgFeeling * 10) / 10,
    };
  }

  async getTotalStats(planId: number): Promise<{
    totalSessions: number;
    totalDistanceKm: number;
    totalDurationMin: number;
    longestRunKm: number;
    avgPace: string;
  }> {
    const sessions = await this.runningSessions
      .where('planId')
      .equals(planId)
      .and(s => !!s.completedAt)
      .toArray();

    const totalDistanceKm = sessions.reduce((sum, s) => sum + (s.actualDistanceKm || 0), 0);
    const totalDurationMin = sessions.reduce((sum, s) => sum + (s.actualDurationMin || 0), 0);
    const longestRunKm = Math.max(...sessions.map(s => s.actualDistanceKm || 0), 0);

    let avgPace = '-';
    if (totalDistanceKm > 0 && totalDurationMin > 0) {
      const pacePerKm = totalDurationMin / totalDistanceKm;
      const mins = Math.floor(pacePerKm);
      const secs = Math.round((pacePerKm - mins) * 60);
      avgPace = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return {
      totalSessions: sessions.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMin: Math.round(totalDurationMin),
      longestRunKm: Math.round(longestRunKm * 10) / 10,
      avgPace,
    };
  }

  // ============================================
  // PREFERENCES
  // ============================================

  async getPreferences(): Promise<RunningPreferences> {
    const prefs = await this.runningPreferences.toCollection().first();
    if (prefs) return prefs;

    const defaultPrefs: RunningPreferences = {
      distanceUnit: 'km',
      paceUnit: 'min/km',
      defaultTrainingDays: [3, 5, 0], // Qua, Sex, Dom
      reminderEnabled: false,
      showWhyExplanations: true,
      showHeartRateZones: false,
      garminConnected: false,
    };
    await this.runningPreferences.add(defaultPrefs);
    return defaultPrefs;
  }

  async updatePreferences(prefs: Partial<RunningPreferences>): Promise<void> {
    const current = await this.getPreferences();
    if (current.id) {
      await this.runningPreferences.update(current.id, prefs);
    }
  }

  // ============================================
  // UPCOMING RACES
  // ============================================

  async getUpcomingRaces(planId: number): Promise<RunningWorkout[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.runningWorkouts
      .where('planId')
      .equals(planId)
      .and(w => w.isRace && w.scheduledDate >= today)
      .sortBy('scheduledDate');
  }

  async getNextRace(planId: number): Promise<RunningWorkout | undefined> {
    const races = await this.getUpcomingRaces(planId);
    return races[0];
  }
}

// Singleton instance
export const runningDb = new RunningDatabase();

// Helper para verificar se a DB está disponível (client-side only)
export const isRunningDbAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
};

// ============================================
// PARSE HELPERS
// ============================================

/**
 * Converte string de pace "5:35" para minutos decimais
 */
export function paceToMinutes(pace: string): number {
  const [mins, secs] = pace.split(':').map(Number);
  return mins + (secs || 0) / 60;
}

/**
 * Converte minutos decimais para string de pace "5:35"
 */
export function minutesToPace(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calcula duração estimada baseado em distância e pace
 */
export function estimateDuration(distanceKm: number, paceMinPerKm: string): number {
  const paceMinutes = paceToMinutes(paceMinPerKm);
  return Math.round(distanceKm * paceMinutes);
}
