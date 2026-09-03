import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';
import { WorkoutSet } from '@/repositories/workout.repository';
import * as Haptics from 'expo-haptics';

const C = Vital.colors;
const F = Vital.fonts;

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  previousSet?: { weight: number; reps: number };
  onUpdate: (set: WorkoutSet, weight: number, reps: number) => void;
  onToggle: (set: WorkoutSet, exerciseId: string) => void;
  onDelete: (setId: string) => void;
  exerciseId: string;
}

export function SetRow({ set, index, previousSet, onUpdate, onToggle, onDelete, exerciseId }: SetRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  
  // Local state for smooth UI typing
  const [localWeight, setLocalWeight] = useState(set.weight.toString());
  const [localReps, setLocalReps] = useState(set.reps.toString());

  const handleUpdate = (w: string, r: string) => {
    const numW = parseFloat(w) || 0;
    const numR = parseInt(r, 10) || 0;
    onUpdate(set, numW, numR);
  };

  const handleStepper = (type: 'weight' | 'reps', increment: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === 'weight') {
      const current = parseFloat(localWeight) || 0;
      const next = increment ? current + 2.5 : Math.max(0, current - 2.5);
      setLocalWeight(next.toString());
      handleUpdate(next.toString(), localReps);
    } else {
      const current = parseInt(localReps, 10) || 0;
      const next = increment ? current + 1 : Math.max(0, current - 1);
      setLocalReps(next.toString());
      handleUpdate(localWeight, next.toString());
    }
  };

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <Pressable 
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(set.id);
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="delete-outline" size={28} color="#FFF" />
        </Animated.View>
      </Pressable>
    );
  };

  const prevText = previousSet ? `${previousSet.weight}kg × ${previousSet.reps}` : '—';

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
    >
      <View style={[styles.setRow, set.is_completed && styles.setRowCompleted]}>
        <View style={styles.setNumberContainer}>
          <Text style={styles.setNumber}>{index + 1}</Text>
        </View>
        
        {/* PREVIOUS RECORD GHOST INDICATOR */}
        <View style={styles.previousContainer}>
          <Text style={styles.previousText} numberOfLines={1}>
            {prevText}
          </Text>
        </View>

        {/* WEIGHT INPUT WITH STEPPERS */}
        <View style={styles.inputContainer}>
          <Pressable 
            style={styles.stepperBtn} 
            onPress={() => handleStepper('weight', false)}
            hitSlop={8}
          >
            <MaterialIcons name="remove" size={14} color={C.onSurfaceVariant} />
          </Pressable>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={localWeight}
            onChangeText={setLocalWeight}
            onEndEditing={(e) => handleUpdate(e.nativeEvent.text, localReps)}
            placeholder={previousSet ? String(previousSet.weight) : "0"}
            placeholderTextColor={C.outlineVariant}
            selectTextOnFocus
          />
          <Pressable 
            style={styles.stepperBtn} 
            onPress={() => handleStepper('weight', true)}
            hitSlop={8}
          >
            <MaterialIcons name="add" size={14} color={C.onSurfaceVariant} />
          </Pressable>
        </View>
        
        {/* REPS INPUT WITH STEPPERS */}
        <View style={styles.inputContainer}>
          <Pressable 
            style={styles.stepperBtn} 
            onPress={() => handleStepper('reps', false)}
            hitSlop={8}
          >
            <MaterialIcons name="remove" size={14} color={C.onSurfaceVariant} />
          </Pressable>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={localReps}
            onChangeText={setLocalReps}
            onEndEditing={(e) => handleUpdate(localWeight, e.nativeEvent.text)}
            placeholder={previousSet ? String(previousSet.reps) : "0"}
            placeholderTextColor={C.outlineVariant}
            selectTextOnFocus
          />
          <Pressable 
            style={styles.stepperBtn} 
            onPress={() => handleStepper('reps', true)}
            hitSlop={8}
          >
            <MaterialIcons name="add" size={14} color={C.onSurfaceVariant} />
          </Pressable>
        </View>
        
        <Pressable 
          style={[styles.checkBtn, set.is_completed && styles.checkBtnActive]} 
          onPress={() => onToggle(set, exerciseId)}
        >
          <MaterialIcons name="check" size={18} color={set.is_completed ? '#000' : C.outline} />
        </Pressable>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: C.surfaceContainer,
  },
  setRowCompleted: {
    opacity: 0.5,
  },
  setNumberContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    height: 44,
    marginRight: 4,
  },
  setNumber: {
    color: C.onSurfaceVariant,
    fontFamily: F.sansBold,
    fontSize: 14,
  },
  previousContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    height: 44,
  },
  previousText: {
    color: '#89CEFF',
    fontFamily: F.mono,
    fontSize: 11,
    opacity: 0.85,
    textAlign: 'center',
  },
  inputContainer: {
    flex: 2.7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginHorizontal: 3,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    color: C.onSurface,
    fontFamily: F.sansBold,
    fontSize: 15,
    textAlign: 'center',
    padding: 0,
  },
  stepperBtn: {
    width: 26,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtn: {
    flex: 1.1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  deleteAction: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 14,
    height: 44,
    marginLeft: 8,
    marginBottom: 10,
  },
});
