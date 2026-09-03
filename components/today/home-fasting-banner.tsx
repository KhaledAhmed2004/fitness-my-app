import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';
import { formatDurationMinutes, formatTimerHm } from '@/lib/fasting-format';

const C = Vital.colors;
const F = Vital.fonts;
const AQUA = '#4FC3F7';
const LIME = '#89fe00';

type Props = {
  goalMet: boolean;
  elapsedMinutes: number;
  remainingMinutes: number;
  protocol: string;
  onPress: () => void;
};

export function HomeFastingBanner({ goalMet, elapsedMinutes, remainingMinutes, protocol, onPress }: Props) {
  const accent = goalMet ? LIME : AQUA;
  
  // Calculate percentage (max 100%)
  const totalMinutes = elapsedMinutes + (remainingMinutes > 0 ? remainingMinutes : 0);
  const percent = totalMinutes > 0 ? Math.min(100, Math.round((elapsedMinutes / totalMinutes) * 100)) : 0;
  
  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialIcons name="timer" size={18} color={accent} />
          <Text style={styles.title}>FASTING • {protocol}</Text>
        </View>
        <Text style={[styles.statusText, { color: accent }]}>
          {goalMet ? 'Goal Reached' : 'In Progress'}
        </Text>
      </View>
      
      <View style={styles.timeRow}>
        <Text style={styles.mainTime}>
          {goalMet ? formatDurationMinutes(elapsedMinutes) : formatTimerHm(remainingMinutes)}
        </Text>
        <Text style={styles.subTime}>
          {goalMet ? 'total elapsed' : 'remaining'}
        </Text>
      </View>
      
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: accent }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
  },
  statusText: {
    fontFamily: F.sansBold,
    fontSize: 13,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  mainTime: {
    fontFamily: F.sansExtraBold,
    fontSize: 32,
    color: C.onSurface,
  },
  subTime: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  progressTrack: {
    height: 6,
    backgroundColor: C.surfaceHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  }
});
