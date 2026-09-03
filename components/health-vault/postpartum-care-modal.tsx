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
  EPDS_QUESTIONS_LIST,
  KRAMER_JAUNDICE_ZONES,
  POSTPARTUM_DIET_CATALOG,
} from '@/services/postpartum-knowledge';
import {
  evaluateEpdsScore,
  evaluateKramerJaundice,
  evaluateNewbornHydration,
  formatPostpartumPediatricSummary,
} from '@/services/postpartum-service';
import {
  EpdsEvaluation,
  JaundiceZoneLevel,
  KramerJaundiceZone,
} from '@/types/postpartum-newborn-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'JAUNDICE' | 'DIAPER_FEEDING' | 'LACTATION_DIET' | 'EPDS_DOCTOR';

interface PostpartumCareModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PostpartumCareModal({ visible, onClose }: PostpartumCareModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('JAUNDICE');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Kramer Jaundice Zone
  const [selectedZoneNum, setSelectedZoneNum] = useState<JaundiceZoneLevel>(1);
  const selectedZoneDef: KramerJaundiceZone = useMemo(() => {
    return evaluateKramerJaundice(selectedZoneNum);
  }, [selectedZoneNum]);

  // Tab 2: Diaper & Feeding Counter
  const [feedingsCount, setFeedingsCount] = useState<number>(8);
  const [wetDiapersCount, setWetDiapersCount] = useState<number>(6);

  const hydrationEval = useMemo(() => {
    return evaluateNewbornHydration(wetDiapersCount);
  }, [wetDiapersCount]);

  // Tab 4: EPDS 5-Question Answers
  const [epdsAnswers, setEpdsAnswers] = useState<number[]>([0, 1, 1, 0, 1]);

  const epdsEval: EpdsEvaluation = useMemo(() => {
    return evaluateEpdsScore(epdsAnswers);
  }, [epdsAnswers]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleSelectZone = (zone: JaundiceZoneLevel) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedZoneNum(zone);
  };

  const handleIncrementFeed = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFeedingsCount((prev) => prev + 1);
    showToast('+১ ফিডিং যোগ করা হয়েছে 🍼');
  };

  const handleIncrementDiaper = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setWetDiapersCount((prev) => prev + 1);
    showToast('+১ ভেজা ডায়াপার লগ হয়েছে 🧷');
  };

  const handleAnswerEpds = (qIndex: number, score: number) => {
    void Haptics.selectionAsync().catch(() => {});
    setEpdsAnswers((prev) => {
      const updated = [...prev];
      updated[qIndex] = score;
      return updated;
    });
  };

  const handleCopySummary = async () => {
    const text = formatPostpartumPediatricSummary(
      selectedZoneDef,
      wetDiapersCount,
      feedingsCount,
      epdsEval
    );
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('পোস্টপার্টাম ও নবজাতক রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatPostpartumPediatricSummary(
      selectedZoneDef,
      wetDiapersCount,
      feedingsCount,
      epdsEval
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
                <MaterialIcons name="child-care" size={26} color="#EC4899" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Postpartum & Newborn Care
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  প্রসবোত্তর মায়ের যত্ন ও নবজাতক বিকাশ ট্র্যাকার
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
              onPress={() => setActiveTab('JAUNDICE')}
              style={[styles.tabBtn, activeTab === 'JAUNDICE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="wb-sunny"
                size={16}
                color={activeTab === 'JAUNDICE' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'JAUNDICE' && styles.tabBtnTextActive,
                ]}>
                🟡 জন্ডিস
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DIAPER_FEEDING')}
              style={[styles.tabBtn, activeTab === 'DIAPER_FEEDING' && styles.tabBtnActive]}>
              <MaterialIcons
                name="water-drop"
                size={16}
                color={activeTab === 'DIAPER_FEEDING' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DIAPER_FEEDING' && styles.tabBtnTextActive,
                ]}>
                🧷 ডায়াপার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('LACTATION_DIET')}
              style={[styles.tabBtn, activeTab === 'LACTATION_DIET' && styles.tabBtnActive]}>
              <MaterialIcons
                name="restaurant-menu"
                size={16}
                color={activeTab === 'LACTATION_DIET' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'LACTATION_DIET' && styles.tabBtnTextActive,
                ]}>
                🥣 মায়ের পুষ্টি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('EPDS_DOCTOR')}
              style={[styles.tabBtn, activeTab === 'EPDS_DOCTOR' && styles.tabBtnActive]}>
              <MaterialIcons
                name="psychology"
                size={16}
                color={activeTab === 'EPDS_DOCTOR' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'EPDS_DOCTOR' && styles.tabBtnTextActive,
                ]}>
                🌸 মানসিক যত্ন
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#EC4899" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: KRAMER 5-ZONE NEONATAL JAUNDICE SCREENER */}
            {/* ========================================================================= */}
            {activeTab === 'JAUNDICE' && (
              <>
                <View style={styles.bannerBox}>
                  <Text style={styles.bannerTitle}>
                    ক্রেমার ৫-স্তরের নবজাতক জন্ডিস মূল্যায়ন (Kramer's Rule)
                  </Text>
                  <Text style={styles.bannerSub}>
                    বাচ্চার শরীরের কোন স্থান পর্যন্ত হলুদ রঙ দেখা যাচ্ছে তা নির্বাচন করুন:
                  </Text>
                </View>

                {/* 5-Zone Buttons */}
                <View style={styles.zonesContainer}>
                  {KRAMER_JAUNDICE_ZONES.map((z) => {
                    const isSelected = selectedZoneNum === z.zoneNumber;
                    return (
                      <TouchableOpacity
                        key={z.zoneNumber}
                        activeOpacity={0.8}
                        onPress={() => handleSelectZone(z.zoneNumber)}
                        style={[
                          styles.zoneBtn,
                          isSelected && { borderColor: z.severityColor, backgroundColor: `${z.severityColor}15` },
                        ]}>
                        <View style={styles.zoneBtnTop}>
                          <Text
                            style={[
                              styles.zoneBtnNumber,
                              isSelected && { color: z.severityColor },
                            ]}>
                            জোন {z.zoneNumber}
                          </Text>
                          <Text
                            style={[
                              styles.zoneBtnBilirubin,
                              isSelected && { color: z.severityColor },
                            ]}>
                            ~{z.estimatedBilirubinMgDl}
                          </Text>
                        </View>
                        <Text style={styles.zoneBtnBodyArea}>{z.bodyAreaBn}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selected Zone Clinical Explanation */}
                <View
                  style={[
                    styles.zoneEvalCard,
                    { borderColor: selectedZoneDef.severityColor, backgroundColor: `${selectedZoneDef.severityColor}10` },
                  ]}>
                  <View style={styles.zoneEvalTop}>
                    <Text style={[styles.zoneEvalTitle, { color: selectedZoneDef.severityColor }]}>
                      {selectedZoneDef.severityLabelBn}
                    </Text>
                    <Text style={styles.zoneEvalBilirubin}>
                      আনুমানিক বিলিরুবিন: {selectedZoneDef.estimatedBilirubinMgDl}
                    </Text>
                  </View>

                  <Text style={styles.zoneEvalDesc}>
                    {selectedZoneDef.clinicalExplanationBn}
                  </Text>

                  <View style={styles.zoneAdviceBox}>
                    <MaterialIcons name="medical-services" size={18} color="#EC4899" />
                    <Text style={styles.zoneAdviceText}>
                      {selectedZoneDef.actionAdviceBn}
                    </Text>
                  </View>

                  {selectedZoneDef.isEmergencyRedFlag && (
                    <View style={styles.redAlertBox}>
                      <MaterialIcons name="warning" size={20} color="#FFFFFF" />
                      <Text style={styles.redAlertText}>
                        জরুরি সতর্কতা: হাতের তালু ও পায়ের তলা হলুদ হলে মস্তিষ্কের ক্ষতির আশঙ্কা থাকে। অবিলম্বে হাসপাতালে নিন!
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: FEEDING & 6+ WET DIAPERS TRACKER */}
            {/* ========================================================================= */}
            {activeTab === 'DIAPER_FEEDING' && (
              <>
                <View
                  style={[
                    styles.hydrationBanner,
                    { borderColor: hydrationEval.color, backgroundColor: `${hydrationEval.color}15` },
                  ]}>
                  <Text style={[styles.hydrationBannerTitle, { color: hydrationEval.color }]}>
                    {hydrationEval.messageBn}
                  </Text>
                  <Text style={styles.hydrationBannerSub}>
                    ডাক্তারি গোল্ডেন রুল: বাচ্চা পর্যাপ্ত বুকের দুধ পেলে ২৪ ঘণ্টায় কমপক্ষে ৬ বার ভারী ভেজা ডায়াপার হবে।
                  </Text>
                </View>

                {/* Counters Row */}
                <View style={styles.countersRow}>
                  {/* Feeding Counter */}
                  <View style={styles.counterCard}>
                    <MaterialIcons name="child-friendly" size={28} color="#EC4899" />
                    <Text style={styles.counterTitle}>২৪ ঘণ্টায় দুধ পান</Text>
                    <Text style={styles.counterVal}>{feedingsCount} বার</Text>
                    <Text style={styles.counterTarget}>টার্গেট: ৮-১২ বার</Text>
                    <TouchableOpacity
                      onPress={handleIncrementFeed}
                      style={styles.incrementBtn}>
                      <Text style={styles.incrementBtnText}>+১ ফিডিং</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Diaper Counter */}
                  <View style={styles.counterCard}>
                    <MaterialIcons name="water-drop" size={28} color="#0284C7" />
                    <Text style={styles.counterTitle}>২৪ ঘণ্টায় ভেজা ডায়াপার</Text>
                    <Text style={[styles.counterVal, { color: '#0284C7' }]}>
                      {wetDiapersCount} বার
                    </Text>
                    <Text style={styles.counterTarget}>টার্গেট: ৬+ বার</Text>
                    <TouchableOpacity
                      onPress={handleIncrementDiaper}
                      style={[styles.incrementBtn, { backgroundColor: '#0284C7' }]}>
                      <Text style={styles.incrementBtnText}>+১ ডায়াপার</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: MATERNAL LACTATION & WOUND HEALING DIET */}
            {/* ========================================================================= */}
            {activeTab === 'LACTATION_DIET' && (
              <>
                <View style={styles.dietHero}>
                  <Text style={styles.dietHeroTitle}>
                    মায়ের প্রসবোত্তর পুষ্টি ও ল্যাকটেশন খাদ্যতালিকা
                  </Text>
                  <Text style={styles.dietHeroSub}>
                    বুকের দুধ বৃদ্ধি ও সিজারিয়ান/নরমাল ডেলিভারির ক্ষত দ্রুত শুকানোর দেশি খাবার:
                  </Text>
                </View>

                {POSTPARTUM_DIET_CATALOG.map((item) => (
                  <View key={item.id} style={styles.postpartumFoodCard}>
                    <View style={styles.foodCardTop}>
                      <Text style={styles.foodCategory}>{item.categoryLabelBn}</Text>
                      <Text style={styles.foodName}>{item.nameBn}</Text>
                    </View>
                    <Text style={styles.foodBenefit}>💡 {item.scientificBenefitBn}</Text>
                    <Text style={styles.foodPrep}>🍳 যেভাবে তৈরি করবেন: {item.howToPrepareBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: EPDS POSTPARTUM MENTAL HEALTH & DOCTOR REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'EPDS_DOCTOR' && (
              <>
                <View
                  style={[
                    styles.epdsBanner,
                    { borderColor: epdsEval.riskColor, backgroundColor: `${epdsEval.riskColor}15` },
                  ]}>
                  <Text style={[styles.epdsBannerTitle, { color: epdsEval.riskColor }]}>
                    {epdsEval.riskLevelBn} (স্কোর: {epdsEval.totalScore}/১৫)
                  </Text>
                  <Text style={styles.epdsBannerSub}>{epdsEval.actionAdviceBn}</Text>
                </View>

                <Text style={styles.sectionHeaderTitle}>
                  এডিনবার্গ প্রসবোত্তর মানসিক স্বাস্থ্য স্ক্রিনিং (EPDS):
                </Text>

                {EPDS_QUESTIONS_LIST.map((q, qIdx) => (
                  <View key={q.id} style={styles.epdsQuestionCard}>
                    <Text style={styles.questionText}>
                      {qIdx + 1}. {q.questionBn}
                    </Text>
                    <View style={styles.optionsWrap}>
                      {q.options.map((opt) => {
                        const isSelected = epdsAnswers[qIdx] === opt.score;
                        return (
                          <TouchableOpacity
                            key={opt.score}
                            onPress={() => handleAnswerEpds(qIdx, opt.score)}
                            style={[
                              styles.epdsOptionBtn,
                              isSelected && styles.epdsOptionBtnActive,
                            ]}>
                            <MaterialIcons
                              name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                              size={16}
                              color={isSelected ? '#EC4899' : C.onSurfaceVariant}
                            />
                            <Text
                              style={[
                                styles.epdsOptionText,
                                isSelected && styles.epdsOptionTextActive,
                              ]}>
                              {opt.textBn}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                <View style={styles.shareActionRow}>
                  <TouchableOpacity onPress={handleCopySummary} style={styles.copySummaryBtn}>
                    <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.copySummaryBtnText}>ডাক্তার সামারি কপি</Text>
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
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
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
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#EC4899',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#EC4899',
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
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EC4899',
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
  zonesContainer: {
    gap: 8,
  },
  zoneBtn: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  zoneBtnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneBtnNumber: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  zoneBtnBilirubin: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  zoneBtnBodyArea: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  zoneEvalCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  zoneEvalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneEvalTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  zoneEvalBilirubin: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  zoneEvalDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  zoneAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    padding: 10,
    borderRadius: 10,
  },
  zoneAdviceText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#EC4899',
    flex: 1,
    lineHeight: 15,
  },
  redAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
  },
  redAlertText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 15,
  },
  hydrationBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  hydrationBannerTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  hydrationBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  counterCard: {
    flex: 1,
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  counterTitle: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  counterVal: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#EC4899',
  },
  counterTarget: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  incrementBtn: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  incrementBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  dietHero: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  dietHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EC4899',
  },
  dietHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  postpartumFoodCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  foodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodCategory: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EC4899',
  },
  foodName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  foodBenefit: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  foodPrep: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  epdsBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  epdsBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  epdsBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  epdsQuestionCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  questionText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  optionsWrap: {
    gap: 6,
  },
  epdsOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  epdsOptionBtnActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  epdsOptionText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  epdsOptionTextActive: {
    fontFamily: F.bold,
    color: '#EC4899',
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
    backgroundColor: '#EC4899',
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
