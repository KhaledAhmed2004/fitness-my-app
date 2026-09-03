import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { PlanDay } from '@/repositories/plan.repository';

const T = TrainingTheme;
const F = Vital.fonts;

interface PlanDayPickerModalProps {
  visible: boolean;
  days: PlanDay[];
  currentSelectedDayId?: string | null;
  onSelectDay: (dayId: string) => void;
  onClose: () => void;
}

export function PlanDayPickerModal({
  visible,
  days,
  currentSelectedDayId,
  onSelectDay,
  onClose,
}: PlanDayPickerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="swap-vert" size={20} color={T.primary} />
              <Text style={styles.title}>Pick Today's Focus</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              style={styles.closeBtn}>
              <MaterialIcons name="close" size={18} color={T.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Switch your workout day for today without breaking your split.
          </Text>

          <ScrollView style={styles.daysList} showsVerticalScrollIndicator={false}>
            {days.map((day, idx) => {
              const isSelected = currentSelectedDayId === day.id;

              return (
                <TouchableOpacity
                  key={day.id}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Select day ${idx + 1}: ${day.day_label}`}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    onSelectDay(day.id);
                    onClose();
                  }}
                  style={[styles.dayItem, isSelected && styles.dayItemSelected]}>
                  <View style={[styles.indexBadge, isSelected && styles.indexBadgeSelected]}>
                    <Text style={[styles.indexText, isSelected && styles.indexTextSelected]}>
                      {idx + 1}
                    </Text>
                  </View>

                  <View style={styles.dayMeta}>
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                      {day.day_label}
                    </Text>
                    {day.target_muscle_groups ? (
                      <Text style={styles.musclesText}>
                        Focus: {day.target_muscle_groups.split(',').join(', ')}
                      </Text>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <MaterialIcons name="check-circle" size={20} color={T.primary} />
                  ) : (
                    <MaterialIcons name="chevron-right" size={20} color={T.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: T.surface,
    borderRadius: 24,
    width: '100%',
    maxHeight: '75%',
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: T.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.glassFill,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    lineHeight: 16,
  },
  daysList: {
    maxHeight: 350,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.glassFill,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
    minHeight: 52,
  },
  dayItemSelected: {
    backgroundColor: T.surfaceActiveTint,
    borderColor: T.borderFocus,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.glassFill,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeSelected: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  indexText: {
    fontFamily: F.mono,
    fontSize: 12,
    color: T.textSecondary,
    fontWeight: '700',
  },
  indexTextSelected: {
    color: T.onPrimary,
  },
  dayMeta: {
    flex: 1,
    gap: 2,
  },
  dayLabel: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: T.textPrimary,
  },
  dayLabelSelected: {
    color: T.primary,
  },
  musclesText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textMuted,
    textTransform: 'capitalize',
  },
});
