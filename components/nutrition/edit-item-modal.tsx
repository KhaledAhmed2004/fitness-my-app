import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';
import { calculateItemNutrients, formatQty } from '@/lib/nutrition-math';
import { getFoodById } from '@/services/food-catalog';
import type { MealItem } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  item: MealItem | null;
  mealId: string | null;
  onClose: () => void;
  onSave: (quantity: number) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function EditItemModal({ visible, item, mealId, onClose, onSave, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const [qtyText, setQtyText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !item) return;
    setQtyText(String(item.quantity));
    setError(null);
  }, [visible, item]);

  const food = item ? getFoodById(item.foodId) : undefined;

  const preview = useMemo(() => {
    if (!item || !food) return null;
    const qty = Number(qtyText);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    try {
      return calculateItemNutrients(food, qty, item.unit);
    } catch {
      return null;
    }
  }, [item, food, qtyText]);

  const handleSave = async () => {
    if (!item || !mealId) return;
    setError(null);
    setSaving(true);
    try {
      await onSave(Number(qtyText));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="px-5 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: C.surfaceLow,
            borderTopLeftRadius: Vital.radius.xxl,
            borderTopRightRadius: Vital.radius.xxl,
            borderTopWidth: 1,
            borderColor: C.glassBorder,
          }}>
          <View className="mb-3 items-center">
            <View className="h-1.5 w-10 rounded-full" style={{ backgroundColor: C.outlineVariant }} />
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text style={{ color: C.onSurface, fontSize: 20, fontFamily: F.sansExtraBold }}>
              Edit item
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={C.outline} />
            </Pressable>
          </View>

          {item ? (
            <>
              <Text style={{ color: C.onSurface, fontSize: 16, fontFamily: F.sansSemiBold, marginBottom: 4 }}>
                {item.foodName}
              </Text>
              <Text
                style={{
                  color: C.onSurfaceVariant,
                  fontSize: 13,
                  fontFamily: F.sans,
                  marginBottom: 16,
                }}>
                Unit:{' '}
                {formatQty(1, item.unit, food?.servingLabel)
                  .replace(/^1 × /, '')
                  .replace(/^1 /, '')}
                {item.unit === 'g' ? 'grams' : ''}
              </Text>

              <Text
                style={{
                  color: C.onSurface,
                  fontSize: 14,
                  fontFamily: F.sansSemiBold,
                  marginBottom: 6,
                }}>
                Quantity
              </Text>
              <TextInput
                value={qtyText}
                onChangeText={setQtyText}
                keyboardType="decimal-pad"
                className="mb-4 rounded-2xl border px-4 py-3 text-base"
                style={{
                  borderColor: C.outlineVariant,
                  backgroundColor: C.surfaceContainer,
                  color: C.onSurface,
                  fontFamily: F.mono,
                }}
              />

              {preview ? (
                <View
                  className="mb-4 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: 'rgba(137,206,255,0.12)',
                    borderWidth: 1,
                    borderColor: C.glassBorder,
                  }}>
                  <Text style={{ color: C.primary, fontSize: 14, fontFamily: F.sansBold }}>
                    ≈ {Math.round(preview.calories)} kcal
                  </Text>
                  <Text
                    style={{
                      color: C.onSurfaceVariant,
                      fontSize: 12,
                      fontFamily: F.mono,
                      marginTop: 4,
                    }}>
                    P {preview.proteinG}g · C {preview.carbsG}g · F {preview.fatG}g
                  </Text>
                </View>
              ) : null}

              {error ? (
                <Text style={{ color: C.error, fontSize: 14, fontFamily: F.sans, marginBottom: 12 }}>
                  {error}
                </Text>
              ) : null}

              <PrimaryButton label="Update quantity" onPress={handleSave} loading={saving} />
              <View className="mt-2">
                <PrimaryButton
                  label="Remove item"
                  variant="ghost"
                  onPress={handleDelete}
                  disabled={saving}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
