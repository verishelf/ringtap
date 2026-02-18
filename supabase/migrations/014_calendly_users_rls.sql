-- Allow users to read and delete their own calendly_users row (for isCalendlyConnected, disconnectCalendly)
CREATE POLICY "Users can read own calendly_users" ON calendly_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendly_users" ON calendly_users
  FOR DELETE USING (auth.uid() = user_id);
