import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import {
  SmartPlanGeneratorService,
  EquipmentType,
  FitnessGoal,
} from '@/services/smart-plan-generator.service';

const F = Vital.fonts;

interface EquipmentOption {
  id: EquipmentType;
  title: string;
  badge: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accentColor: string;
}

const EQUIPMENT_LIST: EquipmentOption[] = [
  {
    id: 'Barbell',
    title: 'Barbells',
    badge: 'HEAVY COMPOUND',
    subtitle: 'Olympic bars, racks & plates',
    icon: 'fitness-center',
    accentColor: '#C8F135', // Neon Lime
  },
  {
    id: 'Dumbbell',
    title: 'Dumbbells',
    badge: 'VERSATILE',
    subtitle: 'Fixed pairs or adjustable sets',
    icon: 'fitness-center',
    accentColor: '#38BDF8', // Electric Sky
  },
  {
    id: 'Kettlebell',
    title: 'Kettlebells',
    badge: 'POWER & FLOW',
    subtitle: 'Cast iron or competition bells',
    icon: 'sports-gymnastics',
    accentColor: '#FB923C', // Warm Sunset
  },
  {
    id: 'Machine',
    title: 'Weight Machines',
    badge: 'ISOLATION',
    subtitle: 'Leg press, Smith & chest press',
    icon: 'settings',
    accentColor: '#A78BFA', // Electric Violet
  },
  {
    id: 'Cable',
    title: 'Cable Machines',
    badge: 'CONSTANT TENSION',
    subtitle: 'Pulley towers & crossovers',
    icon: 'linear-scale',
    accentColor: '#FACC15', // Cyber Gold
  },
  {
    id: 'Bodyweight',
    title: 'No Equipment',
    badge: 'CALISTHENICS',
    subtitle: 'Bodyweight, pull-up bar & floor',
    icon: 'accessibility',
    accentColor: '#4ADE80', // Emerald Green
  },
];

interface EquipmentPlanWizardModalProps {
  visible: boolean;
  onClose: () => void;
  onPlanGenerated: (planId: string) => void;
}

