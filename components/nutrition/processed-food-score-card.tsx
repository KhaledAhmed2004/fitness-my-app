import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline, Text as SvgText, G } from 'react-native-svg';

import { Vital } from '@/constants/vital-theme';
import type { ProcessedFoodScore } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Ring constants ──────────────────────────────────────────────────────────
const SIZE = 360;
const RADIUS = 65;
const STROKE_WIDTH = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CX = SIZE / 2;
const CY = SIZE / 2;

// ─── Breakdown colors ────────────────────────────────────────────────────────
const LEVEL_META = {
  WHOLE:     { label: 'Whole',     color: '#4ADE80', icon: 'eco' as const },
  LIGHT:     { label: 'Light',     color: '#A3E635', icon: 'spa' as const },
  PROCESSED: { label: 'Processed', color: '#FBBF24', icon: 'fastfood' as const },
  ULTRA:     { label: 'Ultra',     color: '#F87171', icon: 'warning' as const },
} as const;

type LevelKey = keyof typeof LEVEL_META;

function getGrade(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#4ADE80' };
  if (score >= 60) return { label: 'Good',      color: '#A3E635' };
  if (score >= 40) return { label: 'Fair',      color: '#FBBF24' };
  return             { label: 'Poor',      color: '#F87171' };
}

function getInsight(breakdown: ProcessedFoodScore['breakdown']): string {
  if (breakdown.ULTRA > 30) return 'High in ultra-processed foods. Try swapping for whole alternatives.';
  if (breakdown.PROCESSED > 40) return 'Moderate processed food intake. Add more vegetables and whole grains.';
  if (breakdown.WHOLE >= 70) return 'Excellent! Most of your calories come from whole foods. 🎉';
  return 'A good balance of whole and lightly processed foods.';
}

function AnimatedDonutSegment({ seg, progress }: { seg: any; progress: any }) {
  const segmentLength = CIRCUMFERENCE * (seg.pct / 100);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${Math.max(0, segmentLength * progress.value - 2)} ${CIRCUMFERENCE}`,
  }));

  if (seg.pct < 0.5) return null;

  return (
    <AnimatedCircle
      cx={CX}
      cy={CY}
      r={RADIUS}
      strokeWidth={STROKE_WIDTH}
      fill="none"
      strokeLinecap="butt"
      stroke={seg.color}
      animatedProps={animatedProps}
      rotation={seg.startAngle}
      origin={`${CX}, ${CY}`}
    />
  );
}

// ─── Donut Breakdown Chart ──────────────────────────────────────────────────────────
function DonutBreakdownChart({ score, breakdown }: { score: number, breakdown: ProcessedFoodScore['breakdown'] }) {
  const levels: LevelKey[] = ['WHOLE', 'LIGHT', 'PROCESSED', 'ULTRA'];
  const grade = getGrade(score);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  let cumulativePct = 0;
  const segments = levels.map(level => {
    const pct = breakdown[level] || 0; // Default to 0 to prevent NaN
    const startAngle = cumulativePct * 3.6 - 90; // Start from top
    const midAngle = startAngle + (pct * 3.6) / 2;
    cumulativePct += pct;
    return { level, pct, startAngle, midAngle, color: LEVEL_META[level].color };
  });

  return (
    <View style={styles.ringWrapper}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#2a2d30" strokeWidth={STROKE_WIDTH} fill="none" />
        
        {/* Animated Segments */}
        {segments.map(seg => (
          <AnimatedDonutSegment key={seg.level} seg={seg} progress={progress} />
        ))}

        {/* Callouts and Labels */}
        {segments.map(seg => {
          // Hide callouts for very small segments to prevent crowding
          if (seg.pct < 3) return null;
          
          const midRad = (seg.midAngle * Math.PI) / 180;
          
          // Calculate points for the callout line
          const outerR = RADIUS + STROKE_WIDTH / 2;
          const elbowR = outerR + 15;
          
          const x1 = CX + outerR * Math.cos(midRad);
          const y1 = CY + outerR * Math.sin(midRad);
          
          const x2 = CX + elbowR * Math.cos(midRad);
          const y2 = CY + elbowR * Math.sin(midRad);
          
          const isLeft = x2 < CX;
          const x3 = isLeft ? x2 - 20 : x2 + 20;
          const y3 = y2;
          
          const textX = isLeft ? x3 - 6 : x3 + 6;
          const textAnchor = isLeft ? "end" : "start";

          return (
            <G key={`label-${seg.level}`}>
              {/* Dot on the chart edge */}
              <Circle cx={x1} cy={y1} r={3} fill={seg.color} />
              
              {/* Callout Line */}
              <Polyline 
                points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} 
                fill="none" 
                stroke={seg.color} 
                strokeWidth={1} 
                opacity={0.5} 
              />
              
              {/* Percentage Text */}
              <SvgText
                x={textX}
                y={y3 - 4}
                fill="#FFFFFF"
                fontSize={13}
                fontWeight="bold"
                textAnchor={textAnchor}
                fontFamily={F.sansBold}
              >
                {seg.pct % 1 === 0 ? seg.pct : seg.pct.toFixed(1)}%
              </SvgText>

              {/* Category Label */}
              <SvgText
                x={textX}
                y={y3 + 12}
                fill="#9CA3AF"
                fontSize={10}
                textAnchor={textAnchor}
                fontFamily={F.sans}
              >
                {LEVEL_META[seg.level].label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  data?: ProcessedFoodScore | null;
}

export function ProcessedFoodScoreCard({ data }: Props) {
  const hasRealData = data && data.breakdown && Object.values(data.breakdown).some(v => v > 0);

  if (!hasRealData) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Food Quality Score</Text>
              <Text style={styles.subtitle}>Based on today&apos;s food log</Text>
            </View>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <MaterialIcons name="analytics" size={48} color={C.outlineVariant} style={{ marginBottom: 16 }} />
          <Text style={{ color: C.onSurface, fontFamily: F.sansSemiBold, fontSize: 16, marginBottom: 4 }}>
            No Score Available
          </Text>
          <Text style={{ color: C.onSurfaceVariant, fontFamily: F.sans, fontSize: 14, textAlign: 'center', maxWidth: '80%' }}>
            Log your meals today to unlock your food quality breakdown.
          </Text>
        </View>
      </View>
    );
  }

  const grade = getGrade(data.score);
  const insight = getInsight(data.breakdown);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Food Quality Score</Text>
            <Text style={styles.subtitle}>Based on today&apos;s food log</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: `${grade.color}15`, borderColor: `${grade.color}30` }]}>
          <Text style={[styles.badgeText, { color: grade.color }]}>{grade.label}</Text>
        </View>
      </View>

      {/* Ring Chart Centered */}
      <View style={styles.chartContainer}>
        <DonutBreakdownChart score={data.score} breakdown={data.breakdown} />
      </View>
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
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
    lineHeight: 20,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 0,
  },
  ringWrapper: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Skeleton
  skeletonCard: {
    gap: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: C.surfaceHigh,
    width: '100%',
  },
});
