import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  BarChart3,
  Building2,
  FileInput,
  Link2,
  Map,
  Palette,
  Sparkles,
  Video,
} from "lucide-react";

/** Maps Expo Ionicons names from `constants/proUpgradeFeatures` to Lucide for the marketing site. */
export function proMarketingLucideIcon(iconKey: string): LucideIcon {
  switch (iconKey) {
    case "link":
      return Link2;
    case "color-palette-outline":
      return Palette;
    case "bar-chart":
      return BarChart3;
    case "map":
      return Map;
    case "videocam":
      return Video;
    case "reader-outline":
      return FileInput;
    case "alarm-outline":
      return AlarmClock;
    case "business-outline":
      return Building2;
    default:
      return Sparkles;
  }
}
