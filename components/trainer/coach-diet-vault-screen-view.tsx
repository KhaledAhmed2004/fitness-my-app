/**
 * Coach Diet Vault & Nutrition Prescription Screen View — Pillar 2
 * Full-screen coaching command hub rendered on Tab 2 (Nutrition) when user has 'TRAINER' role.
 * Features:
 *  1. Browse & prescribe curated Desi High-Protein Diet Plans (Hypertrophy, Fat Loss, Carb Cycling, Eggetarian, Rehab).
 *  2. Build custom macro allocations (Protein, Carbs, Fat, Kcal) and meal schedules with Bangladeshi food staples.
 *  3. Prescribe clinical & performance supplement stacks (Creatine, Whey Isolate, Omega-3, D3, Collagen, ZMA).
 *  4. 1-Tap assign diet protocols directly to Athlete Client Dossiers and manage active assignments.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import { AppScreen } from '@/components/ui/app-screen';
import { AppScreenHeader } from '@/components/navigation/app-screen-header';
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
  '250ml Fresh Daab Water',
  '200g Grilled Tilapia Fish',
  '100g Sattu with Daab Water',
];

const AVAILABLE_SUPPLEMENTS: PrescribedSupplement[] = [
  {
    id: 'sup_creatine',
    name: 'Creatine Monohydrate (Creapure)',
    dosage: '5g Daily',
    timing: 'Post-workout with carbs',
    purpose: 'ATP cellular energy, muscle hydration & strength output',
    isMandatory: true,
    brandSuggestion: 'Optimum Nutrition / MuscleTech',
  },
  {
    id: 'sup_whey',
    name: 'Whey Protein Isolate 90%',
    dosage: '1 Scoop (30g = 27g Protein)',
    timing: 'Immediately post-workout',
    purpose: 'Fast leucine spike to trigger muscle protein synthesis',
    isMandatory: true,
    brandSuggestion: 'Dymatize ISO 100 / Rule 1',
  },
  {
    id: 'sup_omega3',
    name: 'Triple Strength Omega-3 (EPA 500mg / DHA 250mg)',
    dosage: '2 Softgels Daily',
    timing: 'With lunch or dinner',
    purpose: 'Joint lubrication, heart health & systemic inflammation reduction',
    isMandatory: false,
    brandSuggestion: 'Nordic Naturals / NOW Foods',
  },
  {
    id: 'sup_vitd3',
    name: 'Vitamin D3 + K2 (MK-7)',
    dosage: '5,000 IU D3 + 100mcg K2',
    timing: 'Morning with healthy fats',
    purpose: 'Bone density, testosterone regulation & immune defense',
    isMandatory: false,
    brandSuggestion: 'Doctor’s Best / Sports Research',
  },
  {
    id: 'sup_collagen',
    name: 'Hydrolyzed Marine Collagen Peptides',
    dosage: '10g Daily',
    timing: 'With Vitamin C in the morning',
    purpose: 'Spine disc rehab, tendon elasticity & joint recovery',
    isMandatory: false,
    brandSuggestion: 'Vital Proteins / Sports Research',
  },
  {
    id: 'sup_ashwagandha',
    name: 'KSM-66 Ashwagandha Root Extract',
    dosage: '600mg Daily',
    timing: '30 mins before sleep',
    purpose: 'Cortisol management, sleep depth & recovery',
    isMandatory: false,
    brandSuggestion: 'NutraBio / Jarrow Formulas',
  },
];

export function CoachDietVaultScreenView() {
  const {
    clients,
    coachDietPlans,
    assignedDietPlans,
    assignDietPlanToClient,
    addCoachDietPlan,
    deleteCoachDietPlan,
  } = useTrainerStore();

  const [activeTab, setActiveTab] = useState<TabKey>('PRESETS');
  const [selectedTag, setSelectedTag] = useState<FilterTag>('ALL');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Selected Plan for Assigning
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<CoachDietPlan | null>(
    coachDietPlans[0] || null
  );
  const [assignedClientId, setAssignedClientId] = useState<string>(
    clients[0]?.id ?? ''
  );
  const [customCoachNotes, setCustomCoachNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Custom Diet Plan Builder Form State
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderBanglaTitle, setBuilderBanglaTitle] = useState('');
  const [builderTag, setBuilderTag] = useState<string>('Hypertrophy');
  const [builderCalories, setBuilderCalories] = useState('2400');
  const [builderProtein, setBuilderProtein] = useState('175');
  const [builderCarbs, setBuilderCarbs] = useState('260');
  const [builderFat, setBuilderFat] = useState('65');
  const [builderWater, setBuilderWater] = useState('4.0');
  const [builderCarbCycling, setBuilderCarbCycling] = useState<CarbCyclingType>('BALANCED');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderColor, setBuilderColor] = useState('#89FE00');
  const [activeMealTargetIndex, setActiveMealTargetIndex] = useState<number>(1); // default Lunch

  // Custom Meals in Builder
  const [builderMeals, setBuilderMeals] = useState<PrescribedMeal[]>([
    {
      id: 'bm_1',
      mealType: 'BREAKFAST',
      title: 'Power Eggs & Oats',
      banglaTitle: 'ডিম ও ওটস নাস্তা',
      foods: ['4 Boiled Egg Whites + 2 Whole Eggs', '100g Rolled Oats with 1 Banana'],
      calories: 550,
      proteinG: 34,
      carbsG: 65,
      fatG: 16,
      timing: '08:00 AM',
    },
    {
      id: 'bm_2',
      mealType: 'LUNCH',
      title: 'Chicken, Lal Rice & Dal',
      banglaTitle: 'গ্রিলড চিকেন ও লাল চালের ভাত',
      foods: ['200g Grilled Chicken Breast', '150g Boiled Lal (Brown) Rice', '1 Bowl Thick Masoor Dal'],
      calories: 680,
      proteinG: 54,
      carbsG: 75,
      fatG: 12,
      timing: '01:30 PM',
    },
    {
      id: 'bm_3',
      mealType: 'POST_WORKOUT',
      title: 'Whey Isolate & Daab Water',
      banglaTitle: 'হোয়ে প্রোটিন ও ডাবের পানি',
      foods: ['1 Scoop Whey Protein Isolate (30g)', '250ml Fresh Daab Water'],
      calories: 220,
      proteinG: 27,
      carbsG: 24,
      fatG: 1,
      timing: '07:00 PM',
    },
    {
      id: 'bm_4',
      mealType: 'DINNER',
      title: 'River Fish & Green Salad',
      banglaTitle: 'তাজা মাছ ও শাকসবজি',
      foods: ['180g Rui/Katla Fish Fillet', '150g Tok Doi (Fresh Curd)', '2 Hand-Made Lal Atta Roti'],
      calories: 540,
      proteinG: 40,
      carbsG: 52,
      fatG: 14,
      timing: '09:30 PM',
    },
  ]);

  const [selectedSupplements, setSelectedSupplements] = useState<PrescribedSupplement[]>([
    AVAILABLE_SUPPLEMENTS[0],
    AVAILABLE_SUPPLEMENTS[1],
  ]);

  // Calculated macros sum
  const calcKcal = useMemo(() => {
    const p = parseInt(builderProtein, 10) || 0;
    const c = parseInt(builderCarbs, 10) || 0;
    const f = parseInt(builderFat, 10) || 0;
    return p * 4 + c * 4 + f * 9;
  }, [builderProtein, builderCarbs, builderFat]);

  // Filtered Diet Plans
  const filteredPlans = useMemo(() => {
    if (selectedTag === 'ALL') return coachDietPlans;
    return coachDietPlans.filter((p) => p.tag === selectedTag);
  }, [coachDietPlans, selectedTag]);

  const handleAssignPlan = async () => {
    if (!selectedPlanForAssign) {
      Alert.alert('Selection Missing', 'Please select a Diet Plan first.');
      return;
    }
    if (!assignedClientId) {
      Alert.alert('Client Missing', 'Please select an athlete client.');
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsAssigning(true);

    try {
      await assignDietPlanToClient(
        assignedClientId,
        selectedPlanForAssign.id,
        customCoachNotes.trim() || undefined
      );

      const targetClient = clients.find((c) => c.id === assignedClientId);
      Alert.alert(
        'Diet Protocol Assigned! 🥗',
        `Successfully assigned "${selectedPlanForAssign.title}" to ${targetClient?.name || 'Athlete'}. The protocol is now active on their Nutrition tab.`,
        [
          {
            text: 'View Presets Vault',
            onPress: () => {
              setActiveTab('PRESETS');
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to assign diet plan.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveCustomPlan = async () => {
    if (!builderTitle.trim()) {
      Alert.alert('Missing Title', 'Please provide a name for this custom diet plan.');
      return;
    }

    const kcal = parseInt(builderCalories, 10) || calcKcal || 2200;
    const protein = parseInt(builderProtein, 10) || 160;
    const carbs = parseInt(builderCarbs, 10) || 220;
    const fat = parseInt(builderFat, 10) || 60;
    const water = parseFloat(builderWater) || 3.5;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      const newPlanId = await addCoachDietPlan({
        code: `CUSTOM_${Date.now()}`,
        title: builderTitle.trim(),
        banglaTitle: builderBanglaTitle.trim() || undefined,
        tag: builderTag,
        targetCalories: kcal,
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
        carbCyclingType: builderCarbCycling,
        waterIntakeLiters: water,
        meals: builderMeals,
        supplements: selectedSupplements,
        coachGuidelines: [
          'Adhere strictly to prescribed daily protein and hydration targets.',
          'Log every meal accurately in the Vital Nutrition Logger.',
          'Post-workout nutrition must be consumed within 45 minutes.',
        ],
        color: builderColor,
        bg: `${builderColor}1A`,
        description: builderDescription.trim() || 'Custom tailored macro nutrition protocol.',
      });

      Alert.alert('Custom Plan Saved! 🎉', `"${builderTitle}" is now stored in your Diets Vault.`);
      setActiveTab('PRESETS');
      setExpandedPlanId(newPlanId);
    } catch (e) {
      Alert.alert('Error', 'Failed to save custom plan.');
    }
  };

  const toggleSupplementSelection = (sup: PrescribedSupplement) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedSupplements((prev) => {
      const exists = prev.some((s) => s.id === sup.id);
      if (exists) {
        return prev.filter((s) => s.id !== sup.id);
      }
      return [...prev, sup];
    });
  };

  const handleAddFoodToMeal = (food: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBuilderMeals((prev) =>
      prev.map((meal, idx) => {
        if (idx === activeMealTargetIndex) {
          return {
            ...meal,
            foods: [...meal.foods, food],
          };
        }
        return meal;
      })
    );
  };

  const handleRemoveFoodFromMeal = (mealIndex: number, foodIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBuilderMeals((prev) =>
      prev.map((meal, idx) => {
        if (idx === mealIndex) {
          return {
            ...meal,
            foods: meal.foods.filter((_, fIdx) => fIdx !== foodIndex),
          };
        }
        return meal;
      })
    );
  };

  return (
    <AppScreen style={styles.container}>
      {/* SCREEN HEADER */}
      <AppScreenHeader
        title="Diets Vault"
        subtitle="Desi Macros & Supplement Prescriptions"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('BUILDER');
            }}
            style={styles.headerActionBtn}>
            <MaterialIcons name="add" size={16} color="#000" />
            <Text style={styles.headerActionBtnText}>+ Custom Plan</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* STATS BENTO (2x2 GRID) */}
        <View style={styles.statsBentoGrid}>
          <View style={styles.bentoCard}>
            <View style={styles.bentoTopRow}>
              <MaterialIcons name="menu-book" size={18} color="#89FE00" />
              <Text style={[styles.bentoVal, { color: '#89FE00' }]}>{coachDietPlans.length}</Text>
            </View>
            <Text style={styles.bentoLbl}>Preset Plans</Text>
          </View>

          <View style={styles.bentoCard}>
            <View style={styles.bentoTopRow}>
              <MaterialIcons name="groups" size={18} color="#00B4D8" />
              <Text style={[styles.bentoVal, { color: '#00B4D8' }]}>{assignedDietPlans.length}</Text>
            </View>
            <Text style={styles.bentoLbl}>Active Athletes</Text>
          </View>

          <View style={styles.bentoCard}>
            <View style={styles.bentoTopRow}>
              <MaterialIcons name="medication" size={18} color="#FFB800" />
              <Text style={[styles.bentoVal, { color: '#FFB800' }]}>6+</Text>
            </View>
            <Text style={styles.bentoLbl}>Clinical Stacks</Text>
          </View>

          <View style={styles.bentoCard}>
            <View style={styles.bentoTopRow}>
              <MaterialIcons name="water-drop" size={18} color="#A78BFA" />
              <Text style={[styles.bentoVal, { color: '#A78BFA' }]}>3.8L</Text>
            </View>
            <Text style={styles.bentoLbl}>Avg Hydration</Text>
          </View>
        </View>

        {/* PILL TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              setActiveTab('PRESETS');
            }}
            style={[styles.tabBtn, activeTab === 'PRESETS' && styles.tabBtnActive]}>
            <MaterialIcons
              name="menu-book"
              size={15}
              color={activeTab === 'PRESETS' ? '#000' : C.onSurfaceVariant}
            />
            <Text style={[styles.tabText, activeTab === 'PRESETS' && styles.tabTextActive]}>
              Presets ({coachDietPlans.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              setActiveTab('BUILDER');
            }}
            style={[styles.tabBtn, activeTab === 'BUILDER' && styles.tabBtnActive]}>
            <MaterialIcons
              name="tune"
              size={15}
              color={activeTab === 'BUILDER' ? '#000' : C.onSurfaceVariant}
            />
            <Text style={[styles.tabText, activeTab === 'BUILDER' && styles.tabTextActive]}>
              Macro Builder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              setActiveTab('ASSIGN');
            }}
            style={[styles.tabBtn, activeTab === 'ASSIGN' && styles.tabBtnActive]}>
            <MaterialIcons
              name="person-add-alt"
              size={15}
              color={activeTab === 'ASSIGN' ? '#000' : C.onSurfaceVariant}
            />
            <Text style={[styles.tabText, activeTab === 'ASSIGN' && styles.tabTextActive]}>
              Assign ({assignedDietPlans.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: PRESETS */}
        {activeTab === 'PRESETS' && (
          <View style={styles.tabContent}>
            {/* Filter Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTagsRow}>
              {FILTER_TAGS.map((tag) => {
                const isActive = selectedTag === tag.key;
                return (
                  <TouchableOpacity
                    key={tag.key}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setSelectedTag(tag.key);
                    }}
                    style={[styles.filterTagChip, isActive && styles.filterTagChipActive]}>
                    <MaterialIcons
                      name={tag.icon}
                      size={13}
                      color={isActive ? '#000' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.filterTagChipText,
                        isActive && styles.filterTagChipTextActive,
                      ]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Plans List */}
            <View style={styles.plansList}>
              {filteredPlans.map((plan) => {
                const isExpanded = expandedPlanId === plan.id;
                const assignedCount = assignedDietPlans.filter(
                  (a) => a.dietPlanId === plan.id && a.status === 'ACTIVE'
                ).length;
                const totalMacros = plan.proteinG + plan.carbsG + plan.fatG;
                const pPct = Math.round((plan.proteinG / totalMacros) * 100);
                const cPct = Math.round((plan.carbsG / totalMacros) * 100);
                const fPct = 100 - pPct - cPct;

                return (
                  <View
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isExpanded && { borderColor: plan.color },
                    ]}>
                    {/* Top Row */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setExpandedPlanId(isExpanded ? null : plan.id);
                      }}
                      style={styles.planCardHeader}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.planBadgeRow}>
                          <View
                            style={[
                              styles.planTagPill,
                              { backgroundColor: `${plan.color}22` },
                            ]}>
                            <Text style={[styles.planTagText, { color: plan.color }]}>
                              {plan.tag.toUpperCase()}
                            </Text>
                          </View>
                          {plan.carbCyclingType === 'TRAINING_VS_REST' && (
                            <View style={styles.carbCyclePill}>
                              <Text style={styles.carbCyclePillText}>CARB CYCLING</Text>
                            </View>
                          )}
                          {assignedCount > 0 && (
                            <View style={styles.assignedBadge}>
                              <MaterialIcons name="check-circle" size={11} color="#89FE00" />
                              <Text style={styles.assignedBadgeText}>
                                {assignedCount} Active
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.planTitle}>{plan.title}</Text>
                        {plan.banglaTitle ? (
                          <Text style={styles.planBanglaTitle}>🇧🇩 {plan.banglaTitle}</Text>
                        ) : null}
                      </View>

                      <View style={[styles.planKcalPill, { borderColor: plan.color }]}>
                        <Text style={[styles.planKcalVal, { color: plan.color }]}>
                          {plan.targetCalories}
                        </Text>
                        <Text style={[styles.planKcalLbl, { color: plan.color }]}>KCAL/DAY</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Macro Distribution Segmented Bar */}
                    <View style={styles.macroBarWrapper}>
                      <View style={styles.macroBarTrack}>
                        <View style={[styles.macroBarFill, { width: `${pPct}%`, backgroundColor: '#89FE00' }]} />
                        <View style={[styles.macroBarFill, { width: `${cPct}%`, backgroundColor: '#00B4D8' }]} />
                        <View style={[styles.macroBarFill, { width: `${fPct}%`, backgroundColor: '#FFB800' }]} />
                      </View>
                    </View>

                    {/* Macro Bento Mini (4 Cols) */}
                    <View style={styles.macroMiniRow}>
                      <View style={[styles.macroPill, { backgroundColor: 'rgba(137, 254, 0, 0.10)', borderColor: 'rgba(137, 254, 0, 0.25)' }]}>
                        <Text style={[styles.macroVal, { color: '#89FE00' }]}>{plan.proteinG}g</Text>
                        <Text style={styles.macroLbl}>Protein ({pPct}%)</Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: 'rgba(0, 180, 216, 0.10)', borderColor: 'rgba(0, 180, 216, 0.25)' }]}>
                        <Text style={[styles.macroVal, { color: '#00B4D8' }]}>{plan.carbsG}g</Text>
                        <Text style={styles.macroLbl}>Carbs ({cPct}%)</Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: 'rgba(255, 184, 0, 0.10)', borderColor: 'rgba(255, 184, 0, 0.25)' }]}>
                        <Text style={[styles.macroVal, { color: '#FFB800' }]}>{plan.fatG}g</Text>
                        <Text style={styles.macroLbl}>Fats ({fPct}%)</Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: 'rgba(167, 139, 250, 0.10)', borderColor: 'rgba(167, 139, 250, 0.25)' }]}>
                        <Text style={[styles.macroVal, { color: '#A78BFA' }]}>{plan.waterIntakeLiters}L</Text>
                        <Text style={styles.macroLbl}>Water Target</Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.planDesc}>{plan.description}</Text>

                    {/* EXPANDED CONTENT: Meals, Supplements & Guidelines */}
                    {isExpanded && (
                      <View style={styles.expandedBlock}>
                        {/* Coach Guidelines */}
                        {plan.coachGuidelines.length > 0 && (
                          <View style={styles.guidelinesBox}>
                            <View style={styles.guideHeader}>
                              <MaterialIcons name="lightbulb" size={15} color="#FCC419" />
                              <Text style={styles.guideTitle}>Coach Prescription Rules</Text>
                            </View>
                            {plan.coachGuidelines.map((g, idx) => (
                              <View key={idx} style={styles.guideItem}>
                                <Text style={styles.guideBullet}>•</Text>
                                <Text style={styles.guideText}>{g}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Prescribed Meals Timeline */}
                        <View style={{ gap: 8 }}>
                          <Text style={styles.subSectionTitle}>Daily Meal Schedule ({plan.meals.length} Meals)</Text>
                          <View style={styles.mealsTimeline}>
                            {plan.meals.map((meal) => (
                              <View key={meal.id} style={styles.mealCard}>
                                <View style={styles.mealTop}>
                                  <View style={styles.mealTimingBadge}>
                                    <Text style={styles.mealTimingText}>{meal.timing}</Text>
                                  </View>
                                  <Text style={styles.mealCardTitle}>{meal.title}</Text>
                                  <Text style={styles.mealCardKcal}>{meal.calories} kcal</Text>
                                </View>
                                <Text style={styles.mealFoodsText}>
                                  {meal.foods.join(' • ')}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Prescribed Supplements */}
                        {plan.supplements.length > 0 && (
                          <View style={{ gap: 8, marginTop: 2 }}>
                            <Text style={styles.subSectionTitle}>
                              Clinical & Performance Supplements ({plan.supplements.length})
                            </Text>
                            <View style={styles.supplementsList}>
                              {plan.supplements.map((sup) => (
                                <View key={sup.id} style={styles.supItemCard}>
                                  <MaterialIcons name="medication" size={16} color="#A78BFA" />
                                  <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={styles.supName}>
                                      {sup.name} <Text style={styles.supDosage}>({sup.dosage})</Text>
                                    </Text>
                                    <Text style={styles.supTiming}>
                                      🕒 {sup.timing} • {sup.purpose}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Action Bar */}
                    <View style={styles.planCardFooter}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setExpandedPlanId(isExpanded ? null : plan.id);
                        }}
                        style={styles.expandToggleBtn}>
                        <Text style={styles.expandToggleText}>
                          {isExpanded ? 'Hide Protocol' : 'View Meals & Supplements'}
                        </Text>
                        <MaterialIcons
                          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                          size={16}
                          color={C.onSurfaceVariant}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                          setSelectedPlanForAssign(plan);
                          setActiveTab('ASSIGN');
                        }}
                        style={styles.assignCtaBtn}>
                        <MaterialIcons name="person-add" size={14} color="#000" />
                        <Text style={styles.assignCtaBtnText}>Assign to Athlete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 2: BUILDER */}
        {activeTab === 'BUILDER' && (
          <View style={styles.tabContent}>
            <View style={styles.builderCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <Text style={styles.builderSectionTitle}>Protocol Essentials</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Plan Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Desi 200g Lean Hypertrophy Protocol"
                  placeholderTextColor={C.onSurfaceVariant}
                  value={builderTitle}
                  onChangeText={setBuilderTitle}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bangla Title (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. দেশি হাই-প্রোটিন লিন বাল্কিং ডায়েট"
                  placeholderTextColor={C.onSurfaceVariant}
                  value={builderBanglaTitle}
                  onChangeText={setBuilderBanglaTitle}
                />
              </View>

              {/* Goal Tag Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Target Goal Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.goalChipsRow}>
                  {['Hypertrophy', 'Fat Loss', 'Carb Cycling', 'Eggetarian', 'Rehab'].map((g) => {
                    const isSelected = builderTag === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setBuilderTag(g);
                        }}
                        style={[styles.goalChip, isSelected && styles.goalChipSelected]}>
                        <Text style={[styles.goalChipText, isSelected && styles.goalChipTextSelected]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Step 2: Target Macros */}
              <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <Text style={styles.builderSectionTitle}>Daily Macro & Calorie Targets</Text>
              </View>

              <View style={styles.macroInputsGrid}>
                <View style={[styles.macroInputBox, { borderColor: '#89FE00' }]}>
                  <Text style={[styles.macroFieldLbl, { color: '#89FE00' }]}>PROTEIN (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    value={builderProtein}
                    onChangeText={setBuilderProtein}
                  />
                  <Text style={styles.macroUnit}>4 kcal/g</Text>
                </View>

                <View style={[styles.macroInputBox, { borderColor: '#00B4D8' }]}>
                  <Text style={[styles.macroFieldLbl, { color: '#00B4D8' }]}>CARBS (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    value={builderCarbs}
                    onChangeText={setBuilderCarbs}
                  />
                  <Text style={styles.macroUnit}>4 kcal/g</Text>
                </View>

                <View style={[styles.macroInputBox, { borderColor: '#FFB800' }]}>
                  <Text style={[styles.macroFieldLbl, { color: '#FFB800' }]}>FATS (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    value={builderFat}
                    onChangeText={setBuilderFat}
                  />
                  <Text style={styles.macroUnit}>9 kcal/g</Text>
                </View>

                <View style={[styles.macroInputBox, { borderColor: '#A78BFA' }]}>
                  <Text style={[styles.macroFieldLbl, { color: '#A78BFA' }]}>TOTAL KCAL</Text>
                  <TextInput
                    style={styles.macroInput}
                    keyboardType="numeric"
                    value={builderCalories}
                    onChangeText={setBuilderCalories}
                  />
                  <Text style={styles.macroUnit}>Auto: {calcKcal}</Text>
                </View>
              </View>

              {/* Step 3: Meal Schedule Designer */}
              <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <Text style={styles.builderSectionTitle}>Meal Schedule & Desi Food Staples</Text>
              </View>

              {/* Meal Selector Tabs */}
              <View style={styles.mealTargetSelectorRow}>
                {builderMeals.map((meal, idx) => {
                  const isSelected = activeMealTargetIndex === idx;
                  return (
                    <TouchableOpacity
                      key={meal.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setActiveMealTargetIndex(idx);
                      }}
                      style={[
                        styles.mealTargetPill,
                        isSelected && styles.mealTargetPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.mealTargetText,
                          isSelected && styles.mealTargetTextActive,
                        ]}>
                        {meal.title.split(' ')[0]} ({meal.foods.length})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Meal's Current Foods */}
              <View style={styles.activeMealCard}>
                <View style={styles.activeMealHeader}>
                  <MaterialIcons name="restaurant" size={14} color="#89FE00" />
                  <Text style={styles.activeMealTitle}>
                    {builderMeals[activeMealTargetIndex]?.title} ({builderMeals[activeMealTargetIndex]?.timing})
                  </Text>
                </View>
                <View style={styles.foodPillsWrap}>
                  {builderMeals[activeMealTargetIndex]?.foods.map((food, fIdx) => (
                    <View key={fIdx} style={styles.foodPill}>
                      <Text style={styles.foodPillText}>{food}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveFoodFromMeal(activeMealTargetIndex, fIdx)}
                        hitSlop={8}>
                        <MaterialIcons name="close" size={12} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Quick Desi Food Chips Cloud */}
              <Text style={styles.quickChipGuideText}>
                Tap below to add Bangladeshi staples to {builderMeals[activeMealTargetIndex]?.title}:
              </Text>
              <View style={styles.chipsWrap}>
                {DESI_FOOD_QUICK_CHIPS.map((chip, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    onPress={() => handleAddFoodToMeal(chip)}
                    style={styles.stapleChip}>
                    <Text style={styles.stapleChipText}>+ {chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Step 4: Clinical Supplements */}
              <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>4</Text>
                </View>
                <Text style={styles.builderSectionTitle}>
                  Clinical Supplements Stack ({selectedSupplements.length} Selected)
                </Text>
              </View>

              <View style={styles.supSelectorGrid}>
                {AVAILABLE_SUPPLEMENTS.map((sup) => {
                  const isSelected = selectedSupplements.some((s) => s.id === sup.id);
                  return (
                    <TouchableOpacity
                      key={sup.id}
                      activeOpacity={0.8}
                      onPress={() => toggleSupplementSelection(sup)}
                      style={[
                        styles.supSelectCard,
                        isSelected && styles.supSelectCardActive,
                      ]}>
                      <MaterialIcons
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                        size={16}
                        color={isSelected ? '#89FE00' : C.onSurfaceVariant}
                      />
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text
                          style={[
                            styles.supSelectName,
                            isSelected && { color: '#89FE00' },
                          ]}>
                          {sup.name}
                        </Text>
                        <Text style={styles.supSelectDosage}>{sup.dosage} • {sup.timing}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save Plan CTA */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveCustomPlan}
                style={styles.savePlanBtn}>
                <MaterialIcons name="save" size={18} color="#000" />
                <Text style={styles.savePlanBtnText}>Save Custom Protocol to Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 3: ASSIGN */}
        {activeTab === 'ASSIGN' && (
          <View style={styles.tabContent}>
            {/* Active Assignment Form */}
            <View style={styles.assignFormCard}>
              <Text style={styles.assignHeader}>1-Tap Assign Diet to Athlete</Text>

              {/* Step A: Select Athlete */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>1. Select Athlete Client *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.clientPickerScroll}>
                  {clients.map((c) => {
                    const isSelected = assignedClientId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setAssignedClientId(c.id);
                        }}
                        style={[
                          styles.clientPickChip,
                          isSelected && styles.clientPickChipSelected,
                        ]}>
                        <View style={[styles.clientAvatarMini, isSelected && { backgroundColor: '#000' }]}>
                          <Text style={[styles.clientAvatarText, isSelected && { color: '#89FE00' }]}>
                            {c.name.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={[
                              styles.clientPickText,
                              isSelected && styles.clientPickTextSelected,
                            ]}>
                            {c.name}
                          </Text>
                          <Text style={[styles.clientGoalSub, isSelected && { color: 'rgba(0,0,0,0.7)' }]}>
                            {c.goal}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Step B: Select Plan */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>2. Select Protocol to Prescribe *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.clientPickerScroll}>
                  {coachDietPlans.map((p) => {
                    const isSelected = selectedPlanForAssign?.id === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setSelectedPlanForAssign(p);
                        }}
                        style={[
                          styles.planPickChip,
                          isSelected && styles.planPickChipSelected,
                        ]}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.planPickTitle,
                              isSelected && styles.planPickTitleSelected,
                            ]}>
                            {p.title.split('(')[0].trim()}
                          </Text>
                          <Text
                            style={[
                              styles.planPickSub,
                              isSelected && { color: 'rgba(0,0,0,0.7)' },
                            ]}>
                            {p.targetCalories} kcal • {p.proteinG}g Protein
                          </Text>
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={16} color="#000" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Step C: Custom Coach Notes */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>3. Coach Personalized Guidelines (Optional)</Text>
                <TextInput
                  style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="e.g. Adhere to 4L water goal, avoid trans fats, post-workout Daab water mandatory."
                  placeholderTextColor={C.onSurfaceVariant}
                  multiline
                  value={customCoachNotes}
                  onChangeText={setCustomCoachNotes}
                />
              </View>

              {/* Execute Assignment CTA */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isAssigning}
                onPress={handleAssignPlan}
                style={[styles.confirmAssignBtn, isAssigning && { opacity: 0.6 }]}>
                <MaterialIcons name="send" size={18} color="#000" />
                <Text style={styles.confirmAssignBtnText}>
                  {isAssigning ? 'Prescribing Protocol...' : 'Prescribe & Push to Athlete'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Currently Active Assignments List */}
            <View style={styles.activeAssignmentsSection}>
              <Text style={styles.activeSectionTitle}>
                Currently Active Prescriptions ({assignedDietPlans.length})
              </Text>
              {assignedDietPlans.map((asg) => (
                <View key={asg.id} style={styles.activeAsgCard}>
                  <View style={styles.asgTopRow}>
                    <View style={styles.asgAvatar}>
                      <Text style={styles.asgAvatarText}>{asg.clientName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.asgClientName}>{asg.clientName}</Text>
                      <Text style={styles.asgDietTitle} numberOfLines={1}>{asg.dietTitle}</Text>
                    </View>
                    <View style={styles.asgKcalBadge}>
                      <Text style={styles.asgKcalVal}>{asg.calories} kcal</Text>
                    </View>
                  </View>
                  <Text style={styles.asgNotes} numberOfLines={2}>
                    📝 {asg.customNotes || 'High adherence required.'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerActionBtnText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#000',
  },
  statsBentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bentoCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bentoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoVal: {
    fontSize: 18,
    fontFamily: F.bold,
  },
  bentoLbl: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surfaceLow,
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#89FE00',
  },
  tabText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
  },
  tabTextActive: {
    color: '#000',
    fontFamily: F.bold,
  },
  tabContent: {
    gap: 14,
  },
  filterTagsRow: {
    gap: 8,
  },
  filterTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  filterTagChipActive: {
    backgroundColor: '#89FE00',
    borderColor: '#89FE00',
  },
  filterTagChipText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  filterTagChipTextActive: {
    color: '#000',
    fontFamily: F.bold,
  },
  plansList: {
    gap: 14,
  },
  planCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  planTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planTagText: {
    fontSize: 10,
    fontFamily: F.bold,
    letterSpacing: 0.5,
  },
  carbCyclePill: {
    backgroundColor: 'rgba(0, 180, 216, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  carbCyclePillText: {
    fontSize: 9,
    fontFamily: F.bold,
    color: '#00B4D8',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assignedBadgeText: {
    fontSize: 10,
    fontFamily: F.sansSemiBold,
    color: '#89FE00',
  },
  planTitle: {
    fontSize: 15,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  planBanglaTitle: {
    fontSize: 12,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  planKcalPill: {
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  planKcalVal: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  planKcalLbl: {
    fontSize: 8,
    fontFamily: F.bold,
    marginTop: 1,
  },
  macroBarWrapper: {
    gap: 4,
  },
  macroBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
  },
  macroMiniRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  macroVal: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  macroLbl: {
    fontSize: 9,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  planDesc: {
    fontSize: 12,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  expandedBlock: {
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  guidelinesBox: {
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FCC419',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guideTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#FCC419',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  guideBullet: {
    color: '#FCC419',
    fontSize: 14,
  },
  guideText: {
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurface,
    flex: 1,
    lineHeight: 15,
  },
  subSectionTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  mealsTimeline: {
    gap: 6,
  },
  mealCard: {
    backgroundColor: C.surfaceLow,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTimingBadge: {
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealTimingText: {
    fontSize: 10,
    fontFamily: F.bold,
    color: '#FF922B',
  },
  mealCardTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
    flex: 1,
  },
  mealCardKcal: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  mealFoodsText: {
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  supplementsList: {
    gap: 6,
  },
  supItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceLow,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  supName: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  supDosage: {
    color: '#A78BFA',
    fontFamily: F.sansSemiBold,
  },
  supTiming: {
    fontSize: 10,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  planCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandToggleText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  assignCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  assignCtaBtnText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#000',
  },
  builderCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#89FE00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#000',
  },
  builderSectionTitle: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
  },
  input: {
    backgroundColor: C.surfaceLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.onSurface,
    fontSize: 13,
    fontFamily: F.sansMedium,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  goalChipsRow: {
    gap: 6,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  goalChipSelected: {
    backgroundColor: '#89FE00',
    borderColor: '#89FE00',
  },
  goalChipText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  goalChipTextSelected: {
    fontFamily: F.bold,
    color: '#000',
  },
  macroInputsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  macroInputBox: {
    flex: 1,
    backgroundColor: C.surfaceLow,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroFieldLbl: {
    fontSize: 9,
    fontFamily: F.bold,
  },
  macroInput: {
    fontSize: 15,
    fontFamily: F.bold,
    color: C.onSurface,
    paddingVertical: 2,
    textAlign: 'center',
  },
  macroUnit: {
    fontSize: 8,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  mealTargetSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mealTargetPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.surfaceLow,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  mealTargetPillActive: {
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    borderColor: '#89FE00',
  },
  mealTargetText: {
    fontSize: 10,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  mealTargetTextActive: {
    fontFamily: F.bold,
    color: '#89FE00',
  },
  activeMealCard: {
    backgroundColor: C.surfaceLow,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  activeMealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeMealTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  foodPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  foodPillText: {
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurface,
  },
  quickChipGuideText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stapleChip: {
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  stapleChipText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurface,
  },
  supSelectorGrid: {
    gap: 6,
  },
  supSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceLow,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  supSelectCardActive: {
    borderColor: 'rgba(137, 254, 0, 0.4)',
    backgroundColor: 'rgba(137, 254, 0, 0.08)',
  },
  supSelectName: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  supSelectDosage: {
    fontSize: 10,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  savePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  savePlanBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#000',
  },
  assignFormCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  assignHeader: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  clientPickerScroll: {
    gap: 8,
    paddingRight: 8,
  },
  clientPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  clientPickChipSelected: {
    backgroundColor: '#89FE00',
    borderColor: '#89FE00',
  },
  clientAvatarMini: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(137, 254, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  clientPickText: {
    fontSize: 12,
    fontFamily: F.sansSemiBold,
    color: C.onSurface,
  },
  clientPickTextSelected: {
    fontFamily: F.bold,
    color: '#000',
  },
  clientGoalSub: {
    fontSize: 9,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  planPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    minWidth: 160,
  },
  planPickChipSelected: {
    backgroundColor: '#89FE00',
    borderColor: '#89FE00',
  },
  planPickTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  planPickTitleSelected: {
    color: '#000',
  },
  planPickSub: {
    fontSize: 10,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  confirmAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#89FE00',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  confirmAssignBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#000',
  },
  activeAssignmentsSection: {
    gap: 10,
    marginTop: 4,
  },
  activeSectionTitle: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  activeAsgCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  asgTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  asgAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  asgAvatarText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  asgClientName: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  asgDietTitle: {
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  asgKcalBadge: {
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  asgKcalVal: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  asgNotes: {
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
});
