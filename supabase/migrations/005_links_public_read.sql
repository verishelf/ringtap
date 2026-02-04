-- Allow public read of links so ringtap.me/[username] can show profile + links with anon key
CREATE POLICY "Public can read links" ON links FOR SELECT USING (true);
