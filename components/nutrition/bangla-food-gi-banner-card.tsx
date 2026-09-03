import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BanglaFoodGiModal } from '@/components/nutrition/bangla-food-gi-modal';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

export function BanglaFoodGiBannerCard() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpen = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpen}
        style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="eco" size={22} color="#10B981" />
          </View>
          <View style={styles.titleWrap}>
            <View style={styles.headerBadgeRow}>
              <Text style={styles.title}>দেশীয় খাবারের সুগার ও GI গাইড</Text>
              <View style={styles.superBadge}>
                <Text style={styles.superBadgeText}>১০০+ খাবার</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              লাল চাল, দেশি মাছ, শাকসবজি ও ফলের গ্লাইসেমিক ইনডেক্স ও প্লেট পরীক্ষা
            </Text>
          </View>
        </View>

        {/* Quick Food Snippets Row */}
        <View style={styles.snippetsRow}>
          <View style={[styles.snippetChip, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={styles.snippetText}>
              লাল চাল <Text style={{ color: '#10B981', fontFamily: F.bold }}>GI 54</Text>
            </Text>
          </View>
          <View style={[styles.snippetChip, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={styles.snippetText}>
              পেয়ারা <Text style={{ color: '#10B981', fontFamily: F.bold }}>GI 12</Text>
            </Text>
          </View>
          <View style={[styles.snippetChip, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={styles.snippetText}>
              করলা <Text style={{ color: '#10B981', fontFamily: F.bold }}>GI 15</Text>
            </Text>
          </View>
          <View style={[styles.snippetChip, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <Text style={styles.snippetText}>
              সাদা ভাত <Text style={{ color: '#EF4444', fontFamily: F.bold }}>GI 73</Text>
            </Text>
          </View>
        </View>

        {/* Footer Action Bar */}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <MaterialIcons name="analytics" size={14} color="#10B981" />
            <Text style={styles.footerLeftText}>প্লেট সুগার স্পাইক সিমুলেটর যুক্ত</Text>
          </View>
          <View style={styles.openActionBtn}>
            <Text style={styles.openActionBtnText}>গাইড দেখুন</Text>
            <MaterialIcons name="arrow-forward" size={14} color="#000" />
          </View>
        </View>
      </TouchableOpacity>

      <BanglaFoodGiModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
    flex: 1,
  },
  superBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  superBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#10B981',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  snippetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  snippetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  snippetText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLeftText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#10B981',
  },
  openActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  openActionBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#000',
  },
});
