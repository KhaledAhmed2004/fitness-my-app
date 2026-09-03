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
  ADAPTIVE_AIDS_CATALOG,
  HEARING_CHECKLIST_QUESTIONS,
  PARKINSONS_SYMPTOMS_LIST,
} from '@/services/hearing-tremor-knowledge';
import {
  evaluateHearingLoss,
  evaluateTremorAndParkinsons,
  formatNeurologistHearingReport,
} from '@/services/hearing-tremor-service';
import {
  HearingScreenerResult,
  TremorEvaluationResult,
  TremorGrade,
  TremorType,
} from '@/types/hearing-tremor-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'HEARING_SCREEN' | 'TREMOR_SCALE' | 'PARKINSONS_SIGNS' | 'AIDS_REPORT';

interface HearingTremorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HearingTremorModal({ visible, onClose }: HearingTremorModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('HEARING_SCREEN');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Hearing Screen Checked State
  const [hearingChecked, setHearingChecked] = useState<Record<string, boolean>>({
    h_tv_vol: true,
    h_noisy_crowd: true,
  });

  const hearingScore = useMemo(() => {
    return HEARING_CHECKLIST_QUESTIONS.reduce((acc, q) => {
      return acc + (hearingChecked[q.id] ? q.points : 0);
    }, 0);
  }, [hearingChecked]);

  const hearingResult: HearingScreenerResult = useMemo(() => {
    return evaluateHearingLoss(hearingScore);
  }, [hearingScore]);

  // Tab 2: Tremor State
  const [tremorType, setTremorType] = useState<TremorType>('REST_TREMOR');
  const [tremorGrade, setTremorGrade] = useState<TremorGrade>(2);

  // Tab 3: Parkinson Signs Checked State
  const [parkinsonChecked, setParkinsonChecked] = useState<Record<string, boolean>>({
    pk_pill_roll: true,
    pk_micrographia: true,
  });

  const activeParkinsonCount = useMemo(() => {
    return Object.values(parkinsonChecked).filter(Boolean).length;
  }, [parkinsonChecked]);

  const tremorResult: TremorEvaluationResult = useMemo(() => {
    return evaluateTremorAndParkinsons(tremorGrade, tremorType, activeParkinsonCount);
  }, [tremorGrade, tremorType, activeParkinsonCount]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const toggleHearingItem = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setHearingChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleParkinsonItem = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setParkinsonChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySummary = async () => {
    const activeParkList = PARKINSONS_SYMPTOMS_LIST.filter(
      (s) => parkinsonChecked[s.id]
    ).map((s) => s.nameBn);

    const text = formatNeurologistHearingReport(
      hearingResult,
      tremorResult,
      activeParkList
    );
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('শ্রবণ ও ট্রেমর রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const activeParkList = PARKINSONS_SYMPTOMS_LIST.filter(
      (s) => parkinsonChecked[s.id]
    ).map((s) => s.nameBn);

    const text = formatNeurologistHearingReport(
      hearingResult,
      tremorResult,
      activeParkList
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
                <MaterialIcons name="hearing" size={26} color="#EC4899" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Hearing & Tremor Guard
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  শ্রবণশক্তি ও পারকিনসন্স ট্রেমর ট্র্যাকার
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
              onPress={() => setActiveTab('HEARING_SCREEN')}
              style={[styles.tabBtn, activeTab === 'HEARING_SCREEN' && styles.tabBtnActive]}>
              <MaterialIcons
                name="hearing"
                size={16}
                color={activeTab === 'HEARING_SCREEN' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'HEARING_SCREEN' && styles.tabBtnTextActive,
                ]}>
                🦻 শ্রবণ স্ক্রিনার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('TREMOR_SCALE')}
              style={[styles.tabBtn, activeTab === 'TREMOR_SCALE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="pan-tool"
                size={16}
                color={activeTab === 'TREMOR_SCALE' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'TREMOR_SCALE' && styles.tabBtnTextActive,
                ]}>
                🖐️ হাত কাঁপা
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PARKINSONS_SIGNS')}
              style={[styles.tabBtn, activeTab === 'PARKINSONS_SIGNS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="directions-walk"
                size={16}
                color={activeTab === 'PARKINSONS_SIGNS' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PARKINSONS_SIGNS' && styles.tabBtnTextActive,
                ]}>
                🚶‍♂️ পারকিনসন্স
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('AIDS_REPORT')}
              style={[styles.tabBtn, activeTab === 'AIDS_REPORT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={activeTab === 'AIDS_REPORT' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'AIDS_REPORT' && styles.tabBtnTextActive,
                ]}>
                🥄 টুলস ও রিপোর্ট
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
            {/* TAB 1: HHIE-S HEARING LOSS SCREENER */}
            {/* ========================================================================= */}
            {activeTab === 'HEARING_SCREEN' && (
              <>
                <Text style={styles.sectionTitle}>
                  বয়সজনিত শ্রবণশক্তি যাচাই চেকলিস্ট (HHIE-S):
                </Text>

                {HEARING_CHECKLIST_QUESTIONS.map((q) => {
                  const isChecked = !!hearingChecked[q.id];
                  return (
                    <TouchableOpacity
                      key={q.id}
                      activeOpacity={0.8}
                      onPress={() => toggleHearingItem(q.id)}
                      style={[
                        styles.checkItemCard,
                        isChecked && styles.checkItemCardActive,
                      ]}>
                      <MaterialIcons
                        name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={isChecked ? '#EC4899' : C.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.checkItemText,
                          isChecked && styles.checkItemTextActive,
                        ]}>
                        {q.questionBn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Hearing Evaluation Card */}
                <View
                  style={[
                    styles.evalCard,
                    { borderColor: hearingResult.severityColor, backgroundColor: `${hearingResult.severityColor}12` },
                  ]}>
                  <View style={styles.evalTop}>
                    <Text style={[styles.evalTitle, { color: hearingResult.severityColor }]}>
                      {hearingResult.severityLabelBn}
                    </Text>
                    <Text style={styles.evalScore}>
                      স্কোর: {hearingResult.scoreOutOf10}/১০
                    </Text>
                  </View>
                  <Text style={styles.evalDesc}>{hearingResult.adviceBn}</Text>

                  {hearingResult.audiometryRecommended && (
                    <View style={styles.badgeHighlight}>
                      <MaterialIcons name="hearing" size={16} color="#EC4899" />
                      <Text style={styles.badgeHighlightText}>
                        ইএনটি ডাক্তার দেখিয়ে Pure Tone Audiometry (PTA) টেস্ট করা দরকার
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: TREMOR TYPE & CLINICAL SEVERITY GRADE */}
            {/* ========================================================================= */}
            {activeTab === 'TREMOR_SCALE' && (
              <>
                {/* Tremor Type Selector */}
                <View style={styles.typeSelectCard}>
                  <Text style={styles.cardSectionTitle}>হাতের কাঁপুনি কখন বেশি অনুভূত হয়?</Text>
                  <View style={styles.typeBtnsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setTremorType('REST_TREMOR');
                      }}
                      style={[
                        styles.typeBtn,
                        tremorType === 'REST_TREMOR' && styles.typeBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.typeBtnText,
                          tremorType === 'REST_TREMOR' && styles.typeBtnTextActive,
                        ]}>
                        বিশ্রামে / কোলে রাখলে (Rest) ⚠️
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setTremorType('ACTION_TREMOR');
                      }}
                      style={[
                        styles.typeBtn,
                        tremorType === 'ACTION_TREMOR' && styles.typeBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.typeBtnText,
                          tremorType === 'ACTION_TREMOR' && styles.typeBtnTextActive,
                        ]}>
                        চামচ/গ্লাস তুললে (Action)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tremor 4-Tier Clinical Grade */}
                <View style={styles.gradeCard}>
                  <Text style={styles.cardSectionTitle}>কাঁপুনি বা কম্পনের তীব্রতা গ্রেড (০–৩):</Text>
                  <View style={styles.gradeGrid}>
                    {([0, 1, 2, 3] as TremorGrade[]).map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setTremorGrade(g);
                        }}
                        style={[
                          styles.gradeBtn,
                          tremorGrade === g && styles.gradeBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.gradeBtnTitle,
                            tremorGrade === g && styles.gradeBtnTitleActive,
                          ]}>
                          গ্রেড {g}
                        </Text>
                        <Text
                          style={[
                            styles.gradeBtnSub,
                            tremorGrade === g && styles.gradeBtnSubActive,
                          ]}>
                          {g === 0 && 'কোনো কাঁপুনি নেই'}
                          {g === 1 && 'হালকা কম্পন'}
                          {g === 2 && 'খাবার উপচে পড়ে'}
                          {g === 3 && 'স্বাবলম্বীহীনতা'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Tremor Evaluation Result */}
                <View
                  style={[
                    styles.evalCard,
                    { borderColor: tremorResult.severityColor, backgroundColor: `${tremorResult.severityColor}12` },
                  ]}>
                  <Text style={[styles.evalTitle, { color: tremorResult.severityColor }]}>
                    {tremorResult.gradeLabelBn}
                  </Text>
                  <Text style={styles.evalDesc}>{tremorResult.adviceBn}</Text>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: PARKINSON'S MOTOR SIGNS CHECKLIST */}
            {/* ========================================================================= */}
            {activeTab === 'PARKINSONS_SIGNS' && (
              <>
                <Text style={styles.sectionTitle}>
                  মা-বাবার চলাফেরা ও আচরণে নিচের কোনো লক্ষণ আছে কিনা চিহ্নিত করুন:
                </Text>

                {PARKINSONS_SYMPTOMS_LIST.map((sym) => {
                  const isChecked = !!parkinsonChecked[sym.id];
                  return (
                    <TouchableOpacity
                      key={sym.id}
                      activeOpacity={0.8}
                      onPress={() => toggleParkinsonItem(sym.id)}
                      style={[
                        styles.checkItemCard,
                        isChecked && styles.checkItemCardActive,
                      ]}>
                      <MaterialIcons
                        name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={isChecked ? '#EC4899' : C.onSurfaceVariant}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.symTitleRow}>
                          <Text
                            style={[
                              styles.checkItemText,
                              isChecked && styles.checkItemTextActive,
                              { flex: 1 },
                            ]}>
                            {sym.nameBn}
                          </Text>
                          {sym.isCoreMotorSign && (
                            <Text style={styles.coreBadge}>মূল লক্ষণ</Text>
                          )}
                        </View>
                        <Text style={styles.symSubText}>{sym.descriptionBn}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: ADAPTIVE AIDS & DOCTOR SUMMARY */}
            {/* ========================================================================= */}
            {activeTab === 'AIDS_REPORT' && (
              <>
                <View style={styles.aidsBanner}>
                  <Text style={styles.aidsBannerTitle}>🥄 সহায়ক এডাপ্টিভ টুলস ও লাইফস্টাইল টিপস</Text>
                  <Text style={styles.aidsBannerSub}>
                    হাত কাঁপা ও কানে কম শোনা ব্যক্তিদের দৈনন্দিন স্বস্তি বাড়াতে কার্যকরী সমাধান:
                  </Text>
                </View>

                {ADAPTIVE_AIDS_CATALOG.map((aid) => (
                  <View key={aid.id} style={styles.aidCard}>
                    <Text style={styles.aidName}>{aid.nameBn}</Text>
                    <Text style={styles.aidBenefit}>💡 {aid.benefitBn}</Text>
                    <Text style={styles.aidTip}>🎯 ব্যবহার বিধি: {aid.tipBn}</Text>
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
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  checkItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  checkItemCardActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  checkItemText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  checkItemTextActive: {
    color: '#EC4899',
    fontFamily: F.bold,
  },
  symTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coreBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  symSubText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  evalCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  evalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evalTitle: {
    fontFamily: F.bold,
    fontSize: 12,
  },
  evalScore: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  evalDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  badgeHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeHighlightText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EC4899',
    flex: 1,
  },
  typeSelectCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  cardSectionTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  typeBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeBtnActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#EC4899',
  },
  typeBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  typeBtnTextActive: {
    fontFamily: F.bold,
    color: '#EC4899',
  },
  gradeCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  gradeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 2,
  },
  gradeBtnActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#EC4899',
  },
  gradeBtnTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  gradeBtnTitleActive: {
    color: '#EC4899',
  },
  gradeBtnSub: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  gradeBtnSubActive: {
    color: C.onSurface,
    fontFamily: F.medium,
  },
  aidsBanner: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  aidsBannerTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EC4899',
  },
  aidsBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  aidCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  aidName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  aidBenefit: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  aidTip: {
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
