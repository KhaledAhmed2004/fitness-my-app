/**
 * Trainer Schedule Modal — Daily Appointment & Session Scheduler
 * Morning/Evening Time Blocks, 1-Tap Attendance Punch, New Slot Booking
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import type {
  TrainerAppointmentSlot,
  SessionPeriod,
  SessionType,
  AppointmentStatus,
} from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const TIME_SLOT_OPTIONS = [
  '06:00 AM - 07:00 AM',
  '07:00 AM - 08:00 AM',
  '08:30 AM - 09:30 AM',
  '10:00 AM - 11:00 AM',
  '04:00 PM - 05:00 PM',
  '05:30 PM - 06:30 PM',
  '07:00 PM - 08:00 PM',
  '08:30 PM - 09:30 PM',
];

export function TrainerScheduleModal({ visible, onClose }: Props) {
  const {
    appointments,
    selectedDate,
    setSelectedDate,
    punchAttendance,
    updateAppointmentStatus,
    addAppointment,
    deleteAppointment,
  } = useTrainerStore();

  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  // New Booking State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOT_OPTIONS[1]);
  const [sessionPeriod, setSessionPeriod] = useState<SessionPeriod>('MORNING');
  const [sessionType, setSessionType] = useState<SessionType>('1_ON_1_PT');
  const [targetFocus, setTargetFocus] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Filter slots by selected date
  const filteredSlots = appointments.filter((s) => s.date === selectedDate);
  const morningSlots = filteredSlots.filter((s) => s.period === 'MORNING');
  const eveningSlots = filteredSlots.filter((s) => s.period === 'EVENING' || s.period === 'AFTERNOON');

  const totalSlots = filteredSlots.length;
  const completedSlots = filteredSlots.filter((s) => s.status === 'COMPLETED').length;
  const pendingSlots = totalSlots - completedSlots;
  const complianceRate = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  const handlePunchAttendance = async (slotId: string, client: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await punchAttendance(slotId);
  };

  const handleSaveBooking = async () => {
    if (!clientName.trim()) {
      Alert.alert('Missing Field', 'Please enter client name.');
      return;
    }
    if (!targetFocus.trim()) {
      Alert.alert('Missing Field', 'Please enter target workout focus.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await addAppointment({
      clientId: `client_${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      period: sessionPeriod,
      sessionType,
      targetFocus: targetFocus.trim(),
      status: 'SCHEDULED',
      sessionNotes: sessionNotes.trim() || undefined,
    });

    // Reset
    setClientName('');
    setClientPhone('');
    setTargetFocus('');
    setSessionNotes('');
    setBookingModalVisible(false);
  };

  const renderSlotCard = (slot: TrainerAppointmentSlot) => {
    const isCompleted = slot.status === 'COMPLETED';
    const isCancelled = slot.status === 'CANCELLED';

    const getSessionTypeBadge = () => {
      switch (slot.sessionType) {
        case '1_ON_1_PT':
          return { label: '1-on-1 PT', color: '#00B4D8', bg: 'rgba(0, 180, 216, 0.15)' };
        case 'ASSESSMENT':
          return { label: 'Body Comp Assessment', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.15)' };
        case 'FORM_CHECK':
          return { label: 'Form Check', color: '#89FE00', bg: 'rgba(137, 254, 0, 0.15)' };
        default:
          return { label: 'Consultation', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' };
      }
    };

    const typeBadge = getSessionTypeBadge();

    return (
      <View
        key={slot.id}
        style={[
          styles.slotCard,
          isCompleted && styles.slotCardCompleted,
          isCancelled && styles.slotCardCancelled,
        ]}>
        <View style={styles.slotHeader}>
          <View style={styles.timeBadge}>
            <MaterialIcons name="schedule" size={14} color="#00B4D8" />
            <Text style={styles.timeBadgeText}>{slot.timeSlot}</Text>
          </View>

          <View style={[styles.typeBadge, { backgroundColor: typeBadge.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>
              {typeBadge.label}
            </Text>
          </View>
        </View>

        <View style={styles.clientRow}>
          <View style={styles.clientAvatarCircle}>
            <Text style={styles.clientAvatarText}>
              {slot.clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientNameText}>{slot.clientName}</Text>
            {slot.clientPhone ? (
              <Text style={styles.clientPhoneText}>📞 {slot.clientPhone}</Text>
            ) : null}
          </View>

          {/* ATTENDANCE PUNCH STATUS */}
          {isCompleted ? (
            <View style={styles.punchedBadge}>
              <MaterialIcons name="check-circle" size={16} color="#89FE00" />
              <Text style={styles.punchedBadgeText}>Punched {slot.attendancePunchedAt || ''}</Text>
            </View>
          ) : isCancelled ? (
            <View style={styles.cancelledBadge}>
              <MaterialIcons name="cancel" size={16} color="#FF5C5C" />
              <Text style={styles.cancelledBadgeText}>Cancelled</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePunchAttendance(slot.id, slot.clientName)}
              style={styles.punchBtn}>
              <MaterialIcons name="touch-app" size={16} color="#002233" />
              <Text style={styles.punchBtnText}>Punch In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* WORKOUT FOCUS & NOTES */}
        <View style={styles.focusBox}>
          <Text style={styles.focusLabel}>Target Focus:</Text>
          <Text style={styles.focusValue}>{slot.targetFocus}</Text>
          {slot.sessionNotes ? (
            <Text style={styles.notesText}>📝 {slot.sessionNotes}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons name="calendar-month" size={22} color="#89FE00" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Daily Session Schedule</Text>
                <Text style={styles.modalSubtitle}>Morning & Evening Client Appointments</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* STATS BENTO */}
            <View style={styles.statsBento}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalSlots}</Text>
                <Text style={styles.statLabel}>Total Slots</Text>
              </View>
              <View style={[styles.statBox, { borderColor: 'rgba(137, 254, 0, 0.25)' }]}>
                <Text style={[styles.statValue, { color: '#89FE00' }]}>{completedSlots}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#00B4D8' }]}>{pendingSlots}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#FFB800' }]}>{complianceRate}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
            </View>

            {/* ACTION ROW */}
            <View style={styles.actionRow}>
              <View style={styles.dateChip}>
                <MaterialIcons name="today" size={16} color="#00B4D8" />
                <Text style={styles.dateChipText}>Today ({selectedDate})</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setBookingModalVisible(true)}
                style={styles.addSlotBtn}>
                <MaterialIcons name="add" size={18} color="#002233" />
                <Text style={styles.addSlotBtnText}>+ Book Session</Text>
              </TouchableOpacity>
            </View>

            {/* 🌅 MORNING TIME BLOCK */}
            <View style={styles.blockSection}>
              <View style={styles.blockHeader}>
                <MaterialIcons name="wb-sunny" size={18} color="#FFB800" />
                <Text style={styles.blockTitle}>MORNING SLOTS (06:00 AM – 11:30 AM)</Text>
                <View style={styles.slotCountBadge}>
                  <Text style={styles.slotCountText}>{morningSlots.length} Sessions</Text>
                </View>
              </View>

              {morningSlots.length > 0 ? (
                morningSlots.map(renderSlotCard)
              ) : (
                <View style={styles.emptySlotBox}>
                  <Text style={styles.emptySlotText}>No morning client sessions booked.</Text>
                </View>
              )}
            </View>

            {/* 🌆 EVENING TIME BLOCK */}
            <View style={styles.blockSection}>
              <View style={styles.blockHeader}>
                <MaterialIcons name="nights-stay" size={18} color="#A78BFA" />
                <Text style={styles.blockTitle}>EVENING SLOTS (04:00 PM – 10:00 PM)</Text>
                <View style={styles.slotCountBadge}>
                  <Text style={styles.slotCountText}>{eveningSlots.length} Sessions</Text>
                </View>
              </View>

              {eveningSlots.length > 0 ? (
                eveningSlots.map(renderSlotCard)
              ) : (
                <View style={styles.emptySlotBox}>
                  <Text style={styles.emptySlotText}>No evening client sessions booked.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* BOOK NEW SESSION MODAL */}
      <Modal visible={bookingModalVisible} animationType="fade" transparent onRequestClose={() => setBookingModalVisible(false)}>
        <View style={styles.bookingBackdrop}>
          <View style={styles.bookingCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Client PT Session</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Client Full Name *</Text>
              <TextInput
                value={clientName}
                onChangeText={setClientName}
                placeholder="e.g. Tanvir Ahmed"
                placeholderTextColor={C.outline}
                style={styles.textInput}
              />

              <Text style={styles.inputLabel}>Client Phone (Optional)</Text>
              <TextInput
                value={clientPhone}
                onChangeText={setClientPhone}
                placeholder="e.g. +880 1712-345678"
                placeholderTextColor={C.outline}
                keyboardType="phone-pad"
                style={styles.textInput}
              />

              <Text style={styles.inputLabel}>Time Period</Text>
              <View style={styles.chipsRow}>
                {(['MORNING', 'EVENING'] as SessionPeriod[]).map((period) => (
                  <TouchableOpacity
                    key={period}
                    onPress={() => setSessionPeriod(period)}
                    style={[
                      styles.periodChip,
                      sessionPeriod === period && styles.periodChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.periodChipText,
                        sessionPeriod === period && styles.periodChipTextActive,
                      ]}>
                      {period === 'MORNING' ? '🌅 Morning' : '🌆 Evening'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Time Slot</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {TIME_SLOT_OPTIONS.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedTimeSlot(slot)}
                    style={[
                      styles.slotOptionChip,
                      selectedTimeSlot === slot && styles.slotOptionChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.slotOptionChipText,
                        selectedTimeSlot === slot && styles.slotOptionChipTextActive,
                      ]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Target Workout Focus *</Text>
              <TextInput
                value={targetFocus}
                onChangeText={setTargetFocus}
                placeholder="e.g. Heavy Squats & Core Hypertrophy"
                placeholderTextColor={C.outline}
                style={styles.textInput}
              />

              <Text style={styles.inputLabel}>Coaching Notes (Optional)</Text>
              <TextInput
                value={sessionNotes}
                onChangeText={setSessionNotes}
                placeholder="e.g. 90s rest, focus on depth"
                placeholderTextColor={C.outline}
                style={styles.textInput}
              />

              <TouchableOpacity activeOpacity={0.8} onPress={handleSaveBooking} style={styles.saveBookingBtn}>
                <MaterialIcons name="check" size={18} color="#002233" />
                <Text style={styles.saveBookingBtnText}>Confirm & Book Session</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  statsBento: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    fontSize: 17,
    fontFamily: F.monoBold,
    color: C.onSurface,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dateChipText: {
    fontSize: 12,
    fontFamily: F.sansSemiBold,
    color: '#00B4D8',
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addSlotBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#002233',
  },
  blockSection: {
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTitle: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
    flex: 1,
  },
  slotCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotCountText: {
    fontSize: 11,
    fontFamily: F.mono,
    color: C.onSurfaceVariant,
  },
  slotCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 10,
  },
  slotCardCompleted: {
    borderColor: 'rgba(137, 254, 0, 0.3)',
    backgroundColor: 'rgba(137, 254, 0, 0.03)',
  },
  slotCardCancelled: {
    borderColor: 'rgba(255, 92, 92, 0.3)',
    opacity: 0.6,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    fontFamily: F.monoBold,
    color: '#00B4D8',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  clientAvatarText: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: '#89FE00',
  },
  clientNameText: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  clientPhoneText: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  punchBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#002233',
  },
  punchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  punchedBadgeText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: '#89FE00',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: '#FF5C5C',
  },
  focusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  focusLabel: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: C.onSurfaceVariant,
  },
  focusValue: {
    fontSize: 13,
    fontFamily: F.sansMedium,
    color: C.onSurface,
  },
  notesText: {
    fontSize: 12,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptySlotBox: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptySlotText: {
    fontSize: 13,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
  },

  // BOOKING MODAL
  bookingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: F.sans,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  periodChipActive: {
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    borderColor: '#89FE00',
  },
  periodChipText: {
    fontSize: 13,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
  },
  periodChipTextActive: {
    color: '#89FE00',
  },
  slotOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slotOptionChipActive: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderColor: '#00B4D8',
  },
  slotOptionChipText: {
    fontSize: 12,
    fontFamily: F.mono,
    color: C.onSurfaceVariant,
  },
  slotOptionChipTextActive: {
    color: '#00B4D8',
    fontFamily: F.monoBold,
  },
  saveBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 16,
  },
  saveBookingBtnText: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: '#002233',
  },
});
