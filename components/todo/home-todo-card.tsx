import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { TODO_PRIORITY_CONFIG } from '@/constants/default-todos';
import { Vital } from '@/constants/vital-theme';
import { useTodoStore } from '@/stores/todo-store';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  onOpenFullTodos: () => void;
  onOpenAddModal: () => void;
};

export function HomeTodoCard({ onOpenFullTodos, onOpenAddModal }: Props) {
  const { todos, toggleTodo, addTodo, getStats, getTodayTodos } = useTodoStore();
  const [quickTitle, setQuickTitle] = useState('');

  const { pendingToday, completedToday, overdueCount } = getStats();
  const todayTodos = getTodayTodos();
  const topTodos = todayTodos.slice(0, 3);

  const handleQuickAdd = async () => {
    if (!quickTitle.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    await addTodo({
      title: quickTitle.trim(),
      priority: 'MEDIUM',
      category: 'PERSONAL',
      dueDate: todayStr,
    });
    setQuickTitle('');
  };

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconBox}>
            <MaterialIcons name="checklist-rtl" size={20} color={C.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Today's Focus Tasks</Text>
            <Text style={styles.headerSubtitle}>
              {pendingToday > 0
                ? `${pendingToday} pending • ${completedToday} done`
                : 'All clear for today 🎉'}
            </Text>
          </View>
        </View>

        {overdueCount > 0 && (
          <View style={styles.overdueBadge}>
            <MaterialIcons name="error-outline" size={12} color="#FF4D6D" />
            <Text style={styles.overdueText}>{overdueCount} overdue</Text>
          </View>
        )}
      </View>

      {/* QUICK TASKS LIST */}
      <View style={styles.tasksList}>
        {topTodos.map((item) => {
          const priorityConf = TODO_PRIORITY_CONFIG[item.priority] || TODO_PRIORITY_CONFIG.MEDIUM;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => void toggleTodo(item.id)}
              style={styles.taskRow}>
              <View style={styles.checkbox}>
                <View style={[styles.pDot, { backgroundColor: priorityConf.color }]} />
              </View>

              <Text numberOfLines={1} style={styles.taskTitle}>
                {item.title}
              </Text>

              {item.dueDate ? (
                <Text style={styles.taskDueText}>
                  {item.dueTime || 'Today'}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}

        {topTodos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No pending tasks for today!</Text>
          </View>
        )}
      </View>

      {/* QUICK INLINE INPUT */}
      <View style={styles.quickInputRow}>
        <TextInput
          style={styles.quickInput}
          placeholder="+ Add a quick task..."
          placeholderTextColor={C.onSurfaceVariant}
          value={quickTitle}
          onChangeText={setQuickTitle}
          onSubmitEditing={handleQuickAdd}
          returnKeyType="done"
        />
        {quickTitle.trim().length > 0 ? (
          <TouchableOpacity onPress={handleQuickAdd} style={styles.addBtn}>
            <MaterialIcons name="arrow-forward" size={16} color={C.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onOpenAddModal} style={styles.moreBtn}>
            <MaterialIcons name="add" size={18} color={C.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* FOOTER CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenFullTodos}
        style={styles.footerBtn}>
        <Text style={styles.footerBtnText}>Manage All Tasks & Lists</Text>
        <MaterialIcons name="chevron-right" size={18} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.onSurface,
  },
  headerSubtitle: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  overdueText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: '#FF4D6D',
    fontWeight: '700',
  },
  tasksList: {
    gap: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskTitle: {
    flex: 1,
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onSurface,
  },
  taskDueText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  emptyEmoji: {
    fontSize: 16,
  },
  emptyText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  quickInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickInput: {
    flex: 1,
    color: C.onSurface,
    fontFamily: F.sansMedium,
    fontSize: 13,
    paddingVertical: 8,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.primaryAlpha10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(137, 206, 255, 0.2)',
  },
  footerBtnText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.primary,
  },
});
