import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import {
  PlanRepository,
  WorkoutPlan,
  FullWorkoutPlan,
  PlanDayWithExercises,
} from '@/repositories/plan.repository';
import { PlanExerciseEditorModal } from './plan-exercise-editor-modal';
import { EquipmentPlanWizardModal } from './equipment-plan-wizard-modal';

const C = Vital.colors;
const F = Vital.fonts;

interface PlanManagerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPlanChanged: () => void;
}

export function PlanManagerSheet({
  visible,
  onClose,
  onPlanChanged,
}: PlanManagerSheetProps) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<FullWorkoutPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCategory, setNewPlanCategory] = useState('HYPERTROPHY');
  const [newPlanDays, setNewPlanDays] = useState(3);

  // Exercise editor modal state
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorPlanId, setEditorPlanId] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      const all = await PlanRepository.getAllPlans();
      setPlans(all);
      const active = await PlanRepository.getActivePlan();
      if (active) setSelectedPlanDetails(active);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadPlans();
      setIsCreating(false);
    }
  }, [visible]);

  const handleActivatePlan = async (planId: string) => {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await PlanRepository.activatePlan(planId);
      await loadPlans();
      onPlanChanged();
    } catch (e) {
      Alert.alert('Error', 'Failed to activate plan.');
    }
  };

  const handleCreateCustomPlan = async () => {
    if (!newPlanName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your workout plan.');
      return;
    }

    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const planId = await PlanRepository.createPlan(
        newPlanName.trim(),
        'Custom personalized workout split',
        newPlanCategory,
        newPlanDays
      );

      // Create default days
      for (let i = 0; i < newPlanDays; i++) {
        await PlanRepository.addDayToPlan(
          planId,
          `Day ${i + 1} – Workout`,
          i * 2, // e.g. Mon, Wed, Fri
          'chest,back,legs',
          i
        );
      }

      await PlanRepository.activatePlan(planId);
      setIsCreating(false);
      setNewPlanName('');
      await loadPlans();
      onPlanChanged();
    } catch (e) {
      Alert.alert('Error', 'Failed to create plan.');
    }
  };

  const handleSelectPlanPreview = async (planId: string) => {
    const details = await PlanRepository.getPlanById(planId);
    setSelectedPlanDetails(details);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="fitness-center" size={20} color="#C8F135" />
              <Text style={styles.sheetTitle}>Workout Plans</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {/* Create Custom Plan Section Toggle */}
            {isCreating ? (
              <View style={styles.createFormContainer}>
                <Text style={styles.formTitle}>Create Custom Workout Plan</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PLAN NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Arnold Split, 4-Day Power"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={newPlanName}
                    onChangeText={setNewPlanName}
                  />
                </View>

                {/* Days Per Week Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DAYS PER WEEK</Text>
                  <View style={styles.daysPickerRow}>
                    {[2, 3, 4, 5, 6].map((num) => (
                      <TouchableOpacity
                        key={num}
                        activeOpacity={0.8}
                        onPress={() => setNewPlanDays(num)}
                        style={[
                          styles.daysNumBtn,
                          newPlanDays === num && styles.daysNumBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.daysNumText,
                            newPlanDays === num && styles.daysNumTextActive,
                          ]}>
                          {num} Days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Submit / Cancel Buttons */}
                <View style={styles.formActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsCreating(false)}
                    style={styles.cancelFormBtn}>
                    <Text style={styles.cancelFormBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleCreateCustomPlan}
                    style={styles.submitFormBtn}>
                    <Text style={styles.submitFormBtnText}>Save & Activate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.plansListSection}>
                {/* 🪄 Smart Equipment Plan Generator Banner */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setWizardVisible(true);
                  }}
                  style={styles.wizardBanner}>
                  <View style={styles.wizardLeft}>
                    <View style={styles.wizardIconCircle}>
                      <MaterialIcons name="auto-awesome" size={20} color="#101416" />
                    </View>
                    <View style={styles.wizardTextCol}>
                      <Text style={styles.wizardTitle}>Smart Plan Wizard</Text>
                      <Text style={styles.wizardSubtitle}>Build tailored split from your gym gear</Text>
                    </View>
                  </View>
                  <View style={styles.wizardArrowCircle}>
                    <MaterialIcons name="arrow-forward" size={16} color="#C8F135" />
                  </View>
                </TouchableOpacity>

                {/* Available Plans List */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionSubTitle}>MY ROUTINES & SPLITS</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsCreating(true)}
                    style={styles.addPlanSmallBtn}>
                    <MaterialIcons name="add" size={16} color="#C8F135" />
                    <Text style={styles.addPlanSmallBtnText}>New Plan</Text>
                  </TouchableOpacity>
                </View>

                {plans.map((p) => {
                  const isActive = p.is_active;
                  const isSelected = selectedPlanDetails?.id === p.id;

                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.85}
                      onPress={() => handleSelectPlanPreview(p.id)}
                      style={[
                        styles.planCard,
                        isActive && styles.planCardActive,
                        isSelected && styles.planCardSelected,
                      ]}>
                      <View style={styles.planCardTop}>
                        <View style={styles.planNameCol}>
                          <View style={styles.planTitleRow}>
                            <Text style={styles.planNameText}>{p.name}</Text>
                            {isActive ? (
                              <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                              </View>
                            ) : null}
                          </View>

                          {p.description ? (
                            <Text style={styles.planDescText} numberOfLines={2}>
                              {p.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.planCardBottom}>
                        <View style={styles.metaRow}>
                          <MaterialIcons name="calendar-today" size={13} color="#C8F135" />
                          <Text style={styles.metaText}>{p.days_per_week} days/week</Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.metaCategory}>{p.category}</Text>
                        </View>

                        {!isActive ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleActivatePlan(p.id)}
                            style={styles.activateBtn}>
                            <Text style={styles.activateBtnText}>Set Active</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.currentlyActiveIndicator}>
                            <MaterialIcons name="check-circle" size={16} color="#C8F135" />
                            <Text style={styles.currentlyActiveText}>Current Split</Text>
                          </View>
                        )}
                      </View>

                      {/* Expanded Plan Days Preview if selected */}
                      {isSelected && selectedPlanDetails?.days ? (
                        <View style={styles.planDaysPreviewBox}>
                          <Text style={styles.daysPreviewTitle}>WORKOUT DAYS IN THIS SPLIT:</Text>
                          {selectedPlanDetails.days.map((day, idx) => (
                            <View key={day.id} style={styles.dayPreviewRow}>
                              <View style={styles.dayIndexCircle}>
                                <Text style={styles.dayIndexText}>{idx + 1}</Text>
                              </View>
                              <View style={styles.dayPreviewMeta}>
                                <Text style={styles.dayPreviewLabel}>{day.day_label}</Text>
                                <Text style={styles.dayPreviewExercisesCount}>
                                  {day.exercises.length} exercises (
                                  {day.exercises.slice(0, 3).map((e) => e.exercise_name).join(', ')}
                                  {day.exercises.length > 3 ? '...' : ''})
                                </Text>
                              </View>
                            </View>
                          ))}

                          {/* Action to customize exercises & routines */}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                              setEditorPlanId(p.id);
                              setEditorVisible(true);
                            }}
                            style={styles.editPlanExercisesBtn}>
                            <MaterialIcons name="edit" size={15} color="#101416" />
                            <Text style={styles.editPlanExercisesBtnText}>Customize Exercises & Sets</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Plan & Exercise Full-Screen Editor */}
          <PlanExerciseEditorModal
            visible={editorVisible}
            planId={editorPlanId}
            onClose={() => setEditorVisible(false)}
            onPlanUpdated={async () => {
              await loadPlans();
              onPlanChanged();
            }}
          />

          {/* Smart Plan Equipment Wizard Modal */}
          <EquipmentPlanWizardModal
            visible={wizardVisible}
            onClose={() => setWizardVisible(false)}
            onPlanGenerated={async () => {
              await loadPlans();
              onPlanChanged();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#12161A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    padding: 18,
  },
  wizardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(200, 241, 53, 0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200, 241, 53, 0.35)',
    marginBottom: 16,
  },
  wizardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  wizardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C8F135',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardTextCol: {
    flex: 1,
    gap: 2,
  },
  wizardTitle: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  wizardSubtitle: {
    fontFamily: F.sans,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  wizardArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(200, 241, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionSubTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.5)',
  },
  addPlanSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200,241,53,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(200,241,53,0.25)',
  },
  addPlanSmallBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#C8F135',
  },
  plansListSection: {
    gap: 12,
    paddingBottom: 24,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  planCardActive: {
    borderColor: 'rgba(200,241,53,0.4)',
    backgroundColor: 'rgba(200,241,53,0.04)',
  },
  planCardSelected: {
    borderWidth: 1.5,
    borderColor: '#C8F135',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planNameCol: {
    flex: 1,
    gap: 4,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planNameText: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: '#C8F135',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  activeBadgeText: {
    fontFamily: F.sansBold,
    fontSize: 9,
    color: '#101416',
    letterSpacing: 0.5,
  },
  planDescText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  planCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  metaDot: {
    color: 'rgba(255,255,255,0.3)',
  },
  metaCategory: {
    fontFamily: F.mono,
    fontSize: 10,
    color: '#60A5FA',
  },
  activateBtn: {
    backgroundColor: 'rgba(200,241,53,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8F135',
  },
  activateBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#C8F135',
  },
  currentlyActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentlyActiveText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#C8F135',
  },
  planDaysPreviewBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  daysPreviewTitle: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.4)',
  },
  dayPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayIndexCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(200,241,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndexText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: '#C8F135',
    fontWeight: '700',
  },
  dayPreviewMeta: {
    flex: 1,
  },
  dayPreviewLabel: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  dayPreviewExercisesCount: {
    fontFamily: F.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  editPlanExercisesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C8F135',
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 4,
  },
  editPlanExercisesBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#101416',
  },
  // Form Styles
  createFormContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  formTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.5)',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontFamily: F.sansMedium,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  daysPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  daysNumBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  daysNumBtnActive: {
    backgroundColor: 'rgba(200,241,53,0.15)',
    borderColor: '#C8F135',
  },
  daysNumText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  daysNumTextActive: {
    color: '#C8F135',
    fontFamily: F.sansBold,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  cancelFormBtnText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  submitFormBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C8F135',
    alignItems: 'center',
  },
  submitFormBtnText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#101416',
  },
});
