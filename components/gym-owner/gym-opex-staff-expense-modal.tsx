import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
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
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type {
  GymOPEXCategory,
  GymOperationalExpenseItem,
} from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const OPEX_CATEGORIES: { label: string; value: GymOPEXCategory; icon: any }[] = [
  { label: 'Staff Salary Advance', value: 'STAFF_SALARY_ADVANCE', icon: 'payments' },
  { label: 'Staff Tiffin & Meals', value: 'STAFF_TIFFIN_ALLOWANCE', icon: 'fastfood' },
  { label: 'Staff Transport Fare', value: 'STAFF_TRANSPORT_REIMBURSE', icon: 'directions-bus' },
  { label: 'Generator Diesel Fuel', value: 'GENERATOR_FUEL', icon: 'local-gas-station' },
  { label: 'Hardware / Repair', value: 'HARDWARE_EQUIPMENT_REPAIR', icon: 'build' },
  { label: 'Cleaning & Waste Fee', value: 'CLEANING_SANITATION', icon: 'cleaning-services' },
  { label: 'Utilities / Water', value: 'UTILITIES_WATER_POWER', icon: 'local-drink' },
  { label: 'Office Supplies / Misc', value: 'OFFICE_SUPPLIES_MISC', icon: 'receipt' },
  { label: 'Govt / Trade / Local', value: 'GOVT_TRADE_FEES', icon: 'account-balance' },
];

export function GymOpexStaffExpenseModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    gymProfile,
    trainers,
    getOperationalExpensesSnapshot,
    logOperationalExpense,
    deleteOperationalExpense,
    getStaffLedgerSummaries,
    generateWhatsAppOpexDossier,
  } = useGymOwnerStore();

  const snap = getOperationalExpensesSnapshot();
  const staffSummaries = getStaffLedgerSummaries();

  const [activeTab, setActiveTab] = useState<'LOGS' | 'STAFF_LEDGER'>('LOGS');
  const [loggerModalVisible, setLoggerModalVisible] = useState(false);

  // Form State
  const [category, setCategory] = useState<GymOPEXCategory>('STAFF_SALARY_ADVANCE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidFrom, setPaidFrom] = useState<'CASH_DRAWER' | 'BKASH_MERCHANT' | 'OWNER_PERSONAL' | 'BANK_TRANSFER'>('CASH_DRAWER');
  const [targetStaffId, setTargetStaffId] = useState('');
  const [targetStaffName, setTargetStaffName] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [spentBy, setSpentBy] = useState('Tareq Rahman (Manager)');
  const [hasReceiptPhoto, setHasReceiptPhoto] = useState(false);
  const [notes, setNotes] = useState('');

  const handleOpenPreset = (
    cat: GymOPEXCategory,
    defaultTitle: string,
    defaultStaffId?: string,
    defaultStaffName?: string
  ) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setCategory(cat);
    setTitle(defaultTitle);
    setAmount('');
    setPaidFrom('CASH_DRAWER');
    setTargetStaffId(defaultStaffId || (trainers[0]?.id || ''));
    setTargetStaffName(defaultStaffName || (trainers[0]?.name || ''));
    setFuelLiters('');
    setRecipientName('');
    setNotes('');
    setLoggerModalVisible(true);
  };

  const handleSaveExpense = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid expense title and amount.');
      return;
    }

    const liters = parseFloat(fuelLiters);

    await logOperationalExpense({
      date: new Date().toISOString().split('T')[0],
      title: title.trim(),
      category,
      amountBdt: parsedAmount,
      paidFrom,
      spentBy: spentBy.trim() || 'Manager',
      targetStaffId: category.startsWith('STAFF_') ? targetStaffId || undefined : undefined,
      targetStaffName: category.startsWith('STAFF_') ? targetStaffName || undefined : undefined,
      fuelLiters: !isNaN(liters) && liters > 0 ? liters : undefined,
      recipientName: recipientName.trim() || undefined,
      hasReceiptPhoto,
      notes: notes.trim() || undefined,
    });

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setLoggerModalVisible(false);
  };

  const handleSendWhatsAppDossier = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const message = generateWhatsAppOpexDossier();
    const cleanPhone = (gymProfile?.phone || '').replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    void Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        void Linking.openURL(webUrl);
      }
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconFrame, { backgroundColor: 'rgba(255, 146, 43, 0.15)' }]}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#FF922B" />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Daily OPEX & Staff Hub
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Operating Outflows, Advances & Generator Fuel
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 🌟 NET RETAINED CASH HERO RADAR */}
          <View
            style={[
              styles.heroRadarCard,
              {
                backgroundColor: isDark ? 'rgba(20, 24, 33, 0.95)' : '#FFFFFF',
                borderColor: '#FF922B',
              },
            ]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 146, 43, 0.15)', borderColor: '#FF922B' }]}>
                <View style={[styles.statusDot, { backgroundColor: '#FF922B' }]} />
                <Text style={[styles.statusBadgeText, { color: '#FF922B' }]}>
                  DAILY FINANCIAL RADAR
                </Text>
              </View>
              <Text style={[styles.sessionOpenedText, { color: colors.textSecondary }]}>
                {snap.expenses.length} Outflows Today
              </Text>
            </View>

            <View style={styles.cashNumberWrap}>
              <Text style={[styles.cashNumberLabel, { color: colors.textSecondary }]}>
                NET RETAINED DAILY CASH
              </Text>
              <Text style={[styles.cashNumberBig, { color: colors.primary }]}>
                ৳ {snap.netDailyRetainedCashBdt.toLocaleString()}
              </Text>
              <Text style={[styles.cashFormulaSub, { color: colors.textSecondary }]}>
                Gross Revenue - Total OPEX (৳{snap.totalOpexTodayBdt.toLocaleString()}) - Petty Cash
              </Text>
            </View>

            <View style={styles.chipsRow}>
              <View style={[styles.chipItem, { backgroundColor: isDark ? '#181C26' : '#F1F3F5' }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>TOTAL OPEX</Text>
                <Text style={[styles.chipVal, { color: '#FA5252' }]}>
                  ৳{snap.totalOpexTodayBdt.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.chipItem, { backgroundColor: isDark ? '#181C26' : '#F1F3F5' }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>FROM DRAWER</Text>
                <Text style={[styles.chipVal, { color: '#FF922B' }]}>
                  ৳{snap.drawerOpexTodayBdt.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.chipItem, { backgroundColor: isDark ? '#181C26' : '#F1F3F5' }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>STAFF ADVANCES</Text>
                <Text style={[styles.chipVal, { color: '#339AF0' }]}>
                  ৳{snap.staffAdvancesTodayBdt.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* ⚡ 4 QUICK-ACTION LAUNCHERS */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>
            ⚡ Quick OPEX Launchers
          </Text>
          <View style={styles.quickLaunchGrid}>
            <TouchableOpacity
              onPress={() => handleOpenPreset('STAFF_SALARY_ADVANCE', 'Salary Advance to Staff')}
              style={[styles.quickLaunchBtn, { backgroundColor: colors.surface, borderColor: '#339AF0' }]}>
              <MaterialIcons name="payments" size={20} color="#339AF0" />
              <Text style={[styles.quickLaunchTitle, { color: colors.textPrimary }]}>Staff Advance</Text>
              <Text style={{ fontSize: 9, fontFamily: F.sans, color: colors.textSecondary }}>Auto-deduct salary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenPreset('GENERATOR_FUEL', 'Generator Diesel Fuel')}
              style={[styles.quickLaunchBtn, { backgroundColor: colors.surface, borderColor: '#FF922B' }]}>
              <MaterialIcons name="local-gas-station" size={20} color="#FF922B" />
              <Text style={[styles.quickLaunchTitle, { color: colors.textPrimary }]}>Generator Diesel</Text>
              <Text style={{ fontSize: 9, fontFamily: F.sans, color: colors.textSecondary }}>Liters + Meter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenPreset('STAFF_TIFFIN_ALLOWANCE', 'Staff Evening Tiffin & Tea')}
              style={[styles.quickLaunchBtn, { backgroundColor: colors.surface, borderColor: '#40C057' }]}>
              <MaterialIcons name="fastfood" size={20} color="#40C057" />
              <Text style={[styles.quickLaunchTitle, { color: colors.textPrimary }]}>Staff Tiffin</Text>
              <Text style={{ fontSize: 9, fontFamily: F.sans, color: colors.textSecondary }}>Daily tea & meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenPreset('HARDWARE_EQUIPMENT_REPAIR', 'Emergency Hardware Repair')}
              style={[styles.quickLaunchBtn, { backgroundColor: colors.surface, borderColor: '#FA5252' }]}>
              <MaterialIcons name="build" size={20} color="#FA5252" />
              <Text style={[styles.quickLaunchTitle, { color: colors.textPrimary }]}>Gym Repair</Text>
              <Text style={{ fontSize: 9, fontFamily: F.sans, color: colors.textSecondary }}>AC / Cable repair</Text>
            </TouchableOpacity>
          </View>

          {/* 🎛️ TAB SWITCHER */}
          <View style={[styles.tabBarWrap, { backgroundColor: isDark ? '#14171E' : '#F1F3F5' }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('LOGS')}
              style={[
                styles.tabBtn,
                activeTab === 'LOGS' && { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
              ]}>
              <MaterialIcons
                name="receipt-long"
                size={14}
                color={activeTab === 'LOGS' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'LOGS' ? colors.textPrimary : colors.textSecondary },
                ]}>
                Daily OPEX Logs ({snap.expenses.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('STAFF_LEDGER')}
              style={[
                styles.tabBtn,
                activeTab === 'STAFF_LEDGER' && { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
              ]}>
              <MaterialIcons
                name="groups"
                size={14}
                color={activeTab === 'STAFF_LEDGER' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'STAFF_LEDGER' ? colors.textPrimary : colors.textSecondary },
                ]}>
                Staff Advance Ledger ({staffSummaries.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 📋 TAB 1: DAILY OPEX LOGS */}
          {activeTab === 'LOGS' && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Itemized Outflows
                </Text>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={handleSendWhatsAppDossier}
                    style={[styles.smallActionBtn, { backgroundColor: 'rgba(37, 211, 102, 0.15)', borderColor: '#25D366' }]}>
                    <Text style={{ fontSize: 10 }}>💬</Text>
                    <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: '#25D366' }}>WhatsApp Dossier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleOpenPreset('OFFICE_SUPPLIES_MISC', '')}
                    style={[styles.smallActionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <MaterialIcons name="add" size={12} color="#000" />
                    <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: '#000' }}>Log Expense</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {snap.expenses.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No operational expenses logged for today.
                </Text>
              ) : (
                snap.expenses.map((e) => {
                  const isDrawer = e.paidFrom === 'CASH_DRAWER';
                  return (
                    <View
                      key={e.id}
                      style={[styles.expenseCardItem, { backgroundColor: isDark ? '#14171E' : '#F8F9FA', borderColor: colors.border }]}>
                      <View style={styles.voucherTopRow}>
                        <View style={styles.voucherBadgeWrap}>
                          <Text style={[styles.voucherCodeText, { color: colors.primary }]}>
                            {e.voucherNumber}
                          </Text>
                          <View
                            style={[
                              styles.sourceBadge,
                              {
                                backgroundColor: isDrawer
                                  ? 'rgba(255, 146, 43, 0.15)'
                                  : e.paidFrom === 'BKASH_MERCHANT'
                                  ? 'rgba(226, 19, 110, 0.15)'
                                  : 'rgba(51, 154, 240, 0.15)',
                              },
                            ]}>
                            <Text
                              style={{
                                fontSize: 8,
                                fontFamily: F.monoBold,
                                color: isDrawer
                                  ? '#FF922B'
                                  : e.paidFrom === 'BKASH_MERCHANT'
                                  ? '#E2136E'
                                  : '#339AF0',
                              }}>
                              {e.paidFrom === 'CASH_DRAWER' ? '💵 DRAWER' : e.paidFrom === 'BKASH_MERCHANT' ? '📱 BKASH' : '👤 OWNER'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.expenseAmount, { color: '#FA5252' }]}>
                          -৳{e.amountBdt.toLocaleString()}
                        </Text>
                      </View>

                      <Text style={[styles.expenseTitle, { color: colors.textPrimary, marginTop: 4 }]}>
                        {e.title}
                      </Text>

                      {/* Staff deduction warning or fuel tag */}
                      {e.targetStaffName && (
                        <View style={styles.tagPill}>
                          <MaterialIcons name="person" size={10} color="#339AF0" />
                          <Text style={{ fontSize: 9, fontFamily: F.sansBold, color: '#339AF0' }}>
                            Auto-deducted from: {e.targetStaffName}
                          </Text>
                        </View>
                      )}

                      {e.fuelLiters && (
                        <View style={styles.tagPill}>
                          <MaterialIcons name="local-gas-station" size={10} color="#FF922B" />
                          <Text style={{ fontSize: 9, fontFamily: F.sansBold, color: '#FF922B' }}>
                            Fuel Quantity: {e.fuelLiters} Liters
                          </Text>
                        </View>
                      )}

                      <View style={styles.voucherMetaRow}>
                        <Text style={[styles.expenseMeta, { color: colors.textSecondary, flex: 1 }]}>
                          {e.time} • Spent by {e.spentBy} {e.recipientName ? `• Paid to: ${e.recipientName}` : ''}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 10 }}>{e.hasReceiptPhoto ? '📷' : '✍️'}</Text>
                          <TouchableOpacity onPress={() => deleteOperationalExpense(e.id)}>
                            <MaterialIcons name="delete-outline" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* 👥 TAB 2: STAFF ADVANCE LEDGER */}
          {activeTab === 'STAFF_LEDGER' && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 10 }]}>
                Staff Salary Advance & Deduction Ledger
              </Text>

              {staffSummaries.map((s) => (
                <View
                  key={s.staffId}
                  style={[styles.staffLedgerCard, { backgroundColor: isDark ? '#14171E' : '#F8F9FA', borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 13, fontFamily: F.sansBold, color: colors.textPrimary }}>
                        {s.staffName}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                        {s.role} • Base Salary: ৳{s.monthlyBaseSalaryBdt.toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleOpenPreset('STAFF_SALARY_ADVANCE', `Salary Advance to ${s.staffName}`, s.staffId, s.staffName)}
                      style={[styles.smallActionBtn, { backgroundColor: 'rgba(51, 154, 240, 0.15)', borderColor: '#339AF0' }]}>
                      <MaterialIcons name="add" size={12} color="#339AF0" />
                      <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: '#339AF0' }}>Advance</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.staffKpiRow}>
                    <View style={[styles.staffKpiBox, { backgroundColor: colors.surface }]}>
                      <Text style={{ fontSize: 8, fontFamily: F.monoBold, color: colors.textSecondary }}>ADVANCE TAKEN</Text>
                      <Text style={{ fontSize: 12, fontFamily: F.monoBold, color: s.totalAdvanceTakenThisMonthBdt > 0 ? '#FA5252' : colors.textPrimary }}>
                        -৳{s.totalAdvanceTakenThisMonthBdt.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[styles.staffKpiBox, { backgroundColor: colors.surface }]}>
                      <Text style={{ fontSize: 8, fontFamily: F.monoBold, color: colors.textSecondary }}>ALLOWANCES</Text>
                      <Text style={{ fontSize: 12, fontFamily: F.monoBold, color: '#40C057' }}>
                        +৳{s.totalAllowancesClaimedBdt.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[styles.staffKpiBox, { backgroundColor: colors.surface }]}>
                      <Text style={{ fontSize: 8, fontFamily: F.monoBold, color: colors.textSecondary }}>NET PAYABLE</Text>
                      <Text style={{ fontSize: 12, fontFamily: F.monoBold, color: colors.primary }}>
                        ৳{s.netPayableSalaryBdt.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ➕ SUB-MODAL: LOG OPERATIONAL EXPENSE & STAFF ADVANCE */}
        <Modal visible={loggerModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.wizardCard, { backgroundColor: colors.surface }]}>
              <View style={styles.wizardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>🏢</Text>
                  <Text style={[styles.wizardTitle, { color: colors.textPrimary }]}>
                    Log Operational Outflow
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setLoggerModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                {/* Category Pills */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXPENSE CATEGORY</Text>
                <View style={styles.categoryPillsWrap}>
                  {OPEX_CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setCategory(c.value)}
                      style={[
                        styles.catPill,
                        category === c.value
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}>
                      <MaterialIcons
                        name={c.icon}
                        size={12}
                        color={category === c.value ? '#000' : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.catPillText,
                          { color: category === c.value ? '#000' : colors.textPrimary },
                        ]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* If Staff Advance, select staff */}
                {category.startsWith('STAFF_') && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      SELECT STAFF / TRAINER *
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {trainers.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => {
                            setTargetStaffId(t.id);
                            setTargetStaffName(t.name);
                          }}
                          style={[
                            styles.catPill,
                            targetStaffId === t.id
                              ? { backgroundColor: '#339AF0', borderColor: '#339AF0' }
                              : { backgroundColor: colors.background, borderColor: colors.border },
                          ]}>
                          <Text
                            style={[
                              styles.catPillText,
                              { color: targetStaffId === t.id ? '#FFF' : colors.textPrimary },
                            ]}>
                            {t.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* If Generator Diesel, ask for liters */}
                {category === 'GENERATOR_FUEL' && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      FUEL QUANTITY (LITERS)
                    </Text>
                    <TextInput
                      style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                      keyboardType="numeric"
                      placeholder="e.g. 12"
                      placeholderTextColor={colors.textMuted}
                      value={fuelLiters}
                      onChangeText={setFuelLiters}
                    />
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>EXPENSE TITLE *</Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. Generator Diesel / Salary Advance"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  AMOUNT (BDT) *
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder="1000"
                  placeholderTextColor={colors.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                />

                {/* Payment Source */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  PAID FROM (PAYMENT SOURCE)
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {[
                    { label: '💵 Cash Drawer', value: 'CASH_DRAWER' },
                    { label: '📱 bKash Merchant', value: 'BKASH_MERCHANT' },
                    { label: '👤 Owner Personal Wallet', value: 'OWNER_PERSONAL' },
                    { label: '🏦 Bank Transfer', value: 'BANK_TRANSFER' },
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      onPress={() => setPaidFrom(p.value as any)}
                      style={[
                        styles.catPill,
                        paidFrom === p.value
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}>
                      <Text
                        style={[
                          styles.catPillText,
                          { color: paidFrom === p.value ? '#000' : colors.textPrimary },
                        ]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  RECIPIENT / VENDOR / PERSON NAME
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. Meghna Petrol Pump / CoolTech"
                  placeholderTextColor={colors.textMuted}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />

                {/* Photo receipt toggle */}
                <TouchableOpacity
                  onPress={() => setHasReceiptPhoto(!hasReceiptPhoto)}
                  style={[
                    styles.photoToggleBtn,
                    {
                      backgroundColor: hasReceiptPhoto ? 'rgba(51, 154, 240, 0.15)' : isDark ? '#14171E' : '#F8F9FA',
                      borderColor: hasReceiptPhoto ? '#339AF0' : colors.border,
                    },
                  ]}>
                  <MaterialIcons
                    name={hasReceiptPhoto ? 'check-circle' : 'camera-alt'}
                    size={16}
                    color={hasReceiptPhoto ? '#339AF0' : colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: F.sansBold,
                      color: hasReceiptPhoto ? '#339AF0' : colors.textPrimary,
                    }}>
                    {hasReceiptPhoto ? '📷 Photo Receipt Verified' : '📷 Attach Photo Receipt (Optional)'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  SPENT / AUTHORIZED BY
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={spentBy}
                  onChangeText={setSpentBy}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  NOTES / REMARKS
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. Deduct from Sept payroll"
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </ScrollView>

              <View style={styles.wizardActions}>
                <TouchableOpacity
                  onPress={() => setLoggerModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveExpense}
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.confirmBtnText, { color: '#000' }]}>Save Outflow</Text>
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
  iconFrame: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroRadarCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  sessionOpenedText: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  cashNumberWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  cashNumberLabel: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  cashNumberBig: {
    fontSize: 32,
    fontFamily: F.sansExtraBold,
    marginTop: 2,
  },
  cashFormulaSub: {
    fontSize: 10,
    fontFamily: F.sans,
    marginTop: 4,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chipItem: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 8,
    fontFamily: F.monoBold,
  },
  chipVal: {
    fontSize: 12,
    fontFamily: F.sansBold,
    marginTop: 2,
  },
  quickLaunchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickLaunchBtn: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  quickLaunchTitle: {
    fontSize: 11,
    fontFamily: F.sansBold,
    marginTop: 4,
  },
  tabBarWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
    marginVertical: 14,
  },
  expenseCardItem: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  voucherTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherCodeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  sourceBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expenseAmount: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  expenseTitle: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  voucherMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  expenseMeta: {
    fontSize: 10,
    fontFamily: F.sans,
  },
  staffLedgerCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  staffKpiRow: {
    flexDirection: 'row',
    gap: 6,
  },
  staffKpiBox: {
    flex: 1,
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  wizardCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wizardTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  wizardInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: F.sans,
    marginTop: 4,
  },
  categoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  photoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    justifyContent: 'center',
  },
  wizardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#FFF',
  },
});
