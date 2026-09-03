import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { Vital } from '@/constants/vital-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const F = Vital.fonts;

type Props = {
  mode: 'idle' | 'active';
  progressPercent: number; // 0 to 100
  elapsedMinutes: number;
  remainingMinutes: number;
  goalMet: boolean;
  protocolLabel: string;
  idleHours?: number;
  size?: number;
  centerTitle?: string;
};

// Generates an SVG path for a circular sector (pie slice) starting from top (-90deg)
function createSectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  sweepAngleDeg: number,
): string {
  'worklet';
  if (sweepAngleDeg <= 0) return '';
  const safeSweep = Math.min(359.99, Math.max(0.1, sweepAngleDeg));
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = ((startAngleDeg + safeSweep) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArcFlag = safeSweep > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

// Generates exact SVG path for an arrow hand with stem and sharp arrowhead
function createArrowPath(
  cx: number,
  cy: number,
  length: number,
  headLength: number,
  halfWidth: number,
  angleDeg: number,
): string {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const perpCos = -sin;
  const perpSin = cos;

  const baseR = length - headLength;
  const tipX = cx + length * cos;
  const tipY = cy + length * sin;

  const leftWingX = cx + baseR * cos + halfWidth * perpCos;
  const leftWingY = cy + baseR * sin + halfWidth * perpSin;

  const rightWingX = cx + baseR * cos - halfWidth * perpCos;
  const rightWingY = cy + baseR * sin - halfWidth * perpSin;

  const stemEndX = cx + (baseR + 1) * cos;
  const stemEndY = cy + (baseR + 1) * sin;

  // Stem + Filled Arrowhead Polygon
  return `M ${cx} ${cy} L ${stemEndX} ${stemEndY} M ${tipX} ${tipY} L ${leftWingX} ${leftWingY} L ${stemEndX} ${stemEndY} L ${rightWingX} ${rightWingY} Z`;
}

// Generates exact SVG path for a sweeping second hand with counterweight tail
function createSecondHandPath(
  cx: number,
  cy: number,
  length: number,
  tailLength: number,
  angleDeg: number,
): string {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const tipX = cx + length * cos;
  const tipY = cy + length * sin;

  const tailX = cx - tailLength * cos;
  const tailY = cy - tailLength * sin;

  return `M ${tailX} ${tailY} L ${tipX} ${tipY}`;
}

// Formats minutes into clean stopwatch display: e.g. "45 Min" or "14h 25m"
export function formatStopwatchTime(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) {
    return `${m} Min`;
  }
  const hrs = Math.floor(m / 60);
  const remMin = m % 60;
  if (remMin === 0) {
    return `${hrs}h`;
  }
  return `${hrs}h ${remMin}m`;
}

export function FastingStopwatchDial({
  mode,
  progressPercent,
  elapsedMinutes,
  remainingMinutes,
  goalMet,
  protocolLabel,
  idleHours = 16,
  size = 194,
  centerTitle,
}: Props) {
  const idle = mode === 'idle';

  // Proportions
  const crownHeight = 18;
  const canvasWidth = size;
  const canvasHeight = size + crownHeight;

  const dialDiameter = size - 14;
  const dialRadius = dialDiameter / 2;
  const cx = canvasWidth / 2;
  const cy = dialRadius + crownHeight + 2; // Center of the circular clock face
  const innerRadius = dialRadius - 6; // Tick placement radius

  // Calculate sweep angle (0° to 360°)
  // For active mode: progressPercent (0% -> 0deg, 100% -> 360deg)
  // For idle mode: ratio of protocol hours (e.g. 16h / 24h = 240deg)
  const targetSweepDeg = useMemo(() => {
    if (idle) {
      const h = Math.min(24, Math.max(1, idleHours));
      return (h / 24) * 360;
    }
    const safeP = Math.min(100, Math.max(0, progressPercent));
    return (safeP / 100) * 360;
  }, [idle, idleHours, progressPercent]);

  // Main Sweep & Minute/Progress Hand Reanimated shared value
  const animatedSweep = useSharedValue(0);

  // Second Hand (Continuous smooth 60s mechanical sweep)
  const secondHandAngle = useSharedValue(0);

  useEffect(() => {
    animatedSweep.value = withTiming(targetSweepDeg, {
      duration: 850,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetSweepDeg, animatedSweep]);

  useEffect(() => {
    // Continuous 60-second mechanical sweep around the 60 ticks
    secondHandAngle.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [secondHandAngle]);

  // Animated props for the green sector
  const animatedSectorProps = useAnimatedProps(() => {
    'worklet';
    const d = createSectorPath(cx, cy, innerRadius - 0.5, -90, animatedSweep.value);
    return { d };
  });

  // Needle dimensions
  const needleLength = innerRadius - 3;
  const arrowHeadLength = 11;
  const arrowHalfWidth = 4.5;
  const secondNeedleLength = innerRadius - 2;
  const secondTailLength = 10;

  // Animated props for the Moving Target / Minute Needle (Pure SVG Path math, 100% robust)
  const animatedTargetArrowProps = useAnimatedProps(() => {
    'worklet';
    const angle = -90 + animatedSweep.value;
    const d = createArrowPath(cx, cy, needleLength, arrowHeadLength, arrowHalfWidth, angle);
    return { d };
  });

  // Animated props for the Mechanical Sweeping Second Hand
  const animatedSecondHandProps = useAnimatedProps(() => {
    'worklet';
    const angle = -90 + secondHandAngle.value;
    const d = createSecondHandPath(cx, cy, secondNeedleLength, secondTailLength, angle);
    return { d };
  });

  // Animated props for the Second Hand Counterweight Dot
  const animatedSecondDotProps = useAnimatedProps(() => {
    'worklet';
    const angle = -90 + secondHandAngle.value;
    const rad = (angle * Math.PI) / 180;
    return {
      cx: cx - 7 * Math.cos(rad),
      cy: cy - 7 * Math.sin(rad),
    };
  });

  // Static Start Arrow Path at 12 o'clock (-90deg)
  const startArrowPath = useMemo(() => {
    return createArrowPath(cx, cy, needleLength, arrowHeadLength, arrowHalfWidth, -90);
  }, [cx, cy, needleLength, arrowHeadLength, arrowHalfWidth]);

  // Generate 60 tick marks around the clock perimeter
  const ticks = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i++) {
      const isMajor = i % 5 === 0;
      const angleDeg = i * 6 - 90; // 0 is top at -90deg
      const angleRad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      const tickLength = isMajor ? 7.5 : 3.5;
      const rOuter = innerRadius - 2;
      const rInner = rOuter - tickLength;

      const x1 = cx + rInner * cos;
      const y1 = cy + rInner * sin;
      const x2 = cx + rOuter * cos;
      const y2 = cy + rOuter * sin;

      list.push({
        key: `tick-${i}`,
        x1,
        y1,
        x2,
        y2,
        isMajor,
      });
    }
    return list;
  }, [cx, cy, innerRadius]);

  // Vibrant neon green matching the user reference
  const handAccent = goalMet ? '#89fe00' : '#4ade80';
  const secondHandColor = '#ff6b6b'; // Sport crimson second hand (crisp & clearly visible!)

  // Display text: single clean line matching the reference image ("45 Min" or "16h")
  const primaryDisplay = centerTitle ?? (idle
    ? `${idleHours}h`
    : goalMet
      ? formatStopwatchTime(elapsedMinutes)
      : formatStopwatchTime(elapsedMinutes > 0 ? elapsedMinutes : remainingMinutes));

  return (
    <View style={[styles.container, { width: canvasWidth, height: canvasHeight }]}>
      <Svg width={canvasWidth} height={canvasHeight}>
        <Defs>
          {/* Bezel Ring Gradient */}
          <LinearGradient id="bezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2c3339" />
            <Stop offset="50%" stopColor="#181d21" />
            <Stop offset="100%" stopColor="#101416" />
          </LinearGradient>

          {/* Shaded Green Sector Gradient */}
          <LinearGradient id="greenSectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#244d32" />
            <Stop offset="100%" stopColor="#1a3b25" />
          </LinearGradient>

          {/* Top Hardware Crown Gradient */}
          <LinearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#353e46" />
            <Stop offset="50%" stopColor="#4c5863" />
            <Stop offset="100%" stopColor="#293037" />
          </LinearGradient>
        </Defs>

        {/* 1. TOP HARDWARE: Stopwatch Pusher / Crown */}
        {/* Crown Neck */}
        <Rect
          x={cx - 4}
          y={cy - dialRadius - 10}
          width={8}
          height={11}
          rx={1.5}
          fill="url(#crownGrad)"
        />
        {/* Crown Cap Button */}
        <Rect
          x={cx - 12}
          y={cy - dialRadius - 16}
          width={24}
          height={7}
          rx={2.5}
          fill="url(#crownGrad)"
          stroke="#181d21"
          strokeWidth={0.8}
        />
        {/* Left Angled Pusher */}
        <Rect
          x={cx - dialRadius * 0.72 - 5}
          y={cy - dialRadius * 0.72 - 6}
          width={9}
          height={5.5}
          rx={1.5}
          transform={`rotate(-40, ${cx - dialRadius * 0.72}, ${cy - dialRadius * 0.72})`}
          fill="#313a42"
        />
        {/* Right Angled Pusher */}
        <Rect
          x={cx + dialRadius * 0.72 - 4}
          y={cy - dialRadius * 0.72 - 6}
          width={9}
          height={5.5}
          rx={1.5}
          transform={`rotate(40, ${cx + dialRadius * 0.72}, ${cy - dialRadius * 0.72})`}
          fill="#313a42"
        />

        {/* 2. WATCH CASING & BEZEL */}
        {/* Outer Bezel Rim */}
        <Circle
          cx={cx}
          cy={cy}
          r={dialRadius}
          fill="url(#bezelGrad)"
          stroke="#2d353b"
          strokeWidth={1.8}
        />
        {/* Inner Dial Face Base (Pitch Dark Matte Black) */}
        <Circle
          cx={cx}
          cy={cy}
          r={innerRadius}
          fill="#0c100e"
        />

        {/* 3. DYNAMIC SHADED GREEN SECTOR (The Pie Arc) */}
        <AnimatedPath
          animatedProps={animatedSectorProps}
          fill="url(#greenSectorGrad)"
        />

        {/* 4. CLOCK FACE TICK MARKS (60 Ticks) */}
        {ticks.map((t) => (
          <Line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isMajor ? '#f8fafc' : 'rgba(255, 255, 255, 0.35)'}
            strokeWidth={t.isMajor ? 2 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* 5. START / 12 O'CLOCK ARROW HAND (Static Path, Top Index) */}
        <Path
          d={startArrowPath}
          fill={handAccent}
          stroke={handAccent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 6. TARGET / PROGRESS ARROW HAND (Dynamic Animated SVG Path - 100% Robust!) */}
        <AnimatedPath
          animatedProps={animatedTargetArrowProps}
          fill={handAccent}
          stroke={handAccent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 7. LIVE MECHANICAL SECOND HAND (Sweeping Needle) */}
        <AnimatedPath
          animatedProps={animatedSecondHandProps}
          stroke={secondHandColor}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        {/* Second Hand Counterbalance Dot */}
        <AnimatedCircle
          animatedProps={animatedSecondDotProps}
          r={2.2}
          fill={secondHandColor}
        />

        {/* 8. CENTER PIVOT CAP (Solid White Circular Cap matching reference) */}
        <Circle
          cx={cx}
          cy={cy}
          r={5.5}
          fill="#ffffff"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={1.5}
          fill="#cbd5e1"
        />
      </Svg>

      {/* 9. CENTER TYPOGRAPHY DISPLAY (Smooth Animated Fade & Comfortable Placement) */}
      <View
        pointerEvents="none"
        style={[
          styles.centerTextOverlay,
          {
            top: cy + 22,
            left: 0,
            right: 0,
          },
        ]}>
        <Animated.Text
          key={primaryDisplay}
          entering={FadeIn.duration(300)}
          numberOfLines={1}
          style={[
            styles.timeText,
            goalMet && styles.goalMetText,
          ]}>
          {primaryDisplay}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 21,
    fontFamily: F.sansExtraBold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  goalMetText: {
    color: '#89fe00',
  },
});
