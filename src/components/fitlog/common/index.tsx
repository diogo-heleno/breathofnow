// FitLog Common Components

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, ExternalLink, Dumbbell } from 'lucide-react';
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/types/fitlog';

// ============================================
// MUSCLE BADGE
// ============================================

interface MuscleBadgeProps {
  muscle: string;
  size?: 'sm' | 'md';
}

export function MuscleBadge({ muscle, size = 'sm' }: MuscleBadgeProps) {
  const label = MUSCLE_GROUP_LABELS[muscle as MuscleGroup] || muscle;
  
  return (
    <span
      className={`
        inline-flex items-center rounded-full bg-primary-100 text-primary-600 font-medium
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      `}
    >
      {label}
    </span>
  );
}

// ============================================
// VIDEO LINK
// ============================================

interface VideoLinkProps {
  url: string;
  exerciseName: string;
}

export function VideoLink({ url, exerciseName }: VideoLinkProps) {
  // Extract YouTube video ID
  const getYouTubeId = (urlString: string): string | null => {
    const match = urlString.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
    >
      {thumbnailUrl ? (
        <div className="relative w-20 h-14 rounded overflow-hidden flex-shrink-0">
          <img
            src={thumbnailUrl}
            alt={`Como fazer ${exerciseName}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      ) : (
        <div className="w-20 h-14 rounded bg-neutral-300 flex items-center justify-center flex-shrink-0">
          <Play className="w-6 h-6 text-neutral-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
          Ver demonstração
        </p>
        <p className="text-xs text-neutral-500 truncate">{exerciseName}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
    </a>
  );
}

// ============================================
// REST TIMER
// ============================================

interface RestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function RestTimer({ initialSeconds, onComplete, autoStart = false }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [hasStarted, setHasStarted] = useState(autoStart);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            // Vibrate if supported
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  const toggle = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsRunning((prev) => !prev);
  }, [hasStarted]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
    setHasStarted(false);
  }, [initialSeconds]);

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = hasStarted ? ((initialSeconds - seconds) / initialSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Timer Circle */}
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-neutral-200"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            className={`transition-all duration-1000 ${
              seconds === 0 ? 'text-green-500' : 'text-primary-600'
            }`}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-2xl font-bold tabular-nums ${
              seconds === 0 ? 'text-green-500' : 'text-neutral-900'
            }`}
          >
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full
            transition-colors
            ${
              isRunning
                ? 'bg-accent-600 text-white hover:bg-accent-700'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }
          `}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {seconds === 0 && (
        <p className="text-sm font-medium text-green-600 animate-pulse">
          Tempo! Próxima série 💪
        </p>
      )}
    </div>
  );
}

// ============================================
// DIFFICULTY SELECTOR
// ============================================

interface DifficultySelectorProps {
  value: 1 | 2 | 3;
  onChange: (value: 1 | 2 | 3) => void;
  disabled?: boolean;
}

export function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  const options = [
    { value: 1 as const, emoji: '😊', label: 'Fácil' },
    { value: 2 as const, emoji: '😐', label: 'Médio' },
    { value: 3 as const, emoji: '😓', label: 'Difícil' },
  ];

  return (
    <div className="flex items-center gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg text-xl
            transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${
              value === option.value
                ? 'bg-primary-100 ring-2 ring-primary-600 scale-110'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }
          `}
          title={option.label}
        >
          {option.emoji}
        </button>
      ))}
    </div>
  );
}

// ============================================
// FEELING SELECTOR (for session end)
// ============================================

interface FeelingSelectorProps {
  value: 1 | 2 | 3 | 4 | 5 | undefined;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export function FeelingSelector({ value, onChange }: FeelingSelectorProps) {
  const options = [
    { value: 1 as const, emoji: '😫', label: 'Péssimo' },
    { value: 2 as const, emoji: '😕', label: 'Mau' },
    { value: 3 as const, emoji: '😐', label: 'Normal' },
    { value: 4 as const, emoji: '😊', label: 'Bom' },
    { value: 5 as const, emoji: '🤩', label: 'Excelente' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-700">Como te sentiste?</p>
      <div className="flex items-center justify-between gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg transition-all flex-1
              ${
                value === option.value
                  ? 'bg-primary-100 ring-2 ring-primary-600'
                  : 'bg-neutral-100 hover:bg-neutral-200'
              }
            `}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className="text-xs text-neutral-600">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PROGRESS RING
// ============================================

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary-600 transition-all duration-500"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon || (
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-neutral-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mt-4">{title}</h3>
      <p className="text-sm text-neutral-500 mt-1 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({ label, value, icon, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {trend && trendValue && (
            <p
              className={`text-xs mt-1 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                  ? 'text-red-600'
                  : 'text-neutral-500'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
