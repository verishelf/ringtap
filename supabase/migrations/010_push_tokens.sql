-- Push tokens for Expo push notifications (new messages, etc.)
-- Run in Supabase SQL editor or via Supabase CLI

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert/delete their own tokens and update their own rows
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow updating any row to reassign token to current user (for upsert when device relogins)
CREATE POLICY "Users can reassign token to self"
  ON push_tokens FOR UPDATE
  WITH CHECK (auth.uid() = user_id);
