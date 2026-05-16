-- Cardio page redesign: swim-focused columns
ALTER TABLE cardio_sessions
  ADD COLUMN IF NOT EXISTS distance_miles numeric,
  ADD COLUMN IF NOT EXISTS planned_miles numeric,
  ADD COLUMN IF NOT EXISTS sleep_quality text,
  ADD COLUMN IF NOT EXISTS fuel_level text,
  ADD COLUMN IF NOT EXISTS calories integer,
  ADD COLUMN IF NOT EXISTS is_off_plan boolean NOT NULL DEFAULT false;

-- duration_minutes is no longer captured in the swim flow
ALTER TABLE cardio_sessions
  ALTER COLUMN duration_minutes DROP NOT NULL,
  ALTER COLUMN duration_minutes SET DEFAULT 0;
