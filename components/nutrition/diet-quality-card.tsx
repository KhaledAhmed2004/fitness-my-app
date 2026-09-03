import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface Props {
  score?: number; // e.g., 85 for 85% whole foods
}

export function DietQualityCard({ score = 85 }: Props) {
  // Determine color based on score (higher is better, meaning less processed)
  const isExcellent = score >= 80;
  const isGood = score >= 60 && score < 80;
  const color = isExcellent ? '#4ADE80' : isGood ? '#FBBF24' : '#F87171';
  const label = isExcellent ? 'Excellent' : isGood ? 'Fair' : 'Needs Work';
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
            <MaterialIcons name="eco" size={18} color={color} />
          </View>
          <Text style={styles.title}>Diet Quality</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>
      
      <View style={styles.scoreRow}>
        <Text style={styles.scoreValue}>{score}</Text>
        <Text style={styles.scoreUnit}>%</Text>
        <Text style={styles.scoreDesc}>Whole Foods</Text>
      </View>
      
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      
      <Text style={styles.footerText}>
        Aim for 80%+ whole foods to minimize processed ingredients.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    color: C.onSurface,
    fontSize: 32,
    fontFamily: F.sansBold,
    lineHeight: 38,
  },
  scoreUnit: {
    color: C.onSurfaceVariant,
    fontSize: 18,
    fontFamily: F.sansBold,
    marginLeft: 2,
  },
  scoreDesc: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sansMedium,
    marginLeft: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: C.background,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    lineHeight: 18,
  },
});
