import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useThemeStore } from '@/stores/theme-store';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeSelectorModal } from '@/components/theme/theme-selector-modal';

type Props = {
  size?: 'sm' | 'md';
};

export function ThemeToggleButton({ size = 'md' }: Props) {
  const { isDark, toggleTheme, loadTheme } = useThemeStore();
  const { colors } = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    void loadTheme();
  }, [loadTheme]);

  const dim = size === 'sm' ? 36 : 40;
  const iconSize = size === 'sm' ? 18 : 20;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change theme appearance"
        hitSlop={8}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setModalVisible(true);
        }}
        onLongPress={() => {
          toggleTheme();
        }}
        style={({ pressed }) => [
          styles.container,
          {
            width: dim,
            height: dim,
            borderRadius: 14,
            opacity: pressed ? 0.75 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: colors.border,
          },
        ]}>
        <MaterialIcons
          name="palette"
          size={iconSize}
          color={colors.primary}
        />
      </Pressable>

      <ThemeSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});


