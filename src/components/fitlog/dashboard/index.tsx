// FitLog Dashboard Components

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Calendar,
  TrendingUp,
  Clock,
  Dumbbell,
  ChevronRight,
  Flame,
  Target,
} from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { useFitLogStore } from '@/stores/fitlog-store';
import { StatCard, EmptyState, ProgressRing } from '../common';
import type { Workout, WorkoutSession, WorkoutPlan } from '@/types/fitlog';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_SHORT } from '@/types/fitlog';

// ============================================
// TODAY'S WORKOUT CARD
// ============================================

interface TodayWorkoutProps {
  locale: string;
}

export function TodayWorkout({ locale }: TodayWorkoutProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activePlanId } = useFitLogStore();

  useEffect(() => {
    async function loadTodayWorkout() {
      if (!activePlanId) {
        setIsLoading(false);
        return;
      }

      try {
        const today = new Date().getDay();
        const workouts = await fitlogDb.workouts
          .where('planId')
          .equals(activePlanId)
          .toArray();

        const todayWorkout = workouts.find((w) => w.dayOfWeek === today);

        if (todayWorkout) {
          setWorkout(todayWorkout);
          const exercises = await fitlogDb.getExercisesByWorkout(todayWorkout.id!);
          setExerciseCount(exercises.length);

          const last = await fitlogDb.getLastSessionForWorkout(todayWorkout.id!);
          setLastSession(last || null);
        }
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
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-white/20 rounded w-2/3 mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-1/2"></div>
      </div>
    );
  }

  if (!activePlanId) {
    return (
      <div className="bg-neutral-100 rounded-2xl p-6">
        <EmptyState
          title="Nenhum plano ativo"
          description="Importa um plano de treino para começar"
          action={{
            label: 'Importar Plano',
            onClick: () => (window.location.href = `/${locale}/fitlog/plans/import`),
          }}
        />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-secondary/80">Hoje</p>
            <h3 className="text-xl font-bold text-neutral-900">Dia de Descanso</h3>
          </div>
        </div>
        <p className="text-neutral-600">
          Hoje não tens treino agendado. Descansa e recupera! 🧘
        </p>
      </div>
    );
  }

  const daysSinceLastSession = lastSession
    ? Math.floor(
        (Date.now() - new Date(lastSession.completedAt!).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {DAYS_OF_WEEK[new Date().getDay()]}
          </p>
          <h3 className="text-2xl font-bold mt-1">{workout.name}</h3>
        </div>
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Dumbbell className="w-7 h-7" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-white/90 text-sm mb-6">
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          {exerciseCount} exercícios
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />~{workout.targetDuration} min
        </span>
      </div>

      {lastSession && (
        <p className="text-white/70 text-sm mb-4">
          Último treino: há {daysSinceLastSession} dia{daysSinceLastSession !== 1 ? 's' : ''}
          {lastSession.feeling && ` • Sentiste-te ${['😫', '😕', '😐', '😊', '🤩'][lastSession.feeling - 1]}`}
        </p>
      )}

      <Link
        href={`/${locale}/fitlog/workout/${workout.id}/session`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-colors"
      >
        <Play className="w-5 h-5" />
        Iniciar Treino
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
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const { activePlanId } = useFitLogStore();
  const today = new Date().getDay();

  useEffect(() => {
    async function loadWeek() {
      if (!activePlanId) return;

      try {
        const planWorkouts = await fitlogDb.getWorkoutsByPlan(activePlanId);
        setWorkouts(planWorkouts);

        // Check which days have completed sessions this week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const sessions = await fitlogDb.getSessionsInDateRange(startOfWeek, new Date());
        const completedWorkoutIds = new Set(
          sessions.filter((s) => s.completedAt).map((s) => s.workoutId)
        );

        const completed = new Set<number>();
        planWorkouts.forEach((w) => {
          if (completedWorkoutIds.has(w.id!)) {
            completed.add(w.dayOfWeek);
          }
        });
        setCompletedDays(completed);
      } catch (error) {
        console.error('Error loading week:', error);
      }
    }

    loadWeek();
  }, [activePlanId]);

  const workoutDays = new Set(workouts.map((w) => w.dayOfWeek));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
      <h3 className="font-semibold text-neutral-900 mb-4">Esta Semana</h3>

      <div className="flex items-center justify-between">
        {DAYS_OF_WEEK_SHORT.map((day, index) => {
          const hasWorkout = workoutDays.has(index);
          const isCompleted = completedDays.has(index);
          const isToday = index === today;

          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span
                className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-neutral-500'}`}
              >
                {day}
              </span>
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : hasWorkout
                      ? isToday
                        ? 'bg-primary text-white'
                        : 'bg-primary/20 text-primary'
                      : 'bg-neutral-100 text-neutral-400'
                  }
                `}
              >
                {isCompleted ? (
                  '✓'
                ) : hasWorkout ? (
                  <Dumbbell className="w-4 h-4" />
                ) : (
                  <span className="text-xs">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {workouts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">{completedDays.size}</span> de{' '}
            <span className="font-medium text-neutral-900">{workouts.length}</span> treinos
            concluídos
          </p>
          <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(completedDays.size / workouts.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// QUICK STATS
// ============================================

export function QuickStats() {
  const [stats, setStats] = useState({
    sessionsThisWeek: 0,
    totalVolume: 0,
    totalDuration: 0,
    avgFeeling: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const weeklyStats = await fitlogDb.getWeeklyStats();
        setStats(weeklyStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }

    loadStats();
  }, []);

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${kg}kg`;
  };

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
        label="Esta Semana"
        value={stats.sessionsThisWeek}
        icon={<Flame className="w-5 h-5" />}
      />
      <StatCard
        label="Volume Total"
        value={formatVolume(stats.totalVolume)}
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <StatCard
        label="Tempo Total"
        value={formatDuration(stats.totalDuration)}
        icon={<Clock className="w-5 h-5" />}
      />
      <StatCard
        label="Sensação Média"
        value={stats.avgFeeling > 0 ? `${stats.avgFeeling.toFixed(1)}/5` : '-'}
        icon={<span className="text-xl">😊</span>}
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
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const recentSessions = await fitlogDb.getSessionHistory(limit);
        setSessions(recentSessions.filter((s) => s.completedAt));
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
            <div className="h-5 bg-neutral-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>Ainda não tens treinos registados</p>
      </div>
    );
  }

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;

    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link
          key={session.id}
          href={`/${locale}/fitlog/history/${session.id}`}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">
                {session.workoutName || `Treino`}
              </p>
              <p className="text-sm text-neutral-500">
                {formatDate(new Date(session.startedAt))} · {session.duration || 0} min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.feeling && (
              <span className="text-xl">
                {['😫', '😕', '😐', '😊', '🤩'][session.feeling - 1]}
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary transition-colors" />
          </div>
        </Link>
      ))}

      {sessions.length >= limit && (
        <Link
          href={`/${locale}/fitlog/history`}
          className="block text-center py-3 text-sm text-primary font-medium hover:underline"
        >
          Ver todo o histórico
        </Link>
      )}
    </div>
  );
}

// ============================================
// ACTIVE PLAN CARD
// ============================================

interface ActivePlanCardProps {
  locale: string;
}

export function ActivePlanCard({ locale }: ActivePlanCardProps) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const { activePlanId, setActivePlan } = useFitLogStore();

  useEffect(() => {
    async function loadPlan() {
      if (!activePlanId) {
        const active = await fitlogDb.getActivePlan();
        if (active) {
          setActivePlan(active);
          setPlan(active);
        }
        return;
      }

      try {
        const activePlan = await fitlogDb.workoutPlans.get(activePlanId);
        if (activePlan) {
          setPlan(activePlan);
          setActivePlan(activePlan);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      }
    }

    loadPlan();
  }, [activePlanId, setActivePlan]);

  if (!plan) {
    return null;
  }

  return (
    <Link
      href={`/${locale}/fitlog/plans/${plan.id}`}
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary/30 transition-colors group"
    >
      <div>
        <p className="text-sm text-neutral-500">Plano Ativo</p>
        <p className="font-semibold text-neutral-900">{plan.planName}</p>
        {plan.athleteGoal && (
          <p className="text-xs text-neutral-500 mt-1">{plan.athleteGoal}</p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary transition-colors" />
    </Link>
  );
}
