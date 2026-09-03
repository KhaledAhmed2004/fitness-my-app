import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  consumed: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
  onPress: () => void;
};

export function HomeHeroCard({ consumed, target, protein, carbs, fat, onPress }: Props) {
  const percent = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="local-fire-department" size={20} color={C.primary} />
          <Text style={styles.title}>CALORIES TODAY</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
      </View>
      
      <View style={styles.caloriesRow}>
        <Text style={styles.consumedText}>{Math.round(consumed).toLocaleString()}</Text>
        <Text style={styles.targetText}>/ {Math.round(target).toLocaleString()} kcal</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
      
      <View style={styles.macrosRow}>
        <View style={styles.macroPill}>
          <View style={[styles.macroDot, { backgroundColor: '#4FC3F7' }]} />
          <Text style={styles.macroText}>{Math.round(protein)}g P</Text>
        </View>
        <View style={styles.macroPill}>
          <View style={[styles.macroDot, { backgroundColor: '#89fe00' }]} />
          <Text style={styles.macroText}>{Math.round(carbs)}g C</Text>
        </View>
        <View style={styles.macroPill}>
          <View style={[styles.macroDot, { backgroundColor: '#FFB74D' }]} />
          <Text style={styles.macroText}>{Math.round(fat)}g F</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer || C.surfaceHigh,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.primary + '20',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: F.mono,
    fontSize: 12,
    letterSpacing: 1.2,
    color: C.primary,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  consumedText: {
    fontFamily: F.sansExtraBold,
    fontSize: 40,
    color: C.onSurface,
    marginRight: 8,
    letterSpacing: -1,
  },
  targetText: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: C.surfaceLow || 'rgba(255,255,255,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 5,
  },
  percentText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: C.onSurfaceVariant,
    width: 36,
    textAlign: 'right',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceLow || 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroText: {
    fontFamily: F.sansSemiBold,
    fontSize: 13,
    color: C.onSurface,
  },
});
