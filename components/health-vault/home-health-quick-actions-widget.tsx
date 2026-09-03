import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  HEALTH_QUICK_ACTIONS,
  QuickActionType,
} from '@/components/health-vault/health-quick-actions-modal';
import { Vital } from '@/constants/vital-theme';
import { useLanguageStore } from '@/stores/language-store';

const C = Vital.colors;
const F = Vital.fonts;

interface HomeHealthQuickActionsWidgetProps {
  onActionPress: (action: QuickActionType) => void;
  onOpenFullSheet?: () => void;
}

export function HomeHealthQuickActionsWidget({
  onActionPress,
  onOpenFullSheet,
}: HomeHealthQuickActionsWidgetProps) {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const isBn = currentLanguage === 'bn';

  const handlePress = (type: QuickActionType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onActionPress(type);
  };

  return (
    <View style={styles.container}>
      {/* WIDGET HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.headerDot} />
          <Text style={styles.sectionTitle}>
            {isBn ? 'স্বাস্থ্য কুইক অ্যাকশন' : 'HEALTH QUICK ACTIONS'}
          </Text>
        </View>

        {onOpenFullSheet && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              onOpenFullSheet();
            }}
            style={styles.expandBtn}>
            <MaterialIcons name="add" size={14} color="#20C997" />
            <Text style={styles.expandBtnText}>
              {isBn ? '+ যুক্ত করুন' : '+ Fast Add'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 6-BENTO QUICK ACTION TILES */}
      <View style={styles.grid}>
        {HEALTH_QUICK_ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.type}
            activeOpacity={0.82}
            onPress={() => handlePress(item.type)}
            style={styles.tile}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: item.badgeBg },
              ]}>
              <MaterialIcons name={item.icon} size={20} color={item.color} />
            </View>
            <Text numberOfLines={1} style={styles.tileLabel}>
              {isBn ? item.labelBn : item.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141A1E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20C997',
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expandBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '31.5%',
    backgroundColor: '#1A2228',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#F1F5F9',
    textAlign: 'center',
  },
});
