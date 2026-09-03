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
import { formatClock, fastingHoursForProtocol } from '@/lib/fasting-format';
import {
  PROTOCOL_HOURS,
  SELECTABLE_PROTOCOLS,
  type FastingProtocol,
  type SelectableProtocolPreset,
} from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  initialTime: string | null;
  currentProtocol: FastingProtocol;
  protocols?: SelectableProtocolPreset[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (payload: { startedAt: string; protocol: Exclude<FastingProtocol, 'CUSTOM'> }) => void;
};

const PRESETS = [
  { label: 'Now', minutesAgo: 0 },
  { label: '15m ago', minutesAgo: 15 },
  { label: '30m ago', minutesAgo: 30 },
  { label: '1h ago', minutesAgo: 60 },
  { label: '2h ago', minutesAgo: 120 },
  { label: '4h ago', minutesAgo: 240 },
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

export function EditFastSheet({
  visible,
  initialTime,
  currentProtocol,
  protocols,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  const [selectedProtocol, setSelectedProtocol] = useState<Exclude<FastingProtocol, 'CUSTOM'>>(
    currentProtocol !== 'CUSTOM' ? currentProtocol : '16:8'
  );
  const [showPicker, setShowPicker] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialTime) {
        setDate(new Date(initialTime));
      }
      if (currentProtocol !== 'CUSTOM') {
        setSelectedProtocol(currentProtocol);
      }
      setActivePreset(null);
      setShowPicker(false);
    }
  }, [initialTime, currentProtocol, visible]);

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const now = new Date();
      const clamped = selectedDate > now ? now : selectedDate;
      setDate(clamped);
      setActivePreset(null);
      void Haptics.selectionAsync();
    }
  };

  const applyPreset = (minutesAgo: number) => {
    const newDate = new Date(Date.now() - minutesAgo * 60 * 1000);
    setDate(newDate);
    setActivePreset(minutesAgo);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleAmPm = (targetPeriod: 'AM' | 'PM') => {
    const currentHours = date.getHours();
    const isCurrentPm = currentHours >= 12;
    const currentPeriod = isCurrentPm ? 'PM' : 'AM';

    if (currentPeriod === targetPeriod) return;

    const newDate = new Date(date);
    if (targetPeriod === 'AM' && isCurrentPm) {
      newDate.setHours(currentHours - 12);
    } else if (targetPeriod === 'PM' && !isCurrentPm) {
      newDate.setHours(currentHours + 12);
    }

    const now = new Date();
    if (newDate > now) {
      newDate.setTime(now.getTime());
    }

    setDate(newDate);
    setActivePreset(null);
    void Haptics.selectionAsync();
  };

  const handleProtocolSelect = (p: Exclude<FastingProtocol, 'CUSTOM'>) => {
    setSelectedProtocol(p);
    void Haptics.selectionAsync();
  };

  const handleConfirm = () => {
    onConfirm({
      startedAt: date.toISOString(),
      protocol: selectedProtocol,
    });
  };

  const availableProtocols: { code: Exclude<FastingProtocol, 'CUSTOM'>; fastingHours: number; eatingHours: number }[] =
    protocols && protocols.length > 0
      ? protocols
      : SELECTABLE_PROTOCOLS.map((p) => ({
          code: p,
          fastingHours: PROTOCOL_HOURS[p].fastingHours,
          eatingHours: PROTOCOL_HOURS[p].eatingHours,
        }));

  const fastingHours = fastingHoursForProtocol(selectedProtocol, 16);
  const targetEndDate = new Date(date.getTime() + fastingHours * 60 * 60 * 1000);
  const targetEndFormatted = formatClock(targetEndDate);
  const isNextDay = targetEndDate.getDate() !== date.getDate();
  const targetEndWithDay = `${isNextDay ? 'Tomorrow ' : ''}${targetEndFormatted}`;
  const { time, period } = formatClockParts(date);
  const relativeLabel = getRelativeTimeLabel(date);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.title}>Edit Fast</Text>
              <Text style={styles.subtitle}>Adjust your start time and fasting goal</Text>
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
            contentContainerStyle={styles.scrollContent}>
            
            {/* SECTION 1: START TIME */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>START TIME</Text>
            </View>

            {/* Time Card with Connected Timeline */}
            <View style={styles.timeCard}>
              <Pressable
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Start time: ${time} ${period}. Tap to change.`}
                style={({ pressed }) => [styles.timeDisplayPressable, pressed && { opacity: 0.85 }]}>
                <View style={styles.timeDisplayRow}>
                  <Text style={styles.timeText}>{time}</Text>

                  {/* AM / PM Segment Toggle */}
                  <View style={styles.amPmContainer}>
                    <Pressable
                      onPress={() => toggleAmPm('AM')}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="Set to AM"
                      style={({ pressed }) => pressed && { opacity: 0.8 }}>
                      <View style={[styles.amPmSegment, period === 'AM' && styles.amPmSegmentActive]}>
                        <Text
                          style={[
                            styles.amPmText,
                            period === 'AM' && styles.amPmTextActive,
                          ]}>
                          AM
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => toggleAmPm('PM')}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="Set to PM"
                      style={({ pressed }) => pressed && { opacity: 0.8 }}>
                      <View style={[styles.amPmSegment, period === 'PM' && styles.amPmSegmentActive]}>
                        <Text
                          style={[
                            styles.amPmText,
                            period === 'PM' && styles.amPmTextActive,
                          ]}>
                          PM
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </Pressable>

              {/* Relative Badge */}
              <View style={styles.relativeBadge}>
                <Text style={styles.relativeText}>{relativeLabel}</Text>
              </View>

              {/* Connected Timeline (Option A) */}
              <View style={styles.timelineCard}>
                <View style={styles.timelinePoint}>
                  <Text style={styles.timelineLabel}>START</Text>
                  <Text style={styles.timelineTime}>{time} {period}</Text>
                </View>

                <View style={styles.timelineConnector}>
                  <View style={styles.timelineLine} />
                </View>

                <View style={[styles.timelinePoint, { alignItems: 'flex-end' }]}>
                  <Text style={styles.timelineLabel}>TARGET END</Text>
                  <Text style={[styles.timelineTime, styles.timelineTargetTime]}>
                    {targetEndWithDay}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsWrapper}>
              <Text style={styles.presetsLabel}>QUICK PRESETS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScrollContent}>
                {PRESETS.map((p) => {
                  const isSelected = activePreset === p.minutesAgo;
                  return (
                    <Pressable
                      key={p.label}
                      onPress={() => applyPreset(p.minutesAgo)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Set start time to ${p.label}`}
                      style={({ pressed }) => [styles.presetItem, pressed && { opacity: 0.8 }]}>
                      <View
                        style={[
                          styles.presetChip,
                          isSelected && styles.presetChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.presetText,
                            isSelected && styles.presetTextActive,
                          ]}>
                          {p.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* SECTION 2: FASTING GOAL */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionTitle}>FASTING GOAL</Text>
            </View>

            {/* Protocol Chips Grid */}
            <View style={styles.protocolGrid}>
              {availableProtocols.map((preset) => {
                const isSelected = selectedProtocol === preset.code;
                return (
                  <View key={preset.code} style={styles.protocolSlot}>
                    <Pressable
                      disabled={loading}
                      onPress={() => handleProtocolSelect(preset.code)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${preset.code}, ${preset.fastingHours} hours fasting`}
                      style={({ pressed }) => [pressed && !loading && { opacity: 0.88 }]}>
                      <View
                        style={[
                          styles.protocolChip,
                          isSelected && styles.protocolChipActive,
                        ]}>
                        <Text style={[styles.protocolCodeText, isSelected && styles.protocolCodeTextActive]}>
                          {preset.code}
                        </Text>
                        <Text style={[styles.protocolHoursText, isSelected && styles.protocolHoursTextActive]}>
                          {preset.fastingHours}h fast
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <View style={styles.btnCol}>
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={onClose}
                disabled={loading}
              />
            </View>
            <View style={styles.btnCol}>
              <PrimaryButton
                label="Save Changes"
                variant="primary"
                onPress={handleConfirm}
                loading={loading}
              />
            </View>
          </View>

          {/* Platform Date Picker */}
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handlePickerChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  flex: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#11171d',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#24323e',
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: '#354350',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1b232a',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#38e0ff',
    fontSize: 12,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
  },
  timeCard: {
    backgroundColor: '#171f26',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263440',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  timeDisplayPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 38,
    fontFamily: F.sansBold,
    letterSpacing: -1,
  },
  amPmContainer: {
    flexDirection: 'row',
    backgroundColor: '#0e141a',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#24323e',
    gap: 2,
  },
  amPmSegment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amPmSegmentActive: {
    backgroundColor: '#0a3a52',
    borderWidth: 1,
    borderColor: '#38e0ff',
  },
  amPmText: {
    color: '#7e909e',
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  amPmTextActive: {
    color: '#38e0ff',
  },
  relativeBadge: {
    backgroundColor: '#1f2b35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
  },
  relativeText: {
    color: '#9eb1c0',
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  presetsWrapper: {
    marginBottom: 14,
  },
  presetsLabel: {
    color: '#8e9da8',
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 2,
  },
  presetsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  presetItem: {},
  presetChip: {
    backgroundColor: '#161f26',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#263541',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  presetChipActive: {
    backgroundColor: '#0a3247',
    borderColor: '#38e0ff',
  },
  presetText: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontFamily: F.sansSemiBold,
  },
  presetTextActive: {
    color: '#38e0ff',
    fontFamily: F.sansBold,
  },
  protocolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    width: '100%',
  },
  protocolSlot: {
    flex: 1,
    minWidth: '22%',
  },
  protocolChip: {
    width: '100%',
    backgroundColor: '#161f26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263541',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolChipActive: {
    backgroundColor: 'rgba(56, 224, 255, 0.14)',
    borderColor: '#38e0ff',
  },
  protocolCodeText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  protocolCodeTextActive: {
    color: '#38e0ff',
  },
  protocolHoursText: {
    color: '#8295a5',
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  protocolHoursTextActive: {
    color: '#a5f3fc',
  },
  timelineCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#11171d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24323e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  timelinePoint: {
    gap: 1.5,
  },
  timelineLabel: {
    color: '#718290',
    fontSize: 9,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
  },
  timelineTime: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: F.sansSemiBold,
  },
  timelineTargetTime: {
    color: '#38e0ff',
    fontFamily: F.sansBold,
  },
  timelineConnector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  timelineLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#263644',
  },
  errorText: {
    color: C.error,
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  btnCol: {
    flex: 1,
  },
});
