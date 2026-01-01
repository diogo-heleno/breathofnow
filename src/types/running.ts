// RunLog Types - Breath of Now
// Running Training App with Garmin-compatible structure

// ============================================
// TRAINING PLAN TYPES
// ============================================

export type WorkoutType =
  | 'easy'           // Corrida fácil
  | 'long'           // Longo
  | 'tempo'          // Tempo/Threshold
  | 'intervals'      // Intervalos
  | 'fartlek'        // Fartlek
  | 'hills'          // Treino de colinas
  | 'recovery'       // Recuperação
  | 'race'           // Prova
  | 'rest'           // Descanso
  | 'strides'        // Com strides
  | 'progression';   // Progressivo

export type SegmentType =
  | 'warmup'         // Aquecimento
  | 'cooldown'       // Soltar/Arrefecer
  | 'work'           // Segmento principal
  | 'recovery'       // Recuperação entre intervalos
  | 'strides'        // Strides/Acelerações
  | 'easy'           // Fácil
  | 'race_pace';     // Ritmo de prova

export interface PaceRange {
  min: string;       // "5:35" min/km
  max: string;       // "5:45" min/km
}

export interface WorkoutSegment {
  id: string;
  type: SegmentType;
  description: string;
  // Distância OU duração (um dos dois)
  distanceKm?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  // Repetições (para intervalos)
  repetitions?: number;
  // Pace alvo (opcional)
  targetPace?: PaceRange;
  // Recuperação entre reps (para intervalos)
  recoveryDistanceM?: number;
  recoveryDurationSeconds?: number;
  // Notas
  notes?: string;
}

export interface ScheduledWorkout {
  id: string;
  weekNumber: number;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 3=Qua, 5=Sex
  date: string;              // YYYY-MM-DD
  type: WorkoutType;
  title: string;
  description: string;       // Descrição completa do treino
  totalDistanceKm?: number;
  estimatedDurationMin?: number;
  segments: WorkoutSegment[];
  // Explicação científica do porquê deste treino
  whyExplanation?: string;
  // Para provas
  isRace?: boolean;
  raceName?: string;
  raceTargetTime?: string;   // "1:59:00"
  raceTargetPace?: string;   // "5:41"
  // Notas da semana
  weekNotes?: string;
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string;         // YYYY-MM-DD
  endDate: string;
  phase: TrainingPhase;
  totalDistanceKm: number;
  workouts: ScheduledWorkout[];
  notes?: string;
}

export type TrainingPhase =
  | 'base'           // Construção de base
  | 'build'          // Construção de volume/intensidade
  | 'peak'           // Pico de forma
  | 'taper'          // Redução pré-prova
  | 'recovery'       // Recuperação
  | 'race';          // Semana de prova

// ============================================
// DATABASE MODELS
// ============================================

export interface RunningPlan {
  id?: number;
  name: string;
  version?: string;
  description?: string;
  athleteName?: string;
  // Datas
  startDate: string;         // YYYY-MM-DD
  endDate: string;
  totalWeeks: number;
  // Objetivos
  goalRaces: GoalRace[];
  // Estado
  isActive: boolean;
  currentWeek: number;
  // Raw JSON para backup
  rawJson?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Sync fields
  syncId?: string;
  syncStatus?: 'pending' | 'synced' | 'conflict';
  syncedAt?: Date;
}

export interface GoalRace {
  id: string;
  name: string;
  date: string;              // YYYY-MM-DD
  distance: string;          // "21.1km" ou "42.195km"
  targetTime: string;        // "1:59:00"
  targetPace: string;        // "5:41"
  weekNumber: number;
}

export interface RunningWorkout {
  id?: number;
  planId: number;
  workoutId: string;         // ID único do treino
  weekNumber: number;
  dayOfWeek: number;
  scheduledDate: string;
  type: WorkoutType;
  title: string;
  description: string;
  totalDistanceKm?: number;
  estimatedDurationMin?: number;
  whyExplanation?: string;
  isRace: boolean;
  raceName?: string;
  raceTargetTime?: string;
  raceTargetPace?: string;
  weekNotes?: string;
  // Segments são guardados como JSON
  segmentsJson: string;
  // Ordem na semana
  order: number;
  syncId?: string;
}

