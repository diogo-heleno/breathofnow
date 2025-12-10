// FitLog Dashboard Page

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fitlogDb, isFitLogDbAvailable } from '@/lib/db/fitlog-db';
import { useFitLogStore } from '@/stores/fitlog-store';
import {
  TodayWorkout,
  WeekOverview,
  QuickStats,
  RecentSessions,
  ActivePlanCard,
} from '@/components/fitlog/dashboard';
import { EmptyState } from '@/components/fitlog/common';
import type { WorkoutPlan } from '@/types/fitlog';

interface DashboardPageProps {
  params: { locale: string };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = params;
  const t = useTranslations('fitLog');
  const [isLoading, setIsLoading] = useState(true);
  const [hasPlans, setHasPlans] = useState(false);
  const { activePlanId, setActivePlan, setActivePlanId } = useFitLogStore();

  useEffect(() => {
    async function initialize() {
      if (!isFitLogDbAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        // Check for active plan
        const activePlan = await fitlogDb.getActivePlan();
        if (activePlan) {
          setActivePlan(activePlan);
          setHasPlans(true);
        } else {
          // Check if any plans exist
          const allPlans = await fitlogDb.getAllPlans();
          setHasPlans(allPlans.length > 0);
          
          // Activate first plan if exists
          if (allPlans.length > 0) {
            await fitlogDb.setActivePlan(allPlans[0].id!);
            setActivePlan(allPlans[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing FitLog:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [setActivePlan]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-48 bg-neutral-200 rounded-2xl animate-pulse" />
        <div className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
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
          {/* Link principal para o questionário - mais visível */}
          <Link
            href={`/${locale}/fitlog/create`}
            className="block w-full"
          >
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t('onboarding.createWithAI')}</h3>
                  <p className="text-white/80 text-sm">{t('onboarding.personalizedQuestionnaire')}</p>
                </div>
              </div>
              <p className="text-white/90 text-sm mb-4">
                {t('onboarding.questionnaireDescription')}
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-600 rounded-lg font-semibold text-sm">
                {t('onboarding.startQuestionnaire')}
                <Sparkles className="w-4 h-4" />
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
            href={`/${locale}/fitlog/plans/import`}
            className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-neutral-300 text-neutral-700 rounded-xl font-semibold hover:border-primary-600 hover:text-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('onboarding.haveJSON')}
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

        {/* Link adicional para o questionário quando o user já tem planos mas quer criar novo */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-neutral-900">{t('onboarding.needHelp')}</p>
              <Link
                href={`/${locale}/fitlog/create`}
                className="text-sm text-primary-600 hover:underline"
              >
                {t('onboarding.useSmartQuestionnaire')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
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
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">{t('dashboard.recentWorkouts')}</h2>
        <RecentSessions locale={locale} limit={3} />
      </div>

      {/* Active Plan */}
      <ActivePlanCard locale={locale} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${locale}/fitlog/export`}
          className="flex items-center justify-center gap-2 py-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {t('onboarding.adjustPlan')}
        </Link>
        <Link
          href={`/${locale}/fitlog/plans/import`}
          className="flex items-center justify-center gap-2 py-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('onboarding.newPlan')}
        </Link>
      </div>
    </div>
  );
}
