import React, { useEffect, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  initialTime: string | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (newTime: string) => void;
};

const PRESETS = [
  { label: 'Now', minutesAgo: 0 },
  { label: '15m ago', minutesAgo: 15 },
  { label: '30m ago', minutesAgo: 30 },
  { label: '1h ago', minutesAgo: 60 },
  { label: '2h ago', minutesAgo: 120 },
];

/** Deterministic time formatter so AM/PM splits consistently on all platforms */
function formatClockParts(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const timeStr = `${hours}:${String(minutes).padStart(2, '0')}`;
  return { time: timeStr, period };
}

function getRelativeTimeLabel(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 1) return 'Started just now';
  if (diffMinutes < 60) return `Started ${diffMinutes}m ago`;
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  if (m === 0) return `Started ${h}h ago`;
  return `Started ${h}h ${m}m ago`;
}

export function EditStartTimeSheet({
  visible,
  initialTime,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (initialTime && visible) {
      setDate(new Date(initialTime));
      setShowPicker(false);
    }
  }, [initialTime, visible]);

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const now = new Date();
      const clamped = selectedDate > now ? now : selectedDate;
      setDate(clamped);
      void Haptics.selectionAsync();
    }
  };

  const applyPreset = (minutesAgo: number) => {
    const newDate = new Date(Date.now() - minutesAgo * 60 * 1000);
    setDate(newDate);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirm = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(date.toISOString());
  };

  const setPeriod = (targetPeriod: 'AM' | 'PM') => {
    const currentHours = date.getHours();
    const isCurrentlyPM = currentHours >= 12;
    const isCurrentlyAM = !isCurrentlyPM;

    if (targetPeriod === 'AM' && isCurrentlyPM) {
      const next = new Date(date);
      next.setHours(currentHours - 12);
      setDate(next);
      void Haptics.selectionAsync();
    } else if (targetPeriod === 'PM' && isCurrentlyAM) {
      let next = new Date(date);
      next.setHours(currentHours + 12);
      // If resulting time is in the future, shift to yesterday to keep it a valid fasting start time
      if (next.getTime() > Date.now()) {
        next = new Date(next.getTime() - 24 * 60 * 60 * 1000);
      }
      setDate(next);
      void Haptics.selectionAsync();
    }
  };

  const clock = formatClockParts(date);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Edit Start Time</Text>
            <Text style={styles.subtitle}>
              Adjust when your fasting period actually began.
            </Text>
          </View>

          {/* Interactive Hero Time Card */}
          <View style={styles.timeCard}>
            <View style={styles.timeCardHeader}>
              <Text style={styles.timeCardLabel}>START TIME</Text>
              <Pressable
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Change time"
                style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <View style={styles.editBadge}>
                  <MaterialIcons name="edit" size={12} color="#38e0ff" />
                  <Text style={styles.editBadgeText}>Change</Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.timeDisplayRow}>
              <Pressable
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Selected start time: ${clock.time}. Tap to edit`}
                style={({ pressed }) => pressed && { opacity: 0.8 }}>
                <Text style={styles.timeValue}>{clock.time}</Text>
              </Pressable>

              {/* Interactive AM / PM Toggle Selector */}
              <View style={styles.periodSelector}>
                <Pressable
                  onPress={() => setPeriod('AM')}
                  accessibilityRole="button"
                  accessibilityLabel="Select AM"
                  accessibilityState={{ selected: clock.period === 'AM' }}
                  style={({ pressed }) => pressed && { opacity: 0.8 }}>
                  <View
                    style={[
                      styles.periodButton,
                      clock.period === 'AM' && styles.periodButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.periodButtonText,
                        clock.period === 'AM' && styles.periodButtonTextActive,
                      ]}>
                      AM
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setPeriod('PM')}
                  accessibilityRole="button"
                  accessibilityLabel="Select PM"
                  accessibilityState={{ selected: clock.period === 'PM' }}
                  style={({ pressed }) => pressed && { opacity: 0.8 }}>
                  <View
                    style={[
                      styles.periodButton,
                      clock.period === 'PM' && styles.periodButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.periodButtonText,
                        clock.period === 'PM' && styles.periodButtonTextActive,
                      ]}>
                      PM
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.relativeBadge}>
              <Text style={styles.relativeText}>{getRelativeTimeLabel(date)}</Text>
            </View>
          </View>

          {/* Quick Offset Presets */}
          <View style={styles.presetSection}>
            <Text style={styles.presetSectionTitle}>QUICK PRESETS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetRow}>
              {PRESETS.map((preset) => {
                const isSelected =
                  Math.abs(Date.now() - preset.minutesAgo * 60 * 1000 - date.getTime()) < 60000;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => applyPreset(preset.minutesAgo)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => pressed && { opacity: 0.8 }}>
                    <View
                      style={[
                        styles.presetChip,
                        isSelected && styles.presetChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected && styles.presetChipTextActive,
                        ]}>
                        {preset.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Native Picker (Triggered when user taps the Hero Time Card) */}
          {showPicker ? (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
              maximumDate={new Date()}
              textColor={C.onSurface}
            />
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <View style={styles.actionButtonWrap}>
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={onClose}
                disabled={loading}
              />
            </View>
            <View style={styles.actionButtonWrap}>
              <PrimaryButton
                label="Save Changes"
                onPress={handleConfirm}
                loading={loading}
              />
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  flex: { flex: 1 },
  sheet: {
    backgroundColor: '#13181c',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderColor: '#26333d',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 2,
  },
  header: {
    gap: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#8e9da8',
    fontSize: 13,
    fontFamily: F.sans,
    lineHeight: 18,
  },
  timeCard: {
    backgroundColor: '#1b232a',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2d3b47',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeCardLabel: {
    color: '#8e9da8',
    fontSize: 12,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 224, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  editBadgeText: {
    color: '#38e0ff',
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 2,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 42,
    fontFamily: F.sansExtraBold,
    letterSpacing: -1,
  },
  periodSelector: {
    flexDirection: 'column',
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#202932',
    borderWidth: 1.5,
    borderColor: '#354350',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
  },
  periodButtonActive: {
    backgroundColor: '#0a3247',
    borderColor: '#38e0ff',
  },
  periodButtonText: {
    color: '#8e9da8',
    fontSize: 11,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
  },
  periodButtonTextActive: {
    color: '#38e0ff',
  },
  relativeBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(56, 224, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 224, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  relativeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  presetSection: {
    gap: 8,
  },
  presetSectionTitle: {
    color: '#8e9da8',
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    letterSpacing: 0.8,
    paddingLeft: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#202932',
    borderWidth: 1.5,
    borderColor: '#354350',
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#0a3247',
    borderColor: '#38e0ff',
    borderWidth: 1.5,
  },
  presetChipText: {
    color: '#b8c7d4',
    fontSize: 13,
    fontFamily: F.sansSemiBold,
    textAlign: 'center',
  },
  presetChipTextActive: {
    color: '#38e0ff',
    fontFamily: F.sansBold,
  },
  error: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  actionButtonWrap: {
    flex: 1,
  },
});
