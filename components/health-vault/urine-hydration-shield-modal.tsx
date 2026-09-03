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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  ARMSTRONG_URINE_SHADES,
  KIDNEY_STONE_DIET_CATALOG,
  UTI_SYMPTOMS_LIST,
} from '@/services/urine-hydration-knowledge';
import {
  calculateDailyHydration,
  evaluateUtiRisk,
  formatUrologistHydrationSummary,
  getUrineColorDef,
} from '@/services/urine-hydration-service';
import {
  HydrationGoal,
  UrineColorDef,
  UrineShadeLevel,
  UtiSymptom,
} from '@/types/urine-hydration-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'COLOR_MATCHER' | 'WATER_CALCULATOR' | 'UTI_SCREENER' | 'KIDNEY_STONE_DIET';

interface UrineHydrationShieldModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UrineHydrationShieldModal({ visible, onClose }: UrineHydrationShieldModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('COLOR_MATCHER');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Selected Color Shade (Default Shade 3: Transparent Yellow)
  const [selectedShadeNum, setSelectedShadeNum] = useState<UrineShadeLevel>(3);
  const selectedShadeDef: UrineColorDef = useMemo(() => {
    return getUrineColorDef(selectedShadeNum);
  }, [selectedShadeNum]);

  // Tab 2: Weight & Hydration Parameters
  const [weightInput, setWeightInput] = useState<string>('65');
  const [isHotWeather, setIsHotWeather] = useState<boolean>(true);
  const [isHighActivity, setIsHighActivity] = useState<boolean>(false);

  const hydrationGoal: HydrationGoal = useMemo(() => {
    const w = parseFloat(weightInput) || 65;
    return calculateDailyHydration(w, isHotWeather, isHighActivity);
  }, [weightInput, isHotWeather, isHighActivity]);

  // Tab 3: UTI Symptoms
  const [utiSymptoms, setUtiSymptoms] = useState<UtiSymptom[]>(UTI_SYMPTOMS_LIST);

  const utiEvaluation = useMemo(() => {
    return evaluateUtiRisk(utiSymptoms);
  }, [utiSymptoms]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleSelectShade = (shade: UrineShadeLevel) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedShadeNum(shade);
  };

  const handleToggleUtiSymptom = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setUtiSymptoms((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isSelected: !s.isSelected } : s))
    );
  };

  const handleCopyReport = async () => {
    const selectedLabels = utiSymptoms.filter((s) => s.isSelected).map((s) => s.nameBn);
    const report = formatUrologistHydrationSummary(
      selectedShadeDef,
      hydrationGoal,
      utiEvaluation,
      selectedLabels
    );
    await Clipboard.setStringAsync(report);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('কিডনি ও হাইড্রেশন রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const selectedLabels = utiSymptoms.filter((s) => s.isSelected).map((s) => s.nameBn);
    const report = formatUrologistHydrationSummary(
      selectedShadeDef,
      hydrationGoal,
      utiEvaluation,
      selectedLabels
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(report)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি শেয়ার করুন।');
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
                <MaterialIcons name="water-drop" size={26} color="#0284C7" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Urine Color & Kidney Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ইউরিন রঙ, হাইড্রেশন ও কিডনি স্টোন গার্ড
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
              onPress={() => setActiveTab('COLOR_MATCHER')}
              style={[styles.tabBtn, activeTab === 'COLOR_MATCHER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="palette"
                size={16}
                color={activeTab === 'COLOR_MATCHER' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'COLOR_MATCHER' && styles.tabBtnTextActive,
                ]}>
                🎨 ইউরিন রঙ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('WATER_CALCULATOR')}
              style={[styles.tabBtn, activeTab === 'WATER_CALCULATOR' && styles.tabBtnActive]}>
              <MaterialIcons
                name="local-drink"
                size={16}
                color={activeTab === 'WATER_CALCULATOR' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'WATER_CALCULATOR' && styles.tabBtnTextActive,
                ]}>
                💧 পানির টার্গেট
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('UTI_SCREENER')}
              style={[styles.tabBtn, activeTab === 'UTI_SCREENER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="healing"
                size={16}
                color={activeTab === 'UTI_SCREENER' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'UTI_SCREENER' && styles.tabBtnTextActive,
                ]}>
                🦠 UTI স্ক্রিনার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('KIDNEY_STONE_DIET')}
              style={[styles.tabBtn, activeTab === 'KIDNEY_STONE_DIET' && styles.tabBtnActive]}>
              <MaterialIcons
                name="science"
                size={16}
                color={activeTab === 'KIDNEY_STONE_DIET' ? '#0284C7' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'KIDNEY_STONE_DIET' && styles.tabBtnTextActive,
                ]}>
                🪨 স্টোন ডায়েট
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#0284C7" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: ARMSTRONG 8-SHADE URINE COLOR MATCHER */}
            {/* ========================================================================= */}
            {activeTab === 'COLOR_MATCHER' && (
              <>
                <View style={styles.bannerBox}>
                  <Text style={styles.bannerTitle}>
                    আর্মস্ট্রং ৮-স্তরের ক্লিনিক্যাল ইউরিন কালার চার্ট
                  </Text>
                  <Text style={styles.bannerSub}>
                    প্রস্রাবের রঙের সাথে নিচের কালার প্যালেট মিলিয়ে আপনার হাইড্রেশন অবস্থা জানুন:
                  </Text>
                </View>

                {/* 8-Color Swatches Grid */}
                <View style={styles.swatchesRow}>
                  {ARMSTRONG_URINE_SHADES.map((s) => {
                    const isSelected = selectedShadeNum === s.shade;
                    return (
                      <TouchableOpacity
                        key={s.shade}
                        activeOpacity={0.8}
                        onPress={() => handleSelectShade(s.shade)}
                        style={[
                          styles.swatchBtn,
                          { backgroundColor: s.hexColor },
                          isSelected && styles.swatchBtnSelected,
                        ]}>
                        <Text
                          style={[
                            styles.swatchNumber,
                            s.shade > 4 ? { color: '#FFFFFF' } : { color: '#1E293B' },
                          ]}>
                          {s.shade}
                        </Text>
                        {isSelected && (
                          <View style={styles.swatchCheckmark}>
                            <MaterialIcons name="check" size={12} color="#0284C7" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selected Color Evaluation Card */}
                <View
                  style={[
                    styles.evaluationCard,
                    { borderColor: selectedShadeDef.categoryColor },
                  ]}>
                  <View style={styles.evalCardTop}>
                    <View
                      style={[
                        styles.evalColorBadge,
                        { backgroundColor: selectedShadeDef.hexColor },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evalShadeName}>{selectedShadeDef.nameBn}</Text>
                      <Text
                        style={[
                          styles.evalCategoryLabel,
                          { color: selectedShadeDef.categoryColor },
                        ]}>
                        {selectedShadeDef.categoryLabelBn}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.evalDescription}>
                    {selectedShadeDef.descriptionBn}
                  </Text>

                  <View style={styles.evalAdviceBox}>
                    <MaterialIcons name="info" size={16} color="#0284C7" />
                    <Text style={styles.evalAdviceText}>
                      {selectedShadeDef.clinicalAdviceBn}
                    </Text>
                  </View>

                  {selectedShadeDef.immediateWaterDoseGlasses > 0 && (
                    <View style={styles.waterPrescriptionBox}>
                      <MaterialIcons name="local-drink" size={20} color="#0284C7" />
                      <Text style={styles.waterPrescriptionText}>
                        তাৎক্ষণিক প্রেসক্রিপশন: এখনই {selectedShadeDef.immediateWaterDoseGlasses} গ্লাস পানি পান করুন!
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PERSONALIZED HYDRATION TARGET CALCULATOR */}
            {/* ========================================================================= */}
            {activeTab === 'WATER_CALCULATOR' && (
              <>
                <View style={styles.calcInputCard}>
                  <Text style={styles.calcCardTitle}>শারীরিক ওজন ও দৈনিক আবহাওয়া:</Text>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>আপনার ওজন (কেজি):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={weightInput}
                      onChangeText={setWeightInput}
                      placeholder="65"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>☀️ তীব্র গরম বা আর্দ্র আবহাওয়া</Text>
                      <Text style={styles.switchSub}>ঘামের কারণে অতিরিক্ত ৫০০ মিলি পানি যোগ হবে</Text>
                    </View>
                    <Switch
                      value={isHotWeather}
                      onValueChange={setIsHotWeather}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#0284C7' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>🏃‍♂️ ব্যায়াম বা কায়িক পরিশ্রম</Text>
                      <Text style={styles.switchSub}>শারীরিক পরিশ্রমে আরও ৫০০ মিলি পানি যোগ হবে</Text>
                    </View>
                    <Switch
                      value={isHighActivity}
                      onValueChange={setIsHighActivity}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#0284C7' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Target Result Gauge */}
                <View style={styles.targetResultCard}>
                  <View style={styles.targetTop}>
                    <View>
                      <Text style={styles.targetTitle}>আপনার দৈনিক পানির লক্ষ্যমাত্রা</Text>
                      <Text style={styles.targetSub}>
                        কিডনির ফিল্ট্রেশন স্বাভাবিক রাখতে সর্বনিম্ন প্রয়োজনীয় পরিমাণ
                      </Text>
                    </View>
                    <View style={styles.targetBadge}>
                      <Text style={styles.targetBadgeMl}>{hydrationGoal.dailyWaterMl} mL</Text>
                      <Text style={styles.targetBadgeGlasses}>{hydrationGoal.dailyGlasses} গ্লাস</Text>
                    </View>
                  </View>
                </View>

                {/* Hourly Hydration Pacing Schedule */}
                <View style={styles.scheduleCard}>
                  <Text style={styles.scheduleCardTitle}>
                    ⏰ সারাদিনে পানি খাওয়ার সঠিক রুটিন:
                  </Text>
                  {hydrationGoal.hourlyScheduleBn.map((item, idx) => (
                    <View key={idx} style={styles.scheduleItem}>
                      <Text style={styles.scheduleText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: UTI (URINARY TRACT INFECTION) 6-POINT SCREENER */}
            {/* ========================================================================= */}
            {activeTab === 'UTI_SCREENER' && (
              <>
                <View
                  style={[
                    styles.utiScoreBanner,
                    { borderColor: utiEvaluation.riskColor, backgroundColor: 'rgba(2, 132, 199, 0.05)' },
                  ]}>
                  <Text style={[styles.utiScoreTitle, { color: utiEvaluation.riskColor }]}>
                    {utiEvaluation.riskLevelBn}
                  </Text>
                  <Text style={styles.utiScoreGuidance}>
                    {utiEvaluation.actionGuidanceBn}
                  </Text>
                </View>

                <Text style={styles.sectionHeader}>
                  আপনার কি নিচের কোনো লক্ষণ বা অস্বস্তি রয়েছে?
                </Text>

                {utiSymptoms.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.8}
                    onPress={() => handleToggleUtiSymptom(s.id)}
                    style={[
                      styles.symptomCard,
                      s.isSelected && styles.symptomCardSelected,
                      s.isSevereRedFlag && s.isSelected && styles.symptomCardRedFlag,
                    ]}>
                    <MaterialIcons
                      name={s.isSelected ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={
                        s.isSelected
                          ? s.isSevereRedFlag
                            ? '#DC2626'
                            : '#0284C7'
                          : C.onSurfaceVariant
                      }
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.symptomTitle,
                          s.isSelected && styles.symptomTitleSelected,
                        ]}>
                        {s.nameBn}
                      </Text>
                      <Text style={styles.symptomSub}>{s.descriptionBn}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: KIDNEY STONE DIET & DOCTOR REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'KIDNEY_STONE_DIET' && (
              <>
                <View style={styles.dietBanner}>
                  <Text style={styles.dietBannerTitle}>
                    কিডনি পাথর প্রতিরোধে খাদ্য ও সাইট্রেট রুলস
                  </Text>
                  <Text style={styles.dietBannerSub}>
                    ক্যালসিয়াম অক্সালেট পাথর গলিয়ে প্রস্রাবের মাধ্যমে বের করার উপায়:
                  </Text>
                </View>

                {KIDNEY_STONE_DIET_CATALOG.map((item) => (
                  <View key={item.id} style={styles.stoneDietCard}>
                    <View style={styles.stoneDietTop}>
                      <Text style={styles.stoneDietCategory}>{item.categoryLabelBn}</Text>
                      <Text style={styles.stoneDietName}>{item.nameBn}</Text>
                    </View>
                    <Text style={styles.stoneDietAction}>👉 {item.actionBn}</Text>
                    <Text style={styles.stoneDietReason}>💡 {item.scientificReasonBn}</Text>
                  </View>
                ))}

                <View style={styles.shareActionRow}>
                  <TouchableOpacity onPress={handleCopyReport} style={styles.copySummaryBtn}>
                    <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.copySummaryBtnText}>ডাক্তার সামারি কপি করুন</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleWhatsAppShare} style={styles.waSummaryBtn}>
                    <MaterialIcons name="share" size={16} color="#25D366" />
                    <Text style={styles.waSummaryBtnText}>WhatsApp-এ পাঠান</Text>
                  </TouchableOpacity>
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
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
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: '#0284C7',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#0284C7',
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
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0284C7',
  },
  bannerBox: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  bannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  swatchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  swatchBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  swatchBtnSelected: {
    borderColor: '#0284C7',
    transform: [{ scale: 1.08 }],
    elevation: 4,
  },
  swatchNumber: {
    fontFamily: F.bold,
    fontSize: 14,
  },
  swatchCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  evaluationCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    gap: 10,
  },
  evalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  evalColorBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  evalShadeName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  evalCategoryLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    marginTop: 2,
  },
  evalDescription: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  evalAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 10,
    padding: 10,
  },
  evalAdviceText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#0284C7',
    flex: 1,
    lineHeight: 14,
  },
  waterPrescriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    padding: 12,
    borderRadius: 12,
  },
  waterPrescriptionText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  calcInputCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  calcCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 80,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchTitle: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  switchSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  targetResultCard: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  targetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#0284C7',
  },
  targetSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    maxWidth: 200,
  },
  targetBadge: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  targetBadgeMl: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  targetBadgeGlasses: {
    fontFamily: F.medium,
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
  },
  scheduleCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  scheduleCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  scheduleItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
    borderRadius: 8,
  },
  scheduleText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
  },
  utiScoreBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  utiScoreTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  utiScoreGuidance: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  sectionHeader: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  symptomCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  symptomCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  symptomCardRedFlag: {
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  symptomTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  symptomTitleSelected: {
    color: '#0284C7',
  },
  symptomSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  dietBanner: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dietBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#0284C7',
  },
  dietBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  stoneDietCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  stoneDietTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stoneDietCategory: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#0284C7',
  },
  stoneDietName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  stoneDietAction: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  stoneDietReason: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
