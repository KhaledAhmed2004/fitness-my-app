import React, { useEffect } from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Vital } from '@/constants/vital-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const C = Vital.colors;
const F = Vital.fonts;

interface RunRingTimerProps {
  elapsedSeconds: number;
  isActive: boolean;
}

export function RunRingTimer({ elapsedSeconds, isActive }: RunRingTimerProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.7, 300);
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Pulse animation for the outer ring when active
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true
      );
    } else {
      pulse.value = withTiming(0);
    }
  }, [isActive, pulse]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeOpacity: interpolate(pulse.value, [0, 1], [0.3, 1]),
    };
  });

  // Format time HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={C.surfaceHigh}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Pulse Ring */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={C.trainingAccent}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      
      <View style={[styles.timeContainer, { width: size - 40 }]}>
        <Text style={styles.timeText} adjustsFontSizeToFit numberOfLines={1}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.label}>TIME</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  timeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: F.mono,
    fontSize: 56,
    color: C.onSurface,
    lineHeight: 64,
  },
  label: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: C.trainingAccent,
    letterSpacing: 2,
    marginTop: -4,
  }
});
