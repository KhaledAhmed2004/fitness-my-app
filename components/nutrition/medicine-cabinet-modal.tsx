import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { GenericMedicineFinderModal } from '@/components/health-vault/generic-medicine-finder-modal';
import { MedicineExpiryRadarModal } from '@/components/nutrition/medicine-expiry-radar-modal';
import {
  getDaysOfSupply,
  getExpiryDetails,
  scanCabinetRadar,
} from '@/services/medicine-radar-service';
import { useMedicineStore } from '@/stores/medicine-store';
import {
  MedicineFormFactor,
  MedicineItem,
  TimeCategory,
} from '@/types/medicine';

const C = Vital.colors;
const F = Vital.fonts;

const FORM_FACTOR_ICONS: Record<
  MedicineFormFactor,
  keyof typeof MaterialIcons.glyphMap
> = {
  pill: 'medication',
  capsule: 'medication-liquid',
  syrup: 'water-drop',
  drop: 'opacity',
  injection: 'vaccines',
  powder: 'blur-on',
  gummy: 'catching-pokemon',
  puff: 'air',
  application: 'clean-hands',
};

const TIME_ICONS: Record<TimeCategory, keyof typeof MaterialIcons.glyphMap> = {
  morning: 'wb-sunny',
  afternoon: 'wb-iridescent',
  evening: 'wb-twilight',
  night: 'nights-stay',
};

