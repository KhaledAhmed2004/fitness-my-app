import React, { useEffect, useMemo, useState } from 'react';
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
import { formatClock, formatDurationMinutes } from '@/lib/fasting-format';
import type { FastingSessionStatus } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  session: FastingSessionStatus | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (startedAt: string, endedAt: string) => void;
};

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

function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function EditSessionSheet({
  visible,
  session,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time' | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);

  useEffect(() => {
    if (session && visible) {
      const s = new Date(session.startedAt);
      setStartDate(s);
      if (session.endedAt) {
        setEndDate(new Date(session.endedAt));
      } else {
        const fallbackEnd = new Date(s.getTime() + session.targetMinutes * 60 * 1000);
        setEndDate(fallbackEnd > new Date() ? new Date() : fallbackEnd);
      }
      setActiveField('start');
      setAndroidPickerMode(null);
      setShowIosPicker(false);
    }
  }, [session, visible]);

  // Duration calculation
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));
  const targetMinutes = session?.targetMinutes ?? 16 * 60;
  const isTargetAchieved = durationMinutes >= targetMinutes;

  // Validation
  const validationError = useMemo(() => {
    const now = Date.now();
    if (startDate.getTime() > now) {
      return 'Start time cannot be in the future.';
    }
    if (endDate.getTime() > now) {
      return 'End time cannot be in the future.';
    }
    if (startDate.getTime() >= endDate.getTime()) {
      return 'End time must be after start time.';
    }
    if (durationMinutes < 1) {
      return 'Fasting duration must be at least 1 minute.';
    }
    return null;
  }, [startDate, endDate, durationMinutes]);

  const activeDate = activeField === 'start' ? startDate : endDate;

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setAndroidPickerMode(null);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    void Haptics.selectionAsync();

    if (activeField === 'start') {
      setStartDate(selected);
    } else {
      setEndDate(selected);
    }
  };

  const handleQuickShift = (minutes: number) => {
    void Haptics.selectionAsync();
    if (activeField === 'start') {
      const updated = new Date(startDate.getTime() + minutes * 60 * 1000);
      const now = new Date();
      if (updated > now) return;
      setStartDate(updated);
    } else {
      const updated = new Date(endDate.getTime() + minutes * 60 * 1000);
      const now = new Date();
      if (updated > now) return;
      setEndDate(updated);
    }
  };

  const handleSetEndToNow = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEndDate(new Date());
  };

  const handleConfirm = () => {
    if (validationError) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(startDate.toISOString(), endDate.toISOString());
  };

  const startClock = formatClockParts(startDate);
  const endClock = formatClockParts(endDate);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.title}>Edit Past Fast</Text>
              <Text style={styles.subtitle}>Correct your start and finish times</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            
            {/* Live Duration Result Card */}
            <View style={[styles.durationCard, !isTargetAchieved && styles.durationCardEarly]}>
              <View style={styles.durationCardLeft}>
                <Text style={styles.durationCardLabel}>TOTAL FASTED</Text>
                <Text style={styles.durationCardValue}>
                  {formatDurationMinutes(durationMinutes)}
                </Text>
              </View>
              <View
                style={[
                  styles.durationBadge,
                  isTargetAchieved ? styles.durationBadgeSuccess : styles.durationBadgeEarly,
                ]}>
                <MaterialIcons
                  name={isTargetAchieved ? 'check-circle' : 'timelapse'}
                  size={14}
                  color={isTargetAchieved ? C.secondary : C.error}
                />
                <Text
                  style={[
                    styles.durationBadgeText,
                    isTargetAchieved
                      ? styles.durationBadgeTextSuccess
                      : styles.durationBadgeTextEarly,
                  ]}>
                  {isTargetAchieved ? 'Goal Met' : 'Under Target'} ({Math.round(targetMinutes / 60)}h)
                </Text>
              </View>
            </View>

            {/* Time Selection Cards (Start vs End) */}
            <View style={styles.timeCardsRow}>
              {/* Start Time Card */}
              <Pressable
                onPress={() => {
                  setActiveField('start');
                  if (Platform.OS === 'ios') setShowIosPicker(true);
                  void Haptics.selectionAsync();
                }}
                style={[
                  styles.timeCard,
                  activeField === 'start' && styles.timeCardActive,
                ]}>
                <View style={styles.timeCardHeader}>
                  <MaterialIcons
                    name="play-arrow"
                    size={14}
                    color={activeField === 'start' ? C.primary : C.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.timeCardLabel,
                      activeField === 'start' && styles.timeCardLabelActive,
                    ]}>
                    STARTED
                  </Text>
                </View>
                <Text style={styles.timeCardDate}>{formatDateShort(startDate)}</Text>
                <View style={styles.timeCardDigits}>
                  <Text style={styles.timeCardTime}>{startClock.time}</Text>
                  <Text style={styles.timeCardPeriod}>{startClock.period}</Text>
                </View>
              </Pressable>

              {/* End Time Card */}
              <Pressable
                onPress={() => {
                  setActiveField('end');
                  if (Platform.OS === 'ios') setShowIosPicker(true);
                  void Haptics.selectionAsync();
                }}
                style={[
                  styles.timeCard,
                  activeField === 'end' && styles.timeCardActive,
                ]}>
                <View style={styles.timeCardHeader}>
                  <MaterialIcons
                    name="stop"
                    size={14}
                    color={activeField === 'end' ? C.primary : C.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.timeCardLabel,
                      activeField === 'end' && styles.timeCardLabelActive,
                    ]}>
                    ENDED
                  </Text>
                </View>
                <Text style={styles.timeCardDate}>{formatDateShort(endDate)}</Text>
                <View style={styles.timeCardDigits}>
                  <Text style={styles.timeCardTime}>{endClock.time}</Text>
                  <Text style={styles.timeCardPeriod}>{endClock.period}</Text>
                </View>
              </Pressable>
            </View>

            {/* Quick Presets & Shift Buttons */}
            <View style={styles.quickShiftSection}>
              <Text style={styles.sectionLabel}>
                ADJUST {activeField === 'start' ? 'START' : 'END'} TIME
              </Text>

              {Platform.OS === 'android' ? (
                <View style={styles.androidBtnRow}>
                  <Pressable
                    style={styles.pickerTriggerBtn}
                    onPress={() => setAndroidPickerMode('date')}>
                    <MaterialIcons name="calendar-today" size={16} color={C.primary} />
                    <Text style={styles.pickerTriggerText}>Change Date</Text>
                  </Pressable>

                  <Pressable
                    style={styles.pickerTriggerBtn}
                    onPress={() => setAndroidPickerMode('time')}>
                    <MaterialIcons name="schedule" size={16} color={C.primary} />
                    <Text style={styles.pickerTriggerText}>Change Time</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.pickerTriggerBtnIos}
                  onPress={() => setShowIosPicker((prev) => !prev)}>
                  <MaterialIcons name="schedule" size={16} color={C.primary} />
                  <Text style={styles.pickerTriggerText}>
                    {showIosPicker ? 'Hide Time Wheel' : 'Open Time Wheel'}
                  </Text>
                </Pressable>
              )}

              {/* Quick Stepper Chips */}
              <View style={styles.steppersRow}>
                <Pressable
                  style={styles.stepperChip}
                  onPress={() => handleQuickShift(-30)}>
                  <Text style={styles.stepperChipText}>-30m</Text>
                </Pressable>
                <Pressable
                  style={styles.stepperChip}
                  onPress={() => handleQuickShift(-15)}>
                  <Text style={styles.stepperChipText}>-15m</Text>
                </Pressable>
                <Pressable
                  style={styles.stepperChip}
                  onPress={() => handleQuickShift(15)}>
                  <Text style={styles.stepperChipText}>+15m</Text>
                </Pressable>
                <Pressable
                  style={styles.stepperChip}
                  onPress={() => handleQuickShift(30)}>
                  <Text style={styles.stepperChipText}>+30m</Text>
                </Pressable>
                {activeField === 'end' && (
                  <Pressable
                    style={[styles.stepperChip, styles.stepperChipNow]}
                    onPress={handleSetEndToNow}>
                    <Text style={styles.stepperChipNowText}>Now</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* iOS Inline DateTimePicker Wheel */}
            {Platform.OS === 'ios' && showIosPicker ? (
              <View style={styles.iosWheelContainer}>
                <DateTimePicker
                  value={activeDate}
                  mode="datetime"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handlePickerChange}
                  textColor={C.onSurface}
                />
              </View>
            ) : null}

            {/* Android DateTimePicker (Modal Dialogs) */}
            {Platform.OS === 'android' && androidPickerMode ? (
              <DateTimePicker
                value={activeDate}
                mode={androidPickerMode}
                display="default"
                maximumDate={new Date()}
                onChange={handlePickerChange}
              />
            ) : null}

            {/* Validation or API Errors */}
            {validationError || error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={C.error} />
                <Text style={styles.errorText}>{validationError || error}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <PrimaryButton
                label="Save Changes"
                onPress={handleConfirm}
                loading={loading}
                disabled={!!validationError || loading}
              />
              <View style={{ height: 8 }} />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={onClose}
                disabled={loading}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  flex: {
    flex: 1,
  },
  sheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 8,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  durationCardEarly: {
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  durationCardLeft: {
    gap: 2,
  },
  durationCardLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
  },
  durationCardValue: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: F.sansBold,
    letterSpacing: -0.5,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  durationBadgeSuccess: {
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
  },
  durationBadgeEarly: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  durationBadgeText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
  },
  durationBadgeTextSuccess: {
    color: C.secondary,
  },
  durationBadgeTextEarly: {
    color: C.error,
  },
  timeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: C.surfaceLow,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
    padding: 14,
    gap: 6,
  },
  timeCardActive: {
    borderColor: C.primary,
    backgroundColor: 'rgba(56, 224, 255, 0.05)',
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeCardLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
  },
  timeCardLabelActive: {
    color: C.primary,
    fontFamily: F.mono,
  },
  timeCardDate: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  timeCardDigits: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  timeCardTime: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: F.sansBold,
    letterSpacing: -0.5,
  },
  timeCardPeriod: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.mono,
  },
  quickShiftSection: {
    backgroundColor: C.surfaceLow,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    gap: 10,
  },
  sectionLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
  },
  androidBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerTriggerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingVertical: 10,
  },
  pickerTriggerBtnIos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingVertical: 10,
  },
  pickerTriggerText: {
    color: C.onSurface,
    fontSize: 13,
    fontFamily: F.sansSemiBold,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  stepperChipText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.mono,
  },
  stepperChipNow: {
    backgroundColor: 'rgba(56, 224, 255, 0.12)',
    borderColor: 'rgba(56, 224, 255, 0.3)',
  },
  stepperChipNowText: {
    color: C.primary,
    fontSize: 12,
    fontFamily: F.mono,
  },
  iosWheelContainer: {
    backgroundColor: C.surfaceLow,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: C.error,
    fontSize: 12,
    fontFamily: F.sansMedium,
    flex: 1,
  },
  actions: {
    marginTop: 4,
  },
});
