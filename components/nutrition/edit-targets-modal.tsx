import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';
import type { MacroTargets } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  targets: MacroTargets;
  onClose: () => void;
  onSave: (targets: MacroTargets) => Promise<void>;
};

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text
        style={{
          color: C.onSurface,
          fontSize: 14,
          fontFamily: F.sansSemiBold,
          marginBottom: 6,
        }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        className="rounded-2xl border px-4 py-3 text-base"
        style={{
          borderColor: C.outlineVariant,
          backgroundColor: C.surfaceContainer,
          color: C.onSurface,
          fontFamily: F.mono,
        }}
      />
    </View>
  );
}

export function EditTargetsModal({ visible, targets, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCalories(String(targets.calories));
    setProtein(String(targets.proteinG));
    setCarbs(String(targets.carbsG));
    setFat(String(targets.fatG));
    setError(null);
  }, [visible, targets]);

  const handleSave = async () => {
    setError(null);
    const next = {
      calories: Number(calories),
      proteinG: Number(protein),
      carbsG: Number(carbs),
      fatG: Number(fat),
    };
    setSaving(true);
    try {
      await onSave(next);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save targets.');
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
          <View className="mb-4 flex-row items-center justify-between">
            <Text style={{ color: C.onSurface, fontSize: 20, fontFamily: F.sansExtraBold }}>
              Daily targets
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={C.outline} />
            </Pressable>
          </View>

          <Field label="Calories (kcal)" value={calories} onChange={setCalories} />
          <Field label="Protein (g)" value={protein} onChange={setProtein} />
          <Field label="Carbs (g)" value={carbs} onChange={setCarbs} />
          <Field label="Fat (g)" value={fat} onChange={setFat} />

          {error ? (
            <Text style={{ color: C.error, fontSize: 14, fontFamily: F.sans, marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton label="Save targets" onPress={handleSave} loading={saving} />
        </View>
      </View>
    </Modal>
  );
}
