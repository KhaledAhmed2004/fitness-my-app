import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TODO_CATEGORY_CONFIG } from '@/constants/default-todos';
import { Vital } from '@/constants/vital-theme';
import { TodoFilterTab, useTodoStore } from '@/stores/todo-store';
import { TodoCategory } from '@/types/todo';

import { AddTodoModal } from './add-todo-modal';
import { TodoItemRow } from './todo-item-row';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const FILTER_TABS: { key: TodoFilterTab; label: string }[] = [
  { key: 'TODAY', label: "Today's Focus" },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'ALL', label: 'All Tasks' },
  { key: 'COMPLETED', label: 'Completed' },
];

const CATEGORIES: (TodoCategory | 'ALL')[] = [
  'ALL',
  'GROCERY',
  'FITNESS',
  'HEALTH',
  'WORK',
  'PERSONAL',
];

export function TodoManagerModal({ visible, onClose }: Props) {
  const {
    activeFilter,
    activeCategory,
    searchQuery,
    setActiveFilter,
    setActiveCategory,
    setSearchQuery,
    toggleTodo,
    deleteTodo,
    toggleSubtask,
    clearCompleted,
    getFilteredTodos,
    getStats,
  } = useTodoStore();

  const [addModalVisible, setAddModalVisible] = useState(false);

  const filteredTodos = getFilteredTodos();
  const { total, pendingToday, completedToday, overdueCount } = getStats();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Task & Todo Planner</Text>
            <Text style={styles.headerSubtitle}>
              {pendingToday} tasks pending • {completedToday} completed today
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color={C.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}>
          {/* SEARCH BAR */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={C.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks, groceries, errands..."
              placeholderTextColor={C.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={16} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTER TABS */}
          <View style={styles.tabsRow}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveFilter(tab.key)}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}>
                  <Text
                    style={[
                      styles.tabChipText,
                      isActive && styles.tabChipTextActive,
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CATEGORY FILTER CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catChipsRow}>
            {CATEGORIES.map((catKey) => {
              const isSelected = activeCategory === catKey;
              const conf =
                catKey === 'ALL'
                  ? { label: 'All Categories', icon: 'grid-view', color: C.onSurface }
                  : TODO_CATEGORY_CONFIG[catKey];
              return (
                <TouchableOpacity
                  key={catKey}
                  onPress={() => setActiveCategory(catKey)}
                  style={[
                    styles.catFilterChip,
                    isSelected && styles.catFilterChipActive,
                  ]}>
                  <MaterialIcons
                    name={conf.icon as any}
                    size={14}
                    color={isSelected ? C.background : conf.color}
                  />
                  <Text
                    style={[
                      styles.catFilterChipText,
                      isSelected && styles.catFilterChipTextActive,
                    ]}>
                    {conf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* OVERDUE ALERT (IF APPLICABLE) */}
          {overdueCount > 0 && activeFilter !== 'COMPLETED' && (
            <View style={styles.overdueBanner}>
              <MaterialIcons name="warning-amber" size={18} color="#FF4D6D" />
              <Text style={styles.overdueBannerText}>
                You have {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}!
              </Text>
            </View>
          )}

          {/* TASKS LIST */}
          <View style={styles.tasksContainer}>
            {filteredTodos.map((item) => (
              <TodoItemRow
                key={item.id}
                item={item}
                onToggle={() => void toggleTodo(item.id)}
                onDelete={() => void deleteTodo(item.id)}
                onToggleSubtask={(subId) => void toggleSubtask(item.id, subId)}
              />
            ))}

            {filteredTodos.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>No tasks found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try different keywords.'
                    : 'Tap + New Task to create your first todo!'}
                </Text>
              </View>
            )}
          </View>

          {/* CLEAR COMPLETED BUTTON (WHEN IN COMPLETED TAB) */}
          {activeFilter === 'COMPLETED' && filteredTodos.length > 0 && (
            <TouchableOpacity
              onPress={() => void clearCompleted()}
              style={styles.clearBtn}>
              <MaterialIcons name="delete-sweep" size={18} color={C.error} />
              <Text style={styles.clearBtnText}>Clear Completed Tasks</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* FLOATING ACTION BUTTON */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAddModalVisible(true)}
            style={styles.fabBtn}>
            <MaterialIcons name="add" size={20} color={C.background} />
            <Text style={styles.fabBtnText}>+ New Task or Goal</Text>
          </TouchableOpacity>
        </View>

        {/* ADD TODO MODAL */}
        <AddTodoModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101416',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 20,
    color: C.onSurface,
  },
  headerSubtitle: {
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
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  searchInput: {
    flex: 1,
    color: C.onSurface,
    fontFamily: F.sansMedium,
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  tabChipActive: {
    backgroundColor: C.onSurface,
    borderColor: C.onSurface,
  },
  tabChipText: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  tabChipTextActive: {
    color: C.background,
  },
  catChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  catFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  catFilterChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  catFilterChipText: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  catFilterChipTextActive: {
    color: C.background,
    fontWeight: '700',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
  },
  overdueBannerText: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: '#FF4D6D',
  },
  tasksContainer: {
    gap: 4,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.onSurface,
  },
  emptySubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    marginTop: 10,
  },
  clearBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 13,
    color: C.error,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
  },
  fabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabBtnText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.background,
  },
});
