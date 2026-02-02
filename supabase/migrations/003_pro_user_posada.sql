-- Set user eb07448e-341f-41a3-b011-c49f4e48ddee (posadafamilyboston@gmail.com) as Pro
INSERT INTO subscriptions (user_id, plan, status, updated_at)
VALUES (
  'eb07448e-341f-41a3-b011-c49f4e48ddee'::uuid,
  'pro',
  'active',
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  plan = 'pro',
  status = 'active',
  updated_at = now();
