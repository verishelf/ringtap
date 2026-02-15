/** Font family for profile text (web) */

type TypographyStyle = 'sans' | 'serif' | 'rounded' | 'mono' | 'orbitron' | 'raleway_dots' | 'zen_dots';

export function getProfileFontFamilyWeb(typography?: TypographyStyle | string | null): string {
  const style = (typography as TypographyStyle) ?? 'sans';
  switch (style) {
    case 'orbitron':
      return '"Orbitron", system-ui, sans-serif';
    case 'raleway_dots':
      return '"Raleway Dots", system-ui, sans-serif';
    case 'zen_dots':
      return '"Zen Dots", system-ui, sans-serif';
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
