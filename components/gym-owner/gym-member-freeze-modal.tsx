/**
 * ❄️ Gym Member Freeze & Auto-Resume Modal (GymOS)
 * Real-time membership pause, reason logging, automated expiry date extension & WhatsApp notices.
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
  Linking,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, GymFreezeReason } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

const FREEZE_REASONS: { key: GymFreezeReason; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'EXAM', label: 'Exams & Study', icon: 'school' },
  { key: 'MEDICAL', label: 'Medical / Injury', icon: 'healing' },
  { key: 'TRAVEL', label: 'Travel / Vacation', icon: 'flight' },
  { key: 'RAMADAN', label: 'Ramadan / Fasting', icon: 'nightlight-round' },
  { key: 'WORK', label: 'Work / Office', icon: 'business-center' },
  { key: 'OTHER', label: 'Personal Leave', icon: 'pause-circle-outline' },
];

type Props = {
  visible: boolean;
  member: GymMemberItem | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function GymMemberFreezeModal({ visible, member, onClose, onSuccess }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    freezeMember,
    resumeMember,
    generateWhatsAppFreezeMessage,
    generateWhatsAppResumeMessage,
  } = useGymOwnerStore();

  const isFrozen = member?.status === 'FROZEN';

  // Freeze Mode Form State
  const [selectedDays, setSelectedDays] = useState<number>(15);
  const [customDays, setCustomDays] = useState<string>('15');
  const [selectedReason, setSelectedReason] = useState<GymFreezeReason>('EXAM');
  const [reasonNotes, setReasonNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resume Mode Calculation
  const resumeDetails = useMemo(() => {
    if (!member || !isFrozen) return null;

    const today = new Date();
    const freezeStart = member.currentFreeze?.freezeStartDate
      ? new Date(member.currentFreeze.freezeStartDate)
      : new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const diffTime = Math.abs(today.getTime() - freezeStart.getTime());
    const daysFrozen = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    const oldEnd = new Date(member.endDate || today.toISOString().split('T')[0]);
    const newEnd = new Date(oldEnd);
    newEnd.setDate(newEnd.getDate() + daysFrozen);

    return {
      daysFrozen,
      freezeStartDate: member.currentFreeze?.freezeStartDate || today.toISOString().split('T')[0],
      oldEndDate: member.endDate,
      newEndDate: newEnd.toISOString().split('T')[0],
      reason: member.currentFreeze?.reason || 'OTHER',
      notes: member.currentFreeze?.reasonNotes,
    };
  }, [member, isFrozen]);

  // Projected Return & Expiry for Freeze Mode
  const projectedDates = useMemo(() => {
    if (!member || isFrozen) return null;
    const days = selectedDays;
    const today = new Date();
    
    const tentativeReturn = new Date(today);
    tentativeReturn.setDate(tentativeReturn.getDate() + days);

    const oldEnd = new Date(member.endDate || today.toISOString().split('T')[0]);
    const newEnd = new Date(oldEnd);
    newEnd.setDate(newEnd.getDate() + days);

    return {
      tentativeReturnDate: tentativeReturn.toISOString().split('T')[0],
      oldEndDate: member.endDate,
      newProjectedEndDate: newEnd.toISOString().split('T')[0],
    };
  }, [member, isFrozen, selectedDays]);

  if (!member) return null;

  const handleConfirmFreeze = async () => {
    if (selectedDays <= 0) {
      Alert.alert('Invalid Duration', 'Please select at least 1 day to pause.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await freezeMember(member.id, selectedDays, selectedReason, reasonNotes.trim() || undefined);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setIsSubmitting(false);

      if (res.success && res.member) {
        Alert.alert(
          'Membership Frozen! ❄️',
          `${member.fullName}'s membership has been paused for ${selectedDays} days.`,
          [
            {
              text: 'Send WhatsApp Notice',
              onPress: () => {
                const text = generateWhatsAppFreezeMessage(res.member!);
                const cleanPhone = member.phone.replace(/[^0-9]/g, '');
                const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                Linking.openURL(url).catch(() => {});
                onSuccess?.();
                onClose();
              },
            },
            {
              text: 'Done',
              style: 'cancel',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      }
    } catch {
      setIsSubmitting(false);
      Alert.alert('Error', 'Could not freeze membership.');
    }
  };

  const handleConfirmResume = async () => {
    setIsSubmitting(true);
    try {
      const res = await resumeMember(member.id);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setIsSubmitting(false);

      if (res.success && res.member) {
        Alert.alert(
          'Membership Resumed! 🏋️',
          `Welcome back ${member.fullName}! Membership extended by ${res.extendedDays} days until ${res.newEndDate}.`,
          [
            {
              text: 'Send WhatsApp Welcome Back',
              onPress: () => {
                const text = generateWhatsAppResumeMessage(res.member!, res.extendedDays, res.newEndDate);
                const cleanPhone = member.phone.replace(/[^0-9]/g, '');
                const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                Linking.openURL(url).catch(() => {});
                onSuccess?.();
                onClose();
              },
            },
            {
              text: 'Done',
              style: 'cancel',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      }
    } catch {
      setIsSubmitting(false);
      Alert.alert('Error', 'Could not resume membership.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* HEADER */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={[
                  styles.headerIconWrap,
                  {
                    backgroundColor: isFrozen ? 'rgba(64, 192, 87, 0.15)' : 'rgba(77, 171, 247, 0.15)',
                  },
                ]}>
                <MaterialIcons
                  name={isFrozen ? 'play-arrow' : 'pause'}
                  size={20}
                  color={isFrozen ? '#40C057' : '#4DABF7'}
                />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {isFrozen ? 'Resume Membership' : 'Freeze Membership'}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  {member.fullName} • {member.planTitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            {/* ---------------- RESUME MODE ---------------- */}
            {isFrozen && resumeDetails ? (
              <View style={{ marginTop: 8 }}>
                {/* FROZEN DURATION INFO CARD */}
                <View
                  style={[
                    styles.infoCard,
                    { backgroundColor: 'rgba(77, 171, 247, 0.08)', borderColor: 'rgba(77, 171, 247, 0.3)' },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="ac-unit" size={16} color="#4DABF7" />
                    <Text style={{ fontFamily: F.sansBold, fontSize: 13, color: '#4DABF7' }}>
                      Currently Frozen ({resumeDetails.daysFrozen} Days Paused)
                    </Text>
                  </View>
                  <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                    Paused on <Text style={{ fontFamily: F.monoBold, color: colors.textPrimary }}>{resumeDetails.freezeStartDate}</Text>
                    {' • '}Reason: <Text style={{ fontFamily: F.sansBold, color: colors.textPrimary }}>{resumeDetails.reason}</Text>
                  </Text>
                  {resumeDetails.notes && (
                    <Text style={{ fontFamily: F.sans, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                      Note: {resumeDetails.notes}
                    </Text>
                  )}
                </View>

                {/* EXPIRY EXTENSION PROJECTION CARD */}
                <View style={[styles.summaryCard, { backgroundColor: colors.glassFill, borderColor: colors.border, marginTop: 12 }]}>
                  <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>AUTOMATED EXPIRY EXTENSION</Text>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Previous Expiry Date:</Text>
                    <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{resumeDetails.oldEndDate}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Days to Credit / Add:</Text>
                    <Text style={[styles.summaryVal, { color: '#40C057' }]}>+ {resumeDetails.daysFrozen} Days</Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.summaryRow}>
                    <Text style={[styles.grandLabel, { color: colors.textPrimary }]}>New Extended Expiry Date:</Text>
                    <Text style={[styles.grandVal, { color: colors.primary }]}>{resumeDetails.newEndDate}</Text>
                  </View>
                </View>

                {/* RESUME BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  onPress={handleConfirmResume}
                  style={[styles.actionBtn, { backgroundColor: '#40C057', marginTop: 18 }]}>
                  <MaterialIcons name="play-arrow" size={20} color="#FFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>
                    {isSubmitting ? 'Resuming...' : 'Confirm Resume & Extend Expiry'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ---------------- FREEZE MODE ---------------- */
              <View style={{ marginTop: 8 }}>
                {/* DURATION SELECTOR */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SELECT PAUSE DURATION</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {[7, 15, 30, 60].map((d) => {
                    const isSel = selectedDays === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedDays(d);
                          setCustomDays(String(d));
                        }}
                        style={[
                          styles.presetPill,
                          isSel
                            ? { backgroundColor: '#4DABF7', borderColor: '#4DABF7' }
                            : { backgroundColor: colors.glassFill, borderColor: colors.border },
                        ]}>
                        <Text
                          style={{
                            fontFamily: isSel ? F.sansBold : F.sans,
                            fontSize: 12,
                            color: isSel ? '#000' : colors.textPrimary,
                          }}>
                          {d} Days
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* REASON SELECTOR */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REASON FOR FREEZING</Text>
                <View style={styles.reasonGrid}>
                  {FREEZE_REASONS.map((r) => {
                    const isSel = selectedReason === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedReason(r.key);
                        }}
                        style={[
                          styles.reasonCard,
                          isSel
                            ? { backgroundColor: 'rgba(77, 171, 247, 0.15)', borderColor: '#4DABF7' }
                            : { backgroundColor: colors.glassFill, borderColor: colors.border },
                        ]}>
                        <MaterialIcons
                          name={r.icon}
                          size={16}
                          color={isSel ? '#4DABF7' : colors.textSecondary}
                        />
                        <Text
                          style={{
                            fontFamily: isSel ? F.sansBold : F.sans,
                            fontSize: 11,
                            color: isSel ? '#4DABF7' : colors.textPrimary,
                          }}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* OPTIONAL NOTES */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  ADDITIONAL NOTES (OPTIONAL)
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  placeholder="e.g. HSC Exams from Sept 1st to 15th"
                  placeholderTextColor={colors.textMuted}
                  value={reasonNotes}
                  onChangeText={setReasonNotes}
                />

                {/* LIVE MATH PROJECTION CARD */}
                {projectedDates && (
                  <View style={[styles.summaryCard, { backgroundColor: colors.glassFill, borderColor: colors.border, marginTop: 12 }]}>
                    <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>PROJECTION SUMMARY</Text>

                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Current Expiry:</Text>
                      <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{projectedDates.oldEndDate}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tentative Return:</Text>
                      <Text style={[styles.summaryVal, { color: '#4DABF7' }]}>{projectedDates.tentativeReturnDate}</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.summaryRow}>
                      <Text style={[styles.grandLabel, { color: colors.textPrimary }]}>Projected New Expiry:</Text>
                      <Text style={[styles.grandVal, { color: colors.primary }]}>{projectedDates.newProjectedEndDate}</Text>
                    </View>
                  </View>
                )}

                {/* CONFIRM FREEZE BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  onPress={handleConfirmFreeze}
                  style={[styles.actionBtn, { backgroundColor: '#4DABF7', marginTop: 18 }]}>
                  <MaterialIcons name="pause" size={20} color="#000" />
                  <Text style={[styles.actionBtnText, { color: '#000' }]}>
                    {isSubmitting ? 'Freezing...' : `Confirm ${selectedDays}-Day Pause`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  sheetSub: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  infoCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  presetPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: F.sans,
  },
  summaryCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  cardHeading: {
    fontSize: 9,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  summaryVal: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  grandLabel: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  grandVal: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
});
