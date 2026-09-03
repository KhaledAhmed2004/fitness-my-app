import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScreenHeader } from '@/components/navigation/app-screen-header';
import { AIMealPlannerCard } from '@/components/nutrition/ai-meal-planner-card';
import { CoachDietPlanCard } from '@/components/nutrition/coach-diet-plan-card';
import { AIMealPlannerModal } from '@/components/nutrition/ai-meal-planner-modal';
import { BanglaFoodGiBannerCard } from '@/components/nutrition/bangla-food-gi-banner-card';
import { RamadanGuardBannerCard } from '@/components/fasting/ramadan-guard-banner-card';
import { EditHydrationGoalModal } from '@/components/nutrition/edit-hydration-goal-modal';
import { EditItemModal } from '@/components/nutrition/edit-item-modal';
import { EditTargetsModal } from '@/components/nutrition/edit-targets-modal';
import { HydrationCard } from '@/components/nutrition/hydration-card';
import { LogFoodModal } from '@/components/nutrition/log-food-modal';
import { MealsList } from '@/components/nutrition/meals-list';
import { MedicineCard } from '@/components/nutrition/medicine-card';
import { MedicineRadarBannerCard } from '@/components/nutrition/medicine-radar-banner-card';
import { HealthVaultSummaryCard } from '@/components/nutrition/health-vault-summary-card';
import { HealthVaultStudioModal } from '@/components/health-vault';
import { RemainingHero } from '@/components/nutrition/remaining-hero';
import { WaterUndoToast } from '@/components/nutrition/water-undo-toast';
import { AppScreen } from '@/components/ui/app-screen';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/contexts/auth-context';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useTrainerStore } from '@/stores/trainer-store';
import { CoachDietVaultScreenView } from '@/components/trainer/coach-diet-vault-screen-view';
import { GymProShopScreenView } from '@/components/gym-owner/gym-pro-shop-screen-view';
import { useFeaturesStore } from '@/stores/features-store';
import { useActiveFast } from '@/hooks/fasting-queries';
import {
  useAddWater,
  useDeleteItem,
  useEditItemQuantity,
  useHydration,
  useHydrationGoal,
  useLogFood,
  useNutritionDay,
  useSetTargets,
  useUndoWater,
  useUpdateWaterGoal,
} from '@/hooks/nutrition-queries';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  MEAL_GROUP_LABELS,
  MEAL_GROUPS,
  suggestedMealGroup,
} from '@/lib/nutrition-math';
import { useNutritionUiStore } from '@/stores/nutrition-ui-store';
import type { Meal, MealGroup, MealItem } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;
const UNDO_MS = 6000;
const MAX_UNDO_STACK = 5;

type UndoItem = { id: string; amountMl: number };

export default function NutritionScreen() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER' || (user?.email || '').toLowerCase().includes('trainer');
  const isGymOwner = user?.role === 'GYM_OWNER' || (user?.email || '').toLowerCase().includes('owner');

  if (isTrainer) {
    return <CoachDietVaultScreenView />;
  }

  if (isGymOwner) {
    return <GymProShopScreenView />;
  }

  return <ClientNutritionScreenContent />;
}

