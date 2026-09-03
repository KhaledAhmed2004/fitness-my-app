import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CATEGORY_CONFIG } from '@/constants/default-routines';
import { Vital } from '@/constants/vital-theme';
import { RoutineItem } from '@/types/routine';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  item: RoutineItem;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete?: () => void;
};

export function RoutineItemRow({
  item,
  isCompleted,
  onToggle,
  onDelete,
}: Props) {
  const cat = CATEGORY_CONFIG[item.category] || {
    label: item.category,
    icon: 'star',
    color: item.color || C.primary,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onToggle}
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
      ]}>
      {/* CHECKBOX */}
      <View
        style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
        ]}>
        {isCompleted && (
          <MaterialIcons name="check" size={15} color="#101416" />
        )}
      </View>

      {/* ICON BADGE */}
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: isCompleted ? 'rgba(255,255,255,0.05)' : `${item.color}20` },
        ]}>
        <MaterialIcons
          name={(item.icon || cat.icon) as any}
          size={18}
          color={isCompleted ? C.outline : item.color}
        />
      </View>

      {/* CONTENT */}
      <View style={styles.contentCol}>
        <Text
          numberOfLines={1}
          style={[styles.title, isCompleted && styles.titleCompleted]}>
          {item.title}
        </Text>

        {item.description ? (
          <Text
            numberOfLines={1}
            style={[styles.desc, isCompleted && styles.descCompleted]}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.timeBadge}>
            <MaterialIcons name="schedule" size={11} color={C.onSurfaceVariant} />
            <Text style={styles.timeText}>{item.targetTime}</Text>
          </View>

          <View style={[styles.catBadge, { backgroundColor: `${cat.color}18` }]}>
            <Text style={[styles.catText, { color: cat.color }]}>
              {cat.label}
            </Text>
          </View>

          {item.linkedAction ? (
            <View style={styles.syncBadge}>
              <MaterialIcons name="bolt" size={11} color="#89FE00" />
              <Text style={styles.syncText}>Auto-sync</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* DELETE OPTION (FOR CUSTOM HABITS) */}
      {!item.isSystem && onDelete ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={10}
          style={styles.deleteBtn}>
          <MaterialIcons name="delete-outline" size={18} color={C.error} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#1C2023',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
    marginBottom: 8,
    width: '100%',
  },
  cardCompleted: {
    backgroundColor: 'rgba(28, 32, 35, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.65,
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
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontFamily: F.sansSemiBold,
    fontSize: 14,
    color: C.onSurface,
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
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catText: {
    fontFamily: F.sansSemiBold,
    fontSize: 10,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  syncText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: '#89FE00',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
