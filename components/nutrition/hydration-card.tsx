import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';

import { DEFAULT_HYDRATION_PRESETS, type HydrationPreset, type HydrationStatus, type WaterLogEntry } from '@/types/hydration';
import { HydrationLogsList } from './hydration-logs-list';

const C = Vital.colors;
const F = Vital.fonts;

const CUSTOM_MIN = 50;
const CUSTOM_MAX = 2000;
const CUSTOM_STEP = 50;

type Props = {
  amountMl: number;
  goalMl: number;
  remainingMl?: number;
  progressPercent?: number;
  status?: HydrationStatus;
  presets?: HydrationPreset[];
  logs?: WaterLogEntry[];
  busy?: boolean;
  onAdd: (ml: number) => void;
  onDeleteLog?: (logId: string) => void;
  onEditGoal: () => void;
};

const PRESET_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  GLASS: 'local-cafe',
  BOTTLE: 'local-drink',
  LARGE: 'water-drop',
};

function litersLabel(ml: number) {
  return (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1);
}

function statusLabel(status?: HydrationStatus) {
  if (status === 'MET') return 'Goal met';
  if (status === 'OVER') return 'Over goal';
  if (status === 'ON_TRACK') return 'On track';
  return null;
}

function clampCustom(n: number) {
  return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.round(n / CUSTOM_STEP) * CUSTOM_STEP));
}

/**
 * MENTOR: Premium hydration card — gradient ring + API presets + custom ml.
 */
