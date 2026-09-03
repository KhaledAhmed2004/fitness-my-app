import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { THEME_PRESETS, useThemeStore, type ThemeMode } from '@/stores/theme-store';

const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ThemeSelectorModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const { theme: currentTheme, setTheme } = useThemeStore();

  const handleSelectTheme = (themeId: ThemeMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTheme(themeId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetCard,
            {
              backgroundColor: isDark ? '#161D24' : colors.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border,
            },
          ]}>
          {/* DRAG HANDLE */}
          <View style={styles.handleWrap}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
              ]}
            />
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.headerIconBox, { backgroundColor: 'rgba(137, 206, 255, 0.14)' }]}>
                <MaterialIcons name="palette" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Appearance & Themes</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Choose your fitness environment palette
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <MaterialIcons name="close" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* THEME CARDS LIST */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.themesList}>
            {THEME_PRESETS.map((preset) => {
              const isSelected = currentTheme === preset.id;
              const { previewColors } = preset;

              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTheme(preset.id)}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.03)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isSelected ? previewColors.primary : isDark ? 'rgba(255, 255, 255, 0.07)' : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}>
                  {/* LEFT: EMOJI & INFO */}
                  <View style={styles.themeInfoWrap}>
                    <View
                      style={[
                        styles.themeEmojiBox,
                        {
                          backgroundColor: previewColors.bg,
                          borderColor: previewColors.primary,
                        },
                      ]}>
                      <Text style={styles.themeEmojiText}>{preset.emoji}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[
                            styles.themeName,
                            {
                              color: colors.textPrimary,
                              fontFamily: isSelected ? F.sansBold : F.sansSemiBold,
                            },
                          ]}>
                          {preset.name}
                        </Text>
                        {preset.id === 'dark' && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
                        {preset.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* RIGHT: COLOR SWATCHES & RADIO CHECK */}
                  <View style={styles.themeRightWrap}>
                    {/* SWATCH BUBBLES */}
                    <View style={styles.swatchesRow}>
                      <View style={[styles.swatchOrb, { backgroundColor: previewColors.bg, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
                      <View style={[styles.swatchOrb, { backgroundColor: previewColors.surface, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
                      <View style={[styles.swatchOrb, { backgroundColor: previewColors.primary }]} />
                      <View style={[styles.swatchOrb, { backgroundColor: previewColors.accent }]} />
                    </View>

                    {/* SELECTION RADIO */}
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? previewColors.primary : colors.textMuted,
                          backgroundColor: isSelected ? previewColors.primary : 'transparent',
                        },
                      ]}>
                      {isSelected && <MaterialIcons name="check" size={13} color={preset.isDark ? '#000' : '#FFF'} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* FOOTER NOTE */}
          <View style={[styles.footerWrap, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border }]}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.primary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Theme preference is automatically saved to your device.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
    maxHeight: '85%',
    gap: 14,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themesList: {
    gap: 8,
    paddingVertical: 4,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  themeInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  themeEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeEmojiText: {
    fontSize: 18,
  },
  themeName: {
    fontSize: 13,
  },
  defaultBadge: {
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    color: '#89CEFF',
    letterSpacing: 0.5,
  },
  themeSubtitle: {
    fontSize: 10.5,
    fontFamily: F.sans,
    marginTop: 1,
  },
  themeRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  swatchOrb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 10.5,
    fontFamily: F.sans,
    flex: 1,
  },
});
