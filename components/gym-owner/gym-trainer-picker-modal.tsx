/**
 * 🏋️‍♂️ Gym Trainer Picker Modal (GymOS)
 * Streamlined coach roster picker for assigning personal trainers and floor coaches to members.
 * Clean, untruncated coach names, 3-tab segmented filter, and zero cognitive load.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { GymTrainerStaff } from '@/types/gym';

const F = Vital.fonts;

export const DEFAULT_GYM_TRAINERS: GymTrainerStaff[] = [
  {
    id: 'tr_1',
    name: 'Coach Alex Vance',
    gender: 'MALE',
    phone: '+880 1711-234567',
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80',
    specialization: 'Strength & Hypertrophy',
    baseSalaryBdt: 35000,
    commissionPercentage: 35,
    assignedClientsCount: 14,
    monthlyRevenueGeneratedBdt: 95000,
    status: 'ACTIVE',
    shift: 'MORNING',
  },
  {
    id: 'tr_2',
    name: 'Coach Tanvir Rahman',
    gender: 'MALE',
    phone: '+880 1819-876543',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    specialization: 'Fat Loss & High Intensity',
    baseSalaryBdt: 40000,
    commissionPercentage: 40,
    assignedClientsCount: 18,
    monthlyRevenueGeneratedBdt: 120000,
    status: 'ACTIVE',
    shift: 'EVENING',
  },
  {
    id: 'tr_3',
    name: 'Coach Nusrat Jahan',
    gender: 'FEMALE',
    phone: '+880 1912-345678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    specialization: 'Female Transformation & Pilates',
    baseSalaryBdt: 38000,
    commissionPercentage: 35,
    assignedClientsCount: 12,
    monthlyRevenueGeneratedBdt: 85000,
    status: 'ACTIVE',
    shift: 'MORNING',
  },
  {
    id: 'tr_4',
    name: 'Coach Marcus Sterling',
    gender: 'MALE',
    phone: '+880 1610-998877',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    specialization: 'Powerlifting & Spine Rehab',
    baseSalaryBdt: 45000,
    commissionPercentage: 40,
    assignedClientsCount: 9,
    monthlyRevenueGeneratedBdt: 110000,
    status: 'ACTIVE',
    shift: 'FULL_DAY',
  },
  {
    id: 'tr_5',
    name: 'Coach Sarah Khan',
    gender: 'FEMALE',
    phone: '+880 1715-667788',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    specialization: 'HIIT, Fat Loss & Nutrition',
    baseSalaryBdt: 36000,
    commissionPercentage: 35,
    assignedClientsCount: 16,
    monthlyRevenueGeneratedBdt: 90000,
    status: 'ACTIVE',
    shift: 'EVENING',
  },
  {
    id: 'tr_6',
    name: 'Coach Farhan Ahmed',
    gender: 'MALE',
    phone: '+880 1511-445566',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    specialization: 'Beginner Conditioning & Mobility',
    baseSalaryBdt: 30000,
    commissionPercentage: 30,
    assignedClientsCount: 15,
    monthlyRevenueGeneratedBdt: 70000,
    status: 'ACTIVE',
    shift: 'EVENING',
  },
  {
    id: 'tr_7',
    name: 'Coach Anika Tabassum',
    gender: 'FEMALE',
    phone: '+880 1814-112233',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    specialization: 'Strength & Women Fitness',
    baseSalaryBdt: 42000,
    commissionPercentage: 40,
    assignedClientsCount: 11,
    monthlyRevenueGeneratedBdt: 105000,
    status: 'ACTIVE',
    shift: 'MORNING',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectTrainer: (trainerName: string, trainer?: GymTrainerStaff) => void;
  selectedTrainerName?: string;
  athleteName?: string;
  athleteGender?: 'MALE' | 'FEMALE' | 'OTHER';
};

type FilterGender = 'ALL' | 'MALE' | 'FEMALE';

export function GymTrainerPickerModal({
  visible,
  onClose,
  onSelectTrainer,
  selectedTrainerName = '',
  athleteName = 'New Athlete',
  athleteGender,
}: Props) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterGender>('ALL');

  const maleCount = useMemo(() => DEFAULT_GYM_TRAINERS.filter((t) => t.gender === 'MALE').length, []);
  const femaleCount = useMemo(() => DEFAULT_GYM_TRAINERS.filter((t) => t.gender === 'FEMALE').length, []);

  const filteredTrainers = useMemo(() => {
    return DEFAULT_GYM_TRAINERS.filter((tr) => {
      // Gender filter
      if (activeFilter === 'MALE' && tr.gender !== 'MALE') {
        return false;
      }
      if (activeFilter === 'FEMALE' && tr.gender !== 'FEMALE') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = tr.name.toLowerCase().includes(q);
        const matchSpec = tr.specialization.toLowerCase().includes(q);
        const matchShift = tr.shift.toLowerCase().includes(q);
        return matchName || matchSpec || matchShift;
      }

      return true;
    });
  }, [searchQuery, activeFilter]);

  const handlePick = (tr: GymTrainerStaff) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectTrainer(tr.name, tr);
    onClose();
  };

  const handleClear = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectTrainer('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(137, 254, 0, 0.3)' : '#86EFAC',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialIcons name="badge" size={20} color={isDark ? '#89FE00' : '#059669'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>Assign Coach</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                Match {athleteName} with a specialized gym trainer
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search coach by name, specialty, or shift..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 3-SEGMENT FULL WIDTH FILTER BAR */}
        <View style={styles.filterSection}>
          <View style={[styles.segmentedControl, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9', borderColor: colors.border }]}>
            {[
              { id: 'ALL' as const, label: `All (${DEFAULT_GYM_TRAINERS.length})`, icon: 'groups' as const },
              { id: 'MALE' as const, label: `Male (${maleCount})`, icon: 'male' as const },
              { id: 'FEMALE' as const, label: `Female (${femaleCount})`, icon: 'female' as const },
            ].map((f) => {
              const isSel = activeFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setActiveFilter(f.id);
                  }}
                  style={[
                    styles.segmentBtn,
                    isSel && {
                      backgroundColor: isDark ? 'rgba(137, 254, 0, 0.18)' : '#DCFCE7',
                      borderColor: isDark ? '#89FE00' : '#059669',
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                    },
                  ]}>
                  <MaterialIcons
                    name={f.icon}
                    size={15}
                    color={isSel ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color: isSel ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary,
                        fontFamily: isSel ? F.sansBold : F.sansMedium,
                      },
                    ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TRAINER LIST */}
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          showsVerticalScrollIndicator={false}>
          {/* GENERAL FLOOR / NO DEDICATED TRAINER OPTION */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClear}
            style={[
              styles.trainerCard,
              {
                backgroundColor: colors.surface,
                borderColor: !selectedTrainerName ? (isDark ? '#89FE00' : '#059669') : colors.border,
              },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}>
                <MaterialIcons name="groups" size={22} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.trainerName, { color: colors.textPrimary }]}>
                  No Dedicated Coach (Self Workout)
                </Text>
                <Text style={[styles.trainerSpec, { color: colors.textSecondary }]}>
                  Athlete trains independently with floor supervisor assistance
                </Text>
              </View>
            </View>
            {!selectedTrainerName ? (
              <View style={styles.selectedBadge}>
                <MaterialIcons name="check" size={14} color="#000" />
              </View>
            ) : (
              <MaterialIcons name="radio-button-unchecked" size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          {/* COACH CARDS */}
          {filteredTrainers.map((trainer) => {
            const isSelected = selectedTrainerName === trainer.name;
            return (
              <TouchableOpacity
                key={trainer.id}
                activeOpacity={0.75}
                onPress={() => handlePick(trainer)}
                style={[
                  styles.trainerCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? (isDark ? '#89FE00' : '#059669') : colors.border,
                  },
                ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  {/* AVATAR */}
                  {trainer.avatarUrl ? (
                    <Image source={{ uri: trainer.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarContainer, { backgroundColor: 'rgba(0, 180, 216, 0.15)', borderColor: colors.border }]}>
                      <MaterialIcons name="person" size={22} color="#00B4D8" />
                    </View>
                  )}

                  {/* INFO */}
                  <View style={{ flex: 1, gap: 4 }}>
                    {/* FULL COACH NAME (NO TRUNCATION) */}
                    <Text style={[styles.trainerName, { color: colors.textPrimary }]}>
                      {trainer.name}
                    </Text>

                    {/* SPECIALIZATION & BADGES ROW */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <MaterialIcons name="stars" size={13} color={isDark ? '#89FE00' : '#059669'} />
                        <Text style={[styles.trainerSpec, { color: isDark ? '#89FE00' : '#059669' }]}>
                          {trainer.specialization}
                        </Text>
                      </View>

                      {/* GENDER BADGE */}
                      {trainer.gender === 'FEMALE' ? (
                        <View style={[styles.genderTag, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FCE7F3' }]}>
                          <MaterialIcons name="female" size={10} color={isDark ? '#F472B6' : '#DB2777'} />
                          <Text style={[styles.genderTagText, { color: isDark ? '#F472B6' : '#DB2777' }]}>Female</Text>
                        </View>
                      ) : (
                        <View style={[styles.genderTag, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                          <MaterialIcons name="male" size={10} color={isDark ? '#60A5FA' : '#2563EB'} />
                          <Text style={[styles.genderTagText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>Male</Text>
                        </View>
                      )}

                      {/* SHIFT BADGE */}
                      {trainer.shift === 'MORNING' && (
                        <View style={[styles.shiftTag, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                          <MaterialIcons name="wb-sunny" size={10} color={isDark ? '#FBBF24' : '#D97706'} />
                          <Text style={[styles.shiftTagText, { color: isDark ? '#FBBF24' : '#D97706' }]}>Morning</Text>
                        </View>
                      )}
                      {trainer.shift === 'EVENING' && (
                        <View style={[styles.shiftTag, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE' }]}>
                          <MaterialIcons name="nights-stay" size={10} color={isDark ? '#38BDF8' : '#0284C7'} />
                          <Text style={[styles.shiftTagText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>Evening</Text>
                        </View>
                      )}
                      {trainer.shift === 'FULL_DAY' && (
                        <View style={[styles.shiftTag, { backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7' }]}>
                          <MaterialIcons name="all-inclusive" size={10} color={isDark ? '#89FE00' : '#059669'} />
                          <Text style={[styles.shiftTagText, { color: isDark ? '#89FE00' : '#059669' }]}>Full Day</Text>
                        </View>
                      )}
                    </View>

                    {/* META: CLIENTS & PHONE */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="people-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {trainer.assignedClientsCount} active clients
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <MaterialIcons name="phone" size={11} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {trainer.phone}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* CHECKMARK BADGE */}
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <MaterialIcons name="check" size={14} color="#000" />
                  </View>
                ) : (
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.sans,
    paddingVertical: 0,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  trainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerName: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  trainerSpec: {
    fontSize: 11,
    fontFamily: F.sansMedium,
  },
  genderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genderTagText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.2,
  },
  shiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shiftTagText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.2,
  },
  metaText: {
    fontSize: 10,
    fontFamily: F.sans,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#89FE00',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
