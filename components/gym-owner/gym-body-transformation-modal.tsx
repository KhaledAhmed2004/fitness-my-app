import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMemberItem, GymBodyMeasurement } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
  initialMemberId?: string;
};

export function GymBodyTransformationModal({ visible, onClose, initialMemberId }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    members,
    trainers,
    gymProfile,
    getMemberTransformationSummary,
    getMeasurementDueMembers,
    logMemberMeasurement,
    deleteMemberMeasurement,
    generateWhatsAppTransformationReportCard,
  } = useGymOwnerStore();

  const dueMembers = getMeasurementDueMembers();
  const activeMembers = members.filter((m) => m.status === 'ACTIVE' || m.status === 'EXPIRING_SOON');

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (activeMembers.length > 0 ? activeMembers[0].id : '')
  );
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sub-modal logger state
  const [loggerModalVisible, setLoggerModalVisible] = useState<boolean>(false);
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputHeight, setInputHeight] = useState<string>('175');
  const [inputWaist, setInputWaist] = useState<string>('');
  const [inputChest, setInputChest] = useState<string>('');
  const [inputBicep, setInputBicep] = useState<string>('');
  const [inputHips, setInputHips] = useState<string>('');
  const [inputBodyFat, setInputBodyFat] = useState<string>('');
  const [inputTrainerName, setInputTrainerName] = useState<string>(
    trainers.length > 0 ? trainers[0].name : 'Coach Alex'
  );
  const [inputNotes, setInputNotes] = useState<string>('');

  const currentMember = members.find((m) => m.id === selectedMemberId) || activeMembers[0];
  const summary = currentMember ? getMemberTransformationSummary(currentMember.id) : null;

  const filteredMembersList = (filterDueOnly ? dueMembers : activeMembers).filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.phone.includes(q);
  });

  const handleOpenLogger = () => {
    const lastM = summary?.latest;
    setInputWeight(lastM ? String(lastM.weightKg) : '');
    setInputHeight(lastM?.heightCm ? String(lastM.heightCm) : '175');
    setInputWaist(lastM?.waistInches ? String(lastM.waistInches) : '');
    setInputChest(lastM?.chestInches ? String(lastM.chestInches) : '');
    setInputBicep(lastM?.bicepInches ? String(lastM.bicepInches) : '');
    setInputHips(lastM?.hipsInches ? String(lastM.hipsInches) : '');
    setInputBodyFat(lastM?.bodyFatPercentage ? String(lastM.bodyFatPercentage) : '');
    setInputNotes('');
    setLoggerModalVisible(true);
  };

  const handleSaveMeasurement = async () => {
    const weight = parseFloat(inputWeight);
    if (isNaN(weight) || weight <= 20 || weight >= 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (e.g. 78.5).');
      return;
    }

    if (!currentMember) return;

    const height = parseFloat(inputHeight);
    const waist = parseFloat(inputWaist);
    const chest = parseFloat(inputChest);
    const bicep = parseFloat(inputBicep);
    const hips = parseFloat(inputHips);
    const fat = parseFloat(inputBodyFat);

    let bmi: number | undefined = undefined;
    if (!isNaN(height) && height > 50) {
      bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
    }

    await logMemberMeasurement(currentMember.id, {
      date: new Date().toISOString().split('T')[0],
      weightKg: weight,
      heightCm: !isNaN(height) ? height : undefined,
      waistInches: !isNaN(waist) ? waist : undefined,
      chestInches: !isNaN(chest) ? chest : undefined,
      bicepInches: !isNaN(bicep) ? bicep : undefined,
      hipsInches: !isNaN(hips) ? hips : undefined,
      bodyFatPercentage: !isNaN(fat) ? fat : undefined,
      bmi,
      measuredByTrainerName: inputTrainerName.trim() || 'Trainer Desk',
      notes: inputNotes.trim() || undefined,
    });

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setLoggerModalVisible(false);
    Alert.alert(
      'Measurement Saved! 🎉',
      `Body stats recorded for ${currentMember.fullName}. You can now send them their WhatsApp progress card.`
    );
  };

  const handleSendWhatsAppReportCard = () => {
    if (!currentMember) return;
    const msg = generateWhatsAppTransformationReportCard(currentMember.id);
    const cleanPhone = currentMember.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Report Card Copied', 'WhatsApp is not installed. Message ready:\n\n' + msg);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
  };

  const handleDeleteCheckpoint = (measurementId: string) => {
    if (!currentMember) return;
    Alert.alert(
      'Delete Checkpoint?',
      'Are you sure you want to remove this measurement log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMemberMeasurement(currentMember.id, measurementId);
          },
        },
      ]
    );
  };

  // Helper for status badge presentation
  const getStatusBadge = () => {
    if (!summary) return null;
    const { primaryTransformationStatus, isRecompositionVictory } = summary;

    if (isRecompositionVictory || primaryTransformationStatus === 'RECOMPOSITION') {
      return {
        title: '🏆 PURE BEAST RECOMPOSITION!',
        subtitle: 'Losing fat & building muscle simultaneously',
        bg: 'rgba(255, 184, 0, 0.15)',
        border: 'rgba(255, 184, 0, 0.4)',
        color: '#FFB800',
        icon: 'stars',
      };
    }
    if (primaryTransformationStatus === 'WEIGHT_LOSS') {
      return {
        title: '⚡ INCH & FAT SHRED CHAMPION!',
        subtitle: 'Consistent calorie deficit & fat loss velocity',
        bg: 'rgba(64, 192, 87, 0.15)',
        border: 'rgba(64, 192, 87, 0.4)',
        color: '#40C057',
        icon: 'trending-down',
      };
    }
    if (primaryTransformationStatus === 'MUSCLE_GAIN') {
      return {
        title: '💪 MASS & HYPERTROPHY GAINS!',
        subtitle: 'Lean muscle hypertrophy & upper body expansion',
        bg: 'rgba(51, 154, 240, 0.15)',
        border: 'rgba(51, 154, 240, 0.4)',
        color: '#339AF0',
        icon: 'fitness-center',
      };
    }
    return {
      title: '🎯 CONSISTENT FITNESS MAINTENANCE',
      subtitle: 'Steady baseline endurance and stability',
      bg: 'rgba(134, 142, 150, 0.15)',
      border: 'rgba(134, 142, 150, 0.4)',
      color: '#868E96',
      icon: 'check-circle',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
              <MaterialIcons name="straighten" size={22} color="#40C057" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Body Transformation Hub</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Retention Radar & 30-Day Measurement Tracker
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* TOP FILTER & MEMBER SELECTOR BAR */}
        <View style={[styles.selectorBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              onPress={() => setFilterDueOnly(false)}
              style={[
                styles.filterTab,
                !filterDueOnly && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}>
              <Text
                style={[
                  styles.filterTabText,
                  { color: !filterDueOnly ? '#FFF' : colors.textSecondary },
                ]}>
                All Members ({activeMembers.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterDueOnly(true)}
              style={[
                styles.filterTab,
                filterDueOnly && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
              ]}>
              <Text
                style={[
                  styles.filterTabText,
                  { color: filterDueOnly ? '#FFF' : '#FF6B6B' },
                ]}>
                ⚠️ Due for Measurement ({dueMembers.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Member Horizontal Scroll Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberPillsScroll}>
            {filteredMembersList.map((m) => {
              const isSelected = m.id === selectedMemberId;
              const hasNoRecords = !m.bodyMeasurements || m.bodyMeasurements.length === 0;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedMemberId(m.id);
                  }}
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: isSelected ? 'rgba(64, 192, 87, 0.15)' : colors.background,
                      borderColor: isSelected ? '#40C057' : colors.border,
                    },
                  ]}>
                  <View style={styles.pillAvatar}>
                    <Text style={styles.pillAvatarText}>{m.fullName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.pillName,
                        { color: isSelected ? '#40C057' : colors.textPrimary },
                      ]}>
                      {m.fullName}
                    </Text>
                    <Text style={[styles.pillSub, { color: colors.textSecondary }]}>
                      {hasNoRecords ? '⚠️ No Baseline' : `${m.bodyMeasurements?.length} Checkpoints`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* MAIN BODY CONTENT */}
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {currentMember ? (
            <>
              {/* CURRENT MEMBER HERO BAR */}
              <View style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.memberMetaRow}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>{currentMember.fullName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberNameText, { color: colors.textPrimary }]}>
                      {currentMember.fullName}
                    </Text>
                    <Text style={[styles.memberPhoneText, { color: colors.textSecondary }]}>
                      📱 {currentMember.phone} • Plan: {currentMember.planTitle}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: F.regular, color: colors.textSecondary, marginTop: 2 }}>
                      Assigned: {currentMember.assignedTrainerName || 'General Floor'}
                    </Text>
                  </View>
                </View>

                {/* STATUS BADGE */}
                {statusBadge && (
                  <View
                    style={[
                      styles.heroBadge,
                      { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
                    ]}>
                    <MaterialIcons name={statusBadge.icon as any} size={20} color={statusBadge.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.heroBadgeTitle, { color: statusBadge.color }]}>
                        {statusBadge.title}
                      </Text>
                      <Text style={[styles.heroBadgeSub, { color: colors.textSecondary }]}>
                        {statusBadge.subtitle}
                      </Text>
                    </View>
                  </View>
                )}

                {/* PROGRESS DELTAS MATRIX (IF SUMMARY EXISTS) */}
                {summary ? (
                  <View style={styles.deltasGrid}>
                    {/* Weight Delta Card */}
                    <View style={[styles.deltaCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.deltaCardLabel, { color: colors.textSecondary }]}>⚖️ Weight</Text>
                      <Text style={[styles.deltaCardValues, { color: colors.textPrimary }]}>
                        {summary.baseline.weightKg} ➔ {summary.latest.weightKg} kg
                      </Text>
                      <View
                        style={[
                          styles.deltaTag,
                          {
                            backgroundColor:
                              summary.deltaWeightKg < 0
                                ? 'rgba(64, 192, 87, 0.15)'
                                : summary.deltaWeightKg > 0
                                ? 'rgba(51, 154, 240, 0.15)'
                                : 'rgba(134, 142, 150, 0.15)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.deltaTagText,
                            {
                              color:
                                summary.deltaWeightKg < 0
                                  ? '#40C057'
                                  : summary.deltaWeightKg > 0
                                  ? '#339AF0'
                                  : colors.textSecondary,
                            },
                          ]}>
                          {summary.deltaWeightKg > 0 ? `+${summary.deltaWeightKg}` : summary.deltaWeightKg} kg
                        </Text>
                      </View>
                    </View>

                    {/* Waist Delta Card */}
                    <View style={[styles.deltaCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.deltaCardLabel, { color: colors.textSecondary }]}>👖 Waist</Text>
                      <Text style={[styles.deltaCardValues, { color: colors.textPrimary }]}>
                        {summary.baseline.waistInches || '-'} ➔ {summary.latest.waistInches || '-'} in
                      </Text>
                      <View
                        style={[
                          styles.deltaTag,
                          {
                            backgroundColor:
                              (summary.deltaWaistInches || 0) < 0
                                ? 'rgba(64, 192, 87, 0.15)'
                                : 'rgba(134, 142, 150, 0.15)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.deltaTagText,
                            {
                              color: (summary.deltaWaistInches || 0) < 0 ? '#40C057' : colors.textSecondary,
                            },
                          ]}>
                          {summary.deltaWaistInches !== undefined
                            ? `${summary.deltaWaistInches > 0 ? `+${summary.deltaWaistInches}` : summary.deltaWaistInches}"`
                            : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Chest Delta Card */}
                    <View style={[styles.deltaCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.deltaCardLabel, { color: colors.textSecondary }]}>🛡️ Chest</Text>
                      <Text style={[styles.deltaCardValues, { color: colors.textPrimary }]}>
                        {summary.baseline.chestInches || '-'} ➔ {summary.latest.chestInches || '-'} in
                      </Text>
                      <View
                        style={[
                          styles.deltaTag,
                          {
                            backgroundColor:
                              (summary.deltaChestInches || 0) > 0
                                ? 'rgba(64, 192, 87, 0.15)'
                                : 'rgba(134, 142, 150, 0.15)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.deltaTagText,
                            {
                              color: (summary.deltaChestInches || 0) > 0 ? '#40C057' : colors.textSecondary,
                            },
                          ]}>
                          {summary.deltaChestInches !== undefined
                            ? `${summary.deltaChestInches > 0 ? `+${summary.deltaChestInches}` : summary.deltaChestInches}"`
                            : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Bicep Delta Card */}
                    <View style={[styles.deltaCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.deltaCardLabel, { color: colors.textSecondary }]}>💪 Bicep</Text>
                      <Text style={[styles.deltaCardValues, { color: colors.textPrimary }]}>
                        {summary.baseline.bicepInches || '-'} ➔ {summary.latest.bicepInches || '-'} in
                      </Text>
                      <View
                        style={[
                          styles.deltaTag,
                          {
                            backgroundColor:
                              (summary.deltaBicepInches || 0) > 0
                                ? 'rgba(64, 192, 87, 0.15)'
                                : 'rgba(134, 142, 150, 0.15)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.deltaTagText,
                            {
                              color: (summary.deltaBicepInches || 0) > 0 ? '#40C057' : colors.textSecondary,
                            },
                          ]}>
                          {summary.deltaBicepInches !== undefined
                            ? `${summary.deltaBicepInches > 0 ? `+${summary.deltaBicepInches}` : summary.deltaBicepInches}"`
                            : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyStateWrap}>
                    <MaterialIcons name="accessibility" size={40} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                      No Baseline Measurements Recorded
                    </Text>
                    <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                      Measure weight, waist, chest, and arms today to lock in Day 1 baseline.
                    </Text>
                  </View>
                )}

                {/* ACTION BUTTONS */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOpenLogger}
                    style={[styles.primaryActionBtn, { backgroundColor: '#40C057' }]}>
                    <MaterialIcons name="add-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.primaryActionBtnText}>Log New Stats</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSendWhatsAppReportCard}
                    style={[styles.secondaryActionBtn, { backgroundColor: '#25D366' }]}>
                    <MaterialIcons name="chat" size={18} color="#FFF" />
                    <Text style={styles.secondaryActionBtnText}>WhatsApp Card</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* HISTORICAL CHECKPOINTS TIMELINE */}
              <View style={styles.timelineSection}>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  📈 Measurement History Timeline ({currentMember.bodyMeasurements?.length || 0})
                </Text>

                {(currentMember.bodyMeasurements || [])
                  .slice()
                  .reverse()
                  .map((bm, index) => {
                    const isLatest = index === 0;
                    return (
                      <View
                        key={bm.id}
                        style={[
                          styles.checkpointCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: isLatest ? '#40C057' : colors.border,
                          },
                        ]}>
                        <View style={styles.checkpointHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialIcons
                              name="event"
                              size={16}
                              color={isLatest ? '#40C057' : colors.textSecondary}
                            />
                            <Text style={[styles.checkpointDate, { color: colors.textPrimary }]}>
                              {bm.date} ({bm.time || 'N/A'})
                            </Text>
                            {isLatest && (
                              <View style={[styles.latestBadge, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
                                <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: '#40C057' }}>
                                  LATEST
                                </Text>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteCheckpoint(bm.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcons name="delete-outline" size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        {/* Metrics Pills Row */}
                        <View style={styles.metricsPillsRow}>
                          <View style={[styles.metricPill, { backgroundColor: colors.background }]}>
                            <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Weight</Text>
                            <Text style={[styles.metricPillValue, { color: colors.textPrimary }]}>
                              {bm.weightKg} kg
                            </Text>
                          </View>
                          {bm.waistInches && (
                            <View style={[styles.metricPill, { backgroundColor: colors.background }]}>
                              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Waist</Text>
                              <Text style={[styles.metricPillValue, { color: colors.textPrimary }]}>
                                {bm.waistInches}"
                              </Text>
                            </View>
                          )}
                          {bm.chestInches && (
                            <View style={[styles.metricPill, { backgroundColor: colors.background }]}>
                              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Chest</Text>
                              <Text style={[styles.metricPillValue, { color: colors.textPrimary }]}>
                                {bm.chestInches}"
                              </Text>
                            </View>
                          )}
                          {bm.bicepInches && (
                            <View style={[styles.metricPill, { backgroundColor: colors.background }]}>
                              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Bicep</Text>
                              <Text style={[styles.metricPillValue, { color: colors.textPrimary }]}>
                                {bm.bicepInches}"
                              </Text>
                            </View>
                          )}
                          {bm.bmi && (
                            <View style={[styles.metricPill, { backgroundColor: colors.background }]}>
                              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>BMI</Text>
                              <Text style={[styles.metricPillValue, { color: colors.textPrimary }]}>
                                {bm.bmi}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Coach & Notes */}
                        <View style={styles.checkpointFooter}>
                          <Text style={[styles.checkpointCoach, { color: colors.textSecondary }]}>
                            👤 Coach: {bm.measuredByTrainerName}
                          </Text>
                          {bm.notes && (
                            <Text style={[styles.checkpointNotes, { color: colors.textPrimary }]}>
                              "{bm.notes}"
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
              </View>
            </>
          ) : (
            <View style={styles.emptyStateWrap}>
              <Text style={{ color: colors.textSecondary }}>No members found.</Text>
            </View>
          )}
        </ScrollView>

        {/* LOG MEASUREMENT SUB-MODAL */}
        <Modal
          visible={loggerModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setLoggerModalVisible(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>
                    Log Body Stats: {currentMember?.fullName}
                  </Text>
                  <Text style={[styles.subModalSub, { color: colors.textSecondary }]}>
                    30-Second Quick Measurement Entry
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setLoggerModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* 2-Column Inputs */}
                <View style={styles.formGrid}>
                  {/* Weight (kg) */}
                  <View style={styles.formCol}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight (kg) *</Text>
                    <TextInput
                      value={inputWeight}
                      onChangeText={setInputWeight}
                      keyboardType="numeric"
                      placeholder="e.g. 78.5"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>

                  {/* Height (cm) */}
                  <View style={styles.formCol}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Height (cm)</Text>
                    <TextInput
                      value={inputHeight}
                      onChangeText={setInputHeight}
                      keyboardType="numeric"
                      placeholder="175"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>

                  {/* Waist (in) */}
                  <View style={styles.formCol}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Waist (inches)</Text>
                    <TextInput
                      value={inputWaist}
                      onChangeText={setInputWaist}
                      keyboardType="numeric"
                      placeholder="e.g. 33.0"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>

                  {/* Chest (in) */}
                  <View style={styles.formCol}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Chest (inches)</Text>
                    <TextInput
                      value={inputChest}
                      onChangeText={setInputChest}
                      keyboardType="numeric"
                      placeholder="e.g. 40.5"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>

                  {/* Bicep (in) */}
                  <View style={styles.formCol}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bicep (inches)</Text>
                    <TextInput
                      value={inputBicep}
                      onChangeText={setInputBicep}
                      keyboardType="numeric"
                      placeholder="e.g. 14.5"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>

                  {/* Body Fat % */}
                  <View style={styles.formCol}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Body Fat %</Text>
                    <TextInput
                      value={inputBodyFat}
                      onChangeText={setInputBodyFat}
                      keyboardType="numeric"
                      placeholder="e.g. 18.5"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>
                </View>

                {/* Trainer / Coach Name */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Measured By (Trainer/Staff)</Text>
                  <TextInput
                    value={inputTrainerName}
                    onChangeText={setInputTrainerName}
                    placeholder="Coach Name"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  />
                </View>

                {/* Notes & Remarks */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Coach Praise / Progress Notes</Text>
                  <TextInput
                    value={inputNotes}
                    onChangeText={setInputNotes}
                    placeholder="e.g. Lost 2 inches on waist, high energy in squats!"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={2}
                    style={[styles.textInput, { height: 60, textAlignVertical: 'top', backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  />
                </View>
              </ScrollView>

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveMeasurement}
                style={[styles.submitLogBtn, { backgroundColor: '#40C057' }]}>
                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                <Text style={styles.submitLogBtnText}>Save Checkpoint</Text>
              </TouchableOpacity>
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
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: 11,
    fontFamily: F.semiBold,
  },
  memberPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#40C057',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillAvatarText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#FFF',
  },
  pillName: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  pillSub: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  memberCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#40C057',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 18,
    fontFamily: F.bold,
    color: '#FFF',
  },
  memberNameText: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  memberPhoneText: {
    fontSize: 12,
    fontFamily: F.regular,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  heroBadgeTitle: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  heroBadgeSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  deltasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deltaCard: {
    width: '48.5%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  deltaCardLabel: {
    fontSize: 11,
    fontFamily: F.medium,
  },
  deltaCardValues: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  deltaTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  deltaTagText: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#FFF',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#FFF',
  },
  emptyStateWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontFamily: F.bold,
  },
  emptyStateSub: {
    fontSize: 12,
    fontFamily: F.regular,
    textAlign: 'center',
  },
  timelineSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: F.bold,
  },
  checkpointCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  checkpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkpointDate: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  latestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricPillLabel: {
    fontSize: 9,
    fontFamily: F.regular,
  },
  metricPillValue: {
    fontSize: 11,
    fontFamily: F.bold,
  },
  checkpointFooter: {
    gap: 2,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 6,
  },
  checkpointCoach: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  checkpointNotes: {
    fontSize: 11,
    fontFamily: F.medium,
    fontStyle: 'italic',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  subModalContent: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subModalTitle: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  subModalSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  formCol: {
    width: '48%',
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: F.medium,
  },
  textInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: F.regular,
  },
  submitLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  submitLogBtnText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFF',
  },
});
