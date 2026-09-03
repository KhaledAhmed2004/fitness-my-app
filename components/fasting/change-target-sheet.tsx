import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';
import type { FastingProtocol, SelectableProtocolPreset } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  currentProtocol: FastingProtocol;
  protocols: SelectableProtocolPreset[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (selected: Exclude<FastingProtocol, 'CUSTOM'>) => void;
};

export function ChangeTargetSheet({
  visible,
  currentProtocol,
  protocols,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Exclude<FastingProtocol, 'CUSTOM'>>(
    currentProtocol !== 'CUSTOM' ? currentProtocol : '16:8'
  );

  useEffect(() => {
    if (visible && currentProtocol !== 'CUSTOM') {
      setSelected(currentProtocol);
    }
  }, [visible, currentProtocol]);

  const handlePick = (p: Exclude<FastingProtocol, 'CUSTOM'>) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setSelected(p);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handle} />
          
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Adjust Fasting Goal</Text>
              <Text style={styles.subtitle}>Select a new target protocol for your current fast.</Text>
            </View>
          </View>

          {/* Protocol Selection Grid inside Modal */}
          <View style={styles.grid}>
            {protocols.map((preset) => {
              const isSelected = selected === preset.code;
              const isCurrent = currentProtocol === preset.code;
              return (
                <View key={preset.code} style={styles.slot}>
                  <Pressable
                    disabled={loading}
                    onPress={() => handlePick(preset.code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${preset.code}, ${preset.fastingHours} hours fasting`}
                    style={({ pressed }) => [pressed && !loading && { opacity: 0.88 }]}>
                    <View
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                      ]}>
                      <View style={styles.chipHeader}>
                        <Text style={[styles.codeText, isSelected && styles.codeTextActive]}>
                          {preset.code}
                        </Text>
                        {isCurrent ? (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Current</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.hoursText, isSelected && styles.hoursTextActive]}>
                        {preset.fastingHours}h fast · {preset.eatingHours}h eat
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <View style={styles.btnGroup}>
            <PrimaryButton
              label={selected === currentProtocol ? 'Keep Current Goal' : `Change to ${selected}`}
              onPress={() => onConfirm(selected)}
              loading={loading}
              disabled={selected === currentProtocol}
            />
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              onPress={onClose}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  flex: { flex: 1 },
  sheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 16,
  },
  headerRow: {
    marginBottom: 18,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  slot: {
    width: '48.5%',
  },
  chip: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    gap: 4,
  },
  chipActive: {
    borderColor: C.primary,
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  codeTextActive: {
    color: C.primary,
  },
  currentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.sansMedium,
  },
  hoursText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
  },
  hoursTextActive: {
    color: C.onSurface,
  },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    marginBottom: 12,
  },
  btnGroup: {
    gap: 10,
  },
});
