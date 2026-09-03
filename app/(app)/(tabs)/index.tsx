import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppScreen } from "@/components/ui/app-screen";
import { ROUTES } from "@/constants/routes";
import { Vital } from "@/constants/vital-theme";
import { useActiveFast, useFastingPreference } from "@/hooks/fasting-queries";
import { useHydration, useNutritionDay } from "@/hooks/nutrition-queries";
import { useAuth } from "@/hooks/use-auth";
import { computeLiveProgress } from "@/lib/fasting-format";
import { RunningAPI } from "@/services/running-api";
import { useNutritionUiStore } from "@/stores/nutrition-ui-store";
import { WorkoutUseCases } from "@/use-cases/workout.use-cases";
import { useFeaturesStore } from "@/stores/features-store";
import { useThemeColors } from "@/hooks/use-theme-colors";

// COMPONENTS
import { HomeFastingBanner } from "@/components/today/home-fasting-banner";
import { HomeHeroCard } from "@/components/today/home-hero-card";
import { HomeStatTile } from "@/components/today/home-stat-tile";
import { ProfileAvatarButton } from "@/components/navigation/profile-avatar-button";
import { HomeRoutineCard, RoutineTimelineModal } from "@/components/routine";
import { HomeTodoCard, TodoManagerModal, AddTodoModal } from "@/components/todo";
import { useRoutineStore } from "@/stores/routine-store";
import { useTodoStore } from "@/stores/todo-store";
import { useMedicineStore } from "@/stores/medicine-store";
import { useTrainerStore } from "@/stores/trainer-store";
import { useGymOwnerStore } from "@/stores/gym-owner-store";
import { HomeTrainerCommandHub } from "@/components/today/home-trainer-command-hub";
import {
  HomeGymOwnerCommandHub,
  GymMemberCrmModal,
  GymLeadPipelineModal,
  GymEquipmentMaintenanceModal,
  GymFinancialsAnalyticsModal,
  GymAnnouncementModal,
  GymMembershipPlansModal,
  GymLockerTrackerModal,
} from "@/components/gym-owner";
import type { MemberStatus } from "@/types/gym";
import { TrainerScheduleModal } from "@/components/trainer/trainer-schedule-modal";
import { TrainerProfileModal } from "@/components/trainer/trainer-profile-modal";
import { ClientCrmModal } from "@/components/trainer/client-crm-modal";
import { CoachPackagesManagerModal } from "@/components/trainer/coach-packages-manager-modal";
import { CoachDietPrescriptionModal } from "@/components/trainer/coach-diet-prescription-modal";
import { ChronicCareBannerWidget } from "@/components/today/chronic-care-banner-widget";
import {
  AddMedicalEventModal,
  AIHealthScannerModal,
  ChronicCareModal,
  EmergencyHotlineModal,
  GenericMedicineFinderModal,
  HealthQuickActionsModal,
  HomeHealthQuickActionsWidget,
  LabResultManagerModal,
  QuickActionType,
  VaccinationManagerModal,
  AIReportExplainerModal,
  EpiVaccineTrackerModal,
  TravelHealthDossierModal,
  SurgeryRecoveryModal,
  LabCostComparatorModal,
  DengueFluidMonitorModal,
  AqiAsthmaShieldModal,
  PregnancyCareModal,
  HypertensionHeartShieldModal,
  ElderlyCareModal,
  UrineHydrationShieldModal,
  UricAcidGoutModal,
  PostpartumCareModal,
  AnemiaHemoglobinShieldModal,
  MemoryDementiaModal,
  OsteoporosisJointModal,
  DiabeticVisionModal,
  HearingTremorModal,
  PolypharmacyShieldModal,
  DiabeticMealPlannerModal,
  FamilyHealthDashboardModal,
} from "@/components/health-vault";
import { BanglaFoodGiModal } from "@/components/nutrition/bangla-food-gi-modal";
import { MedicineExpiryRadarModal } from "@/components/nutrition/medicine-expiry-radar-modal";
import { RamadanGuardModal } from "@/components/fasting/ramadan-guard-modal";

const C = Vital.colors;
const F = Vital.fonts;

