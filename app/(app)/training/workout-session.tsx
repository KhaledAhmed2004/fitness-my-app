import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { WorkoutUseCases } from '@/use-cases/workout.use-cases';
import { ActiveWorkoutData, WorkoutSet, WorkoutRepository } from '@/repositories/workout.repository';
import { ExercisePickerModal } from '@/components/training/exercise-picker-modal';
import { ExerciseConfigModal } from '@/components/training/exercise-config-modal';
import { SetRow } from '@/components/training/set-row';

const C = Vital.colors;
const F = Vital.fonts;

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<ActiveWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [finishErrorVisible, setFinishErrorVisible] = useState(false);
  const [finishErrorMessage, setFinishErrorMessage] = useState('');
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [configExercise, setConfigExercise] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Mock timer for MVP
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const data = await WorkoutUseCases.getActiveSession();
      if (!data || data.id !== id) {
        Alert.alert("Error", "Workout session not found.");
        router.back();
        return;
      }
      setSession(data);
      if (data.start_time) {
        setElapsedTime(Math.floor(Date.now() / 1000) - data.start_time);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadSession();
    
    // Global and Rest Timer interval
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      setRestTimeLeft(prev => {
        if (prev > 1) return prev - 1;
        if (prev === 1) {
          setIsResting(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loadSession]);

  const handleAddExercise = async (exerciseIds: string[]) => {
    if (!session) return;
    try {
      for (let i = 0; i < exerciseIds.length; i++) {
        await WorkoutUseCases.addExercise(session.id, exerciseIds[i], session.exercises.length + i);
      }
      setPickerVisible(false);
      loadSession(); // reload from DB
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSet = async (workoutExerciseId: string, currentSetCount: number, prevWeight: number, prevReps: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await WorkoutUseCases.addSet(workoutExerciseId, currentSetCount, prevWeight, prevReps);
      loadSession();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSet = async (set: WorkoutSet, exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const willComplete = !set.is_completed;
      await WorkoutUseCases.updateSet(set.id, set.weight, set.reps, willComplete);
      
      if (willComplete) {
        // Fetch config to get rest time
        const config = await WorkoutRepository.getExerciseConfig(exerciseId);
        setRestTimeLeft(config ? config.rest_time_seconds : 60);
        setIsResting(true);
      }
      
      loadSession();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSetData = async (set: WorkoutSet, weight: number, reps: number) => {
    try {
      await WorkoutUseCases.updateSet(set.id, weight, reps, set.is_completed);
      // Don't reload entire session on every keystroke, let user continue typing
      // We will only reload if necessary, or just rely on local state if we wanted
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await WorkoutUseCases.removeSet(setId);
      loadSession();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    try {
      await WorkoutUseCases.finishWorkout(session.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/training/workout-summary?id=${session.id}`);
    } catch (error: any) {
      setFinishErrorMessage(error.message || "Please complete at least one set.");
      setFinishErrorVisible(true);
    }
  };

  const handleDiscard = () => {
    setDiscardModalVisible(true);
  };

  const confirmDiscard = () => {
    setDiscardModalVisible(false);
    // We need an abandon use case, for now we will just delete or mark abandoned
    // (Assuming you'd add this to WorkoutUseCases)
    router.back();
  };

  const handleExerciseOptions = (we: any) => {
    setSelectedExercise(we);
    setOptionsModalVisible(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.trainingAccent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* EXERCISE OPTIONS MODAL */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <Pressable 
          style={styles.optionsOverlay} 
          onPress={() => setOptionsModalVisible(false)}
        >
          <Pressable style={styles.optionsContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.optionsHeader}>
              <View style={styles.optionsDragIndicator} />
              <Text style={styles.optionsTitle}>Options</Text>
              <Text style={styles.optionsSubtitle}>{selectedExercise?.exerciseDetails.name}</Text>
            </View>
            
            <View style={styles.optionsBody}>
              <Pressable 
                style={styles.optionsConfigBtn}
                onPress={() => {
                  setOptionsModalVisible(false);
                  if (selectedExercise) {
                    setConfigExercise(selectedExercise.exerciseDetails);
                  }
                }}
              >
                <MaterialIcons name="settings" size={24} color={C.onSurface} />
                <Text style={styles.optionsConfigBtnText}>Configure Default Sets</Text>
              </Pressable>

              <Pressable 
                style={styles.optionsDangerBtn}
                onPress={async () => {
                  if (!selectedExercise) return;
                  try {
                    await WorkoutUseCases.removeExercise(selectedExercise.id);
                    setOptionsModalVisible(false);
                    loadSession();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <MaterialIcons name="delete-outline" size={24} color="#ff4444" />
                <Text style={styles.optionsDangerBtnText}>Remove Exercise</Text>
              </Pressable>
              
              <Pressable 
                style={styles.optionsCancelBtn}
                onPress={() => setOptionsModalVisible(false)}
              >
                <Text style={styles.optionsCancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.workoutName}>{session.name}</Text>
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={14} color={C.onSurfaceVariant} style={{ marginRight: 6 }} />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <Pressable onPress={handleDiscard} style={styles.discardIconBtn} hitSlop={12}>
            <MaterialIcons name="close" size={24} color={C.onSurfaceVariant} />
          </Pressable>
          <Pressable onPress={handleFinish} style={styles.finishBtn} hitSlop={12}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {session.exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="fitness-center" size={48} color={C.trainingAccent} />
            </View>
            <Text style={styles.emptyText}>No exercises added</Text>
            <Text style={styles.emptySub}>Let&apos;s build a great workout. Tap the button below to get started.</Text>
            <Pressable style={styles.primaryAddExerciseBtn} onPress={() => setPickerVisible(true)}>
              <MaterialIcons name="add" size={24} color={C.background} />
              <Text style={styles.primaryAddExerciseText}>Add First Exercise</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {session.exercises.map((we) => (
              <View key={we.id} style={styles.exerciseCard}>
                <View style={styles.exHeader}>
                  <Text style={styles.exName}>{we.exerciseDetails.name}</Text>
                  <Pressable hitSlop={10} style={styles.exOptionsBtn} onPress={() => handleExerciseOptions(we)}>
                    <MaterialIcons name="more-horiz" size={24} color={C.onSurfaceVariant} />
                  </Pressable>
                </View>
                
                <View style={styles.setGridHeader}>
                  <Text style={[styles.colHeader, { flex: 0.8 }]}>SET</Text>
                  <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>PREVIOUS</Text>
                  <Text style={[styles.colHeader, { flex: 2.7, textAlign: 'center' }]}>KG</Text>
                  <Text style={[styles.colHeader, { flex: 2.7, textAlign: 'center' }]}>REPS</Text>
                  <Text style={[styles.colHeader, { flex: 1.1, textAlign: 'center' }]}>✓</Text>
                </View>

                {we.sets.map((set, index) => {
                  const prevSet = we.prevSets?.[index] || (index > 0 ? { weight: we.sets[index - 1].weight, reps: we.sets[index - 1].reps } : undefined);
                  return (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={index}
                      previousSet={prevSet}
                      exerciseId={we.exercise_id}
                      onUpdate={handleUpdateSetData}
                      onToggle={handleToggleSet}
                      onDelete={handleDeleteSet}
                    />
                  );
                })}
                
                <Pressable 
                  style={styles.addSetBtn} 
                  onPress={() => {
                    const lastSet = we.sets[we.sets.length - 1];
                    handleAddSet(we.id, we.sets.length, lastSet?.weight || 0, lastSet?.reps || 0);
                  }}
                >
                  <Text style={styles.addSetText}>+ Add Set</Text>
                </Pressable>
              </View>
            ))}

            <Pressable style={styles.addExerciseBtn} onPress={() => setPickerVisible(true)}>
              <MaterialIcons name="add" size={24} color={C.trainingAccent} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <ExercisePickerModal 
        visible={pickerVisible} 
        onClose={() => setPickerVisible(false)} 
        onSelect={handleAddExercise} 
      />

      {/* REST TIMER OVERLAY */}
      {isResting && (
        <View style={styles.restTimerOverlay}>
          <Text style={styles.restTimerLabel}>Resting</Text>
          <Text style={styles.restTimerClock}>{formatTime(restTimeLeft)}</Text>
          <View style={styles.restTimerActions}>
            <Pressable 
              style={styles.restTimerBtn} 
              onPress={() => setRestTimeLeft(prev => prev + 30)}
            >
              <Text style={styles.restTimerBtnText}>+30s</Text>
            </Pressable>
            <Pressable 
              style={[styles.restTimerBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
              onPress={() => {
                setIsResting(false);
                setRestTimeLeft(0);
              }}
            >
              <Text style={styles.restTimerBtnText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ExerciseConfigModal 
        visible={!!configExercise} 
        exercise={configExercise} 
        onClose={() => setConfigExercise(null)} 
      />

      <Modal visible={discardModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <MaterialIcons name="delete-outline" size={28} color={C.error} />
            </View>
            <Text style={styles.modalTitle}>Discard Workout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to abandon this workout? All progress will be lost.
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setDiscardModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtnDiscard} onPress={confirmDiscard}>
                <Text style={styles.modalBtnDiscardText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={finishErrorVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
              <MaterialIcons name="error-outline" size={28} color="#FF9800" />
            </View>
            <Text style={styles.modalTitle}>Cannot Finish</Text>
            <Text style={styles.modalText}>
              {finishErrorMessage}
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnPrimary} onPress={() => setFinishErrorVisible(false)}>
                <Text style={styles.modalBtnPrimaryText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discardIconBtn: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timerText: {
    color: C.onSurfaceVariant,
    fontFamily: F.mono,
    fontSize: 13,
  },
  finishBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  finishBtnText: {
    color: C.onPrimary,
    fontFamily: F.sansBold,
    fontSize: 16,
  },
  workoutName: {
    color: C.onSurface,
    fontFamily: F.sansExtraBold,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  emptyText: {
    color: C.onSurface,
    fontFamily: F.sansBold,
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySub: {
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  primaryAddExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.trainingAccent,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 32,
    width: '100%',
    shadowColor: C.trainingAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryAddExerciseText: {
    color: C.background,
    fontFamily: F.sansExtraBold,
    fontSize: 17,
    marginLeft: 8,
  },
  exerciseCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  exName: {
    color: C.onSurface,
    fontFamily: F.sansExtraBold,
    fontSize: 20,
    flex: 1,
  },
  exOptionsBtn: {
    padding: 8,
    backgroundColor: C.surfaceHigh,
    borderRadius: 16,
  },
  setGridHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  colHeader: {
    color: C.onSurfaceVariant,
    fontFamily: F.sansBold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setRowCompleted: {
    opacity: 0.4,
  },
  setNumberContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    height: 48,
    marginRight: 6,
  },
  setNumber: {
    color: C.onSurfaceVariant,
    fontFamily: F.sansSemiBold,
    fontSize: 15,
  },
  inputContainer: {
    flex: 2,
    backgroundColor: C.surfaceHighest,
    borderRadius: 14,
    marginHorizontal: 6,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  input: {
    color: C.onSurface,
    fontFamily: F.sansBold,
    fontSize: 18,
    textAlign: 'center',
  },
  checkBtn: {
    flex: 1,
    height: 48,
    backgroundColor: C.surfaceHighest,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  checkBtnActive: {
    backgroundColor: '#89fe00',
    borderColor: '#89fe00',
    shadowColor: '#89fe00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  addSetBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  addSetText: {
    color: C.onSurface,
    fontFamily: F.sansBold,
    fontSize: 15,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderStyle: 'dashed',
    marginBottom: 40,
  },
  addExerciseText: {
    color: C.trainingAccent,
    fontFamily: F.sansExtraBold,
    fontSize: 17,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: C.surfaceHigh,
    width: '100%',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: F.sansExtraBold,
    fontSize: 24,
    color: C.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: C.onSurface,
  },
  modalBtnDiscard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: C.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDiscardText: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: '#000',
  },
  
  // OPTIONS MODAL STYLES
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  optionsContent: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  optionsDragIndicator: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  optionsTitle: {
    fontFamily: F.sansExtraBold,
    fontSize: 22,
    color: C.onSurface,
    marginBottom: 6,
  },
  optionsSubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  optionsBody: {
    gap: 12,
  },
  optionsConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceHighest,
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  optionsConfigBtnText: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: C.onSurface,
  },
  optionsDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
  },
  optionsDangerBtnText: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: '#ff4444',
  },
  optionsCancelBtn: {
    alignItems: 'center',
    backgroundColor: C.surfaceHigh,
    paddingVertical: 18,
    borderRadius: 20,
  },
  optionsCancelBtnText: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: C.onSurface,
  },
  
  // REST TIMER
  restTimerOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: C.primary,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  restTimerLabel: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 12,
  },
  restTimerClock: {
    fontFamily: F.sansExtraBold,
    fontSize: 24,
    color: '#FFF',
    flex: 1,
  },
  restTimerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restTimerBtn: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  restTimerBtnText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: '#FFF',
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBtnPrimaryText: {
    color: C.background,
    fontFamily: F.sansBold,
    fontSize: 15,
  }
});
