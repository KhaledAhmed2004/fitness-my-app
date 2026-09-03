import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type ReactNode, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";

import { Vital } from "@/constants/vital-theme";
import { progressRatio } from "@/lib/nutrition-math";
import type { Nutrients } from "@/types/nutrition";

const C = Vital.colors;
const F = Vital.fonts;

const AnimatedLine = Animated.createAnimatedComponent(Line);

/** ViewBox for 180° semicircle */
const VB_W = 280;
const VB_H = 150;
const CX = 140;
const CY = 140;

const INNER_R = 105;
const OUTER_R = 135;
const SEGMENTS = 45;
const STROKE = 3.5;

const START_ANGLE = Math.PI;
const END_ANGLE = 0;
const TOTAL_SWEEP = START_ANGLE - END_ANGLE;
const SLOT = TOTAL_SWEEP / (SEGMENTS - 1);

const GAUGE_HEIGHT = 150;
const INACTIVE = C.surfaceHighest;
const ACTIVE = C.primaryContainer;

type Props = {
  remaining: Nutrients;
  targets: Nutrients;
  consumed: Nutrients;
  burned?: number;
  onEditTargets?: () => void;
};

function formatInt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function MacroRow({
  label,
  consumed,
  target,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
}) {
  const ratio = progressRatio(consumed, target);
  return (
    <View style={styles.macroBlock}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(consumed)}/{Math.round(target)}g
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

type SegGeom = { x1: number; y1: number; x2: number; y2: number };

function buildSegments(): SegGeom[] {
  const out: SegGeom[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = START_ANGLE - SLOT * i;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    out.push({
      x1: CX + cos * INNER_R,
      y1: CY - sin * INNER_R,
      x2: CX + cos * OUTER_R,
      y2: CY - sin * OUTER_R,
    });
  }
  return out;
}

const SEGMENT_GEOM = buildSegments();

function GaugeSegment({
  geom,
  index,
  progress,
  over,
}: {
  geom: SegGeom;
  index: number;
  progress: SharedValue<number>;
  over: boolean;
}) {
  const animatedProps = useAnimatedProps(() => {
    const filledCount = progress.value * SEGMENTS;
    const active = index < filledCount - 0.001;
    return {
      stroke: active ? (over ? C.error : ACTIVE) : INACTIVE,
    };
  });

  return (
    <AnimatedLine
      x1={geom.x1}
      y1={geom.y1}
      x2={geom.x2}
      y2={geom.y2}
      stroke={INACTIVE}
      strokeWidth={STROKE}
      strokeLinecap="round"
      animatedProps={animatedProps}
    />
  );
}

function CalorieGauge({
  remaining,
  consumed,
  target,
}: {
  remaining: number;
  consumed: number;
  target: number;
}) {
  const ratio = progressRatio(consumed, target);
  const over = consumed > target && target > 0;
  const display = over ? Math.round(consumed - target) : remaining;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(ratio, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [ratio, progress]);

  return (
    <View style={styles.gaugeContainer}>
      <View
        style={styles.gaugeWrap}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
        accessibilityLabel={
          over
            ? `${formatInt(display)} calories over goal ${formatInt(target)}`
            : `${formatInt(remaining)} calories remaining of goal ${formatInt(target)}`
        }
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {SEGMENT_GEOM.map((geom, index) => (
            <GaugeSegment
              key={index}
              geom={geom}
              index={index}
              progress={progress}
              over={over}
            />
          ))}
        </Svg>

        <View style={styles.gaugeCenter} pointerEvents="none">
          <Text style={[styles.kcalNumber, over && styles.kcalOver]}>
            {formatInt(display)}
          </Text>
          <Text style={styles.kcalLabel}>
            {over ? "calories over" : "calories remaining"}
          </Text>
        </View>
      </View>

      <View style={styles.goalPillWrap} pointerEvents="none">
        <View style={styles.goalPill}>
          <Text style={styles.goalPillText}>GOAL: {formatInt(target)}</Text>
        </View>
      </View>
    </View>
  );
}

function GlassCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function RemainingHero({
  remaining,
  targets,
  consumed,
  burned = 0,
  onEditTargets,
}: Props) {
  return (
    <GlassCard>
      <View style={styles.cardInner}>
        {onEditTargets ? (
          <Pressable
            onPress={onEditTargets}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Edit daily targets"
            style={styles.editBtn}
          >
            <MaterialIcons name="edit" size={18} color={C.primary} />
          </Pressable>
        ) : null}

        <CalorieGauge
          remaining={remaining.calories}
          consumed={consumed.calories}
          target={targets.calories}
        />

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCol, { alignItems: "flex-start" }]}>
            <Text style={styles.summaryLabel}>Eaten</Text>
            <Text style={styles.summaryValue}>
              {formatInt(consumed.calories)}
              <Text style={styles.summaryUnit}> kcal</Text>
            </Text>
          </View>
          <View style={[styles.summaryCol, { alignItems: "flex-end" }]}>
            <Text style={styles.summaryLabel}>Burned</Text>
            <Text style={styles.summaryValue}>
              {formatInt(burned)}
              <Text style={styles.summaryUnit}> kcal</Text>
            </Text>
          </View>
        </View>

        <View style={styles.macroSection}>
          <MacroRow
            label="Protein"
            consumed={consumed.proteinG}
            target={targets.proteinG}
            color={C.primary}
          />
          <MacroRow
            label="Carbs"
            consumed={consumed.carbsG}
            target={targets.carbsG}
            color={C.secondaryContainer}
          />
          <MacroRow
            label="Fat"
            consumed={consumed.fatG}
            target={targets.fatG}
            color={C.primaryContainer}
          />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: C.surfaceContainer,
  },
  cardInner: {
    position: "relative",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    backgroundColor: C.surfaceContainer,
  },
  editBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 10,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: C.surfaceHigh,
  },
  gaugeContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  gaugeWrap: {
    width: 280,
    height: GAUGE_HEIGHT,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  gaugeCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -4,
    alignItems: "center",
  },
  kcalNumber: {
    color: "#FFFFFF",
    fontSize: 46,
    fontFamily: F.sansExtraBold,
    letterSpacing: -1.5,
    textAlign: "center",
    lineHeight: 48,
  },
  kcalOver: {
    color: C.error,
  },
  kcalLabel: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sans,
    marginTop: 2,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  goalPillWrap: {
    alignItems: "center",
    marginTop: 12,
  },
  goalPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.surfaceHigh,
  },
  goalPillText: {
    color: C.onSurface,
    fontSize: 12,
    fontFamily: F.sansBold,
    letterSpacing: 1.2,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 30,
    justifyContent: "space-between",
    width: "100%",
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    color: C.onSurfaceVariant,
    fontSize: 16,
    fontFamily: F.sansMedium,
    marginBottom: 6,
  },
  summaryValue: {
    color: C.onSurface,
    fontSize: 26,
    fontFamily: F.sansBold,
    letterSpacing: -0.5,
  },
  summaryUnit: {
    color: C.onSurfaceVariant,
    fontSize: 16,
    fontFamily: F.sansMedium,
  },
  macroSection: {
    gap: 2,
  },
  macroBlock: {
    marginBottom: 14,
  },
  macroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  macroLabel: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansMedium,
  },
  macroValue: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  track: {
    height: 4,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: C.surfaceHighest,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
