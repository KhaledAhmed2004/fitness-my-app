import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { MealGroup } from '@/types/nutrition';

export const GROUP_ICONS: Record<MealGroup, ComponentProps<typeof MaterialIcons>['name']> = {
  breakfast: 'wb-sunny',
  lunch: 'wb-twilight',
  dinner: 'nights-stay',
  snack: 'emoji-food-beverage',
};
