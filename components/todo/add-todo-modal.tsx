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

import { TODO_CATEGORY_CONFIG, TODO_PRIORITY_CONFIG } from '@/constants/default-todos';
import { Vital } from '@/constants/vital-theme';
import { useTodoStore } from '@/stores/todo-store';
import { TodoCategory, TodoPriority, TodoSubtask } from '@/types/todo';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PRIORITIES: TodoPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const CATEGORIES: TodoCategory[] = ['GROCERY', 'FITNESS', 'HEALTH', 'WORK', 'PERSONAL'];

function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AddTodoModal({ visible, onClose }: Props) {
  const addTodo = useTodoStore((s) => s.addTodo);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('MEDIUM');
  const [category, setCategory] = useState<TodoCategory>('PERSONAL');
  const [dueDate, setDueDate] = useState<string | undefined>(getTodayStr());
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<TodoSubtask[]>([]);
  const [error, setError] = useState('');

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: subtaskInput.trim(),
        isCompleted: false,
      },
    ]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    await addTodo({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    setTitle('');
    setDescription('');
    setSubtasks([]);
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
              <Text style={styles.title}>New Task or Todo</Text>
              <Text style={styles.subtitle}>Stay organized and productive</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}>
            {/* TITLE INPUT */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TASK TITLE *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Buy Creatine Monohydrate & Whey"
                placeholderTextColor={C.onSurfaceVariant}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError('');
                }}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* DESCRIPTION */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOTES / DETAILS (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Check vanilla flavor or 1kg pack"
                placeholderTextColor={C.onSurfaceVariant}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* PRIORITY SELECTOR */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PRIORITY LEVEL</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const conf = TODO_PRIORITY_CONFIG[p];
                  const isSelected = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        styles.priorityChip,
                        isSelected && {
                          borderColor: conf.color,
                          backgroundColor: conf.badgeBg,
                        },
                      ]}>
                      <View style={[styles.pDot, { backgroundColor: conf.color }]} />
                      <Text
                        style={[
                          styles.priorityText,
                          isSelected && { color: conf.color, fontWeight: '700' },
                        ]}>
                        {conf.label.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((catKey) => {
                  const conf = TODO_CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  return (
                    <TouchableOpacity
                      key={catKey}
                      onPress={() => setCategory(catKey)}
                      style={[
                        styles.catChip,
                        isSelected && {
                          borderColor: conf.color,
                          backgroundColor: `${conf.color}18`,
                        },
                      ]}>
                      <MaterialIcons
                        name={conf.icon as any}
                        size={15}
                        color={isSelected ? conf.color : C.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          isSelected && { color: conf.color, fontWeight: '700' },
                        ]}>
                        {conf.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DUE DATE SELECTOR */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DUE DATE</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  onPress={() => setDueDate(getTodayStr())}
                  style={[
                    styles.dateChip,
                    dueDate === getTodayStr() && styles.dateChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.dateChipText,
                      dueDate === getTodayStr() && styles.dateChipTextActive,
                    ]}>
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDueDate(getTomorrowStr())}
                  style={[
                    styles.dateChip,
                    dueDate === getTomorrowStr() && styles.dateChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.dateChipText,
                      dueDate === getTomorrowStr() && styles.dateChipTextActive,
                    ]}>
                    Tomorrow
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDueDate(undefined)}
                  style={[
                    styles.dateChip,
                    dueDate === undefined && styles.dateChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.dateChipText,
                      dueDate === undefined && styles.dateChipTextActive,
                    ]}>
                    No Date
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SUBTASKS CHECKLIST BUILDER */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SUBTASKS / CHECKLIST</Text>

              {subtasks.map((sub) => (
                <View key={sub.id} style={styles.subtaskItem}>
                  <MaterialIcons name="check-box-outline-blank" size={16} color={C.onSurfaceVariant} />
                  <Text style={styles.subtaskItemText}>{sub.title}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSubtask(sub.id)}>
                    <MaterialIcons name="close" size={16} color={C.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.subtaskInputRow}>
                <TextInput
                  style={styles.subtaskInput}
                  placeholder="+ Add subtask..."
                  placeholderTextColor={C.onSurfaceVariant}
                  value={subtaskInput}
                  onChangeText={setSubtaskInput}
                  onSubmitEditing={handleAddSubtask}
                />
                {subtaskInput.trim().length > 0 && (
                  <TouchableOpacity onPress={handleAddSubtask} style={styles.addSubBtn}>
                    <MaterialIcons name="add" size={18} color={C.background} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={styles.submitBtn}>
              <MaterialIcons name="add-task" size={18} color={C.background} />
              <Text style={styles.submitBtnText}>Create Task</Text>
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
    gap: 16,
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
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  pDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontFamily: F.sansMedium,
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
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  dateChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  dateChipText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  dateChipTextActive: {
    color: C.background,
    fontWeight: '700',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subtaskItemText: {
    flex: 1,
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onSurface,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  subtaskInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onSurface,
  },
  addSubBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
