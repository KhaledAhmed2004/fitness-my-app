/**
 * Gym Enroll New Member Modal (GymOS)
 * Single focused modal for onboarding new walk-in or referral gym members.
 * Handles Plan Selection, Fee & Initial Deposit, Due Tracking, and 1-Tap WhatsApp Welcome Receipt.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, MembershipPlanType, PaymentMethod, GymMembershipPlan } from '@/types/gym';
import { GymMembershipPlansModal } from './gym-membership-plans-modal';
import { AttractiveCalendarModal } from './attractive-calendar-modal';
import { GymLockerPickerModal } from './gym-locker-picker-modal';
import { GymTrainerPickerModal } from './gym-trainer-picker-modal';
import { GymMemberPassReceiptModal, type MemberPassData } from './gym-member-pass-receipt-modal';

const C = Vital.colors;
const F = Vital.fonts;

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Card', 'Bank_Transfer'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newMember: GymMemberItem) => void;
};

export function GymEnrollMemberModal({ visible, onClose, onSuccess }: Props) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { addMember, trainers, membershipPlans, gymProfile, lockers, assignLocker } = useGymOwnerStore();

  const [plansManagerVisible, setPlansManagerVisible] = useState(false);
  const [lockerPickerVisible, setLockerPickerVisible] = useState(false);

  const activePlans = React.useMemo(
    () => membershipPlans.filter((p) => p.isActive),
    [membershipPlans]
  );

  const availableLockers = React.useMemo(
    () => lockers.filter((l) => l.status === 'AVAILABLE'),
    [lockers]
  );

  const defaultAdmission = gymProfile?.defaultAdmissionFeeBdt ?? 1000;

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [selectedPlan, setSelectedPlan] = useState<string>(
    activePlans[0]?.type || activePlans[0]?.id || 'MONTHLY_STANDARD'
  );

  // Independent Perks Dropdown & Custom Deal States
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});
  const [isCustomDeal, setIsCustomDeal] = useState<boolean>(false);
  const [customPlanFee, setCustomPlanFee] = useState<string>('');
  const [customDurationDays, setCustomDurationDays] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customDealNotes, setCustomDealNotes] = useState<string>('');

  // Admission & Plan Fee States
  const [isAdmissionWaived, setIsAdmissionWaived] = useState<boolean>(false);
  const [admissionFee, setAdmissionFee] = useState<string>(String(defaultAdmission));
  const [paidAmount, setPaidAmount] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [assignedTrainer, setAssignedTrainer] = useState('');
  const [lockerNumber, setLockerNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [directAge, setDirectAge] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [trainerPickerVisible, setTrainerPickerVisible] = useState(false);
  const [receiptPassData, setReceiptPassData] = useState<MemberPassData | null>(null);
  const [receiptPassVisible, setReceiptPassVisible] = useState(false);

  const handleAgeChange = (text: string) => {
    setDirectAge(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 5 && num < 100) {
      const currentYear = new Date().getFullYear();
      const estYear = currentYear - num;
      setDateOfBirth(`${estYear}-01-01`);
    } else if (!text) {
      setDateOfBirth('');
    }
  };

  const birthAge = React.useMemo(() => {
    if (directAge.trim()) return parseInt(directAge.trim(), 10) || null;
    if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
    const parts = dateOfBirth.split('-').map(Number);
    const bDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    let age = now.getFullYear() - bDate.getFullYear();
    const mDiff = now.getMonth() - bDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < bDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }, [dateOfBirth, directAge]);

  const planMeta = React.useMemo(
    () => activePlans.find((p) => p.type === selectedPlan || p.id === selectedPlan),
    [activePlans, selectedPlan]
  );

  const getPlanExpiryPreview = (durationMonths: number) => {
    const today = new Date();
    const endD = new Date(today);
    endD.setMonth(endD.getMonth() + (durationMonths || 1));
    const y = endD.getFullYear();
    const m = String(endD.getMonth() + 1).padStart(2, '0');
    const d = String(endD.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${endD.getDate()} ${monthNames[endD.getMonth()]}, ${y}`;
    const totalDays = Math.round((endD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      isoDate: `${y}-${m}-${d}`,
      formatted,
      totalDays,
    };
  };

  // 1-Tap Fast Plan Select Handler
  const handleSelectPlan = (planKey: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedPlan(planKey);
    setPaidAmount('');
    if (isCustomDeal) {
      const selected = activePlans.find((p) => p.type === planKey || p.id === planKey);
      if (selected) {
        setCustomPlanFee(String(selected.feeBdt));
      }
    }
  };

  // Toggle Custom Deal for a specific plan directly from its card
  const handleToggleCustomDeal = (plan: GymMembershipPlan) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const planKey = plan.type || plan.id;
    const isAlreadySelected = selectedPlan === planKey || selectedPlan === plan.id;

    if (!isAlreadySelected) {
      setSelectedPlan(planKey);
      setIsCustomDeal(true);
      setCustomPlanFee(String(plan.feeBdt));
      setExpandedPlanIds((prev) => ({ ...prev, [plan.id]: true }));
      setPaidAmount('');
    } else {
      if (!isCustomDeal) {
        setIsCustomDeal(true);
        if (!customPlanFee || customPlanFee.trim() === '') {
          setCustomPlanFee(String(plan.feeBdt));
        }
        setExpandedPlanIds((prev) => ({ ...prev, [plan.id]: true }));
      } else {
        // Close / toggle off custom deal
        setIsCustomDeal(false);
      }
    }
  };

  // Reset custom deal to standard
  const handleCancelCustomDeal = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCustomDeal(false);
    setCustomPlanFee('');
    setCustomDurationDays('');
    setCustomEndDate('');
    setCustomDealNotes('');
    setPaidAmount('');
  };

  // Independent Perks Dropdown Toggle Handler
  const handleTogglePerks = (planId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    LayoutAnimation.configureNext({
      duration: 260,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setExpandedPlanIds((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Custom Quick Duration Helper
  const handleSetCustomDays = (days: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    setCustomDurationDays(String(days));
    setCustomEndDate(`${y}-${m}-${d}`);
  };

  const handleAppendDealNote = (tag: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCustomDealNotes((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  // Pricing & Date Computations
  const basePlanFee = planMeta?.feeBdt || 4500;
  const effectivePlanFee = isCustomDeal && customPlanFee.trim() !== ''
    ? (parseFloat(customPlanFee.trim()) || 0)
    : basePlanFee;
  const planDiscountAmount = Math.max(0, basePlanFee - effectivePlanFee);
  const parsedAdmissionFee = isAdmissionWaived ? 0 : (parseFloat(admissionFee) || 0);
  const grandTotalFee = effectivePlanFee + parsedAdmissionFee;
  const parsedPaid = paidAmount !== '' ? (parseFloat(paidAmount) || 0) : grandTotalFee;
  const dueAmount = Math.max(0, grandTotalFee - parsedPaid);

  const defaultCalculatedEndDate = React.useMemo(() => {
    const today = new Date();
    const months = planMeta ? (planMeta.durationMonths || 1) : 1;
    const endD = new Date(today);
    endD.setMonth(endD.getMonth() + months);
    const y = endD.getFullYear();
    const m = String(endD.getMonth() + 1).padStart(2, '0');
    const d = String(endD.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [planMeta]);

  const effectiveEndDate = isCustomDeal && customEndDate ? customEndDate : defaultCalculatedEndDate;

  React.useEffect(() => {
    if (activePlans.length > 0 && !activePlans.some((p) => p.type === selectedPlan || p.id === selectedPlan)) {
      setSelectedPlan(activePlans[0].type || activePlans[0].id);
    }
  }, [activePlans]);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setWeightKg('');
    setDateOfBirth('');
    setGender('MALE');
    const defaultPlan = activePlans[0];
    setSelectedPlan(defaultPlan?.type || defaultPlan?.id || 'MONTHLY_STANDARD');
    setIsCustomDeal(false);
    setCustomPlanFee('');
    setCustomDurationDays('');
    setCustomEndDate('');
    setCustomDealNotes('');
    setExpandedPlanIds({});
    setIsAdmissionWaived(false);
    setAdmissionFee(String(defaultAdmission));
    setPaidAmount('');
    setPaymentMethod('bKash');
    setAssignedTrainer('');
    setLockerNumber('');
    setNotes('');
    setDirectAge('');
  };

  const handleEnroll = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter member full name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = effectiveEndDate;

      const finalNotes = [
        notes.trim(),
        isCustomDeal && customDealNotes.trim() ? `[Special Custom Deal]: ${customDealNotes.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const newMember = await addMember(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          weightKg: weightKg.trim() ? parseFloat(weightKg.trim()) : undefined,
          gender,
          dateOfBirth: dateOfBirth.trim() || undefined,
          enrollmentDate: startDate,
          totalCheckInsCount: 1,
          membershipPlan: selectedPlan,
          planTitle: planMeta?.title || 'Standard Plan',
          startDate,
          endDate,
          admissionFeeBdt: parsedAdmissionFee,
          totalFeeBdt: grandTotalFee,
          paidAmountBdt: parsedPaid,
          dueAmountBdt: dueAmount,
          status: 'ACTIVE',
          assignedTrainerName: assignedTrainer.trim() || undefined,
          lockerNumber: lockerNumber.trim() || undefined,
          notes: finalNotes || undefined,
        },
        parsedPaid > 0
          ? {
              amount: parsedPaid,
              method: paymentMethod,
              notes: isCustomDeal
                ? `Enrollment Deposit (Custom Deal: ৳${effectivePlanFee.toLocaleString()})`
                : 'Initial Enrollment Deposit (Plan + Admission)',
            }
          : undefined
      );

      // Auto-assign locker in gym store if chosen
      if (lockerNumber.trim()) {
        const assignedLockerItem = lockers.find(
          (l) => l.lockerNumber.toUpperCase() === lockerNumber.trim().toUpperCase()
        );
        if (assignedLockerItem) {
          try {
            await assignLocker(
              assignedLockerItem.id,
              newMember.id,
              newMember.fullName,
              newMember.phone,
              assignedLockerItem.type || 'DAILY_FREE',
              assignedLockerItem.monthlyRentBdt || 0,
              newMember.endDate
            );
          } catch (err) {
            console.warn('Locker auto-assignment error:', err);
          }
        }
      }

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const passInfo: MemberPassData = {
        member: newMember,
        planTitle: newMember.planTitle,
        totalFee: grandTotalFee,
        paidAmount: parsedPaid,
        dueAmount: dueAmount,
        paymentMethod,
        admissionFee: parsedAdmissionFee,
        lockerNumber: lockerNumber.trim() || undefined,
        assignedTrainerName: assignedTrainer.trim() || undefined,
        gymProfile,
        isCustomDeal,
        customDealNotes,
      };

      setReceiptPassData(passInfo);
      setReceiptPassVisible(true);
      onSuccess?.(newMember);
    } catch (e: any) {
      Alert.alert('Enrollment Error', e?.message || 'Could not enroll member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* PREMIUM HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(137, 254, 0, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(137, 254, 0, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialIcons name="person-add-alt-1" size={20} color="#89FE00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Enroll New Member</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Fast registration, plan allocation & instant receipt
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PERSONAL INFO */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(0, 180, 216, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="person" size={13} color="#00B4D8" />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>MEMBER DETAILS</Text>
          </View>

          {/* ROW 1: FULL NAME */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="e.g. Mahfuzur Rahman"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />

          {/* ROW 2: PHONE & GENDER */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <View style={{ flex: 1.2 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PHONE NUMBER *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="+880 1711-223344"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GENDER *</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['MALE', 'FEMALE'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderPill,
                      gender === g
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: gender === g ? '#000' : colors.textPrimary }}>
                      {g === 'MALE' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ROW 3: AGE & WEIGHT */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AGE (YEARS)</Text>
              <View style={{ position: 'relative', justifyContent: 'center' }}>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      paddingRight: 36,
                    },
                  ]}
                  placeholder={birthAge !== null ? `${birthAge} yrs` : "e.g. 24"}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={directAge}
                  onChangeText={handleAgeChange}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setCalendarModalVisible(true);
                  }}
                  style={{ position: 'absolute', right: 8, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="calendar-today" size={16} color={dateOfBirth ? (isDark ? '#89FE00' : '#059669') : colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BODY WEIGHT (KG)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. 72.5"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={weightKg}
                onChangeText={setWeightKg}
              />
            </View>
          </View>

          {/* PLAN SELECTION */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(255, 184, 0, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="card-membership" size={13} color="#FFB800" />
              </View>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
                MEMBERSHIP PLAN
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setPlansManagerVisible(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6 }}>
              <MaterialIcons name="tune" size={13} color={colors.primary} />
              <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.primary }}>
                Manage Plans
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 10 }}>
            {activePlans.length === 0 ? (
              <Text style={{ fontFamily: F.sans, fontSize: 12, color: colors.textSecondary }}>
                No active membership plans. Configure plans in the Plans Manager.
              </Text>
            ) : (
              activePlans.map((plan) => {
                const planKey = plan.type || plan.id;
                const isSel = selectedPlan === planKey || selectedPlan === plan.id;
                const isExpanded = !!expandedPlanIds[plan.id];
                const expiryInfo = getPlanExpiryPreview(plan.durationMonths);
                const monthlyRate = Math.round(plan.feeBdt / (plan.durationMonths || 1));
                const savingsPercent =
                  plan.durationMonths > 1
                    ? Math.max(0, Math.round(((4500 - monthlyRate) / 4500) * 100))
                    : 0;

                return (
                  <View
                    key={plan.id}
                    style={[
                      styles.planOptionCard,
                      {
                        backgroundColor: isSel
                          ? (isDark ? '#161D24' : '#FFFFFF')
                          : (isDark ? '#11161B' : '#FFFFFF'),
                        borderColor: isSel
                          ? (isDark ? '#89FE00' : '#059669')
                          : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'),
                        borderWidth: isSel ? 1.5 : 1,
                      },
                      isSel && {
                        shadowColor: isDark ? '#89FE00' : '#059669',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: isDark ? 0.25 : 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                      },
                    ]}>
                    {/* 2-TIER HEADER: FULL TITLE (ROW 1) + DURATION & ACTIONS (ROW 2) */}
                    <View style={{ gap: 4 }}>
                      {/* ROW 1: RADIO + FULL TITLE + PRICE */}
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleSelectPlan(planKey)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View
                            style={[
                              styles.radioIndicatorLeft,
                              isSel
                                ? {
                                    backgroundColor: isDark ? '#89FE00' : '#059669',
                                    borderColor: isDark ? '#89FE00' : '#059669',
                                  }
                                : {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                  },
                            ]}>
                            {isSel && (
                              <MaterialIcons name="check" size={13} color={isDark ? '#000000' : '#FFFFFF'} />
                            )}
                          </View>

                          <Text style={[styles.planCardTitle, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                            {plan.title}
                          </Text>
                        </View>

                        {/* PRICE */}
                        <View style={{ alignItems: 'flex-end' }}>
                          {isSel && isCustomDeal && customPlanFee && parseFloat(customPlanFee) !== plan.feeBdt ? (
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.planCardPriceStriked, { color: colors.textMuted }]}>
                                ৳{plan.feeBdt.toLocaleString()}
                              </Text>
                              <Text style={[styles.planCardPrice, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                                ৳{(parseFloat(customPlanFee) || 0).toLocaleString()}
                              </Text>
                            </View>
                          ) : (
                            <Text style={[styles.planCardPrice, { color: isSel ? (isDark ? '#89FE00' : '#059669') : colors.textPrimary }]}>
                              ৳{plan.feeBdt.toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* ROW 2: DURATION & BADGES (LEFT) + DEAL & DROPDOWN CHEVRON (RIGHT) */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 28 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                          <Text style={[styles.planDurationSubtitle, { color: colors.textSecondary }]}>
                            {plan.durationMonths === 1 ? '1 Month' : `${plan.durationMonths} Mos`} • ৳{monthlyRate.toLocaleString()}/mo
                          </Text>
                          {plan.isPopular && (
                            <View
                              style={[
                                styles.popularBadge,
                                {
                                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                                  borderColor: isDark ? '#F59E0B' : '#FCD34D',
                                },
                              ]}>
                              <MaterialIcons name="local-fire-department" size={10} color={isDark ? '#FBBF24' : '#D97706'} />
                              <Text style={[styles.popularBadgeText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                                POPULAR
                              </Text>
                            </View>
                          )}
                          {savingsPercent > 0 && (
                            <View
                              style={[
                                styles.savingsBadge,
                                {
                                  backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7',
                                  borderColor: isDark ? 'rgba(137, 254, 0, 0.4)' : '#86EFAC',
                                },
                              ]}>
                              <Text style={[styles.savingsBadgeText, { color: isDark ? '#89FE00' : '#15803D' }]}>
                                {savingsPercent}% OFF
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {/* ⚡ CUSTOM DEAL TRIGGER BUTTON */}
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleToggleCustomDeal(plan)}
                            style={[
                              styles.cardDealBtn,
                              isSel && isCustomDeal
                                ? {
                                    backgroundColor: isDark ? '#F59E0B' : '#D97706',
                                    borderColor: isDark ? '#F59E0B' : '#D97706',
                                  }
                                : {
                                    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : '#FEF3C7',
                                    borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FCD34D',
                                  },
                            ]}>
                            <MaterialIcons
                              name="bolt"
                              size={12}
                              color={isSel && isCustomDeal ? '#FFFFFF' : isDark ? '#FBBF24' : '#B45309'}
                            />
                            <Text
                              style={[
                                styles.cardDealBtnText,
                                {
                                  color: isSel && isCustomDeal ? '#FFFFFF' : isDark ? '#FBBF24' : '#B45309',
                                },
                              ]}>
                              Deal
                            </Text>
                          </TouchableOpacity>

                          {/* ▾ FAR RIGHT DROPDOWN CHEVRON BUTTON */}
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleTogglePerks(plan.id)}
                            style={[
                              styles.farRightDropdownBtn,
                              {
                                backgroundColor: isExpanded
                                  ? (isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0')
                                  : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                                borderColor: isExpanded
                                  ? (isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1')
                                  : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'),
                              },
                            ]}>
                            <MaterialIcons
                              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                              size={16}
                              color={isDark ? (isExpanded ? '#89FE00' : '#E2E8F0') : (isExpanded ? '#059669' : '#475569')}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* EXPANDED RICH DETAILS SPOTLIGHT */}
                    {isExpanded && (
                      <Animated.View
                        entering={FadeInDown.duration(260).easing(Easing.bezier(0.16, 1, 0.3, 1))}
                        exiting={FadeOut.duration(140).easing(Easing.inOut(Easing.quad))}
                        style={[styles.planDetailsSpotlight, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
                        {/* VALIDITY BANNER (CLEAN & NON-REDUNDANT) */}
                        <View
                          style={[
                            styles.planValidityBanner,
                            {
                              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F0F9FF',
                              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
                            },
                          ]}>
                          <MaterialIcons name="event-available" size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
                          <Text style={[styles.planValidityText, { color: isDark ? '#38BDF8' : '#0369A1' }]}>
                            Valid for {plan.durationMonths * 30} days until {isSel && isCustomDeal && customEndDate ? customEndDate : expiryInfo.formatted}
                          </Text>
                        </View>

                        {/* INCLUDED PERKS & PRIVILEGES */}
                        {plan.features && plan.features.length > 0 && (
                          <View style={styles.perksSection}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                              <MaterialIcons name="verified" size={13} color={isDark ? '#89FE00' : '#059669'} />
                              <Text style={[styles.perksTitle, { color: isDark ? '#89FE00' : '#047857' }]}>
                                WHAT'S INCLUDED:
                              </Text>
                            </View>

                            <View style={styles.perksWrap}>
                              {plan.features.map((feature, idx) => (
                                <View
                                  key={idx}
                                  style={styles.perkItem}>
                                  <MaterialIcons name="check" size={13} color={isDark ? '#89FE00' : '#059669'} />
                                  <Text style={[styles.perkText, { color: colors.textSecondary }]}>
                                    {feature}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* ⚡ INLINE SPECIAL ARRANGEMENT / CUSTOM DEAL BOX (WHEN ACTIVE) */}
                        {isSel && isCustomDeal && (
                          <View
                            style={[
                              styles.inlineCustomDealBox,
                              {
                                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                                borderColor: isDark ? '#F59E0B' : '#FCD34D',
                              },
                            ]}>
                            {/* DEAL HEADER ROW */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                  <MaterialIcons name="handshake" size={13} color={isDark ? '#FBBF24' : '#D97706'} />
                                </View>
                                <Text style={[styles.customDealTitle, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                                  SPECIAL ARRANGEMENT / DEAL
                                </Text>
                              </View>

                              <TouchableOpacity
                                onPress={handleCancelCustomDeal}
                                style={styles.dealResetBtn}>
                                <MaterialIcons name="close" size={12} color={colors.textSecondary} />
                                <Text style={[styles.dealResetBtnText, { color: colors.textSecondary }]}>
                                  Reset Standard
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {/* FIELD 1: AGREED PLAN FEE */}
                            <View style={{ gap: 4 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                                  AGREED PLAN FEE (BDT)
                                </Text>
                                {planDiscountAmount > 0 ? (
                                  <View style={styles.dealDiscountTag}>
                                    <Text style={styles.dealDiscountText}>
                                      Save ৳{planDiscountAmount.toLocaleString()} ({Math.round((planDiscountAmount / basePlanFee) * 100)}% Off)
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textMuted }}>
                                    Standard: ৳{plan.feeBdt.toLocaleString()}
                                  </Text>
                                )}
                              </View>

                              <TextInput
                                style={[
                                  styles.formInput,
                                  {
                                    backgroundColor: isDark ? '#0E1318' : '#FFFFFF',
                                    color: colors.textPrimary,
                                    borderColor: isDark ? '#F59E0B' : '#D97706',
                                    fontFamily: F.monoBold,
                                    fontSize: 14,
                                    height: 42,
                                  },
                                ]}
                                placeholder={`e.g. ${plan.feeBdt}`}
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                value={customPlanFee}
                                onChangeText={(val) => {
                                  setCustomPlanFee(val);
                                  setPaidAmount('');
                                }}
                              />
                            </View>

                            {/* FIELD 2: ARRANGEMENT DETAILS & PERKS (OPTIONAL) */}
                            <View style={{ gap: 6 }}>
                              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                                ARRANGEMENT DETAILS & PERKS (OPTIONAL)
                              </Text>

                              {/* QUICK PERK CHIPS TO APPEND */}
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {[
                                  '+ Free Locker',
                                  '+ Student Deal',
                                  '+ 2 Free PT',
                                  '+ Extra 15 Days',
                                  '+ Steam/Sauna',
                                ].map((tag) => (
                                  <TouchableOpacity
                                    key={tag}
                                    activeOpacity={0.7}
                                    onPress={() => handleAppendDealNote(tag)}
                                    style={[
                                      styles.dealPerkTagBtn,
                                      {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                                        borderColor: colors.border,
                                      },
                                    ]}>
                                    <Text style={[styles.dealPerkTagText, { color: colors.textPrimary }]}>
                                      {tag}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>

                              <TextInput
                                style={[
                                  styles.formInput,
                                  {
                                    backgroundColor: isDark ? '#0E1318' : '#FFFFFF',
                                    color: colors.textPrimary,
                                    borderColor: colors.border,
                                    height: 38,
                                    fontSize: 11,
                                  },
                                ]}
                                placeholder="e.g. Special student rate + free locker access for 1 month"
                                placeholderTextColor={colors.textMuted}
                                value={customDealNotes}
                                onChangeText={setCustomDealNotes}
                              />
                            </View>
                          </View>
                        )}

                        {/* DESCRIPTION / POLICY NOTE IF AVAILABLE */}
                        {plan.description ? (
                          <Text style={[styles.planDescText, { color: colors.textSecondary }]}>
                            ℹ️ {plan.description}
                          </Text>
                        ) : null}
                      </Animated.View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* 🎟️ 1-TIME ADMISSION / REGISTRATION FEE (INTERACTIVE 1-TAP CARD) */}
          <View
            style={[
              styles.admissionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}>
            {/* CARD HEADER */}
            <View style={styles.admissionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MaterialIcons
                    name="confirmation-number"
                    size={14}
                    color={isDark ? '#89FE00' : '#059669'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.admissionCardTitle, { color: colors.textPrimary }]}>
                    1-TIME ADMISSION FEE (ভর্তি ফি)
                  </Text>
                  <Text style={[styles.admissionCardSubtitle, { color: colors.textSecondary }]}>
                    Registration & athlete onboarding
                  </Text>
                </View>
              </View>

            </View>

            {/* 1-TAP PRESET TILES / PILLS */}
            <View style={styles.admissionPillsRow}>
              {/* 1. FREE (WAIVED) PILL */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsAdmissionWaived(true);
                  setAdmissionFee('0');
                  setPaidAmount('');
                }}
                style={[
                  styles.admissionPill,
                  isAdmissionWaived
                    ? {
                        backgroundColor: isDark ? 'rgba(64, 192, 87, 0.25)' : '#DCFCE7',
                        borderColor: isDark ? '#40C057' : '#22C55E',
                      }
                    : {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                        borderColor: colors.border,
                      },
                ]}>
                <MaterialIcons
                  name="card-giftcard"
                  size={12}
                  color={isAdmissionWaived ? (isDark ? '#40C057' : '#15803D') : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.admissionPillText,
                    {
                      color: isAdmissionWaived ? (isDark ? '#40C057' : '#15803D') : colors.textPrimary,
                      fontFamily: isAdmissionWaived ? F.monoBold : F.sans,
                    },
                  ]}>
                  Free
                </Text>
              </TouchableOpacity>

              {/* 2. PRESET TILES (500, 1000 STD, 1500) */}
              {[
                { amount: 500, label: '৳500', isStd: false },
                { amount: 1000, label: '৳1,000', isStd: true },
                { amount: 1500, label: '৳1,500', isStd: false },
              ].map((preset) => {
                const isSel = !isAdmissionWaived && admissionFee === String(preset.amount);
                return (
                  <TouchableOpacity
                    key={preset.amount}
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setIsAdmissionWaived(false);
                      setAdmissionFee(String(preset.amount));
                      setPaidAmount('');
                    }}
                    style={[
                      styles.admissionPill,
                      isSel
                        ? {
                            backgroundColor: isDark ? 'rgba(137, 254, 0, 0.2)' : '#DCFCE7',
                            borderColor: isDark ? '#89FE00' : '#059669',
                          }
                        : {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                            borderColor: colors.border,
                          },
                    ]}>
                    <Text
                      style={[
                        styles.admissionPillText,
                        {
                          color: isSel ? (isDark ? '#89FE00' : '#047857') : colors.textPrimary,
                          fontFamily: isSel ? F.monoBold : F.sans,
                        },
                      ]}>
                      {preset.label}
                    </Text>
                    {preset.isStd && (
                      <View
                        style={[
                          styles.admissionStdDot,
                          {
                            backgroundColor: isSel
                              ? (isDark ? '#89FE00' : '#059669')
                              : colors.textMuted,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* 3. CUSTOM PILL */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsAdmissionWaived(false);
                  if (['500', '1000', '1500', '0'].includes(admissionFee)) {
                    setAdmissionFee('');
                  }
                }}
                style={[
                  styles.admissionPill,
                  !isAdmissionWaived && !['500', '1000', '1500'].includes(admissionFee)
                    ? {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#E0F2FE',
                        borderColor: isDark ? '#38BDF8' : '#0284C7',
                      }
                    : {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                        borderColor: colors.border,
                      },
                ]}>
                <MaterialIcons
                  name="edit"
                  size={11}
                  color={
                    !isAdmissionWaived && !['500', '1000', '1500'].includes(admissionFee)
                      ? (isDark ? '#38BDF8' : '#0284C7')
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.admissionPillText,
                    {
                      color:
                        !isAdmissionWaived && !['500', '1000', '1500'].includes(admissionFee)
                          ? (isDark ? '#38BDF8' : '#0284C7')
                          : colors.textPrimary,
                      fontFamily:
                        !isAdmissionWaived && !['500', '1000', '1500'].includes(admissionFee)
                          ? F.monoBold
                          : F.sans,
                    },
                  ]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {/* CONDITIONAL: CUSTOM AMOUNT INPUT OR WAIVER CELEBRATION */}
            {!isAdmissionWaived && !['500', '1000', '1500'].includes(admissionFee) ? (
              <View style={styles.admissionCustomInputRow}>
                <Text style={[styles.admissionCurrencyPrefix, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                  ৳
                </Text>
                <TextInput
                  style={[
                    styles.admissionCustomTextInput,
                    {
                      backgroundColor: isDark ? '#0E1318' : '#FFFFFF',
                      color: colors.textPrimary,
                      borderColor: isDark ? '#38BDF8' : '#0284C7',
                    },
                  ]}
                  placeholder="e.g. 800"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={admissionFee}
                  autoFocus
                  onChangeText={(val) => {
                    setAdmissionFee(val);
                    setPaidAmount('');
                  }}
                />
              </View>
            ) : null}
          </View>

          {/* BILLING & INITIAL DEPOSIT */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(64, 192, 87, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="payments" size={13} color="#40C057" />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>BILLING & PAYMENT</Text>
          </View>
          
          {/* ITEMIZED SUMMARY CARD */}
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {isCustomDeal ? 'Negotiated Plan Fee:' : 'Plan Subscription:'}
              </Text>
              <Text style={[styles.summaryVal, { color: isCustomDeal ? (isDark ? '#FBBF24' : '#D97706') : colors.textPrimary }]}>
                ৳{effectivePlanFee.toLocaleString()}
              </Text>
            </View>
            {isCustomDeal && planDiscountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#059669' }]}>Special Deal Discount:</Text>
                <Text style={[styles.summaryVal, { color: '#059669' }]}>
                  - ৳{planDiscountAmount.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>1-Time Admission Fee:</Text>
              <Text style={[styles.summaryVal, { color: isAdmissionWaived ? '#40C057' : colors.textPrimary }]}>
                {isAdmissionWaived ? '৳0 (Waived)' : `+ ৳${parsedAdmissionFee.toLocaleString()}`}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.grandTotalLabel, { color: colors.textPrimary }]}>Grand Total Payable:</Text>
              <Text style={[styles.grandTotalVal, { color: colors.primary }]}>৳{grandTotalFee.toLocaleString()}</Text>
            </View>
          </View>

          {/* QUICK 1-TAP BILLING PRESETS */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setPaidAmount(grandTotalFee.toString());
              }}
              style={[
                styles.quickPayPill,
                paidAmount === grandTotalFee.toString()
                  ? { backgroundColor: isDark ? 'rgba(137, 254, 0, 0.2)' : '#DCFCE7', borderColor: isDark ? '#89FE00' : '#059669' }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <MaterialIcons
                name="check-circle"
                size={13}
                color={paidAmount === grandTotalFee.toString() ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary}
              />
              <Text
                style={[
                  styles.quickPayPillText,
                  {
                    color: paidAmount === grandTotalFee.toString() ? (isDark ? '#89FE00' : '#059669') : colors.textPrimary,
                    fontFamily: paidAmount === grandTotalFee.toString() ? F.sansBold : F.sansMedium,
                  },
                ]}>
                Paid Full (৳{grandTotalFee.toLocaleString()})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                const half = Math.round(grandTotalFee / 2);
                setPaidAmount(half.toString());
              }}
              style={[
                styles.quickPayPill,
                paidAmount === Math.round(grandTotalFee / 2).toString()
                  ? { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7', borderColor: '#F59E0B' }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <MaterialIcons
                name="pie-chart"
                size={13}
                color={paidAmount === Math.round(grandTotalFee / 2).toString() ? '#F59E0B' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.quickPayPillText,
                  {
                    color: paidAmount === Math.round(grandTotalFee / 2).toString() ? '#D97706' : colors.textPrimary,
                    fontFamily: paidAmount === Math.round(grandTotalFee / 2).toString() ? F.sansBold : F.sansMedium,
                  },
                ]}>
                50% (৳{Math.round(grandTotalFee / 2).toLocaleString()})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setPaidAmount('0');
              }}
              style={[
                styles.quickPayPill,
                paidAmount === '0'
                  ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', borderColor: '#EF4444' }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <MaterialIcons
                name="hourglass-empty"
                size={13}
                color={paidAmount === '0' ? '#EF4444' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.quickPayPillText,
                  {
                    color: paidAmount === '0' ? '#DC2626' : colors.textPrimary,
                    fontFamily: paidAmount === '0' ? F.sansBold : F.sansMedium,
                  },
                ]}>
                Unpaid (৳0)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CUSTOM PAID AMOUNT (BDT)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              keyboardType="numeric"
              placeholder={`Full: ৳${grandTotalFee.toLocaleString()} (or enter custom)`}
              placeholderTextColor={colors.textMuted}
              value={paidAmount}
              onChangeText={setPaidAmount}
            />
          </View>

          {/* DUE BADGE */}
          <View
            style={[
              styles.dueSummaryBox,
              {
                backgroundColor: dueAmount > 0 ? 'rgba(250, 82, 82, 0.12)' : 'rgba(64, 192, 87, 0.12)',
                borderColor: dueAmount > 0 ? 'rgba(250, 82, 82, 0.3)' : 'rgba(64, 192, 87, 0.3)',
              },
            ]}>
            <MaterialIcons
              name={dueAmount > 0 ? 'error-outline' : 'check-circle'}
              size={16}
              color={dueAmount > 0 ? '#FA5252' : '#40C057'}
            />
            <Text
              style={{
                fontFamily: F.sansBold,
                fontSize: 12,
                color: dueAmount > 0 ? '#FA5252' : '#40C057',
              }}>
              {dueAmount > 0
                ? `Remaining Due Balance: ৳${dueAmount.toLocaleString()}`
                : 'Full Payment Received (0 Due)'}
            </Text>
          </View>

          {/* PAYMENT METHOD */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>PAYMENT METHOD</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setPaymentMethod(m)}
                style={[
                  styles.methodPill,
                  paymentMethod === m
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Text
                  style={{
                    color: paymentMethod === m ? '#000' : colors.textPrimary,
                    fontSize: 11,
                    fontFamily: F.sansBold,
                  }}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ADDITIONAL ASSIGNMENTS */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(157, 78, 221, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="meeting-room" size={13} color="#9D4EDD" />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
              LOCKER & TRAINER (OPTIONAL)
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 18, marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>LOCKER</Text>
                {lockerNumber ? (
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setLockerNumber('');
                    }}>
                    <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: '#FA5252' }}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLockerPickerVisible(true);
                }}
                style={[
                  styles.lockerTriggerBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: lockerNumber
                      ? (isDark ? '#89FE00' : '#059669')
                      : colors.border,
                  },
                ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View
                    style={[
                      styles.lockerTriggerIconBubble,
                      {
                        backgroundColor: lockerNumber
                          ? (isDark ? 'rgba(137, 254, 0, 0.18)' : '#DCFCE7')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'),
                      },
                    ]}>
                    <MaterialIcons
                      name={lockerNumber ? 'lock' : 'lock-open'}
                      size={14}
                      color={lockerNumber ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.lockerTriggerVal,
                        {
                          color: lockerNumber
                            ? (isDark ? '#89FE00' : '#059669')
                            : colors.textPrimary,
                          fontFamily: lockerNumber ? F.monoBold : F.sans,
                        },
                      ]}
                      numberOfLines={1}>
                      {lockerNumber ? `Locker #${lockerNumber}` : 'Pick Locker'}
                    </Text>
                    <Text style={[styles.lockerTriggerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {lockerNumber ? 'Assigned' : `${availableLockers.length} free`}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.lockerTriggerRadarBadge,
                    {
                      backgroundColor: isDark ? 'rgba(0, 180, 216, 0.12)' : '#E0F2FE',
                      borderColor: isDark ? 'rgba(0, 180, 216, 0.3)' : '#BAE6FD',
                    },
                  ]}>
                  <MaterialIcons name="grid-view" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
                  <Text style={[styles.lockerTriggerRadarText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                    Radar
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 18, marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>ASSIGNED TRAINER</Text>
                {assignedTrainer ? (
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setAssignedTrainer('');
                    }}>
                    <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: '#FA5252' }}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setTrainerPickerVisible(true);
                }}
                style={[
                  styles.lockerTriggerBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: assignedTrainer
                      ? (isDark ? '#89FE00' : '#059669')
                      : colors.border,
                  },
                ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View
                    style={[
                      styles.lockerTriggerIconBubble,
                      {
                        backgroundColor: assignedTrainer
                          ? (isDark ? 'rgba(137, 254, 0, 0.18)' : '#DCFCE7')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'),
                      },
                    ]}>
                    <MaterialIcons
                      name={assignedTrainer ? 'fitness-center' : 'person-outline'}
                      size={14}
                      color={assignedTrainer ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.lockerTriggerVal,
                        {
                          color: assignedTrainer
                            ? (isDark ? '#89FE00' : '#059669')
                            : colors.textPrimary,
                          fontFamily: assignedTrainer ? F.monoBold : F.sans,
                        },
                      ]}
                      numberOfLines={1}>
                      {assignedTrainer || 'Assign Coach'}
                    </Text>
                    <Text style={[styles.lockerTriggerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {assignedTrainer ? 'Assigned' : 'Select Trainer'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.lockerTriggerRadarBadge,
                    {
                      backgroundColor: isDark ? 'rgba(137, 254, 0, 0.12)' : '#DCFCE7',
                      borderColor: isDark ? 'rgba(137, 254, 0, 0.3)' : '#86EFAC',
                    },
                  ]}>
                  <MaterialIcons name="badge" size={11} color={isDark ? '#89FE00' : '#059669'} />
                  <Text style={[styles.lockerTriggerRadarText, { color: isDark ? '#89FE00' : '#059669' }]}>
                    Coaches
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isSubmitting}
            onPress={handleEnroll}
            style={[styles.saveMemberBtn, { backgroundColor: '#89FE00' }]}>
            <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="how-to-reg" size={16} color="#000" />
            </View>
            <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 14 }}>
              {isSubmitting ? 'Enrolling...' : 'Confirm & Save Member'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <GymMembershipPlansModal
          visible={plansManagerVisible}
          onClose={() => setPlansManagerVisible(false)}
        />

        {/* 📅 ATTRACTIVE BIRTHDAY CALENDAR MODAL */}
        <AttractiveCalendarModal
          visible={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          initialDate={dateOfBirth || undefined}
          onSelectDate={(pickedDate) => setDateOfBirth(pickedDate)}
          title="Member Birthday"
          subtitle="Interactive age jumps, year selector & milestone alerts"
        />

        {/* 🔒 SMART LOCKER VISUAL RADAR PICKER MODAL */}
        <GymLockerPickerModal
          visible={lockerPickerVisible}
          onClose={() => setLockerPickerVisible(false)}
          selectedLockerNumber={lockerNumber}
          athleteName={fullName || 'New Athlete'}
          athleteGender={gender}
          onSelectLocker={(pickedLocker) => setLockerNumber(pickedLocker)}
        />

        {/* 🏋️‍♂️ VISUAL TRAINER PICKER MODAL */}
        <GymTrainerPickerModal
          visible={trainerPickerVisible}
          onClose={() => setTrainerPickerVisible(false)}
          selectedTrainerName={assignedTrainer}
          athleteName={fullName || 'New Athlete'}
          onSelectTrainer={(trainerName) => setAssignedTrainer(trainerName)}
        />

        {/* 🎫 DIGITAL MEMBERSHIP PASS & RECEIPT MODAL */}
        <GymMemberPassReceiptModal
          visible={receiptPassVisible}
          data={receiptPassData}
          onClose={() => {
            setReceiptPassVisible(false);
            resetForm();
            onClose();
          }}
          onDone={() => {
            setReceiptPassVisible(false);
            resetForm();
            onClose();
          }}
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
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  formInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: F.sans,
  },
  calendarTriggerBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconBubble: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDateVal: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  calendarPlaceholder: {
    fontSize: 12,
    fontFamily: F.sans,
  },
  calendarAgeTag: {
    backgroundColor: '#89FE00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  calendarAgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    color: '#000',
  },
  genderPill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planOptionCard: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  planCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planSelectTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioIndicatorLeft: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardTitleCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  planCardTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  planMetaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  planDurationSubtitle: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  popularBadgeText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  savingsBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  savingsBadgeText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    letterSpacing: 0.3,
  },
  planRightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  planCardPrice: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  planCardPriceStriked: {
    fontSize: 9,
    fontFamily: F.mono,
    textDecorationLine: 'line-through',
  },
  cardDealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  cardDealBtnText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.3,
  },
  farRightDropdownBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDetailsSpotlight: {
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  planValidityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  planValidityText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.2,
  },
  planMetricsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  planMetricBox: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  planMetricLabel: {
    fontSize: 8,
    fontFamily: F.monoBold,
    color: '#64748B',
    letterSpacing: 0.4,
  },
  planMetricVal: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  perksSection: {
    gap: 6,
  },
  perksTitle: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.6,
  },
  perksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkText: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  planDescText: {
    fontSize: 11,
    fontFamily: F.sans,
    fontStyle: 'italic',
    marginTop: 2,
  },
  dueSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  methodPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  presetPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  summaryVal: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  grandTotalVal: {
    fontSize: 14,
    fontFamily: F.monoBold,
  },
  quickLockerPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  inlineCustomDealBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    gap: 10,
  },
  dealResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dealResetBtnText: {
    fontSize: 9,
    fontFamily: F.sansBold,
  },
  customDealTitle: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  dealDiscountTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dealDiscountText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#15803D',
  },
  customDurationChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customDurationChipText: {
    fontSize: 9,
  },
  dealPerkTagBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dealPerkTagText: {
    fontSize: 10,
    fontFamily: F.sans,
  },
  admissionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  admissionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  admissionCardTitle: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  admissionCardSubtitle: {
    fontSize: 10,
    fontFamily: F.sans,
    marginTop: 1,
  },
  admissionWaivedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  admissionWaivedBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.3,
  },
  admissionCurrentFeeText: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  admissionPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  admissionPill: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
  },
  admissionPillText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  admissionStdDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  admissionCustomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  admissionCurrencyPrefix: {
    fontSize: 14,
    fontFamily: F.monoBold,
  },
  admissionCustomTextInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  admissionWaiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  admissionWaiveBannerText: {
    fontSize: 10,
    fontFamily: F.sansMedium,
  },
  lockerTriggerBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockerTriggerIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockerTriggerVal: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  lockerTriggerSub: {
    fontSize: 9,
    fontFamily: F.sans,
    marginTop: 1,
  },
  lockerTriggerRadarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  lockerTriggerRadarText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.3,
  },
  quickPayPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickPayPillText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
