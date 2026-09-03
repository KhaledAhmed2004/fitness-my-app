import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const PRESETS = [2, 2.5, 3, 3.5, 4] as const;
const STEP = 0.5;
const MIN = 0.5;
const MAX = 20;

type Props = {
  visible: boolean;
  goalLiters: number;
  goalLoading?: boolean;
  onClose: () => void;
  onSave: (liters: number) => Promise<void>;
};

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, Math.round(n * 10) / 10));
}

export function EditHydrationGoalModal({
  visible,
  goalLiters,
  goalLoading,
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(goalLiters);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValue(clamp(goalLiters));
    setError(null);
  }, [visible, goalLiters]);

  const bump = (delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setValue((v) => clamp(v + delta));
  };

  const pick = (liters: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setValue(liters);
  };

  const handleSave = async () => {
    if (goalLoading || saving) return;
    setError(null);
    setSaving(true);
    try {
      await onSave(clamp(value));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save water goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Water goal</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityLabel="Close">
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.stepper}>
            <Pressable
              onPress={() => bump(-STEP)}
              disabled={value <= MIN}
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
                value <= MIN && styles.stepBtnDisabled,
              ]}
              accessibilityLabel="Decrease goal">
              <MaterialIcons name="remove" size={26} color={C.onSurface} />
            </Pressable>

            <View style={styles.valueBlock}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.unit}>liters / day</Text>
            </View>

            <Pressable
              onPress={() => bump(STEP)}
              disabled={value >= MAX}
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
                value >= MAX && styles.stepBtnDisabled,
              ]}
              accessibilityLabel="Increase goal">
              <MaterialIcons name="add" size={26} color={C.onSurface} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Suggested</Text>
          <View style={styles.presets}>
            {PRESETS.map((liters) => {
              const active = value === liters;
              return (
                <Pressable
                  key={liters}
                  onPress={() => pick(liters)}
                  style={[styles.presetSlot, active && styles.presetActive]}>
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>
                    {liters} L
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={goalLoading ? 'Loading goal…' : 'Save goal'}
            onPress={handleSave}
            loading={saving || !!goalLoading}
            disabled={!!goalLoading}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  closeBtn: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.glassFill,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingHorizontal: 4,
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
  stepBtnPressed: {
    backgroundColor: C.glow,
    opacity: 0.85,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  valueBlock: {
    alignItems: 'center',
    minWidth: 120,
  },
  value: {
    color: C.onSurface,
    fontSize: 52,
    fontFamily: F.sansExtraBold,
    letterSpacing: -1.5,
    lineHeight: 58,
  },
  unit: {
    color: C.primary,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
    marginTop: 2,
  },
  sectionLabel: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansSemiBold,
    marginBottom: 10,
  },
  presets: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  presetSlot: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: C.glassFill,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetActive: {
    backgroundColor: C.glow,
    borderColor: C.primary,
  },
  presetText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
    textAlign: 'center',
  },
  presetTextActive: {
    color: C.primary,
  },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    marginBottom: 10,
  },
});
