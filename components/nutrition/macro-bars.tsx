import { Text, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { progressRatio } from '@/lib/nutrition-math';
import type { Nutrients } from '@/types/nutrition';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  consumed: Nutrients;
  targets: Nutrients;
};

function MacroBar({
  label,
  consumed,
  target,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
}) {
  const ratio = progressRatio(consumed, target);
  return (
    <View className="flex-1">
      <View className="mb-1.5 flex-row items-baseline justify-between">
        <Text style={{ color: C.onSurface, fontSize: 12, fontFamily: F.sansBold }}>{label}</Text>
        <Text style={{ color: C.onSurfaceVariant, fontSize: 11, fontFamily: F.mono }}>
          {Math.round(consumed)}/{Math.round(target)}g
        </Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: C.surfaceHighest }}>
        <View className="h-full rounded-full" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function MacroBars({ consumed, targets }: Props) {
  return (
    <View
      className="flex-row gap-3 px-4 py-4"
      style={{
        borderRadius: Vital.radius.xxl,
        borderWidth: 1,
        borderColor: C.glassBorder,
        backgroundColor: C.surfaceContainer,
      }}>
      <MacroBar
        label="Protein"
        consumed={consumed.proteinG}
        target={targets.proteinG}
        color={C.primary}
      />
      <MacroBar
        label="Carbs"
        consumed={consumed.carbsG}
        target={targets.carbsG}
        color={C.secondaryContainer}
      />
      <MacroBar label="Fat" consumed={consumed.fatG} target={targets.fatG} color={C.tertiary} />
    </View>
  );
}