export interface RunningSession {
  id?: number;
  planId: number;
  workoutId: number;
  workoutTitle: string;
  workoutType: WorkoutType;
  // Quando
  scheduledDate: string;
  startedAt: Date;
  completedAt?: Date;
  // Métricas reais
  actualDistanceKm?: number;
  actualDurationMin?: number;
  actualPaceAvg?: string;    // "6:15" min/km
  // Frequência cardíaca (do Garmin)
  avgHeartRate?: number;
  maxHeartRate?: number;
  // Sensação
  feeling?: 1 | 2 | 3 | 4 | 5;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // RPE
  // Condições
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'hot' | 'cold';
  temperature?: number;
  // Notas
  notes?: string;
  // Garmin Activity ID (para futuro)
  garminActivityId?: string;
  // Sync fields
  syncId?: string;
  syncStatus?: 'pending' | 'synced' | 'conflict';
  syncedAt?: Date;
}

export interface RunningPreferences {
  id?: number;
  // Unidades
  distanceUnit: 'km' | 'mi';
  paceUnit: 'min/km' | 'min/mi';
  // Dias de treino padrão
  defaultTrainingDays: number[];  // [3, 5, 0] = Qua, Sex, Dom
  // Notificações
  reminderEnabled: boolean;
  reminderTime?: string;          // "07:00"
  // Display
  showWhyExplanations: boolean;
  showHeartRateZones: boolean;
  // Garmin
  garminConnected: boolean;
  syncId?: string;
}

// ============================================
// UI TYPES
// ============================================

export type Feeling = 1 | 2 | 3 | 4 | 5;
export type RPE = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TodayWorkoutInfo {
  workout: RunningWorkout | null;
  isRestDay: boolean;
  nextWorkout?: RunningWorkout;
  daysUntilNext?: number;
}

export interface WeekProgress {
  weekNumber: number;
  phase: TrainingPhase;
  plannedWorkouts: number;
  completedWorkouts: number;
  plannedDistanceKm: number;
  completedDistanceKm: number;
  workouts: {
    workout: RunningWorkout;
    session?: RunningSession;
    isCompleted: boolean;
    isToday: boolean;
    isPast: boolean;
  }[];
}

// ============================================
// IMPORT/EXPORT TYPES (para LLM)
// ============================================

export interface ImportedRunningPlan {
  planName: string;
  athleteName?: string;
  startDate: string;
  goals: {
    raceName: string;
    raceDate: string;
    distance: string;
    targetTime: string;
    targetPace: string;
  }[];
  weeks: {
    weekNumber: number;
    dates: string;
    phase?: TrainingPhase;
    notes?: string;
    workouts: {
      dayOfWeek: number;
      title: string;
      description: string;
      type: WorkoutType;
      totalDistanceKm?: number;
      segments?: {
        type: SegmentType;
        description: string;
        distanceKm?: number;
        durationMin?: number;
        pace?: { min: string; max: string };
        repetitions?: number;
        recoveryM?: number;
      }[];
      whyExplanation?: string;
      isRace?: boolean;
      raceDetails?: {
        name: string;
        targetTime: string;
        targetPace: string;
      };
    }[];
  }[];
}

export interface ExportedRunningHistory {
  exportDate: string;
  planName: string;
  athleteName?: string;
  weeksCompleted: number;
  summary: {
    totalSessions: number;
    totalDistanceKm: number;
    totalDurationMin: number;
    avgPace: string;
    avgFeeling: number;
    avgRPE: number;
  };
  sessions: {
    date: string;
    workoutTitle: string;
    workoutType: WorkoutType;
    planned: {
      distanceKm?: number;
      description: string;
    };
    actual: {
      distanceKm: number;
      durationMin: number;
      paceAvg: string;
      heartRateAvg?: number;
    };
    feeling: Feeling;
    rpe?: RPE;
    notes?: string;
  }[];
  upcomingWeeks: {
    weekNumber: number;
    workouts: {
      date: string;
      title: string;
      description: string;
    }[];
  }[];
}

// ============================================
// WORKOUT TYPE EXPLANATIONS
// ============================================

