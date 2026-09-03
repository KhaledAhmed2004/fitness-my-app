import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
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
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, GymMembershipPlan, PaymentMethod } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  member: GymMemberItem | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function GymMemberRenewUpgradeModal({ visible, member, onClose, onSuccess }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    renewMemberPlan,
    membershipPlans,
    generateWhatsAppRenewalReceipt,
  } = useGymOwnerStore();

  const activePlans = useMemo(() => {
    return membershipPlans.filter((p) => p.isActive);
  }, [membershipPlans]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isContinuousStart, setIsContinuousStart] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize form when member changes
  useEffect(() => {
    if (member && visible) {
      // Find matching plan or fallback to first plan
      const matchingPlan = activePlans.find(
        (p) => p.type === member.membershipPlan || p.title.toLowerCase() === member.planTitle.toLowerCase()
      ) || activePlans[0];

      if (matchingPlan) {
        setSelectedPlanId(matchingPlan.id);
        setFeeAmount(String(matchingPlan.feeBdt));
        setPaidAmount(String(matchingPlan.feeBdt));
      } else {
        setSelectedPlanId('');
        setFeeAmount(String(member.totalFeeBdt || 4500));
        setPaidAmount(String(member.totalFeeBdt || 4500));
      }

      setPaymentMethod('bKash');
      setTransactionId('');
      setNotes('');

      // If current expiry is in future, default to continuous start
      const todayStr = new Date().toISOString().split('T')[0];
      setIsContinuousStart(Boolean(member.endDate && member.endDate >= todayStr));
    }
  }, [member, visible, activePlans]);

  const selectedPlan: GymMembershipPlan | undefined = useMemo(() => {
    return activePlans.find((p) => p.id === selectedPlanId);
  }, [activePlans, selectedPlanId]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculate start & end date projections
  const dateProjection = useMemo(() => {
    if (!member) return { startDate: todayStr, endDate: todayStr, durationMonths: 1 };

    const duration = selectedPlan ? selectedPlan.durationMonths : 1;
    let startDate = todayStr;

    if (isContinuousStart && member.endDate && member.endDate >= todayStr) {
      startDate = member.endDate;
    }

    const startObj = new Date(startDate);
    const endObj = new Date(startObj);
    endObj.setMonth(endObj.getMonth() + duration);
    const endDate = endObj.toISOString().split('T')[0];

    return {
      startDate,
      endDate,
      durationMonths: duration,
    };
  }, [member, selectedPlan, isContinuousStart, todayStr]);

  const parsedFee = parseFloat(feeAmount) || 0;
  const parsedPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, parsedFee - parsedPaid);

  const isUpgrade = useMemo(() => {
    if (!member || !selectedPlan) return false;
    const currentDuration = member.membershipPlan === '1_YEAR' ? 12 : member.membershipPlan === '6_MONTH' ? 6 : member.membershipPlan === '3_MONTH' ? 3 : 1;
    return selectedPlan.durationMonths > currentDuration || selectedPlan.feeBdt > member.totalFeeBdt;
  }, [member, selectedPlan]);

  const handleSelectPlan = (plan: GymMembershipPlan) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelectedPlanId(plan.id);
    setFeeAmount(String(plan.feeBdt));
    setPaidAmount(String(plan.feeBdt));
  };

  const handleSubmitRenewal = async () => {
    if (!member || !selectedPlan) {
      Alert.alert('Selection Error', 'Please select a renewal plan.');
      return;
    }

    if (parsedFee <= 0) {
      Alert.alert('Invalid Fee', 'Please enter a valid package fee.');
      return;
    }

    if (parsedPaid < 0 || parsedPaid > parsedFee) {
      Alert.alert('Invalid Paid Amount', 'Paid amount cannot be negative or exceed total fee.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      const previousPlanTitle = member.planTitle;
      const res = await renewMemberPlan(
        member.id,
        selectedPlan.type,
        selectedPlan.title,
        selectedPlan.durationMonths,
        parsedFee,
        parsedPaid,
        paymentMethod,
        dateProjection.startDate,
        transactionId ? `${notes ? notes + ' | ' : ''}Trx: ${transactionId}` : notes
      );

      if (res.success && res.member && res.paymentRecord) {
        const updatedMember = res.member;
        const paymentRecord = res.paymentRecord;

        Alert.alert(
          '🎉 Membership Renewed!',
          `${updatedMember.fullName}'s membership is now active until ${updatedMember.endDate}.\n\nWould you like to send a digital renewal receipt via WhatsApp?`,
          [
            {
              text: 'Done',
              style: 'cancel',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
            {
              text: '💬 Send WhatsApp Receipt',
              onPress: () => {
                const message = generateWhatsAppRenewalReceipt(
                  updatedMember,
                  paymentRecord,
                  isUpgrade,
                  previousPlanTitle
                );
                const phoneClean = updatedMember.phone.replace(/[^0-9]/g, '');
                const url = `whatsapp://send?phone=${phoneClean}&text=${encodeURIComponent(message)}`;
                void Linking.canOpenURL(url).then((supported) => {
                  if (supported) {
                    void Linking.openURL(url);
                  } else {
                    const webUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
                    void Linking.openURL(webUrl);
                  }
                });
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      } else {
        onSuccess?.();
        onClose();
      }
    } catch {
      Alert.alert('Error', 'Failed to renew member plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  const isCurrentExpired = member.status === 'EXPIRED';
  const isExpiringSoon = member.status === 'EXPIRING_SOON';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* PREMIUM HEADER */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 184, 0, 0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 184, 0, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <MaterialIcons name="autorenew" size={20} color="#FFB800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {isUpgrade ? 'Upgrade & Renew Plan' : 'Renew Membership'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {member.fullName} • {member.phone}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* CURRENT SUBSCRIPTION RECAP CARD */}
            <View
              style={[
                styles.currentCard,
                {
                  backgroundColor: isCurrentExpired
                    ? 'rgba(250, 82, 82, 0.1)'
                    : isExpiringSoon
                    ? 'rgba(255, 184, 0, 0.1)'
                    : colors.surface,
                  borderColor: isCurrentExpired
                    ? '#FA5252'
                    : isExpiringSoon
                    ? '#FFB800'
                    : colors.border,
                },
              ]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11, fontFamily: F.monoBold, color: colors.textSecondary }}>
                    CURRENT MEMBERSHIP
                  </Text>
                  <Text style={{ fontSize: 15, fontFamily: F.sansBold, color: colors.textPrimary, marginTop: 2 }}>
                    {member.planTitle}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isCurrentExpired
                        ? 'rgba(250, 82, 82, 0.2)'
                        : isExpiringSoon
                        ? 'rgba(255, 184, 0, 0.2)'
                        : 'rgba(64, 192, 87, 0.2)',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isCurrentExpired
                          ? '#FA5252'
                          : isExpiringSoon
                          ? '#FFB800'
                          : '#40C057',
                      },
                    ]}>
                    {member.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>Expiry Date</Text>
                  <Text style={{ fontSize: 13, fontFamily: F.monoBold, color: colors.textPrimary }}>
                    {member.endDate || 'N/A'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>Assigned Locker</Text>
                  <Text style={{ fontSize: 13, fontFamily: F.monoBold, color: colors.primary }}>
                    {member.lockerNumber || 'None'}
                  </Text>
                </View>
              </View>
            </View>

            {/* PLAN SELECTION SECTION */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(255, 184, 0, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="card-membership" size={13} color="#FFB800" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0, marginBottom: 0 }]}>
                SELECT RENEWAL / UPGRADE PACKAGE
              </Text>
            </View>

            <View style={{ gap: 10, marginTop: 4 }}>
              {activePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrentPlan =
                  plan.type === member.membershipPlan ||
                  plan.title.toLowerCase() === member.planTitle.toLowerCase();
                const isTierUpgrade = plan.durationMonths > (member.membershipPlan === '1_YEAR' ? 12 : member.membershipPlan === '6_MONTH' ? 6 : member.membershipPlan === '3_MONTH' ? 3 : 1);

                return (
                  <TouchableOpacity
                    key={plan.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectPlan(plan)}
                    style={[
                      styles.planCard,
                      isSelected
                        ? { backgroundColor: C.primaryAlpha20, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <MaterialIcons
                        name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            style={{
                              fontFamily: F.sansBold,
                              fontSize: 14,
                              color: isSelected ? colors.primary : colors.textPrimary,
                            }}>
                            {plan.title}
                          </Text>
                          {isCurrentPlan ? (
                            <View style={[styles.tagPill, { backgroundColor: colors.glassFill }]}>
                              <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: colors.textSecondary }}>
                                Current
                              </Text>
                            </View>
                          ) : isTierUpgrade ? (
                            <View style={[styles.tagPill, { backgroundColor: 'rgba(255, 184, 0, 0.2)' }]}>
                              <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: '#FFB800' }}>
                                Upgrade
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          {plan.durationMonths === 1 ? '1 Month' : `${plan.durationMonths} Months`} duration •{' '}
                          {plan.features?.slice(0, 2).join(', ') || 'All standard equipment access'}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontFamily: F.monoBold,
                          fontSize: 15,
                          color: isSelected ? colors.primary : colors.textPrimary,
                        }}>
                        ৳{plan.feeBdt.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* DATE CONTINUITY & PROJECTION */}
            <View style={[styles.projectionBox, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 18 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(0, 180, 216, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="calendar-today" size={13} color="#00B4D8" />
                  </View>
                  <Text style={{ fontFamily: F.sansBold, fontSize: 13, color: colors.textPrimary }}>
                    Validity & Start Date
                  </Text>
                </View>

                {member.endDate && member.endDate >= todayStr && (
                  <TouchableOpacity
                    onPress={() => setIsContinuousStart(!isContinuousStart)}
                    style={[
                      styles.togglePill,
                      {
                        backgroundColor: isContinuousStart ? C.primaryAlpha20 : colors.glassFill,
                        borderColor: isContinuousStart ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: F.monoBold,
                        color: isContinuousStart ? colors.primary : colors.textSecondary,
                      }}>
                      {isContinuousStart ? 'Continuous from Expiry' : 'Start Today'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View>
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>Start Date</Text>
                  <Text style={{ fontSize: 13, fontFamily: F.monoBold, color: colors.textPrimary, marginTop: 2 }}>
                    {dateProjection.startDate}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>
                    New Extended Expiry
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: F.monoBold, color: '#40C057', marginTop: 2 }}>
                    {dateProjection.endDate}
                  </Text>
                </View>
              </View>
            </View>

            {/* PAYMENT DETAILS */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(64, 192, 87, 0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="payments" size={13} color="#40C057" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0, marginBottom: 0 }]}>
                PAYMENT & DEPOSIT
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TOTAL PACKAGE FEE (BDT)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={feeAmount}
                  onChangeText={(val) => {
                    setFeeAmount(val);
                    setPaidAmount(val);
                  }}
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

            {/* DUE BALANCE WARNING */}
            <View
              style={[
                styles.dueSummaryCard,
                {
                  backgroundColor: dueAmount > 0 ? 'rgba(250, 82, 82, 0.1)' : 'rgba(64, 192, 87, 0.1)',
                  borderColor: dueAmount > 0 ? 'rgba(250, 82, 82, 0.3)' : 'rgba(64, 192, 87, 0.3)',
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                },
              ]}>
              <MaterialIcons
                name={dueAmount > 0 ? 'error-outline' : 'check-circle'}
                size={16}
                color={dueAmount > 0 ? '#FA5252' : '#40C057'}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary }}>
                  {dueAmount > 0 ? 'Remaining Due Balance' : 'Payment Status'}
                </Text>
                <Text
                  style={{
                    fontFamily: F.monoBold,
                    fontSize: 13,
                    color: dueAmount > 0 ? '#FA5252' : '#40C057',
                  }}>
                  {dueAmount > 0 ? `৳${dueAmount.toLocaleString()} Pending` : 'Paid in Full (৳0 Due)'}
                </Text>
              </View>
            </View>

            {/* PAYMENT METHOD SELECTOR */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              PAYMENT METHOD
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {(['bKash', 'Nagad', 'Cash', 'Card', 'Bank_Transfer'] as PaymentMethod[]).map((m) => {
                const isSel = paymentMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[
                      styles.methodPill,
                      isSel
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <Text
                      style={{
                        color: isSel ? '#000' : colors.textPrimary,
                        fontSize: 11,
                        fontFamily: isSel ? F.sansBold : F.sans,
                      }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TRX ID & NOTES */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TRX ID (OPTIONAL)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. 9X29A1..."
                  placeholderTextColor={colors.textMuted}
                  value={transactionId}
                  onChangeText={setTransactionId}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTES / REMARKS</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. Eid discount"
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isSubmitting}
              onPress={handleSubmitRenewal}
              style={[
                styles.submitBtn,
                { backgroundColor: '#89FE00', opacity: isSubmitting ? 0.7 : 1, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
              ]}>
              <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="autorenew" size={16} color="#000" />
              </View>
              <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 14 }}>
                {isSubmitting ? 'Processing...' : 'Confirm Renewal & Issue Receipt'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 17,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  currentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: F.sansBold,
    letterSpacing: 0.5,
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: F.monoBold,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: F.sans,
  },
  dueSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
});
