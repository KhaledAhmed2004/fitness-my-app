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
  GymPettyExpenseItem,
  PettyExpenseCategory,
  GymPettyCatalogItem,
  PettyVoucherStatus,
  GymPettyEnvelopeStatus,
} from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CATEGORIES: { label: string; value: PettyExpenseCategory; icon: any }[] = [
  { label: 'Utilities / Water', value: 'UTILITIES', icon: 'local-drink' },
  { label: 'Supplies / Cleaning', value: 'SUPPLIES', icon: 'cleaning-services' },
  { label: 'Refreshments / Tea', value: 'REFRESHMENTS', icon: 'local-cafe' },
  { label: 'Maintenance / Repairs', value: 'MAINTENANCE', icon: 'build' },
  { label: 'Staff Allowance', value: 'STAFF', icon: 'badge' },
  { label: 'Miscellaneous', value: 'MISC', icon: 'receipt' },
];

export function GymCashRegisterModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    gymProfile,
    activeCashRegisterSession,
    getCashRegisterSnapshot,
    getPettyCatalog,
    getPettyEnvelopeStatus,
    logPettyExpense,
    deletePettyExpense,
    logCashDropToOwner,
    closeRegisterSession,
    openNewRegisterSession,
    generateWhatsAppEodReport,
    generateWhatsAppPettyDigest,
  } = useGymOwnerStore();

  const snapshot = getCashRegisterSnapshot();
  const session = activeCashRegisterSession;
  const catalog = getPettyCatalog();
  const envelope = getPettyEnvelopeStatus();

  // Sub-modal states
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [cashDropModalVisible, setCashDropModalVisible] = useState(false);
  const [reconcileModalVisible, setReconcileModalVisible] = useState(false);
  const [openSessionModalVisible, setOpenSessionModalVisible] = useState(false);

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<PettyExpenseCategory>('UTILITIES');
  const [expSpentBy, setExpSpentBy] = useState('Tareq Rahman');
  const [expRecipientName, setExpRecipientName] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<GymPettyCatalogItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [hasReceiptPhoto, setHasReceiptPhoto] = useState(false);

  // Cash Drop Form State
  const [dropAmount, setDropAmount] = useState('');
  const [dropReceivedBy, setDropReceivedBy] = useState(gymProfile?.ownerName || 'Khaled Nayeem');
  const [dropNotes, setDropNotes] = useState('');

  // Reconciliation Form State
  const [actualCashInput, setActualCashInput] = useState(String(snapshot.expectedCashInDrawerBdt));
  const [closedByName, setClosedByName] = useState('Tareq Rahman (Manager)');
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [eodNotes, setEodNotes] = useState('');

  // Open Session Form State
  const [openingFloatInput, setOpeningFloatInput] = useState('1000');
  const [openedByName, setOpenedByName] = useState('Tareq Rahman');

  // Computed discrepancy in wizard
  const parsedActualCash = parseFloat(actualCashInput) || 0;
  const currentDiscrepancy = parsedActualCash - snapshot.expectedCashInDrawerBdt;

  const handleSendWhatsAppEod = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const message = generateWhatsAppEodReport(session);
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

  const handleSendWhatsAppPettyDigest = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const message = generateWhatsAppPettyDigest();
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

  const handleSelectCatalogItem = (item: GymPettyCatalogItem) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelectedCatalogItem(item);
    setItemQuantity(1);
    setExpTitle(item.name);
    setExpCategory(item.category);
    setExpAmount(String(item.standardRateBdt));
  };

  const handleQuantityChange = (delta: number) => {
    if (!selectedCatalogItem) return;
    const newQty = Math.max(1, itemQuantity + delta);
    setItemQuantity(newQty);
    setExpTitle(`${newQty > 1 ? `${newQty}x ` : ''}${selectedCatalogItem.name}`);
    setExpAmount(String(selectedCatalogItem.standardRateBdt * newQty));
  };

  const handleSavePettyExpense = async () => {
    const amount = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Expense', 'Please enter a valid expense title and amount.');
      return;
    }

    const approvalStatus: PettyVoucherStatus = amount <= 200 ? 'AUTO_APPROVED' : 'APPROVED';

    await logPettyExpense({
      category: expCategory,
      title: expTitle.trim(),
      catalogItemId: selectedCatalogItem?.id,
      amountBdt: amount,
      paidFrom: 'CASH_DRAWER',
      spentBy: expSpentBy.trim() || 'Staff',
      recipientName: expRecipientName.trim() || undefined,
      hasReceiptPhoto,
      approvalStatus,
      notes: expNotes.trim() || undefined,
    });

    setExpTitle('');
    setExpAmount('');
    setExpRecipientName('');
    setExpNotes('');
    setSelectedCatalogItem(null);
    setItemQuantity(1);
    setHasReceiptPhoto(false);
    setExpenseModalVisible(false);
  };

  const handleSaveCashDrop = async () => {
    const amount = parseFloat(dropAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash amount.');
      return;
    }

    await logCashDropToOwner({
      amountBdt: amount,
      receivedBy: dropReceivedBy.trim() || 'Owner',
      notes: dropNotes.trim() || undefined,
    });

    setDropAmount('');
    setDropNotes('');
    setCashDropModalVisible(false);
  };

  const handleConfirmClosing = async () => {
    if (currentDiscrepancy !== 0 && !discrepancyReason.trim()) {
      Alert.alert(
        'Discrepancy Reason Required',
        `There is a variance of ৳${Math.abs(currentDiscrepancy).toLocaleString()}. Please write an explanation note for the owner.`
      );
      return;
    }

    const res = await closeRegisterSession(
      parsedActualCash,
      closedByName.trim() || 'Shift Manager',
      discrepancyReason.trim() || undefined,
      eodNotes.trim() || undefined
    );

    setReconcileModalVisible(false);

    // Prompt to send WhatsApp report immediately
    Alert.alert(
      'Shift Successfully Closed 🌙',
      `Register session locked with ${res.discrepancyBdt === 0 ? 'Exact Match (৳0)' : `Variance ৳${res.discrepancyBdt}`}. Would you like to dispatch the WhatsApp EOD Dossier to the Owner now?`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Send WhatsApp Report',
          onPress: handleSendWhatsAppEod,
        },
      ]
    );
  };

  const handleStartNewSession = async () => {
    const floatAmt = parseFloat(openingFloatInput) || 0;
    await openNewRegisterSession(floatAmt, openedByName.trim() || 'Manager');
    setOpenSessionModalVisible(false);
  };

  const isClosed = session.status === 'CLOSED';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER BAR */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.iconFrame, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
              <Text style={{ fontSize: 18 }}>💵</Text>
            </View>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Daily Cash Register & Audit</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Drawer Session • Reconciliation • Nightly EOD
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 🌟 HERO DRAWER RADAR CARD */}
          <View
            style={[
              styles.heroRadarCard,
              {
                backgroundColor: isDark ? '#14171E' : '#F8F9FA',
                borderColor: isClosed ? '#FA5252' : '#40C057',
              },
            ]}>
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.statusBadge,
                  isClosed
                    ? { backgroundColor: 'rgba(250, 82, 82, 0.15)', borderColor: '#FA5252' }
                    : { backgroundColor: 'rgba(64, 192, 87, 0.15)', borderColor: '#40C057' },
                ]}>
                <View style={[styles.statusDot, { backgroundColor: isClosed ? '#FA5252' : '#40C057' }]} />
                <Text style={[styles.statusBadgeText, { color: isClosed ? '#FA5252' : '#40C057' }]}>
                  {isClosed ? 'REGISTER CLOSED & LOCKED' : 'REGISTER ACTIVE (OPEN)'}
                </Text>
              </View>

              <Text style={[styles.sessionOpenedText, { color: colors.textSecondary }]}>
                {session.openedBy} • {session.date}
              </Text>
            </View>

            {/* BIG EXPECTED CASH */}
            <View style={styles.cashNumberWrap}>
              <Text style={[styles.cashNumberLabel, { color: colors.textSecondary }]}>
                EXPECTED CASH IN DRAWER
              </Text>
              <Text style={[styles.cashNumberBig, { color: colors.primary }]}>
                ৳ {snapshot.expectedCashInDrawerBdt.toLocaleString()}
              </Text>
              <Text style={[styles.cashFormulaSub, { color: colors.textMuted }]}>
                Float (৳{session.openingFloatBdt}) + Cash In (৳{snapshot.cashCollectedBdt}) - Petty (৳{snapshot.pettyCashSpentBdt}) - Drops (৳{snapshot.cashDropsTotalBdt})
              </Text>
            </View>

            {/* 3 QUICK METRIC CHIPS */}
            <View style={styles.chipsRow}>
              <View style={[styles.chipItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>TOTAL GROSS REV</Text>
                <Text style={[styles.chipVal, { color: colors.textPrimary }]}>
                  ৳{snapshot.totalGrossRevenueBdt.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.chipItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>DIGITAL (BKASH/CARD)</Text>
                <Text style={[styles.chipVal, { color: '#339AF0' }]}>
                  ৳{(snapshot.bkashCollectedBdt + snapshot.cardCollectedBdt + snapshot.nagadCollectedBdt).toLocaleString()}
                </Text>
              </View>

              <View style={[styles.chipItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>PETTY EXPENSES</Text>
                <Text style={[styles.chipVal, { color: '#FA5252' }]}>
                  -৳{snapshot.pettyCashSpentBdt.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* ⚡ ACTION BAR */}
          <View style={styles.actionBarRow}>
            {!isClosed ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpenseModalVisible(true)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="receipt-long" size={16} color="#FFB800" />
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Log Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCashDropModalVisible(true)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="arrow-upward" size={16} color="#339AF0" />
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Cash to Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setActualCashInput(String(snapshot.expectedCashInDrawerBdt));
                    setReconcileModalVisible(true);
                  }}
                  style={[styles.actionBtnPrimary, { backgroundColor: '#FA5252' }]}>
                  <MaterialIcons name="lock-clock" size={16} color="#FFF" />
                  <Text style={styles.actionBtnPrimaryText}>Close Shift</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSendWhatsAppEod}
                  style={[styles.actionBtnPrimary, { backgroundColor: '#25D366' }]}>
                  <MaterialIcons name="chat" size={16} color="#FFF" />
                  <Text style={styles.actionBtnPrimaryText}>Send WhatsApp EOD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setOpenSessionModalVisible(true)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="lock-open" size={16} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Open New Session</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 📊 TODAY'S INFLOW CHANNELS BREAKDOWN */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Today's Payment Inflow Channels
              </Text>
            </View>

            <View style={styles.channelGrid}>
              <View style={[styles.channelItem, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>💵</Text>
                  <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>Cash Inflow</Text>
                </View>
                <Text style={[styles.channelAmount, { color: colors.primary }]}>
                  ৳{snapshot.cashCollectedBdt.toLocaleString()}
                </Text>
                <Text style={[styles.channelCount, { color: colors.textSecondary }]}>
                  {snapshot.paymentCountByMethod.Cash} Payments
                </Text>
              </View>

              <View style={[styles.channelItem, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>📱</Text>
                  <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>bKash Merchant</Text>
                </View>
                <Text style={[styles.channelAmount, { color: '#E2136E' }]}>
                  ৳{snapshot.bkashCollectedBdt.toLocaleString()}
                </Text>
                <Text style={[styles.channelCount, { color: colors.textSecondary }]}>
                  {snapshot.paymentCountByMethod.bKash} Payments
                </Text>
              </View>

              <View style={[styles.channelItem, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>💳</Text>
                  <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>POS Card</Text>
                </View>
                <Text style={[styles.channelAmount, { color: '#339AF0' }]}>
                  ৳{snapshot.cardCollectedBdt.toLocaleString()}
                </Text>
                <Text style={[styles.channelCount, { color: colors.textSecondary }]}>
                  {snapshot.paymentCountByMethod.Card} Payments
                </Text>
              </View>

              <View style={[styles.channelItem, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>⚡</Text>
                  <Text style={[styles.channelLabel, { color: colors.textPrimary }]}>Nagad Pay</Text>
                </View>
                <Text style={[styles.channelAmount, { color: '#F7941D' }]}>
                  ৳{snapshot.nagadCollectedBdt.toLocaleString()}
                </Text>
                <Text style={[styles.channelCount, { color: colors.textSecondary }]}>
                  {snapshot.paymentCountByMethod.Nagad} Payments
                </Text>
              </View>
            </View>
          </View>

          {/* 🧾 TODAY'S PETTY EXPENSES LIST */}
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="receipt" size={18} color="#FA5252" />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Petty Vouchers ({session.pettyExpenses.length})
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSendWhatsAppPettyDigest}
                style={[styles.smallDigestBtn, { backgroundColor: 'rgba(37, 211, 102, 0.15)', borderColor: '#25D366' }]}>
                <Text style={{ fontSize: 10 }}>💬</Text>
                <Text style={{ fontSize: 10, fontFamily: F.sansBold, color: '#25D366' }}>WhatsApp Digest</Text>
              </TouchableOpacity>
            </View>

            {/* Envelope health chip */}
            <View style={[styles.envelopeMiniCard, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.textPrimary }}>
                  💼 Petty Envelope: ৳{envelope.currentRemainingBalanceBdt.toLocaleString()} Left
                </Text>
                <Text style={{ fontSize: 10, fontFamily: F.mono, color: colors.textSecondary }}>
                  Float: ৳{envelope.totalAllocatedFloatBdt.toLocaleString()}
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary, marginTop: 2 }}>
                Spent today: ৳{envelope.todaySpentBdt.toLocaleString()} of ৳{envelope.dailySpendLimitBdt.toLocaleString()} limit ({session.pettyExpenses.length} vouchers)
              </Text>
            </View>

            {session.pettyExpenses.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No petty vouchers deducted from drawer today.
              </Text>
            ) : (
              session.pettyExpenses.map((e, index) => (
                <View
                  key={e.id}
                  style={[styles.voucherCardItem, { backgroundColor: isDark ? '#14171E' : '#F8F9FA', borderColor: colors.border }]}>
                  <View style={styles.voucherTopRow}>
                    <View style={styles.voucherBadgeWrap}>
                      <Text style={[styles.voucherCodeText, { color: colors.primary }]}>
                        {e.voucherNumber || `#PV-0${index + 1}`}
                      </Text>
                      <View style={[styles.approvalBadge, { backgroundColor: e.approvalStatus === 'AUTO_APPROVED' ? 'rgba(64, 192, 87, 0.15)' : 'rgba(51, 154, 240, 0.15)' }]}>
                        <Text style={{ fontSize: 8, fontFamily: F.monoBold, color: e.approvalStatus === 'AUTO_APPROVED' ? '#40C057' : '#339AF0' }}>
                          {e.approvalStatus === 'AUTO_APPROVED' ? '🟢 AUTO' : '🔵 APPROVED'}
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

                  <View style={styles.voucherMetaRow}>
                    <Text style={[styles.expenseMeta, { color: colors.textSecondary, flex: 1 }]}>
                      {e.time} • Spent by {e.spentBy} {e.recipientName ? `• Paid to: ${e.recipientName}` : ''}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 10 }}>{e.hasReceiptPhoto ? '📷' : '✍️'}</Text>
                      {!isClosed && (
                        <TouchableOpacity onPress={() => deletePettyExpense(e.id)}>
                          <MaterialIcons name="delete-outline" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 📤 CASH DROPS TO OWNER */}
          {session.cashDrops.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons name="savings" size={18} color="#339AF0" />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Cash Handover to Owner ({session.cashDrops.length})
                </Text>
              </View>

              {session.cashDrops.map((d) => (
                <View
                  key={d.id}
                  style={[styles.expenseRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.expenseTitle, { color: colors.textPrimary }]}>
                      Handed to {d.receivedBy}
                    </Text>
                    <Text style={[styles.expenseMeta, { color: colors.textSecondary }]}>
                      {d.time} {d.notes ? `• ${d.notes}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.expenseAmount, { color: '#339AF0' }]}>
                    -৳{d.amountBdt.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* 🌙 SUB-MODAL: 60-SECOND NIGHTLY RECONCILIATION WIZARD */}
        <Modal visible={reconcileModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.wizardCard, { backgroundColor: colors.surface }]}>
              <View style={styles.wizardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>🌙</Text>
                  <Text style={[styles.wizardTitle, { color: colors.textPrimary }]}>
                    Nightly Shift Closing & Audit
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReconcileModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                {/* 1. EXPECTED CASH */}
                <View style={[styles.wizardBox, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
                  <Text style={[styles.wizardBoxLabel, { color: colors.textSecondary }]}>
                    1. SYSTEM EXPECTED CASH IN HAND
                  </Text>
                  <Text style={[styles.wizardBoxValue, { color: colors.primary }]}>
                    ৳ {snapshot.expectedCashInDrawerBdt.toLocaleString()}
                  </Text>
                </View>

                {/* 2. ACTUAL COUNTED CASH */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                  2. COUNT PHYSICAL CASH IN DRAWER (BDT) *
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder="e.g. 12500"
                  placeholderTextColor={colors.textMuted}
                  value={actualCashInput}
                  onChangeText={setActualCashInput}
                />

                {/* 3. LIVE VARIANCE STATUS CARD */}
                <View
                  style={[
                    styles.varianceCard,
                    currentDiscrepancy === 0
                      ? { backgroundColor: 'rgba(64, 192, 87, 0.15)', borderColor: '#40C057' }
                      : currentDiscrepancy < 0
                      ? { backgroundColor: 'rgba(250, 82, 82, 0.15)', borderColor: '#FA5252' }
                      : { backgroundColor: 'rgba(51, 154, 240, 0.15)', borderColor: '#339AF0' },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons
                      name={currentDiscrepancy === 0 ? 'check-circle' : 'warning'}
                      size={20}
                      color={currentDiscrepancy === 0 ? '#40C057' : currentDiscrepancy < 0 ? '#FA5252' : '#339AF0'}
                    />
                    <Text
                      style={[
                        styles.varianceTitle,
                        { color: currentDiscrepancy === 0 ? '#40C057' : currentDiscrepancy < 0 ? '#FA5252' : '#339AF0' },
                      ]}>
                      {currentDiscrepancy === 0
                        ? 'PERFECT MATCH (৳0 Discrepancy) ✅'
                        : currentDiscrepancy < 0
                        ? `CASH SHORTAGE: -৳${Math.abs(currentDiscrepancy).toLocaleString()} ⚠️`
                        : `CASH SURPLUS: +৳${currentDiscrepancy.toLocaleString()} 💎`}
                    </Text>
                  </View>
                </View>

                {/* MANDATORY VARIANCE REASON IF NON-ZERO */}
                {currentDiscrepancy !== 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.inputLabel, { color: '#FA5252' }]}>
                      DISCREPANCY EXPLANATION NOTE (MANDATORY) *
                    </Text>
                    <TextInput
                      style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: '#FA5252' }]}
                      placeholder="e.g. ৳200 coin change shortage or missing receipt..."
                      placeholderTextColor={colors.textMuted}
                      value={discrepancyReason}
                      onChangeText={setDiscrepancyReason}
                    />
                  </View>
                )}

                {/* CLOSED BY */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  CLOSED BY (MANAGER NAME) *
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={closedByName}
                  onChangeText={setClosedByName}
                />
              </ScrollView>

              {/* MODAL FOOTER */}
              <View style={styles.wizardActions}>
                <TouchableOpacity
                  onPress={() => setReconcileModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmClosing}
                  style={[styles.confirmBtn, { backgroundColor: '#FA5252' }]}>
                  <MaterialIcons name="lock" size={14} color="#FFF" />
                  <Text style={styles.confirmBtnText}>Lock & Close Shift</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ➕ SUB-MODAL: 3-SECOND QUICK CATALOG PETTY EXPENSE LOGGER */}
        <Modal visible={expenseModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.wizardCard, { backgroundColor: colors.surface }]}>
              <View style={styles.wizardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>🧾</Text>
                  <Text style={[styles.wizardTitle, { color: colors.textPrimary }]}>
                    Log Petty Voucher
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                {/* Envelope Status Banner */}
                <View style={[styles.envelopeMiniCard, { backgroundColor: isDark ? '#14171E' : '#F8F9FA', marginBottom: 10 }]}>
                  <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.textPrimary }}>
                    💼 Envelope Balance: ৳{envelope.currentRemainingBalanceBdt.toLocaleString()} Left
                  </Text>
                  <Text style={{ fontSize: 9, fontFamily: F.mono, color: colors.textSecondary, marginTop: 1 }}>
                    Pre-allocated float: ৳{envelope.totalAllocatedFloatBdt.toLocaleString()}
                  </Text>
                </View>

                {/* 🏷️ PRE-APPROVED CATALOG CHIPS */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  ⚡ 3-SECOND PRE-APPROVED CATALOG (FIXED RATES)
                </Text>
                <View style={styles.catalogGrid}>
                  {catalog.map((item) => {
                    const isSelected = selectedCatalogItem?.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectCatalogItem(item)}
                        style={[
                          styles.catalogChip,
                          {
                            backgroundColor: isSelected ? 'rgba(137, 254, 0, 0.15)' : isDark ? '#14171E' : '#F8F9FA',
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}>
                        <MaterialIcons
                          name={item.icon as any}
                          size={14}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.catalogChipTitle,
                              { color: isSelected ? colors.primary : colors.textPrimary },
                            ]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.catalogChipPrice, { color: '#40C057' }]}>
                            ৳{item.standardRateBdt} <Text style={{ fontSize: 8, color: colors.textMuted }}>{item.unit}</Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* QUANTITY STEPPER (if catalog item selected) */}
                {selectedCatalogItem && (
                  <View style={[styles.stepperWrap, { backgroundColor: isDark ? '#14171E' : '#F8F9FA', borderColor: colors.border }]}>
                    <Text style={{ fontSize: 11, fontFamily: F.sansBold, color: colors.textPrimary }}>
                      Quantity ({selectedCatalogItem.unit})
                    </Text>

                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(-1)}
                        style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="remove" size={16} color={colors.textPrimary} />
                      </TouchableOpacity>

                      <Text style={[styles.stepperCount, { color: colors.primary }]}>
                        {itemQuantity}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleQuantityChange(1)}
                        style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="add" size={16} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>EXPENSE TITLE *</Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. 2x 20L Water Jars"
                  placeholderTextColor={colors.textMuted}
                  value={expTitle}
                  onChangeText={setExpTitle}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  AMOUNT (BDT) *
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder="160"
                  placeholderTextColor={colors.textMuted}
                  value={expAmount}
                  onChangeText={setExpAmount}
                />

                {/* 🚦 3-TIER SPEND GATE STATUS BADGE */}
                {parseFloat(expAmount) > 0 && (
                  <View
                    style={[
                      styles.tierBadgeBox,
                      {
                        backgroundColor:
                          parseFloat(expAmount) <= 200
                            ? 'rgba(64, 192, 87, 0.12)'
                            : parseFloat(expAmount) <= 500
                            ? 'rgba(255, 184, 0, 0.12)'
                            : 'rgba(250, 82, 82, 0.12)',
                        borderColor:
                          parseFloat(expAmount) <= 200
                            ? '#40C057'
                            : parseFloat(expAmount) <= 500
                            ? '#FFB800'
                            : '#FA5252',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tierBadgeText,
                        {
                          color:
                            parseFloat(expAmount) <= 200
                              ? '#40C057'
                              : parseFloat(expAmount) <= 500
                              ? '#FFB800'
                              : '#FA5252',
                        },
                      ]}>
                      {parseFloat(expAmount) <= 200
                        ? '🟢 Tier 1: Fast Auto-Approve (<৳200) — Zero Friction'
                        : parseFloat(expAmount) <= 500
                        ? '🟡 Tier 2: Medium Spend (৳200-৳500) — Photo Recommended'
                        : '🔴 Tier 3: High-Value Spend (>৳500) — High Risk Audit Trail'}
                    </Text>
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  RECIPIENT / SHOP NAME (OPTIONAL)
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. Kinley Delivery Agent / CleanCare"
                  placeholderTextColor={colors.textMuted}
                  value={expRecipientName}
                  onChangeText={setExpRecipientName}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  CATEGORY
                </Text>
                <View style={styles.categoryPillsWrap}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setExpCategory(c.value)}
                      style={[
                        styles.catPill,
                        expCategory === c.value
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}>
                      <MaterialIcons
                        name={c.icon}
                        size={12}
                        color={expCategory === c.value ? '#000' : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.catPillText,
                          { color: expCategory === c.value ? '#000' : colors.textPrimary },
                        ]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
                  SPENT BY (STAFF NAME)
                </Text>
                <TextInput
                  style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={expSpentBy}
                  onChangeText={setExpSpentBy}
                />
              </ScrollView>

              <View style={styles.wizardActions}>
                <TouchableOpacity
                  onPress={() => setExpenseModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSavePettyExpense}
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.confirmBtnText, { color: '#000' }]}>Save Voucher</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 📤 SUB-MODAL: CASH DROP TO OWNER */}
        <Modal visible={cashDropModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.wizardCard, { backgroundColor: colors.surface }]}>
              <View style={styles.wizardHeader}>
                <Text style={[styles.wizardTitle, { color: colors.textPrimary }]}>
                  Cash Handover / Drop to Owner
                </Text>
                <TouchableOpacity onPress={() => setCashDropModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                CASH AMOUNT HANDED (BDT) *
              </Text>
              <TextInput
                style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                placeholder="e.g. 10000"
                placeholderTextColor={colors.textMuted}
                value={dropAmount}
                onChangeText={setDropAmount}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                RECEIVED BY (OWNER NAME)
              </Text>
              <TextInput
                style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={dropReceivedBy}
                onChangeText={setDropReceivedBy}
              />

              <View style={styles.wizardActions}>
                <TouchableOpacity
                  onPress={() => setCashDropModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveCashDrop}
                  style={[styles.confirmBtn, { backgroundColor: '#339AF0' }]}>
                  <Text style={styles.confirmBtnText}>Record Handover</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 🟢 SUB-MODAL: OPEN NEW SESSION */}
        <Modal visible={openSessionModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.wizardCard, { backgroundColor: colors.surface }]}>
              <View style={styles.wizardHeader}>
                <Text style={[styles.wizardTitle, { color: colors.textPrimary }]}>
                  Open New Register Session
                </Text>
                <TouchableOpacity onPress={() => setOpenSessionModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                OPENING FLOAT / CHANGE MONEY (BDT) *
              </Text>
              <TextInput
                style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="numeric"
                placeholder="1000"
                placeholderTextColor={colors.textMuted}
                value={openingFloatInput}
                onChangeText={setOpeningFloatInput}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                OPENED BY (STAFF NAME)
              </Text>
              <TextInput
                style={[styles.wizardInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={openedByName}
                onChangeText={setOpenedByName}
              />

              <View style={styles.wizardActions}>
                <TouchableOpacity
                  onPress={() => setOpenSessionModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartNewSession}
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.confirmBtnText, { color: '#000' }]}>Start Session</Text>
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
  actionBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#FFF',
  },
  sectionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelItem: {
    width: '48.5%',
    padding: 10,
    borderRadius: 12,
    gap: 2,
  },
  channelLabel: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  channelAmount: {
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 4,
  },
  channelCount: {
    fontSize: 10,
    fontFamily: F.sans,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: F.sans,
    paddingVertical: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  expenseTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  expenseMeta: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  expenseAmount: {
    fontSize: 13,
    fontFamily: F.sansBold,
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
  wizardBox: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  wizardBoxLabel: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  wizardBoxValue: {
    fontSize: 22,
    fontFamily: F.sansExtraBold,
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
  varianceCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  varianceTitle: {
    fontSize: 12,
    fontFamily: F.sansBold,
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
  smallDigestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  envelopeMiniCard: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  voucherCardItem: {
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
  approvalBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voucherMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  catalogChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  catalogChipTitle: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  catalogChipPrice: {
    fontSize: 10,
    fontFamily: F.monoBold,
    marginTop: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCount: {
    fontSize: 14,
    fontFamily: F.monoBold,
    minWidth: 20,
    textAlign: 'center',
  },
  tierBadgeBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    alignItems: 'center',
  },
  tierBadgeText: {
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
});
