import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TODO_CATEGORY_CONFIG, TODO_PRIORITY_CONFIG } from '@/constants/default-todos';
import { Vital } from '@/constants/vital-theme';
import { TodoItem } from '@/types/todo';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  item: TodoItem;
  onToggle: () => void;
  onDelete?: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
};

export function TodoItemRow({
  item,
  onToggle,
  onDelete,
  onToggleSubtask,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const priorityConf = TODO_PRIORITY_CONFIG[item.priority] || TODO_PRIORITY_CONFIG.MEDIUM;
  const categoryConf = TODO_CATEGORY_CONFIG[item.category] || TODO_CATEGORY_CONFIG.PERSONAL;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !item.isCompleted && item.dueDate && item.dueDate < todayStr;
  const hasSubtasks = (item.subtasks && item.subtasks.length > 0) ?? false;
  const subtasksCompleted = item.subtasks?.filter((s) => s.isCompleted).length || 0;

  return (
    <View
      style={[
        styles.card,
        item.isCompleted && styles.cardCompleted,
      ]}>
      {/* MAIN ROW */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onToggle}
        style={styles.mainRow}>
        {/* CHECKBOX */}
        <View
          style={[
            styles.checkbox,
            item.isCompleted && styles.checkboxCompleted,
          ]}>
          {item.isCompleted && (
            <MaterialIcons name="check" size={15} color="#101416" />
          )}
        </View>

        {/* CONTENT */}
        <View style={styles.contentCol}>
          <Text
            numberOfLines={2}
            style={[styles.title, item.isCompleted && styles.titleCompleted]}>
            {item.title}
          </Text>

          {item.description ? (
            <Text
              numberOfLines={1}
              style={[styles.desc, item.isCompleted && styles.descCompleted]}>
              {item.description}
            </Text>
          ) : null}

          {/* BADGES ROW */}
          <View style={styles.metaRow}>
            {/* PRIORITY BADGE */}
            <View style={[styles.badge, { backgroundColor: priorityConf.badgeBg }]}>
              <View style={[styles.pDot, { backgroundColor: priorityConf.color }]} />
              <Text style={[styles.badgeText, { color: priorityConf.color }]}>
                {priorityConf.label.split(' ')[0]}
              </Text>
            </View>

            {/* CATEGORY BADGE */}
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <MaterialIcons name={categoryConf.icon as any} size={11} color={categoryConf.color} />
              <Text style={[styles.badgeText, { color: categoryConf.color }]}>
                {categoryConf.label}
              </Text>
            </View>

            {/* DUE DATE */}
            {item.dueDate ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isOverdue ? 'rgba(255, 77, 109, 0.15)' : 'rgba(255,255,255,0.06)' },
                ]}>
                <MaterialIcons
                  name="event"
                  size={11}
                  color={isOverdue ? '#FF4D6D' : C.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: isOverdue ? '#FF4D6D' : C.onSurfaceVariant },
                  ]}>
                  {item.dueDate === todayStr ? 'Today' : item.dueDate}
                </Text>
              </View>
            ) : null}

            {/* SUBTASKS PILL */}
            {hasSubtasks ? (
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={[styles.badge, { backgroundColor: 'rgba(137, 206, 255, 0.12)' }]}>
                <MaterialIcons name="playlist-add-check" size={12} color={C.primary} />
                <Text style={[styles.badgeText, { color: C.primary }]}>
                  {subtasksCompleted}/{item.subtasks?.length}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* DELETE BTN */}
        {onDelete ? (
          <TouchableOpacity
            onPress={(e) => {
              onDelete();
            }}
            hitSlop={8}
            style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={17} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* EXPANDABLE SUBTASKS CHECKLIST */}
      {expanded && hasSubtasks && (
        <View style={styles.subtasksContainer}>
          <View style={styles.subtasksDivider} />
          {item.subtasks?.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              activeOpacity={0.7}
              onPress={() => onToggleSubtask?.(sub.id)}
              style={styles.subtaskRow}>
              <View
                style={[
                  styles.subCheckbox,
                  sub.isCompleted && styles.subCheckboxCompleted,
                ]}>
                {sub.isCompleted && (
                  <MaterialIcons name="check" size={12} color="#101416" />
                )}
              </View>
              <Text
                style={[
                  styles.subtaskTitle,
                  sub.isCompleted && styles.subtaskTitleCompleted,
                ]}>
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C2023',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardCompleted: {
    backgroundColor: 'rgba(28, 32, 35, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.6,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    backgroundColor: '#89FE00',
    borderColor: '#89FE00',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  title: {
    fontFamily: F.sansSemiBold,
    fontSize: 14,
    color: C.onSurface,
    lineHeight: 20,
  },
  titleCompleted: {
    color: C.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  desc: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  descCompleted: {
    color: C.outline,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  subtasksContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 6,
  },
  subtasksDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 6,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 12,
  },
  subCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCheckboxCompleted: {
    backgroundColor: '#89FE00',
    borderColor: '#89FE00',
  },
  subtaskTitle: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurface,
  },
  subtaskTitleCompleted: {
    color: C.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
});
