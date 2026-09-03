import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';

const F = Vital.fonts;

interface OnboardingDeviceMockupProps {
  slideIndex: number;
}

export function OnboardingDeviceMockup({ slideIndex }: OnboardingDeviceMockupProps) {
  return (
    <View style={styles.container}>
      {/* 3D PERSPECTIVE PHONE CONTAINER */}
      <View style={styles.phone3dFrame}>
        {/* PHONE BEZEL & SHINE */}
        <View style={styles.phoneOuterBezel}>
          {/* DYNAMIC ISLAND & SPEAKER */}
          <View style={styles.topStatusRow}>
            <Text style={styles.clockText}>9:41</Text>
            <View style={styles.dynamicIsland} />
            <View style={styles.statusIconsRow}>
              <MaterialIcons name="signal-cellular-alt" size={10} color="#FFFFFF" />
              <MaterialIcons name="wifi" size={10} color="#FFFFFF" />
              <MaterialIcons name="battery-full" size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* INNER SCREEN DISPLAY BASED ON ACTIVE SLIDE */}
          <View style={styles.screenInner}>
            {/* SLIDE 0: FINANCIAL WELLNESS & SMART WALLET (MATCHING REFERENCE IMAGE) */}
            {slideIndex === 0 && (
              <View style={styles.screenContentFinance}>
                {/* USER PROFILE & NOTIFICATION ROW */}
                <View style={styles.mockHeaderRow}>
                  <View style={styles.mockAvatar}>
                    <Text style={styles.mockAvatarText}>🧑‍💼</Text>
                  </View>
                  <View style={styles.mockUserCol}>
                    <Text style={styles.mockGreeting}>Good day!</Text>
                    <Text style={styles.mockUserName}>Khaled Nayeem</Text>
                  </View>
                  <View style={styles.mockBellBtn}>
                    <MaterialIcons name="notifications-none" size={13} color="#FFFFFF" />
                  </View>
                </View>

                {/* PURPLE HERO BALANCE CARD */}
                <View style={styles.mockWalletCard}>
                  <View style={styles.mockBalanceTitleRow}>
                    <Text style={styles.mockBalanceLabel}>Account Balance</Text>
                    <MaterialIcons name="visibility-off" size={10} color="rgba(255,255,255,0.7)" />
                  </View>
                  <Text style={styles.mockBalanceAmount}>$101,620.00</Text>
                  <Text style={styles.mockAccountNumber}>Account ••• •••• 5678</Text>

                  {/* DUAL ACTION PILLS */}
                  <View style={styles.mockWalletActionsRow}>
                    <View style={styles.mockActionPill}>
                      <MaterialIcons name="add" size={11} color="#FFFFFF" />
                      <Text style={styles.mockActionText}>Add Money</Text>
                    </View>
                    <View style={styles.mockActionPill}>
                      <MaterialIcons name="arrow-outward" size={11} color="#FFFFFF" />
                      <Text style={styles.mockActionText}>Send Money</Text>
                    </View>
                  </View>
                </View>

                {/* UPGRADE / ADVISORY CARD */}
                <View style={styles.mockAdvisoryCard}>
                  <MaterialIcons name="warning" size={12} color="#FCC419" />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.mockAdvisoryTitle}>Budget Target</Text>
                    <Text style={styles.mockAdvisorySub}>Monthly plan on track</Text>
                  </View>
                </View>

                {/* QUICK ACTION ICONS */}
                <Text style={styles.mockQuickLabel}>Quick Actions</Text>
                <View style={styles.mockQuickRow}>
                  {[
                    { icon: 'add-circle-outline', label: 'Topup' },
                    { icon: 'receipt-long', label: 'Bills' },
                    { icon: 'savings', label: 'Savings' },
                    { icon: 'insights', label: 'Invest' },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.mockQuickItem}>
                      <View style={styles.mockQuickCircle}>
                        <MaterialIcons name={item.icon as any} size={11} color="#6C5CE7" />
                      </View>
                      <Text style={styles.mockQuickText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* SLIDE 1: CIRCADIAN ROUTINES & HABITS */}
            {slideIndex === 1 && (
              <View style={styles.screenContentHabits}>
                <View style={styles.mockRoutineHeader}>
                  <Text style={styles.mockRoutineTitle}>Today's Routine</Text>
                  <View style={styles.mockStreakBadge}>
                    <Text style={styles.mockStreakText}>🔥 14 Days</Text>
                  </View>
                </View>

                <View style={styles.mockHabitCard}>
                  <View style={styles.mockHabitIconBox}>
                    <MaterialIcons name="wb-sunny" size={14} color="#FCC419" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockHabitName}>Morning Sunlight & Water</Text>
                    <Text style={styles.mockHabitTime}>07:00 AM • 500ml Hydration</Text>
                  </View>
                  <MaterialIcons name="check-circle" size={16} color="#20C997" />
                </View>

                <View style={styles.mockHabitCard}>
                  <View style={styles.mockHabitIconBox}>
                    <MaterialIcons name="fitness-center" size={14} color="#89FE00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockHabitName}>Strength & Cardio Workout</Text>
                    <Text style={styles.mockHabitTime}>05:30 PM • 45 Mins</Text>
                  </View>
                  <MaterialIcons name="radio-button-unchecked" size={16} color="rgba(255,255,255,0.3)" />
                </View>

                <View style={styles.mockHabitCard}>
                  <View style={styles.mockHabitIconBox}>
                    <MaterialIcons name="bedtime" size={14} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockHabitName}>Zero Screen Wind-down</Text>
                    <Text style={styles.mockHabitTime}>10:00 PM • Sleep Prep</Text>
                  </View>
                  <MaterialIcons name="radio-button-unchecked" size={16} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            )}

            {/* SLIDE 2: SMART TODOS & PRIORITY PLANNER */}
            {slideIndex === 2 && (
              <View style={styles.screenContentTodos}>
                <View style={styles.mockRoutineHeader}>
                  <Text style={styles.mockRoutineTitle}>Focus Tasks</Text>
                  <View style={[styles.mockStreakBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={[styles.mockStreakText, { color: '#EF4444' }]}>P1 High</Text>
                  </View>
                </View>

                <View style={styles.mockTodoCard}>
                  <MaterialIcons name="check-box" size={15} color="#C8F135" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockTodoTitle}>Complete Monthly Budget</Text>
                    <Text style={styles.mockTodoCategory}>Finance • 3 subtasks done</Text>
                  </View>
                </View>

                <View style={styles.mockTodoCard}>
                  <MaterialIcons name="check-box-outline-blank" size={15} color="rgba(255,255,255,0.4)" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockTodoTitle}>Order Whey & Electrolytes</Text>
                    <Text style={styles.mockTodoCategory}>Health • Due Today</Text>
                  </View>
                </View>

                <View style={styles.mockTodoCard}>
                  <MaterialIcons name="check-box-outline-blank" size={15} color="rgba(255,255,255,0.4)" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockTodoTitle}>Review Evening Recovery</Text>
                    <Text style={styles.mockTodoCategory}>Wellness • 8:00 PM</Text>
                  </View>
                </View>
              </View>
            )}

            {/* SLIDE 3: NUTRITION & BIO-TELEMETRY */}
            {slideIndex === 3 && (
              <View style={styles.screenContentHealth}>
                <View style={styles.mockRoutineHeader}>
                  <Text style={styles.mockRoutineTitle}>Bio-Telemetry</Text>
                  <View style={[styles.mockStreakBadge, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                    <Text style={[styles.mockStreakText, { color: '#20C997' }]}>Optimal</Text>
                  </View>
                </View>

                {/* CALORIES / FASTING TILE */}
                <View style={styles.mockHealthRow}>
                  <View style={styles.mockHealthTile}>
                    <Text style={styles.mockHealthLabel}>Fasting 16:8</Text>
                    <Text style={styles.mockHealthValue}>14h 20m</Text>
                    <Text style={styles.mockHealthSub}>Target: 16h</Text>
                  </View>
                  <View style={styles.mockHealthTile}>
                    <Text style={styles.mockHealthLabel}>Active Burn</Text>
                    <Text style={styles.mockHealthValue}>520 kcal</Text>
                    <Text style={styles.mockHealthSub}>Goal: 600</Text>
                  </View>
                </View>

                <View style={styles.mockHealthBanner}>
                  <MaterialIcons name="favorite" size={14} color="#EF4444" />
                  <Text style={styles.mockHealthBannerText}>Heart Rate: 72 BPM • Calm</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* FLOATING GLASSMORPHIC CHIPS (MATCHING REFERENCE IMAGE) */}
        {slideIndex === 0 && (
          <View style={styles.floatingChipsOverlay}>
            {/* CHIP 1: INCOME */}
            <View style={styles.glassChipIncome}>
              <View style={styles.chipIconBoxGreen}>
                <MaterialIcons name="arrow-upward" size={11} color="#20C997" />
              </View>
              <View style={styles.chipTextCol}>
                <Text style={styles.chipTitle}>Income</Text>
                <Text style={styles.chipSubtitle}>+$4,200 more than March</Text>
              </View>
              <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
            </View>

            {/* CHIP 2: BILLS & UTILITIES */}
            <View style={styles.glassChipBills}>
              <View style={styles.chipIconBoxPurple}>
                <MaterialIcons name="receipt" size={11} color="#A78BFA" />
              </View>
              <View style={styles.chipTextCol}>
                <Text style={styles.chipTitle}>Bills & Utilities</Text>
                <Text style={styles.chipSubtitle}>14.5% less than March</Text>
              </View>
              <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        )}

        {/* FLOATING CHIP FOR HABITS */}
        {slideIndex === 1 && (
          <View style={styles.floatingChipsOverlay}>
            <View style={styles.glassChipIncome}>
              <View style={styles.chipIconBoxGreen}>
                <MaterialIcons name="electric-bolt" size={11} color="#C8F135" />
              </View>
              <View style={styles.chipTextCol}>
                <Text style={styles.chipTitle}>Circadian Alignment</Text>
                <Text style={styles.chipSubtitle}>94% Habit Score This Week</Text>
              </View>
              <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        )}

        {/* FLOATING CHIP FOR TODOS */}
        {slideIndex === 2 && (
          <View style={styles.floatingChipsOverlay}>
            <View style={styles.glassChipBills}>
              <View style={styles.chipIconBoxPurple}>
                <MaterialIcons name="task-alt" size={11} color="#89FE00" />
              </View>
              <View style={styles.chipTextCol}>
                <Text style={styles.chipTitle}>Priority Execution</Text>
                <Text style={styles.chipSubtitle}>All P1 Tasks Completed</Text>
              </View>
              <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        )}

        {/* FLOATING CHIP FOR HEALTH */}
        {slideIndex === 3 && (
          <View style={styles.floatingChipsOverlay}>
            <View style={styles.glassChipIncome}>
              <View style={styles.chipIconBoxGreen}>
                <MaterialIcons name="local-fire-department" size={11} color="#F97316" />
              </View>
              <View style={styles.chipTextCol}>
                <Text style={styles.chipTitle}>Autophagy Phase</Text>
                <Text style={styles.chipSubtitle}>Cellular Regeneration Active</Text>
              </View>
              <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  phone3dFrame: {
    width: 250,
    height: 380,
    borderRadius: 36,
    backgroundColor: '#0F1215',
    borderWidth: 4,
    borderColor: '#24282D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
    overflow: 'visible',
    transform: [
      { perspective: 1000 },
      { rotateX: '8deg' },
      { rotateY: '-6deg' },
      { rotateZ: '-2deg' },
    ],
  },
  phoneOuterBezel: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#14181C',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  clockText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  dynamicIsland: {
    width: 44,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  statusIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  screenInner: {
    flex: 1,
    padding: 10,
  },
  screenContentFinance: {
    gap: 8,
  },
  mockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E0B0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAvatarText: {
    fontSize: 12,
  },
  mockUserCol: {
    flex: 1,
  },
  mockGreeting: {
    fontFamily: F.sans,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mockUserName: {
    fontFamily: F.sansBold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  mockBellBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockWalletCard: {
    backgroundColor: '#6C5CE7',
    borderRadius: 16,
    padding: 12,
    gap: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  mockBalanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockBalanceLabel: {
    fontFamily: F.sansMedium,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mockBalanceAmount: {
    fontFamily: F.sansExtraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  mockAccountNumber: {
    fontFamily: F.mono,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  mockWalletActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mockActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    borderRadius: 8,
  },
  mockActionText: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  mockAdvisoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mockAdvisoryTitle: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  mockAdvisorySub: {
    fontFamily: F.sans,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mockQuickLabel: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  mockQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mockQuickItem: {
    alignItems: 'center',
    gap: 2,
  },
  mockQuickCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockQuickText: {
    fontFamily: F.sansMedium,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  screenContentHabits: {
    gap: 8,
  },
  screenContentTodos: {
    gap: 8,
  },
  screenContentHealth: {
    gap: 8,
  },
  mockRoutineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mockRoutineTitle: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  mockStreakBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mockStreakText: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#F97316',
  },
  mockHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mockHabitIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockHabitName: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  mockHabitTime: {
    fontFamily: F.sans,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  mockTodoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mockTodoTitle: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  mockTodoCategory: {
    fontFamily: F.sans,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  mockHealthRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mockHealthTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mockHealthLabel: {
    fontFamily: F.sansMedium,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mockHealthValue: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#20C997',
  },
  mockHealthSub: {
    fontFamily: F.sans,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  mockHealthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  mockHealthBannerText: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  floatingChipsOverlay: {
    position: 'absolute',
    right: -24,
    top: 155,
    gap: 8,
    zIndex: 100,
  },
  glassChipIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 30, 36, 0.88)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  glassChipBills: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 30, 36, 0.88)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  chipIconBoxGreen: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconBoxPurple: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTextCol: {
    gap: 1,
  },
  chipTitle: {
    fontFamily: F.sansBold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  chipSubtitle: {
    fontFamily: F.sans,
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
