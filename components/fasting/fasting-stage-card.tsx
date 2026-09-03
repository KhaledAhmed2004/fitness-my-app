import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Vital } from '@/constants/vital-theme';
import { formatDurationMinutes } from '@/lib/fasting-format';

const C = Vital.colors;
const F = Vital.fonts;

export interface FastingStage {
  stageNumber: number;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  startHour: number;
  endHour: number;
  description: string;
}

export const FASTING_STAGES: FastingStage[] = [
  {
    stageNumber: 1,
    title: 'Blood Sugar Reset',
    subtitle: '0h – 4h',
    icon: 'water-drop',
    color: '#89ceff',
    startHour: 0,
    endHour: 4,
    description: 'Insulin levels begin to drop, digestion slows, and blood glucose stabilizes.',
  },
  {
    stageNumber: 2,
    title: 'Digestive Rest',
    subtitle: '4h – 8h',
    icon: 'spa',
    color: '#A78BFA',
    startHour: 4,
    endHour: 8,
    description: 'Gastrointestinal tract is at rest. Liver starts utilizing stored glycogen for baseline energy.',
  },
  {
    stageNumber: 3,
    title: 'Fat Burning Zone',
    subtitle: '8h – 12h',
    icon: 'local-fire-department',
    color: '#FF9F43',
    startHour: 8,
    endHour: 12,
    description: 'Glycogen is depleted. Your body switches to burning stored triglycerides for cellular fuel.',
  },
  {
    stageNumber: 4,
    title: 'Ketosis & Focus',
    subtitle: '12h – 16h',
    icon: 'bolt',
    color: '#89fe00',
    startHour: 12,
    endHour: 16,
    description: 'Ketone production accelerates, supporting mental clarity and deep cellular fat oxidation.',
  },
  {
    stageNumber: 5,
    title: 'Autophagy & Renewal',
    subtitle: '16h+',
    icon: 'autorenew',
    color: '#38EF7D',
    startHour: 16,
    endHour: 72,
    description: 'Deep cellular rejuvenation. Old and damaged cellular components are recycled.',
  },
];

export function getFastingStage(elapsedMinutes: number): {
  currentStage: FastingStage;
  nextStage: FastingStage | null;
  minutesToNext: number;
  stageProgress: number;
} {
  const hours = Math.max(0, elapsedMinutes / 60);

  let currentStage = FASTING_STAGES[0];
  let nextStage: FastingStage | null = FASTING_STAGES[1];

  for (let i = 0; i < FASTING_STAGES.length; i++) {
    const stage = FASTING_STAGES[i];
    if (hours >= stage.startHour && (hours < stage.endHour || i === FASTING_STAGES.length - 1)) {
      currentStage = stage;
      nextStage = i < FASTING_STAGES.length - 1 ? FASTING_STAGES[i + 1] : null;
      break;
    }
  }

  const stageDurationMinutes = (currentStage.endHour - currentStage.startHour) * 60;
  const elapsedInStage = elapsedMinutes - currentStage.startHour * 60;
  const stageProgress = stageDurationMinutes > 0
    ? Math.min(1, Math.max(0, elapsedInStage / stageDurationMinutes))
    : 1;

  const minutesToNext = nextStage
    ? Math.max(0, Math.round(nextStage.startHour * 60 - elapsedMinutes))
    : 0;

  return { currentStage, nextStage, minutesToNext, stageProgress };
}

type Props = {
  elapsedMinutes: number;
};

export function FastingStageCard({ elapsedMinutes }: Props) {
  const { currentStage, nextStage, minutesToNext, stageProgress } = getFastingStage(elapsedMinutes);

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(80)}
      style={styles.card}
      accessibilityLabel={`Current fasting biological stage: ${currentStage.title}, ${currentStage.description}`}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { borderColor: currentStage.color + '40', backgroundColor: currentStage.color + '15' }]}>
          <MaterialIcons name={currentStage.icon} size={14} color={currentStage.color} />
          <Text style={[styles.badgeText, { color: currentStage.color }]}>
            STAGE {currentStage.stageNumber} OF 5 · {currentStage.subtitle}
          </Text>
        </View>

        {nextStage && minutesToNext > 0 ? (
          <Text style={styles.nextText}>
            Next in {formatDurationMinutes(minutesToNext)}
          </Text>
        ) : (
          <Text style={[styles.nextText, { color: C.secondaryContainer }]}>
            Maximum Phase ✨
          </Text>
        )}
      </View>

      {/* Title & Description */}
      <Text style={styles.title}>{currentStage.title}</Text>
      <Text style={styles.description}>{currentStage.description}</Text>

      {/* Stage Micro Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(stageProgress * 100)}%`,
              backgroundColor: currentStage.color,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    letterSpacing: 0.5,
  },
  nextText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  title: {
    fontSize: 16,
    fontFamily: F.sansBold,
    color: C.onSurface,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    lineHeight: 19,
  },
  progressTrack: {
    height: 4,
    backgroundColor: C.surfaceHigh,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
