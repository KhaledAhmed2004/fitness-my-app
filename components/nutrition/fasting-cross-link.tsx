import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useActiveFast, useFastingPreference } from '@/hooks/fasting-queries';
import { computeLiveProgress, formatTimerHm } from '@/lib/fasting-format';

const C = Vital.colors;
const F = Vital.fonts;

export function FastingCrossLink() {
  const router = useRouter();
  const { data: active } = useActiveFast();
  const { data: preference } = useFastingPreference();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const live = useMemo(() => {
    if (!active) return null;
    return computeLiveProgress(active, now);
  }, [active, now]);

  const protocol = active?.protocol ?? preference?.protocol ?? '16:8';
  const label = live
    ? live.goalMet
      ? `Goal reached · ${protocol}`
      : `${formatTimerHm(live.remainingMinutes)} left · ${protocol}`
    : `Not fasting · ${protocol}`;

  return (
    <Pressable
      onPress={() => router.push(ROUTES.fasting)}
      accessibilityRole="button"
      accessibilityLabel={`Fasting. ${label}`}
      style={({ pressed }) => [pressed && { opacity: 0.88 }]}>
      <View style={styles.row}>
        <View style={[styles.icon, live?.goalMet && styles.iconDone]}>
          <MaterialIcons
            name="timer"
            size={18}
            color={live?.goalMet ? C.secondaryContainer : C.primary}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Fasting</Text>
          <Text style={styles.meta}>{label}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    height: 34,
    width: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glow,
  },
  iconDone: {
    backgroundColor: 'rgba(137,254,0,0.14)',
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
  meta: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 1,
  },
});
