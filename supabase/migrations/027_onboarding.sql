-- Onboarding questionnaire completion + answers (app welcome flow)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;

-- Existing users: treat as already onboarded so they skip the new flow
UPDATE profiles
SET onboarding_completed_at = COALESCE(onboarding_completed_at, now())
WHERE onboarding_completed_at IS NULL;
