'use client';

import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { runningDb } from '@/lib/db/running-db';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Calendar, Target, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { WORKOUT_TYPE_INFO } from '@/types/running';
import { cn } from '@/lib/utils';

export default function PlanPage() {
  const t = useTranslations('runLog');
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);

  const activePlan = useLiveQuery(() => runningDb.getActivePlan());
  const workouts = useLiveQuery(
    () => activePlan?.id ? runningDb.getWorkoutsByPlan(activePlan.id) : [],
    [activePlan?.id]
  );

  // Group workouts by week
  const workoutsByWeek = workouts?.reduce((acc, workout) => {
    if (!acc[workout.weekNumber]) {
      acc[workout.weekNumber] = [];
    }
    acc[workout.weekNumber].push(workout);
    return acc;
  }, {} as Record<number, typeof workouts>);

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev =>
      prev.includes(weekNumber)
        ? prev.filter(w => w !== weekNumber)
        : [...prev, weekNumber]
    );
  };

  const getWeekStatus = (weekWorkouts: typeof workouts) => {
    if (!weekWorkouts) return 'future';
    const today = new Date();
    const dates = weekWorkouts.map(w => parseISO(w.scheduledDate));
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    if (isPast(lastDate) && !isToday(lastDate)) return 'past';
    if (isFuture(firstDate)) return 'future';
    return 'current';
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[dayOfWeek];
  };

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/running" className="inline-flex items-center gap-2 text-primary-600 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>

          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('onboarding.noPlan')}
            </h2>
            <p className="text-gray-500 mb-6">
              {t('onboarding.importFirst')}
            </p>
            <Link
              href="/running/import"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {t('nav.import')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const weeks = Object.entries(workoutsByWeek || {}).sort(
    ([a], [b]) => parseInt(a) - parseInt(b)
  );

  // Find current week
  const today = new Date().toISOString().split('T')[0];
  const currentWeekNumber = workouts?.find(w => w.scheduledDate === today)?.weekNumber ??
    workouts?.find(w => w.scheduledDate > today)?.weekNumber ?? 0;

  // Auto-expand current week
  if (currentWeekNumber !== undefined && !expandedWeeks.includes(currentWeekNumber)) {
    setExpandedWeeks([currentWeekNumber]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pb-24">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/running" className="inline-flex items-center gap-2 text-primary-100 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.back')}
          </Link>

          <h1 className="text-2xl font-bold mb-2">{activePlan.name}</h1>
          <p className="text-primary-100">
            {activePlan.totalWeeks} {t('dashboard.weeks')} • {activePlan.startDate} - {activePlan.endDate}
          </p>

          {/* Goals */}
          <div className="mt-4 flex flex-wrap gap-3">
            {activePlan.goalRaces.map((race, idx) => (
              <div key={idx} className="bg-white/20 rounded-lg px-3 py-2">
                <div className="font-medium">{race.name}</div>
                <div className="text-sm text-primary-100">
                  {race.date} • {race.targetTime} ({race.targetPace}/km)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weeks List */}
      <div className="max-w-4xl mx-auto p-4 -mt-4">
        <div className="space-y-3">
          {weeks.map(([weekNum, weekWorkouts]) => {
            const weekNumber = parseInt(weekNum);
            const isExpanded = expandedWeeks.includes(weekNumber);
            const status = getWeekStatus(weekWorkouts);
            const isCurrent = weekNumber === currentWeekNumber;
            const firstWorkout = weekWorkouts?.[0];
            const weekDates = firstWorkout ? format(parseISO(firstWorkout.scheduledDate), "d MMM", { locale: pt }) : '';

            // Check for race this week
            const raceWorkout = weekWorkouts?.find(w => w.isRace);

            return (
              <div
                key={weekNumber}
                className={cn(
                  "bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all",
                  isCurrent ? "border-primary-500" : "border-transparent",
                  status === 'past' && "opacity-60"
                )}
              >
                {/* Week Header */}
                <button
                  onClick={() => toggleWeek(weekNumber)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      isCurrent ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"
                    )}>
                      {weekNumber}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        {t('dashboard.week')} {weekNumber}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            Atual
                          </span>
                        )}
                        {raceWorkout && (
                          <span className="ml-2 text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">
                            {raceWorkout.raceName}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{weekDates}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {weekWorkouts?.length} treinos
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Week Workouts */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {weekWorkouts?.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((workout) => {
                      const typeInfo = WORKOUT_TYPE_INFO[workout.type];
                      const workoutDate = parseISO(workout.scheduledDate);
                      const isWorkoutToday = isToday(workoutDate);
                      const isWorkoutPast = isPast(workoutDate) && !isWorkoutToday;

                      return (
                        <Link
                          key={workout.id}
                          href={`/running/workout/${workout.id}`}
                          className={cn(
                            "block p-4 hover:bg-gray-50 transition-colors",
                            isWorkoutToday && "bg-primary-50",
                            isWorkoutPast && "opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
                              `bg-${typeInfo.color}-100`
                            )}
                              style={{ backgroundColor: `var(--${typeInfo.color}-100, #f3f4f6)` }}
                            >
                              {typeInfo.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-500">
                                  {getDayName(workout.dayOfWeek)}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {format(workoutDate, "d/MM", { locale: pt })}
                                </span>
                                {isWorkoutToday && (
                                  <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                                    Hoje
                                  </span>
                                )}
                              </div>
                              <div className="font-medium text-gray-900 mb-1">
                                {workout.title}
                              </div>
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {workout.description}
                              </div>
                              {workout.totalDistanceKm && (
                                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    {workout.totalDistanceKm} km
                                  </span>
                                  {workout.estimatedDurationMin && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      ~{workout.estimatedDurationMin} min
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