export function EquipmentPlanWizardModal({
  visible,
  onClose,
  onPlanGenerated,
}: EquipmentPlanWizardModalProps) {
  const insets = useSafeAreaInsets();

  // Wizard States
  const [selectedGear, setSelectedGear] = useState<EquipmentType[]>(['Dumbbell', 'Barbell', 'Bodyweight']);
  const [goal, setGoal] = useState<FitnessGoal>('HYPERTROPHY');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Toggle Equipment Selection
  const handleToggleGear = (gear: EquipmentType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (gear === 'Bodyweight') {
      if (selectedGear.includes('Bodyweight') && selectedGear.length === 1) {
        setSelectedGear(['Dumbbell', 'Barbell', 'Bodyweight']);
      } else {
        setSelectedGear(['Bodyweight']);
      }
      return;
    }

    const updated = selectedGear.filter((g) => g !== 'Bodyweight');
    if (updated.includes(gear)) {
      const next = updated.filter((g) => g !== gear);
      setSelectedGear(next.length === 0 ? ['Bodyweight'] : next);
    } else {
      setSelectedGear([...updated, gear]);
    }
  };

  // Generate Plan
  const handleGeneratePlan = async () => {
    if (selectedGear.length === 0) {
      Alert.alert('Select Equipment', 'Please select at least one equipment type or choose No Equipment.');
      return;
    }

    try {
      setIsGenerating(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const newPlanId = await SmartPlanGeneratorService.generateAndActivatePlan({
        equipment: selectedGear,
        goal,
        daysPerWeek,
      });

      setIsGenerating(false);
      onPlanGenerated(newPlanId);
      onClose();
    } catch (error: any) {
      setIsGenerating(false);
      Alert.alert('Error', error.message || 'Could not generate workout plan.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.stepIndicatorRow}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>
            <Text style={styles.stepBadgeText}>SMART PLAN WIZARD</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Main Titles */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>What equipment do you or your gym have?</Text>
            <Text style={styles.mainSubtitle}>
              Select your gear below. We will custom-generate a split with 100% executable movements.
            </Text>
          </View>

          {/* 1. LUXURY EQUIPMENT GRID */}
          <View style={styles.grid}>
            {EQUIPMENT_LIST.map((item) => {
              const isSelected = selectedGear.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleToggleGear(item.id)}
                  style={[
                    styles.gearCard,
                    isSelected && styles.gearCardSelected,
                  ]}>
                  {/* Glowing Top Edge for Selected Card */}
                  {isSelected ? <View style={styles.cardTopGlow} /> : null}

                  {/* Header Row: Micro Badge & Checkbox */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.badgeTag,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(200, 241, 53, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.badgeTagText,
                          { color: isSelected ? '#C8F135' : 'rgba(255, 255, 255, 0.45)' },
                        ]}>
                        {item.badge}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleActive,
                      ]}>
                      {isSelected ? (
                        <MaterialIcons name="check" size={13} color="#101416" />
                      ) : (
                        <View style={styles.uncheckDot} />
                      )}
                    </View>
                  </View>

                  {/* Dynamic Icon with Glow */}
                  <View
                    style={[
                      styles.gearIconBox,
                      isSelected && styles.gearIconBoxActive,
                    ]}>
                    <MaterialIcons
                      name={item.icon}
                      size={26}
                      color={isSelected ? '#101416' : item.accentColor}
                    />
                  </View>

                  {/* Text Content */}
                  <View style={styles.cardTextContent}>
                    <Text
                      style={[
                        styles.gearTitle,
                        isSelected && styles.gearTitleSelected,
                      ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.gearSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. TRAINING FREQUENCY */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="calendar-today" size={14} color="#C8F135" />
              <Text style={styles.sectionHeader}>WEEKLY FREQUENCY</Text>
            </View>
            <View style={styles.frequencyGrid}>
              {[
                { days: 3 as const, label: '3 Days', sub: 'PPL / Full Split', tag: 'POPULAR' },
                { days: 4 as const, label: '4 Days', sub: 'Upper / Lower', tag: 'RECOMMENDED' },
                { days: 5 as const, label: '5 Days', sub: 'Pro Bodybuilder', tag: 'INTENSE' },
              ].map((opt) => {
                const isActive = daysPerWeek === opt.days;
                return (
                  <TouchableOpacity
                    key={opt.days}
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setDaysPerWeek(opt.days);
                    }}
                    style={[
                      styles.frequencyCard,
                      isActive && styles.frequencyCardActive,
                    ]}>
                    <View style={styles.freqLeft}>
                      <View style={[styles.freqRadio, isActive && styles.freqRadioActive]}>
                        {isActive ? <View style={styles.freqRadioInner} /> : null}
                      </View>
                      <View>
                        <Text style={[styles.frequencyText, isActive && styles.frequencyTextActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.frequencySubText}>{opt.sub}</Text>
                      </View>
                    </View>
                    <View style={[styles.freqTag, isActive && styles.freqTagActive]}>
                      <Text style={[styles.freqTagText, isActive && styles.freqTagTextActive]}>
                        {opt.tag}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. PRIMARY GOAL */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="flag" size={14} color="#C8F135" />
              <Text style={styles.sectionHeader}>PRIMARY GOAL</Text>
            </View>
            <View style={styles.frequencyGrid}>
              {[
                { id: 'HYPERTROPHY' as const, label: 'Muscle Growth (Hypertrophy)', sub: '8–12 Reps • Maximum Pump', icon: 'fitness-center' as const },
                { id: 'STRENGTH' as const, label: 'Strength & Power', sub: '4–6 Reps • Heavy Compound Loads', icon: 'bolt' as const },
                { id: 'FAT_LOSS' as const, label: 'Endurance & Fat Loss', sub: '12–15 Reps • High Calorie Burn', icon: 'local-fire-department' as const },
              ].map((opt) => {
                const isActive = goal === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setGoal(opt.id);
                    }}
                    style={[
                      styles.frequencyCard,
                      isActive && styles.frequencyCardActive,
                    ]}>
                    <View style={styles.freqLeft}>
                      <View style={[styles.goalIconBox, isActive && styles.goalIconBoxActive]}>
                        <MaterialIcons
                          name={opt.icon}
                          size={18}
                          color={isActive ? '#101416' : '#FFFFFF'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.frequencyText, isActive && styles.frequencyTextActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.frequencySubText}>{opt.sub}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* GENERATE CTA BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGeneratePlan}
            disabled={isGenerating}
            style={styles.generateBtn}>
            {isGenerating ? (
              <ActivityIndicator color="#101416" />
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={22} color="#101416" />
                <Text style={styles.generateBtnText}>GENERATE CUSTOM WORKOUT PLAN</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#C8F135',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#C8F135',
  },
  stepBadgeText: {
    fontFamily: F.mono,
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  titleSection: {
    gap: 8,
  },
  mainTitle: {
    fontFamily: F.sansBold,
    fontSize: 23,
    color: '#FFFFFF',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  mainSubtitle: {
    fontFamily: F.sans,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 19,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gearCard: {
    width: '48%',
    backgroundColor: '#12161B',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    position: 'relative',
    gap: 12,
    overflow: 'hidden',
  },
  gearCardSelected: {
    borderColor: '#C8F135',
    backgroundColor: '#161D22',
    shadowColor: '#C8F135',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#C8F135',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeTagText: {
    fontFamily: F.mono,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkCircleActive: {
    backgroundColor: '#C8F135',
    borderColor: '#C8F135',
  },
  uncheckDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  gearIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIconBoxActive: {
    backgroundColor: '#C8F135',
    borderColor: '#C8F135',
    shadowColor: '#C8F135',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTextContent: {
    gap: 3,
  },
  gearTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  gearTitleSelected: {
    color: '#C8F135',
  },
  gearSubtitle: {
    fontFamily: F.sans,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    lineHeight: 15,
  },
  sectionBox: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeader: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  frequencyGrid: {
    gap: 10,
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12161B',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  frequencyCardActive: {
    borderColor: '#C8F135',
    backgroundColor: '#161D22',
  },
  freqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  freqRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqRadioActive: {
    borderColor: '#C8F135',
  },
  freqRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8F135',
  },
  frequencyText: {
    fontFamily: F.sansBold,
    fontSize: 14.5,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  frequencyTextActive: {
    color: '#FFFFFF',
  },
  frequencySubText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  freqTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freqTagActive: {
    backgroundColor: 'rgba(200, 241, 53, 0.15)',
  },
  freqTagText: {
    fontFamily: F.mono,
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  freqTagTextActive: {
    color: '#C8F135',
  },
  goalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconBoxActive: {
    backgroundColor: '#C8F135',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C8F135',
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: '#C8F135',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  generateBtnText: {
    fontFamily: F.sansBold,
    fontSize: 14.5,
    color: '#101416',
    letterSpacing: 0.5,
  },
});
