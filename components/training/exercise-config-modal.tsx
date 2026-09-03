import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';
import { WorkoutRepository, Exercise, ExerciseConfig } from '@/repositories/workout.repository';
import * as Haptics from 'expo-haptics';

const C = Vital.colors;
const F = Vital.fonts;

interface ExerciseConfigModalProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseConfigModal({ visible, exercise, onClose }: ExerciseConfigModalProps) {
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [rest, setRest] = useState('60');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      if (!exercise || !visible) return;
      const config = await WorkoutRepository.getExerciseConfig(exercise.id);
      if (config) {
        setSets(config.default_sets.toString());
        setReps(config.default_reps.toString());
        setWeight(config.default_weight.toString());
        setRest(config.rest_time_seconds.toString());
      } else {
        // Defaults
        setSets('1');
        setReps('0');
        setWeight('0');
        setRest('60');
      }
    };
    
    loadConfig();
  }, [exercise, visible]);

  const handleSave = async () => {
    if (!exercise) return;
    
    setLoading(true);
    await WorkoutRepository.saveExerciseConfig(
      exercise.id,
      parseInt(sets) || 1,
      parseInt(reps) || 0,
      parseFloat(weight) || 0,
      parseInt(rest) || 60
    );
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  if (!exercise) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Configure {exercise.name}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={C.onSurfaceVariant} />
            </Pressable>
          </View>
          
          <Text style={styles.subtitle}>These settings will be automatically applied whenever you add this exercise to a workout.</Text>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Sets</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={sets} 
                onChangeText={setSets} 
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Default Reps</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  value={reps} 
                  onChangeText={setReps} 
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Default Weight (kg)</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  value={weight} 
                  onChangeText={setWeight} 
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rest Timer (seconds)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={rest} 
                onChangeText={setRest} 
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Configuration'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: F.sansExtraBold,
    fontSize: 22,
    color: C.onSurface,
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  subtitle: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: C.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    color: C.onSurface,
    fontFamily: F.sansSemiBold,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: {
    backgroundColor: C.trainingAccent,
    borderRadius: 100,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.background,
  }
});
