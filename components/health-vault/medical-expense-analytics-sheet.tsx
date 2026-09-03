import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  MEDICAL_EXPENSE_CONFIG,
} from '@/components/health-vault/health-vault-constants';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface MedicalExpenseAnalyticsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function MedicalExpenseAnalyticsSheet({
  visible,
  onClose,
}: MedicalExpenseAnalyticsSheetProps) {
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const expenses = useHealthVaultStore((s) => s.expenses);
  const members = useHealthVaultStore((s) => s.members);
  const getMedicalSpendingSummary = useHealthVaultStore((s) => s.getMedicalSpendingSummary);
  const syncExpenseToExpenseTracker = useHealthVaultStore((s) => s.syncExpenseToExpenseTracker);
  const setHealthcareBudget = useHealthVaultStore((s) => s.setHealthcareBudget);

  const [selectedYear, setSelectedYear] = useState(2026);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // Current Year Summary
  const summary = useMemo(
    () => getMedicalSpendingSummary(selectedMemberId, selectedYear),
    [getMedicalSpendingSummary, selectedMemberId, selectedYear, expenses]
  );

  // Previous Year Summary (YoY Intelligence)
  const prevYearSummary = useMemo(
    () => getMedicalSpendingSummary(selectedMemberId, selectedYear - 1),
    [getMedicalSpendingSummary, selectedMemberId, selectedYear, expenses]
  );

  // YoY Change Calculations
  const yoyDelta = summary.totalSpend - prevYearSummary.totalSpend;
  const yoyPercentage =
    prevYearSummary.totalSpend > 0
      ? (yoyDelta / prevYearSummary.totalSpend) * 100
      : 0;

  // Category Percentages
  const total = summary.totalSpend || 1;
  const medPct = Math.round((summary.medicinesTotal / total) * 100);
  const diagPct = Math.round((summary.diagnosticTestsTotal / total) * 100);
  const docPct = Math.round((summary.doctorVisitsTotal / total) * 100);
  const hospPct = Math.max(
    0,
    100 - (medPct + diagPct + docPct)
  );

  // Budget form state
  const [formAnnualBudget, setFormAnnualBudget] = useState(
    String(summary.budget?.annualBudget || 60000)
  );
  const [formThreshold, setFormThreshold] = useState(
    String(summary.budget?.thresholdAlertPercent || 80)
  );
  const [formReserve, setFormReserve] = useState(
    String(summary.budget?.emergencyReserveAllocated || 20000)
  );

  const maxMonthSpend = useMemo(() => {
    return Math.max(...summary.monthlyBreakdown.map((m) => m.total), 1);
  }, [summary]);

  const handleSaveBudget = async () => {
    const annual = parseFloat(formAnnualBudget) || 60000;
    const thresh = parseFloat(formThreshold) || 80;
    const res = parseFloat(formReserve) || 0;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await setHealthcareBudget({
      annualBudget: annual,
      thresholdAlertPercent: thresh,
      emergencyReserveAllocated: res,
    });
    setIsEditingBudget(false);
  };

  const handleSyncExpense = async (exp: any) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await syncExpenseToExpenseTracker(exp);
  };

  const budgetPct = Math.min(100, summary.budgetConsumedPercent);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="insights" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>Medical Spending Intelligence</Text>
                <Text style={styles.subtitle}>
                  Health Spending Analytics & Distribution ({selectedYear})
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* YEAR SELECTOR PILLS */}
          <View style={styles.yearPickerBar}>
            {[2024, 2025, 2026].map((yr) => {
              const isSelected = selectedYear === yr;
              return (
                <TouchableOpacity
                  key={yr}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setSelectedYear(yr);
                  }}
                  style={[styles.yearChip, isSelected && styles.yearChipActive]}>
                  <Text
                    style={[
                      styles.yearChipText,
                      isSelected && styles.yearChipTextActive,
                    ]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* 1. YEAR-OVER-YEAR (YOY) INTELLIGENCE CARD */}
            <View style={styles.yoyCard}>
              <View style={styles.yoyHeaderRow}>
                <MaterialIcons name="trending-up" size={18} color="#38BDF8" />
                <Text style={styles.yoyTitle}>YEAR-OVER-YEAR COMPARISON</Text>
              </View>

              <View style={styles.yoyGrid}>
                <View style={styles.yoyYearBox}>
                  <Text style={styles.yoyYearLabel}>{selectedYear - 1}</Text>
                  <Text style={styles.yoyYearAmount}>
                    ৳{prevYearSummary.totalSpend.toLocaleString()}
                  </Text>
                </View>

                <MaterialIcons name="arrow-forward" size={18} color={C.onSurfaceVariant} />

                <View style={[styles.yoyYearBox, styles.yoyYearBoxActive]}>
                  <Text style={[styles.yoyYearLabel, { color: '#20C997' }]}>
                    {selectedYear}
                  </Text>
                  <Text style={[styles.yoyYearAmount, { color: '#FFFFFF' }]}>
                    ৳{summary.totalSpend.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.yoyDeltaRow}>
                <Text style={styles.yoyDeltaLabel}>Yearly Change:</Text>
                <Text
                  style={[
                    styles.yoyDeltaValue,
                    { color: yoyDelta >= 0 ? '#FCC419' : '#20C997' },
                  ]}>
                  {yoyDelta >= 0 ? `+৳${yoyDelta.toLocaleString()}` : `-৳${Math.abs(yoyDelta).toLocaleString()}`}{' '}
                  ({yoyPercentage >= 0 ? `+${yoyPercentage.toFixed(1)}%` : `${yoyPercentage.toFixed(1)}%`})
                </Text>
              </View>
            </View>

            {/* 2. CATEGORY PERCENTAGE BREAKDOWN INTELLIGENCE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SPENDING BY CATEGORY (PERCENTAGE SHARE)</Text>

              {/* Multi-Segment Proportional Progress Bar */}
              <View style={styles.segmentedBar}>
                <View style={[styles.segment, { width: `${medPct}%`, backgroundColor: '#FF922B' }]} />
                <View style={[styles.segment, { width: `${diagPct}%`, backgroundColor: '#20C997' }]} />
                <View style={[styles.segment, { width: `${docPct}%`, backgroundColor: '#38BDF8' }]} />
                <View style={[styles.segment, { width: `${hospPct}%`, backgroundColor: '#F43F5E' }]} />
              </View>

              {/* Category Cards with Percentage */}
              <View style={styles.categoryGrid}>
                {/* Medicine */}
                <View style={styles.categoryCard}>
                  <View style={styles.catTop}>
                    <View style={[styles.catDot, { backgroundColor: '#FF922B' }]} />
                    <Text style={styles.catName}>Medicine</Text>
                    <Text style={[styles.catPct, { color: '#FF922B' }]}>{medPct}%</Text>
                  </View>
                  <Text style={styles.catVal}>
                    ৳{summary.medicinesTotal.toLocaleString()}
                  </Text>
                </View>

                {/* Diagnostics */}
                <View style={styles.categoryCard}>
                  <View style={styles.catTop}>
                    <View style={[styles.catDot, { backgroundColor: '#20C997' }]} />
                    <Text style={styles.catName}>Diagnostics</Text>
                    <Text style={[styles.catPct, { color: '#20C997' }]}>{diagPct}%</Text>
                  </View>
                  <Text style={styles.catVal}>
                    ৳{summary.diagnosticTestsTotal.toLocaleString()}
                  </Text>
                </View>

                {/* Doctor */}
                <View style={styles.categoryCard}>
                  <View style={styles.catTop}>
                    <View style={[styles.catDot, { backgroundColor: '#38BDF8' }]} />
                    <Text style={styles.catName}>Doctor</Text>
                    <Text style={[styles.catPct, { color: '#38BDF8' }]}>{docPct}%</Text>
                  </View>
                  <Text style={styles.catVal}>
                    ৳{summary.doctorVisitsTotal.toLocaleString()}
                  </Text>
                </View>

                {/* Hospital */}
                <View style={styles.categoryCard}>
                  <View style={styles.catTop}>
                    <View style={[styles.catDot, { backgroundColor: '#F43F5E' }]} />
                    <Text style={styles.catName}>Hospital</Text>
                    <Text style={[styles.catPct, { color: '#F43F5E' }]}>{hospPct}%</Text>
                  </View>
                  <Text style={styles.catVal}>
                    ৳{(summary.hospitalizationTotal + summary.otherTotal).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. FAMILY MEMBER SPENDING LEADERBOARD & COMPARISON */}
            {summary.memberBreakdown.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FAMILY MEMBER DISTRIBUTION</Text>

                <View style={styles.memberList}>
                  {summary.memberBreakdown.map((m) => {
                    const memberSharePct = Math.round((m.total / total) * 100);
                    return (
                      <View key={m.memberId} style={styles.memberItem}>
                        <View style={styles.memberHeaderRow}>
                          <Text style={styles.memberName}>👤 {m.memberName}</Text>
                          <Text style={styles.memberSpend}>
                            ৳{m.total.toLocaleString()} ({memberSharePct}%)
                          </Text>
                        </View>
                        <View style={styles.memberBarTrack}>
                          <View
                            style={[
                              styles.memberBarFill,
                              { width: `${Math.max(memberSharePct, 5)}%` },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 4. ANNUAL BUDGET & 80% GUARDRAILS */}
            <View style={styles.heroBanner}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroLabel}>ANNUAL HEALTHCARE BUDGET</Text>
                  <Text style={styles.heroAmount}>
                    ৳{(summary.budget?.annualBudget || 60000).toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setIsEditingBudget((prev) => !prev);
                  }}
                  style={styles.editBudgetBtn}>
                  <MaterialIcons name="tune" size={14} color="#38BDF8" />
                  <Text style={styles.editBudgetText}>
                    {isEditingBudget ? 'Close' : 'Plan Budget'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.budgetGaugeSection}>
                <View style={styles.gaugeHeaderRow}>
                  <Text style={styles.gaugeLabel}>
                    Spent: ৳{summary.totalSpend.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.gaugePercentText,
                      summary.isThresholdExceeded && { color: '#FF922B' },
                    ]}>
                    {summary.budgetConsumedPercent.toFixed(1)}% Consumed
                  </Text>
                </View>

                <View style={styles.gaugeTrack}>
                  <View
                    style={[
                      styles.gaugeFill,
                      { width: `${budgetPct}%` },
                      summary.isThresholdExceeded
                        ? { backgroundColor: '#FF922B' }
                        : { backgroundColor: '#20C997' },
                    ]}
                  />
                  <View
                    style={[
                      styles.thresholdMarker,
                      { left: `${summary.budget?.thresholdAlertPercent || 80}%` },
                    ]}
                  />
                </View>

                <View style={styles.gaugeFooterRow}>
                  <Text style={styles.remainingText}>
                    Remaining: ৳{summary.remainingBudget.toLocaleString()}
                  </Text>
                  <Text style={styles.markerLabel}>
                    {summary.budget?.thresholdAlertPercent || 80}% Guardrail
                  </Text>
                </View>
              </View>
            </View>

            {/* 80% THRESHOLD WARNING GUARDRAIL BANNER */}
            {summary.isThresholdExceeded && (
              <View style={styles.guardrailAlertCard}>
                <MaterialIcons name="warning" size={20} color="#FF922B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guardrailTitle}>
                    80% HEALTHCARE BUDGET GUARDRAIL REACHED
                  </Text>
                  <Text style={styles.guardrailSub}>
                    Medical expenses have reached {summary.budgetConsumedPercent.toFixed(1)}% of your ৳{(summary.budget?.annualBudget || 60000).toLocaleString()} budget.
                  </Text>
                </View>
              </View>
            )}

            {/* EDIT BUDGET FORM */}
            {isEditingBudget && (
              <View style={styles.editBudgetFormCard}>
                <Text style={styles.formTitle}>CONFIGURE ANNUAL HEALTHCARE BUDGET</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Annual Medical Budget (৳)</Text>
                  <TextInput
                    style={styles.input}
                    value={formAnnualBudget}
                    onChangeText={setFormAnnualBudget}
                    keyboardType="numeric"
                    placeholder="60000"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Alert Guardrail (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={formThreshold}
                      onChangeText={setFormThreshold}
                      keyboardType="numeric"
                      placeholder="80"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Emergency Reserve (৳)</Text>
                    <TextInput
                      style={styles.input}
                      value={formReserve}
                      onChangeText={setFormReserve}
                      keyboardType="numeric"
                      placeholder="20000"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveBudget}
                  style={styles.saveBudgetBtn}>
                  <MaterialIcons name="check" size={16} color="#101416" />
                  <Text style={styles.saveBudgetBtnText}>Save Budget Guardrails</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 5. 12-MONTH SPENDING BAR CHART */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12-MONTH HEALTH SPEND TREND</Text>

              <View style={styles.chartContainer}>
                <View style={styles.barsRow}>
                  {summary.monthlyBreakdown.map((m) => {
                    const heightPct = (m.total / maxMonthSpend) * 100;
                    const hasSpend = m.total > 0;

                    return (
                      <View key={m.month} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { height: `${Math.max(heightPct, 4)}%` },
                              hasSpend && styles.barFillActive,
                            ]}
                          />
                        </View>
                        <Text style={styles.barMonthText}>{m.month}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* RAW EXPENSE TRANSACTIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>

              <View style={styles.logsList}>
                {expenses.slice(0, 8).map((exp) => {
                  const meta = MEDICAL_EXPENSE_CONFIG[exp.category] || MEDICAL_EXPENSE_CONFIG.OTHER;
                  const mem = members.find((m) => m.id === exp.memberId);

                  return (
                    <View key={exp.id} style={styles.logCard}>
                      <View style={styles.logLeft}>
                        <View
                          style={[
                            styles.logIcon,
                            { backgroundColor: `${meta.color}22` },
                          ]}>
                          <MaterialIcons
                            name={meta.icon as any}
                            size={16}
                            color={meta.color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logTitle}>
                            {exp.providerName || meta.label}
                          </Text>
                          <Text style={styles.logSub}>
                            {exp.date} • {mem?.name || 'Family'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.logRight}>
                        <Text style={styles.logAmount}>৳{exp.amount}</Text>
                        {!exp.syncedToExpenseTracker ? (
                          <TouchableOpacity
                            onPress={() => handleSyncExpense(exp)}
                            style={styles.syncBtn}>
                            <MaterialIcons name="sync" size={10} color="#20C997" />
                            <Text style={styles.syncBtnText}>Sync</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.syncedPill}>
                            <MaterialIcons name="check" size={10} color="#20C997" />
                            <Text style={styles.syncedPillText}>Synced</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearPickerBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#181F23',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  yearChipActive: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    borderColor: '#20C997',
  },
  yearChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  yearChipTextActive: {
    color: '#20C997',
    fontFamily: F.bold,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  yoyCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  yoyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yoyTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  yoyGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  yoyYearBox: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  yoyYearBoxActive: {
    borderWidth: 1,
    borderColor: '#20C997',
  },
  yoyYearLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  yoyYearAmount: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#CBD5E1',
  },
  yoyDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101416',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  yoyDeltaLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  yoyDeltaValue: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#181F23',
    marginBottom: 4,
  },
  segment: {
    height: '100%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  catTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  catName: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  catPct: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  catVal: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
  },
  memberList: {
    gap: 8,
  },
  memberItem: {
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  memberSpend: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  memberBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#101416',
    overflow: 'hidden',
  },
  memberBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  heroBanner: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#20C997',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 2,
  },
  editBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#101416',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBudgetText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  budgetGaugeSection: {
    gap: 6,
  },
  gaugeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeLabel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  gaugePercentText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#101416',
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FF922B',
  },
  gaugeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  remainingText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  markerLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#FF922B',
  },
  guardrailAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 146, 43, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF922B',
  },
  guardrailTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FF922B',
  },
  guardrailSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
  },
  editBudgetFormCard: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  formTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  input: {
    backgroundColor: '#101416',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBudgetBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  chartContainer: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 14,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  barTrack: {
    height: 60,
    width: 8,
    backgroundColor: '#101416',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#20C997',
    borderRadius: 4,
  },
  barFillActive: {
    backgroundColor: '#20C997',
  },
  barMonthText: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  logsList: {
    gap: 8,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  logSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logAmount: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncBtnText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#20C997',
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  syncedPillText: {
    fontFamily: F.regular,
    fontSize: 8,
    color: '#20C997',
  },
});