export const WORKOUT_TYPE_INFO: Record<WorkoutType, {
  name: string;
  nameKey: string;
  color: string;
  icon: string;
  defaultExplanation: string;
}> = {
  easy: {
    name: 'Easy Run',
    nameKey: 'workoutTypes.easy',
    color: '#22c55e',
    icon: '🏃',
    defaultExplanation: 'Corridas fáceis desenvolvem a tua base aeróbica, aumentam a capilarização muscular e melhoram a eficiência do uso de gordura como combustível. Devem ser feitas a um ritmo conversacional.',
  },
  long: {
    name: 'Long Run',
    nameKey: 'workoutTypes.long',
    color: '#3b82f6',
    icon: '🏔️',
    defaultExplanation: 'Corridas longas desenvolvem resistência aeróbica, adaptação mental, economia de corrida e capacidade de queima de gordura. São fundamentais para preparação de meias e maratonas.',
  },
  tempo: {
    name: 'Tempo',
    nameKey: 'workoutTypes.tempo',
    color: '#f97316',
    icon: '⚡',
    defaultExplanation: 'Treinos de tempo melhoram o limiar anaeróbico, permitindo manter ritmos mais rápidos por mais tempo. Devem ser "confortavelmente difíceis".',
  },
  intervals: {
    name: 'Intervals',
    nameKey: 'workoutTypes.intervals',
    color: '#ef4444',
    icon: '🔥',
    defaultExplanation: 'Intervalos desenvolvem VO2max, velocidade e economia de corrida. Os períodos de recuperação permitem acumular mais tempo a intensidades altas.',
  },
  fartlek: {
    name: 'Fartlek',
    nameKey: 'workoutTypes.fartlek',
    color: '#8b5cf6',
    icon: '🎲',
    defaultExplanation: 'Fartlek ("jogo de velocidade" em sueco) combina variações de ritmo de forma menos estruturada, desenvolvendo adaptabilidade e preparação mental.',
  },
  hills: {
    name: 'Hills',
    nameKey: 'workoutTypes.hills',
    color: '#6b7280',
    icon: '⛰️',
    defaultExplanation: 'Treino de colinas desenvolve força específica de corrida, potência e economia sem o stress articular de intervalos rápidos em plano.',
  },
  recovery: {
    name: 'Recovery',
    nameKey: 'workoutTypes.recovery',
    color: '#14b8a6',
    icon: '🧘',
    defaultExplanation: 'Corridas de recuperação promovem fluxo sanguíneo para reparação muscular sem adicionar stress significativo. Devem ser muito fáceis.',
  },
  race: {
    name: 'Race',
    nameKey: 'workoutTypes.race',
    color: '#dc2626',
    icon: '🏁',
    defaultExplanation: 'Dia de prova! Todo o treino culmina aqui. Foca-te na execução do plano de corrida e aproveita o momento.',
  },
  rest: {
    name: 'Rest',
    nameKey: 'workoutTypes.rest',
    color: '#9ca3af',
    icon: '😴',
    defaultExplanation: 'Descanso é quando o corpo adapta e fica mais forte. Tão importante quanto o treino.',
  },
  strides: {
    name: 'With Strides',
    nameKey: 'workoutTypes.strides',
    color: '#eab308',
    icon: '💨',
    defaultExplanation: 'Strides (acelerações curtas de 15-20s) mantêm a eficiência neuromuscular e economia de corrida sem fadiga significativa.',
  },
  progression: {
    name: 'Progression',
    nameKey: 'workoutTypes.progression',
    color: '#ec4899',
    icon: '📈',
    defaultExplanation: 'Corridas progressivas treinam a capacidade de acelerar quando fatigado, simulando a segunda metade de uma prova bem corrida.',
  },
};

// ============================================
// DAYS OF WEEK (Português)
// ============================================

export const DAYS_OF_WEEK_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

export const DAYS_OF_WEEK_SHORT_PT = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
] as const;

// ============================================
// TRAINING PHASES
// ============================================

export const TRAINING_PHASE_INFO: Record<TrainingPhase, {
  name: string;
  nameKey: string;
  color: string;
  description: string;
}> = {
  base: {
    name: 'Base Building',
    nameKey: 'phases.base',
    color: '#22c55e',
    description: 'Construção de base aeróbica com volume crescente e baixa intensidade.',
  },
  build: {
    name: 'Build',
    nameKey: 'phases.build',
    color: '#3b82f6',
    description: 'Aumento progressivo de volume e introdução de trabalho de qualidade.',
  },
  peak: {
    name: 'Peak',
    nameKey: 'phases.peak',
    color: '#f97316',
    description: 'Pico de forma com trabalho específico de ritmo de prova.',
  },
  taper: {
    name: 'Taper',
    nameKey: 'phases.taper',
    color: '#8b5cf6',
    description: 'Redução de volume mantendo intensidade para chegar fresco à prova.',
  },
  recovery: {
    name: 'Recovery',
    nameKey: 'phases.recovery',
    color: '#14b8a6',
    description: 'Semana de recuperação/alívio para absorver carga acumulada.',
  },
  race: {
    name: 'Race Week',
    nameKey: 'phases.race',
    color: '#dc2626',
    description: 'Semana de prova com preparação final e descanso.',
  },
};