function getGreetingMeta() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      greeting: "Good morning",
      icon: "wb-sunny" as const,
      iconColor: "#FCC419",
    };
  }
  if (hour < 17) {
    return {
      greeting: "Good afternoon",
      icon: "light-mode" as const,
      iconColor: "#FF922B",
    };
  }
  if (hour < 21) {
    return {
      greeting: "Good evening",
      icon: "wb-twilight" as const,
      iconColor: "#FA5252",
    };
  }
  return {
    greeting: "Good night",
    icon: "nightlight-round" as const,
    iconColor: "#748FFC",
  };
}



export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { features, loadFeatures } = useFeaturesStore();

  // Load features if not loaded yet
  useEffect(() => {
    void loadFeatures();
  }, [loadFeatures]);

  // Queries
  const dayQuery = useNutritionDay();
  const hydrationQuery = useHydration();
  const activeQuery = useActiveFast();
  const preferenceQuery = useFastingPreference();
  const requestOpenLog = useNutritionUiStore((s) => s.requestOpenLog);

  // Routine Store
  const loadRoutines = useRoutineStore((s) => s.loadData);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);

  // Todo Store
  const loadTodos = useTodoStore((s) => s.loadData);
  const [todoManagerVisible, setTodoManagerVisible] = useState(false);
  const [addTodoModalVisible, setAddTodoModalVisible] = useState(false);

  // Health Quick Action Modals
  const openMedicineModal = useMedicineStore((s) => s.openLogModal);
  const [quickActionsModalVisible, setQuickActionsModalVisible] = useState(false);
  const [doctorEventModalVisible, setDoctorEventModalVisible] = useState(false);
  const [vaccinationModalVisible, setVaccinationModalVisible] = useState(false);
  const [aiScannerModalVisible, setAiScannerModalVisible] = useState(false);
  const [labResultModalVisible, setLabResultModalVisible] = useState(false);
  const [chronicCareModalVisible, setChronicCareModalVisible] = useState(false);
  const [genericFinderModalVisible, setGenericFinderModalVisible] = useState(false);
  const [emergencyHotlineModalVisible, setEmergencyHotlineModalVisible] = useState(false);
  const [banglaFoodGiModalVisible, setBanglaFoodGiModalVisible] = useState(false);
  const [reportExplainerModalVisible, setReportExplainerModalVisible] = useState(false);
  const [expiryRadarModalVisible, setExpiryRadarModalVisible] = useState(false);
  const [epiTrackerModalVisible, setEpiTrackerModalVisible] = useState(false);
  const [ramadanGuardModalVisible, setRamadanGuardModalVisible] = useState(false);
  const [travelDossierModalVisible, setTravelDossierModalVisible] = useState(false);
  const [surgeryRecoveryModalVisible, setSurgeryRecoveryModalVisible] = useState(false);
  const [labCostModalVisible, setLabCostModalVisible] = useState(false);
  const [dengueModalVisible, setDengueModalVisible] = useState(false);
  const [aqiAsthmaModalVisible, setAqiAsthmaModalVisible] = useState(false);
  const [pregnancyCareModalVisible, setPregnancyCareModalVisible] = useState(false);
  const [hypertensionModalVisible, setHypertensionModalVisible] = useState(false);
  const [elderlyCareModalVisible, setElderlyCareModalVisible] = useState(false);
  const [urineHydrationModalVisible, setUrineHydrationModalVisible] = useState(false);
  const [uricAcidGoutModalVisible, setUricAcidGoutModalVisible] = useState(false);
  const [postpartumCareModalVisible, setPostpartumCareModalVisible] = useState(false);
  const [anemiaShieldModalVisible, setAnemiaShieldModalVisible] = useState(false);
  const [memoryDementiaModalVisible, setMemoryDementiaModalVisible] = useState(false);
  const [osteoporosisModalVisible, setOsteoporosisModalVisible] = useState(false);
  const [diabeticVisionModalVisible, setDiabeticVisionModalVisible] = useState(false);
  const [hearingTremorModalVisible, setHearingTremorModalVisible] = useState(false);
  const [polypharmacyModalVisible, setPolypharmacyModalVisible] = useState(false);
  const [diabeticMealPlannerModalVisible, setDiabeticMealPlannerModalVisible] = useState(false);
  const [familyDashboardModalVisible, setFamilyDashboardModalVisible] = useState(false);

  // Trainer Studio Modals & Store
  const [trainerScheduleVisible, setTrainerScheduleVisible] = useState(false);
  const [trainerProfileVisible, setTrainerProfileVisible] = useState(false);
  const [clientCrmVisible, setClientCrmVisible] = useState(false);
  const [trainerPackagesVisible, setTrainerPackagesVisible] = useState(false);
  const [trainerDietVisible, setTrainerDietVisible] = useState(false);
  const { loadTrainerData } = useTrainerStore();
  const isTrainer = user?.role === 'TRAINER';

  // Gym Owner Modals & Store
  const [gymMemberCrmVisible, setGymMemberCrmVisible] = useState(false);
  const [gymMemberFilter, setGymMemberFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [gymLeadPipelineVisible, setGymLeadPipelineVisible] = useState(false);
  const [gymEquipmentVisible, setGymEquipmentVisible] = useState(false);
  const [gymFinancialsVisible, setGymFinancialsVisible] = useState(false);
  const [gymAnnouncementVisible, setGymAnnouncementVisible] = useState(false);
  const [gymPlansVisible, setGymPlansVisible] = useState(false);
  const [gymLockerVisible, setGymLockerVisible] = useState(false);
  const { loadGymData } = useGymOwnerStore();
  const isGymOwner = user?.role === 'GYM_OWNER';

  useEffect(() => {
    if (isTrainer) {
      void loadTrainerData();
    }
    if (isGymOwner) {
      void loadGymData();
    }
  }, [isTrainer, isGymOwner, loadTrainerData, loadGymData]);

  const handleHealthQuickAction = (action: QuickActionType) => {
    if (action === 'EMERGENCY_HOTLINE') {
      setEmergencyHotlineModalVisible(true);
    } else if (action === 'CARE_PROTOCOL') {
      setChronicCareModalVisible(true);
    } else if (action === 'GENERIC_FINDER') {
      setGenericFinderModalVisible(true);
    } else if (action === 'BANGLA_FOOD_GI') {
      setBanglaFoodGiModalVisible(true);
    } else if (action === 'REPORT_EXPLAINER') {
      setReportExplainerModalVisible(true);
    } else if (action === 'EXPIRY_RADAR') {
      setExpiryRadarModalVisible(true);
    } else if (action === 'EPI_VACCINE') {
      setEpiTrackerModalVisible(true);
    } else if (action === 'RAMADAN_GUARD') {
      setRamadanGuardModalVisible(true);
    } else if (action === 'TRAVEL_DOSSIER') {
      setTravelDossierModalVisible(true);
    } else if (action === 'SURGERY_RECOVERY') {
      setSurgeryRecoveryModalVisible(true);
    } else if (action === 'LAB_COST_COMPARATOR') {
      setLabCostModalVisible(true);
    } else if (action === 'DENGUE_MONITOR') {
      setDengueModalVisible(true);
    } else if (action === 'AQI_ASTHMA_SHIELD') {
      setAqiAsthmaModalVisible(true);
    } else if (action === 'PREGNANCY_CARE') {
      setPregnancyCareModalVisible(true);
    } else if (action === 'HYPERTENSION_SHIELD') {
      setHypertensionModalVisible(true);
    } else if (action === 'ELDERLY_CARE') {
      setElderlyCareModalVisible(true);
    } else if (action === 'URINE_HYDRATION_SHIELD') {
      setUrineHydrationModalVisible(true);
    } else if (action === 'URIC_ACID_GOUT') {
      setUricAcidGoutModalVisible(true);
    } else if (action === 'POSTPARTUM_CARE') {
      setPostpartumCareModalVisible(true);
    } else if (action === 'ANEMIA_HEMOGLOBIN_SHIELD') {
      setAnemiaShieldModalVisible(true);
    } else if (action === 'MEMORY_DEMENTIA_SHIELD') {
      setMemoryDementiaModalVisible(true);
    } else if (action === 'OSTEOPOROSIS_JOINT_SHIELD') {
      setOsteoporosisModalVisible(true);
    } else if (action === 'DIABETIC_VISION_SHIELD') {
      setDiabeticVisionModalVisible(true);
    } else if (action === 'HEARING_TREMOR_SHIELD') {
      setHearingTremorModalVisible(true);
    } else if (action === 'POLYPHARMACY_SHIELD') {
      setPolypharmacyModalVisible(true);
    } else if (action === 'DIABETIC_MEAL_PLANNER') {
      setDiabeticMealPlannerModalVisible(true);
    } else if (action === 'FAMILY_HEALTH_DASHBOARD') {
      setFamilyDashboardModalVisible(true);
    } else if (action === 'DOCTOR_VISIT') {
      setDoctorEventModalVisible(true);
    } else if (action === 'MEDICINE') {
      openMedicineModal();
      router.push(ROUTES.nutrition);
    } else if (action === 'LAB_RESULT') {
      setLabResultModalVisible(true);
    } else if (action === 'VACCINE') {
      setVaccinationModalVisible(true);
    } else if (action === 'DOCUMENT') {
      setAiScannerModalVisible(true);
    }
  };

  const day = dayQuery.data ?? null;
  const hydration = hydrationQuery.data ?? null;
  const active = activeQuery.data ?? null;
  const preference = preferenceQuery.data ?? null;

  // Local state for running/workout summary
  const [runningStats, setRunningStats] = useState({ distance: 0 });
  const [workoutCount, setWorkoutCount] = useState(0);

  // Load custom stats when screen focuses
  useFocusEffect(
    useCallback(() => {
      void loadRoutines();
      void loadTodos();

      const loadTrainingStats = async () => {
        try {
          const runs = await RunningAPI.getRuns();
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const weekRuns = runs.filter((r) => r.date >= oneWeekAgo);
          const dist = weekRuns.reduce((sum, run) => sum + run.distance_km, 0);
          setRunningStats({ distance: dist });

          const session = await WorkoutUseCases.getActiveSession();
          setWorkoutCount(session ? 1 : 0);
        } catch (e) {
          console.warn("Failed to load training stats", e);
        }
      };
      void loadTrainingStats();
    }, [loadRoutines, loadTodos]),
  );

  const refreshing =
    (dayQuery.isRefetching ||
      hydrationQuery.isRefetching ||
      activeQuery.isRefetching ||
      preferenceQuery.isRefetching) &&
    !dayQuery.isLoading;

  const onRefresh = useCallback(() => {
    void Promise.all([
      dayQuery.refetch(),
      hydrationQuery.refetch(),
      activeQuery.refetch(),
      preferenceQuery.refetch(),
      loadRoutines(),
      loadTodos(),
    ]);
  }, [dayQuery, hydrationQuery, activeQuery, preferenceQuery, loadRoutines, loadTodos]);

  // Fasting Live Timer Logic
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const live = useMemo(() => {
    if (!active) return null;
    return computeLiveProgress(active, now);
  }, [active, now]);

  // Derived Data
  const firstName = user?.name?.split(" ")[0] ?? "friend";
  const protocol = active?.protocol ?? preference?.protocol ?? "16:8";
  const timeMeta = getGreetingMeta();

  // Nutrition Macros
  const consumedCals = day?.consumed.calories ?? 0;
  const targetCals = day?.targets.calories ?? 2000;
  const p = day?.consumed.proteinG ?? 0;
  const c = day?.consumed.carbsG ?? 0;
  const f = day?.consumed.fatG ?? 0;

  // Active module checks
  const isNutritionActive = features.nutrition !== false;
  const isFastingActive = features.fasting !== false;
  const isRunningActive = features.running !== false;
  const isRoutinesActive = features.routines !== false;
  const isTodosActive = features.todos !== false;

  const hasAnyActiveCards =
    isNutritionActive ||
    isRoutinesActive ||
    isTodosActive ||
    isRunningActive ||
    (isFastingActive && active && live);

  const hasAnyQuickActions = isNutritionActive || isRunningActive;
  const { colors, isDark } = useThemeColors();

  return (
    <AppScreen>
      <ScrollView
        style={[styles.scroll, { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* HEADER AREA */}
        <View style={styles.headerArea}>
          <View style={styles.headerLeftCol}>
            {/* GREETING & NAME */}
            <Text style={[styles.greetingText, { color: colors.textPrimary }]}>
              {timeMeta.greeting},{' '}
              <Text
                style={[
                  styles.greetingNameHighlight,
                  { color: isGymOwner ? '#FFB800' : !isDark ? '#0E4D34' : colors.accentLime },
                ]}>
                {isGymOwner ? 'Khaled (Director)' : isTrainer ? 'Coach Alex' : firstName}
              </Text>
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                router.push(ROUTES.notifications);
              }}
              style={[
                styles.headerNotificationBtn,
                !isDark
                  ? {
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(14, 77, 52, 0.18)',
                      shadowColor: '#0E4D34',
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : {
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    },
              ]}>
              <MaterialIcons
                name="notifications-none"
                size={20}
                color={!isDark ? '#0E4D34' : colors.textPrimary}
              />
              <View
                style={[
                  styles.notificationUnreadDot,
                  !isDark
                    ? { backgroundColor: '#0E4D34', borderColor: '#FFFFFF' }
                    : { backgroundColor: '#89FE00', borderColor: '#101416' },
                ]}
              />
            </TouchableOpacity>

            <ProfileAvatarButton size="sm" />
          </View>
        </View>

        {/* DEDICATED GYM OWNER, TRAINER OR ATHLETE DASHBOARD */}
        {isGymOwner ? (
          <HomeGymOwnerCommandHub
            onOpenMemberCrm={(filter) => {
              setGymMemberFilter(filter || 'ALL');
              setGymMemberCrmVisible(true);
            }}
            onOpenLeadPipeline={() => setGymLeadPipelineVisible(true)}
            onOpenEquipmentModal={() => setGymEquipmentVisible(true)}
            onOpenFinancialsModal={() => setGymFinancialsVisible(true)}
            onOpenAnnouncementModal={() => setGymAnnouncementVisible(true)}
            onOpenPlansModal={() => setGymPlansVisible(true)}
            onOpenLockerModal={() => setGymLockerVisible(true)}
          />
        ) : isTrainer ? (
          <HomeTrainerCommandHub
            onOpenSchedule={() => setTrainerScheduleVisible(true)}
            onOpenProfile={() => setTrainerProfileVisible(true)}
            onOpenClientCrm={() => setClientCrmVisible(true)}
            onOpenPackages={() => setTrainerPackagesVisible(true)}
            onOpenDietPrescription={() => setTrainerDietVisible(true)}
          />
        ) : (
          <>
            {/* NUTRITION HERO */}
            {isNutritionActive && (
              <HomeHeroCard
                consumed={consumedCals}
                target={targetCals}
                protein={p}
                carbs={c}
                fat={f}
                onPress={() => router.push(ROUTES.nutrition)}
              />
            )}

        {/* CHRONIC DISEASE CARE PROTOCOL BANNER WIDGET */}
        <View style={styles.sectionSpacing}>
          <ChronicCareBannerWidget
            onOpenModal={() => setChronicCareModalVisible(true)}
            onQuickLogSugar={() => setChronicCareModalVisible(true)}
            onQuickLogBp={() => setChronicCareModalVisible(true)}
          />
        </View>

        {/* DAILY ROUTINES & HABIT MASTERY CARD */}
        {isRoutinesActive && (
          <View style={styles.sectionSpacing}>
            <HomeRoutineCard
              onOpenFullRoutine={() => setRoutineModalVisible(true)}
            />
          </View>
        )}

        {/* SMART TODOS & TASK PLANNER CARD */}
        {isTodosActive && (
          <View style={styles.sectionSpacing}>
            <HomeTodoCard
              onOpenFullTodos={() => setTodoManagerVisible(true)}
              onOpenAddModal={() => setAddTodoModalVisible(true)}
            />
          </View>
        )}

        {/* HEALTH QUICK ACTIONS BENTO WIDGET */}
        <View style={styles.sectionSpacing}>
          <HomeHealthQuickActionsWidget
            onActionPress={handleHealthQuickAction}
            onOpenFullSheet={() => setQuickActionsModalVisible(true)}
          />
        </View>

        {/* VEHICLE TELEMETRY & CONTROLS BENTO SECTION */}
        {isRunningActive && (
          <View style={styles.sectionSpacing}>
            <HomeStatTile />
          </View>
        )}

        {/* FASTING LIVE BANNER (Only if active and enabled) */}
        {isFastingActive && active && live && (
          <View style={styles.sectionSpacing}>
            <HomeFastingBanner
              goalMet={live.goalMet}
              elapsedMinutes={live.elapsedMinutes}
              remainingMinutes={live.remainingMinutes}
              protocol={protocol}
              onPress={() => router.push(ROUTES.fasting)}
            />
          </View>
        )}

        {/* EMPTY STATE IF ALL DASHBOARD MODULES ARE DISABLED */}
        {!hasAnyActiveCards && (
          <View style={styles.emptyModulesCard}>
            <View style={styles.emptyModulesIconWrap}>
              <MaterialIcons name="tune" size={28} color={C.primary} />
            </View>
            <Text style={styles.emptyModulesTitle}>All Dashboard Modules Paused</Text>
            <Text style={styles.emptyModulesText}>
              You have turned off the dashboard cards. You can re-enable your favorite modules anytime in your Profile.
            </Text>
            <Pressable
              onPress={() => router.push(ROUTES.profile)}
              style={({ pressed }) => [
                styles.emptyModulesBtn,
                pressed && { opacity: 0.8 },
              ]}>
              <MaterialIcons name="settings" size={16} color={C.onPrimaryContainer} />
              <Text style={styles.emptyModulesBtnText}>Manage Active Features</Text>
            </Pressable>
          </View>
        )}

        {/* QUICK ACTIONS */}
        {hasAnyQuickActions && (
          <>
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.actionsRow}>
              {isNutritionActive && (
                <Pressable
                  onPress={() => {
                    requestOpenLog();
                    router.push(ROUTES.nutrition);
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.actionBtnPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.actionIconBadge,
                      { backgroundColor: C.primaryAlpha20 },
                    ]}
                  >
                    <MaterialIcons name="restaurant" size={20} color={C.primaryContainer} />
                  </View>
                  <Text style={styles.actionBtnText}>Log Food</Text>
                </Pressable>
              )}

              {isRunningActive && (
                <Pressable
                  onPress={() => router.push("/training/run-session" as any)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.actionBtnPressed,
                  ]}
                >
                  <View
                    style={[styles.actionIconBadge, { backgroundColor: C.trainingAlpha20 }]}
                  >
                    <MaterialIcons name="directions-run" size={20} color={C.trainingAccent} />
                  </View>
                  <Text style={styles.actionBtnText}>Start Run</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </>
    )}
  </ScrollView>

      {/* DAILY ROUTINE TIMELINE MODAL */}
      <RoutineTimelineModal
        visible={routineModalVisible}
        onClose={() => setRoutineModalVisible(false)}
      />

      {/* TODO MANAGER FULL MODAL */}
      <TodoManagerModal
        visible={todoManagerVisible}
        onClose={() => setTodoManagerVisible(false)}
      />

      {/* ADD TODO MODAL */}
      <AddTodoModal
        visible={addTodoModalVisible}
        onClose={() => setAddTodoModalVisible(false)}
      />

      {/* HEALTH QUICK ACTIONS BOTTOM SHEET MODAL */}
      <HealthQuickActionsModal
        visible={quickActionsModalVisible}
        onClose={() => setQuickActionsModalVisible(false)}
        onSelectAction={handleHealthQuickAction}
      />

      {/* DOCTOR VISIT & CONSULTATION EVENT MODAL */}
      <AddMedicalEventModal
        visible={doctorEventModalVisible}
        onClose={() => setDoctorEventModalVisible(false)}
      />

      {/* VACCINATION MANAGER MODAL */}
      <VaccinationManagerModal
        visible={vaccinationModalVisible}
        onClose={() => setVaccinationModalVisible(false)}
      />

      {/* AI VISION OCR SCANNER MODAL */}
      <AIHealthScannerModal
        visible={aiScannerModalVisible}
        onClose={() => setAiScannerModalVisible(false)}
      />

      {/* LAB RESULT MANAGER MODAL */}
      <LabResultManagerModal
        visible={labResultModalVisible}
        onClose={() => setLabResultModalVisible(false)}
      />

      {/* CHRONIC DISEASE CARE PLANS MODAL */}
      <ChronicCareModal
        visible={chronicCareModalVisible}
        onClose={() => setChronicCareModalVisible(false)}
      />

      {/* GENERIC MEDICINE ALTERNATIVE FINDER MODAL */}
      <GenericMedicineFinderModal
        visible={genericFinderModalVisible}
        onClose={() => setGenericFinderModalVisible(false)}
      />

      {/* EMERGENCY HOTLINE & AMBULANCE MODAL */}
      <EmergencyHotlineModal
        visible={emergencyHotlineModalVisible}
        onClose={() => setEmergencyHotlineModalVisible(false)}
      />

      {/* BANGLADESHI FOOD GI & NUTRITION GUIDE MODAL */}
      <BanglaFoodGiModal
        visible={banglaFoodGiModalVisible}
        onClose={() => setBanglaFoodGiModalVisible(false)}
      />

      {/* AI MEDICAL REPORT EXPLAINER MODAL */}
      <AIReportExplainerModal
        visible={reportExplainerModalVisible}
        onClose={() => setReportExplainerModalVisible(false)}
      />

      {/* MEDICINE EXPIRY & REFILL RADAR MODAL */}
      <MedicineExpiryRadarModal
        visible={expiryRadarModalVisible}
        onClose={() => setExpiryRadarModalVisible(false)}
      />

      {/* EPI CHILD & ELDERLY VACCINE TRACKER MODAL */}
      <EpiVaccineTrackerModal
        visible={epiTrackerModalVisible}
        onClose={() => setEpiTrackerModalVisible(false)}
      />

      {/* RAMADAN & FASTING DIABETES GUARD MODAL */}
      <RamadanGuardModal
        visible={ramadanGuardModalVisible}
        onClose={() => setRamadanGuardModalVisible(false)}
      />

      {/* TRAVEL HEALTH & CUSTOMS MEDICAL DOSSIER MODAL */}
      <TravelHealthDossierModal
        visible={travelDossierModalVisible}
        onClose={() => setTravelDossierModalVisible(false)}
      />

      {/* POST-SURGERY HOME RECOVERY MODAL */}
      <SurgeryRecoveryModal
        visible={surgeryRecoveryModalVisible}
        onClose={() => setSurgeryRecoveryModalVisible(false)}
      />

      {/* LAB TEST COST & DIAGNOSTIC CENTER COMPARATOR MODAL */}
      <LabCostComparatorModal
        visible={labCostModalVisible}
        onClose={() => setLabCostModalVisible(false)}
      />

      {/* DENGUE & FEVER FLUID MONITOR MODAL */}
      <DengueFluidMonitorModal
        visible={dengueModalVisible}
        onClose={() => setDengueModalVisible(false)}
      />

      {/* LIVE AQI & ASTHMA AIR POLLUTION SHIELD MODAL */}
      <AqiAsthmaShieldModal
        visible={aqiAsthmaModalVisible}
        onClose={() => setAqiAsthmaModalVisible(false)}
      />

      {/* PREGNANCY TRIMESTER CARE & BABY KICK COUNTER MODAL */}
      <PregnancyCareModal
        visible={pregnancyCareModalVisible}
        onClose={() => setPregnancyCareModalVisible(false)}
      />

      {/* HYPERTENSION & BLOOD PRESSURE HEART SHIELD MODAL */}
      <HypertensionHeartShieldModal
        visible={hypertensionModalVisible}
        onClose={() => setHypertensionModalVisible(false)}
      />

      {/* ELDERLY PARENT CARE & DAILY SAFETY MONITOR MODAL */}
      <ElderlyCareModal
        visible={elderlyCareModalVisible}
        onClose={() => setElderlyCareModalVisible(false)}
      />

      {/* URINE COLOR HYDRATION & KIDNEY STONE GUARD MODAL */}
      <UrineHydrationShieldModal
        visible={urineHydrationModalVisible}
        onClose={() => setUrineHydrationModalVisible(false)}
      />

      {/* URIC ACID & GOUT JOINT PAIN SHIELD MODAL */}
      <UricAcidGoutModal
        visible={uricAcidGoutModalVisible}
        onClose={() => setUricAcidGoutModalVisible(false)}
      />

      {/* POSTPARTUM CARE & NEWBORN GROWTH SHIELD MODAL */}
      <PostpartumCareModal
        visible={postpartumCareModalVisible}
        onClose={() => setPostpartumCareModalVisible(false)}
      />

      {/* ANEMIA & IRON-DEFICIENCY HEMOGLOBIN SHIELD MODAL */}
      <AnemiaHemoglobinShieldModal
        visible={anemiaShieldModalVisible}
        onClose={() => setAnemiaShieldModalVisible(false)}
      />

      {/* MEMORY & DEMENTIA EARLY SCREENER MODAL */}
      <MemoryDementiaModal
        visible={memoryDementiaModalVisible}
        onClose={() => setMemoryDementiaModalVisible(false)}
      />

      {/* OSTEOPOROSIS & KNEE JOINT PAIN SHIELD MODAL */}
      <OsteoporosisJointModal
        visible={osteoporosisModalVisible}
        onClose={() => setOsteoporosisModalVisible(false)}
      />

      {/* DIABETIC EYE & VISION SHIELD MODAL */}
      <DiabeticVisionModal
        visible={diabeticVisionModalVisible}
        onClose={() => setDiabeticVisionModalVisible(false)}
      />

      {/* AGE-RELATED HEARING & TREMOR GUARD MODAL */}
      <HearingTremorModal
        visible={hearingTremorModalVisible}
        onClose={() => setHearingTremorModalVisible(false)}
      />

      {/* ELDERLY POLYPHARMACY & DRUG SAFETY SHIELD MODAL */}
      <PolypharmacyShieldModal
        visible={polypharmacyModalVisible}
        onClose={() => setPolypharmacyModalVisible(false)}
      />

      {/* DIABETIC MEAL PLANNER BD MODAL */}
      <DiabeticMealPlannerModal
        visible={diabeticMealPlannerModalVisible}
        onClose={() => setDiabeticMealPlannerModalVisible(false)}
      />

      {/* FAMILY HEALTH DASHBOARD MODAL */}
      <FamilyHealthDashboardModal
        visible={familyDashboardModalVisible}
        onClose={() => setFamilyDashboardModalVisible(false)}
      />

      {/* 🏋️ TRAINER DAILY SCHEDULE & BOOKING MODAL */}
      <TrainerScheduleModal
        visible={trainerScheduleVisible}
        onClose={() => setTrainerScheduleVisible(false)}
      />

      {/* 🎖️ TRAINER PROFILE & CERTIFICATIONS MODAL */}
      <TrainerProfileModal
        visible={trainerProfileVisible}
        onClose={() => setTrainerProfileVisible(false)}
      />

      {/* 👥 ATHLETE CLIENTS CRM & PAR-Q+ INJURY MODAL */}
      <ClientCrmModal
        visible={clientCrmVisible}
        onClose={() => setClientCrmVisible(false)}
      />

      {/* 💰 COACH CUSTOM PACKAGES & FEES MODAL */}
      <CoachPackagesManagerModal
        visible={trainerPackagesVisible}
        onClose={() => setTrainerPackagesVisible(false)}
      />

      {/* 🥗 COACH DIET & MACRO PRESCRIPTION MODAL */}
      <CoachDietPrescriptionModal
        visible={trainerDietVisible}
        onClose={() => setTrainerDietVisible(false)}
      />

      {/* 🏢 GYM OWNER OS MODALS */}
      <GymMemberCrmModal
        visible={gymMemberCrmVisible}
        onClose={() => setGymMemberCrmVisible(false)}
        initialFilter={gymMemberFilter}
      />

      <GymLeadPipelineModal
        visible={gymLeadPipelineVisible}
        onClose={() => setGymLeadPipelineVisible(false)}
      />

      <GymEquipmentMaintenanceModal
        visible={gymEquipmentVisible}
        onClose={() => setGymEquipmentVisible(false)}
      />

      <GymFinancialsAnalyticsModal
        visible={gymFinancialsVisible}
        onClose={() => setGymFinancialsVisible(false)}
      />

      <GymAnnouncementModal
        visible={gymAnnouncementVisible}
        onClose={() => setGymAnnouncementVisible(false)}
      />

      <GymMembershipPlansModal
        visible={gymPlansVisible}
        onClose={() => setGymPlansVisible(false)}
      />

      <GymLockerTrackerModal
        visible={gymLockerVisible}
        onClose={() => setGymLockerVisible(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 144,
    paddingTop: 12,
  },
  headerArea: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeftCol: {
    flex: 1,
    gap: 4,
  },
  greetingText: {
    fontFamily: F.sansBold,
    fontSize: 22,
    color: C.onSurface,
    letterSpacing: -0.4,
  },
  greetingNameHighlight: {
    color: '#C8F135',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerNotificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationUnreadDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  sectionSpacing: {
    marginTop: 12,
  },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.outlineVariant + "33",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  actionBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
    backgroundColor: C.surfaceContainerHigh,
  },
  actionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 13,
    color: C.onSurface,
    flexShrink: 1,
  },
  emptyModulesCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Vital.radius.xxl,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyModulesIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primaryAlpha20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyModulesTitle: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: C.onSurface,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyModulesText: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyModulesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyModulesBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 13,
    color: C.onPrimaryContainer,
  },
});

