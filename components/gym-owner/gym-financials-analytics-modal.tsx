/**
 * Gym Financials, Expenses & Trainer Payroll Modal (GymOS)
 * Monthly Recurring Revenue (MRR), Overdue Dues, Utility Bills & Trainer Commission Pay Slips
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
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
import type { ExpenseCategory, GymExpenseItem } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymFinancialsAnalyticsModal({ visible, onClose }: Props) {
  const { colors } = useThemeColors();
  const { getFinancialSnapshot, expenses, addExpense, deleteExpense, trainers, members } = useGymOwnerStore();

  const snapshot = getFinancialSnapshot();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'TRAINER_PAYROLL'>('OVERVIEW');
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);

  // Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('ELECTRICITY_AC');
  const [expReceipt, setExpReceipt] = useState('');

  const handleSaveExpense = async () => {
    if (!expTitle.trim() || !expAmount.trim()) {
      Alert.alert('Required Fields', 'Please provide a title and amount.');
      return;
    }

    const amt = parseFloat(expAmount) || 0;
    await addExpense({
      title: expTitle.trim(),
      amountBdt: amt,
      category: expCategory,
      receiptNumber: expReceipt.trim() || undefined,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAddExpenseModalVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Financials & Cash Flow</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              August 2026 Executive Performance
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {(
            [
              { key: 'OVERVIEW', label: '📊 Cash Flow' },
              { key: 'EXPENSES', label: '💸 Expenses Log' },
              { key: 'TRAINER_PAYROLL', label: '🏋️ Trainer Payroll' },
            ] as const
          ).map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[
                  styles.tabItem,
                  active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}>
                <Text
                  style={{
                    color: active ? colors.primary : colors.textSecondary,
                    fontFamily: active ? F.sansBold : F.sans,
                    fontSize: 13,
                  }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'OVERVIEW' && (
            <>
              {/* PRIMARY CARDS */}
              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>MONTHLY COLLECTED</Text>
                  <Text style={[styles.kpiValue, { color: '#40C057' }]}>
                    ৳{snapshot.totalCollectedThisMonthBdt.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                    From {members.length} member subscriptions
                  </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>OVERDUE DUES</Text>
                  <Text style={[styles.kpiValue, { color: '#FA5252' }]}>
                    ৳{snapshot.totalPendingDuesBdt.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                    {snapshot.unpaidMembersCount} unpaid accounts
                  </Text>
                </View>
              </View>

              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>TOTAL EXPENSES</Text>
                  <Text style={[styles.kpiValue, { color: '#FF922B' }]}>
                    ৳{snapshot.totalExpensesThisMonthBdt.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                    Rent, AC, bills & cleaning
                  </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>EST. NET PROFIT</Text>
                  <Text style={[styles.kpiValue, { color: snapshot.netProfitThisMonthBdt >= 0 ? colors.primary : '#FA5252' }]}>
                    ৳{snapshot.netProfitThisMonthBdt.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                    Net after recorded expenses
                  </Text>
                </View>
              </View>

              {/* PAYMENT METHODS SPLIT */}
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Collection Breakdown</Text>
                <View style={{ gap: 8, marginTop: 10 }}>
                  <View style={styles.breakdownRow}>
                    <Text style={{ fontFamily: F.sans, color: colors.textPrimary, fontSize: 13 }}>📱 bKash / Nagad</Text>
                    <Text style={{ fontFamily: F.monoBold, color: colors.textPrimary, fontSize: 13 }}>65% (৳58,500)</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={{ fontFamily: F.sans, color: colors.textPrimary, fontSize: 13 }}>💳 POS Cards</Text>
                    <Text style={{ fontFamily: F.monoBold, color: colors.textPrimary, fontSize: 13 }}>25% (৳36,000)</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={{ fontFamily: F.sans, color: colors.textPrimary, fontSize: 13 }}>💵 Reception Cash</Text>
                    <Text style={{ fontFamily: F.monoBold, color: colors.textPrimary, fontSize: 13 }}>10% (৳4,500)</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === 'EXPENSES' && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: F.sansBold, color: colors.textPrimary }}>
                  Recorded Expenses ({expenses.length})
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setExpTitle('');
                    setExpAmount('');
                    setExpReceipt('');
                    setAddExpenseModalVisible(true);
                  }}
                  style={[styles.miniAddBtn, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="add" size={16} color="#000" />
                  <Text style={{ fontSize: 12, fontFamily: F.sansBold, color: '#000' }}>Add Expense</Text>
                </TouchableOpacity>
              </View>

              {expenses.map((exp) => (
                <View key={exp.id} style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: F.sansBold, color: colors.textPrimary }}>
                      {exp.title}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: F.mono, color: colors.textSecondary, marginTop: 2 }}>
                      {exp.date} • {exp.category.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontFamily: F.monoBold, color: '#FA5252' }}>
                      -৳{exp.amountBdt.toLocaleString()}
                    </Text>
                    {exp.receiptNumber ? (
                      <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textMuted }}>
                        {exp.receiptNumber}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          )}

          {activeTab === 'TRAINER_PAYROLL' && (
            <>
              <Text style={{ fontSize: 14, fontFamily: F.sansBold, color: colors.textPrimary, marginBottom: 12 }}>
                Trainer Salaries & Commission Distribution
              </Text>

              {trainers.map((t) => {
                const commissionBdt = (t.monthlyRevenueGeneratedBdt * t.commissionPercentage) / 100;
                const totalPayout = t.baseSalaryBdt + commissionBdt;

                return (
                  <View key={t.id} style={[styles.trainerPayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <Text style={{ fontSize: 14, fontFamily: F.sansBold, color: colors.textPrimary }}>
                          {t.name}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>
                          {t.specialization}
                        </Text>
                      </View>
                      <View style={[styles.shiftBadge, { backgroundColor: colors.glassFill }]}>
                        <Text style={{ fontSize: 10, fontFamily: F.monoBold, color: colors.primary }}>
                          {t.shift}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.payBreakdownGrid, { backgroundColor: colors.glassFill }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }}>BASE SALARY</Text>
                        <Text style={{ fontSize: 12, fontFamily: F.monoBold, color: colors.textPrimary }}>
                          ৳{t.baseSalaryBdt.toLocaleString()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }}>
                          COMMISSION ({t.commissionPercentage}%)
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: F.monoBold, color: '#40C057' }}>
                          +৳{commissionBdt.toLocaleString()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }}>EST. TOTAL</Text>
                        <Text style={{ fontSize: 13, fontFamily: F.monoBold, color: colors.primary }}>
                          ৳{totalPayout.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* ----------------- ADD EXPENSE MODAL ----------------- */}
        <Modal visible={addExpenseModalVisible} animationType="fade" transparent onRequestClose={() => setAddExpenseModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Record Operating Expense</Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>TITLE / DESCRIPTION *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. AC Repair Technician Charge"
                placeholderTextColor={colors.textMuted}
                value={expTitle}
                onChangeText={setExpTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>AMOUNT (BDT) *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                value={expAmount}
                onChangeText={setExpAmount}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>CATEGORY</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {(['ELECTRICITY_AC', 'RENT', 'EQUIPMENT_REPAIR', 'CLEANING_SUPPLIES', 'MARKETING_ADS'] as ExpenseCategory[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setExpCategory(c)}
                    style={[
                      styles.catPill,
                      expCategory === c
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.glassFill, borderColor: colors.border },
                    ]}>
                    <Text style={{ color: expCategory === c ? '#000' : colors.textPrimary, fontSize: 10, fontFamily: F.sansBold }}>
                      {c.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity onPress={() => setAddExpenseModalVisible(false)} style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: F.sansBold }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSaveExpense} style={[styles.sheetSubmitBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#000', fontFamily: F.sansBold }}>Record Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontFamily: F.sansBold },
  subtitle: { fontSize: 12, fontFamily: F.sans, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1 },
  tabItem: { paddingVertical: 12, marginRight: 20 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  kpiGrid: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  kpiLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 0.5 },
  kpiValue: { fontSize: 20, fontFamily: F.monoBold },
  sectionCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  sectionTitle: { fontSize: 14, fontFamily: F.sansBold },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  expenseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  trainerPayCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10, marginBottom: 10 },
  shiftBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  payBreakdownGrid: { flexDirection: 'row', padding: 10, borderRadius: 10, gap: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalSheet: { borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontFamily: F.sansBold },
  inputLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 0.5, marginBottom: 4 },
  modalInput: { height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontFamily: F.sans },
  catPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  sheetCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetSubmitBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
