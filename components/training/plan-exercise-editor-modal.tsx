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
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import {
  PlanRepository,
  FullWorkoutPlan,
  PlanDayWithExercises,
  PlanExercise,
} from '@/repositories/plan.repository';
import { ExerciseRepository } from '@/repositories/exercise.repository';
import { ExercisePickerModal } from './exercise-picker-modal';

const C = Vital.colors;
const F = Vital.fonts;

interface PlanExerciseEditorModalProps {
  visible: boolean;
  planId: string | null;
  onClose: () => void;
  onPlanUpdated: () => void;
}

export function PlanExerciseEditorModal({
  visible,
  planId,
  onClose,
  onPlanUpdated,
}: PlanExerciseEditorModalProps) {
  const [planDetails, setPlanDetails] = useState<FullWorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Target day for adding exercises
  const [targetDayIdForPicker, setTargetDayIdForPicker] = useState<string | null>(null);
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);

  // Custom Exercise Creation Modal
  const [newExerciseModalVisible, setNewExerciseModalVisible] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExMuscle, setCustomExMuscle] = useState('Chest');
  const [customExEquipment, setCustomExEquipment] = useState('Dumbbell');

  const loadPlan = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const details = await PlanRepository.getPlanById(planId);
      setPlanDetails(details);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && planId) {
      loadPlan();
    }
  }, [visible, planId]);

  // Exercise sets/reps inline increment/decrement
  const handleUpdateSets = async (exercise: PlanExercise, delta: number) => {
    const newSets = Math.max(1, Math.min(10, exercise.default_sets + delta));
    if (newSets === exercise.default_sets) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await PlanRepository.updatePlanExercise(exercise.id, newSets, exercise.default_reps);
    await loadPlan();
    onPlanUpdated();
  };

  const handleUpdateReps = async (exercise: PlanExercise, delta: number) => {
    const newReps = Math.max(1, Math.min(50, exercise.default_reps + delta));
    if (newReps === exercise.default_reps) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await PlanRepository.updatePlanExercise(exercise.id, exercise.default_sets, newReps);
    await loadPlan();
    onPlanUpdated();
  };

  const handleRemoveExercise = (exercise: PlanExercise) => {
    Alert.alert(
      'Remove Exercise',
      `Are you sure you want to remove "${exercise.exercise_name}" from this workout day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            await PlanRepository.deletePlanExercise(exercise.id);
            await loadPlan();
            onPlanUpdated();
          },
        },
      ]
    );
  };

  // Exercise Picker Integration
  const handleOpenPicker = (dayId: string) => {
    setTargetDayIdForPicker(dayId);
    setExercisePickerVisible(true);
  };

  const handleExercisesSelected = async (exerciseIds: string[]) => {
    if (!targetDayIdForPicker) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      for (let i = 0; i < exerciseIds.length; i++) {
        await PlanRepository.addExerciseToDay(
          targetDayIdForPicker,
          exerciseIds[i],
          3, // default 3 sets
          10, // default 10 reps
          8.0,
          90,
          i
        );
      }
      setExercisePickerVisible(false);
      setTargetDayIdForPicker(null);
      await loadPlan();
      onPlanUpdated();
    } catch (e) {
      Alert.alert('Error', 'Failed to add exercises.');
    }
  };

  // Add a new Day to this plan
  const handleAddNewDay = async () => {
    if (!planDetails) return;
    const nextIndex = planDetails.days.length + 1;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await PlanRepository.addDayToPlan(
        planDetails.id,
        `Day ${nextIndex} – Custom Workout`,
        (nextIndex - 1) * 2,
        'chest,back',
        nextIndex - 1
      );
      await loadPlan();
      onPlanUpdated();
    } catch (e) {
      Alert.alert('Error', 'Failed to add new day.');
    }
  };

  // Create custom exercise in the global catalog
  const handleCreateCustomExercise = async () => {
    if (!customExName.trim()) {
      Alert.alert('Missing Name', 'Please enter exercise name.');
      return;
    }
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await ExerciseRepository.createCustomExercise(
        customExName.trim(),
        customExMuscle,
        customExEquipment
      );
      setCustomExName('');
      setNewExerciseModalVisible(false);
      Alert.alert('Success', `"${customExName}" added to Exercise Catalog! You can now assign it to any routine.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to create exercise.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <View style={styles.screenContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {planDetails?.name || 'Edit Workout Split'}
            </Text>
            <Text style={styles.headerSubtitle}>Manage routines, exercises, sets & reps</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setNewExerciseModalVisible(true)}
            style={styles.newExBtn}>
            <MaterialIcons name="add-circle" size={16} color="#C8F135" />
            <Text style={styles.newExBtnText}>Catalog</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#C8F135" />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {planDetails?.days.map((day, dayIndex) => (
              <View key={day.id} style={styles.daySectionCard}>
                {/* Day Header */}
                <View style={styles.daySectionHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>DAY {dayIndex + 1}</Text>
                  </View>
                  <Text style={styles.dayLabelText}>{day.day_label}</Text>
                </View>

                {/* Exercises in this Day */}
                <View style={styles.exercisesList}>
                  {day.exercises.length === 0 ? (
                    <View style={styles.emptyDayBox}>
                      <Text style={styles.emptyDayText}>No exercises assigned to this day yet.</Text>
                    </View>
                  ) : (
                    day.exercises.map((ex) => (
                      <View key={ex.id} style={styles.exerciseItemRow}>
                        <View style={styles.exerciseInfoCol}>
                          <Text style={styles.exerciseNameText} numberOfLines={1}>
                            {ex.exercise_name}
                          </Text>
                          <Text style={styles.exerciseMetaText}>
                            {ex.muscle_group || 'General'} • {ex.equipment || 'Standard'}
                          </Text>
                        </View>

                        {/* Sets Stepper */}
                        <View style={styles.stepperContainer}>
                          <Text style={styles.stepperLabel}>SETS</Text>
                          <View style={styles.stepperControls}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleUpdateSets(ex, -1)}
                              style={styles.stepBtn}>
                              <MaterialIcons name="remove" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.stepValue}>{ex.default_sets}</Text>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleUpdateSets(ex, 1)}
                              style={styles.stepBtn}>
                              <MaterialIcons name="add" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Reps Stepper */}
                        <View style={styles.stepperContainer}>
                          <Text style={styles.stepperLabel}>REPS</Text>
                          <View style={styles.stepperControls}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleUpdateReps(ex, -1)}
                              style={styles.stepBtn}>
                              <MaterialIcons name="remove" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.stepValue}>{ex.default_reps}</Text>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleUpdateReps(ex, 1)}
                              style={styles.stepBtn}>
                              <MaterialIcons name="add" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Delete Button */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleRemoveExercise(ex)}
                          style={styles.deleteExBtn}>
                          <MaterialIcons name="delete-outline" size={18} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  {/* Add Exercise to this Day Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenPicker(day.id)}
                    style={styles.addExerciseBtn}>
                    <MaterialIcons name="add" size={18} color="#C8F135" />
                    <Text style={styles.addExerciseBtnText}>Add Exercise to {day.day_label}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add New Workout Day to this Plan */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddNewDay}
              style={styles.addNewDayBtn}>
              <MaterialIcons name="playlist-add" size={20} color="#101416" />
              <Text style={styles.addNewDayBtnText}>+ Add Another Workout Day</Text>
            </TouchableOpacity>

            <View style={{ height: 60 }} />
          </ScrollView>
        )}

        {/* Nested Exercise Picker Modal */}
        <ExercisePickerModal
          visible={exercisePickerVisible}
          onClose={() => setExercisePickerVisible(false)}
          onSelect={handleExercisesSelected}
        />

        {/* Create Custom Exercise Modal */}
        <Modal
          visible={newExerciseModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setNewExerciseModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.customExDialog}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Create Custom Exercise</Text>
                <TouchableOpacity onPress={() => setNewExerciseModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EXERCISE NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Incline Cable Fly, Pec Deck"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={customExName}
                  onChangeText={setCustomExName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TARGET MUSCLE GROUP</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Chest, Back, Shoulders, Legs"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={customExMuscle}
                  onChangeText={setCustomExMuscle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EQUIPMENT</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Barbell, Dumbbell, Cable, Machine"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={customExEquipment}
                  onChangeText={setCustomExEquipment}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCreateCustomExercise}
                style={styles.saveCustomExBtn}>
                <Text style={styles.saveCustomExBtnText}>Save to Catalog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0E1114',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: '#12161A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: F.sans,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  newExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 241, 53, 0.3)',
  },
  newExBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#C8F135',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  daySectionCard: {
    backgroundColor: '#14191E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayBadge: {
    backgroundColor: '#C8F135',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '700',
    color: '#101416',
  },
  dayLabelText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  exercisesList: {
    gap: 8,
  },
  emptyDayBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyDayText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  exerciseInfoCol: {
    flex: 1,
    gap: 2,
  },
  exerciseNameText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  exerciseMetaText: {
    fontFamily: F.sans,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  stepperContainer: {
    alignItems: 'center',
    gap: 2,
  },
  stepperLabel: {
    fontFamily: F.mono,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  stepBtn: {
    padding: 2,
  },
  stepValue: {
    fontFamily: F.mono,
    fontSize: 12,
    fontWeight: '700',
    color: '#C8F135',
    minWidth: 18,
    textAlign: 'center',
  },
  deleteExBtn: {
    padding: 6,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(200, 241, 53, 0.08)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 241, 53, 0.2)',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addExerciseBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#C8F135',
  },
  addNewDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C8F135',
    paddingVertical: 14,
    borderRadius: 16,
    marginVertical: 10,
  },
  addNewDayBtnText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#101416',
  },
  // Modal Dialog Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customExDialog: {
    backgroundColor: '#14191E',
    borderRadius: 24,
    width: '100%',
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: F.sansMedium,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveCustomExBtn: {
    backgroundColor: '#C8F135',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveCustomExBtnText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#101416',
  },
});
