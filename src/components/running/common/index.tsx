// RunLog Common Components

'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WorkoutType, TrainingPhase, Feeling } from '@/types/running';
import { WORKOUT_TYPE_INFO, TRAINING_PHASE_INFO } from '@/types/running';

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl p-4 border border-neutral-200',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-neutral-500">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
        {trend && (
          <span className={cn(
            'text-sm',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'neutral' && 'text-neutral-500'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// WORKOUT TYPE BADGE
// ============================================

interface WorkoutTypeBadgeProps {
  type: WorkoutType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function WorkoutTypeBadge({ type, size = 'md', showIcon = true, className }: WorkoutTypeBadgeProps) {
  const t = useTranslations('runLog');
  const info = WORKOUT_TYPE_INFO[type];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${info.color}20`,
        color: info.color,
      }}
    >
      {showIcon && <span>{info.icon}</span>}
      <span>{t(info.nameKey)}</span>
    </span>
  );
}

// ============================================
// PHASE BADGE
// ============================================

interface PhaseBadgeProps {
  phase: TrainingPhase;
  size?: 'sm' | 'md';
  className?: string;
}

export function PhaseBadge({ phase, size = 'md', className }: PhaseBadgeProps) {
  const t = useTranslations('runLog');
  const info = TRAINING_PHASE_INFO[phase];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${info.color}20`,
        color: info.color,
      }}
    >
      {t(info.nameKey)}
    </span>
  );
}

// ============================================
// FEELING SELECTOR
// ============================================

interface FeelingSelectorProps {
  value?: Feeling;
  onChange: (feeling: Feeling) => void;
  size?: 'sm' | 'md' | 'lg';
}

const FEELING_EMOJIS: Record<Feeling, { emoji: string; label: string }> = {
  1: { emoji: '😫', label: 'Terrível' },
  2: { emoji: '😕', label: 'Mau' },
  3: { emoji: '😐', label: 'OK' },
  4: { emoji: '😊', label: 'Bom' },
  5: { emoji: '🤩', label: 'Excelente' },
};

export function FeelingSelector({ value, onChange, size = 'md' }: FeelingSelectorProps) {
  const t = useTranslations('runLog.session.feelings');

  const sizeClasses = {
    sm: 'text-xl w-10 h-10',
    md: 'text-2xl w-12 h-12',
    lg: 'text-3xl w-14 h-14',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {([1, 2, 3, 4, 5] as Feeling[]).map((feeling) => (
        <button
          key={feeling}
          onClick={() => onChange(feeling)}
          className={cn(
            'rounded-full flex items-center justify-center transition-all',
            sizeClasses[size],
            value === feeling
              ? 'bg-primary-100 ring-2 ring-primary-600 scale-110'
              : 'bg-neutral-100 hover:bg-neutral-200'
          )}
          title={t(FEELING_EMOJIS[feeling].label.toLowerCase())}
        >
          {FEELING_EMOJIS[feeling].emoji}
        </button>
      ))}
    </div>
  );
}

// ============================================
// PACE DISPLAY
// ============================================

interface PaceDisplayProps {
  pace: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PaceDisplay({ pace, label, size = 'md', className }: PaceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-bold',
  };

  return (
    <div className={cn('flex items-baseline gap-1', className)}>
      <span className={cn('font-mono font-semibold', sizeClasses[size])}>
        {pace}
      </span>
      <span className="text-neutral-500 text-xs">/km</span>
      {label && <span className="text-neutral-400 text-xs ml-1">({label})</span>}
    </div>
  );
}

// ============================================
// DISTANCE DISPLAY
// ============================================

interface DistanceDisplayProps {
  km: number;
  size?: 'sm' | 'md' | 'lg';
  showUnit?: boolean;
  className?: string;
}

export function DistanceDisplay({ km, size = 'md', showUnit = true, className }: DistanceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg font-semibold',
    lg: 'text-2xl font-bold',
  };

  return (
    <span className={cn('font-mono', sizeClasses[size], className)}>
      {km.toFixed(1)}
      {showUnit && <span className="text-neutral-500 text-xs ml-0.5">km</span>}
    </span>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-neutral-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-neutral-600 text-sm mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({
  value,
  max,
  color = '#22c55e',
  showLabel = false,
  size = 'md',
  className
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-neutral-100 rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// COUNTDOWN TO RACE
// ============================================

interface RaceCountdownProps {
  raceName: string;
  raceDate: string;
  targetTime?: string;
  className?: string;
}

export function RaceCountdown({ raceName, raceDate, targetTime, className }: RaceCountdownProps) {
  const t = useTranslations('runLog');
  const today = new Date();
  const race = new Date(raceDate);
  const diffTime = race.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  const isClose = diffDays <= 14;
  const isPast = diffDays < 0;

  if (isPast) return null;

  return (
    <div className={cn(
      'rounded-xl p-4 border',
      isClose ? 'bg-accent/10 border-accent' : 'bg-primary-50 border-primary-200',
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
          isClose ? 'bg-accent/20' : 'bg-primary-100'
        )}>
          🏁
        </div>
        <div className="flex-1">
          <p className="font-semibold text-neutral-900">{raceName}</p>
          <p className="text-sm text-neutral-600">
            {diffDays === 0
              ? t('countdown.today')
              : diffDays === 1
              ? t('countdown.tomorrow')
              : diffWeeks > 0
              ? t('countdown.weeksLeft', { weeks: diffWeeks, days: diffDays % 7 })
              : t('countdown.daysLeft', { days: diffDays })
            }
          </p>
        </div>
        {targetTime && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">{t('countdown.target')}</p>
            <p className="font-mono font-bold text-lg">{targetTime}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// WEEK CALENDAR BAR
// ============================================

interface WeekCalendarBarProps {
  workouts: {
    dayOfWeek: number;
    isCompleted: boolean;
    isToday: boolean;
    type: WorkoutType;
  }[];
  className?: string;
}

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function WeekCalendarBar({ workouts, className }: WeekCalendarBarProps) {
  const workoutByDay = new Map(workouts.map(w => [w.dayOfWeek, w]));

  return (
    <div className={cn('flex items-center justify-between gap-1', className)}>
      {DAY_LABELS.map((label, index) => {
        const workout = workoutByDay.get(index);
        const hasWorkout = !!workout && workout.type !== 'rest';
        const isCompleted = workout?.isCompleted;
        const isToday = workout?.isToday;

        return (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className={cn(
              'text-xs',
              isToday ? 'font-bold text-primary-600' : 'text-neutral-500'
            )}>
              {label}
            </span>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                isCompleted
                  ? 'bg-green-500 text-white'
                  : hasWorkout
                    ? isToday
                      ? 'bg-primary-600 text-white'
                      : 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-400'
              )}
            >
              {isCompleted ? '✓' : hasWorkout ? WORKOUT_TYPE_INFO[workout!.type].icon : '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
