export type Plan = 'free' | 'pro';

export type LinkType =
  | 'social'
  | 'website'
  | 'custom'
  | 'payment';

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'threads'
  | 'x'
  | 'cashapp'
  | 'venmo'
  | 'paypal'
  | 'zelle'
  | 'other';

export type ButtonShape = 'rounded' | 'pill' | 'square';
export type TypographyStyle = 'sans' | 'serif' | 'rounded' | 'mono' | 'orbitron' | 'raleway_dots' | 'zen_dots' | 'akronim' | 'fugaz_one' | 'rubik_glitch' | 'rubik_puddles' | 'trade_winds';

export interface ProfileTheme {
  accentColor: string;
  backgroundGradient: [string, string];
  buttonShape: ButtonShape;
  typography: TypographyStyle;
  /** Pro: border color for profile card and avatar ring (app preview + web) */
  profileBorderColor?: string;
  /** Calendly URL for scheduling (e.g. https://calendly.com/username) */
  calendlyUrl?: string;
}

export interface UserLink {
  id: string;
  userId: string;
  type: LinkType;
  title: string;
  url: string;
  platform?: SocialPlatform;
  sortOrder: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  videoIntroUrl: string | null;
  backgroundImageUrl: string | null;
  email: string;
  phone: string;
  website: string;
  theme: ProfileTheme;
  customButtons: Array<{ label: string; url: string }>;
  socialLinks: Record<SocialPlatform, string>;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  profileId: string;
  type: 'profile_view' | 'link_click' | 'nfc_tap' | 'qr_scan';
  linkId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface AnalyticsSummary {
  profileViews: number;
  linkClicks: number;
  nfcTaps: number;
  qrScans: number;
  byDay: Array<{ date: string; count: number; type: string }>;
}

export type ScannedContactSource = 'nfc' | 'qr' | 'manual';

export interface ScannedContact {
  id: string;
  userId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  source: ScannedContactSource;
  createdAt: string;
}

export const FREE_PLAN_MAX_LINKS = 2;
export const PRO_PLAN_FEATURES = ['unlimited_links', 'themes', 'analytics', 'video_intro'];
