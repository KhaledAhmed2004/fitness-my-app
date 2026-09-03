import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';
import {
  MEAL_GROUP_LABELS,
  MEAL_GROUPS,
  calculateItemNutrients,
} from '@/lib/nutrition-math';
import { defaultUnitForFood, searchFoods, fetchFoodByBarcode } from '@/services/food-catalog';
import { BarcodeScannerModal } from '@/components/nutrition/barcode-scanner-modal';
import { LabelScannerModal } from '@/components/nutrition/label-scanner-modal';
import { BanglaFoodGiModal } from '@/components/nutrition/bangla-food-gi-modal';
import type { ExtractedNutrition } from '@/services/gemini-vision';
import type { Food, MealGroup, QuantityUnit } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  initialGroup?: MealGroup | null;
  onClose: () => void;
  onSave: (input: {
    foodId: string;
    quantity: number;
    unit: QuantityUnit;
    group: MealGroup;
  }) => Promise<void>;
};

export function LogFoodModal({ visible, initialGroup, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MealGroup>('lunch');
  const [food, setFood] = useState<Food | null>(null);
  const [unit, setUnit] = useState<QuantityUnit>('g');
  const [qtyText, setQtyText] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [labelScannerOpen, setLabelScannerOpen] = useState(false);
  const [banglaFoodModalOpen, setBanglaFoodModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setFood(null);
    setError(null);
    setGroup(initialGroup ?? 'lunch');
  }, [visible, initialGroup]);

  useEffect(() => {
    if (!food) return;
    const nextUnit = defaultUnitForFood(food);
    setUnit(nextUnit);
    setQtyText(nextUnit === 'serving' ? '1' : '100');
  }, [food]);

  const foods = useMemo(() => searchFoods(query), [query]);

  const preview = useMemo(() => {
    if (!food) return null;
    const qty = Number(qtyText);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    try {
      return calculateItemNutrients(food, qty, unit);
    } catch {
      return null;
    }
  }, [food, qtyText, unit]);

  const unitOptions: QuantityUnit[] = useMemo(() => {
    if (!food) return [];
    const opts: QuantityUnit[] = [];
    if (food.per100g) opts.push('g');
    if (food.perServing) opts.push('serving');
    return opts;
  }, [food]);

  const handleSave = async () => {
    setError(null);
    if (!food) {
      setError('Pick a food from the catalog.');
      return;
    }
    const quantity = Number(qtyText);
    setSaving(true);
    try {
      await onSave({ foodId: food.id, quantity, unit, group });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save meal item.');
    } finally {
      setSaving(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setScannerOpen(false);
    setScanning(true);
    setError(null);
    console.log('✅ Barcode Scanned! Number:', barcode); // Terminal-e barcode number dekhabe

    try {
      const fetchedFood = await fetchFoodByBarcode(barcode);
      console.log('🍽️ Fetched Food Data:', fetchedFood); // Terminal-e result dekhabe
      
      if (fetchedFood) {
        setFood(fetchedFood);
        setQuery(fetchedFood.name);
      } else {
        // Show alert to prompt for label scanning
        Alert.alert(
          'Food Not Found',
          `Barcode ${barcode} is not in our database.\nWould you like to scan the nutrition label instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Scan Label', 
              onPress: () => setLabelScannerOpen(true) 
            }
          ]
        );
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(`Error fetching data for barcode: ${barcode}`);
    } finally {
      setScanning(false);
    }
  };

  const handleLabelExtracted = (extracted: ExtractedNutrition) => {
    setLabelScannerOpen(false);
    
    // Create a temporary food object from extracted data
    const newFood: Food = {
      id: `custom-ai-${Date.now()}`,
      name: extracted.name || 'Custom AI Food',
      servingLabel: extracted.servingSize || 'serving',
      perServing: {
        calories: extracted.calories,
        proteinG: extracted.proteinG,
        carbsG: extracted.carbsG,
        fatG: extracted.fatG,
      }
    };
    
    setFood(newFood);
    setQuery(newFood.name);
  };

  const sectionLabel = (t: string) => (
    <Text
      style={{
        color: C.onSurfaceVariant,
        fontSize: 11,
        fontFamily: F.mono,
        letterSpacing: 1,
        marginBottom: 8,
      }}>
      {t}
    </Text>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="max-h-[88%] px-5 pt-3"
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
          <View className="mb-4 flex-row items-center justify-between">
            <Text style={{ color: C.onSurface, fontSize: 20, fontFamily: F.sansExtraBold }}>
              Log food
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={C.outline} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {sectionLabel('MEAL')}
            <View className="mb-4 flex-row flex-wrap gap-2">
              {MEAL_GROUPS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGroup(g)}
                  className="rounded-full px-3.5 py-2"
                  style={{
                    backgroundColor: group === g ? C.primaryContainer : C.surfaceContainer,
                    borderWidth: group === g ? 0 : 1,
                    borderColor: C.outlineVariant,
                  }}>
                  <Text
                    style={{
                      color: group === g ? C.onPrimaryContainer : C.onSurface,
                      fontSize: 13,
                      fontFamily: F.sansSemiBold,
                    }}>
                    {MEAL_GROUP_LABELS[g]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {sectionLabel('FOOD')}
            <View
              className="mb-2 flex-row items-center rounded-2xl border px-4 py-3"
              style={{
                borderColor: C.outlineVariant,
                backgroundColor: C.surfaceContainer,
              }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search catalog…"
                placeholderTextColor={C.outline}
                className="flex-1 text-base"
                style={{
                  color: C.onSurface,
                  fontFamily: F.sans,
                  padding: 0,
                }}
              />
              <Pressable
                hitSlop={8}
                onPress={() => setScannerOpen(true)}
                accessibilityLabel="Scan Barcode"
                className="ml-2">
                <MaterialIcons name="qr-code-scanner" size={24} color={C.primary} />
              </Pressable>
            </View>

            {/* BANGLADESHI FOOD GI & NUTRITION GUIDE SHORTCUT */}
            <Pressable
              onPress={() => setBanglaFoodModalOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
                gap: 6,
              }}>
              <MaterialIcons name="eco" size={18} color="#10B981" />
              <Text style={{ color: '#10B981', fontFamily: F.sansSemiBold, fontSize: 12, flex: 1 }}>
                🥗 দেশীয় খাবারের সুগার, GI ও ক্যালরি গাইড
              </Text>
              <MaterialIcons name="chevron-right" size={18} color="#10B981" />
            </Pressable>
            {scanning && <ActivityIndicator size="small" color={C.primary} style={{ marginBottom: 12 }} />}
            {foods.length > 0 ? (
              <View
                className="mb-4 max-h-40 overflow-hidden rounded-2xl border"
                style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainer }}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {foods.map((f) => (
                    <Pressable
                      key={f.id}
                      onPress={() => setFood(f)}
                      className="border-b px-4 py-3"
                      style={{
                        borderBottomColor: C.outlineVariant,
                        backgroundColor:
                          food?.id === f.id ? 'rgba(137,206,255,0.12)' : 'transparent',
                      }}>
                      <Text style={{ color: C.onSurface, fontFamily: F.sansSemiBold }}>{f.name}</Text>
                      <Text style={{ color: C.onSurfaceVariant, fontSize: 12, fontFamily: F.sans }}>
                        {f.per100g ? 'per 100g' : ''}
                        {f.per100g && f.perServing ? ' · ' : ''}
                        {f.perServing ? `per ${f.servingLabel ?? 'serving'}` : ''}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : query.trim() !== '' ? (
              <View
                className="mb-4 items-center justify-center rounded-2xl border px-4 py-6"
                style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainer }}>
                <MaterialIcons name="search-off" size={28} color={C.outline} style={{ marginBottom: 8 }} />
                <Text style={{ color: C.onSurfaceVariant, fontSize: 14, fontFamily: F.sans, textAlign: 'center' }}>
                  No food found matching &quot;{query}&quot;. Try a different search or scan a label.
                </Text>
              </View>
            ) : null}

            {food ? (
              <>
                {sectionLabel('QUANTITY')}
                <View className="mb-3 flex-row gap-2">
                  {unitOptions.map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => setUnit(u)}
                      className="rounded-full px-3.5 py-2"
                      style={{
                        backgroundColor: unit === u ? C.primaryContainer : C.surfaceContainer,
                        borderWidth: unit === u ? 0 : 1,
                        borderColor: C.outlineVariant,
                      }}>
                      <Text
                        style={{
                          color: unit === u ? C.onPrimaryContainer : C.onSurface,
                          fontSize: 13,
                          fontFamily: F.sansSemiBold,
                        }}>
                        {u === 'g' ? 'Grams' : food.servingLabel ?? 'Serving'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                    style={{ backgroundColor: 'rgba(137,206,255,0.12)', borderWidth: 1, borderColor: C.glassBorder }}>
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
              </>
            ) : null}

            {error ? (
              <Text style={{ color: C.error, fontSize: 14, fontFamily: F.sans, marginBottom: 12 }}>
                {error}
              </Text>
            ) : null}

            <PrimaryButton label="Save to meal" onPress={handleSave} loading={saving} />
            {saving ? <ActivityIndicator className="mt-2" color={C.primary} /> : null}
          </ScrollView>
        </View>
      </View>
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleBarcodeScanned}
      />
      <LabelScannerModal
        visible={labelScannerOpen}
        onClose={() => setLabelScannerOpen(false)}
        onExtracted={handleLabelExtracted}
      />
      <BanglaFoodGiModal
        visible={banglaFoodModalOpen}
        onClose={() => setBanglaFoodModalOpen(false)}
      />
    </Modal>
  );
}
