/**
 * Home Gym Owner Command Hub (GymOS)
 * Executive Floor Capacity, Revenue KPIs, 1-Tap Due Reminders, Equipment Health & Trainer Rosters
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, MemberStatus } from '@/types/gym';
import { GymShiftManagerModal } from './gym-shift-manager-modal';
import { GymMemberCelebrationsModal } from './gym-member-celebrations-modal';
import { GymCashRegisterModal } from './gym-cash-register-modal';
import { GymOpexStaffExpenseModal } from './gym-opex-staff-expense-modal';
import { GymBodyTransformationModal } from './gym-body-transformation-modal';
import { GymPTPunchCardModal } from './gym-pt-punch-card-modal';
import { GymGhostingRescueModal } from './gym-ghosting-rescue-modal';
import { GymDietRoutinePrescriberModal } from './gym-diet-routine-prescriber-modal';
import { GymMemberReferralModal } from './gym-member-referral-modal';
import { GymCheckinStationModal } from './gym-checkin-station-modal';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  onOpenMemberCrm: (filter?: MemberStatus | 'ALL') => void;
  onOpenLeadPipeline: () => void;
  onOpenEquipmentModal: () => void;
  onOpenFinancialsModal: () => void;
  onOpenAnnouncementModal: () => void;
  onOpenPlansModal?: () => void;
  onOpenLockerModal?: () => void;
};

export function HomeGymOwnerCommandHub({
  onOpenMemberCrm,
  onOpenLeadPipeline,
  onOpenEquipmentModal,
  onOpenFinancialsModal,
  onOpenAnnouncementModal,
  onOpenPlansModal,
  onOpenLockerModal,
}: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    gymProfile,
    members,
    trainers,
    equipment,
    leads,
    membershipPlans,
    lockers,
    getFinancialSnapshot,
    getCurrentShiftStatus,
    getCelebrationsSnapshot,
    getCashRegisterSnapshot,
    getOperationalExpensesSnapshot,
    getMeasurementDueMembers,
    generateWhatsAppDuesMessage,
    todayCheckInIds,
    ptPackages,
    getGhostingMembersSnapshot,
    getReferralSummary,
  } = useGymOwnerStore();

  const currentShiftStatus = getCurrentShiftStatus();
  const celebrationsSnapshot = getCelebrationsSnapshot();
  const registerSnapshot = getCashRegisterSnapshot();
  const opexSnapshot = getOperationalExpensesSnapshot();
  const measurementDueMembers = getMeasurementDueMembers();
  const ghostingSnapshot = getGhostingMembersSnapshot();
  const criticalGhostingCount = ghostingSnapshot.criticalCount + ghostingSnapshot.dangerCount;
  const activePTPackages = (ptPackages || []).filter((p) => p.status === 'ACTIVE');
  const referralSummary = getReferralSummary();
  const [shiftManagerVisible, setShiftManagerVisible] = useState(false);
  const [celebrationsModalVisible, setCelebrationsModalVisible] = useState(false);
  const [cashRegisterModalVisible, setCashRegisterModalVisible] = useState(false);
  const [opexModalVisible, setOpexModalVisible] = useState(false);
  const [bodyTransformationModalVisible, setBodyTransformationModalVisible] = useState(false);
  const [ptPunchModalVisible, setPtPunchModalVisible] = useState(false);
  const [ghostingModalVisible, setGhostingModalVisible] = useState(false);
  const [dietRoutineModalVisible, setDietRoutineModalVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);

  const snapshot = getFinancialSnapshot();
  const unpaidMembers = members.filter((m) => m.dueAmountBdt > 0);
  const expiringSoonMembers = members.filter((m) => m.status === 'EXPIRING_SOON');
  const brokenEquipment = equipment.filter((e) => e.status !== 'OPTIMAL');

  // Floor Capacity Calculation
  const floorCapacityPercent = Math.min(
    100,
    Math.round((gymProfile.currentFloorCount / gymProfile.maxFloorCapacity) * 100)
  );

  const getCapacityMeta = () => {
    if (floorCapacityPercent < 50) {
      return {
        label: 'NORMAL FLOW',
        color: '#40C057',
        bg: '#E7F3DD',
        icon: 'check-circle' as const,
      };
    }
    if (floorCapacityPercent < 80) {
      return {
        label: 'BUSY FLOOR',
        color: '#FF922B',
        bg: '#FFF4E6',
        icon: 'trending-up' as const,
      };
    }
    return {
      label: 'PEAK CAPACITY',
      color: '#FA5252',
      bg: '#FFE3E3',
      icon: 'warning' as const,
    };
  };

  const capMeta = getCapacityMeta();

  const handleSendWhatsApp = (member: GymMemberItem) => {
    const msg = generateWhatsAppDuesMessage(member);
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  return (
    <View style={styles.container}>
      {/* 🏢 FACILITY PROFILE HERO CARD */}
      <View
        style={[
          styles.heroCard,
          !isDark
            ? {
                backgroundColor: '#0E4D34',
                borderColor: 'rgba(14, 77, 52, 0.2)',
              }
            : {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
        ]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="fitness-center" size={16} color="#89FE00" />
              <Text style={styles.heroBadge}>FACILITY COMMAND CENTER</Text>
            </View>
            <Text style={styles.gymName} numberOfLines={1}>
              {gymProfile.gymName}
            </Text>
            <Text style={styles.gymTagline} numberOfLines={1}>
              {gymProfile.address}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {/* CHECK-IN LAUNCHER */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setCheckinModalVisible(true);
              }}
              style={styles.primaryActionBtn}>
              <View style={styles.primaryActionIconBox}>
                <MaterialIcons name="qr-code-scanner" size={14} color="#000" />
              </View>
              <Text style={styles.primaryActionBtnText}>Check In</Text>
            </TouchableOpacity>

            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>DIRECTOR</Text>
            </View>
          </View>
        </View>

        {/* ⏰ LIVE SHIFT RADAR PILL */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShiftManagerVisible(true)}
          style={[
            styles.shiftRadarPill,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              borderColor:
                currentShiftStatus.shiftType === 'LADIES_ONLY'
                  ? '#E64980'
                  : currentShiftStatus.shiftType === 'GENTS_ONLY'
                  ? '#339AF0'
                  : '#89FE00',
            },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>{currentShiftStatus.badgeEmoji}</Text>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={[
                    styles.shiftRadarTag,
                    {
                      color:
                        currentShiftStatus.shiftType === 'LADIES_ONLY'
                          ? '#E64980'
                          : currentShiftStatus.shiftType === 'GENTS_ONLY'
                          ? '#339AF0'
                          : '#89FE00',
                    },
                  ]}>
                  {currentShiftStatus.label.toUpperCase()}
                </Text>
                <View style={styles.liveMiniDot} />
              </View>
              <Text style={styles.shiftRadarSub}>
                {currentShiftStatus.currentShift
                  ? `${currentShiftStatus.currentShift.startTime}–${currentShiftStatus.currentShift.endTime} (${currentShiftStatus.remainingMinutes}m left)`
                  : 'Open Floor Access'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 10, fontFamily: F.monoBold, color: '#89FE00' }}>MANAGE</Text>
            <MaterialIcons name="chevron-right" size={14} color="#89FE00" />
          </View>
        </TouchableOpacity>

        {/* 🟢 LIVE FLOOR CAPACITY PULSE BAR */}
        <View style={[styles.floorBarCard, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <View style={styles.floorHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.pulseDot, { backgroundColor: capMeta.color }]} />
              <Text style={styles.floorTitle}>FLOOR OCCUPANCY</Text>
            </View>

            <View style={[styles.capStatusBadge, { backgroundColor: capMeta.bg }]}>
              <MaterialIcons name={capMeta.icon} size={11} color={capMeta.color} />
              <Text style={[styles.capStatusText, { color: capMeta.color }]}>
                {capMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${floorCapacityPercent}%`, backgroundColor: capMeta.color },
                ]}
              />
            </View>
            <Text style={styles.occupancyText}>
              {gymProfile.currentFloorCount}/{gymProfile.maxFloorCapacity} ({floorCapacityPercent}%)
            </Text>
          </View>
        </View>
      </View>

      {/* 🎂 LIVE CELEBRATION & MILESTONES RADAR BANNER */}
      {celebrationsSnapshot.hasCelebrationsToday && (
        <View style={[styles.celebrationRadarBanner, { backgroundColor: isDark ? 'rgba(255, 184, 0, 0.12)' : 'rgba(255, 184, 0, 0.15)', borderColor: '#FFB800' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.celebrationEmojiWrap, { backgroundColor: '#FFB800' }]}>
                <Text style={{ fontSize: 16 }}>🎂</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.celebrationBannerTitle, { color: colors.textPrimary }]}>
                    {celebrationsSnapshot.todaysCelebrations.length} Member{celebrationsSnapshot.todaysCelebrations.length > 1 ? 's' : ''} Celebrating Today!
                  </Text>
                  <View style={styles.celebrationLivePill}>
                    <Text style={styles.celebrationLiveText}>TODAY</Text>
                  </View>
                </View>
                <Text style={[styles.celebrationBannerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {celebrationsSnapshot.todaysCelebrations.map((c) => c.memberName).join(', ')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setCelebrationsModalVisible(true);
              }}
              style={[styles.celebrationWishAllBtn, { backgroundColor: '#FFB800' }]}>
              <MaterialIcons name="celebration" size={13} color="#000" />
              <Text style={styles.celebrationWishAllBtnText}>Wish →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 📊 EXECUTIVE REVENUE & KPI SNAPSHOT */}
      <View style={styles.kpiRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenFinancialsModal()}
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="monetization-on" size={14} color="#40C057" />
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>COLLECTED (M)</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#40C057' }]}>
            ৳{snapshot.totalCollectedThisMonthBdt.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textMuted }}>
            MRR: ৳{snapshot.mrrBdt.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenMemberCrm('UNPAID')}
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surface, borderColor: unpaidMembers.length > 0 ? 'rgba(250, 82, 82, 0.4)' : colors.border },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="error-outline" size={14} color="#FA5252" />
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>PENDING DUES</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#FA5252' }]}>
            ৳{snapshot.totalPendingDuesBdt.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: F.mono, color: '#FA5252' }}>
            {snapshot.unpaidMembersCount} Unpaid Accounts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kpiRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenMemberCrm('ACTIVE')}
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="groups" size={14} color={colors.primary} />
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>ACTIVE MEMBERS</Text>
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
            {snapshot.activeMemberCount}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }}>
            {todayCheckInIds.length} Checked in today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenMemberCrm('EXPIRING_SOON')}
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surface, borderColor: expiringSoonMembers.length > 0 ? 'rgba(255, 184, 0, 0.4)' : colors.border },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="timer" size={14} color="#FFB800" />
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>EXPIRING (7 DAYS)</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#FFB800' }]}>
            {snapshot.expiringIn7DaysCount}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: F.mono, color: '#FFB800' }}>
            Renewal alerts ready
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⚡ GYM OWNER QUICK ACTIONS BAR */}
      <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
        QUICK MANAGEMENT HUBS
      </Text>
      <View style={styles.actionGrid}>
        {/* FRONT-DESK CHECK-IN STATION */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setCheckinModalVisible(true);
          }}
          style={[
            styles.actionGridBtn,
            {
              backgroundColor: colors.surface,
              borderColor: todayCheckInIds.length > 0 ? 'rgba(137, 254, 0, 0.4)' : colors.border,
            },
          ]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(137, 254, 0, 0.15)' }]}>
            <MaterialIcons name="qr-code-scanner" size={20} color="#89FE00" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Front Check-In</Text>
          <Text style={[styles.actionBtnSub, { color: '#89FE00' }]}>
            {todayCheckInIds.length} On Floor Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenMemberCrm('ALL')}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(0, 180, 216, 0.15)' }]}>
            <MaterialIcons name="people-alt" size={20} color="#00B4D8" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Member CRM</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            {members.length} Enrolled
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenLeadPipeline()}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(137, 254, 0, 0.15)' }]}>
            <MaterialIcons name="person-add-alt-1" size={20} color="#89FE00" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Leads & Trials</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            {leads.length} Pipeline
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenEquipmentModal()}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
            <MaterialIcons name="build" size={20} color="#FFB800" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>AMC Radar</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            {brokenEquipment.length > 0 ? `${brokenEquipment.length} Alerts` : 'All Optimal'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenFinancialsModal()}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
            <MaterialIcons name="bar-chart" size={20} color="#40C057" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Financials</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            Profit & Payroll
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenPlansModal?.()}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(157, 78, 221, 0.15)' }]}>
            <MaterialIcons name="tune" size={20} color="#9D4EDD" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Plans & Tiers</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            {membershipPlans.length} Active Plans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenLockerModal?.()}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
            <MaterialIcons name="lock" size={20} color="#20C997" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Locker Radar</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            {lockers.filter((l) => l.status === 'OCCUPIED').length}/{lockers.length} Occupied
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShiftManagerVisible(true)}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(230, 73, 128, 0.15)' }]}>
            <MaterialIcons name="schedule" size={20} color="#E64980" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Shift Guard</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            {currentShiftStatus.shiftType === 'LADIES_ONLY' ? '🚺 Ladies Active' : currentShiftStatus.shiftType === 'GENTS_ONLY' ? '🚹 Gents Active' : '🚻 Unisex'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setCelebrationsModalVisible(true);
          }}
          style={[
            styles.actionGridBtn,
            {
              backgroundColor: colors.surface,
              borderColor: celebrationsSnapshot.hasCelebrationsToday ? '#FFB800' : colors.border,
            },
          ]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
            <MaterialIcons name="cake" size={20} color="#FFB800" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Milestones</Text>
          <Text
            style={[
              styles.actionBtnSub,
              { color: celebrationsSnapshot.hasCelebrationsToday ? '#FFB800' : colors.textSecondary },
            ]}>
            {celebrationsSnapshot.todaysCelebrations.length > 0
              ? `🎉 ${celebrationsSnapshot.todaysCelebrations.length} Today`
              : 'Birthdays & Streaks'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setCashRegisterModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
            <MaterialIcons name="point-of-sale" size={20} color="#40C057" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Cash Register</Text>
          <Text style={[styles.actionBtnSub, { color: '#40C057' }]}>
            ৳{registerSnapshot.expectedCashInDrawerBdt.toLocaleString()} in Hand
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setOpexModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 146, 43, 0.15)' }]}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#FF922B" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Daily OPEX</Text>
          <Text style={[styles.actionBtnSub, { color: '#FF922B' }]}>
            ৳{opexSnapshot.totalOpexTodayBdt.toLocaleString()} Outflow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setBodyTransformationModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
            <MaterialIcons name="straighten" size={20} color="#40C057" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Body Stats</Text>
          <Text
            style={[
              styles.actionBtnSub,
              { color: measurementDueMembers.length > 0 ? '#FF6B6B' : '#40C057' },
            ]}>
            {measurementDueMembers.length > 0
              ? `⚠️ ${measurementDueMembers.length} Due`
              : 'Deltas & Retain'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setPtPunchModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
            <MaterialIcons name="fitness-center" size={20} color="#FF6B6B" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>PT Punch-Card</Text>
          <Text style={[styles.actionBtnSub, { color: '#FF6B6B' }]}>
            🥊 {activePTPackages.length} Active Packs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setGhostingModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
            <MaterialIcons name="radar" size={20} color="#FF6B6B" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Ghosting Radar</Text>
          <Text
            style={[
              styles.actionBtnSub,
              { color: criticalGhostingCount > 0 ? '#FA5252' : '#40C057' },
            ]}>
            {criticalGhostingCount > 0
              ? `👻 ${criticalGhostingCount} Churn Risk`
              : 'Attendance Safe'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setDietRoutineModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
            <MaterialIcons name="restaurant-menu" size={20} color="#40C057" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Diet & Routine</Text>
          <Text style={[styles.actionBtnSub, { color: '#40C057' }]}>
            🥗 1-Tap Prescribe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setReferralModalVisible(true);
          }}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(121, 80, 242, 0.15)' }]}>
            <MaterialIcons name="card-giftcard" size={20} color="#7950F2" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Referral Hub</Text>
          <Text style={[styles.actionBtnSub, { color: '#7950F2' }]}>
            🎁 {referralSummary.totalReferralsCount} Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenAnnouncementModal()}
          style={[styles.actionGridBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
            <MaterialIcons name="campaign" size={20} color="#FF6B6B" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Broadcast</Text>
          <Text style={[styles.actionBtnSub, { color: colors.textSecondary }]}>
            Notice Board
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🚨 CRITICAL DUES & URGENT ACTION RADAR */}
      {unpaidMembers.length > 0 && (
        <View style={[styles.urgentCard, { backgroundColor: colors.surface, borderColor: 'rgba(250, 82, 82, 0.4)' }]}>
          <View style={styles.urgentHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="notification-important" size={18} color="#FA5252" />
              <Text style={[styles.urgentTitle, { color: '#FA5252' }]}>
                UNCOLLECTED DUES RADAR ({unpaidMembers.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => onOpenMemberCrm('UNPAID')}>
              <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.primary }}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8, marginTop: 10 }}>
            {unpaidMembers.slice(0, 3).map((m) => (
              <View key={m.id} style={[styles.dueRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: F.sansBold, color: colors.textPrimary }}>
                    {m.fullName}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: F.mono, color: colors.textSecondary }}>
                    {m.planTitle} • Due: ৳{m.dueAmountBdt.toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSendWhatsApp(m)}
                  style={styles.whatsAppBtn}>
                  <MaterialIcons name="chat" size={13} color="#FFF" />
                  <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 🏋️ TRAINER STAFF & COMMISSION ROSTER */}
      <View style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
            TRAINER ROSTER ({trainers.length})
          </Text>
          <TouchableOpacity onPress={() => onOpenFinancialsModal()}>
            <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.primary }}>
              Payroll Calculator →
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {trainers.map((t) => (
            <View
              key={t.id}
              style={[
                styles.trainerCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.trainerAvatarWrap}>
                {t.avatarUrl ? (
                  <Image source={{ uri: t.avatarUrl }} style={styles.trainerAvatar} />
                ) : (
                  <View style={[styles.trainerAvatarFallback, { backgroundColor: C.primaryAlpha20 }]}>
                    <Text style={{ color: colors.primary, fontFamily: F.sansBold }}>
                      {t.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.trainerName, { color: colors.textPrimary }]} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }} numberOfLines={1}>
                {t.specialization}
              </Text>

              <View style={[styles.trainerKpiPill, { backgroundColor: colors.glassFill }]}>
                <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: colors.primary }}>
                  👥 {t.assignedClientsCount} Clients
                </Text>
                <Text style={{ fontSize: 10, fontFamily: F.monoBold, color: '#40C057' }}>
                  ৳{t.monthlyRevenueGeneratedBdt.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* SHIFT MANAGER MODAL */}
      <GymShiftManagerModal
        visible={shiftManagerVisible}
        onClose={() => setShiftManagerVisible(false)}
      />

      {/* MEMBER CELEBRATIONS & MILESTONES MODAL */}
      <GymMemberCelebrationsModal
        visible={celebrationsModalVisible}
        onClose={() => setCelebrationsModalVisible(false)}
      />

      {/* CASH REGISTER & SHIFT RECONCILIATION MODAL */}
      <GymCashRegisterModal
        visible={cashRegisterModalVisible}
        onClose={() => setCashRegisterModalVisible(false)}
      />

      {/* DAILY OPEX & STAFF EXPENSE MODAL */}
      <GymOpexStaffExpenseModal
        visible={opexModalVisible}
        onClose={() => setOpexModalVisible(false)}
      />

      {/* MEMBER BODY TRANSFORMATION & PROGRESS MODAL */}
      <GymBodyTransformationModal
        visible={bodyTransformationModalVisible}
        onClose={() => setBodyTransformationModalVisible(false)}
      />

      {/* 🥊 PT SESSION PUNCH-CARD & TRAINER COMMISSION MODAL */}
      <GymPTPunchCardModal
        visible={ptPunchModalVisible}
        onClose={() => setPtPunchModalVisible(false)}
      />

      {/* 👻 GHOSTING MEMBER ABSENTEE RESCUE RADAR MODAL */}
      <GymGhostingRescueModal
        visible={ghostingModalVisible}
        onClose={() => setGhostingModalVisible(false)}
      />

      {/* 🥗 DIET & WORKOUT ROUTINE PRESCRIBER MODAL */}
      <GymDietRoutinePrescriberModal
        visible={dietRoutineModalVisible}
        onClose={() => setDietRoutineModalVisible(false)}
      />

      {/* 🎁 MEMBER REFERRAL & AMBASSADOR MODAL */}
      <GymMemberReferralModal
        visible={referralModalVisible}
        onClose={() => setReferralModalVisible(false)}
      />

      {/* 🎟️ FRONT-DESK CHECK-IN STATION MODAL */}
      <GymCheckinStationModal
        visible={checkinModalVisible}
        onClose={() => setCheckinModalVisible(false)}
        onOpenMemberCrm={() => {
          setCheckinModalVisible(false);
          onOpenMemberCrm('ALL');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    marginBottom: 20,
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
  heroCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroBadge: {
    color: '#89FE00',
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 1,
  },
  gymName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: F.sansExtraBold,
    marginTop: 4,
  },
  gymTagline: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  ownerBadge: {
    backgroundColor: '#89FE00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownerBadgeText: {
    color: '#002233',
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  shiftRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  shiftRadarTag: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.4,
  },
  shiftRadarSub: {
    fontSize: 10,
    fontFamily: F.sans,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  liveMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#40C057',
  },
  celebrationRadarBanner: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  celebrationEmojiWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBannerTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  celebrationBannerSub: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  celebrationLivePill: {
    backgroundColor: 'rgba(255, 184, 0, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  celebrationLiveText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    color: '#FFB800',
  },
  celebrationWishAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  celebrationWishAllBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: '#000',
  },
  floorBarCard: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floorTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  capStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  capStatusText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  occupancyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: F.monoBold,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.2,
    marginTop: 6,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionGridBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionBtnLabel: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  actionBtnSub: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  urgentCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentTitle: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  whatsAppBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  trainerCard: {
    width: 155,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  trainerAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 2,
  },
  trainerAvatar: {
    width: '100%',
    height: '100%',
  },
  trainerAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerName: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  trainerKpiPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
});
