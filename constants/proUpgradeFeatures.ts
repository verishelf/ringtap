/**
 * Pro marketing bullets shared by app upgrade screens, paywall modal, pricing, and web checkout.
 * Icon names are Ionicons glyph names (Expo); use only where @expo/vector-icons is available.
 */
export const PRO_UPGRADE_FEATURE_ITEMS = [
  { icon: 'link', text: 'Unlimited links on your profile' },
  {
    icon: 'color-palette-outline',
    text: 'Custom theme colors, fonts, gradients & profile shapes',
  },
  {
    icon: 'bar-chart',
    text: 'Analytics: views, clicks, NFC taps, QR scans & lead-form captures',
  },
  { icon: 'map', text: 'Networking map: nearby people, hotspots & events' },
  { icon: 'videocam', text: 'Video intro on your public profile (~20 sec)' },
  {
    icon: 'reader-outline',
    text: 'Lead capture on your ringtap.me page + optional webhook (Zapier, Make, etc.)',
  },
  {
    icon: 'alarm-outline',
    text: 'Follow-up reminders & pipeline tags on saved contacts',
  },
  {
    icon: 'business-outline',
    text: 'CRM sync (HubSpot) to push contacts into your outbound workflow',
  },
] as const;

/** Shorter lines for compact plan cards (e.g. Pricing). */
export const PRO_PLAN_FEATURE_LABELS = [
  'Unlimited links',
  'Custom colors, fonts & themes',
  'Full analytics + lead captures',
  'Map, hotspots & events',
  'Video intro on profile',
  'Lead forms & webhooks',
  'Follow-ups & pipeline tags',
  'HubSpot CRM sync',
] as const;
