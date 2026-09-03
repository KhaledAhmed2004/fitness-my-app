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
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  EYE_NUTRIENTS_CATALOG,
  VISION_SYMPTOMS_LIST,
} from '@/services/diabetic-vision-knowledge';
import {
  evaluateAmslerGrid,
  evaluateFundoscopyDue,
  formatOphthalmologistVisionSummary,
} from '@/services/diabetic-vision-service';
import {
  AmslerGridResult,
  EyeTested,
  FundoscopyStatus,
} from '@/types/diabetic-vision-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'AMSLER_GRID' | 'FUNDOSCOPY' | 'WARNING_SIGNS' | 'NUTRITION_REPORT';

interface DiabeticVisionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DiabeticVisionModal({ visible, onClose }: DiabeticVisionModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('AMSLER_GRID');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Amsler Grid Test State
  const [currentTestingEye, setCurrentTestingEye] = useState<EyeTested>('RIGHT_EYE');
  const [rightEyeDistorted, setRightEyeDistorted] = useState<boolean>(false);
  const [rightEyeDarkSpots, setRightEyeDarkSpots] = useState<boolean>(false);
  const [leftEyeDistorted, setLeftEyeDistorted] = useState<boolean>(false);
  const [leftEyeDarkSpots, setLeftEyeDarkSpots] = useState<boolean>(false);

  const rightEyeResult: AmslerGridResult = useMemo(() => {
    return evaluateAmslerGrid('RIGHT_EYE', rightEyeDistorted, rightEyeDarkSpots);
  }, [rightEyeDistorted, rightEyeDarkSpots]);

  const leftEyeResult: AmslerGridResult = useMemo(() => {
    return evaluateAmslerGrid('LEFT_EYE', leftEyeDistorted, leftEyeDarkSpots);
  }, [leftEyeDistorted, leftEyeDarkSpots]);

  const activeEyeResult = currentTestingEye === 'RIGHT_EYE' ? rightEyeResult : leftEyeResult;

  // Tab 2: Fundoscopy Months State
  const [monthsSinceFundoscopy, setMonthsSinceFundoscopy] = useState<number>(14);
  const fundoscopyStatus: FundoscopyStatus = useMemo(() => {
    return evaluateFundoscopyDue(monthsSinceFundoscopy);
  }, [monthsSinceFundoscopy]);

  // Tab 3: Warning Symptoms Checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({
    sym_floaters: true,
  });

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleStepMonths = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMonthsSinceFundoscopy((p) => Math.max(0, Math.min(36, p + delta)));
  };

  const toggleSymptom = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedSymptoms((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySummary = async () => {
    const activeList = VISION_SYMPTOMS_LIST.filter((s) => selectedSymptoms[s.id]).map(
      (s) => s.nameBn
    );
    const text = formatOphthalmologistVisionSummary(
      leftEyeResult,
      rightEyeResult,
      activeList,
      fundoscopyStatus
    );
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('চক্ষু ও রেটিনা রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const activeList = VISION_SYMPTOMS_LIST.filter((s) => selectedSymptoms[s.id]).map(
      (s) => s.nameBn
    );
    const text = formatOphthalmologistVisionSummary(
      leftEyeResult,
      rightEyeResult,
      activeList,
      fundoscopyStatus
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
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
                <MaterialIcons name="visibility" size={26} color="#3B82F6" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Diabetic Eye & Vision Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ডায়াবেটিক রেটিনোপ্যাথি ও দৃষ্টিশক্তি গার্ড
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
              onPress={() => setActiveTab('AMSLER_GRID')}
              style={[styles.tabBtn, activeTab === 'AMSLER_GRID' && styles.tabBtnActive]}>
              <MaterialIcons
                name="grid-on"
                size={16}
                color={activeTab === 'AMSLER_GRID' ? '#3B82F6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'AMSLER_GRID' && styles.tabBtnTextActive,
                ]}>
                🏁 Amsler Grid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('FUNDOSCOPY')}
              style={[styles.tabBtn, activeTab === 'FUNDOSCOPY' && styles.tabBtnActive]}>
              <MaterialIcons
                name="calendar-today"
                size={16}
                color={activeTab === 'FUNDOSCOPY' ? '#3B82F6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FUNDOSCOPY' && styles.tabBtnTextActive,
                ]}>
                🩺 রেটিনা টেস্ট
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('WARNING_SIGNS')}
              style={[styles.tabBtn, activeTab === 'WARNING_SIGNS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="warning"
                size={16}
                color={activeTab === 'WARNING_SIGNS' ? '#3B82F6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'WARNING_SIGNS' && styles.tabBtnTextActive,
                ]}>
                🌈 বিপদচিহ্ন
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('NUTRITION_REPORT')}
              style={[styles.tabBtn, activeTab === 'NUTRITION_REPORT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={activeTab === 'NUTRITION_REPORT' ? '#3B82F6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'NUTRITION_REPORT' && styles.tabBtnTextActive,
                ]}>
                🥕 ডায়েট ও রিপোর্ট
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#3B82F6" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: AMSLER GRID DIGITAL SELF-TEST */}
            {/* ========================================================================= */}
            {activeTab === 'AMSLER_GRID' && (
              <>
                {/* Eye Switcher */}
                <View style={styles.eyeSelectorRow}>
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setCurrentTestingEye('RIGHT_EYE');
                    }}
                    style={[
                      styles.eyeSelectBtn,
                      currentTestingEye === 'RIGHT_EYE' && styles.eyeSelectBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.eyeSelectBtnText,
                        currentTestingEye === 'RIGHT_EYE' && styles.eyeSelectBtnTextActive,
                      ]}>
                      ডান চোখ (Right Eye) {rightEyeResult.isAbnormal ? '⚠️' : '✅'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setCurrentTestingEye('LEFT_EYE');
                    }}
                    style={[
                      styles.eyeSelectBtn,
                      currentTestingEye === 'LEFT_EYE' && styles.eyeSelectBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.eyeSelectBtnText,
                        currentTestingEye === 'LEFT_EYE' && styles.eyeSelectBtnTextActive,
                      ]}>
                      বাম চোখ (Left Eye) {leftEyeResult.isAbnormal ? '⚠️' : '✅'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Instruction */}
                <View style={styles.amslerGuidanceBox}>
                  <Text style={styles.guidanceText}>
                    💡 নিয়ম: পড়ার চশমা থাকলে পরুন। অপর চোখ হাত দিয়ে ঢেকে রাখুন। ঠিক ১২ ইঞ্চি দূর থেকে মাঝের সাদা বিন্দুটির দিকে তাকিয়ে থাকুন।
                  </Text>
                </View>

                {/* Amsler Grid Visual Box */}
                <View style={styles.amslerGridFrame}>
                  {/* Grid Lines Visual Simulation */}
                  <View style={styles.gridCanvas}>
                    {[...Array(9)].map((_, i) => (
                      <View key={`h-${i}`} style={[styles.gridHLine, { top: `${(i + 1) * 10}%` }]} />
                    ))}
                    {[...Array(9)].map((_, i) => (
                      <View key={`v-${i}`} style={[styles.gridVLine, { left: `${(i + 1) * 10}%` }]} />
                    ))}
                    {/* Focal White Dot in Center */}
                    <View style={styles.focalDot} />
                  </View>
                </View>

                {/* Self Check Toggles for Active Eye */}
                <View style={styles.checkCard}>
                  <Text style={styles.checkCardTitle}>
                    {currentTestingEye === 'RIGHT_EYE' ? 'ডান' : 'বাম'} চোখে তাকিয়ে যা দেখতে পাচ্ছেন:
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      if (currentTestingEye === 'RIGHT_EYE') {
                        setRightEyeDistorted(!rightEyeDistorted);
                      } else {
                        setLeftEyeDistorted(!leftEyeDistorted);
                      }
                    }}
                    style={[
                      styles.toggleOptionRow,
                      (currentTestingEye === 'RIGHT_EYE' ? rightEyeDistorted : leftEyeDistorted) &&
                        styles.toggleOptionRowActive,
                    ]}>
                    <MaterialIcons
                      name={
                        (currentTestingEye === 'RIGHT_EYE' ? rightEyeDistorted : leftEyeDistorted)
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={20}
                      color="#3B82F6"
                    />
                    <Text style={styles.toggleOptionText}>
                      সোজা লাইনগুলো বাঁকা বা ঢেউ খেলানো দেখা যাচ্ছে (Wavy Lines)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      if (currentTestingEye === 'RIGHT_EYE') {
                        setRightEyeDarkSpots(!rightEyeDarkSpots);
                      } else {
                        setLeftEyeDarkSpots(!leftEyeDarkSpots);
                      }
                    }}
                    style={[
                      styles.toggleOptionRow,
                      (currentTestingEye === 'RIGHT_EYE' ? rightEyeDarkSpots : leftEyeDarkSpots) &&
                        styles.toggleOptionRowActive,
                    ]}>
                    <MaterialIcons
                      name={
                        (currentTestingEye === 'RIGHT_EYE' ? rightEyeDarkSpots : leftEyeDarkSpots)
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={20}
                      color="#3B82F6"
                    />
                    <Text style={styles.toggleOptionText}>
                      গ্রিডের কোনো অংশ অন্ধকার, কালো ছোপ বা অদৃশ্য (Dark Blind Spots)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Live Interpretation */}
                <View
                  style={[
                    styles.resultCard,
                    { borderColor: activeEyeResult.severityColor, backgroundColor: `${activeEyeResult.severityColor}12` },
                  ]}>
                  <Text style={[styles.resultTitle, { color: activeEyeResult.severityColor }]}>
                    {activeEyeResult.isAbnormal ? '⚠️ অস্বাভাবিক দৃষ্টি সংকেত' : '🟢 দৃষ্টিশক্তি স্বাভাবিক'}
                  </Text>
                  <Text style={styles.resultDesc}>
                    {activeEyeResult.clinicalInterpretationBn}
                  </Text>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: ANNUAL RETINOPATHY FUNDOSCOPY SCHEDULER */}
            {/* ========================================================================= */}
            {activeTab === 'FUNDOSCOPY' && (
              <>
                <View style={styles.fundoscopyCard}>
                  <Text style={styles.fundoscopyTitle}>
                    সর্বশেষ কবে চোখের ড্রপ দিয়ে রেটিনা পরীক্ষা (Fundoscopy) করিয়েছেন?
                  </Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity onPress={() => handleStepMonths(-3)} style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>-৩ মাস</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleStepMonths(-1)} style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>-১ মাস</Text>
                    </TouchableOpacity>

                    <Text style={[styles.monthsDisplay, { color: fundoscopyStatus.statusColor }]}>
                      {monthsSinceFundoscopy} মাস
                    </Text>

                    <TouchableOpacity onPress={() => handleStepMonths(1)} style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>+১ মাস</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleStepMonths(3)} style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>+৩ মাস</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Overdue/Status Badge Card */}
                <View
                  style={[
                    styles.fundStatusCard,
                    { borderColor: fundoscopyStatus.statusColor, backgroundColor: `${fundoscopyStatus.statusColor}12` },
                  ]}>
                  <Text style={[styles.fundStatusTitle, { color: fundoscopyStatus.statusColor }]}>
                    {fundoscopyStatus.statusLabelBn}
                  </Text>
                  <Text style={styles.fundStatusDesc}>{fundoscopyStatus.adviceBn}</Text>
                </View>

                <View style={styles.fundoscopyGuidance}>
                  <Text style={styles.guidanceHead}>ডায়াবেটিসে কেন প্রতি বছর রেটিনা পরীক্ষা জরুরি?</Text>
                  <Text style={styles.guidanceBody}>
                    ডায়াবেটিক রেটিনোপ্যাথি কোনো প্রাথমিক ব্যথা ছাড়াই চোখের রক্তনালী ছিঁড়ে অন্ধত্ব সৃষ্টি করে। রেটিনা স্ক্যানিং করালে লেজার বা ইনজেকশনের মাধ্যমে দৃষ্টিশক্তি শতভাগ রক্ষা করা সম্ভব।
                  </Text>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: WARNING SIGNS & EMERGENCY RED FLAGS */}
            {/* ========================================================================= */}
            {activeTab === 'WARNING_SIGNS' && (
              <>
                <Text style={styles.sectionTitle}>
                  আপনার চোখে নিচের কোনো অস্বাভাবিক লক্ষণ অনুভূত হচ্ছে কিনা টিক দিন:
                </Text>

                {VISION_SYMPTOMS_LIST.map((sym) => {
                  const isChecked = !!selectedSymptoms[sym.id];
                  return (
                    <TouchableOpacity
                      key={sym.id}
                      activeOpacity={0.8}
                      onPress={() => toggleSymptom(sym.id)}
                      style={[
                        styles.symptomCard,
                        isChecked && styles.symptomCardActive,
                      ]}>
                      <MaterialIcons
                        name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={isChecked ? '#3B82F6' : C.onSurfaceVariant}
                      />
                      <View style={styles.symptomTextWrap}>
                        <View style={styles.symptomTopRow}>
                          <Text
                            style={[
                              styles.symptomName,
                              isChecked && styles.symptomNameActive,
                            ]}>
                            {sym.nameBn}
                          </Text>
                          {sym.isEmergencyRedFlag && (
                            <Text style={styles.emergencyBadge}>🚨 জরুরি লক্ষণ</Text>
                          )}
                        </View>
                        <Text style={styles.symptomDesc}>{sym.descriptionBn}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: EYE NUTRITION & DOCTOR SUMMARY */}
            {/* ========================================================================= */}
            {activeTab === 'NUTRITION_REPORT' && (
              <>
                <View style={styles.nutritionBanner}>
                  <Text style={styles.nutBannerTitle}>
                    🥕 ম্যাকুলা ও দৃষ্টিশক্তি সুরক্ষায় দেশি খাদ্যতালিকা
                  </Text>
                  <Text style={styles.nutBannerSub}>
                    লুটিন, ভিটামিন-এ ও ওমেগা-৩ চোখের রেটিনাকে দীর্ঘমেয়াদে সুরক্ষিত রাখে:
                  </Text>
                </View>

                {EYE_NUTRIENTS_CATALOG.map((nut) => (
                  <View key={nut.id} style={styles.nutrientCard}>
                    <Text style={styles.nutrientBadge}>{nut.nutrientBn}</Text>
                    <Text style={styles.nutrientName}>{nut.nameBn}</Text>
                    <Text style={styles.nutrientBenefit}>💡 {nut.benefitBn}</Text>
                    <Text style={styles.nutrientSource}>🍽️ খাওয়ার উপায়: {nut.sourceFoodBn}</Text>
                  </View>
                ))}

                {/* Share Action Row */}
                <View style={styles.shareActionRow}>
                  <TouchableOpacity onPress={handleCopySummary} style={styles.copySummaryBtn}>
                    <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.copySummaryBtnText}>ডাক্তার রিপোর্ট কপি</Text>
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#3B82F6',
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#3B82F6',
  },
  eyeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  eyeSelectBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eyeSelectBtnActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  eyeSelectBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  eyeSelectBtnTextActive: {
    fontFamily: F.bold,
    color: '#3B82F6',
  },
  amslerGuidanceBox: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  guidanceText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  amslerGridFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  gridCanvas: {
    width: 220,
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridHLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  gridVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  focalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  checkCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  checkCardTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  toggleOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
  },
  toggleOptionRowActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  toggleOptionText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  resultCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  resultTitle: {
    fontFamily: F.bold,
    fontSize: 12,
  },
  resultDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  fundoscopyCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  fundoscopyTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stepperBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurface,
  },
  monthsDisplay: {
    fontFamily: F.bold,
    fontSize: 22,
    minWidth: 70,
    textAlign: 'center',
  },
  fundStatusCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  fundStatusTitle: {
    fontFamily: F.bold,
    fontSize: 12,
  },
  fundStatusDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  fundoscopyGuidance: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  guidanceHead: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#3B82F6',
  },
  guidanceBody: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  symptomCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  symptomCardActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  symptomTextWrap: {
    flex: 1,
    gap: 3,
  },
  symptomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symptomName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  symptomNameActive: {
    color: '#3B82F6',
  },
  emergencyBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#EF4444',
  },
  symptomDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  nutritionBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  nutBannerTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#3B82F6',
  },
  nutBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  nutrientCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  nutrientBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#3B82F6',
  },
  nutrientName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  nutrientBenefit: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  nutrientSource: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  copySummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
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
