import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { WorkoutUseCases } from '@/use-cases/workout.use-cases';
import { WorkoutRepository, ActiveWorkoutData, WorkoutSession } from '@/repositories/workout.repository';
import { PlanRepository, TodaysPlanResult } from '@/repositories/plan.repository';
import { ActiveTimeWidget } from '@/components/training/active-time-widget';
import { AppScreen } from '@/components/ui/app-screen';
import { AppScreenHeader } from '@/components/navigation/app-screen-header';
import { RunStatsWidget } from '@/components/training/run-stats-widget';
import { CaloriesBurntChart } from '@/components/training/calories-burnt-chart';
import { TodayWorkoutCard } from '@/components/training/today-workout-card';
import { PlanWeekStrip } from '@/components/training/plan-week-strip';
import { PlanManagerSheet } from '@/components/training/plan-manager-sheet';
import { PlanDayPickerModal } from '@/components/training/plan-day-picker-modal';
import { EquipmentPlanWizardModal } from '@/components/training/equipment-plan-wizard-modal';
import {
  TargetMuscleVisualizer,
  MuscleSide,
  FRONT_MUSCLES,
  BACK_MUSCLES,
} from '@/components/training/target-muscle-visualizer';
import { TrainerScheduleModal } from '@/components/trainer/trainer-schedule-modal';
import { TrainerProfileModal } from '@/components/trainer/trainer-profile-modal';
import { ClientCrmModal } from '@/components/trainer/client-crm-modal';
import { CoachTrainingStudioView } from '@/components/trainer/coach-training-studio-view';
import { GymFloorCommandScreenView } from '@/components/gym-owner';
import { useTrainerStore } from '@/stores/trainer-store';
import { useAuth } from '@/hooks/use-auth';

const T = TrainingTheme;
const F = Vital.fonts;

export default function TrainingHubScreen() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER' || (user?.email || '').toLowerCase().includes('trainer');
  const isGymOwner = user?.role === 'GYM_OWNER';
  const [showPersonalTraining, setShowPersonalTraining] = useState(false);

  if (isTrainer) {
    return <CoachTrainingStudioView />;
  }

  if (isGymOwner && !showPersonalTraining) {
    return <GymFloorCommandScreenView onTogglePersonalTraining={() => setShowPersonalTraining(true)} />;
  }

  return (
    <ClientTrainingHubContent
      onToggleFloorOps={isGymOwner ? () => setShowPersonalTraining(false) : undefined}
    />
  );
}

