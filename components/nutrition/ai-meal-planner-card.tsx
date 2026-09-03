import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

export function AIMealPlannerCard({ onPress }: { onPress: () => void }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="AI Meal Planner"
      style={({ pressed }) => [pressed && { opacity: 0.88 }]}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <MaterialIcons
            name="auto-awesome"
            size={18}
            color={C.primary}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>AI Meal Planner</Text>
          <Text style={styles.meta}>Get personalized meal suggestions</Text>
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
