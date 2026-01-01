// RunLog Dashboard Components

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Play,
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Target,
  Zap,
  Info,
} from 'lucide-react';
import { runningDb, isRunningDbAvailable } from '@/lib/db/running-db';
import { useRunningStore } from '@/stores/running-store';
import {
  StatCard,
  WorkoutTypeBadge,
  PhaseBadge,
  DistanceDisplay,
  PaceDisplay,
  EmptyState,
  ProgressBar,
  RaceCountdown,
  WeekCalendarBar,
} from '../common';
import type { RunningWorkout, RunningSession, WeekProgress, TodayWorkoutInfo } from '@/types/running';
import { WORKOUT_TYPE_INFO } from '@/types/running';

// ============================================
// TODAY'S WORKOUT CARD
// ============================================

interface TodayWorkoutProps {
  locale: string;
}

export function TodayWorkout({ locale }: TodayWorkoutProps) {
  const [info, setInfo] = useState<TodayWorkoutInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activePlanId } = useRunningStore();
  const t = useTranslations('runLog');

  useEffect(() => {
    async function loadTodayWorkout() {
      if (!activePlanId || !isRunningDbAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        const todayInfo = await runningDb.getTodayWorkout(activePlanId);
        setInfo(todayInfo);
      } catch (error) {
        console.error('Error loading today workout:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTodayWorkout();
  }, [activePlanId]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-2" />
        <div className="h-8 bg-white/20 rounded w-2/3 mb-4" />
        <div className="h-4 bg-white/20 rounded w-1/2" />
      </div>
    );
  }

  if (!activePlanId) {
    return (
      <div className="bg-neutral-100 rounded-2xl p-6">
        <EmptyState
          title={t('dashboard.noPlan')}
          description={t('dashboard.noPlanDescription')}
          action={{
            label: t('dashboard.importPlan'),
            onClick: () => (window.location.href = `/${locale}/running/import`),
          }}
        />
      </div>
    );
  }

  // Dia de descanso
  if (!info?.workout || info.isRestDay) {
    return (
      <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl">
            😴
          </div>
          <div>
            <p className="text-sm text-secondary/80">{t('dashboard.today')}</p>
            <h3 className="text-xl font-bold text-neutral-900">{t('dashboard.restDay')}</h3>
          </div>
        </div>
        <p className="text-neutral-600 mb-4">
          {t('dashboard.restDayMessage')}
        </p>
        {info?.nextWorkout && (
          <div className="pt-4 border-t border-secondary/20">
            <p className="text-sm text-neutral-500 mb-2">
              {t('dashboard.nextWorkout')} ({t('dashboard.inDays', { days: info.daysUntilNext })}):
            </p>
            <p className="font-medium text-neutral-900">{info.nextWorkout.title}</p>
          </div>
        )}
      </div>
    );
  }

  const workout = info.workout;
  const typeInfo = WORKOUT_TYPE_INFO[workout.type];

  return (
    <div
      className="rounded-2xl p-6 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}dd 100%)`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {t('dashboard.today')}
          </p>
          <h3 className="text-2xl font-bold mt-1">{workout.title}</h3>
        </div>
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          {typeInfo.icon}
        </div>
      </div>

      <p className="text-white/90 text-sm mb-4 line-clamp-2">
        {workout.description}
      </p>

      <div className="flex items-center gap-4 text-white/90 text-sm mb-6">
        {workout.totalDistanceKm && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {workout.totalDistanceKm} km
          </span>
        )}
        {workout.estimatedDurationMin && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            ~{workout.estimatedDurationMin} min
          </span>
        )}
      </div>

      <Link
        href={`/${locale}/running/workout/${workout.id}`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-white text-neutral-900 rounded-xl font-semibold hover:bg-white/90 transition-colors"
      >
        <Play className="w-5 h-5" />
        {t('dashboard.viewWorkout')}
      </Link>
    </div>
  );
}

// ============================================
// WEEK OVERVIEW
// ============================================

interface WeekOverviewProps {
  locale: string;
}

export function WeekOverview({ locale }: WeekOverviewProps) {
  const [progress, setProgress] = useState<WeekProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activePlanId } = useRunningStore();
  const t = useTranslations('runLog');

  useEffect(() => {
    async function loadWeek() {
      if (!activePlanId || !isRunningDbAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        const currentWeek = await runningDb.getCurrentWeekNumber(activePlanId);
        const weekProgress = await runningDb.getWeekProgress(activePlanId, currentWeek);
        setProgress(weekProgress);
      } catch (error) {
        console.error('Error loading week:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWeek();
  }, [activePlanId]);

  if (isLoading || !progress) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4" />
        <div className="flex justify-between gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-8 h-8 bg-neutral-200 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  const workoutsForCalendar = progress.workouts.map(w => ({
    dayOfWeek: w.workout.dayOfWeek,
    isCompleted: w.isCompleted,
    isToday: w.isToday,
    type: w.workout.type,
  }));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-neutral-900">
            {t('dashboard.week')} {progress.weekNumber}
          </h3>
          <PhaseBadge phase={progress.phase} size="sm" className="mt-1" />
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">{t('dashboard.progress')}</p>
          <p className="font-semibold text-neutral-900">
            {progress.completedWorkouts}/{progress.plannedWorkouts}
          </p>
        </div>
      </div>

      <WeekCalendarBar workouts={workoutsForCalendar} className="mb-4" />

      <div className="pt-4 border-t border-neutral-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-500">{t('dashboard.distance')}</span>
          <span className="font-medium">
            {progress.completedDistanceKm.toFixed(1)} / {progress.plannedDistanceKm.toFixed(1)} km
          </span>
        </div>
        <ProgressBar
          value={progress.completedDistanceKm}
          max={progress.plannedDistanceKm}
          color="#22c55e"
        />
      </div>
    </div>
  );
}

