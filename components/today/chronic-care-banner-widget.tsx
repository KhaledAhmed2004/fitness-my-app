import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useChronicCareStore } from '@/stores/chronic-care-store';
import { useHealthVaultStore } from '@/stores/health-vault-store';

const C = Vital.colors;
const F = Vital.fonts;

interface ChronicCareBannerWidgetProps {
  onOpenModal: () => void;
  onQuickLogSugar?: () => void;
  onQuickLogBp?: () => void;
}

export function ChronicCareBannerWidget({
  onOpenModal,
  onQuickLogSugar,
  onQuickLogBp,
}: ChronicCareBannerWidgetProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const activeMemberId =
    selectedMemberId !== 'ALL' ? selectedMemberId : members[0]?.id || 'mem_khaled';
  const currentMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) || members[0],
    [members, activeMemberId]
  );

  const activeProtocolsMap = useChronicCareStore((s) => s.activeProtocols);
  const getTodayProgress = useChronicCareStore((s) => s.getTodayProgress);

  const activeProtocols = useMemo(() => {
    const list = activeProtocolsMap[activeMemberId] || [];
    return list.filter((p) => p.isActive);
  }, [activeProtocolsMap, activeMemberId]);

  const todayProgress = useMemo(
    () => getTodayProgress(activeMemberId),
    [getTodayProgress, activeMemberId, activeProtocolsMap]
  );

  const primaryProtocol = activeProtocols[0];

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.88}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onOpenModal();
      }}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons
              name={primaryProtocol ? (primaryProtocol.icon as any) : 'health-and-safety'}
              size={20}
              color={primaryProtocol ? primaryProtocol.color : '#38BDF8'}
            />
          </View>
          <View style={styles.titleWrap}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.cardTitle}>
                {primaryProtocol
                  ? primaryProtocol.bengaliTitle
                  : 'ক্রনিক ডিজিজ কেয়ার প্ল্যান'}
              </Text>
              {activeProtocols.length > 1 && (
                <View style={styles.moreProtocolsBadge}>
                  <Text style={styles.moreProtocolsText}>
                    +{activeProtocols.length - 1} প্রটোকল
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub}>
              {currentMember?.name} • দৈনিক ক্লিনিক্যাল ফলো-আপ ও রুটিন
            </Text>
          </View>
        </View>

        {/* Score Badge */}
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNumber}>{todayProgress.complianceScore}%</Text>
          <Text style={styles.scoreLabel}>কেয়ার স্কোর</Text>
        </View>
      </View>

      {/* Progress & Quick Action Pills */}
      <View style={styles.pillsRow}>
        {/* Fasting Sugar Pill */}
        <TouchableOpacity
          style={[
            styles.actionPill,
            todayProgress.sugarLogged && styles.actionPillDone,
          ]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            if (onQuickLogSugar) onQuickLogSugar();
            else onOpenModal();
          }}>
          <MaterialIcons
            name="water-drop"
            size={14}
            color={todayProgress.sugarLogged ? '#51CF66' : '#00B4D8'}
          />
          <Text
            style={[
              styles.actionPillText,
              todayProgress.sugarLogged && styles.actionPillTextDone,
            ]}>
            {todayProgress.sugarLogged
              ? `${todayProgress.sugarValue} mmol/L`
              : 'খালি পেটে সুগার'}
          </Text>
        </TouchableOpacity>

        {/* BP Pill */}
        <TouchableOpacity
          style={[
            styles.actionPill,
            todayProgress.bpLogged && styles.actionPillDone,
          ]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            if (onQuickLogBp) onQuickLogBp();
            else onOpenModal();
          }}>
          <MaterialIcons
            name="favorite"
            size={14}
            color={todayProgress.bpLogged ? '#51CF66' : '#F43F5E'}
          />
          <Text
            style={[
              styles.actionPillText,
              todayProgress.bpLogged && styles.actionPillTextDone,
            ]}>
            {todayProgress.bpLogged ? todayProgress.bpValue : 'প্রেশার লগ'}
          </Text>
        </TouchableOpacity>

        {/* Steps Pill */}
        <View
          style={[
            styles.actionPill,
            todayProgress.stepsCompleted && styles.actionPillDone,
          ]}>
          <MaterialIcons
            name="directions-walk"
            size={14}
            color={todayProgress.stepsCompleted ? '#51CF66' : '#FF922B'}
          />
          <Text
            style={[
              styles.actionPillText,
              todayProgress.stepsCompleted && styles.actionPillTextDone,
            ]}>
            {(todayProgress.stepsCount / 1000).toFixed(1)}k/{todayProgress.stepsTarget / 1000}k কদম
          </Text>
        </View>

        {/* Diet Rules Pill */}
        <View
          style={[
            styles.actionPill,
            todayProgress.completedDietRuleIds.length >=
              (todayProgress.totalDietRulesCount || 5) && styles.actionPillDone,
          ]}>
          <MaterialIcons name="restaurant" size={14} color="#20C997" />
          <Text style={styles.actionPillText}>
            ডায়েট {todayProgress.completedDietRuleIds.length}/
            {todayProgress.totalDietRulesCount || 5}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleWrap: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  moreProtocolsBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moreProtocolsText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  cardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  scoreNumber: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#38BDF8',
  },
  scoreLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: -1,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  actionPillDone: {
    backgroundColor: 'rgba(81, 207, 102, 0.1)',
    borderColor: 'rgba(81, 207, 102, 0.25)',
  },
  actionPillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  actionPillTextDone: {
    color: '#51CF66',
    fontFamily: F.bold,
  },
});
