/**
 * Workout Program Designer & Mesocycle Assigner Modal
 * Allows coach to inspect day-by-day split details, sets, reps, RPE, tempo, rest timers,
 * and push/assign customized training blocks to CRM athlete clients.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import type { ProgramSplit, ProgramDay } from '@/types/trainer';

const T = TrainingTheme;
const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  split: ProgramSplit | null;
  onClose: () => void;
};

export function WorkoutProgramDesignerModal({ visible, split, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { clients, assignProgramToClient, assignedPrograms } = useTrainerStore();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.length > 0 ? clients[0].id : ''
  );
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync selected day index when split changes
  const activeDay: ProgramDay | undefined = split?.days[selectedDayIndex] || split?.days[0];

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Check if selected client has injury risks
  const clientInjuryWarning = useMemo(() => {
    if (!selectedClient || selectedClient.injuries.length === 0) return null;
    return selectedClient.injuries[0];
  }, [selectedClient]);

  // Check existing assignment
  const existingAssignment = useMemo(() => {
    if (!selectedClient) return null;
    return assignedPrograms.find((a) => a.clientId === selectedClient.id);
  }, [assignedPrograms, selectedClient]);

  if (!split) return null;

  const handleAssign = async () => {
    if (!selectedClient) {
      Alert.alert('Select Athlete', 'Please choose an athlete client to assign this routine to.');
      return;
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await assignProgramToClient(
      selectedClient.id,
      split.id,
      prescriptionNotes.trim() || undefined
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

        <View
          style={[
            styles.sheetContainer,
            { paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) + 10 },
          ]}>
          {/* DRAG HANDLE */}
          <View style={styles.dragHandle} />

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.codeBadge, { backgroundColor: split.bg, borderColor: split.color }]}>
                  <Text style={[styles.codeBadgeText, { color: split.color }]}>{split.code}</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{split.level}</Text>
                </View>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>{split.goal.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.splitTitle}>{split.title}</Text>
              <Text style={styles.splitSub}>{split.subtitle}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close Split Designer">
              <MaterialIcons name="close" size={20} color={T.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* MESOCYCLE SPECS CHIPS */}
          <View style={styles.specsRow}>
            <View style={styles.specChip}>
              <MaterialIcons name="date-range" size={14} color="#FFB800" />
              <Text style={styles.specChipText}>{split.durationWeeks} Weeks Block</Text>
            </View>
            <View style={styles.specChip}>
              <MaterialIcons name="fitness-center" size={14} color="#00B4D8" />
              <Text style={styles.specChipText}>{split.daysPerWeek} Days / Week</Text>
            </View>
            <View style={styles.specChip}>
              <MaterialIcons name="timer" size={14} color="#89FE00" />
              <Text style={styles.specChipText}>{split.days.length} Micro-cycles</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* DESCRIPTION */}
            <View style={styles.descBox}>
              <MaterialIcons name="info-outline" size={16} color={T.textMuted} style={{ marginTop: 1 }} />
              <Text style={styles.descText}>{split.description}</Text>
            </View>

            {/* DAY SELECTOR TABS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PROGRAM DAYS BREAKDOWN</Text>
              <Text style={styles.sectionCount}>{split.days.length} Days</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabsRow}>
              {split.days.map((day, idx) => {
                const isSelected = idx === selectedDayIndex;
                return (
                  <TouchableOpacity
                    key={day.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSelectedDayIndex(idx);
                    }}
                    style={[
                      styles.dayTabBtn,
                      isSelected && {
                        backgroundColor: split.bg,
                        borderColor: split.color,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dayTabNumber,
                        isSelected && { color: split.color },
                      ]}>
                      Day {day.dayNumber}
                    </Text>
                    <Text
                      style={[
                        styles.dayTabTitle,
                        isSelected && { color: T.textPrimary, fontFamily: F.sansBold },
                      ]}
                      numberOfLines={1}>
                      {day.focus.split(',')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ACTIVE DAY EXERCISE ROSTER */}
            {activeDay && (
              <View style={styles.exercisesContainer}>
                <View style={styles.dayHeader}>
                  <MaterialIcons name="playlist-play" size={18} color={split.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeDayTitle}>{activeDay.title}</Text>
                    <Text style={styles.activeDayFocus}>{activeDay.focus}</Text>
                  </View>
                </View>

                {activeDay.exercises.map((ex, exIdx) => (
                  <View key={ex.id} style={styles.exerciseCard}>
                    <View style={styles.exTopRow}>
                      <View style={styles.exIndexBox}>
                        <Text style={styles.exIndexText}>#{exIdx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exName}>{ex.name}</Text>
                        <Text style={styles.exMuscle}>{ex.targetMuscle}</Text>
                      </View>
                    </View>

                    {/* METRICS ROW */}
                    <View style={styles.exMetricsRow}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>SETS × REPS</Text>
                        <Text style={styles.metricVal}>
                          {ex.sets} × {ex.reps}
                        </Text>
                      </View>

                      {ex.rpe ? (
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>TARGET RPE</Text>
                          <Text style={[styles.metricVal, { color: '#FFB800' }]}>
                            RPE {ex.rpe}
                          </Text>
                        </View>
                      ) : null}

                      {ex.tempo ? (
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>TEMPO</Text>
                          <Text style={[styles.metricVal, { color: '#00B4D8' }]}>
                            {ex.tempo}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>REST</Text>
                        <Text style={[styles.metricVal, { color: '#89FE00' }]}>
                          {ex.restSeconds}s
                        </Text>
                      </View>
                    </View>

                    {ex.notes && (
                      <View style={styles.exNotesBox}>
                        <MaterialIcons name="lightbulb" size={13} color={T.primary} />
                        <Text style={styles.exNotesText}>{ex.notes}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* ASSIGN TO ATHLETE SECTION */}
            <View style={styles.assignSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ASSIGN TO ATHLETE CLIENT</Text>
                <Text style={styles.sectionCount}>1-Tap Push</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clientPickerRow}>
                {clients.map((c) => {
                  const isPicked = c.id === selectedClientId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedClientId(c.id);
                      }}
                      style={[
                        styles.clientPill,
                        isPicked && {
                          borderColor: split.color,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                      ]}>
                      <View
                        style={[
                          styles.clientAvatar,
                          { backgroundColor: isPicked ? split.color : 'rgba(255, 255, 255, 0.1)' },
                        ]}>
                        <Text
                          style={[
                            styles.clientAvatarText,
                            { color: isPicked ? '#000' : T.textPrimary },
                          ]}>
                          {c.name.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.clientPillName,
                            isPicked && { color: T.textPrimary, fontFamily: F.sansBold },
                          ]}>
                          {c.name}
                        </Text>
                        <Text style={styles.clientPillGoal}>{c.goal}</Text>
                      </View>
                      {isPicked && (
                        <MaterialIcons name="check-circle" size={16} color={split.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* INJURY SHIELD WARNING IF RELEVANT */}
              {clientInjuryWarning && (
                <View style={styles.injuryAlertBanner}>
                  <MaterialIcons name="warning" size={18} color="#FF5722" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.injuryAlertTitle}>
                      Orthopedic Precaution for {selectedClient?.name}
                    </Text>
                    <Text style={styles.injuryAlertText}>
                      {clientInjuryWarning.jointOrArea} — {clientInjuryWarning.notes}
                    </Text>
                  </View>
                </View>
              )}

              {/* EXISTING ASSIGNMENT NOTICE */}
              {existingAssignment && (
                <View style={styles.existingBanner}>
                  <MaterialIcons name="sync" size={16} color="#00B4D8" />
                  <Text style={styles.existingText}>
                    Currently on: <Text style={{ fontFamily: F.sansBold }}>{existingAssignment.splitTitle}</Text>.
                    Assigning will overwrite with {split.code}.
                  </Text>
                </View>
              )}

              {/* COACH INSTRUCTIONS TEXT INPUT */}
              <View style={styles.notesInputBox}>
                <Text style={styles.notesInputLabel}>COACH INSTRUCTIONS & ADJUSTMENTS</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. Keep RPE at 8 on Box Squats. Prioritize recovery and water intake."
                  placeholderTextColor={T.textMuted}
                  multiline
                  numberOfLines={3}
                  value={prescriptionNotes}
                  onChangeText={setPrescriptionNotes}
                />
              </View>
            </View>
          </ScrollView>

          {/* CTA PUSH BUTTON */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAssign}
              disabled={isSuccess}
              style={[
                styles.pushCtaBtn,
                { backgroundColor: isSuccess ? '#89FE00' : split.color },
              ]}>
              <MaterialIcons
                name={isSuccess ? 'check' : 'send'}
                size={20}
                color={isSuccess ? '#000' : '#000'}
              />
              <Text style={styles.pushCtaText}>
                {isSuccess
                  ? `Assigned to ${selectedClient?.name || 'Athlete'}!`
                  : `Push ${split.code} to ${selectedClient?.name || 'Athlete'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '92%',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  codeBadgeText: {
    fontFamily: F.mono,
    fontSize: 11,
    fontWeight: '800',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textSecondary,
  },
  goalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  goalBadgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textSecondary,
  },
  splitTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: T.textPrimary,
  },
  splitSub: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  specChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specChipText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.textSecondary,
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  descBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  descText: {
    flex: 1,
    fontFamily: F.sans,
    fontSize: 12,
    lineHeight: 17,
    color: T.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: T.textMuted,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.primary,
  },
  dayTabsRow: {
    gap: 8,
  },
  dayTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 90,
  },
  dayTabNumber: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.textMuted,
    marginBottom: 2,
  },
  dayTabTitle: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: T.textSecondary,
  },
  exercisesContainer: {
    gap: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  activeDayTitle: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: T.textPrimary,
  },
  activeDayFocus: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: T.textSecondary,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  exTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exIndexBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIndexText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textMuted,
    fontWeight: '700',
  },
  exName: {
    fontFamily: F.sansSemiBold,
    fontSize: 13.5,
    color: T.textPrimary,
  },
  exMuscle: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.primary,
    marginTop: 1,
  },
  exMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    padding: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    color: T.textMuted,
    marginBottom: 2,
  },
  metricVal: {
    fontFamily: F.mono,
    fontSize: 11.5,
    color: T.textPrimary,
    fontWeight: '700',
  },
  exNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(137, 254, 0, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  exNotesText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
    flex: 1,
  },
  assignSection: {
    gap: 10,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  clientPickerRow: {
    gap: 8,
  },
  clientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontFamily: F.sansBold,
    fontSize: 12,
  },
  clientPillName: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: T.textSecondary,
  },
  clientPillGoal: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: T.textMuted,
  },
  injuryAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 87, 34, 0.12)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.3)',
  },
  injuryAlertTitle: {
    fontFamily: F.sansBold,
    fontSize: 11.5,
    color: '#FF5722',
  },
  injuryAlertText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
    marginTop: 1,
  },
  existingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.2)',
  },
  existingText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
    flex: 1,
  },
  notesInputBox: {
    gap: 6,
  },
  notesInputLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textMuted,
    letterSpacing: 0.8,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    color: T.textPrimary,
    fontFamily: F.sans,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  pushCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
  },
  pushCtaText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#000',
  },
});
