import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import { cn } from '@/lib/cn';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  kicker: string;
  title: string;
  body: string;
  /** When true, parent already provides SafeArea + header */
  embedded?: boolean;
};

export function TabPlaceholder({ kicker, title, body, embedded = false }: Props) {
  const content = (
    <View className={cn('flex-1 justify-center px-6', embedded ? 'pb-28 pt-2' : 'pb-28')}>
      <Text
        style={{
          color: C.primary,
          fontSize: 12,
          fontFamily: F.mono,
          letterSpacing: 1.4,
          marginBottom: 8,
        }}>
        {kicker.toUpperCase()}
      </Text>
      <Text
        style={{
          color: C.onSurface,
          fontSize: 28,
          fontFamily: F.sansExtraBold,
          letterSpacing: -0.4,
          marginBottom: 12,
        }}>
        {title}
      </Text>
      <Text style={{ color: C.onSurfaceVariant, fontSize: 16, fontFamily: F.sans, lineHeight: 24 }}>
        {body}
      </Text>
    </View>
  );

  if (embedded) return content;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.background }} edges={['top']}>
      {content}
    </SafeAreaView>
  );
}
