import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymDietPlanTemplate, GymWorkoutRoutineTemplate } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
  initialMemberId?: string;
};

export function GymDietRoutinePrescriberModal({ visible, onClose, initialMemberId }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    dietPlans,
    workoutRoutines,
    members,
    gymProfile,
    prescribeDietAndRoutine,
    generateWhatsAppDietChart,
    generateWhatsAppWorkoutRoutine,
  } = useGymOwnerStore();

  const [activeTab, setActiveTab] = useState<'DIET_PLANS' | 'ROUTINES' | 'PRESCRIBE'>('DIET_PLANS');

  // Prescribe Tab State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (members.length > 0 ? members[0].id : '')
  );
  const [selectedDietId, setSelectedDietId] = useState<string>(dietPlans.length > 0 ? dietPlans[0].id : '');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    workoutRoutines.length > 0 ? workoutRoutines[0].id : ''
  );
  const [coachNotes, setCoachNotes] = useState<string>('Drink 3.5L water daily. Strictly avoid sugar and fried snacks.');

  // Preview & Send Sub-Modal State
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [previewType, setPreviewType] = useState<'DIET' | 'ROUTINE'>('DIET');

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const currentDiet = dietPlans.find((d) => d.id === selectedDietId) || dietPlans[0];
  const currentRoutine = workoutRoutines.find((r) => r.id === selectedRoutineId) || workoutRoutines[0];

  const handleOpenDietPreview = (diet: GymDietPlanTemplate, memberId?: string) => {
    const targetMember = members.find((m) => m.id === (memberId || selectedMemberId)) || members[0];
    const msg = generateWhatsAppDietChart(targetMember.id, diet.id, coachNotes);
    setPreviewText(msg);
    setPreviewType('DIET');
    setPreviewModalVisible(true);
  };

  const handleOpenRoutinePreview = (routine: GymWorkoutRoutineTemplate, memberId?: string) => {
    const targetMember = members.find((m) => m.id === (memberId || selectedMemberId)) || members[0];
    const msg = generateWhatsAppWorkoutRoutine(targetMember.id, routine.id, coachNotes);
    setPreviewText(msg);
    setPreviewType('ROUTINE');
    setPreviewModalVisible(true);
  };

  const handleSendWhatsApp = () => {
    if (!currentMember) return;
    const cleanPhone = currentMember.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(previewText)}`;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Save prescription to member profile
    void prescribeDietAndRoutine(
      currentMember.id,
      previewType === 'DIET' ? selectedDietId : undefined,
      previewType === 'ROUTINE' ? selectedRoutineId : undefined,
      coachNotes
    );

    setPreviewModalVisible(false);

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Prescription Ready', previewText);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
  };

  const handleSavePrescription = async () => {
    if (!currentMember) return;
    await prescribeDietAndRoutine(currentMember.id, selectedDietId, selectedRoutineId, coachNotes);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Prescription Saved! 📋',
      `Assigned "${currentDiet.title}" & "${currentRoutine.title}" to ${currentMember.fullName}.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
              <MaterialIcons name="restaurant-menu" size={22} color="#40C057" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Diet & Workout Prescriber
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Desi Macro-Budget Plans & Multi-Split Routines
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* NAVIGATION TABS */}
        <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('DIET_PLANS')}
            style={[
              styles.tabBtn,
              activeTab === 'DIET_PLANS' && { borderBottomColor: '#40C057', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="local-dining"
              size={18}
              color={activeTab === 'DIET_PLANS' ? '#40C057' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'DIET_PLANS' ? '#40C057' : colors.textSecondary },
              ]}>
              Desi Diets ({dietPlans.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('ROUTINES')}
            style={[
              styles.tabBtn,
              activeTab === 'ROUTINES' && { borderBottomColor: '#339AF0', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="fitness-center"
              size={18}
              color={activeTab === 'ROUTINES' ? '#339AF0' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'ROUTINES' ? '#339AF0' : colors.textSecondary },
              ]}>
              Routines ({workoutRoutines.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('PRESCRIBE')}
            style={[
              styles.tabBtn,
              activeTab === 'PRESCRIBE' && { borderBottomColor: '#FF6B6B', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="send"
              size={18}
              color={activeTab === 'PRESCRIBE' ? '#FF6B6B' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'PRESCRIBE' ? '#FF6B6B' : colors.textSecondary },
              ]}>
              Prescribe & Send
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: DESI DIET PLANS CATALOG */}
        {activeTab === 'DIET_PLANS' && (
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {dietPlans.map((diet) => (
              <View
                key={diet.id}
                style={[styles.catalogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{diet.title}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{diet.description}</Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
                    <Text style={{ fontSize: 10, fontFamily: F.bold, color: '#40C057' }}>
                      {diet.category}
                    </Text>
                  </View>
                </View>

                {/* Macro & Budget Stats */}
                <View style={[styles.macroRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroVal, { color: '#FF6B6B' }]}>~{diet.dailyCalories} kcal</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Daily Energy</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroVal, { color: '#339AF0' }]}>~{diet.dailyProteinGrams}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>High Protein</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroVal, { color: '#FCC419' }]}>{diet.budgetType.replace('_', ' ')}</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Budget Tier</Text>
                  </View>
                </View>

                {/* Meals Breakdown Preview */}
                <View style={styles.mealsContainer}>
                  {diet.meals.map((m, idx) => (
                    <View key={idx} style={[styles.mealItemBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.mealTitleText, { color: colors.textPrimary }]}>
                        {m.title} (~{m.approxCalories} kcal • {m.proteinGrams}g P)
                      </Text>
                      {m.itemsBengali.map((food, fIdx) => (
                        <Text key={fIdx} style={[styles.foodItemText, { color: colors.textSecondary }]}>
                          • {food}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>

                {/* Quick Action Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedDietId(diet.id);
                    handleOpenDietPreview(diet);
                  }}
                  style={[styles.quickSendBtn, { backgroundColor: '#25D366' }]}>
                  <MaterialIcons name="chat" size={16} color="#FFF" />
                  <Text style={styles.quickSendBtnText}>1-Tap WhatsApp Preview & Send</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 2: WORKOUT ROUTINES CATALOG */}
        {activeTab === 'ROUTINES' && (
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {workoutRoutines.map((routine) => (
              <View
                key={routine.id}
                style={[styles.catalogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{routine.title}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                      Level: {routine.experienceLevel} • Target: {routine.targetGender} Athletes
                    </Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: 'rgba(51, 154, 240, 0.15)' }]}>
                    <Text style={{ fontSize: 10, fontFamily: F.bold, color: '#339AF0' }}>
                      {routine.splitType}
                    </Text>
                  </View>
                </View>

                {/* Days Schedule Breakdown */}
                <View style={styles.mealsContainer}>
                  {routine.daysSchedule.map((day, dIdx) => (
                    <View key={dIdx} style={[styles.mealItemBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.mealTitleText, { color: '#339AF0' }]}>{day.dayName}</Text>
                      {day.exercises.map((ex, eIdx) => (
                        <Text key={eIdx} style={[styles.foodItemText, { color: colors.textPrimary }]}>
                          {eIdx + 1}. {ex.name} — <Text style={{ fontFamily: F.bold, color: colors.textSecondary }}>{ex.setsReps}</Text>
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>

                {/* Quick Action Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedRoutineId(routine.id);
                    handleOpenRoutinePreview(routine);
                  }}
                  style={[styles.quickSendBtn, { backgroundColor: '#339AF0' }]}>
                  <MaterialIcons name="send" size={16} color="#FFF" />
                  <Text style={styles.quickSendBtnText}>1-Tap WhatsApp Preview & Send</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 3: PRESCRIBE TO MEMBER WORKFLOW */}
        {activeTab === 'PRESCRIBE' && (
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* STEP 1: SELECT MEMBER */}
            <View style={[styles.prescribeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>
                1. Select Member
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                {members.map((m) => {
                  const isSelected = m.id === selectedMemberId;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedMemberId(m.id);
                      }}
                      style={[
                        styles.memberOptionPill,
                        {
                          backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.15)' : colors.background,
                          borderColor: isSelected ? '#FF6B6B' : colors.border,
                        },
                      ]}>
                      <View style={[styles.pillAvatar, { backgroundColor: '#FF6B6B' }]}>
                        <Text style={styles.pillAvatarText}>{m.fullName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={[styles.pillName, { color: isSelected ? '#FF6B6B' : colors.textPrimary }]}>
                          {m.fullName}
                        </Text>
                        <Text style={[styles.pillSub, { color: colors.textSecondary }]}>
                          {m.gender} • Coach: {m.assignedTrainerName ? m.assignedTrainerName.split(' ')[0] : 'Floor'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* STEP 2: CHOOSE DIET PLAN */}
            <View style={[styles.prescribeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>
                2. Select Desi Diet Plan
              </Text>
              <View style={{ gap: 6, marginTop: 8 }}>
                {dietPlans.map((diet) => {
                  const isSelected = diet.id === selectedDietId;
                  return (
                    <TouchableOpacity
                      key={diet.id}
                      onPress={() => setSelectedDietId(diet.id)}
                      style={[
                        styles.selectPlanRow,
                        {
                          backgroundColor: isSelected ? 'rgba(64, 192, 87, 0.15)' : colors.background,
                          borderColor: isSelected ? '#40C057' : colors.border,
                        },
                      ]}>
                      <MaterialIcons
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={isSelected ? '#40C057' : colors.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectPlanTitle, { color: isSelected ? '#40C057' : colors.textPrimary }]}>
                          {diet.title}
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: F.regular, color: colors.textSecondary }}>
                          ~{diet.dailyCalories} kcal • {diet.dailyProteinGrams}g Protein
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 3: CHOOSE WORKOUT ROUTINE */}
            <View style={[styles.prescribeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>
                3. Select Workout Routine
              </Text>
              <View style={{ gap: 6, marginTop: 8 }}>
                {workoutRoutines.map((routine) => {
                  const isSelected = routine.id === selectedRoutineId;
                  return (
                    <TouchableOpacity
                      key={routine.id}
                      onPress={() => setSelectedRoutineId(routine.id)}
                      style={[
                        styles.selectPlanRow,
                        {
                          backgroundColor: isSelected ? 'rgba(51, 154, 240, 0.15)' : colors.background,
                          borderColor: isSelected ? '#339AF0' : colors.border,
                        },
                      ]}>
                      <MaterialIcons
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                        size={20}
                        color={isSelected ? '#339AF0' : colors.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectPlanTitle, { color: isSelected ? '#339AF0' : colors.textPrimary }]}>
                          {routine.title}
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: F.regular, color: colors.textSecondary }}>
                          Level: {routine.experienceLevel} • {routine.splitType}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 4: COACH PERSONAL NOTES */}
            <View style={[styles.prescribeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>
                4. Coach Special Guidance & Notes
              </Text>
              <TextInput
                value={coachNotes}
                onChangeText={setCoachNotes}
                multiline
                numberOfLines={2}
                placeholder="e.g. Drink 3.5L water daily, sleep 8 hours."
                placeholderTextColor={colors.textSecondary}
                style={[styles.notesInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              />
            </View>

            {/* ACTION DISPATCH BUTTONS */}
            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenDietPreview(currentDiet, currentMember.id)}
                style={[styles.primaryActionBtn, { backgroundColor: '#25D366' }]}>
                <MaterialIcons name="local-dining" size={20} color="#FFF" />
                <Text style={styles.primaryActionBtnText}>Dispatch Diet via WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenRoutinePreview(currentRoutine, currentMember.id)}
                style={[styles.primaryActionBtn, { backgroundColor: '#339AF0' }]}>
                <MaterialIcons name="fitness-center" size={20} color="#FFF" />
                <Text style={styles.primaryActionBtnText}>Dispatch Workout via WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSavePrescription}
                style={[styles.secondarySaveBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <MaterialIcons name="save" size={18} color={colors.textPrimary} />
                <Text style={[styles.secondarySaveBtnText, { color: colors.textPrimary }]}>
                  Save to Member Profile Record
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* PREVIEW & SEND SUB-MODAL */}
        <Modal
          visible={previewModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPreviewModalVisible(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>
                    {previewType === 'DIET' ? '🥗 Diet Chart Preview' : '🏋️ Workout Routine Preview'}
                  </Text>
                  <Text style={[styles.subModalSub, { color: colors.textSecondary }]}>
                    To: {currentMember?.fullName} ({currentMember?.phone})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TextInput
                value={previewText}
                onChangeText={setPreviewText}
                multiline
                numberOfLines={12}
                style={[styles.previewInputBox, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendWhatsApp}
                style={[styles.primaryActionBtn, { backgroundColor: '#25D366' }]}>
                <MaterialIcons name="send" size={18} color="#FFF" />
                <Text style={styles.primaryActionBtnText}>Open WhatsApp & Send</Text>
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
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  catalogCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  cardDesc: {
    fontSize: 11,
    fontFamily: F.regular,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  macroRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    borderWidth: 0.5,
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  macroVal: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  macroLabel: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  mealsContainer: {
    gap: 8,
  },
  mealItemBox: {
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  mealTitleText: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  foodItemText: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  quickSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  quickSendBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#FFF',
  },
  prescribeCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  stepHeading: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  memberOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillAvatarText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#FFF',
  },
  pillName: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  pillSub: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  selectPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectPlanTitle: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  notesInput: {
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    fontFamily: F.regular,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFF',
  },
  secondarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondarySaveBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  subModalContent: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subModalTitle: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  subModalSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  previewInputBox: {
    height: 240,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontFamily: F.regular,
    textAlignVertical: 'top',
  },
});
