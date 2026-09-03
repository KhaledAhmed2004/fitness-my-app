import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;
const AQUA = '#4FC3F7';
const LIME = '#89fe00';

type Props = {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  accent?: 'aqua' | 'lime' | 'default';
  onPress: () => void;
};

/**
 * MENTOR: Today hub glance row — one tap → domain detail. Low cognitive load.
 */
export function TodayGlanceCard({ icon, title, subtitle, accent = 'default', onPress }: Props) {
  const iconBg =
    accent === 'lime'
      ? 'rgba(137,254,0,0.16)'
      : accent === 'aqua'
        ? 'rgba(79,195,247,0.16)'
        : 'rgba(137,206,255,0.12)';
  const iconColor = accent === 'lime' ? LIME : accent === 'aqua' ? AQUA : C.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [pressed && { opacity: 0.88 }]}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={C.onSurfaceVariant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.18)',
    backgroundColor: '#1c2023',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconWrap: {
    height: 44,
    width: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: C.onSurface,
    fontSize: 17,
    fontFamily: F.sansBold,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    marginTop: 3,
  },
});
