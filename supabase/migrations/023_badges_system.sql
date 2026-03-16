-- Badges system: reward users for engagement and coming back

-- Badge definitions (static, seeded)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  color TEXT NOT NULL DEFAULT '#0a7ea4',
  category TEXT NOT NULL DEFAULT 'engagement',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_badges_slug ON badges(slug);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);

-- User-earned badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Track app opens for streak / comeback badges (one row per user per calendar day)
CREATE TABLE IF NOT EXISTS user_app_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
  UNIQUE(user_id, opened_at)
);

CREATE INDEX IF NOT EXISTS idx_user_app_opens_user_id ON user_app_opens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_opens_opened_at ON user_app_opens(opened_at);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_opens ENABLE ROW LEVEL SECURITY;

-- Badges: public read
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT USING (true);

-- User badges: user can read own; service can insert
CREATE POLICY "Users can read own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- App opens: user can insert/read own (for recording and streak calculation)
CREATE POLICY "Users can manage own app opens" ON user_app_opens FOR ALL USING (auth.uid() = user_id);

-- Seed badge definitions
INSERT INTO badges (slug, name, description, icon, color, category, sort_order) VALUES
  ('early_bird', 'Early Bird', 'Open the app 3 days in a row', 'sunrise', '#F59E0B', 'engagement', 1),
  ('week_warrior', 'Week Warrior', 'Open the app 7 days in a row', 'flame', '#EF4444', 'engagement', 2),
  ('streak_master', 'Streak Master', 'Open the app 14 days in a row', 'zap', '#8B5CF6', 'engagement', 3),
  ('monthly_legend', 'Monthly Legend', 'Open the app 30 days in a row', 'crown', '#D4AF37', 'engagement', 4),
  ('comeback_king', 'Comeback King', 'Return to the app after 7+ days away', 'refresh', '#10B981', 'engagement', 5),
  ('first_tap', 'First Tap', 'Share your profile with NFC or QR for the first time', 'radio', '#0EA5E9', 'sharing', 10),
  ('tap_enthusiast', 'Tap Enthusiast', 'Get 5 taps or scans in one week', 'trending-up', '#EC4899', 'sharing', 11),
  ('first_contact', 'First Contact', 'Save your first contact', 'person-add', '#6366F1', 'networking', 20),
  ('networker', 'Networker', 'Save 10 contacts', 'people', '#14B8A6', 'networking', 21),
  ('super_connector', 'Super Connector', 'Save 50 contacts', 'globe', '#F97316', 'networking', 22),
  ('profile_starter', 'Profile Starter', 'Add your first link', 'link', '#3B82F6', 'profile', 30),
  ('link_pro', 'Link Pro', 'Add 5 links to your profile', 'layers', '#A855F7', 'profile', 31),
  ('profile_views_100', 'Century Club', 'Reach 100 profile views', 'eye', '#06B6D4', 'sharing', 12),
  ('profile_views_1000', 'Viral', 'Reach 1,000 profile views', 'star', '#EAB308', 'sharing', 13)
ON CONFLICT (slug) DO NOTHING;
