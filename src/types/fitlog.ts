// FitLog Types - Breath of Now

// ============================================
// IMPORT JSON SCHEMA (from LLM)
// ============================================

export interface ImportedPlanAthlete {
  name: string;
  goal?: string;
  frequency?: string;
  sessionDuration?: number;
}

export interface ImportedExercise {
  id: string;
  name: string;
  muscleGroups?: string[];
  sets: number;
  reps: number | string;
  restSeconds: number;
  notes?: string;
  videoUrl?: string;
  equipmentNeeded?: string;
}

export interface ImportedWorkout {
  id: string;
  name: string;
  dayOfWeek: number;
  targetDuration?: number;
  warmup?: {
    description: string;
    duration: number;
  };
  exercises: ImportedExercise[];
  cardio?: {
    description: string;
    duration: number;
    alternatives?: string[];
  };
}

export interface ImportedPlan {
  planName: string;
  version?: string;
  createdAt?: string;
  athlete?: ImportedPlanAthlete;
  weeks?: number;
  workouts: ImportedWorkout[];
}

// ============================================
// DATABASE MODELS (Dexie)
// ============================================

export interface WorkoutPlan {
  id?: number;
  planName: string;
  version: string;
  rawJson: string;
  isActive: boolean;
  athleteName?: string;
  athleteGoal?: string;
  frequency?: string;
  sessionDuration?: number;
  totalWeeks?: number;
  importedAt: Date;
  updatedAt: Date;
  syncId?: string;
}

export interface Workout {
  id?: number;
  planId: number;
  workoutId: string;
  name: string;
  dayOfWeek: number;
  targetDuration: number;
  warmupDescription?: string;
  warmupDuration?: number;
  cardioDescription?: string;
  cardioDuration?: number;
  cardioAlternatives?: string[];
  order: number;
  syncId?: string;
}

export interface Exercise {
  id?: number;
  workoutId: number;
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  videoUrl?: string;
  equipmentNeeded?: string;
  order: number;
  syncId?: string;
}

export interface WorkoutSession {
  id?: number;
  planId: number;
  workoutId: number;
  workoutName?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  totalVolume?: number;
  totalSets?: number;
  notes?: string;
  feeling?: 1 | 2 | 3 | 4 | 5;
  syncId?: string;
}

export interface ExerciseSet {
  id?: number;
  sessionId: number;
  exerciseId: number;
  exerciseName?: string;
  setNumber: number;
  targetSets?: number;
  targetReps?: string;
  weight?: number;
  reps?: number;
  duration?: number;
  difficulty: 1 | 2 | 3;
  skipped: boolean;
  notes?: string;
  completedAt: Date;
  syncId?: string;
}

export interface FitLogPreferences {
  id?: number;
  defaultRestTimer: number;
  weightUnit: 'kg' | 'lb';
  showVideoLinks: boolean;
  autoStartTimer: boolean;
  vibrationEnabled: boolean;
  reminderDays: number[];
  reminderTime?: string;
  syncId?: string;
}

export interface CustomExercise {
  id?: number;
  name: string;
  muscleGroups: string[];
  equipmentNeeded?: string;
  videoUrl?: string;
  notes?: string;
  createdAt: Date;
  syncId?: string;
}

// ============================================
// UI TYPES
// ============================================

export type Difficulty = 1 | 2 | 3;
export type Feeling = 1 | 2 | 3 | 4 | 5;

export interface SetInput {
  setNumber: number;
  weight?: number;
  reps?: number;
  duration?: number;
  difficulty: Difficulty;
  skipped: boolean;
  notes?: string;
}

export interface ExerciseWithSets extends Exercise {
  sets_data: SetInput[];
  lastSession?: {
    weight?: number;
    reps?: number;
    difficulty?: Difficulty;
  };
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

export interface SessionWithSets extends WorkoutSession {
  sets: ExerciseSet[];
}

// ============================================
// EXPORT TYPES (for LLM)
// ============================================

export interface ExportedSetData {
  weight?: number;
  reps?: number;
  duration?: number;
  difficulty: Difficulty;
}

export interface ExportedExercise {
  name: string;
  targetSets: number;
  targetReps: string;
  actual: ExportedSetData[];
  notes?: string;
}

export interface ExportedSession {
  date: string;
  workout: string;
  duration?: number;
  feeling?: Feeling;
  exercises: ExportedExercise[];
}

export interface ExportData {
  exportDate: string;
  weeksIncluded: number;
  athlete: {
    name?: string;
    currentPlan: string;
  };
  summary: {
    totalSessions: number;
    totalDuration: number;
    avgSessionDuration: number;
    completionRate: number;
    avgFeeling: number;
  };
  sessions: ExportedSession[];
  progressionNotes: string[];
}

// ============================================
// MUSCLE GROUPS
// ============================================

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'abs',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'hip_flexors',
  'adductors',
  'abductors',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  core: 'Core',
  abs: 'Abdominais',
  quadriceps: 'Quadríceps',
  hamstrings: 'Isquiotibiais',
  glutes: 'Glúteos',
  calves: 'Gémeos',
  hip_flexors: 'Flexores da Anca',
  adductors: 'Adutores',
  abductors: 'Abdutores',
};

// ============================================
// DAY OF WEEK
// ============================================

export const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

export const DAYS_OF_WEEK_SHORT = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
] as const;