// ============================================
// QUICK STATS
// ============================================

export function QuickStats() {
  const [stats, setStats] = useState({
    sessionsThisWeek: 0,
    totalDistanceKm: 0,
    totalDurationMin: 0,
    avgPace: '-',
    avgFeeling: 0,
  });
  const { activePlanId } = useRunningStore();
  const t = useTranslations('runLog');

  useEffect(() => {
    async function loadStats() {
      if (!activePlanId || !isRunningDbAvailable()) return;

      try {
        const weeklyStats = await runningDb.getWeeklyStats(activePlanId);
        setStats(weeklyStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }

    loadStats();
  }, [activePlanId]);

  const formatDuration = (mins: number): string => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0 ? `${hours}h${remaining}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label={t('dashboard.runsThisWeek')}
        value={stats.sessionsThisWeek}
        icon={<Zap className="w-5 h-5" />}
      />
      <StatCard
        label={t('dashboard.distanceThisWeek')}
        value={`${stats.totalDistanceKm} km`}
        icon={<MapPin className="w-5 h-5" />}
      />
      <StatCard
        label={t('dashboard.timeThisWeek')}
        value={formatDuration(stats.totalDurationMin)}
        icon={<Clock className="w-5 h-5" />}
      />
      <StatCard
        label={t('dashboard.avgPace')}
        value={stats.avgPace}
        icon={<TrendingUp className="w-5 h-5" />}
      />
    </div>
  );
}

// ============================================
// RECENT SESSIONS
// ============================================

interface RecentSessionsProps {
  locale: string;
  limit?: number;
}

export function RecentSessions({ locale, limit = 5 }: RecentSessionsProps) {
  const [sessions, setSessions] = useState<RunningSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('runLog');
  const tc = useTranslations('common');

  useEffect(() => {
    async function loadSessions() {
      if (!isRunningDbAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        const recentSessions = await runningDb.getSessionHistory(limit);
        setSessions(recentSessions.filter(s => s.completedAt));
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSessions();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-neutral-100 rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-neutral-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-neutral-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>{t('dashboard.noSessionsYet')}</p>
      </div>
    );
  }

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return tc('today');
    if (diffDays === 1) return tc('yesterday');
    if (diffDays < 7) return tc('daysAgo', { days: diffDays });

    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  };

  const FEELING_EMOJIS = ['', '😫', '😕', '😐', '😊', '🤩'];

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link
          key={session.id}
          href={`/${locale}/running/history/${session.id}`}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{
                backgroundColor: `${WORKOUT_TYPE_INFO[session.workoutType].color}20`,
              }}
            >
              {WORKOUT_TYPE_INFO[session.workoutType].icon}
            </div>
            <div>
              <p className="font-medium text-neutral-900">
                {session.workoutTitle}
              </p>
              <p className="text-sm text-neutral-500">
                {formatDate(new Date(session.startedAt))}
                {session.actualDistanceKm && ` · ${session.actualDistanceKm} km`}
                {session.actualPaceAvg && ` · ${session.actualPaceAvg}/km`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.feeling && (
              <span className="text-xl">{FEELING_EMOJIS[session.feeling]}</span>
            )}
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>
      ))}

      {sessions.length >= limit && (
        <Link
          href={`/${locale}/running/history`}
          className="block text-center py-3 text-sm text-primary-600 font-medium hover:underline"
        >
          {t('dashboard.viewAllHistory')}
        </Link>
      )}
    </div>
  );
}

// ============================================
// NEXT RACE CARD
// ============================================

interface NextRaceCardProps {
  locale: string;
}

export function NextRaceCard({ locale }: NextRaceCardProps) {
  const [race, setRace] = useState<RunningWorkout | null>(null);
  const { activePlanId } = useRunningStore();
  const t = useTranslations('runLog');

  useEffect(() => {
    async function loadNextRace() {
      if (!activePlanId || !isRunningDbAvailable()) return;

      try {
        const nextRace = await runningDb.getNextRace(activePlanId);
        setRace(nextRace || null);
      } catch (error) {
        console.error('Error loading next race:', error);
      }
    }

    loadNextRace();
  }, [activePlanId]);

  if (!race) return null;

  return (
    <RaceCountdown
      raceName={race.raceName || race.title}
      raceDate={race.scheduledDate}
      targetTime={race.raceTargetTime}
    />
  );
}

// ============================================
// WHY EXPLANATION CARD
// ============================================

interface WhyExplanationProps {
  workout: RunningWorkout;
}

export function WhyExplanation({ workout }: WhyExplanationProps) {
  const t = useTranslations('runLog');
  const [isExpanded, setIsExpanded] = useState(false);

  const explanation = workout.whyExplanation || WORKOUT_TYPE_INFO[workout.type].defaultExplanation;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <span className="font-medium text-blue-900">{t('workout.whyThisWorkout')}</span>
        <ChevronRight
          className={`w-4 h-4 text-blue-600 ml-auto transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <p className="mt-3 text-sm text-blue-800 leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  );
}
