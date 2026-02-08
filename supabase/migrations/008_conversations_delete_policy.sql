-- Allow participants to delete their conversation (messages cascade)
CREATE POLICY "Participants can delete conversation"
  ON conversations FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
