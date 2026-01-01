-- RunLog - Running Training App Tables
-- Migration for Supabase cloud sync

-- ============================================
-- 1. RUNNING PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.running_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT,
  plan_name TEXT NOT NULL,
  version TEXT,
  raw_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  athlete_name TEXT,
  goal_race TEXT,
  goal_time TEXT,
  total_weeks INTEGER,
  start_date DATE,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for running_plans
CREATE INDEX IF NOT EXISTS idx_running_plans_user_id ON public.running_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_running_plans_is_active ON public.running_plans(user_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_running_plans_user_local ON public.running_plans(user_id, local_id) WHERE local_id IS NOT NULL;

-- Enable RLS for running_plans
ALTER TABLE public.running_plans ENABLE ROW LEVEL SECURITY;

-- Policies for running_plans
CREATE POLICY "Users can view their own running plans"
  ON public.running_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own running plans"
  ON public.running_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own running plans"
  ON public.running_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own running plans"
  ON public.running_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 2. RUNNING WORKOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.running_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.running_plans(id) ON DELETE CASCADE,
  local_id TEXT,
  local_plan_id TEXT,
  scheduled_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  workout_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  why_explanation TEXT,
  phase TEXT,
  distance_km DECIMAL(5,2),
  estimated_duration_min INTEGER,
  target_pace_min TEXT,
  target_pace_max TEXT,
  segments JSONB,
  notes TEXT,
  is_race BOOLEAN DEFAULT FALSE,
  is_optional BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for running_workouts
CREATE INDEX IF NOT EXISTS idx_running_workouts_user_id ON public.running_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_running_workouts_plan_id ON public.running_workouts(plan_id);
CREATE INDEX IF NOT EXISTS idx_running_workouts_date ON public.running_workouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_running_workouts_week ON public.running_workouts(user_id, week_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_running_workouts_user_local ON public.running_workouts(user_id, local_id) WHERE local_id IS NOT NULL;

-- Enable RLS for running_workouts
ALTER TABLE public.running_workouts ENABLE ROW LEVEL SECURITY;

-- Policies for running_workouts
CREATE POLICY "Users can view their own running workouts"
  ON public.running_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own running workouts"
  ON public.running_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own running workouts"
  ON public.running_workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own running workouts"
  ON public.running_workouts FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 3. RUNNING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.running_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.running_workouts(id) ON DELETE SET NULL,
  local_id TEXT,
  local_workout_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  planned_distance_km DECIMAL(5,2),
  planned_duration_min INTEGER,
  actual_distance_km DECIMAL(5,2),
  actual_duration_min INTEGER,
  actual_pace_avg TEXT,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  feeling INTEGER,
  perceived_effort INTEGER,
  weather TEXT,
  temperature INTEGER,
  notes TEXT,
  garmin_activity_id TEXT,
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for running_sessions
CREATE INDEX IF NOT EXISTS idx_running_sessions_user_id ON public.running_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_running_sessions_workout_id ON public.running_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_running_sessions_started_at ON public.running_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_running_sessions_garmin ON public.running_sessions(garmin_activity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_running_sessions_user_local ON public.running_sessions(user_id, local_id) WHERE local_id IS NOT NULL;

-- Enable RLS for running_sessions
ALTER TABLE public.running_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for running_sessions
CREATE POLICY "Users can view their own running sessions"
  ON public.running_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own running sessions"
  ON public.running_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own running sessions"
  ON public.running_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own running sessions"
  ON public.running_sessions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 4. RUNNING PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.running_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  distance_unit TEXT DEFAULT 'km',
  pace_format TEXT DEFAULT 'min/km',
  hr_zone1_max INTEGER,
  hr_zone2_max INTEGER,
  hr_zone3_max INTEGER,
  hr_zone4_max INTEGER,
  hr_zone5_max INTEGER,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_time TEXT,
  garmin_connected BOOLEAN DEFAULT FALSE,
  show_why_explanations BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for running_preferences
ALTER TABLE public.running_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for running_preferences
CREATE POLICY "Users can view their own running preferences"
  ON public.running_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own running preferences"
  ON public.running_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own running preferences"
  ON public.running_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 5. GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.running_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.running_workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.running_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.running_preferences TO authenticated;


-- ============================================
-- 6. TRIGGER FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_running_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER running_plans_updated_at
  BEFORE UPDATE ON public.running_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_running_updated_at();

CREATE TRIGGER running_workouts_updated_at
  BEFORE UPDATE ON public.running_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_running_updated_at();

CREATE TRIGGER running_sessions_updated_at
  BEFORE UPDATE ON public.running_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_running_updated_at();

CREATE TRIGGER running_preferences_updated_at
  BEFORE UPDATE ON public.running_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_running_updated_at();
