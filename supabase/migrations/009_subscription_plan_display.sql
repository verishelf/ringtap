-- Allow Pro badge display: authenticated users can read subscription plan for any user.
CREATE POLICY "Authenticated can read plan for display"
  ON subscriptions FOR SELECT TO authenticated
  USING (true);