function ClientTrainingHubContent({ onToggleFloorOps }: { onToggleFloorOps?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointments, loadTrainerData } = useTrainerStore();

  const [activeSession, setActiveSession] = useState<ActiveWorkoutData | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [todaysPlan, setTodaysPlan] = useState<TodaysPlanResult | null>(null);
  const [forcedDayId, setForcedDayId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [planManagerVisible, setPlanManagerVisible] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [trainerScheduleVisible, setTrainerScheduleVisible] = useState(false);
  const [trainerProfileVisible, setTrainerProfileVisible] = useState(false);
  const [clientCrmVisible, setClientCrmVisible] = useState(false);

  // Muscle Target Selector State (Synced with scheduled plan day)
  const [activeSide, setActiveSide] = useState<MuscleSide>('FRONT');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([
    'shoulder',
    'chest',
    'triceps',
  ]);

  useEffect(() => {
    void loadTrainerData();
  }, [loadTrainerData]);

  // Fetch active session, plan data, and history
  const loadScreenData = useCallback(async (customForcedDayId?: string) => {
    try {
      const session = await WorkoutUseCases.getActiveSession();
      const history = await WorkoutRepository.getHistory();
      const planResult = await PlanRepository.getTodaysPlanDay(customForcedDayId || forcedDayId);

      setActiveSession(session);
      setWorkoutHistory(history.slice(0, 3));
      setTodaysPlan(planResult);

      // Auto-sync target muscles with scheduled plan day
      if (planResult?.day?.target_muscle_groups) {
        const muscles = planResult.day.target_muscle_groups
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);
        if (muscles.length > 0) {
          setSelectedMuscles(muscles);
        }
      }
    } catch (error) {
      console.error("Failed to load training data", error);
    } finally {
      setIsLoading(false);
    }
  }, [forcedDayId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadScreenData();
    }, [loadScreenData])
  );

  const toggleMuscle = (id: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectedMuscleNames = useMemo(() => {
    const all = [...FRONT_MUSCLES, ...BACK_MUSCLES];
    const unique = Array.from(new Set(selectedMuscles));
    return unique
      .map((id) => all.find((m) => m.id === id)?.name || id)
      .join(', ');
  }, [selectedMuscles]);

  const handleStartWorkoutFromPlan = async (planDayId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      setIsLoading(true);
      const sessionId = await WorkoutUseCases.startFromPlanDay(planDayId);
      router.push(`/training/workout-session?id=${sessionId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not start workout.');
      setIsLoading(false);
    }
  };

  const handleStartCustomWorkout = async (customTitle?: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const workoutName = customTitle || (selectedMuscles.length > 0 ? `${selectedMuscleNames} Session` : 'New Workout');
      const sessionId = await WorkoutUseCases.startWorkout(workoutName);
      router.push(`/training/workout-session?id=${sessionId}`);
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleResumeWorkout = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (activeSession) {
      router.push(`/training/workout-session?id=${activeSession.id}`);
    }
  };

  const handleRepeatWorkout = async (pastSessionId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      setIsLoading(true);
      const newSessionId = await WorkoutUseCases.repeatWorkout(pastSessionId);
      router.push(`/training/workout-session?id=${newSessionId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not repeat workout.');
      setIsLoading(false);
    }
  };

  const handleSelectDay = (dayId: string) => {
    setForcedDayId(dayId);
    loadScreenData(dayId);
  };

  const muscleContextBadge = useMemo(() => {
    if (todaysPlan?.isRestDay && todaysPlan?.day) {
      return `PREVIEW: ${todaysPlan.day.day_label.toUpperCase()}`;
    }
    if (todaysPlan?.day) {
      return `TODAY: ${todaysPlan.day.day_label.toUpperCase()}`;
    }
    return `${selectedMuscles.length} TARGET MUSCLES`;
  }, [todaysPlan, selectedMuscles]);

  return (
    <AppScreen>
      <AppScreenHeader
        title="Training"
        subtitle="Stay consistent"
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <View style={styles.screenWrapper}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 130 },
            ]}
            showsVerticalScrollIndicator={false}>
            {/* 1. ACTIVE SESSION RESUME HERO OR TODAY'S WORKOUT CARD */}
            {activeSession ? (
              <Pressable
                style={[styles.heroCard, styles.heroCardActive]}
                accessibilityRole="button"
                accessibilityLabel="Resume active workout in progress"
                onPress={handleResumeWorkout}>
                <View style={styles.heroCardContent}>
                  <View style={[styles.iconContainer, styles.iconContainerActive]}>
                    <MaterialIcons name="fitness-center" size={26} color={T.onPrimary} />
                  </View>
                  <View style={styles.heroTextContainer}>
                    <View style={styles.heroBadgeRow}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.heroBadgeText}>ACTIVE SESSION IN PROGRESS</Text>
                    </View>
                    <Text style={styles.heroTitle}>Resume Workout</Text>
                    <Text style={styles.heroSubtitle}>Tap to jump back into your active set</Text>
                  </View>
                  <View style={styles.chevronBox}>
                    <MaterialIcons name="arrow-forward" size={18} color={T.primary} />
                  </View>
                </View>
              </Pressable>
            ) : (
              <TodayWorkoutCard
                planData={todaysPlan}
                onStartWorkout={handleStartWorkoutFromPlan}
                onOpenPlanManager={() => setPlanManagerVisible(true)}
                onOpenDayPicker={() => setDayPickerVisible(true)}
                onOpenWizard={() => setWizardVisible(true)}
              />
            )}

            {/* 2. WEEKLY SCHEDULE STRIP */}
            {todaysPlan?.allDays && todaysPlan.allDays.length > 0 ? (
              <PlanWeekStrip
                days={todaysPlan.allDays}
                currentWeekdayIndex={todaysPlan.currentWeekdayIndex}
                selectedDayId={todaysPlan.day?.id}
                onSelectDay={handleSelectDay}
              />
            ) : null}

            {/* 3. TARGET MUSCLE VISUALIZER (AUTO-SYNCED WITH TODAY'S FOCUS) */}
            <TargetMuscleVisualizer
              activeSide={activeSide}
              selectedMuscles={selectedMuscles}
              contextBadge={muscleContextBadge}
              onSideChange={setActiveSide}
              onToggleMuscle={toggleMuscle}
            />

            {/* 4. REPEAT LAST WORKOUT QUICK ACTION */}
            {!activeSession && workoutHistory.length > 0 && (
              <Pressable
                style={styles.secondaryCard}
                accessibilityRole="button"
                accessibilityLabel={`Repeat last workout: ${workoutHistory[0].name}`}
                onPress={() => handleRepeatWorkout(workoutHistory[0].id)}>
                <View style={styles.secondaryIconCircle}>
                  <MaterialIcons name="replay" size={18} color={T.primary} />
                </View>
                <View style={styles.secondaryTextContainer}>
                  <Text style={styles.secondaryTitle}>Repeat Last Workout</Text>
                  <Text style={styles.secondarySubtitle}>
                    {workoutHistory[0].name} •{' '}
                    {workoutHistory[0].start_time && workoutHistory[0].end_time
                      ? `${Math.floor((workoutHistory[0].end_time - workoutHistory[0].start_time) / 60)}m`
                      : '--m'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={T.textMuted} />
              </Pressable>
            )}

            {/* 5. PERFORMANCE BENTO WIDGETS */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoRow}>
                <View style={styles.bentoSquare}>
                  <RunStatsWidget />
                </View>
                <View style={styles.bentoSquare}>
                  <ActiveTimeWidget />
                </View>
              </View>
              <View style={styles.bentoWide}>
                <CaloriesBurntChart />
              </View>
            </View>

            {/* 6. RECENT ACTIVITY HISTORY */}
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="View full workout history"
                  onPress={() => router.push('/training/history')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>

              {workoutHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="fitness-center" size={36} color={T.textMuted} />
                  <Text style={styles.emptyTitle}>No workouts recorded yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Choose your target muscle groups above and start your first training session!
                  </Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {workoutHistory.map((session) => {
                    const dateStr = session.start_time
                      ? new Date(session.start_time * 1000).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Unknown Date';
                    const durationStr =
                      session.start_time && session.end_time
                        ? `${Math.floor((session.end_time - session.start_time) / 60)}m`
                        : '--m';

                    return (
                      <Pressable
                        key={session.id}
                        style={styles.historyCard}
                        accessibilityRole="button"
                        accessibilityLabel={`Workout: ${session.name}, ${dateStr}, ${durationStr}`}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          router.push(`/training/workout-summary?id=${session.id}`);
                        }}>
                        <View style={styles.historyCardContent}>
                          <View style={styles.historyIconContainer}>
                            <MaterialIcons name="fitness-center" size={18} color={T.primary} />
                          </View>
                          <View style={styles.historyTextContainer}>
                            <Text style={styles.historyCardTitle}>{session.name}</Text>
                            <Text style={styles.historyCardSubtitle}>
                              {dateStr} • {durationStr}
                            </Text>
                          </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={18} color={T.textMuted} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* 7. PLAN MANAGEMENT & PICKER MODALS */}
          <PlanManagerSheet
            visible={planManagerVisible}
            onClose={() => setPlanManagerVisible(false)}
            onPlanChanged={() => loadScreenData()}
          />

          <PlanDayPickerModal
            visible={dayPickerVisible}
            days={todaysPlan?.allDays || []}
            currentSelectedDayId={todaysPlan?.day?.id}
            onSelectDay={handleSelectDay}
            onClose={() => setDayPickerVisible(false)}
          />

          <EquipmentPlanWizardModal
            visible={wizardVisible}
            onClose={() => setWizardVisible(false)}
            onPlanGenerated={() => loadScreenData()}
          />

          {/* 🏋️ TRAINER DAILY SCHEDULE MODAL */}
          <TrainerScheduleModal
            visible={trainerScheduleVisible}
            onClose={() => setTrainerScheduleVisible(false)}
          />

          {/* 🎖️ TRAINER PROFILE & CREDENTIALS MODAL */}
          <TrainerProfileModal
            visible={trainerProfileVisible}
            onClose={() => setTrainerProfileVisible(false)}
          />

          {/* 👥 ATHLETE CLIENT CRM & PAR-Q+ INJURY MODAL */}
          <ClientCrmModal
            visible={clientCrmVisible}
            onClose={() => setClientCrmVisible(false)}
          />
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  coachStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  coachStripBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.25)',
  },
  coachStripIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachStripTitle: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: T.textPrimary,
  },
  coachStripSub: {
    fontSize: 10,
    fontFamily: F.mono,
    color: T.textSecondary,
    marginTop: 1,
  },
  heroCard: {
    backgroundColor: T.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: T.borderFocus,
    overflow: 'hidden',
  },
  heroCardActive: {
    borderColor: T.primary,
    backgroundColor: T.surface,
  },
  heroCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: T.surfaceActiveTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerActive: {
    backgroundColor: T.primary,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.primary,
  },
  heroBadgeText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: T.primary,
    fontWeight: '700',
  },
  heroTitle: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: T.textPrimary,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
  },
  chevronBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.surfaceActiveTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 56,
  },
  secondaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.surfaceActiveTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  secondaryTextContainer: {
    flex: 1,
  },
  secondaryTitle: {
    fontFamily: F.sansSemiBold,
    fontSize: 14,
    color: T.textPrimary,
  },
  secondarySubtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    marginTop: 1,
  },
  bentoGrid: {
    gap: 14,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 14,
  },
  bentoSquare: {
    flex: 1,
    aspectRatio: 1.05,
  },
  bentoWide: {
    width: '100%',
  },
  historySection: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: T.textMuted,
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: T.primary,
  },
  historyList: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: T.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: T.textPrimary,
    marginTop: 6,
  },
  emptySubtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  historyCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minHeight: 52,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.surfaceActiveTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyCardTitle: {
    fontFamily: F.sansSemiBold,
    fontSize: 14,
    color: T.textPrimary,
  },
  historyCardSubtitle: {
    fontFamily: F.mono,
    fontSize: 11.5,
    color: T.textSecondary,
    marginTop: 2,
  },
});
