import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GROUP_ICONS } from '@/components/nutrition/meal-group-icons';
import { MealItemRow } from '@/components/nutrition/meal-item-row';
import { Vital } from '@/constants/vital-theme';
import { MEAL_GROUP_LABELS, mealGroupCalories } from '@/lib/nutrition-math';
import type { Meal, MealGroup, MealItem } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  meals: Meal[];
  expandedGroup: MealGroup | null;
  suggestedGroup: MealGroup;
  onToggle: (group: MealGroup) => void;
  onAdd: (group: MealGroup) => void;
  onEditItem: (mealId: string, item: MealItem) => void;
};

/**
 * MENTOR: One meals list — compact summary rows (scan), expand for progressive disclosure.
 */
export function MealsList({
  meals,
  expandedGroup,
  suggestedGroup,
  onToggle,
  onAdd,
  onEditItem,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Meals</Text>

      {meals.map((meal, index) => {
        const count = meal.items.length;
        const filled = count > 0;
        const kcal = mealGroupCalories(meal);
        const expanded = expandedGroup === meal.group;
        const suggested = meal.group === suggestedGroup;
        const isLast = index === meals.length - 1;

        return (
          <View key={meal.id} style={!isLast || expanded ? styles.block : undefined}>
            <Pressable
              onPress={() => onToggle(meal.group)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${MEAL_GROUP_LABELS[meal.group]}, ${
                filled ? `${Math.round(kcal)} calories, ${count} items` : 'not logged'
              }`}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <View
                style={[
                  styles.row,
                  !isLast && !expanded && styles.rowBorder,
                  suggested && !expanded && styles.rowSuggested,
                ]}>
                <View style={[styles.iconWrap, suggested && styles.iconSuggested]}>
                  <MaterialIcons
                    name={GROUP_ICONS[meal.group]}
                    size={18}
                    color={suggested ? C.onPrimary : C.primary}
                  />
                </View>

                <View style={styles.copy}>
                  <Text style={styles.title}>{MEAL_GROUP_LABELS[meal.group]}</Text>
                  <Text style={styles.meta}>
                    {filled
                      ? `${Math.round(kcal)} kcal  ·  ${count} item${count === 1 ? '' : 's'}`
                      : suggested
                        ? 'Suggested now'
                        : 'Not logged'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onAdd(meal.group)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Add food to ${MEAL_GROUP_LABELS[meal.group]}`}
                  style={styles.addHit}>
                  <View style={styles.addFace}>
                    <MaterialIcons name="add" size={18} color={C.primary} />
                  </View>
                </Pressable>

                <MaterialIcons
                  name={expanded ? 'expand-less' : 'chevron-right'}
                  size={22}
                  color={C.onSurfaceVariant}
                />
              </View>
            </Pressable>

            {expanded ? (
              <View style={[styles.panel, !isLast && styles.rowBorder]}>
                {filled ? (
                  meal.items.map((item) => (
                    <MealItemRow
                      key={item.id}
                      item={item}
                      onPress={() => onEditItem(meal.id, item)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyCopy}>Nothing logged for this meal yet.</Text>
                )}

                <Pressable
                  onPress={() => onAdd(meal.group)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add food to ${MEAL_GROUP_LABELS[meal.group]}`}
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <View style={styles.addRowFace}>
                    <MaterialIcons name="add" size={18} color={C.primary} />
                    <Text style={styles.addRowText}>Add food</Text>
                  </View>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    paddingTop: 16,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  heading: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  block: {},
  pressed: {
    opacity: 0.88,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowSuggested: {
    backgroundColor: 'rgba(137, 206, 255, 0.08)',
  },
  iconWrap: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${C.primary}18`,
  },
  iconSuggested: {
    backgroundColor: C.primaryContainer,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansSemiBold,
  },
  meta: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: F.sans,
    marginTop: 2,
  },
  addHit: {},
  addFace: {
    height: 30,
    width: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(137, 206, 255, 0.16)',
  },
  panel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.surfaceLowest,
  },
  emptyCopy: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: F.sans,
    paddingVertical: 12,
  },
  addRowFace: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(137, 206, 255, 0.14)',
  },
  addRowText: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
});
