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

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useMedicineStore } from '@/stores/medicine-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface PharmacyItemRow {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  dosage: string;
  instructions: string;
  syncToCabinet: boolean;
}

interface PharmacyReceiptModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PharmacyReceiptModal({
  visible,
  onClose,
}: PharmacyReceiptModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const expenses = useHealthVaultStore((s) => s.expenses);
  const addMedicalExpense = useHealthVaultStore((s) => s.addMedicalExpense);
  const syncExpenseToExpenseTracker = useHealthVaultStore(
    (s) => s.syncExpenseToExpenseTracker
  );

  const initialMemberId =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [pharmacyName, setPharmacyName] = useState('Lazz Pharma Dhanmondi');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [receiptNotes, setReceiptNotes] = useState('');

  const [items, setItems] = useState<PharmacyItemRow[]>([
    {
      id: 'item_1',
      name: 'Telmisartan 40mg (Telma 40)',
      quantity: 30,
      unit: 'pill',
      price: 360,
      dosage: '1+0+0',
      instructions: 'After breakfast for Blood Pressure',
      syncToCabinet: true,
    },
    {
      id: 'item_2',
      name: 'Metformin 500mg (Comet 500)',
      quantity: 60,
      unit: 'pill',
      price: 420,
      dosage: '1+0+1',
      instructions: 'After meal for Diabetes',
      syncToCabinet: true,
    },
  ]);

  // Compute Total
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [items]);

  // Filter Pharmacy Expenses
  const pharmacyExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'MEDICINE')
      .filter((e) => (activeMemberId ? e.memberId === activeMemberId : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, activeMemberId]);

  const handleAddItemRow = () => {
    void Haptics.selectionAsync().catch(() => {});
    const newRow: PharmacyItemRow = {
      id: `item_${Date.now()}`,
      name: '',
      quantity: 30,
      unit: 'pill',
      price: 0,
      dosage: '1+0+1',
      instructions: 'After meal',
      syncToCabinet: true,
    };
    setItems((prev) => [...prev, newRow]);
  };

  const handleRemoveItemRow = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<PharmacyItemRow>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleSaveReceipt = async () => {
    if (items.length === 0 || totalAmount <= 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );

    // 1. Create Health Vault Medical Expense
    const expenseId = await addMedicalExpense({
      memberId: activeMemberId,
      category: 'MEDICINE',
      amount: totalAmount,
      date: purchaseDate,
      providerName: pharmacyName.trim() || 'Pharmacy Purchase',
      paymentMethod,
      notes: `${items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}${
        receiptNotes ? ` • Note: ${receiptNotes}` : ''
      }`,
      syncedToExpenseTracker: true,
    });

    // 2. Sync to Medicine Cabinet (useMedicineStore)
    const cabinetItems = items.filter((i) => i.syncToCabinet && i.name.trim());
    if (cabinetItems.length > 0) {
      try {
        const addMedicine = useMedicineStore.getState().addMedicine;
        for (const item of cabinetItems) {
          addMedicine({
            name: item.name.trim(),
            type: 'medicine',
            formFactor: 'pill',
            unit: 'pill',
            trackInventory: true,
            currentStock: item.quantity || 30,
            totalPackSize: item.quantity || 30,
            lowStockThreshold: 5,
            isAsNeeded: false,
            isCourse: true,
            courseDurationDays: Math.ceil((item.quantity || 30) / 2),
            courseStartDate: purchaseDate,
            instructions: item.instructions || 'As prescribed',
            schedules: [
              {
                id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                time: '08:00 AM',
                timeCategory: 'morning',
                doseAmount: 1,
                instructions: item.instructions,
              },
            ],
          });
        }
      } catch (e) {
        console.error('Failed to sync to medicine cabinet:', e);
      }
    }

    setIsAdding(false);
  };

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
                <MaterialIcons name="local-pharmacy" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>Pharmacy & Medicine Hub</Text>
                <Text style={styles.subtitle}>
                  Purchase Records & Medicine Cabinet Sync
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setIsAdding((prev) => !prev);
                }}
                style={styles.addBtn}>
                <MaterialIcons
                  name={isAdding ? 'close' : 'receipt-long'}
                  size={16}
                  color="#101416"
                />
                <Text style={styles.addBtnText}>
                  {isAdding ? 'Cancel' : 'Log Receipt'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MEMBER SELECTOR BAR */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              {members.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveMemberId(m.id);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: '#20C997',
                        borderColor: '#20C997',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#101416', fontFamily: F.bold },
                      ]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {isAdding ? (
              /* LOG PHARMACY PURCHASE FORM */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>NEW PHARMACY PURCHASE RECEIPT</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pharmacy / Chemist Name</Text>
                  <TextInput
                    style={styles.input}
                    value={pharmacyName}
                    onChangeText={setPharmacyName}
                    placeholder="e.g. Lazz Pharma, Tamanna Pharmacy"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Purchase Date</Text>
                    <TextInput
                      style={styles.input}
                      value={purchaseDate}
                      onChangeText={setPurchaseDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Payment Method</Text>
                    <TextInput
                      style={styles.input}
                      value={paymentMethod}
                      onChangeText={setPaymentMethod}
                      placeholder="bKash, Cash, Card"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                {/* ITEMIZED MEDICINE LIST */}
                <View style={styles.itemsSection}>
                  <View style={styles.itemsHeaderRow}>
                    <Text style={styles.itemsHeaderTitle}>
                      PURCHASED MEDICINES ({items.length})
                    </Text>
                    <TouchableOpacity
                      onPress={handleAddItemRow}
                      style={styles.addRowBtn}>
                      <MaterialIcons name="add" size={14} color="#20C997" />
                      <Text style={styles.addRowBtnText}>Add Drug</Text>
                    </TouchableOpacity>
                  </View>

                  {items.map((item, idx) => (
                    <View key={item.id} style={styles.itemRowCard}>
                      <View style={styles.itemRowTop}>
                        <Text style={styles.itemIdxText}>#{idx + 1}</Text>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={item.name}
                          onChangeText={(t) =>
                            handleUpdateItem(item.id, { name: t })
                          }
                          placeholder="Drug Brand / Generic Name"
                          placeholderTextColor={C.onSurfaceVariant}
                        />
                        {items.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleRemoveItemRow(item.id)}
                            style={styles.itemRemoveBtn}>
                            <MaterialIcons
                              name="close"
                              size={16}
                              color={C.onSurfaceVariant}
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>Qty (Units/Pills)</Text>
                          <TextInput
                            style={styles.input}
                            value={String(item.quantity || '')}
                            onChangeText={(t) =>
                              handleUpdateItem(item.id, {
                                quantity: parseInt(t) || 0,
                              })
                            }
                            keyboardType="numeric"
                          />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1.2 }]}>
                          <Text style={styles.inputLabel}>Line Total (৳)</Text>
                          <TextInput
                            style={[styles.input, styles.priceInput]}
                            value={String(item.price || '')}
                            onChangeText={(t) =>
                              handleUpdateItem(item.id, {
                                price: parseFloat(t) || 0,
                              })
                            }
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={styles.itemRowBottom}>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateItem(item.id, {
                              syncToCabinet: !item.syncToCabinet,
                            })
                          }
                          style={styles.syncToggleRow}>
                          <MaterialIcons
                            name={
                              item.syncToCabinet
                                ? 'check-box'
                                : 'check-box-outline-blank'
                            }
                            size={18}
                            color={item.syncToCabinet ? '#20C997' : C.onSurfaceVariant}
                          />
                          <Text style={styles.syncToggleText}>
                            Add to Medicine Cabinet (Stock = {item.quantity})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* TOTAL CARD */}
                <View style={styles.totalRowCard}>
                  <Text style={styles.totalLabel}>TOTAL AMOUNT:</Text>
                  <Text style={styles.totalValue}>৳{totalAmount}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveReceipt}
                  style={styles.saveReceiptBtn}>
                  <MaterialIcons name="inventory-2" size={18} color="#101416" />
                  <Text style={styles.saveReceiptBtnText}>
                    Save Receipt & Sync to Cabinet (৳{totalAmount})
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* PHARMACY PURCHASE HISTORY */
              <View style={styles.historyContainer}>
                {/* Spend Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.summaryLabel}>TOTAL PHARMACY SPENT</Text>
                    <Text style={styles.summaryValue}>
                      ৳
                      {pharmacyExpenses.reduce(
                        (sum, e) => sum + e.amount,
                        0
                      )}
                    </Text>
                  </View>
                  <View style={styles.summaryRight}>
                    <Text style={styles.summaryCount}>
                      {pharmacyExpenses.length} Receipts Logged
                    </Text>
                  </View>
                </View>

                {/* Receipts List */}
                <Text style={styles.sectionHeaderTitle}>
                  RECENT PHARMACY PURCHASES
                </Text>

                {pharmacyExpenses.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <MaterialIcons
                      name="receipt-long"
                      size={36}
                      color={C.onSurfaceVariant}
                    />
                    <Text style={styles.emptyTitle}>No Pharmacy Receipts Logged</Text>
                    <Text style={styles.emptySub}>
                      Log pharmacy receipts to itemize medicine purchases and auto-refill cabinet stock.
                    </Text>
                  </View>
                ) : (
                  pharmacyExpenses.map((exp) => (
                    <View key={exp.id} style={styles.receiptCard}>
                      <View style={styles.receiptTop}>
                        <View style={styles.pharmacyNameRow}>
                          <MaterialIcons
                            name="local-pharmacy"
                            size={16}
                            color="#20C997"
                          />
                          <Text style={styles.pharmacyName}>
                            {exp.providerName || 'Pharmacy Purchase'}
                          </Text>
                        </View>
                        <Text style={styles.receiptAmount}>৳{exp.amount}</Text>
                      </View>

                      <Text style={styles.receiptDate}>
                        {exp.date} • {exp.paymentMethod || 'Cash'}
                      </Text>

                      {exp.notes ? (
                        <View style={styles.notesBox}>
                          <Text style={styles.receiptNotesText}>{exp.notes}</Text>
                        </View>
                      ) : null}

                      <View style={styles.receiptBadgeRow}>
                        <View style={styles.syncedBadge}>
                          <MaterialIcons name="sync" size={12} color="#20C997" />
                          <Text style={styles.syncedBadgeText}>
                            Synced to Expense Tracker
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    borderBottomColor: 'rgba(32, 201, 151, 0.15)',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#20C997',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  closeBtn: {
    padding: 6,
  },
  membersBar: {
    backgroundColor: '#141A1D',
    paddingVertical: 8,
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#1A2226',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  scrollBody: {
    padding: 16,
    gap: 14,
  },
  formCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  formTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  input: {
    backgroundColor: '#13191C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontFamily: F.medium,
    fontSize: 12,
  },
  priceInput: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#20C997',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  itemsSection: {
    gap: 8,
    marginTop: 4,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addRowBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  itemRowCard: {
    backgroundColor: '#13191C',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  itemRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemIdxText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  itemRemoveBtn: {
    padding: 4,
  },
  itemRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncToggleText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  totalRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13191C',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  totalLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  totalValue: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#20C997',
  },
  saveReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveReceiptBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
  historyContainer: {
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  summaryLeft: {
    gap: 2,
  },
  summaryLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#20C997',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryCount: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  receiptCard: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  receiptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pharmacyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pharmacyName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  receiptAmount: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#20C997',
  },
  receiptDate: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  notesBox: {
    backgroundColor: '#13191C',
    borderRadius: 8,
    padding: 8,
  },
  receiptNotesText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#FFFFFF',
  },
  receiptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(32, 201, 151, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedBadgeText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: '#20C997',
  },
  emptyCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
});
