import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Vital } from '@/constants/vital-theme';
import { GenericMedicineFinderModal } from '@/components/health-vault/generic-medicine-finder-modal';
import { MedicineExpiryRadarModal } from '@/components/nutrition/medicine-expiry-radar-modal';
import { scanCabinetRadar } from '@/services/medicine-radar-service';
import { useMedicineStore } from '@/stores/medicine-store';
import {
  MedicineFormFactor,
  TimeCategory,
  TodayDoseView,
} from '@/types/medicine';

const C = Vital.colors;
const F = Vital.fonts;

const getTodayDateString = () => new Date().toISOString().split('T')[0];

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

const TIME_CATEGORY_LABELS: Record<
  TimeCategory,
  { label: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  morning: { label: 'MORNING', icon: 'wb-sunny' },
  afternoon: { label: 'AFTERNOON', icon: 'wb-iridescent' },
  evening: { label: 'EVENING', icon: 'wb-twilight' },
  night: { label: 'NIGHT', icon: 'nights-stay' },
};

const TIME_ORDER: TimeCategory[] = [
  'morning',
  'afternoon',
  'evening',
  'night',
];

const isOverdue = (timeStr: string) => {
  if (!timeStr) return false;
  const parts = timeStr.split(' ');
  if (parts.length !== 2) return false;
  const [time, modifier] = parts;
  const [hours, minutes] = time.split(':');
  let hrs = parseInt(hours, 10);
  const mins = parseInt(minutes, 10);
  if (modifier.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
  if (modifier.toUpperCase() === 'AM' && hrs === 12) hrs = 0;

  const now = new Date();
  const entryTime = new Date();
  entryTime.setHours(hrs, mins, 0, 0);
  return now > entryTime;
};

export function MedicineCard() {
  const dateStr = getTodayDateString();
  const medicines = useMedicineStore((s) => s.medicines);
  const logs = useMedicineStore((s) => s.logs);
  const getTodayDoses = useMedicineStore((s) => s.getTodayDoses);
  const getLowStockMedicines = useMedicineStore((s) => s.getLowStockMedicines);
  const toggleDose = useMedicineStore((s) => s.toggleDose);
  const openLogModal = useMedicineStore((s) => s.openLogModal);
  const openCabinetModal = useMedicineStore((s) => s.openCabinetModal);
  const [genericFinderOpen, setGenericFinderOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);

  const radarReport = useMemo(() => {
    return scanCabinetRadar(medicines);
  }, [medicines]);

  const todayDoses: TodayDoseView[] = useMemo(() => {
    return getTodayDoses(dateStr);
  }, [medicines, logs, dateStr, getTodayDoses]);

  const lowStockCount = useMemo(() => {
    return getLowStockMedicines().length;
  }, [medicines, getLowStockMedicines]);

  const completedCount = useMemo(
    () => todayDoses.filter((d) => d.isTaken).length,
    [todayDoses]
  );
  const totalCount = todayDoses.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const groupedDoses = useMemo(() => {
    const groups: Partial<Record<TimeCategory, TodayDoseView[]>> = {};
    todayDoses.forEach((item) => {
      if (!groups[item.timeCategory]) {
        groups[item.timeCategory] = [];
      }
      groups[item.timeCategory]!.push(item);
    });
    return groups;
  }, [todayDoses]);

  const handleToggle = (item: TodayDoseView) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        item.isTaken
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium
      );
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleDose(item.medicineId, item.scheduleId, dateStr);
  };

  return (
    <View style={styles.card}>
      {/* HEADER ROW */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.titleIconBox}>
            <MaterialIcons name="medical-services" size={18} color={C.primary} />
          </View>
          <View>
            <Text style={styles.title}>Supplements & Meds</Text>
            {totalCount > 0 && (
              <Text style={styles.subtitle}>
                {completedCount} of {totalCount} taken today ({progressPct}%)
              </Text>
            )}
          </View>
        </View>

        {/* HEADER ACTIONS */}
        <View style={styles.headerActions}>
          {/* EXPIRY & REFILL RADAR BUTTON */}
          <TouchableOpacity
            style={[
              styles.cabinetButton,
              radarReport.totalAlertsCount > 0 && {
                backgroundColor:
                  radarReport.expiredItems.length > 0
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                borderColor:
                  radarReport.expiredItems.length > 0 ? '#EF4444' : '#F59E0B',
              },
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              setRadarModalOpen(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Medicine Expiry Radar"
          >
            <MaterialIcons
              name="radar"
              size={18}
              color={
                radarReport.expiredItems.length > 0
                  ? '#EF4444'
                  : radarReport.totalAlertsCount > 0
                  ? '#F59E0B'
                  : C.onSurfaceVariant
              }
            />
            {radarReport.totalAlertsCount > 0 && (
              <View
                style={[
                  styles.lowStockDot,
                  {
                    backgroundColor:
                      radarReport.expiredItems.length > 0
                        ? '#EF4444'
                        : '#F59E0B',
                  },
                ]}
              >
                <Text style={styles.lowStockDotText}>
                  {radarReport.totalAlertsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* CABINET / INVENTORY BUTTON */}
          <TouchableOpacity
            style={[
              styles.cabinetButton,
              lowStockCount > 0 && styles.cabinetButtonAlert,
            ]}
            onPress={() => openCabinetModal('cabinet')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Medicine Cabinet"
          >
            <MaterialIcons
              name="inventory-2"
              size={18}
              color={lowStockCount > 0 ? '#FFA94D' : C.onSurfaceVariant}
            />
            {lowStockCount > 0 && (
              <View style={styles.lowStockDot}>
                <Text style={styles.lowStockDotText}>{lowStockCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ADD BUTTON */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openLogModal()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add Medicine"
          >
            <MaterialIcons name="add" size={20} color={C.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* MINI PROGRESS LINE */}
      {totalCount > 0 && (
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPct}%`,
                backgroundColor:
                  progressPct === 100 ? '#51CF66' : C.primary,
              },
            ]}
          />
        </View>
      )}

      {/* LIVE RADAR ALERT BANNER IF ALERTS EXIST */}
      {radarReport.totalAlertsCount > 0 && (
        <TouchableOpacity
          style={[
            styles.radarAlertBanner,
            radarReport.expiredItems.length > 0
              ? styles.radarAlertBannerDanger
              : styles.radarAlertBannerWarning,
          ]}
          onPress={() => setRadarModalOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={radarReport.expiredItems.length > 0 ? 'warning' : 'radar'}
            size={16}
            color={
              radarReport.expiredItems.length > 0 ? '#EF4444' : '#F59E0B'
            }
          />
          <Text
            style={[
              styles.radarAlertBannerText,
              {
                color:
                  radarReport.expiredItems.length > 0 ? '#EF4444' : '#F59E0B',
              },
            ]}
            numberOfLines={1}
          >
            {radarReport.expiredItems.length > 0
              ? `🚨 ড্রয়ারে ${radarReport.expiredItems.length}টি মেয়াদোত্তীর্ণ ওষুধ আছে!`
              : radarReport.lowStockItems.length > 0
              ? `📦 ${radarReport.lowStockItems[0]?.medicine.name} আর ${radarReport.lowStockItems[0]?.daysOfSupplyRemaining ?? 3} দিনের স্টক বাকি!`
              : `⏳ ${radarReport.expiringSoonItems.length}টি ওষুধের মেয়াদ ৩০ দিনে শেষ হবে!`}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={16}
            color={
              radarReport.expiredItems.length > 0 ? '#EF4444' : '#F59E0B'
            }
          />
        </TouchableOpacity>
      )}

      {/* TIMELINE LIST */}
      {totalCount === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="check-circle-outline"
            size={36}
            color={C.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>No doses scheduled for today</Text>
          <TouchableOpacity
            onPress={() => openCabinetModal('cabinet')}
            style={styles.openCabinetBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.openCabinetBtnText}>Manage Cabinet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        TIME_ORDER.map((timeCategory) => {
          const categoryDoses = groupedDoses[timeCategory];
          if (!categoryDoses || categoryDoses.length === 0) return null;

          const { label, icon } = TIME_CATEGORY_LABELS[timeCategory];

          return (
            <View key={timeCategory} style={styles.timeSection}>
              {/* SECTION HEADER */}
              <View style={styles.timeSectionHeader}>
                <MaterialIcons name={icon} size={15} color={C.primary} />
                <Text style={styles.timeSectionText}>{label}</Text>
              </View>

              {/* SECTION ITEMS */}
              <View style={styles.itemsList}>
                {categoryDoses.map((item) => {
                  const overdue = !item.isTaken && isOverdue(item.time);
                  const isLow =
                    item.trackInventory &&
                    item.currentStock <= item.lowStockThreshold;
                  const isOutOfStock =
                    item.trackInventory && item.currentStock <= 0;

                  const isSupplement = item.type === 'supplement';
                  const itemColor = isSupplement ? '#51CF66' : '#339AF0';

                  return (
                    <TouchableOpacity
                      key={`${item.medicineId}_${item.scheduleId}`}
                      activeOpacity={0.75}
                      style={[
                        styles.itemRow,
                        item.isTaken
                          ? styles.itemRowTaken
                          : overdue
                          ? styles.itemRowOverdue
                          : styles.itemRowPending,
                      ]}
                      onPress={() => handleToggle(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, ${item.doseAmount} ${item.unit}, scheduled for ${item.time}, ${item.isTaken ? 'Taken' : overdue ? 'Overdue' : 'Pending'}`}
                    >
                      {/* LEFT: ICON */}
                      <View
                        style={[
                          styles.itemIconBox,
                          { backgroundColor: `${itemColor}18` },
                        ]}
                      >
                        <MaterialIcons
                          name={
                            FORM_FACTOR_ICONS[item.formFactor] || 'medication'
                          }
                          size={20}
                          color={itemColor}
                        />
                      </View>

                      {/* MIDDLE: MAIN CONTENT */}
                      <View style={styles.itemContent}>
                        <View style={styles.itemNameLine}>
                          <Text
                            style={[
                              styles.itemName,
                              item.isTaken && styles.itemNameTaken,
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>

                          {/* STOCK PILL BADGE */}
                          {item.trackInventory && (
                            <View
                              style={[
                                styles.stockPill,
                                isOutOfStock
                                  ? styles.stockPillEmpty
                                  : isLow
                                  ? styles.stockPillLow
                                  : styles.stockPillNormal,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stockPillText,
                                  isOutOfStock
                                    ? { color: '#FF6B6B' }
                                    : isLow
                                    ? { color: '#FFA94D' }
                                    : { color: C.onSurfaceVariant },
                                ]}
                              >
                                {isOutOfStock
                                  ? 'Out of stock'
                                  : `${item.currentStock} left`}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.itemMeta} numberOfLines={1}>
                          {item.doseAmount} {item.unit}{' '}
                          {item.strength ? `(${item.strength})` : ''}
                          {item.instructions ? ` • ${item.instructions}` : ''}
                        </Text>
                      </View>

                      {/* RIGHT: TIME & STATUS TOGGLE */}
                      <View style={styles.statusBox}>
                        <View style={styles.timeLine}>
                          {overdue && (
                            <MaterialIcons
                              name="error-outline"
                              size={12}
                              color="#FF6B6B"
                              style={{ marginRight: 2 }}
                            />
                          )}
                          <Text
                            style={[
                              styles.timeText,
                              overdue && styles.timeTextOverdue,
                              item.isTaken && styles.timeTextTaken,
                            ]}
                          >
                            {item.time}
                          </Text>
                        </View>

                        {item.isTaken ? (
                          <View style={styles.takenBadge}>
                            <MaterialIcons
                              name="check"
                              size={12}
                              color="#51CF66"
                            />
                            <Text style={styles.takenBadgeText}>TAKEN</Text>
                          </View>
                        ) : overdue ? (
                          <View style={styles.actionBtnOverdue}>
                            <MaterialIcons
                              name="priority-high"
                              size={13}
                              color="#FF6B6B"
                            />
                          </View>
                        ) : (
                          <View style={styles.actionBtnPending} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })
      )}

      {/* GENERIC MEDICINE ALTERNATIVE FINDER BUTTON */}
      <TouchableOpacity
        style={styles.genericFinderBanner}
        onPress={() => {
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          setGenericFinderOpen(true);
        }}
        activeOpacity={0.75}
      >
        <View style={styles.genericFinderLeft}>
          <MaterialIcons name="swap-horizontal-circle" size={18} color="#00B4D8" />
          <Text style={styles.genericFinderText}>💊 বিকল্প ও MRP দাম তুলনা (Generic Finder)</Text>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={C.onSurfaceVariant} />
      </TouchableOpacity>

      <GenericMedicineFinderModal
        visible={genericFinderOpen}
        onClose={() => setGenericFinderOpen(false)}
      />

      <MedicineExpiryRadarModal
        visible={radarModalOpen}
        onClose={() => setRadarModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  titleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${C.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cabinetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${C.surfaceHigh}80`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cabinetButtonAlert: {
    backgroundColor: '#FFA94D20',
  },
  lowStockDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FFA94D',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  lowStockDotText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${C.surfaceHigh}80`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: `${C.surfaceHighest}60`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
  },
  openCabinetBtn: {
    backgroundColor: `${C.primary}18`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openCabinetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  timeSection: {
    marginTop: 6,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  timeSectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#15191C',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
  },
  itemRowPending: {},
  itemRowTaken: {
    backgroundColor: 'rgba(21, 25, 28, 0.6)',
  },
  itemRowOverdue: {
    backgroundColor: '#15191C',
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    gap: 3,
  },
  itemNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: F.sansBold,
    flexShrink: 1,
  },
  itemNameTaken: {
    color: C.onSurfaceVariant,
  },
  stockPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  stockPillNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  stockPillLow: {
    backgroundColor: 'rgba(255, 169, 77, 0.20)',
  },
  stockPillEmpty: {
    backgroundColor: 'rgba(255, 107, 107, 0.20)',
  },
  stockPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    fontFamily: F.sansRegular,
  },
  statusBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 70,
    marginLeft: 8,
    flexShrink: 0,
    gap: 4,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  timeTextOverdue: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  timeTextTaken: {
    color: C.onSurfaceVariant,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(81, 207, 102, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    height: 22,
  },
  takenBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#51CF66',
    letterSpacing: 0.5,
    fontFamily: F.sansBold,
  },
  actionBtnPending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionBtnOverdue: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genericFinderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.2)',
  },
  genericFinderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genericFinderText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#00B4D8',
  },
  radarAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 2,
  },
  radarAlertBannerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  radarAlertBannerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  radarAlertBannerText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 11,
  },
});


