// RunLog Dashboard Page

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Sparkles, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { runningDb, isRunningDbAvailable } from '@/lib/db/running-db';
import { useRunningStore } from '@/stores/running-store';
import {
  TodayWorkout,
  WeekOverview,
  QuickStats,
  RecentSessions,
  NextRaceCard,
} from '@/components/running/dashboard';
import { EmptyState } from '@/components/running/common';
import type {
  ImportedRunningPlan,
  RunningPlan,
  RunningWorkout,
  WorkoutSegment,
} from '@/types/running';

interface DashboardPageProps {
  params: { locale: string };
}

// Default plan path
const DEFAULT_PLAN_URL = '/plans/maratona-lisboa-2026.json';

/**
 * Import a plan from JSON data
 */
async function importPlanFromJson(json: string): Promise<RunningPlan | null> {
  try {
    const data: ImportedRunningPlan = JSON.parse(json);

    if (!data.planName || !data.weeks || data.weeks.length === 0) {
      console.error('Invalid plan format');
      return null;
    }

    // Create plan
    const plan: Omit<RunningPlan, 'id'> = {
      name: data.planName,
      athleteName: data.athleteName,
      startDate: data.startDate || data.weeks[0]?.dates?.split('–')[0]?.trim() || new Date().toISOString().split('T')[0],
      endDate: data.weeks[data.weeks.length - 1]?.dates?.split('–')[1]?.trim() || '',
      totalWeeks: data.weeks.length,
      goalRaces: (data.goals || []).map((g, i) => ({
        id: `race_${i}`,
        name: g.raceName,
        date: g.raceDate,
        distance: g.distance,
        targetTime: g.targetTime,
        targetPace: g.targetPace,
        weekNumber: 0,
      })),
      isActive: true,
      currentWeek: 0,
      rawJson: json,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Deactivate all existing plans
    const existingPlans = await runningDb.getAllPlans();
    for (const existing of existingPlans) {
      if (existing.id) {
        await runningDb.runningPlans.update(existing.id, { isActive: false });
      }
    }

    // Add plan
    const planId = await runningDb.runningPlans.add(plan as RunningPlan);

    // Add workouts
    let workoutOrder = 0;
    for (const week of data.weeks) {
      for (const workout of week.workouts) {
        // Parse date from week dates
        const weekDates = week.dates || '';
        const startDateStr = weekDates.split('–')[0]?.trim() || '';

        // Calculate actual date based on day of week
        let scheduledDate = '';
        if (startDateStr) {
          const [day, month, year] = startDateStr.split('/');
          if (day && month) {
            const baseDate = new Date(
              parseInt(year?.length === 4 ? year : `20${year || '26'}`),
              parseInt(month) - 1,
              parseInt(day)
            );
            // baseDate is the Monday of the week (or first day)
            // workout.dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
            // Calculate days to add from Monday (day 1)
            // If dayOfWeek is 0 (Sunday), we need to add 6 days from Monday
            // If dayOfWeek is 3 (Wednesday), we need to add 2 days from Monday
            const baseDayOfWeek = baseDate.getDay(); // 0=Sun, 1=Mon, etc.
            let daysToAdd = workout.dayOfWeek - baseDayOfWeek;
            if (daysToAdd < 0) daysToAdd += 7; // Handle wrap-around
            baseDate.setDate(baseDate.getDate() + daysToAdd);
            scheduledDate = baseDate.toISOString().split('T')[0];
          }
        }

        // Parse segments
        const segments: WorkoutSegment[] = (workout.segments || []).map((seg, i) => ({
          id: `seg_${i}`,
          type: seg.type,
          description: seg.description,
          distanceKm: seg.distanceKm,
          durationMinutes: seg.durationMin,
          targetPace: seg.pace ? { min: seg.pace.min, max: seg.pace.max } : undefined,
          repetitions: seg.repetitions,
          recoveryDistanceM: seg.recoveryM,
        }));

        const runningWorkout: Omit<RunningWorkout, 'id'> = {
          planId,
          workoutId: `w_${week.weekNumber}_${workout.dayOfWeek}`,
          weekNumber: week.weekNumber,
          dayOfWeek: workout.dayOfWeek,
          scheduledDate,
          type: workout.type,
          title: workout.title,
          description: workout.description,
          totalDistanceKm: workout.totalDistanceKm,
          whyExplanation: workout.whyExplanation,
          isRace: workout.isRace || false,
          raceName: workout.raceDetails?.name,
          raceTargetTime: workout.raceDetails?.targetTime,
          raceTargetPace: workout.raceDetails?.targetPace,
          weekNotes: week.notes,
          segmentsJson: JSON.stringify(segments),
          order: workoutOrder++,
        };

        await runningDb.runningWorkouts.add(runningWorkout as RunningWorkout);
      }
    }

    // Return the created plan
    return await runningDb.runningPlans.get(planId) ?? null;
  } catch (err) {
    console.error('Import error:', err);
    return null;
  }
}

/**
 * Auto-load default training plan
 */
async function loadDefaultPlan(): Promise<RunningPlan | null> {
  try {
    const response = await fetch(DEFAULT_PLAN_URL);
    if (!response.ok) {
      console.error('Failed to fetch default plan');
      return null;
    }
    const json = await response.text();
    return importPlanFromJson(json);
  } catch (err) {
    console.error('Error loading default plan:', err);
    return null;
  }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = params;
  const t = useTranslations('runLog');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [hasPlans, setHasPlans] = useState(false);
  const { setActivePlan } = useRunningStore();

  useEffect(() => {
    async function initialize() {
      if (!isRunningDbAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        // Check for active plan
        const activePlan = await runningDb.getActivePlan();
        if (activePlan) {
          setActivePlan(activePlan);
          setHasPlans(true);
        } else {
          // Check if any plans exist
          const allPlans = await runningDb.getAllPlans();

          if (allPlans.length > 0) {
            // Activate first plan if exists
            await runningDb.setActivePlan(allPlans[0].id!);
            setActivePlan(allPlans[0]);
            setHasPlans(true);
          } else {
            // No plans - auto-load default plan
            setIsLoadingDefault(true);
            const defaultPlan = await loadDefaultPlan();
            setIsLoadingDefault(false);

            if (defaultPlan) {
              setActivePlan(defaultPlan);
              setHasPlans(true);
            } else {
              setHasPlans(false);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing RunLog:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [setActivePlan]);

  if (isLoading || isLoadingDefault) {
    return (
      <div className="p-4 space-y-6">
        {isLoadingDefault ? (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              {t('dashboard.loadingPlan')}
            </h2>
            <p className="text-neutral-600">
              {t('dashboard.loadingPlanDescription')}
            </p>
          </div>
        ) : (
          <>
            <div className="h-48 bg-neutral-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (!hasPlans) {
    return (
      <div className="p-4">
        <div className="py-12">
          <EmptyState
            title={t('dashboard.welcome')}
            description={t('dashboard.welcomeDescription')}
          />
        </div>

        <div className="space-y-4 mt-8">
          {/* Link principal para importar plano */}
          <Link
            href={`/${locale}/running/import`}
            className="block w-full"
          >
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t('onboarding.importPlan')}</h3>
                  <p className="text-white/80 text-sm">{t('onboarding.importPlanDescription')}</p>
                </div>
              </div>
              <p className="text-white/90 text-sm mb-4">
                {t('onboarding.importPlanHint')}
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-600 rounded-lg font-semibold text-sm">
                {t('onboarding.startImport')}
                <Download className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-50 text-neutral-500">{t('onboarding.or')}</span>
            </div>
          </div>

          <Link
            href={`/${locale}/running/export`}
            className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-neutral-300 text-neutral-700 rounded-xl font-semibold hover:border-primary-600 hover:text-primary-600 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            {t('onboarding.generateWithAI')}
          </Link>
        </div>

        <div className="mt-8 p-4 bg-neutral-100 rounded-xl">
          <h3 className="font-semibold text-neutral-900 mb-2">{t('onboarding.howItWorks')}</h3>
          <ol className="text-sm text-neutral-600 space-y-2">
            <li className="flex gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span><strong>{t('onboarding.step1Title')}</strong> - {t('onboarding.step1Description')}</span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span><strong>{t('onboarding.step2Title')}</strong> - {t('onboarding.step2Description')}</span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span><strong>{t('onboarding.step3Title')}</strong> - {t('onboarding.step3Description')}</span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span><strong>{t('onboarding.step4Title')}</strong> - {t('onboarding.step4Description')}</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Next Race Countdown */}
      <NextRaceCard locale={locale} />

      {/* Today's Workout */}
      <TodayWorkout locale={locale} />

      {/* Week Overview */}
      <WeekOverview locale={locale} />

      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">{t('dashboard.thisWeek')}</h2>
        <QuickStats />
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">{t('dashboard.recentRuns')}</h2>
        <RecentSessions locale={locale} limit={3} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${locale}/running/export`}
          className="flex items-center justify-center gap-2 py-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {t('onboarding.adjustPlan')}
        </Link>
        <Link
          href={`/${locale}/running/plan`}
          className="flex items-center justify-center gap-2 py-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('nav.plan')}
        </Link>
      </div>
    </div>
  );
}
