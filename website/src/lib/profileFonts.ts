/** Font family for profile text (web) */

type TypographyStyle = 'sans' | 'serif' | 'rounded' | 'mono' | 'orbitron' | 'raleway_dots' | 'zen_dots' | 'akronim' | 'fugaz_one' | 'rubik_glitch' | 'rubik_puddles' | 'trade_winds';

/** Extra styles for dots fonts — bolder and whiter for visibility */
export function getDotsFontEnhancementWeb(typography?: TypographyStyle | string | null): Record<string, string | number> | null {
  if (typography !== 'raleway_dots' && typography !== 'zen_dots') return null;
  return {
    color: '#FFFFFF',
    textShadow: '0 0 1px rgba(255,255,255,0.95), 0 0 2px rgba(255,255,255,0.8), 0 0 3px rgba(255,255,255,0.6)',
    fontWeight: 600,
  };
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
