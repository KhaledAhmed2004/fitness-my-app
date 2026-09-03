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
  BRAIN_EXERCISES_CATALOG,
  CAREGIVER_OBSERVATIONS,
  MINI_COG_WORD_SETS,
} from '@/services/memory-dementia-knowledge';
import {
  evaluateMiniCog,
  formatNeurologistDementiaSummary,
} from '@/services/memory-dementia-service';
import {
  MiniCogResult,
  SafeIdCardData,
} from '@/types/memory-dementia-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'MINI_COG' | 'OBSERVATIONS' | 'BRAIN_FITNESS' | 'SAFE_ID_DOCTOR';

interface MemoryDementiaModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MemoryDementiaModal({ visible, onClose }: MemoryDementiaModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('MINI_COG');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Mini-Cog State
  const [selectedWordSetIdx, setSelectedWordSetIdx] = useState<number>(0);
  const [clockDrawingPassed, setClockDrawingPassed] = useState<boolean>(true);
  const [recalledWordsCount, setRecalledWordsCount] = useState<number>(2);

  const miniCogResult: MiniCogResult = useMemo(() => {
    return evaluateMiniCog(recalledWordsCount, clockDrawingPassed);
  }, [recalledWordsCount, clockDrawingPassed]);

  // Tab 2: Caregiver Observations State
  const [checkedObservations, setCheckedObservations] = useState<Record<string, boolean>>({
    obs_repetitive: true,
    obs_misplacing: true,
  });

  // Tab 4: Safe ID Card Data
  const [safeId, setSafeId] = useState<SafeIdCardData>({
    elderName: 'আনোয়ার হোসেন',
    bloodGroup: 'B+',
    emergencyContactName: 'রাশেদ হোসেন (ছেলে)',
    emergencyPhone: '01712345678',
    addressBn: 'বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা',
    allergiesMedications: 'উচ্চ রক্তচাপ ও ডায়াবেটিসের ওষুধ গ্রহণ করেন',
  });

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const toggleObservation = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setCheckedObservations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySummary = async () => {
    const activeObs = CAREGIVER_OBSERVATIONS.filter((o) => checkedObservations[o.id]).map(
      (o) => o.titleBn
    );
    const text = formatNeurologistDementiaSummary(miniCogResult, activeObs, safeId);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('স্মৃতিভ্রম ও কগনিটিভ রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const activeObs = CAREGIVER_OBSERVATIONS.filter((o) => checkedObservations[o.id]).map(
      (o) => o.titleBn
    );
    const text = formatNeurologistDementiaSummary(miniCogResult, activeObs, safeId);
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
                <MaterialIcons name="psychology" size={26} color="#8B5CF6" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Memory & Dementia Screener
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  স্মৃতিভ্রম ও ব্রেন ফিটনেস গার্ড
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
              onPress={() => setActiveTab('MINI_COG')}
              style={[styles.tabBtn, activeTab === 'MINI_COG' && styles.tabBtnActive]}>
              <MaterialIcons
                name="timer"
                size={16}
                color={activeTab === 'MINI_COG' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'MINI_COG' && styles.tabBtnTextActive,
                ]}>
                🧠 Mini-Cog
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('OBSERVATIONS')}
              style={[styles.tabBtn, activeTab === 'OBSERVATIONS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="visibility"
                size={16}
                color={activeTab === 'OBSERVATIONS' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'OBSERVATIONS' && styles.tabBtnTextActive,
                ]}>
                🔍 পর্যবেক্ষণ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('BRAIN_FITNESS')}
              style={[styles.tabBtn, activeTab === 'BRAIN_FITNESS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="extension"
                size={16}
                color={activeTab === 'BRAIN_FITNESS' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'BRAIN_FITNESS' && styles.tabBtnTextActive,
                ]}>
                🧩 নিউরোবিক্স
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SAFE_ID_DOCTOR')}
              style={[styles.tabBtn, activeTab === 'SAFE_ID_DOCTOR' && styles.tabBtnActive]}>
              <MaterialIcons
                name="badge"
                size={16}
                color={activeTab === 'SAFE_ID_DOCTOR' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SAFE_ID_DOCTOR' && styles.tabBtnTextActive,
                ]}>
                🪪 সেফটি আইডি
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#8B5CF6" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: MINI-COG 3-MINUTE COGNITIVE SCREENER */}
            {/* ========================================================================= */}
            {activeTab === 'MINI_COG' && (
              <>
                <View style={styles.introBox}>
                  <Text style={styles.introTitle}>
                    ক্লিনিক্যাল Mini-Cog ৩-মিনিটের মেমরি টেস্ট
                  </Text>
                  <Text style={styles.introSub}>
                    প্রবীণ ব্যক্তির স্মৃতি ও ব্রেনের কার্যকারিতা দ্রুত মূল্যায়নের ৩টি সহজ ধাপ:
                  </Text>
                </View>

                {/* Step 1: 3-Word Registration */}
                <View style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepNumberBadge}>ধাপ ১</Text>
                    <Text style={styles.stepTitle}>৩টি শব্দ মনে রাখতে বলুন</Text>
                  </View>
                  <Text style={styles.stepInstruction}>
                    নিচের ৩টি শব্দ ব্যক্তিকে স্পষ্ট স্বরে ৩ বার বলতে বলুন:
                  </Text>
                  <View style={styles.wordsRow}>
                    {MINI_COG_WORD_SETS[selectedWordSetIdx].words.map((w, idx) => (
                      <View key={idx} style={styles.wordPill}>
                        <Text style={styles.wordPillText}>{w}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Step 2: Clock Drawing Test (CDT) */}
                <View style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepNumberBadge}>ধাপ ২</Text>
                    <Text style={styles.stepTitle}>ঘড়ির কাঁটা পরীক্ষা (Clock Drawing)</Text>
                  </View>
                  <Text style={styles.stepInstruction}>
                    একটি কাগজে গোল এঁকে ১২ থেকে ১-১১ সংখ্যা এবং "১১টা বেজে ১০ মিনিট" সময় নির্দেশক কাঁটা আঁকতে দিন:
                  </Text>

                  <View style={styles.clockToggleRow}>
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setClockDrawingPassed(true);
                      }}
                      style={[
                        styles.clockToggleBtn,
                        clockDrawingPassed && styles.clockToggleBtnActiveGreen,
                      ]}>
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color={clockDrawingPassed ? '#10B981' : C.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.clockToggleText,
                          clockDrawingPassed && { color: '#10B981', fontFamily: F.bold },
                        ]}>
                        ঘড়ি সঠিক (Normal)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setClockDrawingPassed(false);
                      }}
                      style={[
                        styles.clockToggleBtn,
                        !clockDrawingPassed && styles.clockToggleBtnActiveRed,
                      ]}>
                      <MaterialIcons
                        name="cancel"
                        size={18}
                        color={!clockDrawingPassed ? '#EF4444' : C.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.clockToggleText,
                          !clockDrawingPassed && { color: '#EF4444', fontFamily: F.bold },
                        ]}>
                        কাঁটা ভুল / অসম্পূর্ণ
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Step 3: Delayed Word Recall */}
                <View style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepNumberBadge}>ধাপ ৩</Text>
                    <Text style={styles.stepTitle}>শব্দ স্মরণ করার স্কোর (Recall)</Text>
                  </View>
                  <Text style={styles.stepInstruction}>
                    ঘড়ি আঁকার পর আগের ৩টি শব্দের মধ্যে কয়টি মনে করতে পেরেছেন?
                  </Text>

                  <View style={styles.recallButtonsRow}>
                    {[0, 1, 2, 3].map((num) => {
                      const isSelected = recalledWordsCount === num;
                      return (
                        <TouchableOpacity
                          key={num}
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            setRecalledWordsCount(num);
                          }}
                          style={[
                            styles.recallBtn,
                            isSelected && styles.recallBtnActive,
                          ]}>
                          <Text
                            style={[
                              styles.recallBtnText,
                              isSelected && styles.recallBtnTextActive,
                            ]}>
                            {num} টি
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Evaluation Card */}
                <View
                  style={[
                    styles.evalCard,
                    { borderColor: miniCogResult.riskColor, backgroundColor: `${miniCogResult.riskColor}12` },
                  ]}>
                  <Text style={[styles.evalTitle, { color: miniCogResult.riskColor }]}>
                    {miniCogResult.riskLabelBn}
                  </Text>
                  <Text style={styles.evalDesc}>{miniCogResult.clinicalGuidelineBn}</Text>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: CAREGIVER 8-POINT OBSERVATION LOG */}
            {/* ========================================================================= */}
            {activeTab === 'OBSERVATIONS' && (
              <>
                <View style={styles.obsIntroBox}>
                  <Text style={styles.obsIntroTitle}>
                    🔍 কেয়ারগিভারের দৈনিক আচরণগত পর্যবেক্ষণ চেকলিস্ট
                  </Text>
                  <Text style={styles.obsIntroSub}>
                    প্রবীণ সদস্যের মধ্যে যেসব অস্বাভাবিক লক্ষণ দেখা যাচ্ছে টিক দিন:
                  </Text>
                </View>

                {CAREGIVER_OBSERVATIONS.map((item) => {
                  const isChecked = !!checkedObservations[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => toggleObservation(item.id)}
                      style={[
                        styles.obsItemCard,
                        isChecked && styles.obsItemCardActive,
                      ]}>
                      <MaterialIcons
                        name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={isChecked ? '#8B5CF6' : C.onSurfaceVariant}
                      />
                      <View style={styles.obsTextWrap}>
                        <View style={styles.obsHeaderRow}>
                          <Text style={styles.obsCategoryTag}>{item.category}</Text>
                          {item.isHighConcern && (
                            <Text style={styles.highConcernBadge}>⚠️ সতর্ক সংকেত</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.obsTitle,
                            isChecked && styles.obsTitleActive,
                          ]}>
                          {item.titleBn}
                        </Text>
                        <Text style={styles.obsDesc}>{item.descriptionBn}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: BRAIN FITNESS & NEUROBIC EXERCISES */}
            {/* ========================================================================= */}
            {activeTab === 'BRAIN_FITNESS' && (
              <>
                <View style={styles.fitnessBanner}>
                  <Text style={styles.fitnessBannerTitle}>
                    🧩 বাংলা ব্রেন ফিটনেস ও নিউরোবিক এক্সারসাইজ
                  </Text>
                  <Text style={styles.fitnessBannerSub}>
                    মস্তিষ্কের নিউরোপ্লাস্টিসিটি বৃদ্ধি ও নতুন স্নায়ুকোষ সচল রাখার প্রতিদিনের উপায়:
                  </Text>
                </View>

                {BRAIN_EXERCISES_CATALOG.map((ex) => (
                  <View key={ex.id} style={styles.exerciseCard}>
                    <View style={styles.exCardHeader}>
                      <Text style={styles.exTypeBadge}>{ex.typeBn}</Text>
                    </View>
                    <Text style={styles.exTitle}>{ex.titleBn}</Text>
                    <Text style={styles.exInstruction}>🎯 যেভাবে করাবেন: {ex.instructionBn}</Text>
                    <Text style={styles.exBenefit}>💡 উপকারিতা: {ex.benefitBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SAFE ID CARD & DOCTOR REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'SAFE_ID_DOCTOR' && (
              <>
                {/* Emergency Safe ID Badge Preview */}
                <View style={styles.safeIdCard}>
                  <View style={styles.safeIdTop}>
                    <MaterialIcons name="verified-user" size={22} color="#8B5CF6" />
                    <Text style={styles.safeIdTitle}>প্রবীণ সেফটি ও পকেট আইডি কার্ড</Text>
                  </View>

                  <View style={styles.idFieldRow}>
                    <Text style={styles.idFieldLabel}>নাম:</Text>
                    <TextInput
                      style={styles.idFieldInput}
                      value={safeId.elderName}
                      onChangeText={(val) => setSafeId((p) => ({ ...p, elderName: val }))}
                      placeholder="মা-বাবার নাম"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.idFieldRow}>
                    <Text style={styles.idFieldLabel}>জরুরি যোগাযোগ:</Text>
                    <TextInput
                      style={styles.idFieldInput}
                      value={safeId.emergencyPhone}
                      onChangeText={(val) => setSafeId((p) => ({ ...p, emergencyPhone: val }))}
                      placeholder="সন্তানের ফোন নম্বর"
                      keyboardType="phone-pad"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.idFieldRow}>
                    <Text style={styles.idFieldLabel}>বাসার ঠিকানা:</Text>
                    <TextInput
                      style={styles.idFieldInput}
                      value={safeId.addressBn}
                      onChangeText={(val) => setSafeId((p) => ({ ...p, addressBn: val }))}
                      placeholder="বাসার ঠিকানা"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                {/* Share Summary Buttons */}
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#8B5CF6',
  },
  introBox: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  introTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  introSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  stepCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberBadge: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  stepInstruction: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  wordsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  wordPill: {
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  wordPillText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#8B5CF6',
  },
  clockToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  clockToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clockToggleBtnActiveGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  clockToggleBtnActiveRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  clockToggleText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  recallButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  recallBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recallBtnActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  recallBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  recallBtnTextActive: {
    color: '#FFFFFF',
  },
  evalCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  evalTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  evalDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  obsIntroBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  obsIntroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#8B5CF6',
  },
  obsIntroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  obsItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  obsItemCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  obsTextWrap: {
    flex: 1,
    gap: 3,
  },
  obsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  obsCategoryTag: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#8B5CF6',
  },
  highConcernBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#EF4444',
  },
  obsTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  obsTitleActive: {
    color: '#8B5CF6',
  },
  obsDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  fitnessBanner: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  fitnessBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#8B5CF6',
  },
  fitnessBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
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
  exCardHeader: {
    flexDirection: 'row',
  },
  exTypeBadge: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exTitle: {
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
  exBenefit: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  safeIdCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 8,
  },
  safeIdTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  safeIdTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#8B5CF6',
  },
  idFieldRow: {
    gap: 2,
  },
  idFieldLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  idFieldInput: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurface,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#8B5CF6',
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
