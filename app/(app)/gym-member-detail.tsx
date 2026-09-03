/**
 * 👤 Gym Member Profile / View Details Page (GymOS)
 * High-performance, low-cognitive-load executive dossier for athlete lifecycle management:
 * 1. Hero identity card with 1-tap direct call, WhatsApp chat, and front-desk check-in punch.
 * 2. Tab 1 (Membership & Access): Visual expiry progress bar, smart changing room locker radar, coach assignment, and freeze hold.
 * 3. Tab 2 (Billing & Ledger): Financial breakdown, 1-tap due collection sheet, and complete payment history transaction timeline.
 * 4. Tab 3 (Vitals & Bio): Physical stats, 1-tap emergency contact phone dialer, coach notes, and member archiving.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  GymMemberFreezeModal,
  GymMemberIdPassModal,
  GymMemberRenewUpgradeModal,
  GymLockerPickerModal,
} from '@/components/gym-owner';
import { AppScreen } from '@/components/ui/app-screen';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymPaymentRecord, PaymentMethod } from '@/types/gym';

const F = Vital.fonts;

type ProfileTab = 'MEMBERSHIP' | 'FINANCES' | 'BIO';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Card', 'Bank_Transfer'];

export default function GymMemberDetailPage() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { colors, isDark } = useThemeColors();

  const {
    members,
    todayCheckInIds,
    toggleMemberCheckIn,
    collectMemberFee,
    deleteMember,
    generateWhatsAppDuesMessage,
    gymProfile,
    lockers,
    assignLocker,
  } = useGymOwnerStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('MEMBERSHIP');

  // Modal States
  const [idPassVisible, setIdPassVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [lockerPickerVisible, setLockerPickerVisible] = useState(false);

  // Collect Dues Sheet State
  const [collectDuesVisible, setCollectDuesVisible] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('bKash');
  const [collectNotes, setCollectNotes] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // Find Member
  const member = useMemo(() => {
    return members.find((m) => m.id === memberId) || null;
  }, [members, memberId]);

  if (!member) {
    return (
      <AppScreen>
        <View style={styles.notFoundContainer}>
          <MaterialIcons name="person-off" size={48} color={colors.textSecondary} />
          <Text style={[styles.notFoundTitle, { color: colors.textPrimary }]}>
            Member Not Found
          </Text>
          <Text style={[styles.notFoundSubtitle, { color: colors.textSecondary }]}>
            This athlete record may have been removed or does not exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.notFoundBackBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.notFoundBackBtnText}>Back to Members</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  const isCheckedIn = todayCheckInIds.includes(member.id);
  const isFrozen = member.status === 'FROZEN';
  const hasDue = (member.dueAmountBdt || 0) > 0;

  // Days remaining & progress calculation
  const validityStats = useMemo(() => {
    if (!member.endDate) {
      return { remainingDays: null, progressPercent: 100, isExpired: false };
    }
    const now = new Date();
    const end = new Date(member.endDate);
    const start = member.startDate ? new Date(member.startDate) : new Date(member.enrollmentDate || now);
    
    const totalDurationMs = Math.max(1, end.getTime() - start.getTime());
    const elapsedMs = Math.max(0, now.getTime() - start.getTime());
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
    const remainingDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      remainingDays,
      progressPercent,
      isExpired: remainingDays < 0,
    };
  }, [member.startDate, member.endDate, member.enrollmentDate]);

  // Handle Quick Call
  const handleCallPhone = (rawPhone: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Error', 'Could not initiate phone call on this device.');
    });
  };

  // Handle Direct WhatsApp
  const handleWhatsApp = (customMsg?: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const defaultMsg = `Hello ${member.fullName}, greetings from ${gymProfile.gymName}! How is your workout training going? 💪`;
    const msg = customMsg || defaultMsg;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  // Handle Due Reminder
  const handleSendDueReminder = () => {
    const dueMsg = generateWhatsAppDuesMessage(member);
    handleWhatsApp(dueMsg);
  };

  // Handle Share Receipt for a specific past payment
  const handleSharePaymentReceipt = (payment: GymPaymentRecord) => {
    const receipt =
      `*Official Payment Receipt* 🧾\n\n` +
      `Athlete: *${member.fullName}*\n` +
      `Amount Paid: *৳${payment.amountBdt.toLocaleString()}*\n` +
      `Payment Method: *${payment.method}*\n` +
      `Date: *${payment.date}*\n` +
      `Invoice #: *${payment.invoiceNumber}*\n` +
      `Facility: *${gymProfile.gymName}*\n\n` +
      `Current Balance Due: *৳${(member.dueAmountBdt || 0).toLocaleString()}*\n` +
      `Thank you for training with us! 🏋️`;
    handleWhatsApp(receipt);
  };

  // Handle Check In
  const handleToggleCheckIn = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void toggleMemberCheckIn(member.id);
  };

  // Handle Collect Due
  const handleOpenCollectDues = () => {
    setCollectAmount(String(member.dueAmountBdt || ''));
    setCollectMethod('bKash');
    setCollectNotes('Due settlement');
    setCollectDuesVisible(true);
  };

  const handleConfirmCollectDues = async () => {
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to collect.');
      return;
    }

    setIsCollecting(true);
    try {
      await collectMemberFee(member.id, amt, collectMethod, collectNotes);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCollectDuesVisible(false);
      Alert.alert(
        'Payment Recorded! 💵',
        `৳${amt.toLocaleString()} collected from ${member.fullName} via ${collectMethod}. Would you like to send a payment confirmation receipt on WhatsApp?`,
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'Send Receipt',
            onPress: () => {
              const receipt =
                `*Payment Confirmation Receipt* 🧾\n\n` +
                `Hello *${member.fullName}*,\n` +
                `We have received your payment of *৳${amt.toLocaleString()}* (${collectMethod}) at *${gymProfile.gymName}*.\n\n` +
                `💰 *Remaining Due:* ৳${Math.max(0, (member.dueAmountBdt || 0) - amt).toLocaleString()}\n` +
                `Thank you for training with us! 🏋️`;
              handleWhatsApp(receipt);
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not record fee collection.');
    } finally {
      setIsCollecting(false);
    }
  };

  // Handle Delete Member (Error Prevention & Safety Net)
  const handleDeleteMember = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const warnings: string[] = [];
    if ((member.dueAmountBdt || 0) > 0) {
      warnings.push(`• Pending Dues: ৳${member.dueAmountBdt.toLocaleString()}`);
    }
    if (member.lockerNumber) {
      warnings.push(`• Assigned Locker: #${member.lockerNumber}`);
    }

    const warningNotice =
      warnings.length > 0
        ? `\n\n⚠️ Caution:\n${warnings.join('\n')}\n\nAll historical logs, attendance, and records for ${member.fullName} will be permanently erased.`
        : `\n\nAre you sure you want to remove ${member.fullName} from your gym roster? This action cannot be undone.`;

    Alert.alert(
      'Delete Member Record?',
      `Athlete: ${member.fullName}${warningNotice}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteMember(member.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        
        {/* TOP APP BAR */}
        <View style={[styles.topBar, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9', borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topBarTitleWrap}>
            <Text style={[styles.topBarTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              Athlete Dossier
            </Text>
            <Text style={[styles.topBarSubtitle, { color: colors.textSecondary }]}>
              #{member.id.substring(0, 8).toUpperCase()} • {member.planTitle}
            </Text>
          </View>

          {/* QUICK DIGITAL PASS TRIGGER */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIdPassVisible(true)}
            style={[styles.headerIdPassBtn, { backgroundColor: isDark ? 'rgba(137, 254, 0, 0.14)' : '#DCFCE7', borderColor: isDark ? '#89FE00' : '#86EFAC' }]}>
            <MaterialIcons name="badge" size={15} color={isDark ? '#89FE00' : '#059669'} />
            <Text style={[styles.headerIdPassText, { color: isDark ? '#89FE00' : '#059669' }]}>
              ID Pass
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* HERO ATHLETE CARD */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heroTopRow}>
              {/* AVATAR */}
              <View
                style={[
                  styles.heroAvatarWrap,
                  {
                    borderColor: isCheckedIn
                      ? '#89FE00'
                      : isFrozen
                      ? '#4DABF7'
                      : hasDue
                      ? '#FA5252'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.15)'
                      : '#CBD5E1',
                  },
                ]}>
                {member.avatarUrl ? (
                  <Image source={{ uri: member.avatarUrl }} style={styles.heroAvatarImg} />
                ) : (
                  <View style={[styles.heroAvatarFallback, { backgroundColor: isCheckedIn ? 'rgba(137, 254, 0, 0.18)' : 'rgba(0, 180, 216, 0.18)' }]}>
                    <Text style={[styles.heroAvatarText, { color: isCheckedIn ? '#89FE00' : colors.primary }]}>
                      {member.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                {/* LIVE CHECKIN STATUS DOT */}
                <View
                  style={[
                    styles.heroAvatarStatusDot,
                    {
                      backgroundColor: isFrozen
                        ? '#4DABF7'
                        : isCheckedIn
                        ? '#89FE00'
                        : hasDue
                        ? '#FA5252'
                        : '#40C057',
                    },
                  ]}
                />
              </View>

              {/* NAME, PHONE & STATUS BADGES */}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.heroName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {member.fullName}
                </Text>

                <Text style={[styles.heroPhone, { color: colors.textSecondary }]}>
                  {member.phone} {member.email ? `• ${member.email}` : ''}
                </Text>

                <View style={styles.heroStatusBadgesRow}>
                  <View
                    style={[
                      styles.heroStatusPill,
                      {
                        backgroundColor: isFrozen
                          ? 'rgba(77, 171, 247, 0.16)'
                          : isCheckedIn
                          ? 'rgba(137, 254, 0, 0.18)'
                          : member.status === 'EXPIRED'
                          ? 'rgba(250, 82, 82, 0.16)'
                          : 'rgba(64, 192, 87, 0.16)',
                        borderColor: isFrozen
                          ? '#4DABF7'
                          : isCheckedIn
                          ? '#89FE00'
                          : member.status === 'EXPIRED'
                          ? '#FA5252'
                          : '#40C057',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.heroStatusText,
                        {
                          color: isFrozen
                            ? '#4DABF7'
                            : isCheckedIn
                            ? (isDark ? '#89FE00' : '#059669')
                            : member.status === 'EXPIRED'
                            ? '#FA5252'
                            : '#40C057',
                        },
                      ]}>
                      {isFrozen ? 'FROZEN' : isCheckedIn ? 'ON FLOOR NOW' : member.status}
                    </Text>
                  </View>

                  {member.lockerNumber ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setLockerPickerVisible(true)}
                      style={[styles.heroLockerPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9', borderColor: colors.border }]}>
                      <MaterialIcons name="lock" size={11} color={colors.textSecondary} />
                      <Text style={[styles.heroLockerText, { color: colors.textPrimary }]}>
                        Locker #{member.lockerNumber}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            {/* DIRECT CONTACT ACTION BUTTONS */}
            <View style={styles.heroContactRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCallPhone(member.phone)}
                style={[styles.heroContactPill, { backgroundColor: isDark ? 'rgba(0, 180, 216, 0.14)' : '#E0F2FE', borderColor: isDark ? 'rgba(0, 180, 216, 0.35)' : '#BAE6FD' }]}>
                <MaterialIcons name="call" size={14} color={isDark ? '#00B4D8' : '#0284C7'} />
                <Text style={[styles.heroContactPillText, { color: isDark ? '#00B4D8' : '#0284C7' }]}>
                  Call Phone
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleWhatsApp()}
                style={[styles.heroContactPill, { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.14)' : '#DCFCE7', borderColor: isDark ? 'rgba(37, 211, 102, 0.35)' : '#86EFAC' }]}>
                <MaterialIcons name="chat" size={14} color="#25D366" />
                <Text style={[styles.heroContactPillText, { color: isDark ? '#25D366' : '#15803D' }]}>
                  WhatsApp Chat
                </Text>
              </TouchableOpacity>
            </View>

            {/* QUICK 1-TAP CHECK-IN BAR */}
            <View style={[styles.heroFooterRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons
                  name="history"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={[styles.heroAttendanceSummary, { color: colors.textSecondary }]}>
                  {member.totalCheckInsCount || 0} Workouts {member.lastCheckInDate ? `• Last: ${member.lastCheckInDate}` : ''}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isFrozen}
                onPress={handleToggleCheckIn}
                style={[
                  styles.heroCheckInBtn,
                  isCheckedIn
                    ? { backgroundColor: '#89FE00' }
                    : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9', borderWidth: 1, borderColor: colors.border },
                ]}>
                <MaterialIcons
                  name={isCheckedIn ? 'how-to-reg' : 'login'}
                  size={14}
                  color={isCheckedIn ? '#000000' : colors.textPrimary}
                />
                <Text style={[styles.heroCheckInBtnText, { color: isCheckedIn ? '#000000' : colors.textPrimary }]}>
                  {isCheckedIn ? 'Check Out' : 'Check In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3 STREAMLINED TABS STRIP */}
          <View style={styles.tabStrip}>
            {[
              { key: 'MEMBERSHIP' as const, label: 'Membership & Access', icon: 'card-membership' },
              { key: 'FINANCES' as const, label: 'Billing & Ledger', icon: 'payments' },
              { key: 'BIO' as const, label: 'Vitals & Safety', icon: 'health-and-safety' },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setActiveTab(tab.key);
                  }}
                  style={[
                    styles.tabButton,
                    isSelected
                      ? {
                          backgroundColor: isDark ? '#161D24' : '#FFFFFF',
                          borderColor: isDark ? '#89FE00' : '#059669',
                          borderBottomWidth: 2,
                        }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: 'transparent',
                        },
                  ]}>
                  <MaterialIcons
                    name={tab.icon as any}
                    size={14}
                    color={isSelected ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color: isSelected ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary,
                        fontFamily: isSelected ? F.sansBold : F.sans,
                      },
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TAB 1: MEMBERSHIP & ACCESS */}
          {activeTab === 'MEMBERSHIP' && (
            <View style={styles.tabSectionWrap}>
              
              {/* ACTIVE PLAN & VISUAL EXPIRY METER */}
              <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[styles.cardHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
                    ACTIVE SUBSCRIPTION
                  </Text>
                  <View style={[styles.miniPlanTag, { backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7' }]}>
                    <Text style={[styles.miniPlanTagText, { color: isDark ? '#89FE00' : '#059669' }]}>
                      {member.planTitle}
                    </Text>
                  </View>
                </View>

                {/* EXPIRY PROGRESS BAR */}
                <View style={styles.validityProgressWrap}>
                  <View style={styles.validityProgressHeader}>
                    <Text style={[styles.validityProgressLabel, { color: colors.textSecondary }]}>
                      {validityStats.remainingDays !== null
                        ? validityStats.remainingDays >= 0
                          ? `⏱ ${validityStats.remainingDays} Days Remaining`
                          : `⚠️ Expired ${Math.abs(validityStats.remainingDays)} Days Ago`
                        : 'Unlimited Ongoing'}
                    </Text>
                    <Text style={[styles.validityProgressPercent, { color: validityStats.isExpired ? '#FA5252' : isDark ? '#89FE00' : '#059669' }]}>
                      {validityStats.progressPercent}% Elapsed
                    </Text>
                  </View>

                  <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${validityStats.progressPercent}%`,
                          backgroundColor: validityStats.isExpired
                            ? '#FA5252'
                            : validityStats.progressPercent > 80
                            ? '#FFB800'
                            : isDark
                            ? '#89FE00'
                            : '#059669',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.progressDatesRow}>
                    <Text style={[styles.progressDateText, { color: colors.textMuted }]}>
                      Start: {member.startDate}
                    </Text>
                    <Text style={[styles.progressDateText, { color: validityStats.isExpired ? '#FA5252' : colors.textMuted }]}>
                      End: {member.endDate || 'Ongoing'}
                    </Text>
                  </View>
                </View>

                {/* DETAILS ROWS */}
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Enrollment Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{member.enrollmentDate || member.startDate}</Text>
                </View>
              </View>

              {/* RENEW / UPGRADE CTA */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRenewModalVisible(true)}
                style={[styles.primaryActionBlockBtn, { backgroundColor: isDark ? '#89FE00' : '#059669' }]}>
                <MaterialIcons name="autorenew" size={18} color={isDark ? '#000000' : '#FFFFFF'} />
                <Text style={[styles.primaryActionBlockBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                  Renew or Upgrade Membership Plan
                </Text>
              </TouchableOpacity>

              {/* FACILITY ACCESS: LOCKER & COACH */}
              <View style={styles.accessGrid}>
                {/* SMART LOCKER RADAR ALLOCATION */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setLockerPickerVisible(true)}
                  style={[styles.accessTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.accessTileLabel, { color: colors.textSecondary }]}>LOCKER ALLOCATION</Text>
                    <MaterialIcons name="edit" size={13} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.accessTileVal, { color: member.lockerNumber ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted }]}>
                    {member.lockerNumber ? `#${member.lockerNumber}` : 'Unassigned'}
                  </Text>
                  <Text style={[styles.accessTileSub, { color: colors.textSecondary }]}>
                    Tap to open changing room radar
                  </Text>
                </TouchableOpacity>

                {/* ASSIGNED COACH */}
                <View style={[styles.accessTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.accessTileLabel, { color: colors.textSecondary }]}>ASSIGNED COACH</Text>
                  <Text style={[styles.accessTileVal, { color: member.assignedTrainerName ? (isDark ? '#FFB800' : '#D97706') : colors.textMuted }]}>
                    {member.assignedTrainerName || 'General Floor'}
                  </Text>
                  <Text style={[styles.accessTileSub, { color: colors.textSecondary }]}>
                    Personal Training & Guidance
                  </Text>
                </View>
              </View>

              {/* FREEZE / PAUSE STATUS */}
              <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={[styles.cardHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
                    FREEZE & HOLD STATUS
                  </Text>
                  <View style={[styles.freezeStatusPill, { backgroundColor: isFrozen ? 'rgba(77, 171, 247, 0.15)' : 'rgba(64, 192, 87, 0.12)' }]}>
                    <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: isFrozen ? '#4DABF7' : '#40C057' }}>
                      {isFrozen ? 'FROZEN HOLD' : 'RUNNING NORMALLY'}
                    </Text>
                  </View>
                </View>

                {isFrozen && member.currentFreeze ? (
                  <View style={{ gap: 3, marginTop: 4 }}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Reason: {member.currentFreeze.reason} ({member.currentFreeze.reasonNotes || 'No notes'})
                    </Text>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Frozen Date: {member.currentFreeze.freezeStartDate}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Athlete membership is currently active without any holds or freeze pauses.
                  </Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFreezeModalVisible(true)}
                  style={[styles.outlineSecondaryBtn, { borderColor: colors.border, marginTop: 10 }]}>
                  <MaterialIcons name="ac-unit" size={15} color="#4DABF7" />
                  <Text style={[styles.outlineSecondaryBtnText, { color: colors.textPrimary }]}>
                    {isFrozen ? 'Resume / Unfreeze Membership' : 'Put Membership on Hold / Freeze'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          )}

          {/* TAB 2: BILLING & LEDGER */}
          {activeTab === 'FINANCES' && (
            <View style={styles.tabSectionWrap}>
              
              {/* FINANCIAL BREAKDOWN */}
              <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>ACCOUNT STATEMENT & CHARGES</Text>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>1-Time Admission Fee:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {member.admissionFeeBdt ? `৳${member.admissionFeeBdt.toLocaleString()}` : '৳0 (Waived)'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Package Fee:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    ৳{member.totalFeeBdt.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Amount Paid:</Text>
                  <Text style={[styles.detailValue, { color: '#40C057' }]}>
                    ৳{member.paidAmountBdt.toLocaleString()}
                  </Text>
                </View>

                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textPrimary, fontFamily: F.sansBold }]}>
                    Outstanding Due Balance:
                  </Text>
                  <Text style={[styles.detailValue, { color: hasDue ? '#FA5252' : '#40C057', fontSize: 16, fontFamily: F.monoBold }]}>
                    {hasDue ? `৳${member.dueAmountBdt.toLocaleString()}` : '৳0 (Fully Paid)'}
                  </Text>
                </View>
              </View>

              {/* FINANCIAL ACTIONS */}
              {hasDue ? (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOpenCollectDues}
                    style={[styles.primaryActionBlockBtn, { backgroundColor: '#FA5252' }]}>
                    <MaterialIcons name="payments" size={18} color="#FFFFFF" />
                    <Text style={[styles.primaryActionBlockBtnText, { color: '#FFFFFF' }]}>
                      Collect Pending Due (৳{member.dueAmountBdt.toLocaleString()})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSendDueReminder}
                    style={[styles.outlineSecondaryBtn, { borderColor: '#40C057' }]}>
                    <MaterialIcons name="chat" size={16} color="#40C057" />
                    <Text style={[styles.outlineSecondaryBtnText, { color: '#40C057' }]}>
                      Send Due Reminder via WhatsApp
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.allPaidBanner, { backgroundColor: isDark ? 'rgba(64, 192, 87, 0.12)' : '#DCFCE7', borderColor: isDark ? 'rgba(64, 192, 87, 0.3)' : '#86EFAC' }]}>
                  <MaterialIcons name="verified" size={20} color="#40C057" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.allPaidTitle, { color: isDark ? '#40C057' : '#15803D' }]}>
                      Account 100% Settled
                    </Text>
                    <Text style={[styles.allPaidSub, { color: isDark ? '#40C057' : '#15803D' }]}>
                      No pending dues or fee arrears found for this athlete.
                    </Text>
                  </View>
                </View>
              )}

              {/* PAYMENT HISTORY & TRANSACTION LEDGER */}
              <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.cardHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
                    PAYMENT HISTORY & RECEIPTS
                  </Text>
                  <Text style={[styles.validityProgressPercent, { color: colors.textSecondary }]}>
                    {member.paymentHistory?.length || 0} Records
                  </Text>
                </View>

                {member.paymentHistory && member.paymentHistory.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {member.paymentHistory.map((p, idx) => (
                      <View
                        key={p.id || idx}
                        style={[styles.ledgerRowCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.ledgerAmountText, { color: '#40C057' }]}>
                              ৳{p.amountBdt.toLocaleString()}
                            </Text>
                            <View style={[styles.methodBadge, { backgroundColor: isDark ? 'rgba(0, 180, 216, 0.15)' : '#E0F2FE' }]}>
                              <Text style={[styles.methodBadgeText, { color: isDark ? '#00B4D8' : '#0284C7' }]}>
                                {p.method}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.ledgerMetaText, { color: colors.textSecondary }]}>
                            {p.date} • #{p.invoiceNumber} {p.notes ? `• ${p.notes}` : ''}
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleSharePaymentReceipt(p)}
                          style={[styles.shareReceiptBtn, { borderColor: colors.border }]}>
                          <MaterialIcons name="share" size={13} color={colors.textPrimary} />
                          <Text style={[styles.shareReceiptText, { color: colors.textPrimary }]}>Receipt</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyLedgerWrap}>
                    <MaterialIcons name="receipt-long" size={24} color={colors.textMuted} />
                    <Text style={[styles.emptyLedgerText, { color: colors.textSecondary }]}>
                      Initial enrollment fee recorded on {member.enrollmentDate || member.startDate}.
                    </Text>
                  </View>
                )}
              </View>

            </View>
          )}

          {/* TAB 3: VITALS, SAFETY & BIO */}
          {activeTab === 'BIO' && (
            <View style={styles.tabSectionWrap}>
              
              {/* PHYSICAL & HEALTH PROFILE */}
              <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>PHYSICAL & HEALTH PROFILE</Text>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Recorded Weight:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {member.weightKg ? `${member.weightKg} kg` : 'Not recorded'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gender:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {member.gender || 'MALE'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date of Birth:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {member.dateOfBirth || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Check-ins:</Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#89FE00' : '#059669' }]}>
                    {member.totalCheckInsCount || 0} workouts logged
                  </Text>
                </View>

                {member.referralCode ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Referral Code:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {member.referralCode}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* EMERGENCY CONTACT WITH 1-TAP SAFETY CALL */}
              <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>EMERGENCY CONTACT & SAFETY</Text>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contact Name:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {member.emergencyContact?.name
                      ? `${member.emergencyContact.name}${member.emergencyContact.relation ? ` (${member.emergencyContact.relation})` : ''}`
                      : 'None provided'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Emergency Phone:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {member.emergencyContact?.phone || 'None provided'}
                  </Text>
                </View>

                {member.emergencyContact?.phone ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCallPhone(member.emergencyContact!.phone)}
                    style={styles.emergencyCallBtn}>
                    <MaterialIcons name="phone-in-talk" size={16} color="#FFFFFF" />
                    <Text style={styles.emergencyCallBtnText}>
                      Call Emergency Contact ({member.emergencyContact.phone})
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* COACH REMARKS & NOTES */}
              {member.notes ? (
                <View style={[styles.infoBlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <MaterialIcons name="notes" size={15} color={colors.textSecondary} />
                    <Text style={[styles.cardHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
                      COACH REMARKS & SPECIAL NOTES
                    </Text>
                  </View>
                  <Text style={[styles.notesBodyText, { color: colors.textSecondary }]}>
                    {member.notes}
                  </Text>
                </View>
              ) : null}

              {/* DANGER ZONE: DELETE MEMBER */}
              <View style={styles.dangerZoneWrap}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDeleteMember}
                  style={[styles.deleteMemberBtn, { borderColor: 'rgba(250, 82, 82, 0.3)' }]}>
                  <MaterialIcons name="delete-outline" size={16} color="#FA5252" />
                  <Text style={styles.deleteMemberBtnText}>Delete Member Record</Text>
                </TouchableOpacity>
              </View>

            </View>
          )}

        </ScrollView>

        {/* 🪪 DIGITAL ID PASS MODAL */}
        <GymMemberIdPassModal
          visible={idPassVisible}
          member={member}
          onClose={() => setIdPassVisible(false)}
        />

        {/* ⚡ RENEW / UPGRADE PLAN MODAL */}
        <GymMemberRenewUpgradeModal
          visible={renewModalVisible}
          member={member}
          onClose={() => setRenewModalVisible(false)}
        />

        {/* ❄️ FREEZE / PAUSE MODAL */}
        <GymMemberFreezeModal
          visible={freezeModalVisible}
          member={member}
          onClose={() => setFreezeModalVisible(false)}
        />

        {/* 🔒 SMART LOCKER RADAR PICKER MODAL */}
        <GymLockerPickerModal
          visible={lockerPickerVisible}
          onClose={() => setLockerPickerVisible(false)}
          selectedLockerNumber={member.lockerNumber || ''}
          athleteName={member.fullName}
          athleteGender={member.gender}
          onSelectLocker={async (newLockNum) => {
            if (newLockNum) {
              const item = lockers.find(
                (l) => l.lockerNumber.toUpperCase() === newLockNum.trim().toUpperCase()
              );
              if (item) {
                await assignLocker(
                  item.id,
                  member.id,
                  member.fullName,
                  member.phone,
                  item.type || 'DAILY_FREE',
                  item.monthlyRentBdt || 0,
                  member.endDate
                );
              }
            }
          }}
        />

        {/* 💵 COLLECT DUE BOTTOM SHEET MODAL */}
        <Modal
          visible={collectDuesVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCollectDuesVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[styles.collectSheetCard, { backgroundColor: isDark ? '#161D24' : '#FFFFFF', borderColor: colors.border }]}>
                
                <View style={styles.collectSheetHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.collectIconBubble, { backgroundColor: 'rgba(250, 82, 82, 0.15)' }]}>
                      <MaterialIcons name="payments" size={18} color="#FA5252" />
                    </View>
                    <View>
                      <Text style={[styles.collectSheetTitle, { color: colors.textPrimary }]}>
                        Collect Due Settlement
                      </Text>
                      <Text style={[styles.collectSheetSub, { color: colors.textSecondary }]}>
                        {member.fullName} • Outstanding ৳{member.dueAmountBdt.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setCollectDuesVisible(false)}>
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* AMOUNT INPUT */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT TO COLLECT (BDT)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={collectAmount}
                    onChangeText={setCollectAmount}
                    placeholder={`e.g. ${member.dueAmountBdt}`}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* PAYMENT METHOD PILLS */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAYMENT METHOD</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {PAYMENT_METHODS.map((m) => {
                      const isSel = collectMethod === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setCollectMethod(m)}
                          style={[
                            styles.methodPill,
                            isSel
                              ? { backgroundColor: colors.primary, borderColor: colors.primary }
                              : { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}>
                          <Text style={{ fontSize: 11, fontFamily: isSel ? F.monoBold : F.sans, color: isSel ? '#000' : colors.textPrimary }}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* NOTES */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RECEIPT NOTES (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    value={collectNotes}
                    onChangeText={setCollectNotes}
                    placeholder="e.g. Cleared via bKash TrxID..."
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* CONFIRM BUTTON */}
                <TouchableOpacity
                  disabled={isCollecting}
                  onPress={handleConfirmCollectDues}
                  style={[styles.confirmCollectBtn, { backgroundColor: '#89FE00' }]}>
                  <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 13 }}>
                    {isCollecting ? 'Recording Payment...' : `Confirm ৳${collectAmount || '0'} Received`}
                  </Text>
                </TouchableOpacity>

              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  notFoundSubtitle: {
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    marginBottom: 8,
  },
  notFoundBackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  notFoundBackBtnText: {
    color: '#000',
    fontFamily: F.sansBold,
    fontSize: 13,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  topBarSubtitle: {
    fontSize: 10,
    fontFamily: F.sans,
    marginTop: 1,
  },
  headerIdPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerIdPassText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
    gap: 14,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    position: 'relative',
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  heroAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 22,
    fontFamily: F.sansBold,
  },
  heroAvatarStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#161D24',
  },
  heroName: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  heroPhone: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  heroStatusBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroStatusText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.3,
  },
  heroLockerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroLockerText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  heroContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroContactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
  },
  heroContactPillText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  heroAttendanceSummary: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  heroCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroCheckInBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  tabStrip: {
    flexDirection: 'row',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 10,
  },
  tabSectionWrap: {
    gap: 12,
  },
  miniPlanTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniPlanTagText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  validityProgressWrap: {
    gap: 6,
    marginTop: 4,
  },
  validityProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validityProgressLabel: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  validityProgressPercent: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressDateText: {
    fontSize: 10,
    fontFamily: F.mono,
  },
  accessGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  accessTile: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  accessTileLabel: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.4,
  },
  accessTileVal: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  accessTileSub: {
    fontSize: 10,
    fontFamily: F.sans,
  },
  infoBlockCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardHeading: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: F.sans,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  primaryActionBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBlockBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  outlineSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlineSecondaryBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  freezeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  allPaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  allPaidTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  allPaidSub: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  ledgerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  ledgerAmountText: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  ledgerMetaText: {
    fontSize: 10,
    fontFamily: F.sans,
    marginTop: 2,
  },
  shareReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  shareReceiptText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  emptyLedgerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyLedgerText: {
    fontSize: 11,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FA5252',
    marginTop: 6,
  },
  emergencyCallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  notesBodyText: {
    fontSize: 12,
    fontFamily: F.sans,
    lineHeight: 18,
  },
  dangerZoneWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  deleteMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteMemberBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: '#FA5252',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  collectSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  collectSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  collectIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectSheetTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  collectSheetSub: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  formInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: F.sans,
  },
  methodPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmCollectBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
