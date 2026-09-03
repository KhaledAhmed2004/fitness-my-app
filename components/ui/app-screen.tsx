import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';

type Props = {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/**
 * AppScreen — Unified adaptive screen container with safe areas
 * and reactive theme background color.
 */
export function AppScreen({ children, edges = ['top'], style }: Props) {
  const { colors } = useThemeColors();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
