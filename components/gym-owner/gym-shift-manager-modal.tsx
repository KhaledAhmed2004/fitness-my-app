import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { DayOfWeek, GymShiftScheduleItem, GymShiftType } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALL_DAYS: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymShiftManagerModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    gymProfile,
    updateGymShifts,
    addGymShift,
    deleteGymShift,
    getCurrentShiftStatus,
    generateWhatsAppShiftSchedule,
  } = useGymOwnerStore();

  const shifts = useMemo(() => gymProfile.shifts || [], [gymProfile.shifts]);
  const currentStatus = useMemo(() => getCurrentShiftStatus(), [getCurrentShiftStatus, shifts]);

  // Form State for Add / Edit Shift
  const [formVisible, setFormVisible] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [shiftType, setShiftType] = useState<GymShiftType>('LADIES_ONLY');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT']);
  const [notes, setNotes] = useState('');

  const openAddForm = () => {
    setEditingShiftId(null);
    setName('');
    setShiftType('LADIES_ONLY');
    setStartTime('10:00');
    setEndTime('13:00');
    setSelectedDays(['SUN', 'MON', 'TUE', 'WED', 'THU', 'SAT']);
    setNotes('');
    setFormVisible(true);
  };

  const openEditForm = (shift: GymShiftScheduleItem) => {
    setEditingShiftId(shift.id);
    setName(shift.name);
    setShiftType(shift.shiftType);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setSelectedDays(shift.daysApplicable);
    setNotes(shift.notes || '');
    setFormVisible(true);
  };

  const handleToggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        Alert.alert('Selection Error', 'A shift must be applicable on at least 1 day.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveShift = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter a name for the shift (e.g. Morning Ladies Prime).');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert('Missing Field', 'Please specify valid start and end times (e.g. 10:00 and 13:00).');
      return;
    }

    const allowedGenders: ('MALE' | 'FEMALE' | 'OTHER')[] =
      shiftType === 'LADIES_ONLY'
        ? ['FEMALE']
        : shiftType === 'GENTS_ONLY'
        ? ['MALE']
        : ['MALE', 'FEMALE', 'OTHER'];

    if (editingShiftId) {
      const updated = shifts.map((s) =>
        s.id === editingShiftId
          ? {
              ...s,
              name: name.trim(),
              shiftType,
              allowedGenders,
              startTime: startTime.trim(),
              endTime: endTime.trim(),
              daysApplicable: selectedDays,
              notes: notes.trim() || undefined,
            }
          : s
      );
      await updateGymShifts(updated);
    } else {
      await addGymShift({
        name: name.trim(),
        shiftType,
        allowedGenders,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        daysApplicable: selectedDays,
        isActive: true,
        notes: notes.trim() || undefined,
      });
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setFormVisible(false);
  };

  const handleToggleActive = async (shiftId: string, currentVal: boolean) => {
    const updated = shifts.map((s) => (s.id === shiftId ? { ...s, isActive: !currentVal } : s));
    await updateGymShifts(updated);
  };

  const handleDeleteShift = (shift: GymShiftScheduleItem) => {
    Alert.alert('Delete Shift', `Are you sure you want to delete "${shift.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGymShift(shift.id);
        },
      },
    ]);
  };

  const handleSendWhatsAppBroadcast = () => {
    const message = generateWhatsAppShiftSchedule();
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    void Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        void Linking.openURL(webUrl);
      }
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER BAR */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.iconFrame, { backgroundColor: 'rgba(230, 73, 128, 0.15)' }]}>
              <MaterialIcons name="schedule" size={20} color="#E64980" />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Shift & Ladies Hour Guard</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Floor Access Control & Gender Timing Radar
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* LIVE SHIFT RADAR HERO */}
          <View
            style={[
              styles.radarCard,
              {
                backgroundColor: isDark ? '#14171E' : '#F1F3F5',
                borderColor:
                  currentStatus.shiftType === 'LADIES_ONLY'
                    ? '#E64980'
                    : currentStatus.shiftType === 'GENTS_ONLY'
                    ? '#339AF0'
                    : colors.primary,
              },
            ]}>
            <View style={styles.radarHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>{currentStatus.badgeEmoji}</Text>
                <Text
                  style={[
                    styles.radarTag,
                    {
                      color:
                        currentStatus.shiftType === 'LADIES_ONLY'
                          ? '#E64980'
                          : currentStatus.shiftType === 'GENTS_ONLY'
                          ? '#339AF0'
                          : colors.primary,
                    },
                  ]}>
                  {currentStatus.shiftType.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE NOW</Text>
              </View>
            </View>

            <Text style={[styles.radarShiftName, { color: colors.textPrimary }]}>{currentStatus.label}</Text>

            {currentStatus.currentShift ? (
              <View style={styles.radarTimeRow}>
                <MaterialIcons name="access-time" size={14} color={colors.textSecondary} />
                <Text style={[styles.radarTimeText, { color: colors.textSecondary }]}>
                  {currentStatus.currentShift.startTime} – {currentStatus.currentShift.endTime} (
                  {currentStatus.remainingMinutes} mins remaining)
                </Text>
              </View>
            ) : (
              <Text style={[styles.radarTimeText, { color: colors.textSecondary }]}>
                No restricted gender shift currently active.
              </Text>
            )}

            {currentStatus.nextShift && (
              <View style={[styles.nextShiftStrip, { backgroundColor: isDark ? '#1A1E26' : '#E9ECEF' }]}>
                <Text style={[styles.nextShiftText, { color: colors.textPrimary }]}>
                  👉 Next Shift: <Text style={{ fontFamily: F.sansBold }}>{currentStatus.nextShift.name}</Text> (
                  {currentStatus.nextShift.startTime}) in {currentStatus.nextShiftStartsInMinutes}m
                </Text>
              </View>
            )}
          </View>

          {/* ACTIONS ROW */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openAddForm}
              style={[styles.addShiftBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="add" size={18} color="#000" />
              <Text style={styles.addShiftBtnText}>+ Add New Shift</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendWhatsAppBroadcast}
              style={[styles.whatsappBtn, { backgroundColor: '#25D366' }]}>
              <MaterialIcons name="chat" size={18} color="#FFF" />
              <Text style={styles.whatsappBtnText}>Broadcast Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* SHIFT LIST */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Configured Gym Shifts ({shifts.length})
          </Text>

          {shifts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="event-busy" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No shifts configured yet.</Text>
            </View>
          ) : (
            shifts.map((shift) => {
              const isLadies = shift.shiftType === 'LADIES_ONLY';
              const isGents = shift.shiftType === 'GENTS_ONLY';
              const typeColor = isLadies ? '#E64980' : isGents ? '#339AF0' : '#40C057';

              return (
                <View
                  key={shift.id}
                  style={[
                    styles.shiftCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: shift.isActive ? 1 : 0.6,
                    },
                  ]}>
                  <View style={styles.shiftTopRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
                          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                            {isLadies ? '🚺 LADIES ONLY' : isGents ? '🚹 GENTS ONLY' : '🚻 UNISEX MIXED'}
                          </Text>
                        </View>
                        <Text style={[styles.timeBadge, { color: colors.textPrimary }]}>
                          {shift.startTime} – {shift.endTime}
                        </Text>
                      </View>
                      <Text style={[styles.shiftCardName, { color: colors.textPrimary }]}>{shift.name}</Text>
                      {shift.notes ? (
                        <Text style={[styles.shiftCardNotes, { color: colors.textSecondary }]}>{shift.notes}</Text>
                      ) : null}
                    </View>

                    <Switch
                      value={shift.isActive}
                      onValueChange={() => handleToggleActive(shift.id, shift.isActive)}
                      trackColor={{ false: '#767577', true: colors.primary }}
                      thumbColor={shift.isActive ? '#000' : '#f4f3f4'}
                    />
                  </View>

                  {/* DAYS CHIPS */}
                  <View style={styles.daysRow}>
                    {ALL_DAYS.map((d) => {
                      const isSel = shift.daysApplicable.includes(d);
                      return (
                        <View
                          key={d}
                          style={[
                            styles.dayMiniChip,
                            isSel
                              ? { backgroundColor: typeColor, borderColor: typeColor }
                              : { backgroundColor: 'transparent', borderColor: colors.border },
                          ]}>
                          <Text
                            style={[
                              styles.dayMiniChipText,
                              { color: isSel ? '#FFF' : colors.textSecondary },
                            ]}>
                            {d}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* SHIFT ACTIONS */}
                  <View style={[styles.shiftActionsRow, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => openEditForm(shift)}
                      style={styles.editBtn}>
                      <MaterialIcons name="edit" size={14} color={colors.primary} />
                      <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Timing</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteShift(shift)} style={styles.delBtn}>
                      <MaterialIcons name="delete-outline" size={14} color="#FA5252" />
                      <Text style={styles.delBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ADD / EDIT SHIFT MODAL */}
        <Modal visible={formVisible} animationType="fade" transparent onRequestClose={() => setFormVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                  {editingShiftId ? 'Edit Shift Schedule' : 'Create New Gym Shift'}
                </Text>
                <TouchableOpacity onPress={() => setFormVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* NAME */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHIFT NAME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Morning Ladies Prime"
                  placeholderTextColor={colors.textSecondary}
                />

                {/* TYPE SELECTOR */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GENDER ACCESS TYPE</Text>
                <View style={styles.typeSelectorRow}>
                  {(['LADIES_ONLY', 'GENTS_ONLY', 'UNISEX_MIXED'] as GymShiftType[]).map((t) => {
                    const sel = shiftType === t;
                    const c = t === 'LADIES_ONLY' ? '#E64980' : t === 'GENTS_ONLY' ? '#339AF0' : '#40C057';
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setShiftType(t)}
                        style={[
                          styles.typeOption,
                          sel
                            ? { backgroundColor: c, borderColor: c }
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}>
                        <Text style={[styles.typeOptionText, { color: sel ? '#FFF' : colors.textPrimary }]}>
                          {t === 'LADIES_ONLY' ? '🚺 Ladies' : t === 'GENTS_ONLY' ? '🚹 Gents' : '🚻 Unisex'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* TIMINGS (24h) */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>START TIME (HH:mm)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="10:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>END TIME (HH:mm)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="13:00"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                {/* DAYS OF WEEK */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>APPLICABLE DAYS</Text>
                <View style={styles.daysPickRow}>
                  {ALL_DAYS.map((d) => {
                    const sel = selectedDays.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => handleToggleDay(d)}
                        style={[
                          styles.dayPickChip,
                          sel
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}>
                        <Text style={[styles.dayPickText, { color: sel ? '#000' : colors.textPrimary }]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* NOTES */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>NOTES (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Female trainer on floor"
                  placeholderTextColor={colors.textSecondary}
                />
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveShift}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.saveBtnText}>{editingShiftId ? 'Update Shift' : 'Save Shift'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconFrame: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  radarCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radarTag: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(64, 192, 87, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#40C057',
  },
  liveText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#40C057',
  },
  radarShiftName: {
    fontSize: 18,
    fontFamily: F.sansBold,
    marginTop: 6,
  },
  radarTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  radarTimeText: {
    fontSize: 12,
    fontFamily: F.sans,
  },
  nextShiftStrip: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  nextShiftText: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  addShiftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addShiftBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#000',
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: F.sans,
  },
  shiftCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  shiftTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  timeBadge: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  shiftCardName: {
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 4,
  },
  shiftCardNotes: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
  },
  dayMiniChip: {
    width: 32,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayMiniChipText: {
    fontSize: 8,
    fontFamily: F.monoBold,
  },
  shiftActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  delBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#FA5252',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formContainer: {
    width: Math.min(SCREEN_WIDTH - 32, 400),
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: F.monoBold,
    marginBottom: 4,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    fontFamily: F.sans,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  daysPickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  dayPickChip: {
    width: 44,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPickText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: '#000',
  },
});
