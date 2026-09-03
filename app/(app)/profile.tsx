import type { ComponentProps } from 'react';
import React, { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';
import {
  FEATURES_METADATA,
  useFeaturesStore,
} from '@/stores/features-store';
import { TrainerScheduleModal } from '@/components/trainer/trainer-schedule-modal';
import { TrainerProfileModal } from '@/components/trainer/trainer-profile-modal';
import { ClientCrmModal } from '@/components/trainer/client-crm-modal';
import { useTrainerStore } from '@/stores/trainer-store';
import { THEME_PRESETS, useThemeStore } from '@/stores/theme-store';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeSelectorModal } from '@/components/theme/theme-selector-modal';

const C = Vital.colors;
const F = Vital.fonts;

type MenuItem = {
  id: string;
  label: string;
  hint?: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  iconBg?: string;
  danger?: boolean;
  badge?: string;
  onPress?: () => void;
};

type InfoModalState = {
  visible: boolean;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  badge?: string;
  description: string;
  primaryBtnText?: string;
  isDanger?: boolean;
  showCancel?: boolean;
  onConfirm?: () => void;
};

function initials(name?: string | null) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast?: boolean }) {
  const { colors, isDark } = useThemeColors();
  const isDanger = Boolean(item.danger);
  const defaultBg = isDanger
    ? 'rgba(255,180,171,0.12)'
    : item.iconBg ?? (isDark ? 'rgba(137,206,255,0.15)' : '#D5EDB8');
  const defaultColor = isDanger
    ? (isDark ? C.error : '#DC2626')
    : item.iconColor ?? (isDark ? C.primary : '#0E4D34');

  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      className="flex-row items-center px-4 py-3.5 active:opacity-80"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}>
      {/* Leading Icon */}
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: defaultBg, marginRight: 14 }}>
        <MaterialIcons name={item.icon} size={22} color={defaultColor} />
      </View>

      {/* Title & Subtitle */}
      <View className="flex-1 pr-2">
        <Text
          style={{
            color: isDanger ? (isDark ? C.error : '#DC2626') : colors.textPrimary,
            fontSize: 15,
            fontFamily: F.sansSemiBold,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}>
          {item.label}
        </Text>
        {item.hint ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontFamily: F.sans,
              marginTop: 2,
            }}
            numberOfLines={1}>
            {item.hint}
          </Text>
        ) : null}
      </View>

      {/* Trailing Accessory (Badge + Chevron) */}
      <View className="flex-row items-center gap-1.5 pl-1">
        {item.badge ? (
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: isDark ? C.primaryAlpha20 : '#D5EDB8' }}>
            <Text style={{ color: isDark ? C.primary : '#0E4D34', fontSize: 11, fontFamily: F.mono }}>
              {item.badge}
            </Text>
          </View>
        ) : null}

        {!isDanger ? (
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut, switchRole } = useAuth();
  const { features, loadFeatures } = useFeaturesStore();
  const { appointments, loadTrainerData, clients } = useTrainerStore();

  const isTrainer = user?.role === 'TRAINER';
  const isGymOwner = user?.role === 'GYM_OWNER';
  const isAthlete = !isTrainer && !isGymOwner;
  const { theme: currentTheme, isDark, setTheme } = useThemeStore();
  const activeThemePreset = THEME_PRESETS.find((t) => t.id === currentTheme) || THEME_PRESETS[0];
  const { colors } = useThemeColors();

  const [modalState, setModalState] = useState<InfoModalState>({
    visible: false,
    icon: 'info',
    iconColor: C.primary,
    iconBg: C.primaryAlpha20,
    title: '',
    description: '',
  });

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [trainerProfileModalVisible, setTrainerProfileModalVisible] = useState(false);
  const [clientCrmModalVisible, setClientCrmModalVisible] = useState(false);

  useEffect(() => {
    void loadFeatures();
    void loadTrainerData();
  }, [loadFeatures, loadTrainerData]);

  const activeCount = Object.values(features).filter(Boolean).length;
  const totalCount = FEATURES_METADATA.length;

  const trainerItems: MenuItem[] = [
    {
      id: 'trainer-crm',
      label: 'Athlete Clients CRM & PAR-Q+',
      hint: 'Roster, injury contraindications & 12-pack counter',
      icon: 'groups',
      iconColor: '#00B4D8',
      iconBg: 'rgba(0, 180, 216, 0.15)',
      badge: `${clients.length} Athletes`,
      onPress: () => setClientCrmModalVisible(true),
    },
    {
      id: 'trainer-schedule',
      label: 'Daily Session Schedule',
      hint: 'Morning & evening client time-blocks',
      icon: 'calendar-month',
      iconColor: '#89FE00',
      iconBg: 'rgba(137, 254, 0, 0.15)',
      badge: `${appointments.length} Slots`,
      onPress: () => setScheduleModalVisible(true),
    },
    {
      id: 'trainer-certs',
      label: 'Certifications & Credentials',
      hint: 'CSCS, ACE, ISSA badges & transformation showcase',
      icon: 'military-tech',
      iconColor: '#FFB800',
      iconBg: 'rgba(255, 184, 0, 0.15)',
      badge: 'CSCS • ACE',
      onPress: () => setTrainerProfileModalVisible(true),
    },
  ];

  const openInfoModal = (config: Omit<InfoModalState, 'visible'>) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setModalState({ ...config, visible: true });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, visible: false }));
  };

  const onShareApp = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    try {
      await Share.share({
        title: 'TrackMe — Health, Nutrition & Biohacking',
        message:
          "🚀 I'm optimizing my daily health, fasting & workout routines with TrackMe! Join me: https://vitalapp.io/download",
        url: 'https://vitalapp.io/download',
      });
    } catch {
      /* cancelled */
    }
  };

  const onRateSubmit = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingModalVisible(false);
      setRatingSubmitted(false);
    }, 1800);
  };

  const onSignOut = () => {
    openInfoModal({
      icon: 'logout',
      iconColor: '#FF6B6B',
      iconBg: 'rgba(255, 107, 107, 0.15)',
      title: 'Sign Out of Account?',
      badge: 'SECURE SESSION',
      description: 'Are you sure you want to sign out? Your session on this device will be safely cleared and you can sign back in anytime.',
      primaryBtnText: 'Sign Out',
      isDanger: true,
      showCancel: true,
      onConfirm: async () => {
        closeModal();
        await signOut();
        router.replace(ROUTES.login);
      },
    });
  };

  const customizationItems: MenuItem[] = [
    {
      id: 'customize-modules',
      label: 'Customize Modules',
      hint: 'Widgets, tabs & speed dial',
      icon: 'tune',
      iconColor: C.primary,
      iconBg: C.primaryAlpha20,
      badge: `${activeCount}/${totalCount} Active`,
      onPress: () => router.push(ROUTES.customizeModules),
    },
    {
      id: 'onboarding-walkthrough',
      label: 'Welcome Walkthrough',
      hint: 'Replay 3D feature onboarding tour',
      icon: 'auto-awesome',
      iconColor: '#C8F135',
      iconBg: 'rgba(200, 241, 53, 0.15)',
      badge: 'Tour',
      onPress: () => router.push(ROUTES.onboarding),
    },
  ];

  const preferenceItems: MenuItem[] = [
    {
      id: 'themes',
      label: 'Appearance & Themes',
      hint: 'Onyx Neon, Sage, Crimson & Cobalt',
      icon: 'palette',
      iconColor: colors.primary,
      iconBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      badge: `${activeThemePreset.emoji} ${activeThemePreset.name}`,
      onPress: () => {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        setThemeModalVisible(true);
      },
    },
    {
      id: 'notifications',
      label: 'Notifications',
      hint: 'Fasting, pill alerts & quiet hours',
      icon: 'notifications-active',
      iconColor: '#A78BFA',
      iconBg: 'rgba(167, 139, 250, 0.15)',
      badge: 'Active',
      onPress: () => router.push(ROUTES.notifications),
    },
    {
      id: 'prefs',
      label: 'Units & Language',
      hint: 'Metric, imperial, languages & currency',
      icon: 'language',
      iconColor: '#38BDF8',
      iconBg: 'rgba(56, 189, 248, 0.15)',
      badge: 'Metric • EN',
      onPress: () => router.push(ROUTES.unitsLanguage),
    },
    {
      id: 'storage',
      label: 'Data & Storage',
      hint: 'Local cache, database & cleanup',
      icon: 'sd-storage',
      iconColor: '#89CEFF',
      iconBg: 'rgba(137, 206, 255, 0.15)',
      badge: '2.4 MB',
      onPress: () =>
        openInfoModal({
          icon: 'sd-storage',
          iconColor: '#89CEFF',
          iconBg: 'rgba(137, 206, 255, 0.18)',
          title: 'Data & Storage Management',
          badge: 'LOCAL SQLITE ENGINE',
          description:
            '• Local Database: 1.8 MB\n• Cached Images & Logs: 0.6 MB\n• Hardware Encryption: Active (SecureStore)\n\nAll tracking data is stored offline-first on your device.',
          primaryBtnText: 'Clear Temporary Cache',
          showCancel: true,
          onConfirm: () => {
            closeModal();
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
          },
        }),
    },
    {
      id: 'share',
      label: 'Share with Friends',
      hint: 'Invite friends & share tracking progress',
      icon: 'card-giftcard',
      iconColor: '#FF6B8B',
      iconBg: 'rgba(255, 107, 139, 0.15)',
      badge: 'Invite',
      onPress: onShareApp,
    },
    {
      id: 'rate',
      label: 'Rate TrackMe',
      hint: 'Support us on App Store & Play Store',
      icon: 'star-rate',
      iconColor: '#FCC419',
      iconBg: 'rgba(252, 196, 25, 0.15)',
      badge: '5.0 ★',
      onPress: () => {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        setRatingModalVisible(true);
      },
    },
    {
      id: 'help',
      label: 'Help & Support',
      hint: 'FAQs, tutorials and feedback',
      icon: 'help-outline',
      iconColor: '#20C997',
      iconBg: 'rgba(32, 201, 151, 0.15)',
      badge: 'Help Center',
      onPress: () => router.push(ROUTES.helpSupport),
    },
  ];

  const accountItems: MenuItem[] = [
    {
      id: 'edit',
      label: 'Edit Profile',
      hint: 'Name, photo & personal goals',
      icon: 'manage-accounts',
      iconColor: '#89CEFF',
      iconBg: 'rgba(137, 206, 255, 0.15)',
      badge: 'Manage',
      onPress: () => router.push(ROUTES.editProfile),
    },
    {
      id: 'security',
      label: 'Security & Sessions',
      hint: 'Password, biometrics & devices',
      icon: 'lock-outline',
      iconColor: '#FCC419',
      iconBg: 'rgba(252, 196, 25, 0.15)',
      badge: 'Protected',
      onPress: () => router.push(ROUTES.securitySessions),
    },
    {
      id: 'legal',
      label: 'Legal & Privacy',
      hint: 'GDPR, privacy policy & terms',
      icon: 'policy',
      iconColor: '#20C997',
      iconBg: 'rgba(32, 201, 151, 0.15)',
      badge: 'Protected',
      onPress: () =>
        openInfoModal({
          icon: 'policy',
          iconColor: '#20C997',
          iconBg: 'rgba(32, 201, 151, 0.18)',
          title: 'Legal & Privacy Governance',
          badge: 'LOCAL-FIRST & GDPR',
          description:
            '• Local-first Encryption: Your biometric, nutrition, and financial logs are encrypted with hardware-backed SecureStore and local SQLite.\n\n• Zero Monetization: We never sell or share your personal health metrics.\n\n• 100% Ownership: Export or permanently purge your account data anytime.',
          primaryBtnText: 'Understood',
        }),
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* APP BAR */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: F.sansBold }}>
          Profile & Settings
        </Text>

        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-12 pt-2"
        showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER CARD */}
        <View
          className="mb-6 overflow-hidden px-5 pb-7 pt-8"
          style={{
            borderRadius: Vital.radius.xxl,
            backgroundColor: C.primaryContainer,
          }}>
          <View className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />

          <View className="items-center">
            <View
              className="mb-4 h-[84px] w-[84px] items-center justify-center rounded-full border-4"
              style={{ borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={{ color: C.onPrimaryContainer, fontSize: 28, fontFamily: F.sansExtraBold }}>
                {initials(user?.name)}
              </Text>
            </View>

            <Text
              style={{
                color: C.onPrimaryContainer,
                fontSize: 22,
                fontFamily: F.sansExtraBold,
                textAlign: 'center',
              }}>
              {user?.name ?? 'Your name'}
            </Text>

            <Text
              style={{
                color: 'rgba(0,67,97,0.85)',
                fontSize: 14,
                fontFamily: F.sans,
                textAlign: 'center',
                marginTop: 4,
              }}>
              {user?.email}
            </Text>

            <View className="mt-5 flex-row flex-wrap justify-center gap-2">
              {(isGymOwner
                ? ['FACILITY OWNER', 'IRONFORGE GYM', 'DIRECTOR']
                : isTrainer
                ? ['COACH', 'CSCS CERTIFIED', 'TRAINER']
                : ['MEMBER', 'ATHLETE']
              ).map((badge) => (
                <View
                  key={badge}
                  className="rounded-full px-3 py-1"
                  style={{
                    backgroundColor: isGymOwner
                      ? 'rgba(255, 184, 0, 0.25)'
                      : isTrainer
                      ? 'rgba(137, 254, 0, 0.25)'
                      : 'rgba(255,255,255,0.2)',
                  }}>
                  <Text
                    style={{
                      color: isGymOwner
                        ? '#002233'
                        : isTrainer
                        ? '#002233'
                        : C.onPrimaryContainer,
                      fontSize: 10,
                      fontFamily: F.monoBold,
                      letterSpacing: 0.5,
                    }}>
                    {badge}
                  </Text>
                </View>
              ))}
            </View>

            {/* 1-TAP 3-ROLE INSTANT SWITCHER */}
            <View
              style={{
                marginTop: 16,
                width: '100%',
                flexDirection: 'row',
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderRadius: 14,
                padding: 3,
                gap: 2,
              }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  void switchRole('USER');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 11,
                  backgroundColor: isAthlete ? C.primaryContainer : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: isAthlete ? C.onPrimaryContainer : 'rgba(255,255,255,0.7)',
                    fontFamily: F.sansBold,
                    fontSize: 11,
                  }}>
                  🏃 Athlete
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  void switchRole('TRAINER');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 11,
                  backgroundColor: isTrainer ? '#89FE00' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: isTrainer ? '#002233' : 'rgba(255,255,255,0.7)',
                    fontFamily: F.sansBold,
                    fontSize: 11,
                  }}>
                  🏋️ Coach
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  void switchRole('GYM_OWNER');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 11,
                  backgroundColor: isGymOwner ? '#FFB800' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: isGymOwner ? '#002233' : 'rgba(255,255,255,0.7)',
                    fontFamily: F.sansBold,
                    fontSize: 11,
                  }}>
                  🏢 Owner
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 🎨 APP COLOR THEME / VISUAL PALETTE SELECTOR */}
        <Text
          style={{
            color: '#38BDF8',
            fontSize: 11,
            fontFamily: F.monoBold,
            letterSpacing: 1.2,
            marginBottom: 8,
            marginTop: 4,
            marginLeft: 2,
          }}>
          🎨 COLOR THEME & VISUAL PALETTE
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {/* THEME 1: Athletic Obsidian (Dark Neon) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setTheme('dark');
            }}
            style={{
              flex: 1,
              backgroundColor: '#0A121A',
              borderRadius: 18,
              padding: 14,
              borderWidth: 2,
              borderColor: isDark ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)',
              shadowColor: isDark ? '#00B4FF' : 'transparent',
              shadowOpacity: isDark ? 0.35 : 0,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: isDark ? 6 : 0,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#00111A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#38BDF8' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#89FE00' }} />
              </View>
              {isDark ? (
                <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#38BDF8', fontSize: 9, fontFamily: F.monoBold }}>ACTIVE</Text>
                </View>
              ) : null}
            </View>

            <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: F.sansBold }}>
              Athletic Obsidian
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: F.sans, marginTop: 2 }}>
              Cyber Dark & Neon Lime
            </Text>
          </TouchableOpacity>

          {/* THEME 2: Forest & Fresh Lime (Sage Cream) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setTheme('light');
            }}
            style={{
              flex: 1,
              backgroundColor: '#F0F5EC',
              borderRadius: 18,
              padding: 14,
              borderWidth: 2,
              borderColor: !isDark ? '#0E4D34' : 'rgba(255, 255, 255, 0.08)',
              shadowColor: !isDark ? '#0E4D34' : 'transparent',
              shadowOpacity: !isDark ? 0.35 : 0,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: !isDark ? 6 : 0,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#F0F5EC', borderWidth: 1, borderColor: '#0E4D34' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#0E4D34' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#B4E876' }} />
              </View>
              {!isDark ? (
                <View style={{ backgroundColor: '#0E4D34', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#B4E876', fontSize: 9, fontFamily: F.monoBold }}>ACTIVE</Text>
                </View>
              ) : null}
            </View>

            <Text style={{ color: '#0E4D34', fontSize: 13, fontFamily: F.sansBold }}>
              Forest & Lime
            </Text>
            <Text style={{ color: '#4A6956', fontSize: 11, fontFamily: F.sans, marginTop: 2 }}>
              Pale Sage & Fresh Mint
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🏋️ TRAINER BUSINESS & COACHING STUDIO */}
        <Text
          style={{
            color: colors.accentLime,
            fontSize: 11,
            fontFamily: F.monoBold,
            letterSpacing: 1.2,
            marginBottom: 8,
            marginLeft: 2,
          }}>
          {isTrainer ? '🏋️ TRAINER BUSINESS & COACHING STUDIO' : '🏋️ GYM TRAINER DIRECTORY & CREDENTIALS'}
        </Text>
        <View
          className="mb-6 overflow-hidden"
          style={{
            borderRadius: Vital.radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: isTrainer ? (isDark ? 'rgba(137, 254, 0, 0.3)' : 'rgba(14, 77, 52, 0.25)') : colors.border,
          }}>
          {trainerItems.map((item, idx) => (
            <MenuRow
              key={item.id}
              item={item}
              isLast={idx === trainerItems.length - 1}
            />
          ))}
        </View>

        {/* CUSTOMIZATION & WORKSPACE */}
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 11,
            fontFamily: F.mono,
            letterSpacing: 1.2,
            marginBottom: 8,
            marginLeft: 2,
          }}>
          WORKSPACE & CUSTOMIZATION
        </Text>
        <View
          className="mb-6 overflow-hidden"
          style={{
            borderRadius: Vital.radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          {customizationItems.map((item, idx) => (
            <MenuRow
              key={item.id}
              item={item}
              isLast={idx === customizationItems.length - 1}
            />
          ))}
        </View>

        {/* PREFERENCES */}
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 11,
            fontFamily: F.mono,
            letterSpacing: 1.2,
            marginBottom: 8,
            marginLeft: 2,
          }}>
          PREFERENCES & SUPPORT
        </Text>
        <View
          className="mb-6 overflow-hidden"
          style={{
            borderRadius: Vital.radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          {preferenceItems.map((item, idx) => (
            <MenuRow
              key={item.id}
              item={item}
              isLast={idx === preferenceItems.length - 1}
            />
          ))}
        </View>

        {/* ACCOUNT */}
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 11,
            fontFamily: F.mono,
            letterSpacing: 1.2,
            marginBottom: 8,
            marginLeft: 2,
          }}>
          ACCOUNT & SECURITY
        </Text>
        <View
          className="mb-6 overflow-hidden"
          style={{
            borderRadius: Vital.radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          {accountItems.map((item, idx) => (
            <MenuRow
              key={item.id}
              item={item}
              isLast={idx === accountItems.length - 1}
            />
          ))}
        </View>

        {/* SIGN OUT */}
        <View
          className="overflow-hidden"
          style={{
            borderRadius: Vital.radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <MenuRow
            item={{
              id: 'logout',
              label: 'Sign Out',
              hint: 'Clear this device session',
              icon: 'logout',
              danger: true,
              onPress: onSignOut,
            }}
            isLast={true}
          />
        </View>

        {/* APP VERSION & ENCRYPTION FOOTER */}
        <View className="items-center mt-8 pb-6">
          <Text style={{ color: C.onSurfaceVariant, fontSize: 12, fontFamily: F.mono, letterSpacing: 0.6 }}>
            TrackMe v1.0.0 (Build 2026.08)
          </Text>

          <View className="flex-row items-center gap-3 mt-2.5">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openInfoModal({
                  icon: 'privacy-tip',
                  iconColor: '#20C997',
                  iconBg: 'rgba(32, 201, 151, 0.18)',
                  title: 'Privacy Policy',
                  badge: 'GDPR COMPLIANT',
                  description:
                    'TrackMe is architected with a strict privacy-first foundation. All tracking metrics, routines, and telemetry reside locally on your device in hardware-encrypted SQLite storage.',
                  primaryBtnText: 'Understood',
                })
              }>
              <Text style={{ color: '#89CEFF', fontSize: 12, fontFamily: F.sansMedium }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <Text style={{ color: C.outline, fontSize: 10 }}>•</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openInfoModal({
                  icon: 'gavel',
                  iconColor: '#89CEFF',
                  iconBg: 'rgba(137, 206, 255, 0.18)',
                  title: 'Terms of Service',
                  badge: 'END USER LICENSE',
                  description:
                    'By using TrackMe, you agree to utilize our productivity, habit, and health telemetry calculators for personal self-improvement and wellness tracking.',
                  primaryBtnText: 'Understood',
                })
              }>
              <Text style={{ color: '#89CEFF', fontSize: 12, fontFamily: F.sansMedium }}>
                Terms of Service
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: C.outline, fontSize: 11, fontFamily: F.sans, marginTop: 4 }}>
            Hardware-backed SQLite • SecureStore
          </Text>
        </View>
      </ScrollView>

      {/* REUSABLE GORGEOUS DARK INFO & CONFIRMATION MODAL */}
      <Modal
        visible={modalState.visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={modalStyles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

          <View style={modalStyles.card}>
            {/* GLOWING ICON HEADER */}
            <View style={modalStyles.iconContainer}>
              <View
                style={[
                  modalStyles.iconGlow,
                  { backgroundColor: modalState.iconColor + '33' },
                ]}
              />
              <View
                style={[
                  modalStyles.iconCircle,
                  {
                    backgroundColor: modalState.iconBg,
                    borderColor: modalState.iconColor + '66',
                  },
                ]}>
                <MaterialIcons
                  name={modalState.icon}
                  size={28}
                  color={modalState.iconColor}
                />
              </View>
            </View>

            {/* TITLE & BADGE */}
            {modalState.badge ? (
              <View
                style={[
                  modalStyles.badgePill,
                  {
                    backgroundColor: modalState.isDanger
                      ? 'rgba(255, 107, 107, 0.15)'
                      : 'rgba(137, 206, 255, 0.15)',
                  },
                ]}>
                <Text
                  style={[
                    modalStyles.badgeText,
                    { color: modalState.isDanger ? '#FF8787' : '#89CEFF' },
                  ]}>
                  {modalState.badge}
                </Text>
              </View>
            ) : null}

            <Text style={modalStyles.title}>{modalState.title}</Text>
            <Text style={modalStyles.description}>{modalState.description}</Text>

            {/* ACTION BUTTONS */}
            <View style={modalStyles.actions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (modalState.onConfirm) {
                    modalState.onConfirm();
                  } else {
                    closeModal();
                  }
                }}
                style={[
                  modalStyles.primaryBtn,
                  {
                    backgroundColor: modalState.isDanger
                      ? '#FF5252'
                      : '#89CEFF',
                  },
                ]}>
                <Text
                  style={[
                    modalStyles.primaryBtnText,
                    {
                      color: modalState.isDanger ? '#FFFFFF' : '#002538',
                    },
                  ]}>
                  {modalState.primaryBtnText ?? 'Got It'}
                </Text>
              </TouchableOpacity>

              {modalState.showCancel ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeModal}
                  style={modalStyles.secondaryBtn}>
                  <Text style={modalStyles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* 5-STAR RATING & APPRECIATION MODAL */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}>
        <View style={modalStyles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRatingModalVisible(false)} />

          <View style={modalStyles.card}>
            {/* GLOWING ICON */}
            <View style={modalStyles.iconContainer}>
              <View style={[modalStyles.iconGlow, { backgroundColor: '#FCC41933' }]} />
              <View style={[modalStyles.iconCircle, { backgroundColor: 'rgba(252, 196, 25, 0.15)', borderColor: '#FCC41966' }]}>
                <MaterialIcons name={ratingSubmitted ? 'thumb-up' : 'star'} size={28} color="#FCC419" />
              </View>
            </View>

            <View style={[modalStyles.badgePill, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
              <Text style={[modalStyles.badgeText, { color: '#FCC419' }]}>
                {ratingSubmitted ? 'THANK YOU' : 'RATE TRACKME'}
              </Text>
            </View>

            <Text style={modalStyles.title}>
              {ratingSubmitted ? 'Feedback Received!' : 'How is your TrackMe Experience?'}
            </Text>

            <Text style={modalStyles.description}>
              {ratingSubmitted
                ? 'Your feedback helps us continuously elevate your metabolic health and productivity routines.'
                : 'Tap a star below to rate TrackMe. 5-star ratings directly support our indie development team!'}
            </Text>

            {!ratingSubmitted ? (
              <>
                {/* 5-STAR SELECTOR ROW */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 14 }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= selectedRating;
                    return (
                      <TouchableOpacity
                        key={star}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          }
                          setSelectedRating(star);
                        }}
                        style={{ padding: 4 }}>
                        <MaterialIcons
                          name={isFilled ? 'star' : 'star-border'}
                          size={32}
                          color={isFilled ? '#FCC419' : C.outline}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ACTIONS */}
                <View style={modalStyles.actions}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onRateSubmit}
                    style={[modalStyles.primaryBtn, { backgroundColor: '#FCC419' }]}>
                    <Text style={[modalStyles.primaryBtnText, { color: '#000000' }]}>
                      {selectedRating === 5 ? 'Submit 5-Star Review ★' : 'Send App Feedback'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setRatingModalVisible(false)}
                    style={modalStyles.secondaryBtn}>
                    <Text style={modalStyles.secondaryBtnText}>Maybe Later</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ marginTop: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setRatingModalVisible(false)}
                  style={[modalStyles.primaryBtn, { backgroundColor: '#89CEFF' }]}>
                  <Text style={[modalStyles.primaryBtnText, { color: '#002538' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 🏋️ TRAINER DAILY SCHEDULE MODAL */}
      <TrainerScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
      />

      {/* 🎖️ TRAINER CERTIFICATIONS & TRANSFORMATION SHOWCASE MODAL */}
      <TrainerProfileModal
        visible={trainerProfileModalVisible}
        onClose={() => setTrainerProfileModalVisible(false)}
      />

      {/* 👥 ATHLETE CLIENT CRM & PAR-Q+ INJURY MODAL */}
      <ClientCrmModal
        visible={clientCrmModalVisible}
        onClose={() => setClientCrmModalVisible(false)}
      />

      {/* 🎨 THEME & APPEARANCE SELECTOR MODAL */}
      <ThemeSelectorModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontFamily: F.sansBold,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    color: '#9E9E9E',
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#E0E3E6',
    fontSize: 14,
    fontFamily: F.sansSemiBold,
  },
});

