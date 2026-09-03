import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { GenericMedicineFinderModal } from '@/components/health-vault/generic-medicine-finder-modal';
import { Vital } from '@/constants/vital-theme';
import {
  MedicineRadarAnalysis,
  generatePharmacyShoppingList,
  scanCabinetRadar,
} from '@/services/medicine-radar-service';
import { useMedicineStore } from '@/stores/medicine-store';
import { MedicineItem } from '@/types/medicine';

const C = Vital.colors;
const F = Vital.fonts;

interface MedicineExpiryRadarModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MedicineExpiryRadarModal({
  visible,
  onClose,
}: MedicineExpiryRadarModalProps) {
  const medicines = useMedicineStore((s) => s.medicines);
  const refillStock = useMedicineStore((s) => s.refillStock);
  const deleteMedicine = useMedicineStore((s) => s.deleteMedicine);
  const openLogModal = useMedicineStore((s) => s.openLogModal);

  const [finderTarget, setFinderTarget] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const radarReport = useMemo(() => {
    return scanCabinetRadar(medicines);
  }, [medicines]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRefill = (med: MedicineItem, amount: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    refillStock(med.id, amount);
  };

  const handleDiscardExpired = (med: MedicineItem) => {
    Alert.alert(
      'মেয়াদোত্তীর্ণ ওষুধ অপসারণ',
      `আপনি কি নিশ্চিত যে "${med.name}" ড্রয়ার থেকে ফেলে দিয়ে লিস্ট থেকে মুছে ফেলতে চান?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'হ্যাঁ, ফেলে দিন',
          style: 'destructive',
          onPress: () => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            ).catch(() => {});
            deleteMedicine(med.id);
          },
        },
      ]
    );
  };

  const handleCopyShoppingList = async () => {
    const text = generatePharmacyShoppingList(radarReport.lowStockItems);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('ফার্মেসি শপিং লিস্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShoppingList = () => {
    const text = generatePharmacyShoppingList(radarReport.lowStockItems);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে লিস্টটি কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const { expiredItems, expiringSoonItems, lowStockItems, totalAlertsCount } =
    radarReport;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="radar" size={24} color="#EF4444" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Medicine Expiry & Refill Radar
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  মেডিসিন ড্রয়ার মেয়াদ ও স্টক রিফিল সতর্কতা
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => {}
                );
                onClose();
              }}
            >
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollInner}
            showsVerticalScrollIndicator={false}
          >
            {toastMsg && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.toastText}>{toastMsg}</Text>
              </View>
            )}

            {/* Top Summary Banner */}
            <View
              style={[
                styles.heroBanner,
                expiredItems.length > 0
                  ? styles.heroBannerDanger
                  : totalAlertsCount > 0
                  ? styles.heroBannerWarning
                  : styles.heroBannerSafe,
              ]}
            >
              <View style={styles.heroTopRow}>
                <MaterialIcons
                  name={
                    expiredItems.length > 0
                      ? 'warning'
                      : totalAlertsCount > 0
                      ? 'notification-important'
                      : 'verified'
                  }
                  size={24}
                  color={
                    expiredItems.length > 0
                      ? '#EF4444'
                      : totalAlertsCount > 0
                      ? '#F59E0B'
                      : '#10B981'
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroBannerTitle}>
                    {expiredItems.length > 0
                      ? '⚠️ ড্রয়ারে মেয়াদোত্তীর্ণ ওষুধ রয়েছে!'
                      : totalAlertsCount > 0
                      ? '🔔 ড্রয়ার স্টক ও মেয়াদ সতর্কতা'
                      : '✅ সকল ওষুধের মেয়াদ ও স্টক নিরাপদ'}
                  </Text>
                  <Text style={styles.heroBannerSub}>
                    {expiredItems.length > 0
                      ? 'মেয়াদোত্তীর্ণ ওষুধ অবিলম্বে ফেলে দিন। এটি বিষাক্ত হতে পারে।'
                      : totalAlertsCount > 0
                      ? `${lowStockItems.length}টি ওষুধের রিফিল এবং ${expiringSoonItems.length}টি ওষুধের মেয়াদ চেক করা প্রয়োজন।`
                      : 'আপনার ড্রয়ারের সকল ওষুধের স্টক পর্যাপ্ত এবং কোনো ওষুধ মেয়াদোত্তীর্ণ নয়।'}
                  </Text>
                </View>
              </View>

              {/* Counters */}
              <View style={styles.countersRow}>
                <View
                  style={[
                    styles.counterPill,
                    { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  <Text style={[styles.counterPillNum, { color: '#EF4444' }]}>
                    {expiredItems.length}
                  </Text>
                  <Text style={styles.counterPillLbl}>মেয়াদোত্তীর্ণ</Text>
                </View>

                <View
                  style={[
                    styles.counterPill,
                    { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                  ]}
                >
                  <Text style={[styles.counterPillNum, { color: '#F59E0B' }]}>
                    {expiringSoonItems.length}
                  </Text>
                  <Text style={styles.counterPillLbl}>আসন্ন মেয়াদ শেষ</Text>
                </View>

                <View
                  style={[
                    styles.counterPill,
                    { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
                  ]}
                >
                  <Text style={[styles.counterPillNum, { color: '#38BDF8' }]}>
                    {lowStockItems.length}
                  </Text>
                  <Text style={styles.counterPillLbl}>রিফিল দরকার</Text>
                </View>
              </View>
            </View>

            {/* 1. EXPIRED ITEMS ALERT */}
            {expiredItems.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialIcons name="dangerous" size={18} color="#EF4444" />
                  <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                    মেয়াদোত্তীর্ণ ওষুধসমূহ (ড্রয়ার থেকে অবিলম্বে ফেলুন)
                  </Text>
                </View>

                {expiredItems.map((item) => (
                  <View key={item.medicine.id} style={styles.expiredCard}>
                    <View style={styles.itemCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNameText}>
                          {item.medicine.name}
                        </Text>
                        <Text style={styles.itemDosageText}>
                          {item.medicine.strength || ''} {item.medicine.formFactor} •{' '}
                          {item.medicine.currentStock} {item.medicine.unit} বাকি
                        </Text>
                      </View>
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>
                          {item.expiryLabelBn}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.expiredWarningNote}>
                      {item.expiryMessageBn}
                    </Text>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.discardBtn}
                        onPress={() => handleDiscardExpired(item.medicine)}
                      >
                        <MaterialIcons
                          name="delete-forever"
                          size={16}
                          color="#EF4444"
                        />
                        <Text style={styles.discardBtnText}>
                          ড্রয়ার থেকে ফেলে দিন
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.findAltBtn}
                        onPress={() => setFinderTarget(item.medicine.name)}
                      >
                        <MaterialIcons
                          name="swap-horiz"
                          size={16}
                          color="#00B4D8"
                        />
                        <Text style={styles.findAltBtnText}>
                          নতুন পাতা ও বিকল্প খুঁজুন
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 2. EXPIRING WITHIN 30 DAYS */}
            {expiringSoonItems.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialIcons name="hourglass-bottom" size={18} color="#F59E0B" />
                  <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                    আসন্ন ৩০ দিনের মধ্যে মেয়াদ শেষ হবে
                  </Text>
                </View>

                {expiringSoonItems.map((item) => (
                  <View key={item.medicine.id} style={styles.warningCard}>
                    <View style={styles.itemCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNameText}>
                          {item.medicine.name}
                        </Text>
                        <Text style={styles.itemDosageText}>
                          মেয়াদ: {item.medicine.expiryDate} (
                          {item.daysUntilExpiry} দিন বাকি)
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.expiringPill,
                          {
                            backgroundColor: `${item.expiryBadgeColor}20`,
                            borderColor: item.expiryBadgeColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.expiringPillText,
                            { color: item.expiryBadgeColor },
                          ]}
                        >
                          {item.expiryLabelBn}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.warningCardSub}>
                      {item.expiryMessageBn}
                    </Text>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.findAltBtn}
                        onPress={() => setFinderTarget(item.medicine.name)}
                      >
                        <MaterialIcons
                          name="shopping-bag"
                          size={16}
                          color="#00B4D8"
                        />
                        <Text style={styles.findAltBtnText}>
                          নতুন মেয়াদযুক্ত পাতা কিনুন
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 3. LOW STOCK & DAYS-OF-SUPPLY REFILL ALERTS */}
            {lowStockItems.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialIcons name="inventory-2" size={18} color="#38BDF8" />
                  <Text style={[styles.sectionTitle, { color: '#38BDF8' }]}>
                    স্টক রিফিল অ্যালার্ট (দিনের স্টক কাউন্টডাউন)
                  </Text>
                </View>

                {/* 1-Tap Pharmacy Order / Shopping List Banner */}
                <View style={styles.pharmacyListBanner}>
                  <View style={styles.pharmacyBannerTop}>
                    <MaterialIcons name="local-pharmacy" size={22} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pharmacyBannerTitle}>
                        ফার্মেসি কেনাকাটার অর্ডার লিস্ট
                      </Text>
                      <Text style={styles.pharmacyBannerSub}>
                        {lowStockItems.length}টি ওষুধের স্টক কমে এসেছে। ১-ট্যাপে তালিকা কপি করে ফার্মেসিতে পাঠান।
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pharmacyBannerActionRow}>
                    <TouchableOpacity
                      onPress={handleCopyShoppingList}
                      style={styles.pharmacyCopyBtn}>
                      <MaterialIcons name="content-copy" size={14} color="#FFFFFF" />
                      <Text style={styles.pharmacyCopyBtnText}>লিস্ট কপি করুন</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleWhatsAppShoppingList}
                      style={styles.pharmacyWaBtn}>
                      <MaterialIcons name="share" size={14} color="#25D366" />
                      <Text style={styles.pharmacyWaBtnText}>WhatsApp-এ পাঠান</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {lowStockItems.map((item) => (
                  <View key={item.medicine.id} style={styles.refillCard}>
                    <View style={styles.itemCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNameText}>
                          {item.medicine.name}
                        </Text>
                        <Text style={styles.refillAlertHighlight}>
                          {item.refillMessageBn}
                        </Text>
                      </View>

                      <View style={styles.daysSupplyBadge}>
                        <Text style={styles.daysSupplyNum}>
                          {item.daysOfSupplyRemaining ?? 0}
                        </Text>
                        <Text style={styles.daysSupplyLbl}>দিন চলবে</Text>
                      </View>
                    </View>

                    {/* Quick 1-tap Refill Presets */}
                    <View style={styles.quickRefillRow}>
                      <Text style={styles.quickRefillLabel}>
                        ১-ট্যাপে রিফিল যোগ করুন:
                      </Text>
                      <View style={styles.refillPillsWrap}>
                        {[10, 20, 30].map((amt) => (
                          <TouchableOpacity
                            key={amt}
                            style={styles.refillAddPill}
                            onPress={() => handleRefill(item.medicine, amt)}
                          >
                            <Text style={styles.refillAddPillText}>
                              +{amt} {item.medicine.unit}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.findAltBtnSmall}
                          onPress={() => setFinderTarget(item.medicine.name)}
                        >
                          <MaterialIcons
                            name="swap-horiz"
                            size={14}
                            color="#00B4D8"
                          />
                          <Text style={styles.findAltBtnSmallText}>বিকল্প</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 4. SAFE STORAGE GUIDELINES */}
            <View style={styles.safetyGuideCard}>
              <View style={styles.safetyGuideHeader}>
                <MaterialIcons name="lightbulb" size={18} color="#FCC419" />
                <Text style={styles.safetyGuideTitle}>
                  ড্রয়ার ও ঔষধ সংরক্ষণের ৩টি আবশ্যকীয় নিয়ম
                </Text>
              </View>
              <View style={styles.safetyTipsList}>
                <Text style={styles.safetyTipItem}>
                  🌡️ <Text style={{ fontFamily: F.bold, color: C.onSurface }}>তাপমাত্রা ও আর্দ্রতা:</Text>{' '}
                  বাথরুমের ক্যাবিনেটে ওষুধ রাখবেন না; ভেজা স্যাঁতসেঁতে ভাব ও গরমে ওষুধের কার্যকারিতা নষ্ট হয়।
                </Text>
                <Text style={styles.safetyTipItem}>
                  ❄️ <Text style={{ fontFamily: F.bold, color: C.onSurface }}>ইনসুলিন ও চোখের ড্রপ:</Text>{' '}
                  ব্যবহার না করা ইনসুলিন ফ্রিজের ডোরে (২°-৮°C) রাখুন; খোলার পর ৩০ দিনের বেশি ব্যবহার করবেন না।
                </Text>
                <Text style={styles.safetyTipItem}>
                  🗄️ <Text style={{ fontFamily: F.bold, color: C.onSurface }}>মাসে একবার ড্রয়ার ক্লিনআপ:</Text>{' '}
                  প্রতি মাসের শুরুতে এক্সপায়ারি রাডার দিয়ে মেয়াদোত্তীর্ণ কাটা বা ভাঙা ট্যাবলেট সরিয়ে ফেলুন।
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* GENERIC MEDICINE ALTERNATIVE FINDER MODAL */}
          <GenericMedicineFinderModal
            visible={!!finderTarget}
            initialQuery={finderTarget || ''}
            onClose={() => setFinderTarget(null)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.onSurface,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroBanner: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  heroBannerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  heroBannerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  heroBannerSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroBannerTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  heroBannerSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
    marginTop: 2,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  counterPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterPillNum: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  counterPillLbl: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  expiredCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    gap: 10,
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemNameText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  itemDosageText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  expiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  expiredBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
  },
  expiredWarningNote: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#EF4444',
    lineHeight: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 8,
    borderRadius: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  discardBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  findAltBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.3)',
  },
  findAltBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#00B4D8',
  },
  warningCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 10,
  },
  expiringPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  expiringPillText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  warningCardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  refillCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 10,
  },
  refillAlertHighlight: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 3,
    lineHeight: 17,
  },
  daysSupplyBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  daysSupplyNum: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#38BDF8',
  },
  daysSupplyLbl: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  quickRefillRow: {
    gap: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  quickRefillLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  refillPillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  refillAddPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  refillAddPillText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  findAltBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.25)',
  },
  findAltBtnSmallText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#00B4D8',
  },
  safetyGuideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  safetyGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyGuideTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  safetyTipsList: {
    gap: 6,
  },
  safetyTipItem: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  toastWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 8,
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  pharmacyListBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 10,
    marginBottom: 10,
  },
  pharmacyBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pharmacyBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#38BDF8',
  },
  pharmacyBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  pharmacyBannerActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pharmacyCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    borderRadius: 8,
  },
  pharmacyCopyBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  pharmacyWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  pharmacyWaBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
});
