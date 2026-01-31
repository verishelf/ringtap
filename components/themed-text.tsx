import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'heading';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tint = useThemeColor({}, 'tint');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'heading' ? styles.heading : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: tint }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
  },
  heading: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    fontFamily: FontFamily.body,
    lineHeight: 30,
    fontSize: 16,
  },
});
