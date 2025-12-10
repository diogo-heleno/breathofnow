// FitLog History Page

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Clock, ChevronRight, TrendingUp, Calendar } from 'lucide-react';
import { fitlogDb } from '@/lib/db/fitlog-db';
import { EmptyState } from '@/components/fitlog/common';
import type { WorkoutSession } from '@/types/fitlog';

interface HistoryPageProps {
  params: { locale: string };
}

export default function HistoryPage({ params }: HistoryPageProps) {
  const { locale } = params;
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    async function loadHistory() {
      try {
        let sessionsData: WorkoutSession[];

        if (filter === 'week') {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          sessionsData = await fitlogDb.getSessionsInDateRange(startDate, new Date());
        } else if (filter === 'month') {
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          sessionsData = await fitlogDb.getSessionsInDateRange(startDate, new Date());
        } else {
          sessionsData = await fitlogDb.getSessionHistory(50);
        }

        // Only show completed sessions
        setSessions(sessionsData.filter((s) => s.completedAt));
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [filter]);

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;

    return d.toLocaleDateString('pt-PT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${kg}kg`;
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.startedAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as { [key: string]: WorkoutSession[] });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-neutral-200 rounded-xl animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Histórico de Treinos</h1>

      {/* Filter */}
      <div className="flex bg-neutral-100 p-1 rounded-xl">
        {[
          { value: 'all' as const, label: 'Todos' },
          { value: 'week' as const, label: 'Semana' },
          { value: 'month' as const, label: 'Mês' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === option.value
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Sem treinos registados"
          description="Completa o teu primeiro treino para ver o histórico aqui."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-neutral-200 text-center">
              <p className="text-2xl font-bold text-neutral-900">{sessions.length}</p>
              <p className="text-xs text-neutral-500">Treinos</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-neutral-200 text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {sessions.reduce((sum, s) => sum + (s.duration || 0), 0)}
              </p>
              <p className="text-xs text-neutral-500">Minutos</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-neutral-200 text-center">
              <p className="text-xl font-bold text-neutral-900">
                {formatVolume(sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0))}
              </p>
              <p className="text-xs text-neutral-500">Volume</p>
            </div>
          </div>

          {/* Sessions list */}
          {Object.entries(groupedSessions).map(([date, daySessions]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-neutral-500 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(new Date(date))}
              </h3>

              <div className="space-y-2">
                {daySessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/${locale}/fitlog/history/${session.id}`}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {session.workoutName || 'Treino'}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {session.duration || 0} min
                          </span>
                          {session.totalVolume && session.totalVolume > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {formatVolume(session.totalVolume)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.feeling && (
                        <span className="text-xl">
                          {['😫', '😕', '😐', '😊', '🤩'][session.feeling - 1]}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
