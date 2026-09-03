/** Nutrition UI intents (Zustand) + re-exports for convenience. */
export { useNutritionUiStore } from '@/stores/nutrition-ui-store';
export {
  useAddWater,
  useDeleteItem,
  useEditItemQuantity,
  useHydration,
  useLogFood,
  useNutritionDay,
  useSetTargets,
  useUndoWater,
  useUpdateWaterGoal,
} from '@/hooks/nutrition-queries';
