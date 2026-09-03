/**
 * Gym Member CRM & Automated Fee Billing Modal (GymOS)
 * Search, Status Filters, Add Member, Collect Fee with 1-Tap WhatsApp Invoice Reminder
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState, useMemo } from 'react';
import {
  Alert,
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

import { useRouter } from 'expo-router';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, MemberStatus, MembershipPlanType, PaymentMethod } from '@/types/gym';
import { GymMemberFreezeModal } from './gym-member-freeze-modal';
import { GymMemberRenewUpgradeModal } from './gym-member-renew-upgrade-modal';
import { GymMemberIdPassModal } from './gym-member-id-pass-modal';

const C = Vital.colors;
const F = Vital.fonts;

type CrmFilterTab = MemberStatus | 'ALL' | 'GHOSTING';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialFilter?: CrmFilterTab;
  initialOpenAddModal?: boolean;
};

export function GymMemberCrmModal({ visible, onClose, initialFilter = 'ALL', initialOpenAddModal = false }: Props) {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const {
    members,
    addMember,
    collectMemberFee,
    renewMemberPlan,
    toggleMemberCheckIn,
    todayCheckInIds,
    deleteMember,
    generateWhatsAppDuesMessage,
    generateWhatsAppReEngagementMessage,
    getGhostingMembers,
    trainers,
    membershipPlans,
  } = useGymOwnerStore();

  const activePlans = React.useMemo(
    () => membershipPlans.filter((p) => p.isActive),
    [membershipPlans]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<CrmFilterTab>(initialFilter);
  const [selectedMember, setSelectedMember] = useState<GymMemberItem | null>(null);

  // Sub-modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [freezeModalMember, setFreezeModalMember] = useState<GymMemberItem | null>(null);
  const [renewModalMember, setRenewModalMember] = useState<GymMemberItem | null>(null);
  const [passModalMember, setPassModalMember] = useState<GymMemberItem | null>(null);

  React.useEffect(() => {
    if (visible && initialOpenAddModal) {
      setAddModalVisible(true);
    }
  }, [visible, initialOpenAddModal]);
  const [collectFeeModalVisible, setCollectFeeModalVisible] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);

  // Add Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanType>('MONTHLY_STANDARD');
  const [feeAmount, setFeeAmount] = useState('4500');
  const [paidAmount, setPaidAmount] = useState('4500');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [assignedTrainer, setAssignedTrainer] = useState('');
  const [lockerNumber, setLockerNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Collect Fee State
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('bKash');
  const [collectNotes, setCollectNotes] = useState('');

  // Filtered Members
  const ghostingMembers = useMemo(() => getGhostingMembers(7), [members, getGhostingMembers]);
  const ghostingIds = useMemo(() => new Set(ghostingMembers.map((g) => g.id)), [ghostingMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery) ||
        m.planTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (filterTab === 'ALL') return true;
      if (filterTab === 'GHOSTING') return ghostingIds.has(m.id);
      return m.status === filterTab;
    });
  }, [members, searchQuery, filterTab, ghostingIds]);

  const handleOpenAdd = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    const defaultPlan = activePlans[0];
    setSelectedPlan(defaultPlan?.type || defaultPlan?.id || 'MONTHLY_STANDARD');
    setFeeAmount(String(defaultPlan?.feeBdt || 4500));
    setPaidAmount(String(defaultPlan?.feeBdt || 4500));
    setLockerNumber('');
    setNotes('');
    setAddModalVisible(true);
  };

  const handleSaveMember = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please enter full name and phone number.');
      return;
    }

    const planObj = activePlans.find((p) => p.type === selectedPlan || p.id === selectedPlan) || activePlans[0];
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const end = new Date(today);
    end.setMonth(end.getMonth() + (planObj ? planObj.durationMonths : 1));
    const endDate = end.toISOString().split('T')[0];

    const fee = parseFloat(feeAmount) || (planObj ? planObj.feeBdt : 4500);
    const paid = parseFloat(paidAmount) || 0;

    const trainerObj = trainers.find((t) => t.id === assignedTrainer);

    await addMember(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        membershipPlan: selectedPlan,
        planTitle: planObj?.title || 'Standard Plan',
        startDate,
        endDate,
        totalFeeBdt: fee,
        paidAmountBdt: paid,
        dueAmountBdt: Math.max(0, fee - paid),
        status: paid === 0 ? 'UNPAID' : 'ACTIVE',
        assignedTrainerId: trainerObj?.id,
        assignedTrainerName: trainerObj?.name,
        lockerNumber: lockerNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      paid > 0
        ? {
            amount: paid,
            method: paymentMethod,
            notes: 'Enrollment payment',
          }
        : undefined
    );

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAddModalVisible(false);
  };

  const handleCollectFee = async () => {
    if (!selectedMember) return;
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    await collectMemberFee(selectedMember.id, amt, collectMethod, collectNotes);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCollectFeeModalVisible(false);
    // Refresh selected member state
    const updated = members.find((m) => m.id === selectedMember.id);
    if (updated) setSelectedMember(updated);
  };

  const handleSendWhatsApp = (member: GymMemberItem) => {
    const msg = generateWhatsAppDuesMessage(member);
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp. Please check if WhatsApp is installed.');
    });
  };

  const FILTER_TABS: { key: CrmFilterTab; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; bgLight: string }[] = [
    { key: 'ALL', label: 'All Members', icon: 'groups', color: '#00B4D8', bgLight: 'rgba(0, 180, 216, 0.12)' },
    { key: 'ACTIVE', label: 'Active', icon: 'check-circle', color: '#89FE00', bgLight: 'rgba(137, 254, 0, 0.14)' },
    { key: 'FROZEN', label: 'Frozen', icon: 'ac-unit', color: '#4DABF7', bgLight: 'rgba(77, 171, 247, 0.14)' },
    { key: 'GHOSTING', label: 'Ghosting (7d+)', icon: 'radar', color: '#FF922B', bgLight: 'rgba(255, 146, 43, 0.14)' },
    { key: 'EXPIRING_SOON', label: 'Expiring (7d)', icon: 'schedule', color: '#FFB800', bgLight: 'rgba(255, 184, 0, 0.14)' },
    { key: 'UNPAID', label: 'Overdue Dues', icon: 'payments', color: '#FA5252', bgLight: 'rgba(250, 82, 82, 0.14)' },
    { key: 'EXPIRED', label: 'Expired', icon: 'event-busy', color: '#868E96', bgLight: 'rgba(134, 142, 150, 0.14)' },
  ];

  const getCrmTabCount = (tabKey: CrmFilterTab) => {
    switch (tabKey) {
      case 'ALL':
        return members.length;
      case 'ACTIVE':
        return members.filter((m) => m.status === 'ACTIVE').length;
      case 'FROZEN':
        return members.filter((m) => m.status === 'FROZEN').length;
      case 'GHOSTING':
        return ghostingMembers.length;
      case 'EXPIRING_SOON':
        return members.filter((m) => m.status === 'EXPIRING_SOON').length;
      case 'UNPAID':
        return members.filter((m) => m.dueAmountBdt > 0).length;
      case 'EXPIRED':
        return members.filter((m) => m.status === 'EXPIRED').length;
      default:
        return 0;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Member Directory & CRM</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {members.length} Enrolled Athletes • {todayCheckInIds.length} Checked In Today
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenAdd}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="person-add-alt-1" size={13} color="#000" />
              </View>
              <Text style={styles.addBtnText}>New Member</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH & FILTERS */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="search" size={16} color={colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search by name, phone, locker, or plan..."
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
                style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(120, 120, 120, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="close" size={13} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* VECTOR STATUS TABS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
            {FILTER_TABS.map((tab) => {
              const active = filterTab === tab.key;
              const count = getCrmTabCount(tab.key);
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setFilterTab(tab.key);
                  }}
                  style={[
                    styles.tabPill,
                    active
                      ? { backgroundColor: tab.color, borderColor: tab.color }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  {/* Micro Icon Bubble */}
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: active ? 'rgba(0, 0, 0, 0.15)' : tab.bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MaterialIcons
                      name={tab.icon}
                      size={12}
                      color={active ? '#000' : tab.color}
                    />
                  </View>

                  <Text
                    style={[
                      styles.tabText,
                      { color: active ? '#000' : colors.textPrimary, fontFamily: active ? F.sansBold : F.sansMedium },
                    ]}>
                    {tab.label}
                  </Text>

                  {/* Count Bubble */}
                  <View
                    style={{
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 8,
                      backgroundColor: active ? 'rgba(0, 0, 0, 0.2)' : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    }}>
                    <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: active ? '#000' : colors.textSecondary }}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* MEMBER LIST */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(0, 180, 216, 0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 180, 216, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}>
                <MaterialIcons name="person-search" size={30} color="#00B4D8" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Members Found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Try adjusting your search query or active filter tab.
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => {
              const isCheckedIn = todayCheckInIds.includes(member.id);
              const hasDue = member.dueAmountBdt > 0;
              const isExpiring = member.status === 'EXPIRING_SOON';
              const isGhosting = ghostingIds.has(member.id);
              const isFrozen = member.status === 'FROZEN';

              return (
                <Pressable
                  key={member.id}
                  onPress={() => setSelectedMember(member)}
                  style={({ pressed }) => [
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
                      opacity: pressed ? 0.95 : 1,
                    },
                  ]}>
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        onClose();
                        router.push({
                          pathname: '/(app)/gym-member-detail',
                          params: { memberId: member.id },
                        });
                      }}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {/* AVATAR / INITIALS WITH GLOW RING */}
                      <View
                        style={[
                          styles.avatarWrap,
                          {
                            borderWidth: 1.5,
                            borderColor: isCheckedIn
                              ? '#89FE00'
                              : isFrozen
                              ? '#4DABF7'
                              : isGhosting
                              ? '#FF922B'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.08)',
                            position: 'relative',
                          },
                        ]}>
                        {member.avatarUrl ? (
                          <Image source={{ uri: member.avatarUrl }} style={[styles.avatarImg, { borderRadius: 19 }]} />
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
                                borderRadius: 19,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.avatarInitial,
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

                        {/* MICRO STATUS ORB */}
                        <View
                          style={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            borderWidth: 2,
                            borderColor: '#161D24',
                            backgroundColor: isFrozen
                              ? '#4DABF7'
                              : isCheckedIn
                              ? '#89FE00'
                              : isGhosting
                              ? '#FF922B'
                              : hasDue
                              ? '#FA5252'
                              : '#40C057',
                          }}
                        />
                      </View>

                      {/* DETAILS & VECTOR BADGES */}
                      <View style={[styles.memberMainInfo, { flex: 1 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <Text style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {member.fullName}
                          </Text>
                          {isFrozen ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, backgroundColor: 'rgba(77, 171, 247, 0.14)', borderWidth: 1, borderColor: 'rgba(77, 171, 247, 0.3)' }}>
                              <MaterialIcons name="ac-unit" size={9} color="#4DABF7" />
                              <Text style={{ color: '#4DABF7', fontSize: 8, fontFamily: F.monoBold }}>FROZEN</Text>
                            </View>
                          ) : isGhosting ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, backgroundColor: 'rgba(255, 146, 43, 0.14)', borderWidth: 1, borderColor: 'rgba(255, 146, 43, 0.35)' }}>
                              <MaterialIcons name="radar" size={9} color="#FF922B" />
                              <Text style={{ color: '#FF922B', fontSize: 8, fontFamily: F.monoBold }}>7D+ ABSENT</Text>
                            </View>
                          ) : isExpiring ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, backgroundColor: 'rgba(255, 184, 0, 0.14)', borderWidth: 1, borderColor: 'rgba(255, 184, 0, 0.35)' }}>
                              <MaterialIcons name="schedule" size={9} color="#FFB800" />
                              <Text style={{ color: '#FFB800', fontSize: 8, fontFamily: F.monoBold }}>EXPIRING</Text>
                            </View>
                          ) : null}

                          {member.lockerNumber ? (
                            <View style={[styles.lockerTag, { backgroundColor: colors.glassFill, flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                              <MaterialIcons name="lock" size={9} color={colors.textSecondary} />
                              <Text style={[styles.lockerText, { color: colors.textSecondary }]}>
                                {member.lockerNumber}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                          <MaterialIcons name="card-membership" size={11} color={colors.textMuted} />
                          <Text style={[styles.planSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {member.planTitle} • {member.lastCheckInDate ? `Last: ${member.lastCheckInDate}` : 'No check-in'}
                          </Text>
                        </View>

                        {member.assignedTrainerName ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <MaterialIcons name="sports" size={11} color="#89FE00" />
                            <Text style={[styles.trainerTag, { color: '#89FE00' }]}>
                              Coach {member.assignedTrainerName}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* CHECK-IN QUICK TOGGLE WITH VECTOR ICON */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={isFrozen}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        void toggleMemberCheckIn(member.id);
                      }}
                      style={[
                        styles.checkInBadge,
                        isFrozen
                          ? { backgroundColor: 'rgba(77, 171, 247, 0.1)', borderColor: 'rgba(77, 171, 247, 0.3)' }
                          : isCheckedIn
                          ? { backgroundColor: '#89FE00', borderColor: '#89FE00' }
                          : { backgroundColor: colors.glassFill, borderColor: colors.border },
                      ]}>
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          backgroundColor: isFrozen
                            ? 'rgba(77, 171, 247, 0.15)'
                            : isCheckedIn
                            ? 'rgba(0, 0, 0, 0.15)'
                            : 'rgba(120, 120, 120, 0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <MaterialIcons
                          name={isFrozen ? 'ac-unit' : isCheckedIn ? 'how-to-reg' : 'login'}
                          size={12}
                          color={isFrozen ? '#4DABF7' : isCheckedIn ? '#000' : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.checkInBadgeText,
                          { color: isFrozen ? '#4DABF7' : isCheckedIn ? '#000' : colors.textMuted },
                        ]}>
                        {isFrozen ? 'PAUSED' : isCheckedIn ? 'ON FLOOR' : 'CHECK IN'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* FINANCIAL & ACTION TRAY */}
                  <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border }]}>
                    {/* FULL WIDTH FINANCIAL STATUS ROW */}
                    <View style={styles.financialStatusRow}>
                      <View style={styles.finBadge}>
                        {hasDue ? (
                          <>
                            <MaterialIcons name="payments" size={13} color="#FA5252" />
                            <Text style={styles.dueAmountText}>
                              Due: ৳{member.dueAmountBdt.toLocaleString()}
                            </Text>
                          </>
                        ) : isFrozen ? (
                          <>
                            <MaterialIcons name="pause-circle-outline" size={13} color="#4DABF7" />
                            <Text style={styles.frozenStatusText}>
                              Paused ({member.currentFreeze?.freezeStartDate || 'recent'})
                            </Text>
                          </>
                        ) : (
                          <>
                            <MaterialIcons name="check-circle" size={13} color="#40C057" />
                            <Text style={styles.paidStatusText}>
                              Paid Full (৳{member.totalFeeBdt.toLocaleString()})
                            </Text>
                          </>
                        )}
                      </View>

                      {member.endDate ? (
                        <View style={styles.validityBadge}>
                          <MaterialIcons name="event" size={12} color={colors.textMuted} />
                          <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                            Exp: {member.endDate}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* ACTION BUTTONS TRAY */}
                    <View style={styles.actionCluster}>
                      {isGhosting && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            const msg = generateWhatsAppReEngagementMessage(member);
                            const cleanPhone = member.phone.replace(/[^0-9]/g, '');
                            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
                            Linking.openURL(url).catch(() => {
                              Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
                            });
                          }}
                          style={[styles.miniActionBtn, { backgroundColor: '#FF922B' }]}>
                          <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="campaign" size={11} color="#FFF" />
                          </View>
                          <Text style={[styles.miniActionText, { color: '#FFF' }]}>Re-Engage</Text>
                        </TouchableOpacity>
                      )}

                      {hasDue ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendWhatsApp(member)}
                          style={[styles.miniActionBtn, { backgroundColor: '#25D366' }]}>
                          <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="chat" size={11} color="#FFF" />
                          </View>
                          <Text style={[styles.miniActionText, { color: '#FFF' }]}>WhatsApp Due</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedMember(member);
                          setCollectAmount(member.dueAmountBdt > 0 ? String(member.dueAmountBdt) : '4500');
                          setCollectFeeModalVisible(true);
                        }}
                        style={[styles.miniActionBtn, { backgroundColor: colors.primaryContainer }]}>
                        <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="payments" size={11} color={colors.onPrimaryContainer} />
                        </View>
                        <Text style={[styles.miniActionText, { color: colors.onPrimaryContainer }]}>
                          {hasDue ? 'Collect' : 'Bill'}
                        </Text>
                      </TouchableOpacity>

                      {/* ID PASS BUTTON */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setPassModalMember(member)}
                        style={[
                          styles.miniActionBtn,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                        ]}>
                        <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(137, 254, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="qr-code-2" size={11} color="#89FE00" />
                        </View>
                        <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>ID Pass</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* ----------------- MEMBER DETAIL MODAL ----------------- */}
        {selectedMember && (
          <Modal
            visible={!!selectedMember && !collectFeeModalVisible && !renewModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setSelectedMember(null)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                <View style={styles.modalSheetHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(0, 180, 216, 0.14)',
                        borderWidth: 1,
                        borderColor: 'rgba(0, 180, 216, 0.3)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <MaterialIcons name="account-circle" size={24} color="#00B4D8" />
                    </View>
                    <View>
                      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                        {selectedMember.fullName}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>
                        Member Dossier & Roster Profile
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedMember(null)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                  {/* SUMMARY PILLS */}
                  <View style={styles.dossierRow}>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="card-membership" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>PLAN</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: colors.textPrimary }]}>
                        {selectedMember.planTitle}
                      </Text>
                    </View>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="phone" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>PHONE</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: colors.textPrimary }]}>
                        {selectedMember.phone}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dossierRow}>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="schedule" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>EXPIRY</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: selectedMember.dueAmountBdt > 0 ? '#FA5252' : colors.textPrimary }]}>
                        {selectedMember.endDate}
                      </Text>
                    </View>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="payments" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>DUE BALANCE</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: selectedMember.dueAmountBdt > 0 ? '#FA5252' : '#40C057' }]}>
                        ৳{selectedMember.dueAmountBdt.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dossierRow}>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="monitor-weight" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>WEIGHT</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: colors.textPrimary }]}>
                        {selectedMember.weightKg ? `${selectedMember.weightKg} kg` : (selectedMember.bodyMeasurements?.[0]?.weightKg ? `${selectedMember.bodyMeasurements[0].weightKg} kg` : 'Not Set')}
                      </Text>
                    </View>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="cake" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>BIRTHDAY</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: colors.textPrimary }]}>
                        {selectedMember.dateOfBirth || 'Not Set'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dossierRow}>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="verified" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>ADMISSION FEE</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: (selectedMember.admissionFeeBdt ?? 0) > 0 ? colors.textPrimary : '#40C057' }]}>
                        {(selectedMember.admissionFeeBdt ?? 0) > 0 ? `৳${selectedMember.admissionFeeBdt?.toLocaleString()}` : 'Waived (৳0)'}
                      </Text>
                    </View>
                    <View style={[styles.dossierPill, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="account-balance-wallet" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>TOTAL BILLING</Text>
                      </View>
                      <Text style={[styles.pillValue, { color: colors.primary }]}>
                        ৳{selectedMember.totalFeeBdt.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* PAYMENT HISTORY */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 6 }}>
                    <MaterialIcons name="receipt-long" size={16} color={colors.primary} />
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 0, marginBottom: 0 }]}>
                      Payment Receipts ({selectedMember.paymentHistory.length})
                    </Text>
                  </View>
                  {selectedMember.paymentHistory.map((pay) => (
                    <View key={pay.id} style={[styles.payRow, { borderBottomColor: colors.border }]}>
                      <View>
                        <Text style={{ fontFamily: F.sansBold, color: colors.textPrimary, fontSize: 13 }}>
                          ৳{pay.amountBdt.toLocaleString()} via {pay.method}
                        </Text>
                        <Text style={{ fontFamily: F.mono, color: colors.textSecondary, fontSize: 11 }}>
                          {pay.date} • {pay.invoiceNumber}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: 'rgba(64, 192, 87, 0.15)' }}>
                        <MaterialIcons name="check" size={10} color="#40C057" />
                        <Text style={{ fontFamily: F.monoBold, color: '#40C057', fontSize: 10 }}>PAID</Text>
                      </View>
                    </View>
                  ))}

                  {/* FREEZE NOTICE BANNER IF FROZEN */}
                  {selectedMember.status === 'FROZEN' && (
                    <View
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: 'rgba(77, 171, 247, 0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(77, 171, 247, 0.3)',
                        marginBottom: 12,
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialIcons name="ac-unit" size={16} color="#4DABF7" />
                        <Text style={{ fontFamily: F.sansBold, fontSize: 12, color: '#4DABF7' }}>
                          Membership is Currently Frozen
                        </Text>
                      </View>
                      <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        Paused on {selectedMember.currentFreeze?.freezeStartDate || 'recent'}
                        {selectedMember.currentFreeze?.reason ? ` • Reason: ${selectedMember.currentFreeze.reason}` : ''}
                      </Text>
                    </View>
                  )}

                  {/* ACTION BUTTONS */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSendWhatsApp(selectedMember)}
                      style={[styles.fullActionBtn, { backgroundColor: '#25D366' }]}>
                      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="chat" size={14} color="#FFF" />
                      </View>
                      <Text style={{ color: '#FFF', fontFamily: F.sansBold, fontSize: 13 }}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setCollectAmount(selectedMember.dueAmountBdt > 0 ? String(selectedMember.dueAmountBdt) : '4500');
                        setCollectFeeModalVisible(true);
                      }}
                      style={[styles.fullActionBtn, { backgroundColor: colors.primary }]}>
                      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="payments" size={14} color="#000" />
                      </View>
                      <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 13 }}>
                        Collect Fee
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* FREEZE / RESUME FULL BUTTON */}
                  <View style={{ marginTop: 10 }}>
                    {selectedMember.status === 'FROZEN' ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setFreezeModalMember(selectedMember)}
                        style={[styles.fullActionBtn, { backgroundColor: '#40C057' }]}>
                        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="play-arrow" size={14} color="#FFF" />
                        </View>
                        <Text style={{ color: '#FFF', fontFamily: F.sansBold, fontSize: 13 }}>
                          Resume Membership & Extend Expiry
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setFreezeModalMember(selectedMember)}
                        style={[
                          styles.fullActionBtn,
                          {
                            backgroundColor: 'rgba(77, 171, 247, 0.12)',
                            borderWidth: 1,
                            borderColor: 'rgba(77, 171, 247, 0.35)',
                          },
                        ]}>
                        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(77, 171, 247, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="pause" size={14} color="#4DABF7" />
                        </View>
                        <Text style={{ color: '#4DABF7', fontFamily: F.sansBold, fontSize: 13 }}>
                          Freeze / Pause Membership
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* RENEW / UPGRADE PLAN FULL BUTTON */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setRenewModalMember(selectedMember)}
                      style={[
                        styles.fullActionBtn,
                        {
                          backgroundColor: 'rgba(255, 184, 0, 0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 184, 0, 0.4)',
                          marginTop: 8,
                        },
                      ]}>
                      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(255, 184, 0, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="autorenew" size={14} color="#FFB800" />
                      </View>
                      <Text style={{ color: '#FFB800', fontFamily: F.sansBold, fontSize: 13 }}>
                        Renew / Upgrade Plan Package
                      </Text>
                    </TouchableOpacity>

                    {/* DIGITAL ID PASS FULL BUTTON */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPassModalMember(selectedMember)}
                      style={[
                        styles.fullActionBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
                          borderWidth: 1,
                          borderColor: colors.border,
                          marginTop: 8,
                        },
                      ]}>
                      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(137, 254, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="qr-code-2" size={14} color="#89FE00" />
                      </View>
                      <Text style={{ color: colors.textPrimary, fontFamily: F.sansBold, fontSize: 13 }}>
                        View Digital Member ID Pass
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* ----------------- COLLECT FEE MODAL ----------------- */}
        <Modal
          visible={collectFeeModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setCollectFeeModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Collect Fee — {selectedMember?.fullName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 14 }}>
                Current Due: ৳{selectedMember?.dueAmountBdt.toLocaleString()}
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT (BDT)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                value={collectAmount}
                onChangeText={setCollectAmount}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>PAYMENT METHOD</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {(['bKash', 'Nagad', 'Cash', 'Card', 'Bank_Transfer'] as PaymentMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setCollectMethod(m)}
                    style={[
                      styles.methodPill,
                      collectMethod === m
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.glassFill, borderColor: colors.border },
                    ]}>
                    <Text style={{ color: collectMethod === m ? '#000' : colors.textPrimary, fontSize: 11, fontFamily: F.sansBold }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Received by reception staff"
                placeholderTextColor={colors.textMuted}
                value={collectNotes}
                onChangeText={setCollectNotes}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity
                  onPress={() => setCollectFeeModalVisible(false)}
                  style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: F.sansBold }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCollectFee}
                  style={[styles.sheetSubmitBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#000', fontFamily: F.sansBold }}>Save & Issue Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ----------------- ADD MEMBER MODAL ----------------- */}
        <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModalVisible(false)}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Enroll New Athlete / Member</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Mahfuzur Rahman"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>PHONE NUMBER *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. +880 1711-223344"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>MEMBERSHIP PLAN</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {activePlans.map((plan) => {
                  const planKey = plan.type || plan.id;
                  const isSel = selectedPlan === planKey || selectedPlan === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedPlan(planKey);
                        setFeeAmount(String(plan.feeBdt));
                        setPaidAmount(String(plan.feeBdt));
                      }}
                      style={[
                        styles.planOptionCard,
                        isSel
                          ? { backgroundColor: C.primaryAlpha20, borderColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}>
                      <View>
                        <Text style={{ fontFamily: F.sansBold, color: isSel ? colors.primary : colors.textPrimary, fontSize: 13 }}>
                          {plan.title}
                        </Text>
                        <Text style={{ fontFamily: F.sans, color: colors.textSecondary, fontSize: 11 }}>
                          {plan.durationMonths === 1 ? '1 Month' : `${plan.durationMonths} Months`} duration
                        </Text>
                      </View>
                      <Text style={{ fontFamily: F.monoBold, color: isSel ? colors.primary : colors.textPrimary, fontSize: 14 }}>
                        ৳{plan.feeBdt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TOTAL FEE (BDT)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={feeAmount}
                    onChangeText={setFeeAmount}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INITIAL PAID (BDT)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>LOCKER NUMBER (OPTIONAL)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. L-12"
                placeholderTextColor={colors.textMuted}
                value={lockerNumber}
                onChangeText={setLockerNumber}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveMember}
                style={[styles.saveMemberBtn, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={20} color="#000" />
                <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 15 }}>
                  Enroll & Save Member
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* ----------------- FREEZE / RESUME MODAL ----------------- */}
        <GymMemberFreezeModal
          visible={!!freezeModalMember}
          member={freezeModalMember}
          onClose={() => setFreezeModalMember(null)}
          onSuccess={() => {
            if (selectedMember) {
              const u = members.find((m) => m.id === selectedMember.id);
              if (u) setSelectedMember(u);
            }
          }}
        />

        {/* ----------------- RENEW / UPGRADE MODAL ----------------- */}
        <GymMemberRenewUpgradeModal
          visible={!!renewModalMember}
          member={renewModalMember}
          onClose={() => setRenewModalMember(null)}
          onSuccess={() => {
            if (selectedMember) {
              const u = members.find((m) => m.id === selectedMember.id);
              if (u) setSelectedMember(u);
            }
          }}
        />

        {/* ----------------- DIGITAL ID PASS MODAL ----------------- */}
        <GymMemberIdPassModal
          visible={!!passModalMember}
          member={passModalMember}
          onClose={() => setPassModalMember(null)}
        />
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  addBtnText: {
    color: '#000',
    fontFamily: F.sansBold,
    fontSize: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.sans,
  },
  filterTabs: {
    gap: 8,
    paddingVertical: 4,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 11,
  },
  listContent: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  memberCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  avatarInitial: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  memberMainInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  lockerTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lockerText: {
    fontSize: 10,
    fontFamily: F.mono,
  },
  planSubtitle: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  trainerTag: {
    fontSize: 11,
    fontFamily: F.sansSemiBold,
  },
  checkInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkInBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  financialStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  finBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  validityText: {
    fontSize: 10,
    fontFamily: F.mono,
  },
  dueAmountText: {
    color: '#FA5252',
    fontFamily: F.sansBold,
    fontSize: 11,
  },
  frozenStatusText: {
    color: '#4DABF7',
    fontFamily: F.sansBold,
    fontSize: 11,
  },
  paidStatusText: {
    color: '#40C057',
    fontFamily: F.sansBold,
    fontSize: 11,
  },
  actionCluster: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  miniActionText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    borderRadius: 20,
    padding: 20,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  dossierRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  dossierPill: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  pillLabel: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  pillValue: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: F.sansBold,
    marginTop: 10,
    marginBottom: 6,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  fullActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: F.sans,
  },
  formInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: F.sans,
  },
  methodPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubmitBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
});
