/**
 * Coach Diet, Macro & Supplement Prescription Studio Modal
 * Allows Gym Trainers and Strength Coaches to:
 * 1. Browse and prescribe curated Desi High-Protein Diet Plans (Hypertrophy, Fat Loss, Carb Cycling, Eggetarian, Rehab).
 * 2. Build custom macro allocations (Protein, Carbs, Fat, Kcal) and meal schedules with Bangladeshi food staples.
 * 3. Prescribe clinical & performance supplement stacks (Creatine, Whey Isolate, Omega-3, D3, Collagen, ZMA).
 * 4. 1-Tap assign diet protocols directly to Athlete Client Dossiers.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import type {
  CoachDietPlan,
  PrescribedMeal,
  PrescribedSupplement,
  CarbCyclingType,
  PrescribedMealType,
} from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;

type TabKey = 'PRESETS' | 'BUILDER' | 'ASSIGN';

type FilterTag = 'ALL' | 'Hypertrophy' | 'Fat Loss' | 'Carb Cycling' | 'Eggetarian' | 'Rehab';

const FILTER_TAGS: { key: FilterTag; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'ALL', label: 'All Plans', icon: 'restaurant' },
  { key: 'Hypertrophy', label: 'Hypertrophy', icon: 'fitness-center' },
  { key: 'Fat Loss', label: 'Fat Loss', icon: 'local-fire-department' },
  { key: 'Carb Cycling', label: 'Carb Cycling', icon: 'swap-horiz' },
  { key: 'Eggetarian', label: 'Eggetarian', icon: 'egg' },
  { key: 'Rehab', label: 'Spine & Joint', icon: 'healing' },
];

const DESI_FOOD_QUICK_CHIPS = [
  '4 Boiled Egg Whites + 2 Whole Eggs',
  '200g Grilled Chicken Breast',
  '180g Rui/Katla Fish Fillet',
  '100g Rolled Oats with 1 Banana',
  '150g Tok Doi (Fresh Curd)',
  '100g Boiled Chola (Chickpeas)',
  '1 Bowl Thick Masoor Dal',
  '150g Boiled Lal (Brown) Rice',
  '2 Hand-Made Lal Atta Roti',
  '120g Low-Fat Paneer Curry',
  '1 Cup Warm Bone Broth Soup',
  '1 Scoop Whey Protein Isolate (30g)',
];

type Props = {
  visible: boolean;
  onClose: () => void;
  targetClientId?: string; // Pre-select athlete if opened from dossier
};

export function CoachDietPrescriptionModal({ visible, onClose, targetClientId }: Props) {
  const { clients, coachDietPlans, assignDietPlanToClient, addCoachDietPlan, deleteCoachDietPlan } =
    useTrainerStore();

  const [activeTab, setActiveTab] = useState<TabKey>('PRESETS');
  const [selectedTag, setSelectedTag] = useState<FilterTag>('ALL');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Selected Plan for Assigning
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<CoachDietPlan | null>(
    coachDietPlans[0] || null
  );
  const [assignedClientId, setAssignedClientId] = useState<string>(
    targetClientId || (clients[0]?.id ?? '')
  );
  const [customCoachNotes, setCustomCoachNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Custom Diet Plan Builder Form State
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderBanglaTitle, setBuilderBanglaTitle] = useState('');
  const [builderTag, setBuilderTag] = useState<string>('Hypertrophy');
  const [builderCalories, setBuilderCalories] = useState('2500');
  const [builderProtein, setBuilderProtein] = useState('170');
  const [builderCarbs, setBuilderCarbs] = useState('280');
  const [builderFat, setBuilderFat] = useState('65');
  const [builderWater, setBuilderWater] = useState('4.0');
  const [builderCarbCycling, setBuilderCarbCycling] = useState<CarbCyclingType>('BALANCED');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderColor, setBuilderColor] = useState('#89FE00');

  // Custom Meals in Builder
  const [builderMeals, setBuilderMeals] = useState<PrescribedMeal[]>([
    {
      id: 'bm_1',
      mealType: 'BREAKFAST',
      title: 'Power Eggs & Oats',
      banglaTitle: 'ডিম ও ওটস নাস্তা',
      foods: ['4 Whole Boiled Eggs', '80g Rolled Oats with 1 Banana'],
      calories: 550,
      proteinG: 34,
      carbsG: 65,
      fatG: 16,
      timing: '08:00 AM',
    },
    {
      id: 'bm_2',
      mealType: 'LUNCH',
      title: 'Chicken & Brown Rice',
      banglaTitle: 'গ্রিলড চিকেন ও ভাত',
      foods: ['180g Grilled Chicken Breast', '180g Lal Rice', '1 Bowl Dal & Salad'],
      calories: 680,
      proteinG: 52,
      carbsG: 80,
      fatG: 12,
      timing: '01:30 PM',
    },
    {
      id: 'bm_3',
      mealType: 'POST_WORKOUT',
      title: 'Whey Isolate & Daab Water',
      banglaTitle: 'হোয়ে প্রোটিন ও ডাবের পানি',
      foods: ['1 Scoop Whey Isolate', '250ml Fresh Daab Water', '5g Creatine'],
      calories: 220,
      proteinG: 27,
      carbsG: 24,
      fatG: 1,
      timing: '07:00 PM',
    },
    {
      id: 'bm_4',
      mealType: 'DINNER',
      title: 'River Fish & Green Veggies',
      banglaTitle: 'তাজা মাছ ও শাকসবজি',
      foods: ['180g Rui Fish Curry', '120g Lal Rice', '1 Cup Spinach'],
      calories: 520,
      proteinG: 36,
      carbsG: 50,
      fatG: 14,
      timing: '09:30 PM',
    },
  ]);

  const [selectedSupplements, setSelectedSupplements] = useState<PrescribedSupplement[]>([
    {
      id: 'bs_1',
      name: 'Creatine Monohydrate 200 Mesh',
      dosage: '5g Daily',
      timing: 'Post-workout with fruit/fast carbs',
      purpose: 'ATP cellular energy & explosive muscular fullness',
      isMandatory: true,
      brandSuggestion: 'Optimum Nutrition / MuscleTech',
    },
    {
      id: 'bs_2',
      name: 'Whey Protein Isolate 90%',
      dosage: '1 Scoop (30g = 27g Protein)',
      timing: 'Immediately post-workout',
      purpose: 'Fast leucine spike to trigger muscle protein synthesis',
      isMandatory: true,
      brandSuggestion: 'Dymatize ISO 100',
    },
  ]);

  // If targetClientId changes, update assigned client
  React.useEffect(() => {
    if (targetClientId) {
      setAssignedClientId(targetClientId);
    }
  }, [targetClientId]);

  // Filtered Diet Plans
  const filteredPlans = useMemo(() => {
    if (selectedTag === 'ALL') return coachDietPlans;
    return coachDietPlans.filter(
      (p) => p.tag.toLowerCase() === selectedTag.toLowerCase() || p.code.includes(selectedTag.toUpperCase())
    );
  }, [coachDietPlans, selectedTag]);

  // Calculated Macro Calories in Builder
  const calcKcalFromMacros = useMemo(() => {
    const p = parseFloat(builderProtein) || 0;
    const c = parseFloat(builderCarbs) || 0;
    const f = parseFloat(builderFat) || 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  }, [builderProtein, builderCarbs, builderFat]);

  // Handle Quick Food Add into first meal
  const handleAddFoodChip = (foodText: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (builderMeals.length === 0) {
      setBuilderMeals([
        {
          id: `bm_${Date.now()}`,
          mealType: 'LUNCH',
          title: 'Custom Meal',
          foods: [foodText],
          calories: 400,
          proteinG: 30,
          carbsG: 45,
          fatG: 10,
          timing: '01:30 PM',
        },
      ]);
      return;
    }
    const updated = [...builderMeals];
    updated[0] = {
      ...updated[0],
      foods: [...updated[0].foods, foodText],
    };
    setBuilderMeals(updated);
  };

  // Handle Preset Selection for Direct Assign
  const handleSelectForAssign = (plan: CoachDietPlan) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedPlanForAssign(plan);
    setActiveTab('ASSIGN');
  };

  // Handle Assign Submission
  const handleConfirmAssign = async () => {
    if (!selectedPlanForAssign) {
      Alert.alert('Selection Required', 'Please choose a diet plan to assign.');
      return;
    }
    if (!assignedClientId) {
      Alert.alert('Athlete Required', 'Please select an athlete from your roster.');
      return;
    }

    setIsAssigning(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await assignDietPlanToClient(assignedClientId, selectedPlanForAssign.id, customCoachNotes.trim() || undefined);

    const clientObj = clients.find((c) => c.id === assignedClientId);
    setIsAssigning(false);
    Alert.alert(
      'Diet Protocol Assigned! 🥗',
      `"${selectedPlanForAssign.title}" has been successfully assigned to ${clientObj?.name || 'Athlete'}.`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  // Handle Save New Custom Plan
  const handleSaveCustomPlan = async () => {
    if (!builderTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a name for this custom diet plan.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const targetKcal = parseInt(builderCalories) || calcKcalFromMacros;
    const protein = parseInt(builderProtein) || 160;
    const carbs = parseInt(builderCarbs) || 250;
    const fat = parseInt(builderFat) || 60;
    const water = parseFloat(builderWater) || 3.5;

    const newPlanId = await addCoachDietPlan({
      code: `CUSTOM_${Date.now()}`,
      title: builderTitle.trim(),
      banglaTitle: builderBanglaTitle.trim() || undefined,
      tag: builderTag,
      targetCalories: targetKcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      carbCyclingType: builderCarbCycling,
      waterIntakeLiters: water,
      color: builderColor,
      bg: `${builderColor}22`,
      description: builderDescription.trim() || 'Custom Coach Prescribed Nutrition Protocol.',
      coachGuidelines: [
        'Follow exact prescribed gram targets for protein and water.',
        'Record all meals daily in the Vital Nutrition Logger.',
      ],
      meals: builderMeals,
      supplements: selectedSupplements,
    });

    Alert.alert('Custom Plan Created! 🥗', `"${builderTitle}" is now available in your Presets Vault.`, [
      {
        text: 'View in Vault',
        onPress: () => {
          setActiveTab('PRESETS');
          setExpandedPlanId(newPlanId);
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={22} color={C.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>COACH DIET & MACRO STUDIO</Text>
            <Text style={styles.headerSub}>Desi Nutrition Vault, Macro Splits & Supplement Protocols</Text>
          </View>
        </View>

        {/* 3 TOP TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('PRESETS');
            }}
            style={[styles.tabBtn, activeTab === 'PRESETS' && styles.tabBtnActive]}>
            <MaterialIcons name="menu-book" size={16} color={activeTab === 'PRESETS' ? '#89FE00' : C.onSurfaceVariant} />
            <Text style={[styles.tabBtnText, activeTab === 'PRESETS' && styles.tabBtnTextActive]}>
              Presets Vault ({coachDietPlans.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('BUILDER');
            }}
            style={[styles.tabBtn, activeTab === 'BUILDER' && styles.tabBtnActive]}>
            <MaterialIcons name="tune" size={16} color={activeTab === 'BUILDER' ? '#89FE00' : C.onSurfaceVariant} />
            <Text style={[styles.tabBtnText, activeTab === 'BUILDER' && styles.tabBtnTextActive]}>
              Custom Builder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('ASSIGN');
            }}
            style={[styles.tabBtn, activeTab === 'ASSIGN' && styles.tabBtnActive]}>
            <MaterialIcons name="person-add" size={16} color={activeTab === 'ASSIGN' ? '#89FE00' : C.onSurfaceVariant} />
            <Text style={[styles.tabBtnText, activeTab === 'ASSIGN' && styles.tabBtnTextActive]}>
              Assign Plan
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT */}
        {activeTab === 'PRESETS' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* FILTER PILLS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTER_TAGS.map((tag) => {
                const isSelected = selectedTag === tag.key;
                return (
                  <TouchableOpacity
                    key={tag.key}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSelectedTag(tag.key);
                    }}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}>
                    <MaterialIcons
                      name={tag.icon}
                      size={14}
                      color={isSelected ? '#89FE00' : C.onSurfaceVariant}
                    />
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* PRESET CARDS LIST */}
            <View style={styles.cardsList}>
              {filteredPlans.map((plan) => {
                const isExpanded = expandedPlanId === plan.id;
                const accent = plan.color || '#89FE00';
                const totalMacros = plan.proteinG + plan.carbsG + plan.fatG;
                const pPct = Math.round((plan.proteinG / totalMacros) * 100);
                const cPct = Math.round((plan.carbsG / totalMacros) * 100);
                const fPct = 100 - pPct - cPct;

                return (
                  <View key={plan.id} style={[styles.presetCard, { borderColor: isExpanded ? accent : 'rgba(255,255,255,0.08)' }]}>
                    {/* CARD TOP HEADER */}
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <View style={[styles.tagBadge, { backgroundColor: accent + '22' }]}>
                            <Text style={[styles.tagBadgeText, { color: accent }]}>{plan.tag.toUpperCase()}</Text>
                          </View>
                          {plan.carbCyclingType === 'TRAINING_VS_REST' && (
                            <View style={[styles.tagBadge, { backgroundColor: 'rgba(0, 180, 216, 0.2)' }]}>
                              <Text style={[styles.tagBadgeText, { color: '#00B4D8' }]}>CARB CYCLING</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planTitleText}>{plan.title}</Text>
                        {plan.banglaTitle && <Text style={styles.planBanglaText}>🇧🇩 {plan.banglaTitle}</Text>}
                      </View>

                      {/* CALORIE PILL */}
                      <View style={[styles.caloriePill, { backgroundColor: accent + '18', borderColor: accent }]}>
                        <Text style={[styles.calorieVal, { color: accent }]}>{plan.targetCalories}</Text>
                        <Text style={styles.calorieUnit}>KCAL / DAY</Text>
                      </View>
                    </View>

                    {/* MACRO BAR */}
                    <View style={styles.macroBarContainer}>
                      <View style={styles.macroBarTrack}>
                        <View style={[styles.macroBarSegment, { width: `${pPct}%`, backgroundColor: '#89FE00' }]} />
                        <View style={[styles.macroBarSegment, { width: `${cPct}%`, backgroundColor: '#00B4D8' }]} />
                        <View style={[styles.macroBarSegment, { width: `${fPct}%`, backgroundColor: '#FFB800' }]} />
                      </View>

                      <View style={styles.macroLabelsRow}>
                        <View style={styles.macroStatItem}>
                          <View style={[styles.macroDot, { backgroundColor: '#89FE00' }]} />
                          <Text style={styles.macroStatText}>
                            <Text style={{ fontFamily: F.sansBold, color: '#89FE00' }}>{plan.proteinG}g</Text> Protein ({pPct}%)
                          </Text>
                        </View>
                        <View style={styles.macroStatItem}>
                          <View style={[styles.macroDot, { backgroundColor: '#00B4D8' }]} />
                          <Text style={styles.macroStatText}>
                            <Text style={{ fontFamily: F.sansBold, color: '#00B4D8' }}>{plan.carbsG}g</Text> Carbs ({cPct}%)
                          </Text>
                        </View>
                        <View style={styles.macroStatItem}>
                          <View style={[styles.macroDot, { backgroundColor: '#FFB800' }]} />
                          <Text style={styles.macroStatText}>
                            <Text style={{ fontFamily: F.sansBold, color: '#FFB800' }}>{plan.fatG}g</Text> Fats ({fPct}%)
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* SUMMARY & WATER INTAKE */}
                    <Text style={styles.planDescText}>{plan.description}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="water-drop" size={14} color="#00B4D8" />
                        <Text style={styles.metaText}>{plan.waterIntakeLiters}L Water Target</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="restaurant-menu" size={14} color="#FFB800" />
                        <Text style={styles.metaText}>{plan.meals.length} Daily Meal Slots</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="medical-services" size={14} color="#A78BFA" />
                        <Text style={styles.metaText}>{plan.supplements.length} Supplements</Text>
                      </View>
                    </View>

                    {/* EXPANDABLE SECTION (MEALS & SUPPLEMENTS) */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <View style={styles.sectionDivider} />

                        {/* COACH GUIDELINES */}
                        <Text style={styles.subSectionTitle}>📋 COACHING GUIDELINES</Text>
                        <View style={styles.guidelinesBox}>
                          {plan.coachGuidelines.map((guide, idx) => (
                            <View key={idx} style={styles.guideRow}>
                              <MaterialIcons name="check-circle" size={14} color="#89FE00" />
                              <Text style={styles.guideText}>{guide}</Text>
                            </View>
                          ))}
                        </View>

                        {/* MEALS BREAKDOWN */}
                        <Text style={styles.subSectionTitle}>🍛 PRESCRIBED DESI MEALS ({plan.meals.length})</Text>
                        <View style={styles.mealsContainer}>
                          {plan.meals.map((meal) => (
                            <View key={meal.id} style={styles.mealCardItem}>
                              <View style={styles.mealHeaderRow}>
                                <View style={styles.mealTypeBadge}>
                                  <Text style={styles.mealTypeBadgeText}>{meal.mealType.replace('_', ' ')}</Text>
                                </View>
                                <Text style={styles.mealTimingText}>⏰ {meal.timing}</Text>
                                <Text style={styles.mealKcalText}>{meal.calories} kcal</Text>
                              </View>

                              <Text style={styles.mealTitleText}>{meal.title}</Text>
                              {meal.banglaTitle && <Text style={styles.mealBanglaText}>🇧🇩 {meal.banglaTitle}</Text>}

                              <View style={styles.foodList}>
                                {meal.foods.map((food, fIdx) => (
                                  <View key={fIdx} style={styles.foodRow}>
                                    <Text style={styles.foodBullet}>•</Text>
                                    <Text style={styles.foodText}>{food}</Text>
                                  </View>
                                ))}
                              </View>

                              <View style={styles.mealMacrosStrip}>
                                <Text style={[styles.mealMacroPill, { color: '#89FE00' }]}>{meal.proteinG}g P</Text>
                                <Text style={[styles.mealMacroPill, { color: '#00B4D8' }]}>{meal.carbsG}g C</Text>
                                <Text style={[styles.mealMacroPill, { color: '#FFB800' }]}>{meal.fatG}g F</Text>
                              </View>

                              {meal.notes && <Text style={styles.mealNotesText}>💡 Note: {meal.notes}</Text>}
                            </View>
                          ))}
                        </View>

                        {/* SUPPLEMENTS PROTOCOL */}
                        <Text style={styles.subSectionTitle}>💊 SUPPLEMENT STACK PROTOCOL</Text>
                        <View style={styles.supplementsContainer}>
                          {plan.supplements.map((sup) => (
                            <View key={sup.id} style={styles.supCardItem}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                <Text style={styles.supNameText}>{sup.name}</Text>
                                {sup.isMandatory && (
                                  <View style={styles.mandatoryBadge}>
                                    <Text style={styles.mandatoryBadgeText}>MANDATORY</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.supDosageText}>
                                🧪 <Text style={{ fontFamily: F.sansBold, color: '#A78BFA' }}>{sup.dosage}</Text> • ⏰ {sup.timing}
                              </Text>
                              <Text style={styles.supPurposeText}>🎯 Purpose: {sup.purpose}</Text>
                              {sup.brandSuggestion && (
                                <Text style={styles.supBrandText}>🏷️ Suggested: {sup.brandSuggestion}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* CARD ACTIONS */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setExpandedPlanId(isExpanded ? null : plan.id);
                        }}
                        style={styles.expandToggleBtn}>
                        <MaterialIcons
                          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                          size={18}
                          color={C.onSurfaceVariant}
                        />
                        <Text style={styles.expandToggleText}>{isExpanded ? 'Hide Details' : 'View Full Protocol'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleSelectForAssign(plan)}
                        style={[styles.assignCtaBtn, { backgroundColor: accent }]}>
                        <MaterialIcons name="person-add" size={16} color="#000" />
                        <Text style={styles.assignCtaText}>Assign Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* TAB 2: CUSTOM BUILDER */}
        {activeTab === 'BUILDER' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.builderSectionCard}>
              <View style={styles.builderSectionHeader}>
                <MaterialIcons name="tune" size={18} color="#89FE00" />
                <Text style={styles.builderSectionTitle}>1. PLAN IDENTITY & TARGET MACROS</Text>
              </View>

              <Text style={styles.formFieldLabel}>Plan Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Custom 2,400 kcal Hypertrophy Cut"
                placeholderTextColor={C.onSurfaceVariant}
                value={builderTitle}
                onChangeText={setBuilderTitle}
              />

              <Text style={styles.formFieldLabel}>Bengali Title (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. কাস্টম হাই-প্রোটিন ডায়েট প্ল্যান"
                placeholderTextColor={C.onSurfaceVariant}
                value={builderBanglaTitle}
                onChangeText={setBuilderBanglaTitle}
              />

              {/* MACRO STEPPERS GRID */}
              <Text style={styles.formFieldLabel}>Target Calories & Macronutrients</Text>
              <View style={styles.macroInputsGrid}>
                {/* CALORIES */}
                <View style={styles.macroInputBox}>
                  <Text style={styles.macroBoxLabel}>Total Calories</Text>
                  <TextInput
                    style={[styles.macroValInput, { color: '#89FE00' }]}
                    keyboardType="numeric"
                    value={builderCalories}
                    onChangeText={setBuilderCalories}
                  />
                  <Text style={styles.macroBoxSub}>kcal / day</Text>
                </View>

                {/* PROTEIN */}
                <View style={styles.macroInputBox}>
                  <Text style={styles.macroBoxLabel}>Protein</Text>
                  <TextInput
                    style={[styles.macroValInput, { color: '#89FE00' }]}
                    keyboardType="numeric"
                    value={builderProtein}
                    onChangeText={setBuilderProtein}
                  />
                  <Text style={styles.macroBoxSub}>grams (4 kcal/g)</Text>
                </View>

                {/* CARBS */}
                <View style={styles.macroInputBox}>
                  <Text style={styles.macroBoxLabel}>Carbohydrates</Text>
                  <TextInput
                    style={[styles.macroValInput, { color: '#00B4D8' }]}
                    keyboardType="numeric"
                    value={builderCarbs}
                    onChangeText={setBuilderCarbs}
                  />
                  <Text style={styles.macroBoxSub}>grams (4 kcal/g)</Text>
                </View>

                {/* FATS */}
                <View style={styles.macroInputBox}>
                  <Text style={styles.macroBoxLabel}>Fats</Text>
                  <TextInput
                    style={[styles.macroValInput, { color: '#FFB800' }]}
                    keyboardType="numeric"
                    value={builderFat}
                    onChangeText={setBuilderFat}
                  />
                  <Text style={styles.macroBoxSub}>grams (9 kcal/g)</Text>
                </View>
              </View>

              {/* MACRO MATH AUDIT BANNER */}
              <View style={styles.macroMathBanner}>
                <MaterialIcons name="calculate" size={16} color="#00B4D8" />
                <Text style={styles.macroMathText}>
                  Calculated from Macros: <Text style={{ fontFamily: F.sansBold, color: '#00B4D8' }}>{calcKcalFromMacros} kcal</Text>
                </Text>
              </View>

              <Text style={styles.formFieldLabel}>Daily Water Intake Target (Liters)</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                placeholder="e.g. 4.0"
                placeholderTextColor={C.onSurfaceVariant}
                value={builderWater}
                onChangeText={setBuilderWater}
              />
            </View>

            {/* QUICK DESI FOOD CHIPS */}
            <View style={styles.builderSectionCard}>
              <View style={styles.builderSectionHeader}>
                <MaterialIcons name="add-circle" size={18} color="#FFB800" />
                <Text style={styles.builderSectionTitle}>2. QUICK-ADD DESI FOOD STAPLES</Text>
              </View>
              <Text style={styles.quickFoodHint}>Tap any Bangladeshi food staple below to insert into Meal Slot #1:</Text>
              <View style={styles.foodChipsWrap}>
                {DESI_FOOD_QUICK_CHIPS.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => handleAddFoodChip(chip)}
                    style={styles.foodChipBtn}>
                    <Text style={styles.foodChipBtnText}>+ {chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* MEALS LIST IN BUILDER */}
            <View style={styles.builderSectionCard}>
              <View style={styles.builderSectionHeader}>
                <MaterialIcons name="restaurant" size={18} color="#A78BFA" />
                <Text style={styles.builderSectionTitle}>3. DAILY MEAL SLOTS ({builderMeals.length})</Text>
              </View>

              {builderMeals.map((meal, index) => (
                <View key={meal.id} style={styles.builderMealCard}>
                  <View style={styles.builderMealHeader}>
                    <Text style={styles.builderMealIndex}>MEAL #{index + 1}: {meal.mealType}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        setBuilderMeals(builderMeals.filter((m) => m.id !== meal.id));
                      }}>
                      <MaterialIcons name="delete-outline" size={18} color="#FF5C5C" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.builderMealTitle}>{meal.title} ({meal.timing})</Text>

                  {meal.foods.map((food, fIdx) => (
                    <Text key={fIdx} style={styles.builderFoodText}>• {food}</Text>
                  ))}

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                    <Text style={{ fontFamily: F.sansBold, fontSize: 11, color: '#89FE00' }}>{meal.proteinG}g P</Text>
                    <Text style={{ fontFamily: F.sansBold, fontSize: 11, color: '#00B4D8' }}>{meal.carbsG}g C</Text>
                    <Text style={{ fontFamily: F.sansBold, fontSize: 11, color: '#FFB800' }}>{meal.fatG}g F</Text>
                    <Text style={{ fontFamily: F.sansBold, fontSize: 11, color: C.onSurfaceVariant }}>{meal.calories} kcal</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  const newSlot: PrescribedMeal = {
                    id: `bm_${Date.now()}`,
                    mealType: 'BEDTIME_SNACK',
                    title: 'Night Fuel',
                    banglaTitle: 'রাতের নাস্তা',
                    foods: ['150g Tok Doi + 5 Walnuts'],
                    calories: 180,
                    proteinG: 12,
                    carbsG: 10,
                    fatG: 10,
                    timing: '11:00 PM',
                  };
                  setBuilderMeals([...builderMeals, newSlot]);
                }}
                style={styles.addMealBtn}>
                <MaterialIcons name="add" size={18} color="#89FE00" />
                <Text style={styles.addMealBtnText}>+ Add Another Meal Slot</Text>
              </TouchableOpacity>
            </View>

            {/* SAVE CUSTOM PLAN CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSaveCustomPlan}
              style={styles.savePlanCtaBtn}>
              <MaterialIcons name="save" size={20} color="#000" />
              <Text style={styles.savePlanCtaText}>Save Custom Diet Plan to Vault</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* TAB 3: ASSIGN PLAN TO ATHLETE */}
        {activeTab === 'ASSIGN' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* SELECTED PLAN SUMMARY */}
            <View style={styles.assignPlanSummaryCard}>
              <View style={styles.assignPlanTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignSectionLabel}>SELECTED NUTRITION PROTOCOL</Text>
                  <Text style={styles.assignPlanTitle}>{selectedPlanForAssign?.title || 'No Plan Selected'}</Text>
                  <Text style={styles.assignPlanKcal}>
                    🎯 {selectedPlanForAssign?.targetCalories} kcal • {selectedPlanForAssign?.proteinG}g Protein • {selectedPlanForAssign?.waterIntakeLiters}L Water
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('PRESETS')}
                  style={styles.changePlanBtn}>
                  <Text style={styles.changePlanBtnText}>Change ➔</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SELECT ATHLETE ROSTER */}
            <View style={styles.builderSectionCard}>
              <View style={styles.builderSectionHeader}>
                <MaterialIcons name="groups" size={18} color="#00B4D8" />
                <Text style={styles.builderSectionTitle}>CHOOSE ATHLETE FROM ROSTER</Text>
              </View>

              <View style={styles.athletesGrid}>
                {clients.map((client) => {
                  const isSelected = assignedClientId === client.id;
                  return (
                    <TouchableOpacity
                      key={client.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setAssignedClientId(client.id);
                      }}
                      style={[styles.athleteOptionCard, isSelected && styles.athleteOptionCardSelected]}>
                      <View style={styles.athleteOptionTop}>
                        <Text style={styles.athleteOptionName}>{client.name}</Text>
                        {isSelected && <MaterialIcons name="check-circle" size={16} color="#89FE00" />}
                      </View>
                      <Text style={styles.athleteOptionSub}>
                        {client.age}y • Goal: <Text style={{ color: '#89FE00' }}>{client.goal}</Text>
                      </Text>
                      <Text style={styles.athleteOptionWeight}>
                        Weight: {client.currentWeightKg}kg ➔ Target: {client.targetWeightKg}kg
                      </Text>
                      {client.dietPlan && (
                        <View style={styles.activeDietBadge}>
                          <Text style={styles.activeDietBadgeText} numberOfLines={1}>
                            Current: {client.dietPlan.dietTitle.split('(')[0]}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* COACH SPECIAL INSTRUCTIONS */}
            <View style={styles.builderSectionCard}>
              <View style={styles.builderSectionHeader}>
                <MaterialIcons name="edit-note" size={18} color="#FFB800" />
                <Text style={styles.builderSectionTitle}>COACH PRIVATE DIRECTIVES & WATER CUES</Text>
              </View>

              <TextInput
                style={styles.coachNotesArea}
                placeholder="e.g. Focus on drinking 4L water daily. Eat post-workout meal within 45 minutes of lifting. Daab water on leg days."
                placeholderTextColor={C.onSurfaceVariant}
                multiline
                numberOfLines={4}
                value={customCoachNotes}
                onChangeText={setCustomCoachNotes}
              />
            </View>

            {/* CONFIRM ASSIGN CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirmAssign}
              disabled={isAssigning}
              style={styles.confirmAssignBtn}>
              <MaterialIcons name="send" size={20} color="#000" />
              <Text style={styles.confirmAssignText}>
                {isAssigning ? 'Prescribing Protocol...' : '1-Tap Prescribe Diet Protocol'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
    color: C.onSurface,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },

  // TAB BAR
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: C.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.35)',
  },
  tabBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.sansBold,
    color: '#89FE00',
  },

  // SCROLL CONTENT
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 60,
  },

  // FILTERS
  filterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    borderColor: '#89FE00',
  },
  filterChipText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  filterChipTextActive: {
    fontFamily: F.sansBold,
    color: '#89FE00',
  },

  // PRESET CARDS
  cardsList: {
    gap: 14,
  },
  presetCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tagBadgeText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  planTitleText: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.onSurface,
    lineHeight: 20,
  },
  planBanglaText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  caloriePill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  calorieVal: {
    fontFamily: F.sansBold,
    fontSize: 18,
  },
  calorieUnit: {
    fontFamily: F.sansMedium,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  // MACRO BAR
  macroBarContainer: {
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 12,
  },
  macroBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  macroBarSegment: {
    height: '100%',
  },
  macroLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroStatText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  planDescText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.onSurfaceVariant,
    lineHeight: 18,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },

  // EXPANDED DETAILS
  expandedSection: {
    gap: 12,
    marginTop: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  subSectionTitle: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  guidelinesBox: {
    backgroundColor: 'rgba(137, 254, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.15)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  guideText: {
    flex: 1,
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },

  // MEALS LIST
  mealsContainer: {
    gap: 8,
  },
  mealCardItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealTypeBadgeText: {
    fontFamily: F.sansBold,
    fontSize: 9,
    color: '#FFB800',
  },
  mealTimingText: {
    fontFamily: F.sansMedium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  mealKcalText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#89FE00',
  },
  mealTitleText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.onSurface,
    marginTop: 2,
  },
  mealBanglaText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  foodList: {
    gap: 2,
    marginTop: 2,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  foodBullet: {
    color: '#89FE00',
    fontSize: 12,
  },
  foodText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurface,
    flex: 1,
  },
  mealMacrosStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  mealMacroPill: {
    fontFamily: F.sansBold,
    fontSize: 10,
  },
  mealNotesText: {
    fontFamily: F.sans,
    fontSize: 10,
    color: '#00B4D8',
    fontStyle: 'italic',
  },

  // SUPPLEMENTS
  supplementsContainer: {
    gap: 8,
  },
  supCardItem: {
    backgroundColor: 'rgba(167, 139, 250, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    padding: 10,
    gap: 3,
  },
  supNameText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: C.onSurface,
  },
  mandatoryBadge: {
    backgroundColor: 'rgba(255, 92, 92, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryBadgeText: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FF5C5C',
  },
  supDosageText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  supPurposeText: {
    fontFamily: F.sans,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  supBrandText: {
    fontFamily: F.sansMedium,
    fontSize: 10,
    color: '#00B4D8',
  },

  // CARD ACTIONS
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  expandToggleText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  assignCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  assignCtaText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#000',
  },

  // BUILDER SECTION CARDS
  builderSectionCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  builderSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  builderSectionTitle: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.onSurface,
    letterSpacing: 0.5,
  },
  formFieldLabel: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  formInput: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.onSurface,
    fontFamily: F.sans,
    fontSize: 13,
  },

  // MACRO INPUTS GRID
  macroInputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  macroInputBox: {
    width: '48%',
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  macroBoxLabel: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  macroValInput: {
    fontFamily: F.sansBold,
    fontSize: 18,
    paddingVertical: 2,
  },
  macroBoxSub: {
    fontFamily: F.sans,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  macroMathBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  macroMathText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurface,
  },

  // QUICK FOOD CHIPS
  quickFoodHint: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  foodChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodChipBtn: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  foodChipBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 10,
    color: '#FFB800',
  },

  // BUILDER MEALS
  builderMealCard: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  builderMealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  builderMealIndex: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#89FE00',
    letterSpacing: 0.5,
  },
  builderMealTitle: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.onSurface,
  },
  builderFoodText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(137, 254, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  addMealBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#89FE00',
  },
  savePlanCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#89FE00',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  savePlanCtaText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#000',
  },

  // ASSIGN PLAN TAB
  assignPlanSummaryCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.3)',
  },
  assignPlanTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  assignSectionLabel: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#89FE00',
    letterSpacing: 0.5,
  },
  assignPlanTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: C.onSurface,
    marginTop: 2,
  },
  assignPlanKcal: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  changePlanBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changePlanBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#89FE00',
  },

  athletesGrid: {
    gap: 8,
  },
  athleteOptionCard: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 2,
  },
  athleteOptionCardSelected: {
    borderColor: '#89FE00',
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
  },
  athleteOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  athleteOptionName: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.onSurface,
  },
  athleteOptionSub: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  athleteOptionWeight: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  activeDietBadge: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  activeDietBadgeText: {
    fontFamily: F.sansMedium,
    fontSize: 10,
    color: '#00B4D8',
  },

  coachNotesArea: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    color: C.onSurface,
    fontFamily: F.sans,
    fontSize: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#89FE00',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  confirmAssignText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#000',
  },
});
