import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { formatQty } from '@/lib/nutrition-math';
import { getFoodById } from '@/services/food-catalog';
import type { MealItem } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  item: MealItem;
  onPress: () => void;
};

export function MealItemRow({ item, onPress }: Props) {
  const food = getFoodById(item.foodId);
  const qtyLabel =
    item.unit === 'g'
      ? `${Math.round(item.quantity * 10) / 10}g`
      : formatQty(item.quantity, item.unit, food?.servingLabel);
  const leftLabel = `${item.foodName} - ${qtyLabel}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.foodName}`}
      style={styles.row}>
      <Text numberOfLines={1} style={styles.name}>
        {leftLabel}
      </Text>
      <Text style={styles.kcal}>{Math.round(item.nutrients.calories)} kcal</Text>
      <View style={styles.edit}>
        <MaterialIcons name="edit" size={16} color={C.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  name: {
    flex: 1,
    marginRight: 8,
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sans,
  },
  kcal: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.mono,
    marginRight: 8,
  },
  edit: {
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
