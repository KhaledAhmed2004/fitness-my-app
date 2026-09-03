import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CATEGORY_CONFIG, ROUTINE_TIME_BLOCKS } from '@/constants/default-routines';
import { Vital } from '@/constants/vital-theme';
import { useRoutineStore } from '@/stores/routine-store';
import { RoutineCategory, RoutineTimeOfDay } from '@/types/routine';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CATEGORIES: RoutineCategory[] = [
  'HEALTH',
  'FITNESS',
  'NUTRITION',
  'MIND',
  'FINANCE',
  'REST',
];

export function AddRoutineModal({ visible, onClose }: Props) {
  const addCustomHabit = useRoutineStore((s) => s.addCustomHabit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<RoutineTimeOfDay>('MORNING');
  const [targetTime, setTargetTime] = useState('08:00 AM');
  const [category, setCategory] = useState<RoutineCategory>('HEALTH');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a habit title');
      return;
    }

    const catConfig = CATEGORY_CONFIG[category];

    await addCustomHabit({
      title: title.trim(),
      description: description.trim() || undefined,
      timeOfDay,
      targetTime: targetTime.trim() || '08:00 AM',
      category,
      icon: catConfig.icon,
      color: catConfig.color,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });

    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Create Custom Habit</Text>
              <Text style={styles.subtitle}>Build your daily consistency</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}>
            {/* HABIT TITLE INPUT */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HABIT TITLE *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 20 Mins Evening Reading"
                placeholderTextColor={C.onSurfaceVariant}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError('');
                }}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* DESCRIPTION INPUT */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>WHY / DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Calms nervous system before sleep"
                placeholderTextColor={C.onSurfaceVariant}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* TIME OF DAY PROTOCOL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TIME OF DAY PROTOCOL</Text>
              <View style={styles.timeBlockGrid}>
                {ROUTINE_TIME_BLOCKS.map((block) => {
                  const isSelected = timeOfDay === block.key;
                  return (
                    <TouchableOpacity
                      key={block.key}
                      onPress={() => setTimeOfDay(block.key)}
                      style={[
                        styles.timeBlockChip,
                        isSelected && {
                          borderColor: block.color,
                          backgroundColor: `${block.color}18`,
                        },
                      ]}>
                      <Text style={styles.blockEmoji}>{block.emoji}</Text>
                      <Text
                        style={[
                          styles.blockTitle,
                          isSelected && { color: C.onSurface, fontWeight: '700' },
                        ]}>
                        {block.label.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* TARGET TIME */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TARGET TIME</Text>
              <View style={styles.timePickerRow}>
                {['07:00 AM', '08:30 AM', '01:00 PM', '06:00 PM', '09:30 PM'].map(
                  (t) => {
                    const isSelected = targetTime === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setTargetTime(t)}
                        style={[
                          styles.timeChip,
                          isSelected && {
                            backgroundColor: C.primary,
                            borderColor: C.primary,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.timeChipText,
                            isSelected && { color: C.background, fontWeight: '700' },
                          ]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((catKey) => {
                  const cat = CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  return (
                    <TouchableOpacity
                      key={catKey}
                      onPress={() => setCategory(catKey)}
                      style={[
                        styles.catChip,
                        isSelected && {
                          borderColor: cat.color,
                          backgroundColor: `${cat.color}20`,
                        },
                      ]}>
                      <MaterialIcons
                        name={cat.icon as any}
                        size={16}
                        color={isSelected ? cat.color : C.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          isSelected && { color: cat.color, fontWeight: '700' },
                        ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={styles.submitBtn}>
              <MaterialIcons name="add-task" size={18} color={C.background} />
              <Text style={styles.submitBtnText}>Add to My Daily Routine</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#161a1d',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: C.onSurface,
  },
  subtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.onSurface,
    fontFamily: F.sansMedium,
    fontSize: 14,
  },
  errorText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.error,
    marginTop: 2,
  },
  timeBlockGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  timeBlockChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
    gap: 4,
  },
  blockEmoji: {
    fontSize: 18,
  },
  blockTitle: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  timePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  timeChipText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  catChipText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 16,
  },
  submitBtnText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.background,
  },
});
