import React, { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  FEATURES_METADATA,
  FeatureMeta,
  useFeaturesStore,
} from '@/stores/features-store';

const C = Vital.colors;
const F = Vital.fonts;

function ModuleItemRow({
  meta,
  isEnabled,
  onToggle,
  isLast,
}: {
  meta: FeatureMeta;
  isEnabled: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const { colors, isDark } = useThemeColors();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isEnabled }}
      accessibilityLabel={meta.label}
      style={[
        styles.moduleRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        { opacity: isEnabled ? 1 : 0.55 },
      ]}>
      {/* Icon Badge */}
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: isEnabled ? (isDark ? meta.bgColor : colors.surfaceContainerHigh) : colors.glassFill,
          },
        ]}>
        <MaterialIcons
          name={meta.icon}
          size={22}
          color={isEnabled ? (isDark ? meta.color : colors.primary) : colors.textMuted}
        />
      </View>

      {/* Title & Subtitle */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.moduleTitle,
            { color: isEnabled ? colors.textPrimary : colors.textSecondary },
          ]}
          numberOfLines={1}>
          {meta.label}
        </Text>
        <Text style={[styles.moduleSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
          {meta.subtitle}
        </Text>
      </View>

      {/* Switch Control */}
      <Switch
        value={isEnabled}
        onValueChange={onToggle}
        trackColor={{
          false: colors.border,
          true: colors.primary,
        }}
        thumbColor={isEnabled ? '#FFFFFF' : '#9E9E9E'}
        ios_backgroundColor={colors.border}
      />
    </Pressable>
  );
}

export default function CustomizeModulesScreen() {
  const { features, toggleFeature, enableAll, resetDefaults, loadFeatures } =
    useFeaturesStore();
  const { colors, isDark } = useThemeColors();

  const [resetModalVisible, setResetModalVisible] = useState(false);

  useEffect(() => {
    void loadFeatures();
  }, [loadFeatures]);

  const activeCount = Object.values(features).filter(Boolean).length;
  const totalCount = FEATURES_METADATA.length;
  const progressPercent = Math.round((activeCount / totalCount) * 100);

  const handleOpenReset = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setResetModalVisible(true);
  };

  const handleConfirmReset = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    enableAll();
    setResetModalVisible(false);
  };

  const categories = [
    {
      title: 'HEALTH & WELLNESS',
      items: FEATURES_METADATA.filter((m) => m.category === 'Health & Wellness'),
    },
    {
      title: 'PRODUCTIVITY',
      items: FEATURES_METADATA.filter((m) => m.category === 'Productivity'),
    },
    {
      title: 'LIFESTYLE & HABITS',
      items: FEATURES_METADATA.filter((m) => m.category === 'Lifestyle & Habits'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* APP BAR */}
      <View style={styles.appBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.appBarTitle, { color: colors.textPrimary }]}>Customize Modules</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenReset}
          style={[styles.resetBtn, { backgroundColor: isDark ? 'rgba(56, 224, 255, 0.12)' : 'rgba(14, 77, 52, 0.12)' }]}>
          <MaterialIcons name="restart-alt" size={16} color={colors.primary} />
          <Text style={[styles.resetBtnText, { color: colors.primary }]}>Reset All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* HERO STATUS CARD */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroHeaderLeft}>
              <View style={[styles.heroIconWrap, { backgroundColor: isDark ? C.primaryAlpha20 : colors.surfaceContainerHigh }]}>
                <MaterialIcons name="tune" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Dashboard Experience</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  {activeCount} of {totalCount} features active
                </Text>
              </View>
            </View>

            <View style={[styles.heroPercentPill, { backgroundColor: isDark ? C.primaryAlpha20 : colors.surfaceContainerHigh }]}>
              <Text style={[styles.heroPercentText, { color: colors.primary }]}>{progressPercent}%</Text>
            </View>
          </View>

          {/* EXPLICIT HEIGHT PROGRESS BAR */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(14, 77, 52, 0.12)' }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>

          <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
            Disable features you don&apos;t use to keep your dashboard, widgets, and navigation minimal and distraction-free.
          </Text>
        </View>

        {/* CATEGORY GROUPS */}
        {categories.map((cat) => (
          <View key={cat.title} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>{cat.title}</Text>

            <View style={[styles.categoryCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              {cat.items.map((item, idx) => (
                <ModuleItemRow
                  key={item.key}
                  meta={item}
                  isEnabled={Boolean(features[item.key])}
                  onToggle={() => toggleFeature(item.key)}
                  isLast={idx === cat.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ATTRACTIVE CUSTOM DARK RESET MODAL */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setResetModalVisible(false)}
          />

          <View style={styles.modalCard}>
            {/* GLOWING ICON HEADER */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconGlow} />
              <View style={styles.modalIconCircle}>
                <MaterialIcons name="auto-awesome" size={28} color="#89CEFF" />
              </View>
            </View>

            {/* TITLE & DESCRIPTION */}
            <Text style={styles.modalTitle}>Reset All Features?</Text>
            <Text style={styles.modalSubtitle}>
              This will re-enable all 8 modules and immediately restore all dashboard cards, widgets, and navigation shortcuts.
            </Text>

            {/* FEATURE BADGES PREVIEW */}
            <View style={styles.modalBadgesRow}>
              {['Nutrition', 'Fasting', 'Running', 'Focus', 'Habits', 'Todos', 'Meds', 'Health'].map((tag) => (
                <View key={tag} style={styles.modalBadgePill}>
                  <Text style={styles.modalBadgeText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.modalActions}>
              {/* PRIMARY SOLID CYAN BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmReset}
                style={styles.modalPrimaryBtn}>
                <MaterialIcons name="check-circle" size={20} color="#002233" />
                <Text style={styles.modalPrimaryBtnText}>Enable All Features</Text>
              </TouchableOpacity>

              {/* SECONDARY FROSTED BUTTON */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setResetModalVisible(false)}
                style={styles.modalSecondaryBtn}>
                <Text style={styles.modalSecondaryBtnText}>Keep Current Setup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    gap: 4,
  },
  resetBtnText: {
    color: '#89CEFF',
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  heroCard: {
    marginBottom: 20,
    padding: 18,
    borderRadius: Vital.radius.xxl,
    backgroundColor: C.surfaceContainer,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: C.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  heroSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 1,
  },
  heroPercentPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.primaryAlpha20,
  },
  heroPercentText: {
    color: C.primary,
    fontSize: 11,
    fontFamily: F.mono,
  },
  progressTrack: {
    marginTop: 14,
    height: 6,
    width: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  heroDescription: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 12,
    lineHeight: 17,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 2,
  },
  categoryCard: {
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    overflow: 'hidden',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  moduleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBadge: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  moduleTitle: {
    fontSize: 15,
    fontFamily: F.sansSemiBold,
    letterSpacing: -0.2,
  },
  moduleSubtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
    lineHeight: 16,
  },

  /* ATTRACTIVE RESET MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(137, 206, 255, 0.25)',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(137, 206, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: F.sansBold,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    color: '#9E9E9E',
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 22,
  },
  modalBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(137, 206, 255, 0.08)',
  },
  modalBadgeText: {
    color: '#89CEFF',
    fontSize: 11,
    fontFamily: F.mono,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#89CEFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryBtnText: {
    color: '#002538',
    fontSize: 15,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  modalSecondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: '#E0E3E6',
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
});
