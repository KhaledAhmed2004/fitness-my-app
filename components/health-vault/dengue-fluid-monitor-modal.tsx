import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  DENGUE_HOTLINES,
  DENGUE_WARNING_SYMPTOMS,
  FLUID_PRESETS,
  NSAID_BANNED_MEDICINES,
} from '@/services/dengue-knowledge';
import {
  calculateDenguePhase,
  evaluateDengueRisk,
  formatDengueDoctorSummaryText,
} from '@/services/dengue-service';
import {
  DailyDengueLog,
  DengueWarningSymptomKey,
  FluidItemType,
  HourlyFluidEntry,
  UrineColorStatus,
  UrineOutputStatus,
} from '@/types/dengue-fluid-monitor';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'PHASE_LABS' | 'FLUID_TRACKER' | 'RED_FLAGS' | 'MEDICINE_SHIELD';

interface DengueFluidMonitorModalProps {
  visible: boolean;
  onClose: () => void;
  patientName?: string;
}

export function DengueFluidMonitorModal({
  visible,
  onClose,
  patientName = 'রোগী',
}: DengueFluidMonitorModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('PHASE_LABS');
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(4); // Default to Critical Phase Day 4
  const [patientWeightKg, setPatientWeightKg] = useState<number>(60);
  const [plateletInput, setPlateletInput] = useState<string>('95000');
  const [hctInput, setHctInput] = useState<string>('42');
  const [tempInput, setTempInput] = useState<string>('101.4');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Daily Log State
  const [hourlyFluids, setHourlyFluids] = useState<HourlyFluidEntry[]>([
    {
      id: 'f1',
      timestamp: '০৮:০০ AM',
      fluidType: 'ORAL_SALINE_ORS',
      amountMl: 250,
    },
    {
      id: 'f2',
      timestamp: '১০:৩০ AM',
      fluidType: 'COCONUT_WATER',
      amountMl: 200,
    },
    {
      id: 'f3',
      timestamp: '১২:১৫ PM',
      fluidType: 'WATER',
      amountMl: 250,
    },
    {
      id: 'f4',
      timestamp: '০২:০০ PM',
      fluidType: 'SOUP_JUICE',
      amountMl: 200,
    },
  ]);

  const [warningSigns, setWarningSigns] = useState<DengueWarningSymptomKey[]>([]);

  // Current Log Model
  const dailyLog: DailyDengueLog = useMemo(
    () => ({
      dayNumber: currentDayNumber,
      date: new Date().toLocaleDateString('bn-BD'),
      temperatureF: parseFloat(tempInput) || undefined,
      plateletCount: parseInt(plateletInput, 10) || undefined,
      hematocritPercent: parseFloat(hctInput) || undefined,
      hourlyFluids,
      urineEntries: [],
      warningSymptomsChecked: warningSigns,
    }),
    [currentDayNumber, tempInput, plateletInput, hctInput, hourlyFluids, warningSigns]
  );

  // Assessment Summary
  const assessment = useMemo(() => {
    return evaluateDengueRisk(dailyLog, patientWeightKg);
  }, [dailyLog, patientWeightKg]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleAddFluid = (type: FluidItemType, defaultMl: number, label: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: HourlyFluidEntry = {
      id: `f_${Date.now()}`,
      timestamp: timeStr,
      fluidType: type,
      amountMl: defaultMl,
    };

    setHourlyFluids((prev) => [newEntry, ...prev]);
    showToast(`+${defaultMl} ml ${label} যোগ হয়েছে 💧`);
  };

  const handleDeleteFluid = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setHourlyFluids((prev) => prev.filter((f) => f.id !== id));
  };

  const handleToggleWarningSign = (key: DengueWarningSymptomKey) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (warningSigns.includes(key)) {
      setWarningSigns((prev) => prev.filter((k) => k !== key));
    } else {
      setWarningSigns((prev) => [...prev, key]);
      showToast('⚠️ বিপদচিহ্ন সিলেক্ট হয়েছে!');
    }
  };

  const handleCopySummary = async () => {
    const text = formatDengueDoctorSummaryText(assessment, dailyLog, patientName);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('ডেঙ্গু রোগীর রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatDengueDoctorSummaryText(assessment, dailyLog, patientName);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const handleCallHotline = (phone: string, name: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    void Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('কল করা সম্ভব হয়নি', `${name}: ${phone}`);
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="coronavirus" size={24} color="#EF4444" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Dengue & Fever Fluid Monitor
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ডেঙ্গু ফিভার ও ফ্লুইড ব্যালেন্স ট্র্যাকার
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
              }}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PHASE_LABS')}
              style={[styles.tabBtn, activeTab === 'PHASE_LABS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="timeline"
                size={16}
                color={activeTab === 'PHASE_LABS' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PHASE_LABS' && styles.tabBtnTextActive,
                ]}>
                📊 ফেজ ও ল্যাব
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('FLUID_TRACKER')}
              style={[styles.tabBtn, activeTab === 'FLUID_TRACKER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="water-drop"
                size={16}
                color={activeTab === 'FLUID_TRACKER' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FLUID_TRACKER' && {
                    ...styles.tabBtnTextActive,
                    color: '#0284C7',
                  },
                ]}>
                💧 ফ্লুইড চার্ট ({assessment.fluidProgressPercent}%)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('RED_FLAGS')}
              style={[styles.tabBtn, activeTab === 'RED_FLAGS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="warning"
                size={16}
                color={
                  warningSigns.length > 0
                    ? '#EF4444'
                    : activeTab === 'RED_FLAGS'
                    ? '#F59E0B'
                    : C.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'RED_FLAGS' && {
                    ...styles.tabBtnTextActive,
                    color: warningSigns.length > 0 ? '#EF4444' : '#F59E0B',
                  },
                ]}>
                🚨 বিপদচিহ্ন ({warningSigns.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('MEDICINE_SHIELD')}
              style={[
                styles.tabBtn,
                activeTab === 'MEDICINE_SHIELD' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="shield"
                size={16}
                color={activeTab === 'MEDICINE_SHIELD' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'MEDICINE_SHIELD' && {
                    ...styles.tabBtnTextActive,
                    color: '#10B981',
                  },
                ]}>
                🛡️ ওষুধ সতর্কতা
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* CRITICAL RED-FLAG POPUP BANNER */}
            {assessment.emergencyActionRequired && (
              <View style={styles.emergencyAlertBanner}>
                <MaterialIcons name="emergency" size={28} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyAlertTitle}>
                    🚨 জরুরি বিপদ সতর্কতা (হাসপাতাল অ্যাডমিশন প্রয়োজন)
                  </Text>
                  <Text style={styles.emergencyAlertSub}>
                    {assessment.triageRecommendationBn}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCallHotline('16263', 'স্বাস্থ্য বাতায়ন')}
                    style={styles.emergencyHotlineBtn}>
                    <MaterialIcons name="call" size={14} color="#FFFFFF" />
                    <Text style={styles.emergencyHotlineText}>
                      স্বাস্থ্য বাতায়নে কল করুন (১৬২৬৩)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: PHASE & LAB COUNTS */}
            {/* ========================================================================= */}
            {activeTab === 'PHASE_LABS' && (
              <>
                {/* Day of Illness Horizontal Selector */}
                <View style={styles.daySelectorCard}>
                  <Text style={styles.daySelectorLabel}>
                    জ্বরের দিন নির্বাচন করুন (Fever Day #):
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayPillsScroll}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
                      const isSelected = currentDayNumber === d;
                      const isCritical = d >= 4 && d <= 6;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setCurrentDayNumber(d);
                          }}
                          style={[
                            styles.dayPill,
                            isSelected && styles.dayPillActive,
                            isCritical && !isSelected && styles.dayPillCriticalBorder,
                          ]}>
                          <Text
                            style={[
                              styles.dayPillText,
                              isSelected && styles.dayPillTextActive,
                              isCritical && !isSelected && { color: '#EF4444' },
                            ]}>
                            দিন {d}
                          </Text>
                          {isCritical && (
                            <Text style={styles.dayPillSub}>বিপদকাল</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Current Phase Milestone Card */}
                <View
                  style={[
                    styles.phaseCard,
                    assessment.currentPhase === 'CRITICAL_DAY_4_6'
                      ? styles.phaseCardCritical
                      : styles.phaseCardNormal,
                  ]}>
                  <View style={styles.phaseCardTop}>
                    <MaterialIcons
                      name={
                        assessment.currentPhase === 'CRITICAL_DAY_4_6'
                          ? 'warning'
                          : assessment.currentPhase === 'RECOVERY_DAY_7_PLUS'
                          ? 'celebration'
                          : 'thermostat'
                      }
                      size={24}
                      color={
                        assessment.currentPhase === 'CRITICAL_DAY_4_6'
                          ? '#EF4444'
                          : '#0284C7'
                      }
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.phaseTitle,
                          assessment.currentPhase === 'CRITICAL_DAY_4_6' && {
                            color: '#EF4444',
                          },
                        ]}>
                        {assessment.phaseTitleBn}
                      </Text>
                      <Text style={styles.phaseDesc}>
                        {assessment.phaseDescriptionBn}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Blood Lab Counts Input (Platelet, HCT, Temp) */}
                <View style={styles.labInputsCard}>
                  <Text style={styles.cardHeaderTitle}>
                    আজকের ল্যাব ও ভাইটাল রিপোর্ট ইনপুট:
                  </Text>

                  <View style={styles.inputGrid}>
                    {/* Platelet Input */}
                    <View style={styles.inputCol}>
                      <Text style={styles.inputColLabel}>প্লাটিলেট (/uL)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={plateletInput}
                        onChangeText={setPlateletInput}
                        placeholder="e.g. 95000"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    {/* HCT Input */}
                    <View style={styles.inputCol}>
                      <Text style={styles.inputColLabel}>হেমাটোক্রিট HCT (%)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={hctInput}
                        onChangeText={setHctInput}
                        placeholder="e.g. 42"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    {/* Temp Input */}
                    <View style={styles.inputCol}>
                      <Text style={styles.inputColLabel}>তাপমাত্রা (°F)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={tempInput}
                        onChangeText={setTempInput}
                        placeholder="e.g. 101.4"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  {/* Status Badges */}
                  <View style={styles.labStatusRow}>
                    <View
                      style={[
                        styles.labStatusPill,
                        assessment.plateletRisk === 'CRITICAL_DANGER'
                          ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                          : assessment.plateletRisk === 'MODERATE_RISK'
                          ? { backgroundColor: 'rgba(245, 158, 11, 0.15)' }
                          : { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                      ]}>
                      <Text
                        style={[
                          styles.labStatusPillText,
                          assessment.plateletRisk === 'CRITICAL_DANGER'
                            ? { color: '#EF4444' }
                            : assessment.plateletRisk === 'MODERATE_RISK'
                            ? { color: '#F59E0B' }
                            : { color: '#10B981' },
                        ]}>
                        {assessment.plateletDropMessageBn}
                      </Text>
                    </View>
                  </View>

                  {assessment.isHematocritElevated && (
                    <View style={styles.hctAlertBox}>
                      <MaterialIcons name="crisis-alert" size={16} color="#EF4444" />
                      <Text style={styles.hctAlertText}>
                        {assessment.hematocritMessageBn}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: FLUID INTAKE & URINE TRACKER */}
            {/* ========================================================================= */}
            {activeTab === 'FLUID_TRACKER' && (
              <>
                {/* Fluid Target Progress Card */}
                <View style={styles.fluidProgressHero}>
                  <View style={styles.fluidProgressTop}>
                    <View>
                      <Text style={styles.fluidHeroTitle}>
                        আজকের মোট তরল গ্রহণ (Daily Fluid Goal)
                      </Text>
                      <Text style={styles.fluidHeroSubtitle}>
                        টার্গেট: {assessment.targetDailyFluidMl} ml ({patientWeightKg} কেজি ওজনের জন্য)
                      </Text>
                    </View>

                    <View style={styles.fluidPercentCircle}>
                      <Text style={styles.fluidPercentText}>
                        {assessment.fluidProgressPercent}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${assessment.fluidProgressPercent}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.fluidHeroFootnote}>
                    পান করা হয়েছে: {assessment.totalFluidIntakeTodayMl} ml / বাকি{' '}
                    {Math.max(
                      0,
                      assessment.targetDailyFluidMl - assessment.totalFluidIntakeTodayMl
                    )}{' '}
                    ml
                  </Text>
                </View>

                {/* 1-Tap Quick Fluid Add Presets */}
                <Text style={styles.sectionTitle}>
                  ১-ট্যাপে তরল গ্রহণ যোগ করুন (Quick Fluid Log):
                </Text>

                <View style={styles.fluidPresetsGrid}>
                  {FLUID_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.type}
                      onPress={() =>
                        handleAddFluid(
                          preset.type,
                          preset.defaultAmountMl,
                          preset.labelBn
                        )
                      }
                      style={[
                        styles.presetCard,
                        { borderColor: `${preset.color}40` },
                      ]}>
                      <MaterialIcons
                        name={preset.icon as any}
                        size={22}
                        color={preset.color}
                      />
                      <Text style={styles.presetLabel}>{preset.labelBn}</Text>
                      <Text style={[styles.presetMl, { color: preset.color }]}>
                        +{preset.defaultAmountMl} ml
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Today's Fluid Log History */}
                <View style={styles.historySection}>
                  <Text style={styles.sectionTitle}>
                    আজকের ফ্লুইড গ্রহণের ইতিহাস ({hourlyFluids.length}টি এন্ট্রি):
                  </Text>

                  {hourlyFluids.map((entry) => (
                    <View key={entry.id} style={styles.historyItem}>
                      <MaterialIcons name="water-drop" size={16} color="#0284C7" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>
                          {entry.fluidType === 'ORAL_SALINE_ORS'
                            ? 'খাবার স্যালাইন (ORS)'
                            : entry.fluidType === 'COCONUT_WATER'
                            ? 'ডাবের পানি'
                            : entry.fluidType === 'WATER'
                            ? 'সাধারণ বিশুদ্ধ পানি'
                            : 'স্যুপ / ফলের জুস'}
                        </Text>
                        <Text style={styles.historyTime}>{entry.timestamp}</Text>
                      </View>
                      <Text style={styles.historyAmount}>{entry.amountMl} ml</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteFluid(entry.id)}
                        style={styles.deleteBtn}>
                        <MaterialIcons name="close" size={14} color={C.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: RED-FLAG WARNING SIGNS */}
            {/* ========================================================================= */}
            {activeTab === 'RED_FLAGS' && (
              <>
                <View style={styles.redFlagHeaderBox}>
                  <MaterialIcons name="warning" size={22} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.redFlagHeaderTitle}>
                      WHO ও DGHS ডেঙ্গু রেড-ফ্ল্যাগ চেকলিস্ট
                    </Text>
                    <Text style={styles.redFlagHeaderSub}>
                      নিচের যেকোনো একটি লক্ষণ দেখা দেওয়া মাত্র রোগীকে অবিলম্বে হাসপাতালে নিয়ে
                      যান।
                    </Text>
                  </View>
                </View>

                {DENGUE_WARNING_SYMPTOMS.map((sym) => {
                  const isChecked = warningSigns.includes(sym.key);
                  return (
                    <TouchableOpacity
                      key={sym.key}
                      activeOpacity={0.8}
                      onPress={() => handleToggleWarningSign(sym.key)}
                      style={[
                        styles.warningSymptomCard,
                        isChecked && styles.warningSymptomCardActive,
                      ]}>
                      <View style={styles.warningCardTop}>
                        <MaterialIcons
                          name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                          size={22}
                          color={isChecked ? '#EF4444' : C.onSurfaceVariant}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.warningSymptomTitle,
                              isChecked && { color: '#EF4444' },
                            ]}>
                            {sym.titleBn}
                          </Text>
                          <Text style={styles.warningSymptomDesc}>
                            {sym.descriptionBn}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Emergency Hotlines Directory */}
                <Text style={styles.sectionTitle}>
                  ২৪ ঘণ্টা ডেঙ্গু জরুরি হটলাইন ও অ্যাম্বুলেন্স:
                </Text>
                {DENGUE_HOTLINES.map((h) => (
                  <TouchableOpacity
                    key={h.number}
                    onPress={() => handleCallHotline(h.number, h.name)}
                    style={styles.hotlineCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hotlineName}>{h.name}</Text>
                      <Text style={styles.hotlineNumber}>{h.number}</Text>
                    </View>
                    <View style={styles.hotlineCallBtn}>
                      <MaterialIcons name="call" size={14} color="#FFFFFF" />
                      <Text style={styles.hotlineCallBtnText}>কল করুন</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: MEDICINE SHIELD & PARACETAMOL GUIDE */}
            {/* ========================================================================= */}
            {activeTab === 'MEDICINE_SHIELD' && (
              <>
                {/* STRICT NSAID BAN SHIELD */}
                <View style={styles.nsaidBanCard}>
                  <View style={styles.nsaidHeaderRow}>
                    <MaterialIcons name="block" size={24} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nsaidBanTitle}>
                        🚫 ব্যথানাশক ওষুধ সম্পূর্ণ নিষিদ্ধ (Strict NSAID Ban)
                      </Text>
                      <Text style={styles.nsaidBanSub}>
                        ডেঙ্গুতে নিচের ব্যথানাশক ওষুধগুলো খেলে রক্তক্ষরণ ও পাকস্থলীতে রক্তপাত
                        হয়ে রোগী শকে চলে যেতে পারে। ভুলেও এই ওষুধগুলো খাওয়াবেন না:
                      </Text>
                    </View>
                  </View>

                  <View style={styles.nsaidListWrap}>
                    {NSAID_BANNED_MEDICINES.map((m) => (
                      <View key={m.name} style={styles.nsaidItem}>
                        <Text style={styles.nsaidName}>❌ {m.name}</Text>
                        <Text style={styles.nsaidBrands}>
                          (যেমন: {m.brandExamples})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* SAFE PARACETAMOL DOSAGE GUIDE */}
                <View style={styles.paracetamolGuideCard}>
                  <View style={styles.paracetamolHeader}>
                    <MaterialIcons name="verified" size={20} color="#10B981" />
                    <Text style={styles.paracetamolTitle}>
                      প্যারাসিটামল সেবন নির্দেশিকা ও সতর্কতা
                    </Text>
                  </View>

                  <Text style={styles.paracetamolPoint}>
                    • <Text style={{ fontFamily: F.bold, color: C.onSurface }}>ডোজ:</Text>{' '}
                    প্রাপ্তবয়স্কদের জন্য ১টি (৫০০mg) বা ২টি ট্যাবলেট জ্বর ১০১°F এর বেশি উঠলে।
                  </Text>
                  <Text style={styles.paracetamolPoint}>
                    • <Text style={{ fontFamily: F.bold, color: C.onSurface }}>সর্বোচ্চ সীমা:</Text>{' '}
                    ২৪ ঘণ্টায় সর্বোচ্চ ৩,০০০ mg (৬টি ৫০০mg ট্যাবলেট)-এর বেশি নয়।
                  </Text>
                  <Text style={styles.paracetamolPoint}>
                    • <Text style={{ fontFamily: F.bold, color: C.onSurface }}>বিরতি:</Text>{' '}
                    এক ডোজের পর কমপক্ষে ৬ ঘণ্টা বিরতি দিন।
                  </Text>
                  <Text style={styles.paracetamolPoint}>
                    • <Text style={{ fontFamily: F.bold, color: C.onSurface }}>স্পঞ্জিং:</Text>{' '}
                    ওষুধে জ্বর না কমলে সাধারণ তাপমাত্রার পানিতে পুরো শরীর ভেজা সুতি কাপড় দিয়ে বারবার মুছে দিন। বরফ পানি ব্যবহার করবেন না।
                  </Text>
                </View>

                {/* DOCTOR SUMMARY SHARE ACTIONS */}
                <View style={styles.shareActionSection}>
                  <Text style={styles.sectionTitle}>
                    চিকিৎসক বা হাসপাতালে দেখানোর জন্য সামারি:
                  </Text>
                  <View style={styles.shareActionRow}>
                    <TouchableOpacity
                      onPress={handleCopySummary}
                      style={styles.copySummaryBtn}>
                      <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                      <Text style={styles.copySummaryBtnText}>রিপোর্ট কপি করুন</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleWhatsAppShare}
                      style={styles.waSummaryBtn}>
                      <MaterialIcons name="share" size={16} color="#25D366" />
                      <Text style={styles.waSummaryBtnText}>WhatsApp-এ পাঠান</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '92%',
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#EF4444',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
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
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  emergencyAlertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  emergencyAlertTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EF4444',
  },
  emergencyAlertSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 15,
  },
  emergencyHotlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  emergencyHotlineText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  daySelectorCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  daySelectorLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  dayPillsScroll: {
    gap: 6,
  },
  dayPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayPillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  dayPillCriticalBorder: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  dayPillText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  dayPillSub: {
    fontFamily: F.regular,
    fontSize: 7,
    color: '#EF4444',
    marginTop: 1,
  },
  phaseCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  phaseCardCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  phaseCardNormal: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  phaseCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  phaseTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#0284C7',
  },
  phaseDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    marginTop: 3,
    lineHeight: 16,
  },
  labInputsCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  cardHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputColLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  textInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  labStatusRow: {
    marginTop: 2,
  },
  labStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labStatusPillText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  hctAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  hctAlertText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
    flex: 1,
  },
  fluidProgressHero: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    gap: 10,
  },
  fluidProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fluidHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#0284C7',
  },
  fluidHeroSubtitle: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  fluidPercentCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fluidPercentText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  fluidHeroFootnote: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  fluidPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '48%',
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  presetLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
    textAlign: 'center',
  },
  presetMl: {
    fontFamily: F.bold,
    fontSize: 12,
  },
  historySection: {
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceContainer,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  historyTime: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  historyAmount: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0284C7',
  },
  deleteBtn: {
    padding: 4,
  },
  redFlagHeaderBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  redFlagHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EF4444',
  },
  redFlagHeaderSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  warningSymptomCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  warningSymptomCardActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  warningCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  warningSymptomTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  warningSymptomDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  hotlineCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hotlineName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  hotlineNumber: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 2,
  },
  hotlineCallBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hotlineCallBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  nsaidBanCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 10,
  },
  nsaidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nsaidBanTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EF4444',
  },
  nsaidBanSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  nsaidListWrap: {
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 10,
  },
  nsaidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nsaidName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  nsaidBrands: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  paracetamolGuideCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  paracetamolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paracetamolTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  paracetamolPoint: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  shareActionSection: {
    gap: 8,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copySummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  copySummaryBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  waSummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  waSummaryBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
});
