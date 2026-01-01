// RunLog Import Plan Page

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Upload, Check, AlertCircle, FileJson, Copy } from 'lucide-react';
import { runningDb } from '@/lib/db/running-db';
import { useRunningStore } from '@/stores/running-store';
import type {
  ImportedRunningPlan,
  RunningPlan,
  RunningWorkout,
  WorkoutSegment,
  GoalRace,
} from '@/types/running';

interface ImportPageProps {
  params: { locale: string };
}

export default function ImportPage({ params }: ImportPageProps) {
  const { locale } = params;
  const router = useRouter();
  const t = useTranslations('runLog.import');
  const tc = useTranslations('common');
  const { setActivePlan } = useRunningStore();

  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const parseAndImportPlan = useCallback(async (json: string) => {
    setIsImporting(true);
    setError(null);

    try {
      const data: ImportedRunningPlan = JSON.parse(json);

      // Validate required fields
      if (!data.planName || !data.weeks || data.weeks.length === 0) {
        throw new Error(t('errorMissingFields'));
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
          weekNumber: 0, // Will be calculated
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
              // baseDate is the first day of the week
              // workout.dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
              const baseDayOfWeek = baseDate.getDay();
              let daysToAdd = workout.dayOfWeek - baseDayOfWeek;
              if (daysToAdd < 0) daysToAdd += 7;
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

      // Set as active
      const newPlan = await runningDb.runningPlans.get(planId);
      if (newPlan) {
        setActivePlan(newPlan);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/running`);
      }, 1500);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : t('errorParsing'));
    } finally {
      setIsImporting(false);
    }
  }, [t, locale, router, setActivePlan]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
    } catch {
      // Clipboard access denied
    }
  }, []);

  // Example JSON format
  const exampleJson = `{
  "planName": "Preparação Maratona Lisboa 2026",
  "athleteName": "Diogo",
  "startDate": "2026-01-05",
  "goals": [
    {
      "raceName": "Meia Maratona Cascais",
      "raceDate": "2026-02-01",
      "distance": "21.1km",
      "targetTime": "1:59:00",
      "targetPace": "5:41"
    },
    {
      "raceName": "Maratona Lisboa",
      "raceDate": "2026-10-10",
      "distance": "42.195km",
      "targetTime": "4:29:00",
      "targetPace": "6:24"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "dates": "05/01–11/01/2026",
      "phase": "build",
      "notes": "Bloco meia maratona",
      "workouts": [
        {
          "dayOfWeek": 3,
          "title": "Easy + Strides",
          "description": "8 km fácil (6:35–7:15) + 6×20s strides",
          "type": "strides",
          "totalDistanceKm": 8,
          "segments": [
            { "type": "easy", "description": "8 km fácil", "distanceKm": 8, "pace": { "min": "6:35", "max": "7:15" } },
            { "type": "strides", "description": "6×20s strides", "repetitions": 6, "durationMin": 0.33 }
          ],
          "whyExplanation": "Strides mantêm eficiência neuromuscular sem fadiga."
        }
      ]
    }
  ]
}`;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="text-neutral-600 mt-1">{t('description')}</p>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-green-900">{t('success')}</h2>
          <p className="text-green-700 mt-1">{t('successDescription')}</p>
        </div>
      ) : (
        <>
          {/* File Upload */}
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-700 font-medium">{t('dragDrop')}</p>
              <p className="text-neutral-500 text-sm mt-1">{t('supported')}</p>
            </label>
          </div>

          {/* Or paste */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-50 text-neutral-500">{tc('or')}</span>
            </div>
          </div>

          {/* JSON Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">{t('pasteJson')}</label>
              <button
                onClick={handlePaste}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                {t('pasteFromClipboard')}
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={t('jsonPlaceholder')}
              className="w-full h-48 px-4 py-3 border border-neutral-300 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-900 font-medium">{t('error')}</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={() => parseAndImportPlan(jsonInput)}
            disabled={!jsonInput.trim() || isImporting}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('importing')}
              </>
            ) : (
              <>
                <FileJson className="w-5 h-5" />
                {t('importButton')}
              </>
            )}
          </button>

          {/* Example Format */}
          <details className="bg-neutral-100 rounded-xl">
            <summary className="px-4 py-3 cursor-pointer font-medium text-neutral-700 hover:text-neutral-900">
              {t('exampleFormat')}
            </summary>
            <div className="px-4 pb-4">
              <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs">
                {exampleJson}
              </pre>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
