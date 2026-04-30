-- Pro: public-profile lead capture settings, submissions (written via service role from web API),
-- and follow-up / pipeline fields on saved contacts.

CREATE TABLE IF NOT EXISTS profile_lead_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  headline TEXT NOT NULL DEFAULT 'Request an intro',
  collect_company BOOLEAN NOT NULL DEFAULT true,
  collect_phone BOOLEAN NOT NULL DEFAULT false,
  collect_message BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profile_lead_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile lead settings"
  ON profile_lead_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS profile_lead_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  source_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_lead_submissions_owner ON profile_lead_submissions(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_lead_submissions_created ON profile_lead_submissions(created_at DESC);

ALTER TABLE profile_lead_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owner reads lead submissions"
  ON profile_lead_submissions FOR SELECT
  USING (auth.uid() = profile_user_id);

-- Inserts only via service role (Next.js API); no INSERT policy for authenticated clients.

ALTER TABLE user_contacts
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'none';

ALTER TABLE user_contacts DROP CONSTRAINT IF EXISTS user_contacts_pipeline_stage_check;
ALTER TABLE user_contacts ADD CONSTRAINT user_contacts_pipeline_stage_check
  CHECK (pipeline_stage IN ('none', 'lead', 'partner', 'recruit', 'other'));
