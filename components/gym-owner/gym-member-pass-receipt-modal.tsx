/**
 * 🎫 Gym Member Pass & Thermal Receipt Modal (GymOS)
 * Digital ticket-style membership pass and instant transaction receipt issued after enrolling a member.
 * Features realistic thermal POS printer dispensing animation, perforation lines, barcode, and 1-tap WhatsApp sharing.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { GymMemberItem, GymProfile } from '@/types/gym';

const F = Vital.fonts;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MemberPassData {
  member: GymMemberItem;
  planTitle: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  admissionFee: number;
  lockerNumber?: string;
  assignedTrainerName?: string;
  gymProfile?: GymProfile;
  isCustomDeal?: boolean;
  customDealNotes?: string;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  data: MemberPassData | null;
  onDone?: () => void;
};

export function GymMemberPassReceiptModal({
  visible,
  onClose,
  data,
  onDone,
}: Props) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [isPrinting, setIsPrinting] = useState(true);

  // Animation values
  const printProgress = useSharedValue(0); // 0 = inside printer slot, 1 = fully printed
  const cutterCut = useSharedValue(0); // slight cutter shake
  const actionsFade = useSharedValue(0); // action buttons opacity
  const scanLinePos = useSharedValue(0); // thermal laser scanline

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const triggerSuccessHaptic = () => {
    setIsPrinting(false);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const startPrintAnimation = () => {
    setIsPrinting(true);
    printProgress.value = 0;
    cutterCut.value = 0;
    actionsFade.value = 0;
    scanLinePos.value = 0;

    // Thermal laser scan line traveling across
    scanLinePos.value = withTiming(1, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

    // Print slide out from POS slot
    printProgress.value = withSequence(
      withTiming(0.4, { duration: 400, easing: Easing.linear }),
      withTiming(0.7, { duration: 350, easing: Easing.linear }),
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          cutterCut.value = withSequence(
            withTiming(6, { duration: 60 }),
            withSpring(0, { damping: 8, stiffness: 200 })
          );
          actionsFade.value = withDelay(150, withTiming(1, { duration: 300 }));
          runOnJS(triggerSuccessHaptic)();
        }
      })
    );

    // Haptic pulses during printout
    if (Platform.OS !== 'web') {
      triggerHapticFeedback();
      setTimeout(triggerHapticFeedback, 350);
      setTimeout(triggerHapticFeedback, 700);
      setTimeout(triggerHapticFeedback, 1050);
    }
  };

  useEffect(() => {
    if (visible && data) {
      const timer = setTimeout(() => {
        startPrintAnimation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, data]);

  // Animated styles (ALWAYS declared unconditionally at top level)
  const ticketAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(printProgress.value, [0, 1], [-480, 0]);
    const opacity = interpolate(printProgress.value, [0, 0.1, 1], [0.3, 1, 1]);
    const rotate = `${interpolate(cutterCut.value, [0, 6], [0, 0.4])}deg`;

    return {
      transform: [{ translateY }, { rotate }],
      opacity,
    };
  });

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsFade.value,
    transform: [{ translateY: interpolate(actionsFade.value, [0, 1], [15, 0]) }],
  }));

  const laserAnimatedStyle = useAnimatedStyle(() => ({
    top: interpolate(scanLinePos.value, [0, 1], [0, 480]),
    opacity: interpolate(scanLinePos.value, [0, 0.1, 0.9, 1], [0, 0.9, 0.8, 0]),
  }));

  if (!visible || !data) return null;

  const {
    member,
    planTitle,
    totalFee,
    paidAmount,
    dueAmount,
    paymentMethod,
    admissionFee,
    lockerNumber,
    assignedTrainerName,
    gymProfile,
    isCustomDeal,
    customDealNotes,
  } = data;

  const gymName = gymProfile?.gymName || 'IronForge Fitness Arena';
  const memberCode = member.id
    ? member.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
    : '8937261';
  const issueDateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const issueTimeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleShareWhatsApp = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const text =
      `*🎫 MEMBERSHIP PASS & RECEIPT: ${gymName}*\n\n` +
      `Hello *${member.fullName}*,\n` +
      `Your gym membership registration is confirmed! 🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *Pass / Member ID:* #${memberCode}\n` +
      `📋 *Plan:* ${planTitle}\n` +
      `📅 *Issued:* ${issueDateStr} • ${issueTimeStr}\n` +
      `⏳ *Valid Until:* ${member.endDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎟️ *Admission Fee:* ${admissionFee > 0 ? `৳${admissionFee.toLocaleString()}` : 'Waived (৳0)'}\n` +
      `💰 *Total Package:* ৳${totalFee.toLocaleString()}\n` +
      `✅ *Paid Today:* ৳${paidAmount.toLocaleString()} (${paymentMethod})\n` +
      (dueAmount > 0
        ? `⚠️ *Remaining Due:* ৳${dueAmount.toLocaleString()}\n`
        : `✨ *Payment Status:* Full Paid (0 Due)\n`) +
      (lockerNumber ? `🔒 *Assigned Locker:* #${lockerNumber}\n` : '') +
      (assignedTrainerName ? `🏋️ *Coach / Trainer:* ${assignedTrainerName}\n` : '') +
      (isCustomDeal && customDealNotes ? `🎁 *Special Deal Terms:* ${customDealNotes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Show this digital pass at the front desk check-in station.\n` +
      `Let's crush your fitness goals! 💪🔥`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleDone = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onDone?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(15,23,42,0.72)' }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingTop: Math.max(insets.top + 6, 16),
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          
          {/* POS PRINTER DISPENSER HEAD */}
          <View style={styles.printerHeadWrapper}>
            <View
              style={[
                styles.printerHeadChassis,
                {
                  backgroundColor: isDark ? '#1C242E' : '#E2E8F0',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
                },
              ]}>
              <View style={styles.printerStatusRow}>
                <View style={styles.printerStatusLed} />
                <Text style={[styles.printerStatusText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {isPrinting ? 'PRINTING PASS...' : 'RECEIPT READY'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={startPrintAnimation}
                  style={styles.reprintBtn}>
                  <MaterialIcons name="print" size={13} color={isDark ? '#89FE00' : '#059669'} />
                  <Text style={[styles.reprintBtnText, { color: isDark ? '#89FE00' : '#059669' }]}>
                    Re-Print
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PRINTER MOUTH SLIT */}
              <View
                style={[
                  styles.printerMouthSlit,
                  {
                    backgroundColor: isDark ? '#080B0E' : '#334155',
                  },
                ]}
              />
            </View>
          </View>

          {/* PRINTER PAPER DISCHARGE TUNNEL (Clipped to create emerging effect) */}
          <View style={styles.printerPaperDispenseMask}>
            <Animated.View
              style={[
                styles.ticketCard,
                {
                  backgroundColor: isDark ? '#131920' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  shadowColor: isDark ? '#89FE00' : '#000000',
                },
                ticketAnimatedStyle,
              ]}>

              {/* LASER SCANLINE SWEEPING ACROSS TICKET */}
              <Animated.View style={[styles.laserScanLine, laserAnimatedStyle]} />

              {/* LEFT & RIGHT TICKET NOTCH CUTOUTS (TOP SECTION) */}
              <View
                style={[
                  styles.notchLeft,
                  {
                    top: 136,
                    backgroundColor: isDark ? '#000000' : '#0F172A',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  },
                ]}
              />
              <View
                style={[
                  styles.notchRight,
                  {
                    top: 136,
                    backgroundColor: isDark ? '#000000' : '#0F172A',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  },
                ]}
              />

              {/* TOP HEADER: CELEBRATION & TITLE */}
              <View style={styles.topHeader}>
                <View style={styles.celebrationIconBubble}>
                  <MaterialIcons name="celebration" size={30} color="#F59E0B" />
                </View>
                <Text style={[styles.thankYouTitle, { color: colors.textPrimary }]}>
                  Thank you!
                </Text>
                <Text style={[styles.thankYouSub, { color: colors.textSecondary }]}>
                  Your membership pass has been issued successfully
                </Text>
              </View>

              {/* PERFORATION DASHED LINE 1 */}
              <View style={styles.perforationRow}>
                <View style={[styles.dashedLine, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }]} />
              </View>

              {/* MAIN PASS DETAILS SECTION */}
              <View style={styles.bodySection}>
                {/* ROW 1: TICKET ID & AMOUNT */}
                <View style={styles.metricsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>PASS / MEMBER ID</Text>
                    <Text style={[styles.metricValueMono, { color: colors.textPrimary }]} numberOfLines={1}>
                      #{memberCode}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>AMOUNT PAID</Text>
                    <Text style={[styles.amountValue, { color: isDark ? '#89FE00' : '#059669' }]}>
                      ৳{paidAmount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* ROW 2: DATE & TIME / EXPIRY */}
                <View style={[styles.metricsRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>DATE & TIME</Text>
                    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                      {issueDateStr} • {issueTimeStr}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>VALID UNTIL</Text>
                    <Text style={[styles.metricValueBold, { color: colors.textPrimary }]}>
                      {member.endDate}
                    </Text>
                  </View>
                </View>

                {/* MEMBER PROFILE & PAYMENT METHOD CARD */}
                <View
                  style={[
                    styles.memberInfoBox,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={[
                        styles.paymentMethodBubble,
                        {
                          backgroundColor:
                            paymentMethod === 'bKash'
                              ? '#E2136E'
                              : paymentMethod === 'Nagad'
                              ? '#F7941D'
                              : paymentMethod === 'Card'
                              ? '#3B82F6'
                              : '#10B981',
                        },
                      ]}>
                      <MaterialIcons
                        name={
                          paymentMethod === 'Card'
                            ? 'credit-card'
                            : paymentMethod === 'Cash'
                            ? 'payments'
                            : 'account-balance-wallet'
                        }
                        size={15}
                        color="#FFFFFF"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {member.fullName}
                      </Text>
                      <Text style={[styles.memberPlanSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {planTitle} • {paymentMethod}
                      </Text>
                    </View>
                  </View>

                  {/* DUE OR PAID BADGE */}
                  {dueAmount > 0 ? (
                    <View style={styles.dueBadgePill}>
                      <Text style={styles.dueBadgeText}>Due: ৳{dueAmount.toLocaleString()}</Text>
                    </View>
                  ) : (
                    <View style={styles.paidBadgePill}>
                      <MaterialIcons name="check" size={10} color="#000" />
                      <Text style={styles.paidBadgeText}>PAID</Text>
                    </View>
                  )}
                </View>

                {/* LOCKER & TRAINER META (IF APPLICABLE) */}
                {(lockerNumber || assignedTrainerName) && (
                  <View style={styles.extraPillsRow}>
                    {lockerNumber ? (
                      <View style={[styles.extraTag, { backgroundColor: isDark ? 'rgba(137, 254, 0, 0.12)' : '#DCFCE7', borderColor: isDark ? 'rgba(137, 254, 0, 0.3)' : '#86EFAC' }]}>
                        <MaterialIcons name="lock" size={11} color={isDark ? '#89FE00' : '#059669'} />
                        <Text style={[styles.extraTagText, { color: isDark ? '#89FE00' : '#059669' }]}>
                          Locker #{lockerNumber}
                        </Text>
                      </View>
                    ) : null}

                    {assignedTrainerName ? (
                      <View style={[styles.extraTag, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE', borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD' }]}>
                        <MaterialIcons name="person" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
                        <Text style={[styles.extraTagText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                          {assignedTrainerName}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>

              {/* PERFORATION DASHED LINE 2 */}
              <View style={styles.perforationRow}>
                <View style={[styles.dashedLine, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }]} />
              </View>

              {/* BOTTOM BARCODE & GYM BRANDING SECTION */}
              <View style={styles.barcodeSection}>
                {/* REALISTIC BARCODE STRIPES */}
                <View style={styles.barcodeStripesContainer}>
                  {[
                    3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1,
                    2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2,
                  ].map((width, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.barcodeBar,
                        {
                          width,
                          backgroundColor: isDark ? '#F1F5F9' : '#0F172A',
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* BARCODE NUMBER DIGITS */}
                <Text style={[styles.barcodeDigitsText, { color: colors.textSecondary }]}>
                  2  8937261  273610  9
                </Text>
                
                <Text style={[styles.gymBrandingText, { color: colors.textMuted }]}>
                  {gymName.toUpperCase()} • CHECK-IN PASS
                </Text>
              </View>

            </Animated.View>
          </View>

          {/* ACTION BUTTONS (WHATSAPP & DONE) */}
          <Animated.View style={[styles.actionsContainer, actionsAnimatedStyle]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShareWhatsApp}
              style={[styles.whatsAppShareBtn, { backgroundColor: '#25D366' }]}>
              <MaterialIcons name="chat" size={18} color="#FFFFFF" />
              <Text style={styles.whatsAppBtnText}>Send WhatsApp Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDone}
              style={[
                styles.doneBtn,
                {
                  backgroundColor: isDark ? '#1E2630' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                },
              ]}>
              <Text style={[styles.doneBtnText, { color: colors.textPrimary }]}>
                Done / Close
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  printerHeadWrapper: {
    width: '100%',
    maxWidth: 340,
    zIndex: 20,
    marginBottom: -4,
  },
  printerHeadChassis: {
    borderRadius: 14,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  printerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  printerStatusLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  printerStatusText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
    flex: 1,
  },
  reprintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reprintBtnText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  printerMouthSlit: {
    height: 5,
    borderRadius: 3,
    width: '100%',
  },
  printerPaperDispenseMask: {
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'center',
  },
  ticketCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  laserScanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#89FE00',
    zIndex: 50,
    shadowColor: '#89FE00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  notchLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  notchRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  topHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 18,
    gap: 5,
  },
  celebrationIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  thankYouTitle: {
    fontSize: 19,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  thankYouSub: {
    fontSize: 11,
    fontFamily: F.sans,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  perforationRow: {
    paddingHorizontal: 18,
    marginVertical: 4,
  },
  dashedLine: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  bodySection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 8.5,
    fontFamily: F.monoBold,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValueMono: {
    fontSize: 13,
    fontFamily: F.monoBold,
    letterSpacing: 0.4,
  },
  amountValue: {
    fontSize: 17,
    fontFamily: F.monoBold,
  },
  metricValue: {
    fontSize: 11,
    fontFamily: F.sansMedium,
  },
  metricValueBold: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  memberInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  paymentMethodBubble: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberNameText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  memberPlanSub: {
    fontSize: 9.5,
    fontFamily: F.sans,
    marginTop: 1,
  },
  dueBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dueBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#EF4444',
  },
  paidBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#89FE00',
  },
  paidBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#000000',
  },
  extraPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  extraTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  extraTagText: {
    fontSize: 8.5,
    fontFamily: F.monoBold,
  },
  barcodeSection: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 3,
  },
  barcodeStripesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 2,
    paddingHorizontal: 10,
  },
  barcodeBar: {
    height: '100%',
    borderRadius: 1,
  },
  barcodeDigitsText: {
    fontSize: 9.5,
    fontFamily: F.mono,
    letterSpacing: 2,
    marginTop: 2,
  },
  gymBrandingText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
    marginTop: 3,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 330,
    marginTop: 12,
    gap: 8,
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsAppBtnText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#FFFFFF',
  },
  doneBtn: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
});
