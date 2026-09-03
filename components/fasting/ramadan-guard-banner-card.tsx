import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RamadanGuardModal } from '@/components/fasting/ramadan-guard-modal';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

export function RamadanGuardBannerCard() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setModalVisible(true);
        }}
        style={styles.container}
      >
        <View style={styles.iconBox}>
          <MaterialIcons name="nights-stay" size={20} color="#00B4D8" />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.badgeRow}>
            <Text style={styles.title}>রমজান ও রোজা ডায়াবেটিস কেয়ার</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Ramadan Guard</Text>
            </View>
          </View>
          <Text style={styles.subText} numberOfLines={1}>
            🌙 সেহরি-ইফতার ফুড কম্বাইনার ও ওষুধের সময় পরিবর্তন গাইড
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={20} color="#00B4D8" />
      </TouchableOpacity>

      <RamadanGuardModal
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
    borderColor: 'rgba(0, 180, 216, 0.3)',
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    gap: 12,
    marginVertical: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 180, 216, 0.18)',
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
    color: '#00B4D8',
  },
  pill: {
    backgroundColor: 'rgba(0, 180, 216, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#00B4D8',
  },
  subText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
  },
});
