/** Font family for profile text (web) */

type TypographyStyle = 'sans' | 'serif' | 'rounded' | 'mono' | 'orbitron' | 'raleway_dots' | 'zen_dots' | 'akronim' | 'fugaz_one' | 'rubik_glitch' | 'rubik_puddles' | 'trade_winds';

/** Extra styles for dots fonts — disabled; dots fonts use normal theme colors */
export function getDotsFontEnhancementWeb(_typography?: TypographyStyle | string | null): Record<string, string | number> | null {
  return null;
}

export function getProfileFontFamilyWeb(typography?: TypographyStyle | string | null): string {
  const style = (typography as TypographyStyle) ?? 'sans';
  switch (style) {
    case 'orbitron':
      return '"Orbitron", system-ui, sans-serif';
    case 'raleway_dots':
      return '"Raleway Dots", system-ui, sans-serif';
    case 'zen_dots':
      return '"Zen Dots", system-ui, sans-serif';
    case 'akronim':
      return '"Akronim", system-ui, sans-serif';
    case 'fugaz_one':
      return '"Fugaz One", system-ui, sans-serif';
    case 'rubik_glitch':
      return '"Rubik Glitch", system-ui, sans-serif';
    case 'rubik_puddles':
      return '"Rubik Puddles", system-ui, sans-serif';
    case 'trade_winds':
      return '"Trade Winds", system-ui, sans-serif';
    case 'serif':
      return "Georgia, 'Times New Roman', serif";
    case 'mono':
      return "ui-monospace, 'Cascadia Code', Menlo, monospace";
    case 'rounded':
      return '"Space Grotesk", system-ui, sans-serif';
    default:
      return '"Space Grotesk", system-ui, sans-serif';
  }
}
