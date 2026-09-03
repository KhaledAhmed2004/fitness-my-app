/**
 * Coach Prescribed Diet Plan Card — Nutrition Screen Integration
 * Displays read-only summary of the coach's prescribed diet protocol,
 * macro targets, hydration goal, prescribed supplements, and guidelines.
 * 
 * ROLE-BASED PROTECTION:
 * - When role === 'USER' (Athlete/Client): Displays their personalized coach diet plan.
 * - When role === 'TRAINER' (Coach): Hidden from Nutrition screen (managed via Diets Vault).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/contexts/auth-context';
import { useTrainerStore } from '@/stores/trainer-store';
import type { AssignedDietPlan, AthleteClientDossier, CoachDietPlan } from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;

export function CoachDietPlanCard() {
  const { user } = useAuth();
  const { clients, assignedDietPlans, coachDietPlans } = useTrainerStore();
  const [expanded, setExpanded] = useState(false);

  // 1. Role Check: If logged in as TRAINER, hide this card from the Nutrition Screen
  if (user?.role === 'TRAINER') {
    return null;
  }

  // 2. Client Resolution: Find client record matching the logged-in user
  const activeClient: AthleteClientDossier | undefined = useMemo(() => {
    if (!clients || clients.length === 0) return undefined;
    if (user?.email) {
      const byEmail = clients.find(
        (c) => c.email.toLowerCase() === user.email.toLowerCase()
      );
      if (byEmail) return byEmail;
    }
    if (user?.name) {
      const byName = clients.find(
        (c) => c.name.toLowerCase() === user.name.toLowerCase()
      );
      if (byName) return byName;
    }
    return clients[0];
  }, [clients, user]);

  // 3. Assigned Diet Plan Resolution
  const activeDietPlan: AssignedDietPlan | undefined = useMemo(() => {
    if (!activeClient) return undefined;
    if (activeClient.dietPlan && activeClient.dietPlan.status === 'ACTIVE') {
      return activeClient.dietPlan;
    }
    return assignedDietPlans.find(
      (a) => a.clientId === activeClient.id && a.status === 'ACTIVE'
    );
  }, [activeClient, assignedDietPlans]);

  // 4. Template matching for meal breakdown
  const templatePlan: CoachDietPlan | undefined = useMemo(() => {
    if (!activeDietPlan) return undefined;
    return coachDietPlans.find((p) => p.id === activeDietPlan.dietPlanId);
  }, [activeDietPlan, coachDietPlans]);

  // If no diet plan has been assigned yet to this athlete, hide the card
  if (!activeDietPlan) {
    return null;
  }

  const handleToggleExpand = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.card}>
      {/* TOP HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="restaurant-menu" size={20} color="#89FE00" />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.badgeRow}>
              <Text style={styles.superTitle}>COACH PRESCRIBED DIET</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>ACTIVE PROTOCOL</Text>
              </View>
            </View>
            <Text style={styles.dietTitle} numberOfLines={1}>
              {activeDietPlan.dietTitle || 'Custom Nutrition Protocol'}
            </Text>
          </View>
        </View>
      </View>

      {/* MACROS BENTO GRID */}
      <View style={styles.macrosBento}>
        <View style={[styles.bentoSlot, { borderColor: 'rgba(137, 254, 0, 0.25)' }]}>
          <Text style={[styles.bentoValue, { color: '#89FE00' }]}>
            {activeDietPlan.calories}
          </Text>
          <Text style={styles.bentoLabel}>KCAL TARGET</Text>
        </View>

        <View style={[styles.bentoSlot, { borderColor: 'rgba(137, 254, 0, 0.2)' }]}>
          <Text style={[styles.bentoValue, { color: '#89FE00' }]}>
            {activeDietPlan.proteinG}g
          </Text>
          <Text style={styles.bentoLabel}>PROTEIN</Text>
        </View>

        <View style={[styles.bentoSlot, { borderColor: 'rgba(0, 180, 216, 0.2)' }]}>
          <Text style={[styles.bentoValue, { color: '#00B4D8' }]}>
            {activeDietPlan.carbsG}g
          </Text>
          <Text style={styles.bentoLabel}>CARBS</Text>
        </View>

        <View style={[styles.bentoSlot, { borderColor: 'rgba(255, 184, 0, 0.2)' }]}>
          <Text style={[styles.bentoValue, { color: '#FFB800' }]}>
            {activeDietPlan.fatG}g
          </Text>
          <Text style={styles.bentoLabel}>FATS</Text>
        </View>
      </View>

      {/* QUICK META ROW: Hydration & Assignment Date */}
      <View style={styles.metaRow}>
        {activeDietPlan.waterIntakeLiters ? (
          <View style={styles.metaPill}>
            <MaterialIcons name="water-drop" size={13} color="#00B4D8" />
            <Text style={styles.metaPillText}>
              {activeDietPlan.waterIntakeLiters}L Daily Hydration
            </Text>
          </View>
        ) : null}

        {activeDietPlan.assignedAt ? (
          <View style={styles.metaPill}>
            <MaterialIcons name="event" size={13} color={C.onSurfaceVariant} />
            <Text style={styles.metaPillText}>
              Assigned {new Date(activeDietPlan.assignedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        ) : null}
      </View>

      {/* COACH CUSTOM NOTES (Always visible if present) */}
      {activeDietPlan.customNotes ? (
        <View style={styles.coachNotesBox}>
          <MaterialIcons name="format-quote" size={14} color="#89FE00" />
          <Text style={styles.coachNotesText} numberOfLines={expanded ? undefined : 2}>
            {activeDietPlan.customNotes}
          </Text>
        </View>
      ) : null}

      {/* EXPANDABLE DETAILS: Supplements & Meals Overview */}
      {expanded && (
        <View style={styles.expandedSection}>
          {/* SUPPLEMENTS STACK */}
          {activeDietPlan.supplementsList && activeDietPlan.supplementsList.length > 0 && (
            <View style={styles.subSection}>
              <View style={styles.subSectionHeader}>
                <MaterialIcons name="medication" size={15} color="#A78BFA" />
                <Text style={styles.subSectionTitle}>Prescribed Supplements</Text>
              </View>
              <View style={styles.supplementsList}>
                {activeDietPlan.supplementsList.map((sup, idx) => (
                  <View key={sup.id || `sup_${idx}`} style={styles.supplementItem}>
                    <View style={styles.supBullet} />
                    <View style={styles.supContent}>
                      <Text style={styles.supName}>
                        {sup.name} • <Text style={styles.supDosage}>{sup.dosage}</Text>
                      </Text>
                      <Text style={styles.supTiming}>{sup.timing} — {sup.purpose}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TEMPLATE MEAL TIMELINE IF AVAILABLE */}
          {templatePlan?.meals && templatePlan.meals.length > 0 && (
            <View style={styles.subSection}>
              <View style={styles.subSectionHeader}>
                <MaterialIcons name="schedule" size={15} color="#FF922B" />
                <Text style={styles.subSectionTitle}>Scheduled Meals Overview</Text>
              </View>
              <View style={styles.mealsTimeline}>
                {templatePlan.meals.map((m, mIdx) => (
                  <View key={m.id || `meal_${mIdx}`} style={styles.mealRow}>
                    <View style={styles.mealTimeBadge}>
                      <Text style={styles.mealTimeText}>{m.timing}</Text>
                    </View>
                    <View style={styles.mealDetails}>
                      <Text style={styles.mealTitle}>{m.title}</Text>
                      <Text style={styles.mealFoods} numberOfLines={1}>
                        {m.foods.join(', ')}
                      </Text>
                    </View>
                    <Text style={styles.mealKcal}>{m.calories} kcal</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* EXPAND / COLLAPSE TOGGLE */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleToggleExpand}
        style={styles.expandToggleBtn}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide Protocol Details' : 'View Full Protocol & Supplements'}>
        <Text style={styles.expandToggleText}>
          {expanded ? 'Hide Protocol Details' : 'View Full Protocol & Supplements'}
        </Text>
        <MaterialIcons
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={18}
          color={C.onSurfaceVariant}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.25)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  superTitle: {
    fontSize: 10,
    fontFamily: F.bold,
    color: '#89FE00',
    letterSpacing: 0.8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#89FE00',
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: F.bold,
    color: '#89FE00',
    letterSpacing: 0.4,
  },
  dietTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  macrosBento: {
    flexDirection: 'row',
    gap: 8,
  },
  bentoSlot: {
    flex: 1,
    backgroundColor: C.surfaceLow,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bentoValue: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  bentoLabel: {
    fontSize: 9,
    fontFamily: F.bold,
    color: C.onSurfaceVariant,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaPillText: {
    fontSize: 11,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
  },
  coachNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(137, 254, 0, 0.06)',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#89FE00',
  },
  coachNotesText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: C.onSurface,
    flex: 1,
    lineHeight: 16,
  },
  expandedSection: {
    gap: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  subSection: {
    gap: 8,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subSectionTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  supplementsList: {
    gap: 6,
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.surfaceLow,
    padding: 8,
    borderRadius: 10,
  },
  supBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
    marginTop: 5,
  },
  supContent: {
    flex: 1,
    gap: 2,
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
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  mealsTimeline: {
    gap: 6,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceLow,
    padding: 8,
    borderRadius: 10,
  },
  mealTimeBadge: {
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mealTimeText: {
    fontSize: 10,
    fontFamily: F.bold,
    color: '#FF922B',
  },
  mealDetails: {
    flex: 1,
    gap: 1,
  },
  mealTitle: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.onSurface,
  },
  mealFoods: {
    fontSize: 11,
    fontFamily: F.sansRegular,
    color: C.onSurfaceVariant,
  },
  mealKcal: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#89FE00',
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  expandToggleText: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
    color: C.onSurfaceVariant,
  },
});