function ClientNutritionScreenContent() {
  const { isAuthenticated } = useAuth();
  const dayQuery = useNutritionDay();
  const hydrationQuery = useHydration();
  const activeFastQuery = useActiveFast();
  const logFood = useLogFood();
  const editItem = useEditItemQuantity();
  const deleteItem = useDeleteItem();
  const addWater = useAddWater();
  const undoWater = useUndoWater();
  const updateWaterGoal = useUpdateWaterGoal();
  const setTargets = useSetTargets();

  const openLogOnMount = useNutritionUiStore((s) => s.openLogOnMount);
  const preferredLogGroup = useNutritionUiStore((s) => s.preferredLogGroup);
  const consumeOpenLogRequest = useNutritionUiStore((s) => s.consumeOpenLogRequest);

  const day = dayQuery.data ?? null;
  const hydration = hydrationQuery.data ?? null;
  const isLoading = dayQuery.isLoading;

  const refreshing =
    (dayQuery.isRefetching || hydrationQuery.isRefetching || activeFastQuery.isRefetching) &&
    !dayQuery.isLoading;

  const onRefresh = useCallback(() => {
    void Promise.all([
      dayQuery.refetch(),
      hydrationQuery.refetch(),
      activeFastQuery.refetch(),
    ]);
  }, [dayQuery, hydrationQuery, activeFastQuery]);

  const [logOpen, setLogOpen] = useState(false);
  const [logGroup, setLogGroup] = useState<MealGroup | null>(null);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [waterGoalOpen, setWaterGoalOpen] = useState(false);
  const [mealPlannerOpen, setMealPlannerOpen] = useState(false);
  const [healthVaultStudioOpen, setHealthVaultStudioOpen] = useState(false);
  const [waterBusy, setWaterBusy] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoItem[]>([]);
  const [editing, setEditing] = useState<{ mealId: string; item: MealItem } | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<MealGroup | null>(null);

  const isHealthVaultActive = useFeaturesStore((s) => s.features.healthVault !== false);
  const loadHealthVaultData = useHealthVaultStore((s) => s.loadData);
  const loadTrainerData = useTrainerStore((s) => s.loadTrainerData);

  useEffect(() => {
    void loadHealthVaultData();
    void loadTrainerData();
  }, [loadHealthVaultData, loadTrainerData]);

  const hydrationGoalQuery = useHydrationGoal({ enabled: waterGoalOpen });
  const modalGoalLiters =
    hydrationGoalQuery.data?.goalLiters ?? hydration?.goalLiters ?? 2.5;
  const goalLoading = waterGoalOpen && hydrationGoalQuery.isFetching;

  const undoTop = undoStack[undoStack.length - 1] ?? null;

  const suggested = useMemo(() => suggestedMealGroup(), []);

  const orderedMeals: Meal[] = useMemo(() => {
    if (!day) return [];
    return MEAL_GROUPS.map((group) => day.meals.find((m) => m.group === group)).filter(
      (m): m is Meal => !!m,
    );
  }, [day]);

  useEffect(() => {
    setExpandedGroup(suggested);
  }, [suggested]);

  useEffect(() => {
    if (!openLogOnMount) return;
    setLogGroup(preferredLogGroup ?? suggested);
    setLogOpen(true);
    consumeOpenLogRequest();
  }, [openLogOnMount, preferredLogGroup, suggested, consumeOpenLogRequest]);

  const popUndoTop = () => {
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const openLog = (group?: MealGroup) => {
    const next = group ?? suggested;
    setLogGroup(next);
    setExpandedGroup(next);
    setLogOpen(true);
  };

  const onToggleMeal = (group: MealGroup) => {
    setExpandedGroup((current) => (current === group ? null : group));
  };

  const onAddWater = async (ml: number) => {
    setWaterError(null);
    setWaterBusy(true);
    try {
      const { entry } = await addWater.mutateAsync(ml);
      if (entry.id) {
        setUndoStack((prev) =>
          [...prev, { id: entry.id, amountMl: entry.amountMl }].slice(-MAX_UNDO_STACK),
        );
      }
    } catch (e) {
      setWaterError(getApiErrorMessage(e, 'Could not log water.'));
    } finally {
      setWaterBusy(false);
    }
  };

  const onUndoWater = async () => {
    if (!undoTop || waterBusy) return;
    const { id } = undoTop;
    setWaterError(null);
    setWaterBusy(true);
    try {
      await undoWater.mutateAsync(id);
      setUndoStack((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      setWaterError(getApiErrorMessage(e, 'Could not undo water log.'));
    } finally {
      setWaterBusy(false);
    }
  };

  const onDeleteLog = async (logId: string) => {
    if (!logId || waterBusy) return;
    setWaterError(null);
    setWaterBusy(true);
    try {
      await undoWater.mutateAsync(logId);
      setUndoStack((prev) => prev.filter((item) => item.id !== logId));
    } catch (e) {
      setWaterError(getApiErrorMessage(e, 'Could not remove water log.'));
    } finally {
      setWaterBusy(false);
    }
  };

  const hydrationBlock = (() => {
    if (hydrationQuery.isLoading && !hydration) {
      return (
        <View style={styles.hydrateSlot}>
          <ActivityIndicator color={C.primary} />
        </View>
      );
    }

    if (hydrationQuery.isError && !hydration) {
      return (
        <View style={styles.hydrateErrorBox}>
          <Text style={styles.hydrateErrorTitle}>{"Couldn't load hydration"}</Text>
          <Text style={styles.waterError}>
            {getApiErrorMessage(hydrationQuery.error, 'Check your connection and try again.')}
          </Text>
          <Pressable
            onPress={() => void hydrationQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading hydration"
            style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (!hydration) return null;

    return (
      <View style={styles.hydrateBlock}>
        <HydrationCard
          amountMl={hydration.amountMl}
          goalMl={hydration.goalMl}
          remainingMl={hydration.remainingMl}
          progressPercent={hydration.progressPercent}
          status={hydration.status}
          presets={hydration.presets}
          logs={hydration.logs}
          busy={waterBusy}
          onAdd={onAddWater}
          onDeleteLog={onDeleteLog}
          onEditGoal={() => setWaterGoalOpen(true)}
        />
        {waterError ? (
          <Text style={styles.waterError} accessibilityLiveRegion="polite">
            {waterError}
          </Text>
        ) : null}
      </View>
    );
  })();

  return (
    <AppScreen>
      <AppScreenHeader title="Nutrition" subtitle="Fuel & hydration" />

      {isLoading && !day ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : day ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }>

          <RemainingHero
            remaining={day.remaining}
            targets={day.targets}
            consumed={day.consumed}
            burned={0}
            onEditTargets={() => setTargetsOpen(true)}
          />

          <AIMealPlannerCard onPress={() => setMealPlannerOpen(true)} />

          <CoachDietPlanCard />

          <BanglaFoodGiBannerCard />

          <RamadanGuardBannerCard />

          {hydrationBlock}

          <MedicineRadarBannerCard />

          <MedicineCard />

          {isHealthVaultActive && (
            <HealthVaultSummaryCard
              onOpenHealthVault={() => setHealthVaultStudioOpen(true)}
            />
          )}

          <MealsList
            meals={orderedMeals}
            expandedGroup={expandedGroup}
            suggestedGroup={suggested}
            onToggle={onToggleMeal}
            onAdd={openLog}
            onEditItem={(mealId, item) => setEditing({ mealId, item })}
          />
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.empty}>
            {isAuthenticated ? 'No nutrition data available today.' : 'Sign in to track nutrition.'}
          </Text>
        </View>
      )}

      {/* Health Vault & Care Timeline Studio Modal */}
      <HealthVaultStudioModal
        visible={healthVaultStudioOpen}
        onClose={() => setHealthVaultStudioOpen(false)}
      />

      <LogFoodModal
        visible={logOpen}
        initialGroup={logGroup}
        onClose={() => setLogOpen(false)}
        onSave={async (input) => {
          await logFood.mutateAsync(input);
          setExpandedGroup(input.group);
        }}
      />

      <AIMealPlannerModal
        visible={mealPlannerOpen}
        onClose={() => setMealPlannerOpen(false)}
        onLogMeal={(meal) => {
          setLogGroup(meal.mealType as any);
          setLogOpen(true);
        }}
      />

      {day ? (
        <EditTargetsModal
          visible={targetsOpen}
          targets={day.targets}
          onClose={() => setTargetsOpen(false)}
          onSave={async (targets) => {
            await setTargets.mutateAsync(targets);
          }}
        />
      ) : null}

      {hydration || waterGoalOpen ? (
        <EditHydrationGoalModal
          visible={waterGoalOpen}
          goalLiters={modalGoalLiters}
          goalLoading={goalLoading}
          onClose={() => setWaterGoalOpen(false)}
          onSave={async (liters) => {
            await updateWaterGoal.mutateAsync(liters);
          }}
        />
      ) : null}

      <EditItemModal
        visible={!!editing}
        item={editing?.item ?? null}
        mealId={editing?.mealId ?? null}
        onClose={() => setEditing(null)}
        onSave={async (quantity) => {
          if (!editing) return;
          await editItem.mutateAsync({
            mealId: editing.mealId,
            itemId: editing.item.id,
            quantity,
          });
        }}
        onDelete={async () => {
          if (!editing) return;
          await deleteItem.mutateAsync({
            mealId: editing.mealId,
            itemId: editing.item.id,
          });
        }}
      />
      {undoTop ? (
        <WaterUndoToast
          key={undoTop.id}
          amountMl={undoTop.amountMl}
          durationMs={UNDO_MS}
          busy={waterBusy}
          stackCount={undoStack.length}
          onUndo={onUndoWater}
          onDismiss={popUndoTop}
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 144,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  hydrateBlock: {
    gap: 10,
  },
  hydrateSlot: {
    minHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrateErrorBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    backgroundColor: C.surfaceContainer,
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  hydrateErrorTitle: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  waterError: {
    color: C.error,
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.glow,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  retryText: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  logPressable: {
    width: '100%',
  },
  logFace: {
    minHeight: 56,
    width: '100%',
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  logIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 112,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  empty: {
    color: C.onSurfaceVariant,
    fontFamily: F.sans,
    textAlign: 'center',
  },
});
