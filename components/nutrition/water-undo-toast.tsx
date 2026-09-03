import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  amountMl: number;
  durationMs?: number;
  busy?: boolean;
  stackCount?: number;
  onUndo: () => void;
  onDismiss: () => void;
};

/**
 * MENTOR: Undo snackbar with enter/exit motion + depleting timer bar.
 * Parent should remount via key={logId} so each add restarts the timer.
 */
export function WaterUndoToast({
  amountMl,
  durationMs = 6000,
  busy,
  stackCount = 1,
  onUndo,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(1);
  const trackWidth = useSharedValue(0);
  const [secs, setSecs] = useState(Math.ceil(durationMs / 1000));

  const finish = () => {
    onDismiss();
  };

  const exitThen = (action: () => void) => {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(20, { duration: 180 }, (done) => {
      if (done) runOnJS(action)();
    });
  };

  useEffect(() => {
    setSecs(Math.ceil(durationMs / 1000));
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 220 });
    progress.value = 1;
    progress.value = withTiming(
      0,
      { duration: durationMs, easing: Easing.linear },
      (done) => {
        if (done) {
          opacity.value = withTiming(0, { duration: 180 });
          translateY.value = withTiming(16, { duration: 180 }, (exited) => {
            if (exited) runOnJS(finish)();
          });
        }
      },
    );

    const tick = setInterval(() => {
      setSecs((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount via key resets
  }, [durationMs]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * progress.value,
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 72 }, wrapStyle]}>
      <View style={styles.toast}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="water-drop" size={18} color={C.primary} />
          </View>

          <View style={styles.copy}>
            <Text style={styles.message}>Added {amountMl} ml</Text>
            <Text style={styles.hint}>
              {stackCount > 1
                ? `Tap Undo · ${stackCount} recent`
                : 'Tap Undo to remove'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              if (busy) return;
              onUndo();
            }}
            disabled={busy}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Undo water log"
            accessibilityState={{ busy: !!busy, disabled: !!busy }}
            style={styles.undoBtn}>
            <View style={[styles.undoFace, busy && { opacity: 0.55 }]}>
              <Text style={styles.undo}>Undo</Text>
              <View style={styles.timerPill}>
                <Text style={styles.timerText}>{secs}</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => exitThen(onDismiss)}
            hitSlop={8}
            accessibilityLabel="Dismiss"
            style={styles.closeBtn}>
            <MaterialIcons name="close" size={18} color={C.outline} />
          </Pressable>
        </View>

        <View
          style={styles.track}
          onLayout={(e) => {
            trackWidth.value = e.nativeEvent.layout.width;
          }}>
          <Animated.View style={[styles.fill, barStyle]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
  },
  toast: {
    borderRadius: 20,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  iconWrap: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glow,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  hint: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 1,
  },
  undoBtn: {},
  undoFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.glow,
  },
  undo: {
    color: C.primary,
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  timerPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 6,
  },
  timerText: {
    color: C.onPrimary,
    fontSize: 11,
    fontFamily: F.mono,
  },
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 3,
    backgroundColor: C.glassFill,
  },
  fill: {
    height: '100%',
    backgroundColor: C.primaryContainer,
  },
});
