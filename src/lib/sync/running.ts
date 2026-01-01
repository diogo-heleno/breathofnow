/**
 * RunLog Sync Module
 *
 * Sync engine for running training data between IndexedDB and Supabase
 * Follows the same pattern as ExpenseFlow sync
 */

import { createClient } from '@/lib/supabase/client';
import { runningDb } from '@/lib/db/running-db';
import type { RunningPlan, RunningWorkout, RunningSession } from '@/types/running';

// ============================================
// TYPES
// ============================================

export interface RunningSyncResult {
  success: boolean;
  pushed: {
    plans: number;
    workouts: number;
    sessions: number;
  };
  pulled: {
    plans: number;
    workouts: number;
    sessions: number;
  };
  conflicts: number;
  errors: string[];
}

export interface PushResult {
  count: number;
  errors: string[];
}

export interface PullResult {
  count: number;
  conflicts: number;
  errors: string[];
}

// ============================================
// PUSH: Local → Supabase
// ============================================

/**
 * Push running plans to Supabase
 */
export async function pushRunningPlans(
  userId: string,
  since: Date | null
): Promise<PushResult> {
  const result: PushResult = { count: 0, errors: [] };
  const supabase = createClient();

  try {
    let plans = await runningDb.getAllPlans();

    // Filter by updated date if provided
    if (since) {
      plans = plans.filter(p => p.updatedAt > since);
    }

    if (plans.length === 0) return result;

    console.log(`[RunLog Push] Found ${plans.length} plans to sync`);

    for (const plan of plans) {
      try {
        const supabaseData = {
          user_id: userId,
          local_id: plan.id?.toString(),
          plan_name: plan.name,
          version: plan.version,
          raw_json: plan.rawJson ? JSON.parse(plan.rawJson) : null,
          is_active: plan.isActive,
          athlete_name: plan.athleteName,
          goal_race: plan.goalRaces?.[0]?.name,
          goal_time: plan.goalRaces?.[0]?.targetTime,
          total_weeks: plan.totalWeeks,
          start_date: plan.startDate,
          imported_at: plan.createdAt.toISOString(),
          updated_at: plan.updatedAt.toISOString(),
        };

        // Check if exists
        const { data: existing } = await supabase
          .from('running_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('local_id', plan.id?.toString())
          .single();

        if (existing) {
          const { error } = await supabase
            .from('running_plans')
            .update(supabaseData)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('running_plans')
            .insert(supabaseData);
          if (error) throw error;
        }

        result.count++;
      } catch (error) {
        const errorMsg = `Failed to push plan ${plan.id}: ${error}`;
        console.error('[RunLog Push]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Push plans failed: ${error}`);
  }

  return result;
}

/**
 * Push running workouts to Supabase
 */
export async function pushRunningWorkouts(
  userId: string,
  since: Date | null
): Promise<PushResult> {
  const result: PushResult = { count: 0, errors: [] };
  const supabase = createClient();

  try {
    // Get active plan
    const activePlan = await runningDb.getActivePlan();
    if (!activePlan) return result;

    const workouts = await runningDb.getWorkoutsByPlan(activePlan.id!);
    if (workouts.length === 0) return result;

    console.log(`[RunLog Push] Found ${workouts.length} workouts to sync`);

    // Get server plan ID
    const { data: serverPlan } = await supabase
      .from('running_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('local_id', activePlan.id?.toString())
      .single();

    for (const workout of workouts) {
      try {
        const segments = workout.segmentsJson ? JSON.parse(workout.segmentsJson) : null;

        const supabaseData = {
          user_id: userId,
          plan_id: serverPlan?.id || null,
          local_id: workout.id?.toString(),
          local_plan_id: workout.planId.toString(),
          scheduled_date: workout.scheduledDate,
          week_number: workout.weekNumber,
          day_of_week: workout.dayOfWeek,
          workout_type: workout.type,
          title: workout.title,
          description: workout.description,
          why_explanation: workout.whyExplanation,
          distance_km: workout.totalDistanceKm,
          estimated_duration_min: workout.estimatedDurationMin,
          segments: segments,
          is_race: workout.isRace,
        };

        const { data: existing } = await supabase
          .from('running_workouts')
          .select('id')
          .eq('user_id', userId)
          .eq('local_id', workout.id?.toString())
          .single();

        if (existing) {
          const { error } = await supabase
            .from('running_workouts')
            .update(supabaseData)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('running_workouts')
            .insert(supabaseData);
          if (error) throw error;
        }

        result.count++;
      } catch (error) {
        const errorMsg = `Failed to push workout ${workout.id}: ${error}`;
        console.error('[RunLog Push]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Push workouts failed: ${error}`);
  }

  return result;
}

/**
 * Push running sessions to Supabase
 */
export async function pushRunningSessions(
  userId: string,
  since: Date | null
): Promise<PushResult> {
  const result: PushResult = { count: 0, errors: [] };
  const supabase = createClient();

  try {
    let sessions = await runningDb.getSessionHistory(100);

    // Filter completed sessions
    sessions = sessions.filter(s => s.completedAt);

    if (sessions.length === 0) return result;

    console.log(`[RunLog Push] Found ${sessions.length} sessions to sync`);

    for (const session of sessions) {
      try {
        // Get server workout ID
        const { data: serverWorkout } = await supabase
          .from('running_workouts')
          .select('id')
          .eq('user_id', userId)
          .eq('local_id', session.workoutId.toString())
          .single();

        const supabaseData = {
          user_id: userId,
          workout_id: serverWorkout?.id || null,
          local_id: session.id?.toString(),
          local_workout_id: session.workoutId.toString(),
          started_at: session.startedAt.toISOString(),
          completed_at: session.completedAt?.toISOString(),
          actual_distance_km: session.actualDistanceKm,
          actual_duration_min: session.actualDurationMin,
          actual_pace_avg: session.actualPaceAvg,
          avg_heart_rate: session.avgHeartRate,
          max_heart_rate: session.maxHeartRate,
          feeling: session.feeling,
          perceived_effort: session.perceivedEffort,
          weather: session.weather,
          temperature: session.temperature,
          notes: session.notes,
          garmin_activity_id: session.garminActivityId,
          sync_status: 'synced',
        };

        const { data: existing } = await supabase
          .from('running_sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('local_id', session.id?.toString())
          .single();

        if (existing) {
          const { error } = await supabase
            .from('running_sessions')
            .update(supabaseData)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('running_sessions')
            .insert(supabaseData);
          if (error) throw error;
        }

        result.count++;
      } catch (error) {
        const errorMsg = `Failed to push session ${session.id}: ${error}`;
        console.error('[RunLog Push]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Push sessions failed: ${error}`);
  }

  return result;
}

// ============================================
// PULL: Supabase → Local
// ============================================

/**
 * Pull running plans from Supabase
 */
export async function pullRunningPlans(
  userId: string,
  since: Date | null
): Promise<PullResult> {
  const result: PullResult = { count: 0, conflicts: 0, errors: [] };
  const supabase = createClient();

  try {
    let query = supabase
      .from('running_plans')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (since) {
      query = query.gt('updated_at', since.toISOString());
    }

    const { data: serverPlans, error } = await query;
    if (error) throw error;

    if (!serverPlans || serverPlans.length === 0) return result;

    console.log(`[RunLog Pull] Found ${serverPlans.length} plans from server`);

    for (const serverPlan of serverPlans) {
      try {
        // Check if exists locally
        let localPlan: RunningPlan | undefined;
        if (serverPlan.local_id) {
          localPlan = await runningDb.runningPlans.get(parseInt(serverPlan.local_id));
        }

        if (!localPlan) {
          // Create new local plan
          const newPlan: Omit<RunningPlan, 'id'> = {
            name: serverPlan.plan_name,
            version: serverPlan.version || '1.0',
            description: '',
            athleteName: serverPlan.athlete_name,
            startDate: serverPlan.start_date,
            endDate: '', // Calculate from total_weeks
            totalWeeks: serverPlan.total_weeks || 0,
            goalRaces: serverPlan.goal_race ? [{
              id: 'race-1',
              name: serverPlan.goal_race,
              date: '',
              distance: '',
              targetTime: serverPlan.goal_time || '',
              targetPace: '',
              weekNumber: serverPlan.total_weeks || 0,
            }] : [],
            isActive: serverPlan.is_active || false,
            currentWeek: 1,
            rawJson: JSON.stringify(serverPlan.raw_json),
            createdAt: new Date(serverPlan.imported_at),
            updatedAt: new Date(serverPlan.updated_at),
            syncId: serverPlan.id,
          };

          await runningDb.runningPlans.add(newPlan as RunningPlan);
          result.count++;
        } else {
          // Update existing
          await runningDb.runningPlans.update(localPlan.id!, {
            name: serverPlan.plan_name,
            isActive: serverPlan.is_active || false,
            updatedAt: new Date(serverPlan.updated_at),
            syncId: serverPlan.id,
          });
          result.count++;
        }
      } catch (error) {
        const errorMsg = `Failed to pull plan ${serverPlan.id}: ${error}`;
        console.error('[RunLog Pull]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Pull plans failed: ${error}`);
  }

  return result;
}

/**
 * Pull running sessions from Supabase
 */
export async function pullRunningSessions(
  userId: string,
  since: Date | null
): Promise<PullResult> {
  const result: PullResult = { count: 0, conflicts: 0, errors: [] };
  const supabase = createClient();

  try {
    let query = supabase
      .from('running_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (since) {
      query = query.gt('updated_at', since.toISOString());
    }

    const { data: serverSessions, error } = await query;
    if (error) throw error;

    if (!serverSessions || serverSessions.length === 0) return result;

    console.log(`[RunLog Pull] Found ${serverSessions.length} sessions from server`);

    for (const serverSession of serverSessions) {
      try {
        let localSession: RunningSession | undefined;
        if (serverSession.local_id) {
          localSession = await runningDb.runningSessions.get(parseInt(serverSession.local_id));
        }

        if (!localSession) {
          // Get local workout ID
          let localWorkoutId = 0;
          if (serverSession.local_workout_id) {
            localWorkoutId = parseInt(serverSession.local_workout_id);
          }

          // Get active plan
          const activePlan = await runningDb.getActivePlan();
          if (!activePlan) continue;

          const newSession: Omit<RunningSession, 'id'> = {
            planId: activePlan.id!,
            workoutId: localWorkoutId,
            workoutTitle: '',
            workoutType: 'easy',
            scheduledDate: '',
            startedAt: new Date(serverSession.started_at),
            completedAt: serverSession.completed_at ? new Date(serverSession.completed_at) : undefined,
            actualDistanceKm: serverSession.actual_distance_km,
            actualDurationMin: serverSession.actual_duration_min,
            actualPaceAvg: serverSession.actual_pace_avg,
            avgHeartRate: serverSession.avg_heart_rate,
            maxHeartRate: serverSession.max_heart_rate,
            feeling: serverSession.feeling,
            perceivedEffort: serverSession.perceived_effort,
            weather: serverSession.weather,
            temperature: serverSession.temperature,
            notes: serverSession.notes,
            garminActivityId: serverSession.garmin_activity_id,
            syncId: serverSession.id,
          };

          await runningDb.runningSessions.add(newSession as RunningSession);
          result.count++;
        } else {
          // Update existing if server is newer
          const serverUpdatedAt = new Date(serverSession.updated_at);
          if (serverUpdatedAt > (localSession.completedAt || localSession.startedAt)) {
            await runningDb.runningSessions.update(localSession.id!, {
              actualDistanceKm: serverSession.actual_distance_km,
              actualDurationMin: serverSession.actual_duration_min,
              actualPaceAvg: serverSession.actual_pace_avg,
              avgHeartRate: serverSession.avg_heart_rate,
              maxHeartRate: serverSession.max_heart_rate,
              feeling: serverSession.feeling,
              perceivedEffort: serverSession.perceived_effort,
              notes: serverSession.notes,
              syncId: serverSession.id,
            });
            result.count++;
          }
        }
      } catch (error) {
        const errorMsg = `Failed to pull session ${serverSession.id}: ${error}`;
        console.error('[RunLog Pull]', errorMsg);
        result.errors.push(errorMsg);
      }
    }
  } catch (error) {
    result.errors.push(`Pull sessions failed: ${error}`);
  }

  return result;
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

/**
 * Full sync for RunLog data
 */
export async function syncRunningData(
  userId: string,
  since: Date | null = null,
  direction: 'push' | 'pull' | 'both' = 'both'
): Promise<RunningSyncResult> {
  const result: RunningSyncResult = {
    success: false,
    pushed: { plans: 0, workouts: 0, sessions: 0 },
    pulled: { plans: 0, workouts: 0, sessions: 0 },
    conflicts: 0,
    errors: [],
  };

  try {
    // PUSH: Local → Supabase
    if (direction === 'push' || direction === 'both') {
      const pushPlans = await pushRunningPlans(userId, since);
      result.pushed.plans = pushPlans.count;
      result.errors.push(...pushPlans.errors);

      const pushWorkouts = await pushRunningWorkouts(userId, since);
      result.pushed.workouts = pushWorkouts.count;
      result.errors.push(...pushWorkouts.errors);

      const pushSessions = await pushRunningSessions(userId, since);
      result.pushed.sessions = pushSessions.count;
      result.errors.push(...pushSessions.errors);
    }

    // PULL: Supabase → Local
    if (direction === 'pull' || direction === 'both') {
      const pullPlans = await pullRunningPlans(userId, since);
      result.pulled.plans = pullPlans.count;
      result.conflicts += pullPlans.conflicts;
      result.errors.push(...pullPlans.errors);

      const pullSessions = await pullRunningSessions(userId, since);
      result.pulled.sessions = pullSessions.count;
      result.conflicts += pullSessions.conflicts;
      result.errors.push(...pullSessions.errors);
    }

    result.success = result.errors.length === 0;
    console.log('[RunLog Sync] Completed', result);

  } catch (error) {
    result.errors.push(`Sync failed: ${error}`);
    console.error('[RunLog Sync] Failed', error);
  }

  return result;
}
