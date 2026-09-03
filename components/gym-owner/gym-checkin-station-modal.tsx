/**
 * Front-Desk Check-In Station Modal (GymOS)
 * High-speed front-desk member search, 1-tap attendance punch, live floor roster & instant status validation.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
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

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem } from '@/types/gym';
import { GymShiftManagerModal } from './gym-shift-manager-modal';

const C = Vital.colors;
const F = Vital.fonts;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenMemberCrm?: () => void;
};

export function GymCheckinStationModal({ visible, onClose, onOpenMemberCrm }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    members,
    todayCheckInIds,
    quickCheckInMember,
    resumeMember,
    collectDuePayment,
    generateWhatsAppDigitalReceipt,
    getNewbieMembers,
    getGhostingMembers,
    getCurrentShiftStatus,
    generateWhatsAppBirthdayWish,
    generateWhatsAppMilestoneWish,
    recordCelebrationWish,
    gymProfile,
  } = useGymOwnerStore();

  const currentShiftStatus = getCurrentShiftStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [lastCheckedMember, setLastCheckedMember] = useState<{
    member: GymMemberItem;
    isCheckIn: boolean;
  } | null>(null);

  // Shift Blocked State & Manager Override
  const [shiftBlockedMember, setShiftBlockedMember] = useState<GymMemberItem | null>(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [shiftManagerVisible, setShiftManagerVisible] = useState(false);

  // Quick Collect Due State
  const [collectDueMember, setCollectDueMember] = useState<GymMemberItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'bKash' | 'Nagad' | 'Cash' | 'Card'>('bKash');
  const [payTrxId, setPayTrxId] = useState('');

  const newbieIds = useMemo(() => new Set(getNewbieMembers(14).map((m) => m.id)), [members, getNewbieMembers]);
  const ghostingIds = useMemo(() => new Set(getGhostingMembers(7).map((m) => m.id)), [members, getGhostingMembers]);

  const checkedInMembers = useMemo(() => {
    return members.filter((m) => todayCheckInIds.includes(m.id));
  }, [members, todayCheckInIds]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.phone.replace(/[^0-9]/g, '').slice(-4).includes(q) ||
        (m.lockerNumber && m.lockerNumber.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  const handleToggleCheckIn = async (member: GymMemberItem) => {
    if (member.status === 'FROZEN') {
      Alert.alert(
        '❄️ Membership is Frozen',
        `${member.fullName}'s membership is currently paused (Frozen on ${member.currentFreeze?.freezeStartDate || 'recent'}).\n\nWould you like to RESUME their membership today and calculate new extended expiry?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resume & Check In',
            onPress: async () => {
              await resumeMember(member.id);
              const res = await quickCheckInMember(member.id);
              if (res.success && res.member) {
                setLastCheckedMember({
                  member: res.member,
                  isCheckIn: res.isCheckIn,
                });
                setSearchQuery('');
              }
            },
          },
        ]
      );
      return;
    }

    // 🚺 SHIFT GUARD: Check if member gender is allowed in current shift
    const isAlreadyCheckedIn = todayCheckInIds.includes(member.id);
    if (!isAlreadyCheckedIn && currentShiftStatus.currentShift) {
      const memberGender = (member.gender?.toUpperCase() || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER';
      const isAllowed = currentShiftStatus.currentShift.allowedGenders.includes(memberGender);

      if (!isAllowed) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
        setShiftBlockedMember(member);
        setShowPinInput(false);
        setManagerPinInput('');
        return;
      }
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(
        member.dueAmountBdt > 0
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium
      ).catch(() => {});
    }

    const res = await quickCheckInMember(member.id);
    if (res.success && res.member) {
      setLastCheckedMember({
        member: res.member,
        isCheckIn: res.isCheckIn,
      });

      // Clear search after check-in for speed
      if (res.isCheckIn) {
        setSearchQuery('');
      }
    }
  };

  const handleQuickPayDue = async () => {
    if (!collectDueMember) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    const res = await collectDuePayment(
      collectDueMember.id,
      amt,
      payMethod,
      'Front-Desk Check-In Collection',
      payTrxId
    );

    if (res.success && res.paymentRecord && res.updatedMember) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Update feedback card if same member
      if (lastCheckedMember?.member.id === collectDueMember.id) {
        setLastCheckedMember({
          member: res.updatedMember,
          isCheckIn: true,
        });
      }

      const receiptMsg = generateWhatsAppDigitalReceipt(res.updatedMember, res.paymentRecord);
      const cleanPhone = res.updatedMember.phone.replace(/[^0-9]/g, '');

      setCollectDueMember(null);
      setPayTrxId('');

      Alert.alert(
        '✅ Payment Recorded',
        `BDT ${amt.toLocaleString()} collected successfully. Send digital receipt to member via WhatsApp?`,
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'Send WhatsApp Receipt',
            onPress: () => {
              const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptMsg)}`;
              Linking.openURL(url).catch(() => {});
            },
          },
        ]
      );
    }
  };

  const floorPercent = Math.min(
    100,
    Math.round((todayCheckInIds.length / gymProfile.maxFloorCapacity) * 100)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
          {/* HEADER */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="how-to-reg" size={20} color="#89FE00" />
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  Front-Desk Check-In Station
                </Text>
              </View>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                {gymProfile.gymName} • Live Reception Terminal
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* LIVE SHIFT RADAR BANNER */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShiftManagerVisible(true)}
            style={[
              styles.shiftRadarBanner,
              {
                backgroundColor:
                  currentShiftStatus.shiftType === 'LADIES_ONLY'
                    ? 'rgba(230, 73, 128, 0.12)'
                    : currentShiftStatus.shiftType === 'GENTS_ONLY'
                    ? 'rgba(51, 154, 240, 0.12)'
                    : 'rgba(64, 192, 87, 0.12)',
                borderColor:
                  currentShiftStatus.shiftType === 'LADIES_ONLY'
                    ? '#E64980'
                    : currentShiftStatus.shiftType === 'GENTS_ONLY'
                    ? '#339AF0'
                    : '#40C057',
              },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>{currentShiftStatus.badgeEmoji}</Text>
                <Text
                  style={[
                    styles.shiftRadarTag,
                    {
                      color:
                        currentShiftStatus.shiftType === 'LADIES_ONLY'
                          ? '#E64980'
                          : currentShiftStatus.shiftType === 'GENTS_ONLY'
                          ? '#339AF0'
                          : '#40C057',
                    },
                  ]}>
                  {currentShiftStatus.label.toUpperCase()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.shiftRadarTime, { color: colors.textSecondary }]}>
                  {currentShiftStatus.currentShift
                    ? `${currentShiftStatus.currentShift.startTime}–${currentShiftStatus.currentShift.endTime}`
                    : 'Open Hours'}
                </Text>
                <MaterialIcons name="tune" size={14} color={colors.textSecondary} />
              </View>
            </View>
            {currentShiftStatus.currentShift && (
              <Text style={[styles.shiftRemainingText, { color: colors.textPrimary }]}>
                ⏳ {currentShiftStatus.remainingMinutes} mins remaining in this shift
              </Text>
            )}
          </TouchableOpacity>

          {/* FLOOR OCCUPANCY BANNER */}
          <View
            style={[
              styles.occupancyBanner,
              {
                backgroundColor: colors.surface,
                borderColor: floorPercent > 80 ? '#FA5252' : colors.border,
              },
            ]}>
            <View style={styles.bannerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.liveDot, { backgroundColor: floorPercent > 80 ? '#FA5252' : '#40C057' }]} />
                <Text style={[styles.bannerLabel, { color: colors.textPrimary }]}>ACTIVE ON FLOOR</Text>
              </View>
              <Text style={[styles.bannerValue, { color: colors.primary }]}>
                {todayCheckInIds.length} / {gymProfile.maxFloorCapacity} Capacity ({floorPercent}%)
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${floorPercent}%`,
                    backgroundColor: floorPercent > 80 ? '#FA5252' : '#40C057',
                  },
                ]}
              />
            </View>
          </View>

          {/* LIVE SEARCH BAR */}
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="search" size={22} color={colors.primary} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Type member name, phone (e.g. 3344) or locker #..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="cancel" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* RECENT VALIDATION FEEDBACK CARD */}
          {lastCheckedMember && (
            <View
              style={[
                styles.feedbackCard,
                lastCheckedMember.member.dueAmountBdt > 0
                  ? { backgroundColor: 'rgba(250, 82, 82, 0.15)', borderColor: '#FA5252' }
                  : lastCheckedMember.isCheckIn
                  ? { backgroundColor: 'rgba(64, 192, 87, 0.15)', borderColor: '#40C057' }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons
                  name={
                    lastCheckedMember.member.dueAmountBdt > 0
                      ? 'warning'
                      : lastCheckedMember.isCheckIn
                      ? 'check-circle'
                      : 'logout'
                  }
                  size={24}
                  color={
                    lastCheckedMember.member.dueAmountBdt > 0
                      ? '#FA5252'
                      : lastCheckedMember.isCheckIn
                      ? '#40C057'
                      : colors.textSecondary
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feedbackName, { color: colors.textPrimary }]}>
                    {lastCheckedMember.member.fullName}
                  </Text>
                  <Text
                    style={[
                      styles.feedbackStatus,
                      {
                        color:
                          lastCheckedMember.member.dueAmountBdt > 0
                            ? '#FA5252'
                            : lastCheckedMember.isCheckIn
                            ? '#40C057'
                            : colors.textSecondary,
                      },
                    ]}>
                    {lastCheckedMember.member.dueAmountBdt > 0
                      ? `⚠️ CHECKED IN WITH OVERDUE DUE: ৳${lastCheckedMember.member.dueAmountBdt.toLocaleString()}`
                      : lastCheckedMember.isCheckIn
                      ? `✅ ACCESS GRANTED • Locker: ${lastCheckedMember.member.lockerNumber || 'None'}`
                      : '👋 CHECKED OUT'}
                  </Text>
                </View>

                {lastCheckedMember.member.dueAmountBdt > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setCollectDueMember(lastCheckedMember.member);
                      setPayAmount(String(lastCheckedMember.member.dueAmountBdt));
                    }}
                    style={[styles.collectDueQuickBtn, { backgroundColor: '#FA5252' }]}>
                    <MaterialIcons name="payments" size={13} color="#FFF" />
                    <Text style={styles.collectDueQuickBtnText}>Collect</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setLastCheckedMember(null)}
                  style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* 🎂 CELEBRATION & BIRTHDAY / CENTURY ALERT */}
              {(() => {
                if (!lastCheckedMember.isCheckIn) return null;
                const m = lastCheckedMember.member;
                const now = new Date();
                const pad = (n: number) => n.toString().padStart(2, '0');
                const todayMMDD = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

                let isBday = false;
                if (m.dateOfBirth) {
                  const parts = m.dateOfBirth.split('-');
                  if (parts.length >= 3) {
                    isBday = `${pad(parseInt(parts[1], 10))}-${pad(parseInt(parts[2], 10))}` === todayMMDD;
                  }
                }

                const isCentury = m.totalCheckInsCount === 100;
                const isHalfCentury = m.totalCheckInsCount === 50;

                if (!isBday && !isCentury && !isHalfCentury) return null;

                return (
                  <View style={[styles.checkinBdayAlert, { backgroundColor: 'rgba(255, 184, 0, 0.15)', borderColor: '#FFB800' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Text style={{ fontSize: 20 }}>{isBday ? '🎂' : isCentury ? '💯' : '🔥'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.bdayAlertTitle, { color: colors.textPrimary }]}>
                            {isBday
                              ? `It's ${m.fullName}'s Birthday Today! 🎉`
                              : isCentury
                              ? `100th Workout Century Club! 💯`
                              : `50th Workout Milestone! 🔥`}
                          </Text>
                          <Text style={[styles.bdayAlertSub, { color: colors.textSecondary }]}>
                            {isBday
                              ? '🎁 Perk: 1 Free Protein Shake • Wish them at the desk!'
                              : '🏆 Elite Athlete milestone unlocked!'}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          const msg = isBday
                            ? generateWhatsAppBirthdayWish(m)
                            : generateWhatsAppMilestoneWish(m, {
                                id: `m_${m.id}`,
                                memberId: m.id,
                                memberName: m.fullName,
                                memberPhone: m.phone,
                                gender: m.gender,
                                type: isCentury ? 'CENTURY_100' : 'STREAK_50',
                                title: isCentury ? '100th Workout Century Club' : '50th Workout Milestone',
                                badgeEmoji: isCentury ? '💯' : '🔥',
                                description: 'Elite workout streak achieved!',
                                isWishedThisYear: false,
                                perkOffer: 'Free Steam Session',
                                dateString: 'Today',
                              });
                          const cleanPhone = m.phone.replace(/[^0-9]/g, '');
                          const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
                          void Linking.openURL(url).catch(() => {
                            void Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
                          });
                          if (isBday) void recordCelebrationWish(m.id, 'BIRTHDAY');
                        }}
                        style={[styles.bdayWishBtn, { backgroundColor: '#25D366' }]}>
                        <MaterialIcons name="chat" size={13} color="#FFF" />
                        <Text style={styles.bdayWishBtnText}>Send Gift</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* SEARCH RESULTS LIST */}
            {searchQuery.trim().length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  SEARCH MATCHES ({searchResults.length})
                </Text>
                {searchResults.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <MaterialIcons name="person-off" size={36} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No members matched "{searchQuery}"
                    </Text>
                  </View>
                ) : (
                  searchResults.map((m) => {
                    const isCheckedIn = todayCheckInIds.includes(m.id);
                    const hasDue = m.dueAmountBdt > 0;
                    const isExpiring = m.status === 'EXPIRING_SOON';

                    return (
                      <TouchableOpacity
                        key={m.id}
                        activeOpacity={0.8}
                        onPress={() => handleToggleCheckIn(m)}
                        style={[
                          styles.memberItem,
                          {
                            backgroundColor: colors.surface,
                            borderColor: hasDue
                              ? 'rgba(250, 82, 82, 0.4)'
                              : isCheckedIn
                              ? '#40C057'
                              : colors.border,
                          },
                        ]}>
                        <View style={styles.avatarWrap}>
                          {m.avatarUrl ? (
                            <Image source={{ uri: m.avatarUrl }} style={styles.avatarImg} />
                          ) : (
                            <View style={[styles.avatarFallback, { backgroundColor: C.primaryAlpha20 }]}>
                              <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {m.fullName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.memberNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                              {m.fullName}
                            </Text>
                            {m.status === 'FROZEN' ? (
                              <View style={[styles.lockerBadge, { backgroundColor: 'rgba(77, 171, 247, 0.2)' }]}>
                                <Text style={[styles.lockerBadgeText, { color: '#4DABF7' }]}>❄️ FROZEN</Text>
                              </View>
                            ) : newbieIds.has(m.id) ? (
                              <View style={[styles.lockerBadge, { backgroundColor: 'rgba(45, 212, 191, 0.2)' }]}>
                                <Text style={[styles.lockerBadgeText, { color: '#2DD4BF' }]}>🌱 NEW</Text>
                              </View>
                            ) : ghostingIds.has(m.id) ? (
                              <View style={[styles.lockerBadge, { backgroundColor: 'rgba(255, 184, 0, 0.2)' }]}>
                                <Text style={[styles.lockerBadgeText, { color: '#FFB800' }]}>🚨 7D+ ABSENT</Text>
                              </View>
                            ) : m.lockerNumber ? (
                              <View style={[styles.lockerBadge, { backgroundColor: colors.glassFill }]}>
                                <Text style={[styles.lockerBadgeText, { color: colors.textSecondary }]}>
                                  {m.lockerNumber}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text style={[styles.memberSubText, { color: colors.textSecondary }]}>
                            {m.phone} • {m.planTitle}
                          </Text>

                          {m.status === 'FROZEN' ? (
                            <Text style={{ color: '#4DABF7', fontSize: 11, fontFamily: F.sansBold, marginTop: 2 }}>
                              ❄️ Paused since {m.currentFreeze?.freezeStartDate || 'recent'} • Tap to Resume
                            </Text>
                          ) : hasDue ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={{ color: '#FA5252', fontSize: 11, fontFamily: F.sansBold }}>
                                ⚠️ Pending Due: ৳{m.dueAmountBdt.toLocaleString()}
                              </Text>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                  setCollectDueMember(m);
                                  setPayAmount(String(m.dueAmountBdt));
                                }}
                                style={{
                                  backgroundColor: '#FA5252',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}>
                                <Text style={{ color: '#FFF', fontSize: 9, fontFamily: F.sansBold }}>Pay Now</Text>
                              </TouchableOpacity>
                            </View>
                          ) : isExpiring ? (
                            <Text style={{ color: '#FFB800', fontSize: 11, fontFamily: F.sansBold, marginTop: 2 }}>
                              ⏳ Renews in a few days ({m.endDate})
                            </Text>
                          ) : null}
                        </View>

                        {/* PUNCH BUTTON */}
                        <View
                          style={[
                            styles.punchBtn,
                            isCheckedIn
                              ? { backgroundColor: '#E7F3DD', borderColor: '#40C057' }
                              : { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}>
                          <MaterialIcons
                            name={isCheckedIn ? 'check' : 'login'}
                            size={16}
                            color={isCheckedIn ? '#0E4D34' : '#000'}
                          />
                          <Text
                            style={[
                              styles.punchBtnText,
                              { color: isCheckedIn ? '#0E4D34' : '#000' },
                            ]}>
                            {isCheckedIn ? 'CHECKED IN' : 'TAP IN'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}

            {/* CURRENTLY ON FLOOR ROSTER */}
            <View style={{ marginBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  CURRENTLY ON FLOOR ({checkedInMembers.length})
                </Text>
                {onOpenMemberCrm && (
                  <TouchableOpacity onPress={onOpenMemberCrm}>
                    <Text style={{ color: colors.primary, fontFamily: F.sansBold, fontSize: 12 }}>
                      Open Full CRM ➔
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {checkedInMembers.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="fitness-center" size={36} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No members checked in yet today.
                  </Text>
                </View>
              ) : (
                checkedInMembers.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.floorMemberCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <View style={styles.avatarWrapSmall}>
                      {m.avatarUrl ? (
                        <Image source={{ uri: m.avatarUrl }} style={styles.avatarImgSmall} />
                      ) : (
                        <View style={[styles.avatarFallbackSmall, { backgroundColor: C.primaryAlpha20 }]}>
                          <Text style={[styles.avatarTextSmall, { color: colors.primary }]}>
                            {m.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.floorMemberName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {m.fullName}
                      </Text>
                      <Text style={[styles.floorMemberMeta, { color: colors.textSecondary }]}>
                        {m.planTitle} {m.lockerNumber ? `• Locker ${m.lockerNumber}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleToggleCheckIn(m)}
                      style={[styles.checkoutBtn, { borderColor: colors.border }]}>
                      <MaterialIcons name="logout" size={14} color="#FA5252" />
                      <Text style={styles.checkoutBtnText}>Check Out</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* QUICK DUE PAYMENT SUB-MODAL */}
          <Modal
            visible={collectDueMember !== null}
            animationType="fade"
            transparent
            onRequestClose={() => setCollectDueMember(null)}>
            <View style={styles.quickPayBackdrop}>
              <View style={[styles.quickPayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.quickPayTitle, { color: colors.textPrimary }]}>Collect Pending Due</Text>
                  <TouchableOpacity onPress={() => setCollectDueMember(null)}>
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {collectDueMember && (
                  <Text style={[styles.quickPaySubtitle, { color: colors.textSecondary }]}>
                    {collectDueMember.fullName} • Total Due: ৳{collectDueMember.dueAmountBdt.toLocaleString()}
                  </Text>
                )}

                <Text style={[styles.inputLabelSmall, { color: colors.textSecondary, marginTop: 12 }]}>
                  AMOUNT (BDT)
                </Text>
                <TextInput
                  style={[styles.quickPayInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={payAmount}
                  onChangeText={setPayAmount}
                />

                <Text style={[styles.inputLabelSmall, { color: colors.textSecondary, marginTop: 10 }]}>
                  PAYMENT METHOD
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {(['bKash', 'Nagad', 'Cash', 'Card'] as const).map((method) => {
                    const isSel = payMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        activeOpacity={0.8}
                        onPress={() => setPayMethod(method)}
                        style={[
                          styles.payMethodPill,
                          isSel
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.glassFill, borderColor: colors.border },
                        ]}>
                        <Text
                          style={[
                            styles.payMethodPillText,
                            { color: isSel ? '#000' : colors.textSecondary },
                          ]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.inputLabelSmall, { color: colors.textSecondary, marginTop: 10 }]}>
                  TRANSACTION ID (OPTIONAL)
                </Text>
                <TextInput
                  style={[styles.quickPayInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. 9K28X1L99"
                  placeholderTextColor={colors.textMuted}
                  value={payTrxId}
                  onChangeText={setPayTrxId}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleQuickPayDue}
                  style={[styles.confirmPayBtn, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="check" size={18} color="#000" />
                  <Text style={styles.confirmPayBtnText}>Save & Send Digital Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ⛔ SHIFT GUARD INTERCEPTION MODAL */}
          <Modal
            visible={!!shiftBlockedMember}
            transparent
            animationType="fade"
            onRequestClose={() => setShiftBlockedMember(null)}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.shiftAlertCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: '#FA5252',
                  },
                ]}>
                <View style={[styles.shiftAlertIconWrap, { backgroundColor: 'rgba(250, 82, 82, 0.15)' }]}>
                  <MaterialIcons name="block" size={36} color="#FA5252" />
                </View>

                <Text style={[styles.shiftAlertTitle, { color: colors.textPrimary }]}>
                  ACCESS RESTRICTED — SHIFT CONFLICT
                </Text>

                {shiftBlockedMember && (
                  <View style={[styles.blockedMemberPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.blockedMemberName, { color: colors.textPrimary }]}>
                      {shiftBlockedMember.fullName} ({shiftBlockedMember.gender} Athlete)
                    </Text>
                    <Text style={[styles.blockedMemberSub, { color: colors.textSecondary }]}>
                      ID: #{shiftBlockedMember.id.replace('mem_', '')} • {shiftBlockedMember.planTitle}
                    </Text>
                  </View>
                )}

                <View style={[styles.shiftReasonBox, { backgroundColor: 'rgba(230, 73, 128, 0.1)' }]}>
                  <Text style={[styles.shiftReasonText, { color: '#E64980' }]}>
                    ⚠️ Currently Active: <Text style={{ fontFamily: F.sansBold }}>{currentShiftStatus.label}</Text>
                  </Text>
                  <Text style={[styles.shiftPolicyText, { color: colors.textPrimary }]}>
                    Floor entry is restricted to ensure female member privacy.
                  </Text>
                  {currentShiftStatus.nextShift && (
                    <Text style={[styles.shiftNextCountdown, { color: colors.textSecondary }]}>
                      ⏳ Next session starts at <Text style={{ fontFamily: F.sansBold }}>{currentShiftStatus.nextShift.startTime}</Text> (in {currentShiftStatus.nextShiftStartsInMinutes} mins).
                    </Text>
                  )}
                </View>

                {showPinInput ? (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <Text style={[styles.inputLabelSmall, { color: colors.textSecondary }]}>ENTER MANAGER PIN (Default: 1234)</Text>
                    <TextInput
                      style={[styles.quickPayInput, { color: colors.textPrimary, borderColor: colors.border, textAlign: 'center', letterSpacing: 6, fontSize: 18 }]}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={6}
                      value={managerPinInput}
                      onChangeText={setManagerPinInput}
                      placeholder="••••"
                      placeholderTextColor={colors.textMuted}
                    />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <TouchableOpacity
                        onPress={() => setShowPinInput(false)}
                        style={[styles.cancelBtn, { borderColor: colors.border }]}>
                        <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={async () => {
                          const masterPin = gymProfile.managerPin || '1234';
                          if (managerPinInput.trim() !== masterPin) {
                            Alert.alert('Invalid PIN', 'Manager PIN is incorrect. (Default is 1234)');
                            return;
                          }
                          const target = shiftBlockedMember;
                          setShiftBlockedMember(null);
                          setShowPinInput(false);
                          setManagerPinInput('');

                          if (target) {
                            const res = await quickCheckInMember(target.id);
                            if (res.success && res.member) {
                              setLastCheckedMember({
                                member: res.member,
                                isCheckIn: res.isCheckIn,
                              });
                              setSearchQuery('');
                            }
                          }
                        }}
                        style={[styles.overrideConfirmBtn, { backgroundColor: '#40C057' }]}>
                        <MaterialIcons name="check" size={16} color="#FFF" />
                        <Text style={{ color: '#FFF', fontFamily: F.sansBold, fontSize: 12 }}>Confirm Override</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ width: '100%', gap: 8, marginTop: 16 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShiftBlockedMember(null)}
                      style={[styles.backToCheckinBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="arrow-back" size={16} color={colors.textPrimary} />
                      <Text style={[styles.backToCheckinText, { color: colors.textPrimary }]}>Back to Search</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowPinInput(true)}
                      style={[styles.overrideTriggerBtn, { backgroundColor: 'rgba(255, 184, 0, 0.15)', borderColor: 'rgba(255, 184, 0, 0.4)' }]}>
                      <MaterialIcons name="vpn-key" size={16} color="#FFB800" />
                      <Text style={{ color: '#FFB800', fontFamily: F.sansBold, fontSize: 12 }}>Manager Emergency Override</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          {/* SHIFT SCHEDULE MANAGER MODAL */}
          <GymShiftManagerModal
            visible={shiftManagerVisible}
            onClose={() => setShiftManagerVisible(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupancyBanner: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerLabel: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  bannerValue: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  searchSection: {
    marginTop: 12,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.sans,
  },
  feedbackCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  feedbackName: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  feedbackStatus: {
    fontSize: 11,
    fontFamily: F.monoBold,
    marginTop: 2,
  },
  scrollList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: F.sans,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  memberNameText: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  lockerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockerBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  memberSubText: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  punchBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  floorMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  avatarWrapSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImgSmall: {
    width: '100%',
    height: '100%',
  },
  avatarFallbackSmall: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  floorMemberName: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  floorMemberMeta: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkoutBtnText: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: '#FA5252',
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  collectDueQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  collectDueQuickBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  quickPayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quickPayCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  quickPayTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  quickPaySubtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  inputLabelSmall: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  quickPayInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: F.sans,
    marginTop: 4,
  },
  payMethodPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  payMethodPillText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    marginTop: 18,
  },
  confirmPayBtnText: {
    color: '#000',
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  shiftRadarBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  shiftRadarTag: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  shiftRadarTime: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  shiftRemainingText: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 4,
  },
  shiftAlertCard: {
    width: Math.min(SCREEN_WIDTH - 32, 380),
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
  },
  shiftAlertIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shiftAlertTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  blockedMemberPill: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    alignItems: 'center',
  },
  blockedMemberName: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  blockedMemberSub: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  shiftReasonBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  shiftReasonText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  shiftPolicyText: {
    fontSize: 11,
    fontFamily: F.sans,
    textAlign: 'center',
    marginTop: 4,
  },
  shiftNextCountdown: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 4,
  },
  backToCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backToCheckinText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  overrideTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overrideConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkinBdayAlert: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bdayAlertTitle: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  bdayAlertSub: {
    fontSize: 10,
    fontFamily: F.sans,
    marginTop: 1,
  },
  bdayWishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bdayWishBtnText: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: '#FFF',
  },
});