export function MedicineCabinetModal() {
  const isOpen = useMedicineStore((s) => s.isCabinetModalOpen);
  const activeTab = useMedicineStore((s) => s.activeCabinetTab);
  const setTab = useMedicineStore((s) => s.setCabinetTab);
  const closeModal = useMedicineStore((s) => s.closeCabinetModal);
  const openLogModal = useMedicineStore((s) => s.openLogModal);

  const medicines = useMedicineStore((s) => s.medicines);
  const refillStock = useMedicineStore((s) => s.refillStock);
  const deleteMedicine = useMedicineStore((s) => s.deleteMedicine);
  const logAsNeededDose = useMedicineStore((s) => s.logAsNeededDose);
  const getLowStockMedicines = useMedicineStore((s) => s.getLowStockMedicines);
  const getAdherenceStats = useMedicineStore((s) => s.getAdherenceStats);

  // Refill Sheet State
  const [refillTarget, setRefillTarget] = useState<MedicineItem | null>(null);
  const [customRefillAmount, setCustomRefillAmount] = useState('');
  const [finderTarget, setFinderTarget] = useState<string | null>(null);
  const [radarModalOpen, setRadarModalOpen] = useState(false);

  const lowStockItems = getLowStockMedicines();
  const adherence = getAdherenceStats(7);

  const handleRefill = (amount: number) => {
    if (!refillTarget) return;
    refillStock(refillTarget.id, amount);
    setRefillTarget(null);
    setCustomRefillAmount('');
  };

  const handleCustomRefill = () => {
    const val = parseInt(customRefillAmount, 10);
    if (isNaN(val) || val <= 0) return;
    handleRefill(val);
  };

  const confirmDelete = (item: MedicineItem) => {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to remove "${item.name}" from your cabinet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteMedicine(item.id);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
            }
          },
        },
      ]
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="medical-services" size={24} color={C.primary} />
              <Text style={styles.headerTitle}>Medicine Cabinet</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Manage inventory, refills & schedules
            </Text>
          </View>

          <TouchableOpacity
            onPress={closeModal}
            hitSlop={12}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* TOP ACTION BAR: ADD NEW & EXPIRY RADAR */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => {
              closeModal();
              openLogModal();
            }}
            activeOpacity={0.85}
            style={styles.addNewBtn}
          >
            <MaterialIcons name="add" size={20} color="#00344D" />
            <Text style={styles.addNewText}>Add New Medication</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              setRadarModalOpen(true);
            }}
            activeOpacity={0.85}
            style={styles.radarHeaderBtn}
          >
            <MaterialIcons name="radar" size={18} color="#EF4444" />
            <Text style={styles.radarHeaderBtnText}>মেয়াদ ও স্টক রাডার</Text>
          </TouchableOpacity>
        </View>

        {/* ALERTS SECTION (LOW STOCK) */}
        {lowStockItems.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconBox}>
              <MaterialIcons name="warning-amber" size={20} color="#FFA94D" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}{' '}
                low on stock!
              </Text>
              <Text style={styles.alertSub}>
                {lowStockItems.map((m) => m.name).join(', ')}{' '}
                {lowStockItems.length === 1 ? 'needs' : 'need'} refilling soon.
              </Text>
            </View>
          </View>
        )}

        {/* TABS */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setTab('cabinet')}
            activeOpacity={0.7}
            style={[styles.tabBtn, activeTab === 'cabinet' && styles.tabBtnActive]}
          >
            <MaterialIcons
              name="inventory-2"
              size={18}
              color={activeTab === 'cabinet' ? C.primary : C.onSurfaceVariant}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'cabinet' && styles.tabTextActive,
              ]}
            >
              Cabinet ({medicines.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab('schedules')}
            activeOpacity={0.7}
            style={[
              styles.tabBtn,
              activeTab === 'schedules' && styles.tabBtnActive,
            ]}
          >
            <MaterialIcons
              name="schedule"
              size={18}
              color={activeTab === 'schedules' ? C.primary : C.onSurfaceVariant}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'schedules' && styles.tabTextActive,
              ]}
            >
              Schedules
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab('history')}
            activeOpacity={0.7}
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          >
            <MaterialIcons
              name="insights"
              size={18}
              color={activeTab === 'history' ? C.primary : C.onSurfaceVariant}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.tabTextActive,
              ]}
            >
              Adherence
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENTS */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'cabinet' && (
            <CabinetView
              medicines={medicines}
              onRefillPress={(item) => setRefillTarget(item)}
              onEditPress={(item) => {
                closeModal();
                openLogModal(item);
              }}
              onDeletePress={confirmDelete}
              onTakeAsNeeded={(item) => logAsNeededDose(item.id, 1)}
              onFindAlternatives={(item) => setFinderTarget(item.name)}
            />
          )}

          {activeTab === 'schedules' && (
            <SchedulesView
              medicines={medicines}
              onEditPress={(item) => {
                closeModal();
                openLogModal(item);
              }}
            />
          )}

          {activeTab === 'history' && (
            <AdherenceView adherence={adherence} medicines={medicines} />
          )}
        </ScrollView>

        {/* REFILL ACTION MODAL / SHEET */}
        {refillTarget && (
          <Modal
            transparent
            visible={!!refillTarget}
            animationType="fade"
            onRequestClose={() => setRefillTarget(null)}
          >
            <View style={styles.refillOverlay}>
              <View style={styles.refillCard}>
                <View style={styles.refillHeader}>
                  <View>
                    <Text style={styles.refillTitle}>
                      Refill {refillTarget.name}
                    </Text>
                    <Text style={styles.refillSubtitle}>
                      Current Stock: {refillTarget.currentStock}{' '}
                      {refillTarget.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setRefillTarget(null)}
                    hitSlop={10}
                    style={styles.refillCloseBtn}
                  >
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={C.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.refillSectionLabel}>Quick Presets</Text>
                <View style={styles.presetRow}>
                  {[10, 30, 60, 90].map((count) => (
                    <TouchableOpacity
                      key={count}
                      onPress={() => handleRefill(count)}
                      activeOpacity={0.75}
                      style={styles.presetBtn}
                    >
                      <Text style={styles.presetText}>+{count}</Text>
                      <Text style={styles.presetUnit}>{refillTarget.unit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.refillSectionLabel, { marginTop: 16 }]}>
                  Or Custom Quantity
                </Text>
                <View style={styles.customRefillRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="e.g. 15"
                    placeholderTextColor={C.onSurfaceVariant}
                    keyboardType="numeric"
                    value={customRefillAmount}
                    onChangeText={setCustomRefillAmount}
                  />
                  <TouchableOpacity
                    onPress={handleCustomRefill}
                    disabled={!customRefillAmount}
                    activeOpacity={0.8}
                    style={[
                      styles.customRefillSubmit,
                      !customRefillAmount && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.customSubmitText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* GENERIC MEDICINE ALTERNATIVE FINDER MODAL */}
        <GenericMedicineFinderModal
          visible={!!finderTarget}
          initialQuery={finderTarget || ''}
          onClose={() => setFinderTarget(null)}
        />

        {/* MEDICINE EXPIRY & REFILL RADAR MODAL */}
        <MedicineExpiryRadarModal
          visible={radarModalOpen}
          onClose={() => setRadarModalOpen(false)}
        />
      </View>
    </Modal>
  );
}

// ----------------------------------------------------
// 1. CABINET VIEW
// ----------------------------------------------------
function CabinetView({
  medicines,
  onRefillPress,
  onEditPress,
  onDeletePress,
  onTakeAsNeeded,
  onFindAlternatives,
}: {
  medicines: MedicineItem[];
  onRefillPress: (item: MedicineItem) => void;
  onEditPress: (item: MedicineItem) => void;
  onDeletePress: (item: MedicineItem) => void;
  onTakeAsNeeded: (item: MedicineItem) => void;
  onFindAlternatives: (item: MedicineItem) => void;
}) {
  if (medicines.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="inventory" size={48} color={C.onSurfaceVariant} />
        <Text style={styles.emptyTitle}>Cabinet is empty</Text>
        <Text style={styles.emptySub}>
          Add your prescriptions or dietary supplements to track stock and daily
          reminders.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {medicines.map((item) => {
        const isLow =
          item.trackInventory && item.currentStock <= item.lowStockThreshold;
        const isOutOfStock = item.trackInventory && item.currentStock <= 0;
        const totalPack = item.totalPackSize || 30;
        const stockPct = Math.min(
          100,
          Math.round((item.currentStock / totalPack) * 100)
        );

        const dailyDoses =
          item.schedules?.reduce((acc, s) => acc + (s.doseAmount || 1), 0) || 1;
        const daysSupply = item.trackInventory
          ? Math.floor(item.currentStock / dailyDoses)
          : null;

        const isSupplement = item.type === 'supplement';
        const accentColor = isSupplement ? '#51CF66' : '#339AF0';

        return (
          <View
            key={item.id}
            style={[styles.itemCard, isLow && styles.itemCardLowStock]}
          >
            {/* ITEM TOP ROW */}
            <View style={styles.itemTopRow}>
              <View
                style={[
                  styles.itemIconBox,
                  { backgroundColor: `${accentColor}1A` },
                ]}
              >
                <MaterialIcons
                  name={FORM_FACTOR_ICONS[item.formFactor] || 'medication'}
                  size={24}
                  color={accentColor}
                />
              </View>

              <View style={styles.itemMainInfo}>
                <View style={styles.itemNameRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: `${accentColor}20` },
                    ]}
                  >
                    <Text style={[styles.typeBadgeText, { color: accentColor }]}>
                      {item.type}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemMeta} numberOfLines={1}>
                  {item.strength ? `${item.strength} • ` : ''}
                  {item.formFactor}
                  {item.instructions ? ` • ${item.instructions}` : ''}
                </Text>
              </View>

              {/* ACTION MENU (EDIT/DELETE) */}
              <View style={styles.itemActions}>
                <TouchableOpacity
                  onPress={() => onEditPress(item)}
                  hitSlop={8}
                  style={styles.iconBtn}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={C.onSurfaceVariant}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeletePress(item)}
                  hitSlop={8}
                  style={styles.iconBtn}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* INVENTORY GAUGES & SUPPLY */}
            {item.trackInventory && (
              <View style={styles.inventorySection}>
                <View style={styles.stockLabelRow}>
                  <Text style={styles.stockLabel}>Stock Level</Text>
                  <View style={styles.stockValuesRow}>
                    <Text
                      style={[
                        styles.stockCount,
                        isOutOfStock
                          ? { color: '#FF6B6B' }
                          : isLow
                          ? { color: '#FFA94D' }
                          : { color: C.onSurface },
                      ]}
                    >
                      {item.currentStock} / {totalPack} {item.unit}
                    </Text>
                    {daysSupply !== null && (
                      <Text style={styles.daysSupplyText}>
                        (~{daysSupply}d supply)
                      </Text>
                    )}
                  </View>
                </View>

                {/* VISUAL STOCK PROGRESS BAR */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${stockPct}%`,
                        backgroundColor: isOutOfStock
                          ? '#FF6B6B'
                          : isLow
                          ? '#FFA94D'
                          : accentColor,
                      },
                    ]}
                  />
                </View>

                {/* STATUS BADGES & REFILL ACTION */}
                <View style={styles.stockBottomRow}>
                  <View style={styles.badgesCluster}>
                    {isOutOfStock ? (
                      <View style={styles.outOfStockBadge}>
                        <MaterialIcons
                          name="error-outline"
                          size={12}
                          color="#FF6B6B"
                        />
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                      </View>
                    ) : isLow ? (
                      <View style={styles.lowStockBadge}>
                        <MaterialIcons
                          name="warning"
                          size={12}
                          color="#FFA94D"
                        />
                        <Text style={styles.lowStockText}>
                          Refill recommended
                        </Text>
                      </View>
                    ) : null}

                    {item.expiryDate && (() => {
                      const expDetails = getExpiryDetails(item);
                      return (
                        <View
                          style={[
                            styles.expiryBadge,
                            {
                              backgroundColor: `${expDetails.color}15`,
                              borderColor: `${expDetails.color}40`,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={
                              expDetails.status === 'EXPIRED'
                                ? 'dangerous'
                                : 'event'
                            }
                            size={12}
                            color={expDetails.color}
                          />
                          <Text
                            style={[
                              styles.expiryText,
                              { color: expDetails.color, fontFamily: F.bold },
                            ]}
                          >
                            {expDetails.labelBn}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={styles.buttonGroup}>
                    {item.isAsNeeded && (
                      <TouchableOpacity
                        onPress={() => onTakeAsNeeded(item)}
                        activeOpacity={0.8}
                        style={styles.takeNowBtn}
                      >
                        <MaterialIcons
                          name="check-circle-outline"
                          size={14}
                          color="#FFF"
                        />
                        <Text style={styles.takeNowText}>Take 1</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => onFindAlternatives(item)}
                      activeOpacity={0.8}
                      style={styles.findAltBtn}
                    >
                      <MaterialIcons name="swap-horiz" size={14} color="#00B4D8" />
                      <Text style={styles.findAltBtnText}>বিকল্প</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onRefillPress(item)}
                      activeOpacity={0.8}
                      style={styles.refillBtn}
                    >
                      <MaterialIcons name="add" size={14} color={C.primary} />
                      <Text style={styles.refillBtnText}>Refill</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ----------------------------------------------------
// 2. SCHEDULES VIEW
// ----------------------------------------------------
function SchedulesView({
  medicines,
  onEditPress,
}: {
  medicines: MedicineItem[];
  onEditPress: (item: MedicineItem) => void;
}) {
  const scheduledMeds = medicines.filter(
    (m) => m.schedules && m.schedules.length > 0
  );

  if (scheduledMeds.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="event-busy" size={48} color={C.onSurfaceVariant} />
        <Text style={styles.emptyTitle}>No daily schedules</Text>
        <Text style={styles.emptySub}>
          Edit a medication to add morning, afternoon, evening, or night dosage
          times.
        </Text>
      </View>
    );
  }

  const times: TimeCategory[] = ['morning', 'afternoon', 'evening', 'night'];

  return (
    <View style={styles.listContainer}>
      {times.map((cat) => {
        const matches: { med: MedicineItem; sch: any }[] = [];
        scheduledMeds.forEach((m) => {
          m.schedules.forEach((s) => {
            if (s.timeCategory === cat) {
              matches.push({ med: m, sch: s });
            }
          });
        });

        if (matches.length === 0) return null;

        return (
          <View key={cat} style={styles.scheduleBlock}>
            <View style={styles.scheduleHeaderRow}>
              <MaterialIcons name={TIME_ICONS[cat]} size={16} color={C.primary} />
              <Text style={styles.scheduleBlockTitle}>
                {cat.toUpperCase()} DOSES
              </Text>
            </View>

            {matches.map(({ med, sch }) => (
              <View key={`${med.id}_${sch.id}`} style={styles.scheduleItemRow}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleMedName}>{med.name}</Text>
                  <Text style={styles.scheduleDoseSub}>
                    {sch.doseAmount} {med.unit}{' '}
                    {med.strength ? `(${med.strength})` : ''} • {sch.time}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onEditPress(med)}
                  activeOpacity={0.7}
                  style={styles.scheduleEditBtn}
                >
                  <Text style={styles.scheduleEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

// ----------------------------------------------------
// 3. ADHERENCE VIEW
// ----------------------------------------------------
function AdherenceView({
  adherence,
  medicines,
}: {
  adherence: { totalDoses: number; takenDoses: number; percentage: number };
  medicines: MedicineItem[];
}) {
  return (
    <View style={styles.listContainer}>
      {/* STATS HERO */}
      <View style={styles.adherenceHero}>
        <View style={styles.adherenceCircle}>
          <Text style={styles.adherenceNumber}>{adherence.percentage}%</Text>
          <Text style={styles.adherenceLabel}>7-day Adherence</Text>
        </View>

        <View style={styles.adherenceStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{adherence.takenDoses}</Text>
            <Text style={styles.statSub}>Doses Taken</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{adherence.totalDoses}</Text>
            <Text style={styles.statSub}>Target Doses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{medicines.length}</Text>
            <Text style={styles.statSub}>Cabinet Meds</Text>
          </View>
        </View>
      </View>

      {/* HEALTH TIPS */}
      <View style={styles.tipCard}>
        <MaterialIcons name="lightbulb" size={20} color="#FCC419" />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Consistency Insight</Text>
          <Text style={styles.tipBody}>
            Taking supplements like Vitamin D and Omega-3 with meals enhances
            absorption by up to 50%. Keep up your daily routine!
          </Text>
        </View>
      </View>
    </View>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNewBtn: {
    backgroundColor: '#89CEFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
    flex: 1,
  },
  addNewText: {
    color: '#00344D',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  radarHeaderBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 6,
  },
  radarHeaderBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  alertBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFA94D18',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFA94D25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFA94D',
    fontFamily: F.sansBold,
  },
  alertSub: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
    marginTop: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.surfaceContainerLow,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: `${C.primary}22`,
  },
  tabText: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  emptySub: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontFamily: F.sansRegular,
  },
  itemCard: {
    backgroundColor: '#161B1F',
    borderRadius: 16,
    padding: 16,
  },
  itemCardLowStock: {
    backgroundColor: '#1B1B1C',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemMainInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontFamily: F.sansBold,
  },
  itemMeta: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventorySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 12,
  },
  stockLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockCount: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: F.sansBold,
  },
  daysSupplyText: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  badgesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  outOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B6B1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFA94D1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lowStockText: {
    fontSize: 11,
    color: '#FFA94D',
    fontWeight: '600',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expiryText: {
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  takeNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#51CF66',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  takeNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  refillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 206, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  refillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
    fontFamily: F.sansBold,
  },
  findAltBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 180, 216, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  findAltBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B4D8',
    fontFamily: F.sansBold,
  },
  // SCHEDULES STYLES
  scheduleBlock: {
    backgroundColor: '#161B1F',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  scheduleBlockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.8,
  },
  scheduleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleLeft: {
    flex: 1,
    minWidth: 0,
  },
  scheduleMedName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  scheduleDoseSub: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
    marginTop: 1,
  },
  scheduleEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: C.surfaceContainerHigh,
  },
  scheduleEditText: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontWeight: '600',
  },
  // ADHERENCE STYLES
  adherenceHero: {
    backgroundColor: '#161B1F',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  adherenceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adherenceNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  adherenceLabel: {
    fontSize: 10,
    color: C.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  adherenceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  statSub: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#161B1F',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  tipBody: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
    fontFamily: F.sansRegular,
  },
  // REFILL OVERLAY STYLES
  refillOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  refillCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161B1F',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  refillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  refillTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  refillSubtitle: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  refillCloseBtn: {
    padding: 4,
  },
  refillSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: `${C.primary}18`,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
    fontFamily: F.sansBold,
  },
  presetUnit: {
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  customRefillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customInput: {
    flex: 1,
    backgroundColor: C.surfaceLowest,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.onSurface,
    fontSize: 14,
  },
  customRefillSubmit: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSubmitText: {
    color: '#00344D',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
});
