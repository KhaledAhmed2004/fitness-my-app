/**
 * Gym Member Directory & Retention Hub Screen View
 * Full-screen management hub rendered on Tab 4 when user has 'GYM_OWNER' role.
 * Features:
 *  1. Searchable member directory with filter matrix (All, Active, Ghosting 7d+, Expiring, Unpaid).
 *  2. 1-Tap WhatsApp Dues & Re-engagement triggers.
 *  3. Front-Desk Check-In Terminal launcher.
 *  4. Executive roster metrics strip with glowing status icons.
 *  5. 1-Tap toggle to switch to Personal Fasting Tracker.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, MemberStatus } from '@/types/gym';
import { GymMemberCrmModal } from './gym-member-crm-modal';
import { GymCheckinStationModal } from './gym-checkin-station-modal';
import { GymEnrollMemberModal } from './gym-enroll-member-modal';
import { GymMemberFreezeModal } from './gym-member-freeze-modal';
import { GymWhatsAppQrModal } from './gym-whatsapp-qr-modal';
import { GymMemberRenewUpgradeModal } from './gym-member-renew-upgrade-modal';
import { GymMemberIdPassModal } from './gym-member-id-pass-modal';

const C = Vital.colors;
const F = Vital.fonts;

/**
 * Miller's Law: Formats raw digit strings into visually chunked blocks (Cowan 2010).
 * E.g., "+8801711234567" -> "+880 1711-234567", "01711234567" -> "01711-234567"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.trim().replace(/\s+/g, '');
  if (cleaned.startsWith('+880') && cleaned.length >= 14) {
    return `+880 ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

type CrmFilterTab = MemberStatus | 'ALL' | 'GHOSTING';

type Props = {
  onTogglePersonalFasting?: () => void;
};

type FilterMeta = {
  key: CrmFilterTab;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgLight: string;
};

const FILTER_TABS_CONFIG: FilterMeta[] = [
  { key: 'ALL', label: 'All Roster', icon: 'groups', color: '#00B4D8', bgLight: 'rgba(0, 180, 216, 0.12)' },
  { key: 'GHOSTING', label: 'Ghosting (7d+)', icon: 'radar', color: '#FF922B', bgLight: 'rgba(255, 146, 43, 0.14)' },
  { key: 'ACTIVE', label: 'Active', icon: 'check-circle', color: '#89FE00', bgLight: 'rgba(137, 254, 0, 0.14)' },
  { key: 'FROZEN', label: 'Frozen', icon: 'ac-unit', color: '#4DABF7', bgLight: 'rgba(77, 171, 247, 0.14)' },
  { key: 'EXPIRING_SOON', label: 'Expiring', icon: 'schedule', color: '#FFB800', bgLight: 'rgba(255, 184, 0, 0.14)' },
  { key: 'UNPAID', label: 'Dues Pending', icon: 'payments', color: '#FA5252', bgLight: 'rgba(250, 82, 82, 0.14)' },
  { key: 'EXPIRED', label: 'Expired', icon: 'event-busy', color: '#868E96', bgLight: 'rgba(134, 142, 150, 0.14)' },
];

export function GymMemberDirectoryScreenView({ onTogglePersonalFasting }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const {
    members,
    gymProfile,
    todayCheckInIds,
    toggleMemberCheckIn,
    generateWhatsAppDuesMessage,
    generateWhatsAppReEngagementMessage,
    getGhostingMembers,
  } = useGymOwnerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<CrmFilterTab>('ALL');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [memberCrmVisible, setMemberCrmVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [freezeModalMember, setFreezeModalMember] = useState<GymMemberItem | null>(null);
  const [renewModalMember, setRenewModalMember] = useState<GymMemberItem | null>(null);
  const [passModalMember, setPassModalMember] = useState<GymMemberItem | null>(null);
  const [selectedFilterForModal, setSelectedFilterForModal] = useState<MemberStatus | 'ALL'>('ALL');
  const [waQrVisible, setWaQrVisible] = useState(false);

  const ghostingMembers = useMemo(() => getGhostingMembers(7), [members, getGhostingMembers]);
  const ghostingIds = useMemo(() => new Set(ghostingMembers.map((g) => g.id)), [ghostingMembers]);

  const unpaidCount = useMemo(() => members.filter((m) => m.dueAmountBdt > 0).length, [members]);
  const expiringCount = useMemo(() => members.filter((m) => m.status === 'EXPIRING_SOON').length, [members]);
  const activeCount = useMemo(() => members.filter((m) => m.status === 'ACTIVE').length, [members]);
  const frozenCount = useMemo(() => members.filter((m) => m.status === 'FROZEN').length, [members]);
  const expiredCount = useMemo(() => members.filter((m) => m.status === 'EXPIRED').length, [members]);
  const activeFilterConfig = useMemo(() => FILTER_TABS_CONFIG.find((t) => t.key === filterTab), [filterTab]);

  const getTabCount = (tabKey: CrmFilterTab) => {
    switch (tabKey) {
      case 'ALL':
        return members.length;
      case 'GHOSTING':
        return ghostingMembers.length;
      case 'ACTIVE':
        return activeCount;
      case 'FROZEN':
        return frozenCount;
      case 'EXPIRING_SOON':
        return expiringCount;
      case 'UNPAID':
        return unpaidCount;
      case 'EXPIRED':
        return expiredCount;
      default:
        return 0;
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery) ||
        m.planTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.lockerNumber && m.lockerNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (filterTab === 'ALL') return true;
      if (filterTab === 'GHOSTING') return ghostingIds.has(m.id);
      return m.status === filterTab;
    });
  }, [members, searchQuery, filterTab, ghostingIds]);

  const handleSendWhatsAppDue = (member: GymMemberItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const msg = generateWhatsAppDuesMessage(member);
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  const handleSendWhatsAppReEngage = (member: GymMemberItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const msg = generateWhatsAppReEngagementMessage(member);
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  // Safe Check-in Interceptor for Expired Members (H5 Error Prevention)
  const handleCardCheckInPress = (member: GymMemberItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const isCurrentlyCheckedIn = todayCheckInIds.includes(member.id);

    // If member is expired and NOT yet checked in, prompt renewal dialog
    if (member.status === 'EXPIRED' && !isCurrentlyCheckedIn) {
      Alert.alert(
        'Membership Expired ⚠️',
        `${member.fullName}'s subscription has expired. Would you like to renew their plan or grant entry anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Renew Plan',
            onPress: () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setRenewModalMember(member);
            },
          },
          {
            text: 'Check In Anyway',
            style: 'destructive',
            onPress: () => {
              void toggleMemberCheckIn(member.id);
            },
          },
        ]
      );
      return;
    }

    void toggleMemberCheckIn(member.id);
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        {/* PREMIUM HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {gymProfile.gymName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {members.length} Enrolled • {todayCheckInIds.length} On Floor Now
            </Text>
          </View>

          <View style={styles.headerActionRow}>
            {/* WHATSAPP QR ENROLL BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setWaQrVisible(true);
              }}
              style={styles.waQrBtn}>
              <Text style={styles.waQrBtnEmoji}>📲</Text>
            </TouchableOpacity>

            {/* ENROLL BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setEnrollModalVisible(true);
              }}
              style={styles.primaryActionBtn}>
              <View style={styles.primaryActionIconBox}>
                <MaterialIcons name="person-add-alt-1" size={14} color="#000" />
              </View>
              <Text style={styles.primaryActionBtnText}>Enroll</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR WITH EMBEDDED FILTER TRIGGER */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.searchIconBadge}>
              <MaterialIcons name="search" size={17} color={colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search athlete name, phone, locker, plan..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSearchQuery('');
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.searchClearBtn}>
                <MaterialIcons name="close" size={14} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}

            {/* EMBEDDED FILTER BUTTON (FITTS'S LAW HITSLOP EXPANSION) */}
            <TouchableOpacity
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setFilterSheetVisible(true);
              }}
              style={[
                styles.filterBtn,
                filterTab !== 'ALL'
                  ? {
                      backgroundColor: isDark ? 'rgba(0, 180, 216, 0.2)' : 'rgba(0, 180, 216, 0.12)',
                      borderColor: '#00B4D8',
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: colors.border,
                    },
              ]}>
              <MaterialIcons
                name="tune"
                size={16}
                color={filterTab !== 'ALL' ? '#00B4D8' : colors.textSecondary}
              />
              {filterTab !== 'ALL' && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* DYNAMIC RESULT COUNT INDICATOR (H6 RECOGNITION OVER RECALL) */}
        {(searchQuery.trim().length > 0 || filterTab !== 'ALL') && (
          <View style={styles.searchResultCountBar}>
            <MaterialIcons name="filter-list" size={12} color={colors.textSecondary} />
            <Text style={[styles.searchResultCountText, { color: colors.textSecondary }]}>
              Showing <Text style={{ color: colors.primary, fontFamily: F.sansBold }}>{filteredMembers.length}</Text> of {filterTab === 'ALL' ? members.length : getTabCount(filterTab)} {filterTab === 'ALL' ? 'athletes' : `${activeFilterConfig?.label || ''} members`}
            </Text>
          </View>
        )}

        {/* ACTIVE FILTER TAG (DISMISSIBLE) & CONTEXTUAL COHORT HINT */}
        {filterTab !== 'ALL' && (
          <View style={styles.activeFilterBar}>
            <View
              style={[
                styles.activeFilterPill,
                {
                  backgroundColor: activeFilterConfig?.bgLight || 'rgba(0, 180, 216, 0.12)',
                  borderColor: activeFilterConfig?.color || '#00B4D8',
                },
              ]}>
              <MaterialIcons
                name={activeFilterConfig?.icon || 'filter-list'}
                size={12}
                color={activeFilterConfig?.color || '#00B4D8'}
              />
              <Text
                style={[
                  styles.activeFilterLabel,
                  { color: activeFilterConfig?.color || colors.textPrimary },
                ]}>
                {activeFilterConfig?.label} ({filteredMembers.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setFilterTab('ALL');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.activeFilterClearBtn}>
                <MaterialIcons name="close" size={12} color={activeFilterConfig?.color || colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {filterTab === 'GHOSTING' && (
              <View style={[styles.cohortHintPill, { backgroundColor: isDark ? 'rgba(255, 146, 43, 0.08)' : '#FFF7ED', borderColor: isDark ? 'rgba(255, 146, 43, 0.2)' : '#FED7AA' }]}>
                <MaterialIcons name="info-outline" size={11} color="#FF922B" />
                <Text style={[styles.cohortHintText, { color: isDark ? '#FF922B' : '#C2410C' }]}>
                  Inactive 7+ days. Tap WhatsApp on card to send workout comeback message.
                </Text>
              </View>
            )}
            {filterTab === 'UNPAID' && (
              <View style={[styles.cohortHintPill, { backgroundColor: isDark ? 'rgba(250, 82, 82, 0.08)' : '#FEF2F2', borderColor: isDark ? 'rgba(250, 82, 82, 0.2)' : '#FECACA' }]}>
                <MaterialIcons name="info-outline" size={11} color="#FA5252" />
                <Text style={[styles.cohortHintText, { color: isDark ? '#FA5252' : '#B91C1C' }]}>
                  Outstanding dues pending. Tap WhatsApp on card to send instant invoice reminder.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* MEMBER CARDS STREAM */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {filteredMembers.length === 0 ? (
            <View style={[styles.emptyWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.emptyIconBackdrop}>
                <MaterialIcons name="person-search" size={32} color="#00B4D8" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Members Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? `No matching records found for "${searchQuery}".`
                  : 'No member records match the selected filter.'}
              </Text>
              {searchQuery || filterTab !== 'ALL' ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSearchQuery('');
                    setFilterTab('ALL');
                  }}
                  style={[styles.resetFilterBtn, { borderColor: colors.border }]}>
                  <MaterialIcons name="refresh" size={14} color={colors.primary} />
                  <Text style={[styles.resetFilterText, { color: colors.primary }]}>Reset Filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            filteredMembers.map((member) => {
              const isCheckedIn = todayCheckInIds.includes(member.id);
              const hasDue = member.dueAmountBdt > 0;
              const isGhosting = ghostingIds.has(member.id);
              const isExpiring = member.status === 'EXPIRING_SOON';
              const isFrozen = member.status === 'FROZEN';
              // Show "NEW via WA" badge for members enrolled via WhatsApp in last 48h
              const isNewViaWa =
                (member.enrollmentSource === 'WHATSAPP_BOT' || member.enrollmentSource === 'QR_SELF_ENROLL') &&
                !!member.whatsappEnrolledAt &&
                Date.now() - new Date(member.whatsappEnrolledAt).getTime() < 48 * 60 * 60 * 1000;

              return (
                <View
                  key={member.id}
                  style={[
                    styles.memberCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isFrozen
                        ? 'rgba(77, 171, 247, 0.4)'
                        : isCheckedIn
                        ? 'rgba(137, 254, 0, 0.45)'
                        : hasDue
                        ? 'rgba(250, 82, 82, 0.35)'
                        : isGhosting
                        ? 'rgba(255, 146, 43, 0.4)'
                        : isExpiring
                        ? 'rgba(255, 184, 0, 0.35)'
                        : colors.border,
                    },
                  ]}>
                  {/* CARD TOP INFO & PROFILE DETAILS NAVIGATION */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      router.push({
                        pathname: '/(app)/gym-member-detail',
                        params: { memberId: member.id },
                      });
                    }}
                    style={styles.cardHeader}>
                    {/* AVATAR WITH STATUS GLOW RING */}
                    <View
                      style={[
                        styles.avatarWrap,
                        {
                          borderColor: isCheckedIn
                            ? '#89FE00'
                            : isFrozen
                            ? '#4DABF7'
                            : isGhosting
                            ? '#FF922B'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}>
                      {member.avatarUrl ? (
                        <Image source={{ uri: member.avatarUrl }} style={styles.avatarImg} />
                      ) : (
                        <View
                          style={[
                            styles.avatarFallback,
                            {
                              backgroundColor: isCheckedIn
                                ? 'rgba(137, 254, 0, 0.15)'
                                : isFrozen
                                ? 'rgba(77, 171, 247, 0.15)'
                                : isGhosting
                                ? 'rgba(255, 146, 43, 0.15)'
                                : C.primaryAlpha20,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.avatarText,
                              {
                                color: isCheckedIn
                                  ? '#89FE00'
                                  : isFrozen
                                  ? '#4DABF7'
                                  : isGhosting
                                  ? '#FF922B'
                                  : colors.primary,
                              },
                            ]}>
                            {member.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      {/* MICRO STATUS ORB ON AVATAR */}
                      <View
                        style={[
                          styles.avatarStatusOrb,
                          {
                            backgroundColor: isFrozen
                              ? '#4DABF7'
                              : isCheckedIn
                              ? '#89FE00'
                              : isGhosting
                              ? '#FF922B'
                              : hasDue
                              ? '#FA5252'
                              : '#40C057',
                          },
                        ]}
                      />
                    </View>

                    {/* MAIN INFO & VECTOR BADGES */}
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {member.fullName}
                        </Text>

                        {/* VECTOR STATUS BADGES */}
                        {isFrozen ? (
                          <View style={[styles.statusTag, { backgroundColor: 'rgba(77, 171, 247, 0.14)', borderColor: 'rgba(77, 171, 247, 0.3)' }]}>
                            <MaterialIcons name="ac-unit" size={10} color="#4DABF7" />
                            <Text style={[styles.statusTagText, { color: '#4DABF7' }]}>FROZEN</Text>
                          </View>
                        ) : isGhosting ? (
                          <View style={[styles.statusTag, { backgroundColor: 'rgba(255, 146, 43, 0.14)', borderColor: 'rgba(255, 146, 43, 0.35)' }]}>
                            <MaterialIcons name="radar" size={10} color="#FF922B" />
                            <Text style={[styles.statusTagText, { color: '#FF922B' }]}>7D+ ABSENT</Text>
                          </View>
                        ) : isExpiring ? (
                          <View style={[styles.statusTag, { backgroundColor: 'rgba(255, 184, 0, 0.14)', borderColor: 'rgba(255, 184, 0, 0.35)' }]}>
                            <MaterialIcons name="schedule" size={10} color="#FFB800" />
                            <Text style={[styles.statusTagText, { color: '#FFB800' }]}>EXPIRING</Text>
                          </View>
                        ) : null}

                        {member.lockerNumber ? (
                          <View style={[styles.statusTag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.border }]}>
                            <MaterialIcons name="lock" size={9} color={colors.textSecondary} />
                            <Text style={[styles.statusTagText, { color: colors.textSecondary }]}>
                              {member.lockerNumber}
                            </Text>
                          </View>
                        ) : null}

                        {/* 🟢 NEW VIA WHATSAPP BADGE */}
                        {isNewViaWa ? (
                          <View style={styles.waNewBadge}>
                            <Text style={styles.waNewBadgeText}>📲 WA</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* PLAN & LAST ATTENDANCE */}
                      <View style={styles.planSubRow}>
                        <MaterialIcons name="card-membership" size={12} color={colors.textMuted} />
                        <Text style={[styles.memberSub, { color: colors.textSecondary }]} numberOfLines={1}>
                          {member.planTitle} • {member.lastCheckInDate ? `Last: ${member.lastCheckInDate}` : 'No check-in yet'}
                        </Text>
                      </View>

                      {/* COACH ROW */}
                      {member.assignedTrainerName && (
                        <View style={styles.coachRow}>
                          <View style={styles.coachIconBox}>
                            <MaterialIcons name="sports" size={11} color="#89FE00" />
                          </View>
                          <Text style={[styles.trainerLine, { color: '#89FE00' }]}>
                            {member.assignedTrainerName.toLowerCase().startsWith('coach')
                              ? member.assignedTrainerName
                              : `Coach ${member.assignedTrainerName}`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 1-TAP CHECK IN PUNCH PILL (WITH EXPIRED PLAN INTERCEPTOR) */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={isFrozen}
                      onPress={() => handleCardCheckInPress(member)}
                      style={[
                        styles.checkInBtn,
                        isFrozen
                          ? { backgroundColor: 'rgba(77, 171, 247, 0.1)', borderColor: 'rgba(77, 171, 247, 0.3)' }
                          : isCheckedIn
                          ? { backgroundColor: '#89FE00', borderColor: '#89FE00' }
                          : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', borderColor: colors.border },
                      ]}>
                      <View
                        style={[
                          styles.checkInIconBox,
                          {
                            backgroundColor: isFrozen
                              ? 'rgba(77, 171, 247, 0.15)'
                              : isCheckedIn
                              ? 'rgba(0, 0, 0, 0.15)'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}>
                        <MaterialIcons
                          name={isFrozen ? 'ac-unit' : isCheckedIn ? 'how-to-reg' : 'login'}
                          size={13}
                          color={isFrozen ? '#4DABF7' : isCheckedIn ? '#000' : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.checkInBtnText,
                          { color: isFrozen ? '#4DABF7' : isCheckedIn ? '#000' : colors.textMuted },
                        ]}>
                        {isFrozen ? 'PAUSED' : isCheckedIn ? 'ON FLOOR' : 'CHECK IN'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* CARD FOOTER WITH PERFECT 2-ROW BALANCED ALIGNMENT */}
                  <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#F1F5F9' }]}>
                    {/* ROW 1: STATUS PILL (LEFT) & EXPIRATION DATE (RIGHT) */}
                    <View style={styles.cardFooterStatusRow}>
                      {hasDue ? (
                        <View style={[styles.statusIndicatorPill, { backgroundColor: isDark ? 'rgba(250, 82, 82, 0.14)' : '#FEE2E2', borderColor: isDark ? 'rgba(250, 82, 82, 0.3)' : '#FECACA' }]}>
                          <MaterialIcons name="payments" size={12} color="#FA5252" />
                          <Text style={styles.dueAmountText}>
                            Due: ৳{member.dueAmountBdt.toLocaleString()}
                          </Text>
                        </View>
                      ) : isFrozen ? (
                        <View style={[styles.statusIndicatorPill, { backgroundColor: isDark ? 'rgba(77, 171, 247, 0.14)' : '#E0F2FE', borderColor: isDark ? 'rgba(77, 171, 247, 0.3)' : '#BAE6FD' }]}>
                          <MaterialIcons name="ac-unit" size={12} color="#4DABF7" />
                          <Text style={styles.frozenStatusText}>
                            Paused
                          </Text>
                        </View>
                      ) : isGhosting ? (
                        <View style={[styles.statusIndicatorPill, { backgroundColor: isDark ? 'rgba(255, 146, 43, 0.14)' : '#FFEDD5', borderColor: isDark ? 'rgba(255, 146, 43, 0.3)' : '#FED7AA' }]}>
                          <MaterialIcons name="radar" size={12} color="#FF922B" />
                          <Text style={{ color: '#FF922B', fontFamily: F.sansBold, fontSize: 10 }}>
                            7d+ Absent
                          </Text>
                        </View>
                      ) : isExpiring ? (
                        <View style={[styles.statusIndicatorPill, { backgroundColor: isDark ? 'rgba(255, 184, 0, 0.14)' : '#FEF3C7', borderColor: isDark ? 'rgba(255, 184, 0, 0.3)' : '#FDE68A' }]}>
                          <MaterialIcons name="schedule" size={12} color="#FFB800" />
                          <Text style={{ color: isDark ? '#FFB800' : '#D97706', fontFamily: F.sansBold, fontSize: 10 }}>
                            Expiring
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.statusIndicatorPill, { backgroundColor: isDark ? 'rgba(64, 192, 87, 0.12)' : '#DCFCE7', borderColor: isDark ? 'rgba(64, 192, 87, 0.3)' : '#86EFAC' }]}>
                          <MaterialIcons name="verified" size={12} color="#40C057" />
                          <Text style={styles.paidStatusText}>
                            Paid Full
                          </Text>
                        </View>
                      )}

                      {member.endDate ? (
                        <View style={styles.validityBadge}>
                          <MaterialIcons name="event" size={12} color={colors.textMuted} />
                          <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                            Exp: {member.endDate}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* ROW 2: ACTION BUTTONS (SPANS FULL WIDTH WITH EQUAL BALANCE) */}
                    <View style={styles.cardFooterActionsRow}>
                      {/* Contextual Action: If has dues -> Send Due; If ghosting -> Re-Engage; If expiring -> Renew */}
                      {hasDue ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendWhatsAppDue(member)}
                          style={[styles.smartContextBtn, { backgroundColor: isDark ? '#25D366' : '#16A34A', flex: 1 }]}>
                          <MaterialIcons name="chat" size={13} color="#FFFFFF" />
                          <Text style={[styles.smartContextBtnText, { color: '#FFFFFF' }]}>Send Due Reminder</Text>
                        </TouchableOpacity>
                      ) : isGhosting ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendWhatsAppReEngage(member)}
                          style={[styles.smartContextBtn, { backgroundColor: '#FF922B', flex: 1 }]}>
                          <MaterialIcons name="campaign" size={13} color="#FFFFFF" />
                          <Text style={[styles.smartContextBtnText, { color: '#FFFFFF' }]}>Re-Engage Athlete</Text>
                        </TouchableOpacity>
                      ) : isExpiring ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setRenewModalMember(member)}
                          style={[styles.smartContextBtn, { backgroundColor: isDark ? '#FFB800' : '#D97706', flex: 1 }]}>
                          <MaterialIcons name="autorenew" size={13} color="#000000" />
                          <Text style={[styles.smartContextBtnText, { color: '#000000' }]}>Renew Membership</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendWhatsAppReEngage(member)}
                          style={[styles.smartContextBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9', borderWidth: 1, borderColor: colors.border, flex: 1 }]}>
                          <MaterialIcons name="chat" size={13} color="#40C057" />
                          <Text style={[styles.smartContextBtnText, { color: colors.textPrimary }]}>WhatsApp Chat</Text>
                        </TouchableOpacity>
                      )}

                      {/* Explicit Profile Affordance Button */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          router.push({
                            pathname: '/(app)/gym-member-detail',
                            params: { memberId: member.id },
                          });
                        }}
                        style={[
                          styles.profileAffordanceBtn,
                          {
                            backgroundColor: isDark ? 'rgba(137, 254, 0, 0.12)' : '#DCFCE7',
                            borderColor: isDark ? '#89FE00' : '#86EFAC',
                          },
                        ]}>
                        <Text style={[styles.profileAffordanceText, { color: isDark ? '#89FE00' : '#059669' }]}>
                          View Profile
                        </Text>
                        <MaterialIcons name="chevron-right" size={14} color={isDark ? '#89FE00' : '#059669'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* MODALS */}
        <GymCheckinStationModal
          visible={checkinModalVisible}
          onClose={() => setCheckinModalVisible(false)}
          onOpenMemberCrm={() => {
            setCheckinModalVisible(false);
            setMemberCrmVisible(true);
          }}
        />

        <GymMemberCrmModal
          visible={memberCrmVisible}
          initialFilter={selectedFilterForModal}
          onClose={() => setMemberCrmVisible(false)}
        />

        <GymEnrollMemberModal
          visible={enrollModalVisible}
          onClose={() => setEnrollModalVisible(false)}
        />

        <GymMemberFreezeModal
          visible={!!freezeModalMember}
          member={freezeModalMember}
          onClose={() => setFreezeModalMember(null)}
        />

        <GymMemberRenewUpgradeModal
          visible={!!renewModalMember}
          member={renewModalMember}
          onClose={() => setRenewModalMember(null)}
        />

        <GymMemberIdPassModal
          visible={!!passModalMember}
          member={passModalMember}
          onClose={() => setPassModalMember(null)}
        />

        {/* WHATSAPP SELF-ENROLL QR MODAL */}
        <GymWhatsAppQrModal
          visible={waQrVisible}
          onClose={() => setWaQrVisible(false)}
        />

        {/* FILTER BOTTOM SHEET MODAL (JAKOB'S LAW SLIDE TRANSITION) */}
        <Modal
          visible={filterSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterSheetVisible(false)}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setFilterSheetVisible(false)}>
            <Pressable
              style={[
                styles.sheetCard,
                {
                  backgroundColor: isDark ? '#161D24' : colors.surface,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border,
                },
              ]}>
              {/* SHEET DRAG HANDLE */}
              <View style={styles.sheetHandleWrap}>
                <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }]} />
              </View>

              {/* SHEET HEADER */}
              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.sheetHeaderIconBox, { backgroundColor: 'rgba(0, 180, 216, 0.14)' }]}>
                    <MaterialIcons name="tune" size={17} color="#00B4D8" />
                  </View>
                  <View>
                    <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Filter Roster</Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                      Select member category
                    </Text>
                  </View>
                </View>

                {filterTab !== 'ALL' && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setFilterTab('ALL');
                    }}
                    style={[styles.sheetResetBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sheetResetText, { color: colors.primary }]}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* FILTER OPTIONS LIST */}
              <View style={styles.sheetOptionsList}>
                {FILTER_TABS_CONFIG.map((tab) => {
                  const isSelected = filterTab === tab.key;
                  const count = getTabCount(tab.key);

                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.75}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        setFilterTab(tab.key);
                        setFilterSheetVisible(false);
                      }}
                      style={[
                        styles.sheetOptionRow,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)'
                            : 'transparent',
                          borderColor: isSelected ? tab.color : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.sheetOptionIconBox,
                            { backgroundColor: tab.bgLight },
                          ]}>
                          <MaterialIcons name={tab.icon} size={16} color={tab.color} />
                        </View>
                        <Text
                          style={[
                            styles.sheetOptionLabel,
                            {
                              color: isSelected ? colors.textPrimary : colors.textSecondary,
                              fontFamily: isSelected ? F.sansBold : F.sansMedium,
                            },
                          ]}>
                          {tab.label}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={[
                            styles.sheetCountBadge,
                            {
                              backgroundColor: isSelected
                                ? tab.color
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.sheetCountText,
                              { color: isSelected ? '#000' : colors.textSecondary },
                            ]}>
                            {count}
                          </Text>
                        </View>

                        {isSelected && (
                          <MaterialIcons name="check" size={16} color={tab.color} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#89FE00',
    shadowColor: '#89FE00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionIconBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: '#000',
  },
  // 📲 WhatsApp QR FAB button in header
  waQrBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(37, 211, 102, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waQrBtnEmoji: { fontSize: 16 },
  // 🟢 "VIA WA" new member badge
  waNewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
  },
  waNewBadgeText: {
    fontSize: 9,
    fontFamily: F.sansBold,
    color: '#25D366',
  },
  searchWrap: {
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: F.sans,
    paddingVertical: 0,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(120, 120, 120, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B4D8',
  },
  searchResultCountBar: {
    paddingHorizontal: 18,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  searchResultCountText: {
    fontSize: 10,
    fontFamily: F.sansMedium,
  },
  activeFilterBar: {
    paddingHorizontal: 18,
    marginBottom: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeFilterLabel: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  activeFilterClearBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cohortHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
  cohortHintText: {
    fontSize: 10,
    fontFamily: F.sansMedium,
    flex: 1,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 10,
    gap: 14,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  sheetHeaderIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  sheetSubtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  sheetResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sheetResetText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  sheetOptionsList: {
    gap: 6,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  sheetOptionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionLabel: {
    fontSize: 13,
  },
  sheetCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sheetCountText: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 10,
  },
  emptyWrap: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
  },
  emptyIconBackdrop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetFilterText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  memberCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  avatarStatusOrb: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#161D24',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 13,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    letterSpacing: 0.3,
  },
  planSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberSub: {
    fontSize: 11,
    fontFamily: F.sans,
    flex: 1,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  coachIconBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerLine: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkInIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtnText: {
    fontSize: 9,
    fontFamily: F.sansBold,
    letterSpacing: 0.3,
  },
  cardFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  cardFooterStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  statusIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dueAmountText: {
    color: '#FA5252',
    fontFamily: F.sansBold,
    fontSize: 10,
  },
  frozenStatusText: {
    color: '#4DABF7',
    fontFamily: F.sansBold,
    fontSize: 10,
  },
  paidStatusText: {
    color: '#40C057',
    fontFamily: F.sansBold,
    fontSize: 10,
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validityText: {
    fontSize: 10,
    fontFamily: F.mono,
  },
  cardFooterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  smartContextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  smartContextBtnText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  profileAffordanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  profileAffordanceText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
});