export function HydrationCard({
  amountMl,
  goalMl,
  remainingMl,
  progressPercent,
  status,
  presets = DEFAULT_HYDRATION_PRESETS,
  logs = [],
  busy,
  onAdd,
  onDeleteLog,
  onEditGoal,
}: Props) {
  const insets = useSafeAreaInsets();
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState(300);

  const remaining = remainingMl ?? Math.max(goalMl - amountMl, 0);
  const overBy = Math.max(0, amountMl - goalMl);
  const isOver = status === 'OVER' || overBy > 0;
  const isMet = status === 'MET' || (remaining === 0 && !isOver);

  const pct =
    progressPercent != null
      ? Math.round(progressPercent)
      : goalMl > 0
        ? Math.round(Math.min(amountMl / goalMl, 1) * 100)
        : 0;
  const barPct = Math.min(Math.max(pct, 0), 100);
  const ratio = Math.min(pct / 100, 1);
  const badge = statusLabel(status);

  const size = 128;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  const remainCopy = isOver
    ? `Past goal by ${litersLabel(overBy)} L`
    : isMet
      ? 'Nicely hydrated today'
      : `${litersLabel(remaining)} L still to go`;

  const add = (ml: number) => {
    if (busy) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (Platform.OS === 'android') {
      Haptics.selectionAsync().catch(() => {});
    }
    onAdd(ml);
  };

  const openCustom = () => {
    if (busy) return;
    setCustomMl(300);
    setCustomOpen(true);
  };

  const confirmCustom = () => {
    const ml = clampCustom(customMl);
    setCustomOpen(false);
    add(ml);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Hydration</Text>
            {badge ? (
              <Text
                style={[
                  styles.statusBadge,
                  status === 'MET' || status === 'OVER' ? styles.statusMet : null,
                ]}>
                {badge}
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onEditGoal}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Edit water goal"
          style={styles.editBtn}>
          <MaterialIcons name="tune" size={18} color={C.primary} />
          <Text style={styles.editLabel}>Goal</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.ringWrap}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="hydrateRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={C.primary} />
                <Stop offset="100%" stopColor={C.primaryContainer} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={C.glow}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#hydrateRing)"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringValue}>{litersLabel(amountMl)}</Text>
            <Text style={styles.ringUnit}>LITERS</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={styles.pct}>{pct}%</Text>
          <Text style={styles.goalLine}>of {litersLabel(goalMl)} L goal</Text>
          <Text style={styles.remainLine}>{remainCopy}</Text>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${barPct}%` }]} />
          </View>
          <Text style={styles.mlLine}>
            {Math.round(amountMl).toLocaleString()} / {Math.round(goalMl).toLocaleString()} ml
          </Text>
        </View>
      </View>

      <View style={styles.quickHeader}>
        <Text style={styles.quickLabel}>QUICK ADD</Text>
        {logs.length > 0 && onDeleteLog && (
          <HydrationLogsList logs={logs} busy={busy} onDelete={onDeleteLog} />
        )}
      </View>
      <View style={styles.quickRow}>
        {presets.map((preset) => {
          const icon = PRESET_ICONS[preset.preset] ?? 'water-drop';
          return (
            <View key={preset.preset} style={styles.chipSlot}>
              <Pressable
                disabled={busy}
                onPress={() => add(preset.amountMl)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${preset.label}, ${preset.amountMl} milliliters`}
                style={({ pressed }) => [
                  styles.chipPressable,
                  (pressed || busy) && styles.chipPressed,
                ]}>
                <View style={styles.chipFace}>
                  <MaterialIcons name={icon} size={20} color={C.primary} />
                  <Text style={styles.chipLabel} numberOfLines={1}>
                    {preset.label}
                  </Text>
                  <Text style={styles.chipMl}>+{preset.amountMl} ml</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
        <View style={styles.chipSlot}>
          <Pressable
            disabled={busy}
            onPress={openCustom}
            accessibilityRole="button"
            accessibilityLabel="Add custom water amount"
            style={({ pressed }) => [
              styles.chipPressable,
              (pressed || busy) && styles.chipPressed,
            ]}>
            <View style={styles.chipFaceSecondary}>
              <MaterialIcons name="tune" size={20} color={C.primary} />
              <Text style={styles.chipLabelSecondary} numberOfLines={1}>
                Custom
              </Text>
            </View>
          </Pressable>
        </View>
      </View>




      <Modal visible={customOpen} animationType="slide" transparent onRequestClose={() => setCustomOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.flex} onPress={() => setCustomOpen(false)} accessibilityLabel="Dismiss" />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.sheetTitle}>Custom amount</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setCustomMl((v) => clampCustom(v - CUSTOM_STEP))}
                style={styles.stepBtn}
                accessibilityLabel="Decrease amount">
                <MaterialIcons name="remove" size={24} color={C.onSurface} />
              </Pressable>
              <View style={styles.valueBlock}>
                <Text style={styles.value}>{customMl}</Text>
                <Text style={styles.unit}>ml</Text>
              </View>
              <Pressable
                onPress={() => setCustomMl((v) => clampCustom(v + CUSTOM_STEP))}
                style={styles.stepBtn}
                accessibilityLabel="Increase amount">
                <MaterialIcons name="add" size={24} color={C.onSurface} />
              </Pressable>
            </View>
            <PrimaryButton label="Add water" onPress={confirmCustom} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    paddingTop: 18,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  quickLabel: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.4,
  },
  quickRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  statusBadge: {
    color: C.primary,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statusMet: {
    color: C.secondaryContainer,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.glassFill,
  },
  editLabel: {
    color: C.primary,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },
  ringWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    color: C.onSurface,
    fontSize: 34,
    fontFamily: F.sansExtraBold,
    letterSpacing: -1,
  },
  ringUnit: {
    color: C.primary,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  pct: {
    color: C.onSurface,
    fontSize: 28,
    fontFamily: F.sansExtraBold,
    letterSpacing: -0.6,
  },
  goalLine: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sans,
  },
  remainLine: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansSemiBold,
    marginTop: 4,
    marginBottom: 8,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: C.glassFill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: C.primaryContainer,
  },
  mlLine: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 0.4,
    marginTop: 6,
  },
  chipSlot: {
    flex: 1,
    minWidth: 0,
  },
  chipPressable: {
    width: '100%',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipFace: {
    width: '100%',
    minHeight: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: C.surfaceContainerLow,
    gap: 3,
  },
  chipFaceSecondary: {
    width: '100%',
    minHeight: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: C.primaryAlpha10,
    gap: 3,
  },
  chipLabel: {
    color: C.onSurface,
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  chipLabelSecondary: {
    color: C.primary,
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  chipMl: {
    color: C.primary,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 0.2,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  flex: { flex: 1 },
  sheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetTitle: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    marginBottom: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepBtn: {
    height: 52,
    width: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glow,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  valueBlock: {
    alignItems: 'center',
    minWidth: 120,
  },
  value: {
    color: C.onSurface,
    fontSize: 44,
    fontFamily: F.sansExtraBold,
  },
  unit: {
    color: C.primary,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },
});
