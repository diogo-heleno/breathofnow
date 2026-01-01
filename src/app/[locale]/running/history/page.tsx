'use client';

import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { runningDb } from '@/lib/db/running-db';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Heart, Smile, Meh, Frown, Activity } from 'lucide-react';
import { WORKOUT_TYPE_INFO } from '@/types/running';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const t = useTranslations('runLog');

  const activePlan = useLiveQuery(() => runningDb.getActivePlan());
  const sessions = useLiveQuery(() => runningDb.getSessionHistory(50));
  const stats = useLiveQuery(
    () => activePlan?.id ? runningDb.getTotalStats(activePlan.id) : null,
    [activePlan?.id]
  );

  const getFeelingIcon = (feeling?: number) => {
    if (!feeling) return null;
    if (feeling >= 4) return <Smile className="w-5 h-5 text-green-500" />;
    if (feeling >= 3) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  const formatPace = (pace?: string) => {
    if (!pace) return '--:--';
    return pace;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pb-24">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/running" className="inline-flex items-center gap-2 text-primary-100 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>

          <h1 className="text-2xl font-bold mb-4">{t('nav.history')}</h1>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <div className="text-sm text-primary-100">Sessões</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.totalDistanceKm.toFixed(1)}</div>
                <div className="text-sm text-primary-100">km total</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{formatDuration(stats.totalDurationMin)}</div>
                <div className="text-sm text-primary-100">Tempo</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="max-w-4xl mx-auto p-4 -mt-4">
        {!sessions || sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('session.noHistory')}
            </h2>
            <p className="text-gray-500">
              {t('session.startFirst')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const typeInfo = WORKOUT_TYPE_INFO[session.workoutType];

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `var(--${typeInfo.color}-100, #f3f4f6)` }}
                    >
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {session.workoutTitle}
                        </span>
                        {getFeelingIcon(session.feeling)}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {format(session.startedAt, "EEEE, d 'de' MMMM", { locale: pt })}
                      </div>

                      {/* Metrics */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {session.actualDistanceKm && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Activity className="w-4 h-4" />
                            <span className="font-medium">{session.actualDistanceKm} km</span>
                          </div>
                        )}
                        {session.actualDurationMin && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(session.actualDurationMin)}</span>
                          </div>
                        )}
                        {session.actualPaceAvg && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="font-medium">{formatPace(session.actualPaceAvg)}</span>
                            <span className="text-gray-400">/km</span>
                          </div>
                        )}
                        {session.avgHeartRate && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Heart className="w-4 h-4 text-red-400" />
                            <span>{session.avgHeartRate} bpm</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {session.notes && (
                        <div className="mt-2 text-sm text-gray-500 italic">
                          "{session.notes}"
                        </div>
                      )}

                      {/* RPE */}
                      {session.perceivedEffort && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">RPE:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-2 h-4 rounded-sm",
                                    i < session.perceivedEffort!
                                      ? session.perceivedEffort! <= 3
                                        ? "bg-green-400"
                                        : session.perceivedEffort! <= 6
                                        ? "bg-yellow-400"
                                        : session.perceivedEffort! <= 8
                                        ? "bg-orange-400"
                                        : "bg-red-400"
                                      : "bg-gray-200"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-1">
                              {session.perceivedEffort}/10
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
