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
  CALCIUM_D3_CATALOG,
  KNEE_EXERCISES_CATALOG,
} from '@/services/osteoporosis-knowledge';
import {
  evaluateFractureRisk,
  formatOrthopedicBoneSummary,
} from '@/services/osteoporosis-service';
import { OsteoporosisEvaluation } from '@/types/osteoporosis-joint-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'FRACTURE_RISK' | 'KNEE_REHAB' | 'SUNLIGHT_CALCIUM' | 'PAIN_DOCTOR';

interface OsteoporosisJointModalProps {
  visible: boolean;
  onClose: () => void;
}

export function OsteoporosisJointModal({ visible, onClose }: OsteoporosisJointModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('FRACTURE_RISK');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: FRAX Inputs
  const [age, setAge] = useState<number>(62);
  const [isFemale, setIsFemale] = useState<boolean>(true);
  const [isPostMenopausal, setIsPostMenopausal] = useState<boolean>(true);
  const [weightKg, setWeightKg] = useState<number>(54);
  const [hasPriorFracture, setHasPriorFracture] = useState<boolean>(false);
  const [hasSteroidHistory, setHasSteroidHistory] = useState<boolean>(false);

  const evaluation: OsteoporosisEvaluation = useMemo(() => {
    return evaluateFractureRisk(
      age,
      isFemale,
      isPostMenopausal,
      weightKg,
      hasPriorFracture,
      hasSteroidHistory
    );
  }, [age, isFemale, isPostMenopausal, weightKg, hasPriorFracture, hasSteroidHistory]);

  // Tab 4: Pain & Stiffness
  const [painLevel, setPainLevel] = useState<number>(5);
  const [stiffnessMins, setStiffnessMins] = useState<number>(20);
  const [selectedJoints, setSelectedJoints] = useState<Record<string, boolean>>({
    knee_right: true,
    knee_left: true,
  });

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleStepAge = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAge((p) => Math.max(30, Math.min(100, p + delta)));
  };

  const handleStepWeight = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setWeightKg((p) => Math.max(30, Math.min(150, p + delta)));
  };

  const handleCopySummary = async () => {
    const joints: string[] = [];
    if (selectedJoints.knee_right) joints.push('ডান হাঁটু');
    if (selectedJoints.knee_left) joints.push('বাম হাঁটু');
    if (selectedJoints.hip) joints.push('হিপ/কোমরের জয়েন্ট');
    if (selectedJoints.back) joints.push('মেরুদণ্ড');

    const text = formatOrthopedicBoneSummary(evaluation, painLevel, stiffnessMins, joints);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('হাড় ও জয়েন্ট রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const joints: string[] = [];
    if (selectedJoints.knee_right) joints.push('ডান হাঁটু');
    if (selectedJoints.knee_left) joints.push('বাম হাঁটু');
    if (selectedJoints.hip) joints.push('হিপ/কোমরের জয়েন্ট');
    if (selectedJoints.back) joints.push('মেরুদণ্ড');

    const text = formatOrthopedicBoneSummary(evaluation, painLevel, stiffnessMins, joints);
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
                <MaterialIcons name="accessibility-new" size={26} color="#06B6D4" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Osteoporosis & Joint Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  হাড়ের ক্ষয় ও হাঁটু ব্যথা কেয়ার
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
              onPress={() => setActiveTab('FRACTURE_RISK')}
              style={[styles.tabBtn, activeTab === 'FRACTURE_RISK' && styles.tabBtnActive]}>
              <MaterialIcons
                name="calculate"
                size={16}
                color={activeTab === 'FRACTURE_RISK' ? '#06B6D4' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FRACTURE_RISK' && styles.tabBtnTextActive,
                ]}>
                🦴 হাড়ের ঝুঁকি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('KNEE_REHAB')}
              style={[styles.tabBtn, activeTab === 'KNEE_REHAB' && styles.tabBtnActive]}>
              <MaterialIcons
                name="fitness-center"
                size={16}
                color={activeTab === 'KNEE_REHAB' ? '#06B6D4' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'KNEE_REHAB' && styles.tabBtnTextActive,
                ]}>
                🪑 ফিজিওথেরাপি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SUNLIGHT_CALCIUM')}
              style={[styles.tabBtn, activeTab === 'SUNLIGHT_CALCIUM' && styles.tabBtnActive]}>
              <MaterialIcons
                name="wb-sunny"
                size={16}
                color={activeTab === 'SUNLIGHT_CALCIUM' ? '#06B6D4' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SUNLIGHT_CALCIUM' && styles.tabBtnTextActive,
                ]}>
                ☀️ রোদ ও ক্যালসিয়াম
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PAIN_DOCTOR')}
              style={[styles.tabBtn, activeTab === 'PAIN_DOCTOR' && styles.tabBtnActive]}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={activeTab === 'PAIN_DOCTOR' ? '#06B6D4' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PAIN_DOCTOR' && styles.tabBtnTextActive,
                ]}>
                📋 জয়েন্ট রিপোর্ট
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#06B6D4" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: FRAX BONE FRACTURE RISK CALCULATOR */}
            {/* ========================================================================= */}
            {activeTab === 'FRACTURE_RISK' && (
              <>
                <View style={styles.fraxParamsCard}>
                  <Text style={styles.cardSectionTitle}>ব্যক্তির তথ্য ও ক্লিনিক্যাল হিস্ট্রি:</Text>

                  {/* Age and Weight */}
                  <View style={styles.steppersRow}>
                    <View style={styles.stepperBox}>
                      <Text style={styles.stepperLabel}>বয়স: {age} বছর</Text>
                      <View style={styles.stepperBtnsWrap}>
                        <TouchableOpacity onPress={() => handleStepAge(-5)} style={styles.stepBtn}>
                          <Text style={styles.stepBtnText}>-৫</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleStepAge(5)} style={styles.stepBtn}>
                          <Text style={styles.stepBtnText}>+৫</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.stepperBox}>
                      <Text style={styles.stepperLabel}>ওজন: {weightKg} কেজি</Text>
                      <View style={styles.stepperBtnsWrap}>
                        <TouchableOpacity onPress={() => handleStepWeight(-2)} style={styles.stepBtn}>
                          <Text style={styles.stepBtnText}>-২</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleStepWeight(2)} style={styles.stepBtn}>
                          <Text style={styles.stepBtnText}>+২</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Gender & Menopause */}
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setIsFemale(!isFemale);
                      }}
                      style={[styles.toggleBtn, isFemale && styles.toggleBtnActive]}>
                      <MaterialIcons
                        name={isFemale ? 'female' : 'male'}
                        size={18}
                        color={isFemale ? '#06B6D4' : C.onSurfaceVariant}
                      />
                      <Text style={[styles.toggleBtnText, isFemale && styles.toggleBtnTextActive]}>
                        {isFemale ? 'নারী (Female)' : 'পুরুষ (Male)'}
                      </Text>
                    </TouchableOpacity>

                    {isFemale && (
                      <TouchableOpacity
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setIsPostMenopausal(!isPostMenopausal);
                        }}
                        style={[styles.toggleBtn, isPostMenopausal && styles.toggleBtnActive]}>
                        <MaterialIcons
                          name="check"
                          size={16}
                          color={isPostMenopausal ? '#06B6D4' : C.onSurfaceVariant}
                        />
                        <Text style={[styles.toggleBtnText, isPostMenopausal && styles.toggleBtnTextActive]}>
                          মেনোপজ হয়েছে
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Prior Fracture & Steroid */}
                  <View style={styles.checkboxGroup}>
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setHasPriorFracture(!hasPriorFracture);
                      }}
                      style={[styles.checkRow, hasPriorFracture && styles.checkRowActive]}>
                      <MaterialIcons
                        name={hasPriorFracture ? 'check-box' : 'check-box-outline-blank'}
                        size={18}
                        color={hasPriorFracture ? '#06B6D4' : C.onSurfaceVariant}
                      />
                      <Text style={styles.checkText}>পূর্বে কখনো সামান্য আঘাতেই হাড় ভেঙেছিল</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setHasSteroidHistory(!hasSteroidHistory);
                      }}
                      style={[styles.checkRow, hasSteroidHistory && styles.checkRowActive]}>
                      <MaterialIcons
                        name={hasSteroidHistory ? 'check-box' : 'check-box-outline-blank'}
                        size={18}
                        color={hasSteroidHistory ? '#06B6D4' : C.onSurfaceVariant}
                      />
                      <Text style={styles.checkText}>দীর্ঘদিন স্টেরয়েড বা ব্যথানাশক ওষুধ গ্রহণের ইতিহাস</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Evaluation Card */}
                <View
                  style={[
                    styles.evalCard,
                    { borderColor: evaluation.riskColor, backgroundColor: `${evaluation.riskColor}12` },
                  ]}>
                  <View style={styles.evalTop}>
                    <Text style={[styles.evalTitle, { color: evaluation.riskColor }]}>
                      {evaluation.riskLabelBn}
                    </Text>
                    <Text style={styles.evalPercent}>
                      হিপ ঝুঁকি: {evaluation.tenYearHipRiskPct}%
                    </Text>
                  </View>
                  <Text style={styles.evalDesc}>{evaluation.clinicalAdviceBn}</Text>

                  {evaluation.dexaScanRecommended && (
                    <View style={styles.dexaBadge}>
                      <MaterialIcons name="medical-services" size={16} color="#06B6D4" />
                      <Text style={styles.dexaBadgeText}>
                        ডাক্তারের পরামর্শে DEXA Scan (BMD Test) করানো সুপারিশকৃত
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: KNEE PHYSIOTHERAPY & REHAB EXERCISES */}
            {/* ========================================================================= */}
            {activeTab === 'KNEE_REHAB' && (
              <>
                <View style={styles.avoidCard}>
                  <MaterialIcons name="do-not-disturb" size={20} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.avoidTitle}>হাঁটু ব্যথায় যা কখনোই করবেন না:</Text>
                    <Text style={styles.avoidSub}>
                      • মেঝেতে পিঁড়িতে বসা পরিহার করুন • ভারী বোঝা নিয়ে সিঁড়ি ভাঙবেন না • হাই কমোড ব্যবহার করুন।
                    </Text>
                  </View>
                </View>

                <Text style={styles.exerciseSectionTitle}>চেয়ারে বসে নিরাপদ ফিজিওথেরাপি ব্যায়াম:</Text>

                {KNEE_EXERCISES_CATALOG.map((ex) => (
                  <View key={ex.id} style={styles.exerciseCard}>
                    <View style={styles.exHeader}>
                      <Text style={styles.exMuscleBadge}>{ex.targetMuscleBn}</Text>
                      <Text style={styles.exReps}>{ex.repsBn}</Text>
                    </View>
                    <Text style={styles.exName}>{ex.nameBn}</Text>
                    <Text style={styles.exInstruction}>🎯 নিয়ম: {ex.instructionBn}</Text>
                    <Text style={styles.exPrecaution}>⚠️ সতর্কতা: {ex.precautionsBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: SUNLIGHT & CALCIUM DIET */}
            {/* ========================================================================= */}
            {activeTab === 'SUNLIGHT_CALCIUM' && (
              <>
                <View style={styles.sunlightHero}>
                  <MaterialIcons name="wb-sunny" size={30} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sunTitle}>সকালের মিষ্টি রোদ (ভিটামিন D3)</Text>
                    <Text style={styles.sunSub}>
                      সপ্তাহে অন্তত ৩-৪ দিন সকাল ১০টা থেকে দুপুর ১২টার রোদে ১৫–২০ মিনিট থাকুন। রোদ ছাড়া শরীরের হাড় ক্যালসিয়াম শোষণ করতে পারে না।
                    </Text>
                  </View>
                </View>

                <Text style={styles.exerciseSectionTitle}>দেশি ক্যালসিয়াম সমৃদ্ধ প্রাকৃতিক খাদ্যতালিকা:</Text>

                {CALCIUM_D3_CATALOG.map((item) => (
                  <View key={item.id} style={styles.calciumCard}>
                    <View style={styles.calCardHeader}>
                      <Text style={styles.calCategory}>{item.categoryLabelBn}</Text>
                      {item.calciumMgPerServing && (
                        <Text style={styles.calAmount}>{item.calciumMgPerServing}</Text>
                      )}
                    </View>
                    <Text style={styles.calName}>{item.nameBn}</Text>
                    <Text style={styles.calBenefit}>💡 {item.benefitBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: JOINT PAIN LOG & DOCTOR SUMMARY */}
            {/* ========================================================================= */}
            {activeTab === 'PAIN_DOCTOR' && (
              <>
                <View style={styles.painCard}>
                  <Text style={styles.painLabel}>বর্তমান জয়েন্ট ব্যথার তীব্রতা (VAS স্কেল ১–১০):</Text>
                  <View style={styles.painButtonsRow}>
                    {[1, 3, 5, 7, 9].map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setPainLevel(p);
                        }}
                        style={[
                          styles.painScoreBtn,
                          painLevel === p && styles.painScoreBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.painScoreBtnText,
                            painLevel === p && styles.painScoreBtnTextActive,
                          ]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Morning Stiffness */}
                <View style={styles.stiffnessCard}>
                  <Text style={styles.stiffnessLabel}>
                    সকালে ঘুম থেকে ওঠার পর জয়েন্ট জ্যাম (Morning Stiffness):
                  </Text>
                  <View style={styles.stiffnessRow}>
                    {[5, 15, 30, 60].map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setStiffnessMins(mins);
                        }}
                        style={[
                          styles.stiffnessBtn,
                          stiffnessMins === mins && styles.stiffnessBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.stiffnessBtnText,
                            stiffnessMins === mins && styles.stiffnessBtnTextActive,
                          ]}>
                          {mins} মি.
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#06B6D4',
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#06B6D4',
  },
  fraxParamsCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  cardSectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  stepperLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  stepperBtnsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: '#06B6D4',
  },
  toggleBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  toggleBtnTextActive: {
    fontFamily: F.bold,
    color: '#06B6D4',
  },
  checkboxGroup: {
    gap: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
  },
  checkRowActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  checkText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  evalCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  evalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evalTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  evalPercent: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  evalDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  dexaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  dexaBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#06B6D4',
    flex: 1,
  },
  avoidCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  avoidTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  avoidSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
    marginTop: 2,
  },
  exerciseSectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  exerciseCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exMuscleBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exReps: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  exName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  exInstruction: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  exPrecaution: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#F59E0B',
  },
  sunlightHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  sunTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F59E0B',
  },
  sunSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
    marginTop: 2,
  },
  calciumCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  calCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calCategory: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#06B6D4',
  },
  calAmount: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  calName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  calBenefit: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  painCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  painLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  painButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  painScoreBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  painScoreBtnActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  painScoreBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  painScoreBtnTextActive: {
    color: '#FFFFFF',
  },
  stiffnessCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  stiffnessLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  stiffnessRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stiffnessBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stiffnessBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06B6D4',
  },
  stiffnessBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  stiffnessBtnTextActive: {
    fontFamily: F.bold,
    color: '#06B6D4',
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
    backgroundColor: '#06B6D4',
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
