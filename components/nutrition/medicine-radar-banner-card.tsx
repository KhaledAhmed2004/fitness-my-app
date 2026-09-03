import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MedicineExpiryRadarModal } from '@/components/nutrition/medicine-expiry-radar-modal';
import { Vital } from '@/constants/vital-theme';
import { scanCabinetRadar } from '@/services/medicine-radar-service';
import { useMedicineStore } from '@/stores/medicine-store';

const C = Vital.colors;
const F = Vital.fonts;

export function MedicineRadarBannerCard() {
  const medicines = useMedicineStore((s) => s.medicines);
  const [modalVisible, setModalVisible] = useState(false);

  const report = useMemo(() => {
    return scanCabinetRadar(medicines);
  }, [medicines]);

  const { expiredItems, expiringSoonItems, lowStockItems, totalAlertsCount } = report;

  // If no alerts, return null or compact safe badge
  if (totalAlertsCount === 0) return null;

  const isDanger = expiredItems.length > 0;
  const isWarning = !isDanger && (expiringSoonItems.length > 0 || lowStockItems.length > 0);

  const bannerBg = isDanger
    ? 'rgba(239, 68, 68, 0.12)'
    : 'rgba(245, 158, 11, 0.12)';
  const borderColor = isDanger
    ? 'rgba(239, 68, 68, 0.35)'
    : 'rgba(245, 158, 11, 0.35)';
  const accentColor = isDanger ? '#EF4444' : '#F59E0B';

  const headline = isDanger
    ? `🚨 ড্রয়ারে ${expiredItems.length}টি মেয়াদোত্তীর্ণ ওষুধ পাওয়া গেছে!`
    : lowStockItems.length > 0
    ? `📦 ${lowStockItems[0]?.medicine.name} এর স্টক আর ${lowStockItems[0]?.daysOfSupplyRemaining ?? 3} দিনের বাকি!`
    : `⏳ ${expiringSoonItems.length}টি ওষুধের মেয়াদ ৩০ দিনের মধ্যে শেষ হবে!`;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setModalVisible(true);
        }}
        style={[
          styles.container,
          { backgroundColor: bannerBg, borderColor: borderColor },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}25` }]}>
          <MaterialIcons
            name={isDanger ? 'dangerous' : 'radar'}
            size={20}
            color={accentColor}
          />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.badgeRow}>
            <Text style={[styles.title, { color: accentColor }]}>
              মেডিসিন মেয়াদ ও স্টক রাডার
            </Text>
            <View style={[styles.pill, { backgroundColor: `${accentColor}25` }]}>
              <Text style={[styles.pillText, { color: accentColor }]}>
                {totalAlertsCount}টি সতর্কতা
              </Text>
            </View>
          </View>
          <Text style={styles.subText} numberOfLines={1}>
            {headline}
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={20} color={accentColor} />
      </TouchableOpacity>

      <MedicineExpiryRadarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginVertical: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  subText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
  },
});
