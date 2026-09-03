import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { PTPackageEnrollment, PTSessionStatus } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
  initialPackageId?: string;
};

const WORKOUT_FOCUS_PRESETS = [
  'Chest & Triceps Hypertrophy',
  'Back & Biceps Pull Power',
  'Legs Quad & Hamstring Volume',
  'Shoulders & 3D Delts',
  'Arms & Calves Super-Sets',
  'Functional HIIT & Conditioning',
  'Core & Postural Mobility',
];

export function GymPTPunchCardModal({ visible, onClose, initialPackageId }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    ptPackages,
    members,
    trainers,
    gymProfile,
    punchPTSession,
    enrollMemberPTPackage,
    getTrainerPTCommissionSummaries,
    generateWhatsAppPTSessionSlip,
    generateWhatsAppPTRenewalOffer,
  } = useGymOwnerStore();

  const activePackages = (ptPackages || []).filter((p) => p.status === 'ACTIVE');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    initialPackageId || (activePackages.length > 0 ? activePackages[0].id : '')
  );

  const [activeTab, setActiveTab] = useState<'CLIENTS' | 'COMMISSIONS'>('CLIENTS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterNearExpiry, setFilterNearExpiry] = useState<boolean>(false);

  // Sub-modal: Punch Session
  const [punchModalVisible, setPunchModalVisible] = useState<boolean>(false);
  const [selectedFocus, setSelectedFocus] = useState<string>(WORKOUT_FOCUS_PRESETS[0]);
  const [punchNotes, setPunchNotes] = useState<string>('');
  const [punchStatus, setPunchStatus] = useState<PTSessionStatus>('COMPLETED');
  const [substituteTrainerName, setSubstituteTrainerName] = useState<string>('');

  // Sub-modal: Enroll New PT Package
  const [enrollModalVisible, setEnrollModalVisible] = useState<boolean>(false);
  const [newMemberId, setNewMemberId] = useState<string>(members.length > 0 ? members[0].id : '');
  const [newTrainerId, setNewTrainerId] = useState<string>(trainers.length > 0 ? trainers[0].id : '');
  const [newPackageSessions, setNewPackageSessions] = useState<number>(12);
  const [newPackagePrice, setNewPackagePrice] = useState<string>('12000');
  const [newCommissionPercent, setNewCommissionPercent] = useState<string>('30');

  const currentPkg = (ptPackages || []).find((p) => p.id === selectedPackageId) || activePackages[0];
  const commissionSummaries = getTrainerPTCommissionSummaries();

  const filteredPackages = (ptPackages || []).filter((p) => {
    if (filterNearExpiry && p.totalSessions - p.completedSessions > 2) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.memberName.toLowerCase().includes(q) ||
      p.assignedTrainerName.toLowerCase().includes(q) ||
      p.memberPhone.includes(q)
    );
  });

  const remainingSessions = currentPkg ? Math.max(0, currentPkg.totalSessions - currentPkg.completedSessions) : 0;
  const isRenewalDue = remainingSessions <= 2;
  const totalCommissionEarned = currentPkg
    ? currentPkg.completedSessions * currentPkg.commissionPerSessionBdt
    : 0;

  const handleOpenPunchModal = () => {
    if (!currentPkg) return;
    if (currentPkg.completedSessions >= currentPkg.totalSessions) {
      Alert.alert('Package Completed', 'All sessions have been punched for this package.');
      return;
    }
    setSelectedFocus(WORKOUT_FOCUS_PRESETS[0]);
    setPunchNotes('');
    setPunchStatus('COMPLETED');
    setSubstituteTrainerName('');
    setPunchModalVisible(true);
  };

  const handleConfirmPunch = async () => {
    if (!currentPkg) return;

    try {
      const punch = await punchPTSession(currentPkg.id, {
        workoutFocus: selectedFocus,
        notes: punchNotes.trim() || undefined,
        status: punchStatus,
        substituteTrainerName: substituteTrainerName.trim() || undefined,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      setPunchModalVisible(false);

      Alert.alert(
        '🥊 Session Punched!',
        `Session #${punch.sessionNumber} logged with ${punch.conductedByTrainerName}. Commission of ৳${punch.trainerCommissionBdt} credited. Send WhatsApp slip?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Send WhatsApp Slip',
            onPress: () => handleSendWhatsAppSlip(punch.sessionNumber),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to punch session.');
    }
  };

  const handleSendWhatsAppSlip = (sessionNum?: number) => {
    if (!currentPkg) return;
    const msg = generateWhatsAppPTSessionSlip(currentPkg.id, sessionNum);
    const cleanPhone = currentPkg.memberPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Session Slip Ready', msg);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
  };

  const handleSendRenewalOffer = () => {
    if (!currentPkg) return;
    const msg = generateWhatsAppPTRenewalOffer(currentPkg.id);
    const cleanPhone = currentPkg.memberPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Renewal Offer Ready', msg);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
  };

  const handleEnrollPackage = async () => {
    const member = members.find((m) => m.id === newMemberId);
    const trainer = trainers.find((t) => t.id === newTrainerId);
    const price = parseFloat(newPackagePrice);
    const commPct = parseFloat(newCommissionPercent);

    if (!member || !trainer || isNaN(price) || price <= 0 || isNaN(commPct) || commPct <= 0) {
      Alert.alert('Invalid Input', 'Please check member, trainer, price, and commission %');
      return;
    }

    const trainerCommissionTotal = Math.round((price * commPct) / 100);
    const commissionPerSession = Math.round(trainerCommissionTotal / newPackageSessions);

    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + (newPackageSessions === 12 ? 45 : newPackageSessions === 24 ? 75 : 100));

    const newPkg = await enrollMemberPTPackage({
      memberId: member.id,
      memberName: member.fullName,
      memberPhone: member.phone,
      assignedTrainerId: trainer.id,
      assignedTrainerName: trainer.name,
      packageTitle: `${newPackageSessions}-Session Elite Transformation`,
      totalSessions: newPackageSessions,
      packagePriceBdt: price,
      trainerCommissionTotalBdt: trainerCommissionTotal,
      commissionPerSessionBdt: commissionPerSession,
      startDate: now.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
    });

    setSelectedPackageId(newPkg.id);
    setEnrollModalVisible(false);
    Alert.alert('PT Package Enrolled! 🥊', `Assigned to ${trainer.name} for ${member.fullName}.`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
              <MaterialIcons name="fitness-center" size={22} color="#FF6B6B" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                PT Punch-Card & Commission Hub
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Zero-Dispute Session Governance & Auto Payroll
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* TABS (CLIENTS VS TRAINER COMMISSIONS) */}
        <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('CLIENTS')}
            style={[
              styles.tabBtn,
              activeTab === 'CLIENTS' && { borderBottomColor: '#FF6B6B', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="people"
              size={18}
              color={activeTab === 'CLIENTS' ? '#FF6B6B' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'CLIENTS' ? '#FF6B6B' : colors.textSecondary },
              ]}>
              Active PT Clients ({activePackages.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('COMMISSIONS')}
            style={[
              styles.tabBtn,
              activeTab === 'COMMISSIONS' && { borderBottomColor: '#FF6B6B', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="account-balance-wallet"
              size={18}
              color={activeTab === 'COMMISSIONS' ? '#FF6B6B' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'COMMISSIONS' ? '#FF6B6B' : colors.textSecondary },
              ]}>
              Trainer Commissions
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'CLIENTS' ? (
          <>
            {/* CLIENT SELECTOR BAR */}
            <View style={[styles.selectorBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.filterTabsRow}>
                <TouchableOpacity
                  onPress={() => setFilterNearExpiry(false)}
                  style={[
                    styles.filterTab,
                    !filterNearExpiry && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}>
                  <Text style={[styles.filterTabText, { color: !filterNearExpiry ? '#FFF' : colors.textSecondary }]}>
                    All Active ({activePackages.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFilterNearExpiry(true)}
                  style={[
                    styles.filterTab,
                    filterNearExpiry && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
                  ]}>
                  <Text style={[styles.filterTabText, { color: filterNearExpiry ? '#FFF' : '#FF6B6B' }]}>
                    🔥 Renewal Due (≤2 left)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setEnrollModalVisible(true)}
                  style={[styles.enrollActionPill, { backgroundColor: 'rgba(64, 192, 87, 0.15)', borderColor: '#40C057' }]}>
                  <MaterialIcons name="add" size={14} color="#40C057" />
                  <Text style={{ fontSize: 11, fontFamily: F.bold, color: '#40C057' }}>New PT Client</Text>
                </TouchableOpacity>
              </View>

              {/* Client Horizontal Pills Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.memberPillsScroll}>
                {filteredPackages.map((p) => {
                  const isSelected = p.id === currentPkg?.id;
                  const isCompleted = p.completedSessions >= p.totalSessions;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedPackageId(p.id);
                      }}
                      style={[
                        styles.memberPill,
                        {
                          backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.15)' : colors.background,
                          borderColor: isSelected ? '#FF6B6B' : colors.border,
                        },
                      ]}>
                      <View style={[styles.pillAvatar, { backgroundColor: isCompleted ? '#40C057' : '#FF6B6B' }]}>
                        <Text style={styles.pillAvatarText}>{p.memberName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={[styles.pillName, { color: isSelected ? '#FF6B6B' : colors.textPrimary }]}>
                          {p.memberName}
                        </Text>
                        <Text style={[styles.pillSub, { color: colors.textSecondary }]}>
                          Coach: {p.assignedTrainerName.split(' ')[0]} • {p.completedSessions}/{p.totalSessions}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* MAIN CONTENT AREA */}
            <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
              {currentPkg ? (
                <>
                  {/* SELECTED CLIENT CARD */}
                  <View style={[styles.clientHeroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.clientMetaRow}>
                      <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>{currentPkg.memberName.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.clientNameText, { color: colors.textPrimary }]}>
                          {currentPkg.memberName}
                        </Text>
                        <Text style={[styles.clientPhoneText, { color: colors.textSecondary }]}>
                          📱 {currentPkg.memberPhone} • Coach: {currentPkg.assignedTrainerName}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: F.monoBold, color: '#FF6B6B', marginTop: 2 }}>
                          {currentPkg.packageTitle}
                        </Text>
                      </View>
                    </View>

                    {/* RENEWAL DUE BANNER */}
                    {isRenewalDue && (
                      <View style={[styles.renewalBanner, { backgroundColor: 'rgba(255, 184, 0, 0.15)', borderColor: 'rgba(255, 184, 0, 0.4)' }]}>
                        <MaterialIcons name="stars" size={20} color="#FFB800" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontFamily: F.bold, color: '#FFB800' }}>
                            Package Finishing! Only {remainingSessions} Session{remainingSessions > 1 ? 's' : ''} Left
                          </Text>
                          <Text style={{ fontSize: 10, fontFamily: F.regular, color: colors.textSecondary }}>
                            Dispatch the renewal discount pass now to prevent gap in workouts.
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={handleSendRenewalOffer}
                          style={styles.sendRenewalMiniBtn}>
                          <Text style={styles.sendRenewalMiniBtnText}>Send Offer</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* TACTILE VISUAL STAMP PUNCH-CARD MATRIX */}
                    <View style={[styles.stampMatrixCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <View style={styles.stampHeaderRow}>
                        <Text style={[styles.stampMatrixHeading, { color: colors.textPrimary }]}>
                          🎟️ Digital Punch-Card Matrix
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: F.monoBold, color: '#40C057' }}>
                          {currentPkg.completedSessions} of {currentPkg.totalSessions} Completed
                        </Text>
                      </View>

                      {/* Visual Stamp Circles Grid */}
                      <View style={styles.stampsGrid}>
                        {Array.from({ length: currentPkg.totalSessions }).map((_, index) => {
                          const sessionNum = index + 1;
                          const isPunched = sessionNum <= currentPkg.completedSessions;
                          const isNext = sessionNum === currentPkg.completedSessions + 1;

                          return (
                            <View
                              key={sessionNum}
                              style={[
                                styles.stampCircle,
                                {
                                  backgroundColor: isPunched
                                    ? 'rgba(64, 192, 87, 0.15)'
                                    : isNext
                                    ? 'rgba(255, 107, 107, 0.15)'
                                    : colors.surface,
                                  borderColor: isPunched
                                    ? '#40C057'
                                    : isNext
                                    ? '#FF6B6B'
                                    : colors.border,
                                },
                              ]}>
                              {isPunched ? (
                                <>
                                  <MaterialIcons name="check" size={16} color="#40C057" />
                                  <Text style={styles.stampNumberPunched}>#{sessionNum}</Text>
                                </>
                              ) : isNext ? (
                                <>
                                  <Text style={[styles.stampNumberNext, { color: '#FF6B6B' }]}>#{sessionNum}</Text>
                                  <Text style={styles.stampNextTag}>NEXT</Text>
                                </>
                              ) : (
                                <Text style={[styles.stampNumberPending, { color: colors.textSecondary }]}>
                                  #{sessionNum}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* KPI CARDS ROW */}
                    <View style={styles.kpiRow}>
                      <View style={[styles.kpiCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Completed</Text>
                        <Text style={[styles.kpiValue, { color: '#40C057' }]}>
                          {currentPkg.completedSessions} / {currentPkg.totalSessions}
                        </Text>
                      </View>

                      <View style={[styles.kpiCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Remaining</Text>
                        <Text style={[styles.kpiValue, { color: remainingSessions <= 2 ? '#FF6B6B' : colors.textPrimary }]}>
                          {remainingSessions} Classes
                        </Text>
                      </View>

                      <View style={[styles.kpiCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Commission</Text>
                        <Text style={[styles.kpiValue, { color: '#339AF0' }]}>
                          ৳{totalCommissionEarned.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 9, fontFamily: F.regular, color: colors.textSecondary }}>
                          ৳{currentPkg.commissionPerSessionBdt}/session
                        </Text>
                      </View>
                    </View>

                    {/* PRIMARY ACTION BUTTONS */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleOpenPunchModal}
                        disabled={currentPkg.completedSessions >= currentPkg.totalSessions}
                        style={[
                          styles.primaryPunchBtn,
                          {
                            backgroundColor:
                              currentPkg.completedSessions >= currentPkg.totalSessions
                                ? colors.border
                                : '#FF6B6B',
                          },
                        ]}>
                        <MaterialIcons name="touch-app" size={18} color="#FFF" />
                        <Text style={styles.primaryPunchBtnText}>
                          {currentPkg.completedSessions >= currentPkg.totalSessions
                            ? 'Package Finished'
                            : `Punch Session #${currentPkg.completedSessions + 1}`}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleSendWhatsAppSlip()}
                        style={[styles.secondarySlipBtn, { backgroundColor: '#25D366' }]}>
                        <MaterialIcons name="chat" size={18} color="#FFF" />
                        <Text style={styles.secondarySlipBtnText}>WhatsApp Slip</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SESSION HISTORY TIMELINE */}
                  <View style={styles.historySection}>
                    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                      📋 Session Workout History ({currentPkg.history.length})
                    </Text>

                    {currentPkg.history.length === 0 ? (
                      <View style={styles.emptyHistoryWrap}>
                        <Text style={{ color: colors.textSecondary }}>
                          No sessions logged yet. Tap "Punch Session #1" after the first workout.
                        </Text>
                      </View>
                    ) : (
                      currentPkg.history
                        .slice()
                        .reverse()
                        .map((punch, index) => {
                          const isLatest = index === 0;
                          return (
                            <View
                              key={punch.id}
                              style={[
                                styles.punchHistoryCard,
                                {
                                  backgroundColor: colors.surface,
                                  borderColor: isLatest ? '#40C057' : colors.border,
                                },
                              ]}>
                              <View style={styles.punchCardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <View style={[styles.sessionNumBadge, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
                                    <Text style={styles.sessionNumBadgeText}>#{punch.sessionNumber}</Text>
                                  </View>
                                  <Text style={[styles.punchCardDate, { color: colors.textPrimary }]}>
                                    {punch.date} ({punch.time})
                                  </Text>
                                </View>
                                <View style={styles.commissionPill}>
                                  <Text style={styles.commissionPillText}>+৳{punch.trainerCommissionBdt}</Text>
                                </View>
                              </View>

                              <Text style={[styles.punchFocusText, { color: colors.textPrimary }]}>
                                🎯 {punch.workoutFocus || 'Strength Training'}
                              </Text>

                              <View style={styles.punchCardFooter}>
                                <Text style={[styles.punchCoachName, { color: colors.textSecondary }]}>
                                  👤 Trainer: {punch.conductedByTrainerName}
                                </Text>
                                {punch.notes && (
                                  <Text style={[styles.punchNotesText, { color: colors.textPrimary }]}>
                                    "{punch.notes}"
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.emptyHistoryWrap}>
                  <Text style={{ color: colors.textSecondary }}>No PT Packages active.</Text>
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          /* TRAINER COMMISSION PAYROLL TAB */
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.commissionSummaryHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="monetization-on" size={28} color="#FFB800" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.commissionHeroTitle, { color: colors.textPrimary }]}>
                  Trainer PT Commission Payroll
                </Text>
                <Text style={[styles.commissionHeroSub, { color: colors.textSecondary }]}>
                  Commissions credited automatically per punched session
                </Text>
              </View>
            </View>

            {commissionSummaries.map((summary) => (
              <View
                key={summary.trainerId}
                style={[styles.trainerCommissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.trainerHeaderRow}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>{summary.trainerName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientNameText, { color: colors.textPrimary }]}>
                      {summary.trainerName}
                    </Text>
                    <Text style={[styles.clientPhoneText, { color: colors.textSecondary }]}>
                      Active Clients: {summary.totalActivePTPackages} Athletes
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontFamily: F.bold, color: '#40C057' }}>
                      ৳{summary.totalCommissionEarnedBdt.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: F.regular, color: colors.textSecondary }}>
                      Earned This Month
                    </Text>
                  </View>
                </View>

                <View style={styles.commissionStatsRow}>
                  <View style={[styles.commStatBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.commStatLabel, { color: colors.textSecondary }]}>Sessions Done</Text>
                    <Text style={[styles.commStatVal, { color: colors.textPrimary }]}>
                      {summary.totalSessionsConductedThisMonth} Classes
                    </Text>
                  </View>

                  <View style={[styles.commStatBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.commStatLabel, { color: colors.textSecondary }]}>Projected Full Payout</Text>
                    <Text style={[styles.commStatVal, { color: '#339AF0' }]}>
                      ৳{summary.projectedCommissionBdt.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* PUNCH SESSION SUB-MODAL */}
        <Modal
          visible={punchModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPunchModalVisible(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>
                    Punch Session #{currentPkg ? currentPkg.completedSessions + 1 : 1}
                  </Text>
                  <Text style={[styles.subModalSub, { color: colors.textSecondary }]}>
                    Client: {currentPkg?.memberName} • Coach: {currentPkg?.assignedTrainerName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPunchModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Workout Focus Quick Presets */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 6 }]}>
                  Workout Focus Tag *
                </Text>
                <View style={styles.presetsWrap}>
                  {WORKOUT_FOCUS_PRESETS.map((preset) => {
                    const isSelected = selectedFocus === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => setSelectedFocus(preset)}
                        style={[
                          styles.presetPill,
                          {
                            backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.15)' : colors.background,
                            borderColor: isSelected ? '#FF6B6B' : colors.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.presetPillText,
                            { color: isSelected ? '#FF6B6B' : colors.textPrimary },
                          ]}>
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Substitute Trainer (Optional) */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Substitute Coach (Optional)
                  </Text>
                  <TextInput
                    value={substituteTrainerName}
                    onChangeText={setSubstituteTrainerName}
                    placeholder={`Default: ${currentPkg?.assignedTrainerName}`}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  />
                </View>

                {/* Coach Notes */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Workout Praise & Notes
                  </Text>
                  <TextInput
                    value={punchNotes}
                    onChangeText={setPunchNotes}
                    placeholder="e.g. 80kg bench press PR! Great mind-muscle connection."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={2}
                    style={[styles.textInput, { height: 60, textAlignVertical: 'top', backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  />
                </View>
              </ScrollView>

              {/* CONFIRM PUNCH BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmPunch}
                style={[styles.submitPunchBtn, { backgroundColor: '#FF6B6B' }]}>
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.submitPunchBtnText}>Confirm Session Punch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ENROLL NEW PT PACKAGE SUB-MODAL */}
        <Modal
          visible={enrollModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEnrollModalVisible(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>
                    Enroll New PT Client
                  </Text>
                  <Text style={[styles.subModalSub, { color: colors.textSecondary }]}>
                    Create Digital Punch-Card & Commission Ledger
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEnrollModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Select Member */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Member</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setNewMemberId(m.id)}
                      style={[
                        styles.selectOptionPill,
                        {
                          backgroundColor: newMemberId === m.id ? 'rgba(64, 192, 87, 0.15)' : colors.background,
                          borderColor: newMemberId === m.id ? '#40C057' : colors.border,
                        },
                      ]}>
                      <Text style={{ fontSize: 11, fontFamily: F.bold, color: newMemberId === m.id ? '#40C057' : colors.textPrimary }}>
                        {m.fullName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Select Trainer */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                  Assign Personal Trainer
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {trainers.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setNewTrainerId(t.id)}
                      style={[
                        styles.selectOptionPill,
                        {
                          backgroundColor: newTrainerId === t.id ? 'rgba(255, 107, 107, 0.15)' : colors.background,
                          borderColor: newTrainerId === t.id ? '#FF6B6B' : colors.border,
                        },
                      ]}>
                      <Text style={{ fontSize: 11, fontFamily: F.bold, color: newTrainerId === t.id ? '#FF6B6B' : colors.textPrimary }}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Session Tier Buttons */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                  Package Tier
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
                  {[12, 24, 36].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => {
                        setNewPackageSessions(num);
                        if (num === 12) setNewPackagePrice('12000');
                        if (num === 24) setNewPackagePrice('22000');
                        if (num === 36) setNewPackagePrice('30000');
                      }}
                      style={[
                        styles.tierBtn,
                        {
                          backgroundColor: newPackageSessions === num ? '#FF6B6B' : colors.background,
                          borderColor: newPackageSessions === num ? '#FF6B6B' : colors.border,
                        },
                      ]}>
                      <Text style={[styles.tierBtnText, { color: newPackageSessions === num ? '#FFF' : colors.textPrimary }]}>
                        {num} Sessions
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Package Price & Commission Split */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Price (BDT)</Text>
                    <TextInput
                      value={newPackagePrice}
                      onChangeText={setNewPackagePrice}
                      keyboardType="numeric"
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Trainer Commission %</Text>
                    <TextInput
                      value={newCommissionPercent}
                      onChangeText={setNewCommissionPercent}
                      keyboardType="numeric"
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEnrollPackage}
                style={[styles.submitPunchBtn, { backgroundColor: '#40C057', marginTop: 10 }]}>
                <MaterialIcons name="person-add" size={18} color="#FFF" />
                <Text style={styles.submitPunchBtnText}>Confirm PT Enrollment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  selectorBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: 11,
    fontFamily: F.semiBold,
  },
  enrollActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillAvatarText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#FFF',
  },
  pillName: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  pillSub: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  clientHeroCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  clientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 18,
    fontFamily: F.bold,
    color: '#FFF',
  },
  clientNameText: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  clientPhoneText: {
    fontSize: 12,
    fontFamily: F.regular,
  },
  renewalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sendRenewalMiniBtn: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sendRenewalMiniBtnText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#000',
  },
  stampMatrixCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  stampHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stampMatrixHeading: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  stampCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampNumberPunched: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#40C057',
  },
  stampNumberNext: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  stampNextTag: {
    fontSize: 8,
    fontFamily: F.bold,
    color: '#FF6B6B',
  },
  stampNumberPending: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryPunchBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryPunchBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#FFF',
  },
  secondarySlipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondarySlipBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#FFF',
  },
  historySection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: F.bold,
  },
  emptyHistoryWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  punchHistoryCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  punchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionNumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sessionNumBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    color: '#40C057',
  },
  punchCardDate: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  commissionPill: {
    backgroundColor: 'rgba(51, 154, 240, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  commissionPillText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    color: '#339AF0',
  },
  punchFocusText: {
    fontSize: 12,
    fontFamily: F.medium,
  },
  punchCardFooter: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 6,
    gap: 2,
  },
  punchCoachName: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  punchNotesText: {
    fontSize: 11,
    fontFamily: F.medium,
    fontStyle: 'italic',
  },
  commissionSummaryHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  commissionHeroTitle: {
    fontSize: 14,
    fontFamily: F.bold,
  },
  commissionHeroSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  trainerCommissionCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  trainerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commissionStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commStatBox: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  commStatLabel: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  commStatVal: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  subModalContent: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subModalTitle: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  subModalSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: F.medium,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 10,
    fontFamily: F.medium,
  },
  textInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: F.regular,
  },
  submitPunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  submitPunchBtnText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFF',
  },
  selectOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  tierBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tierBtnText: {
    fontSize: 11,
    fontFamily: F.bold,
  },
});
