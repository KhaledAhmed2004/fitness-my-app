import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'defaultSemiBold' | 'subtitle' | 'link';
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const color = themeColor ? theme[themeColor] : (lightColor || darkColor ? (darkColor || lightColor) : theme.text);

  return (
    <Text
      style={[
        { color },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  link: {
    lineHeight: 24,
    fontSize: 14,
    color: '#3C87F7',
  },
});
