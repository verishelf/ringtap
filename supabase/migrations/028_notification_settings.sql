-- Per-user notification toggles (enforced in Edge Functions when sending push)

CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_messages BOOLEAN NOT NULL DEFAULT true,
  new_contacts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification settings"
  ON notification_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
