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
  ANEMIA_SYMPTOMS_LIST,
  DEMOGRAPHIC_THRESHOLDS,
  IRON_FOODS_CATALOG,
} from '@/services/anemia-knowledge';
import {
  evaluateHemoglobin,
  formatHematologistAnemiaSummary,
} from '@/services/anemia-service';
import {
  DemographicGroup,
  HemoglobinEvaluation,
} from '@/types/anemia-hemoglobin-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'HB_METER' | 'IRON_DIET' | 'TIMING_GUARD' | 'SYMPTOMS_DOCTOR';

interface AnemiaHemoglobinShieldModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AnemiaHemoglobinShieldModal({
  visible,
  onClose,
}: AnemiaHemoglobinShieldModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('HB_METER');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Demographic Group & Hb Value
  const [selectedGroup, setSelectedGroup] = useState<DemographicGroup>('FEMALE_NON_PREGNANT');
  const [hbValue, setHbValue] = useState<number>(11.2);

  const evaluation: HemoglobinEvaluation = useMemo(() => {
    return evaluateHemoglobin(hbValue, selectedGroup);
  }, [hbValue, selectedGroup]);

  // Tab 4: Symptom Toggles
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({
    sym_fatigue: true,
    sym_palpitations: false,
  });

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleStepHb = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setHbValue((prev) => {
      const next = Math.max(3.0, Math.min(20.0, Number((prev + delta).toFixed(1))));
      return next;
    });
  };

  const toggleSymptom = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedSymptoms((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySummary = async () => {
    const activeList = ANEMIA_SYMPTOMS_LIST.filter((s) => selectedSymptoms[s.id]).map(
      (s) => s.nameBn
    );
    const text = formatHematologistAnemiaSummary(evaluation, activeList);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('হিমোগ্লোবিন ও অ্যানিমিয়া রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const activeList = ANEMIA_SYMPTOMS_LIST.filter((s) => selectedSymptoms[s.id]).map(
      (s) => s.nameBn
    );
    const text = formatHematologistAnemiaSummary(evaluation, activeList);
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
                <MaterialIcons name="bloodtype" size={26} color="#EF4444" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Anemia & Hemoglobin Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  রক্তস্বল্পতা ও হিমোগ্লোবিন বুস্টার
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
              onPress={() => setActiveTab('HB_METER')}
              style={[styles.tabBtn, activeTab === 'HB_METER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="speed"
                size={16}
                color={activeTab === 'HB_METER' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'HB_METER' && styles.tabBtnTextActive,
                ]}>
                🩸 Hb মিটার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('IRON_DIET')}
              style={[styles.tabBtn, activeTab === 'IRON_DIET' && styles.tabBtnActive]}>
              <MaterialIcons
                name="restaurant"
                size={16}
                color={activeTab === 'IRON_DIET' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'IRON_DIET' && styles.tabBtnTextActive,
                ]}>
                🌿 আয়রন ডায়েট
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('TIMING_GUARD')}
              style={[styles.tabBtn, activeTab === 'TIMING_GUARD' && styles.tabBtnActive]}>
              <MaterialIcons
                name="schedule"
                size={16}
                color={activeTab === 'TIMING_GUARD' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'TIMING_GUARD' && styles.tabBtnTextActive,
                ]}>
                ⏰ টাইমিং গার্ড
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SYMPTOMS_DOCTOR')}
              style={[styles.tabBtn, activeTab === 'SYMPTOMS_DOCTOR' && styles.tabBtnActive]}>
              <MaterialIcons
                name="healing"
                size={16}
                color={activeTab === 'SYMPTOMS_DOCTOR' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SYMPTOMS_DOCTOR' && styles.tabBtnTextActive,
                ]}>
                ⚡ উপসর্গ ও রিপোর্ট
              </Text>
            </TouchableOpacity>
          </View>

          {/* SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#EF4444" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: HEMOGLOBIN METER & SEVERITY EVALUATOR */}
            {/* ========================================================================= */}
            {activeTab === 'HB_METER' && (
              <>
                <View style={styles.groupChipsContainer}>
                  <Text style={styles.chipTitle}>ব্যক্তির ধরন নির্বাচন করুন:</Text>
                  <View style={styles.chipsRow}>
                    {DEMOGRAPHIC_THRESHOLDS.map((item) => {
                      const isSelected = selectedGroup === item.group;
                      return (
                        <TouchableOpacity
                          key={item.group}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setSelectedGroup(item.group);
                          }}
                          style={[
                            styles.groupChip,
                            isSelected && styles.groupChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.groupChipText,
                              isSelected && styles.groupChipTextActive,
                            ]}>
                            {item.labelBn}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Hb Value Stepper Card */}
                <View style={styles.meterCard}>
                  <Text style={styles.meterLabel}>সিরাম হিমোগ্লোবিনের মান (g/dL):</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      onPress={() => handleStepHb(-0.5)}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>- 0.5</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStepHb(-0.1)}
                      style={[styles.stepperBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                      <Text style={styles.stepperBtnText}>- 0.1</Text>
                    </TouchableOpacity>

                    <Text style={[styles.hbValueDisplay, { color: evaluation.severityColor }]}>
                      {hbValue.toFixed(1)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleStepHb(0.1)}
                      style={[styles.stepperBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                      <Text style={styles.stepperBtnText}>+ 0.1</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStepHb(0.5)}
                      style={styles.stepperBtn}>
                      <Text style={styles.stepperBtnText}>+ 0.5</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.normalRangeHint}>
                    WHO স্বাভাবিক রেঞ্জ: {evaluation.normalRangeBn}
                  </Text>
                </View>

                {/* Evaluation Result Card */}
                <View
                  style={[
                    styles.evalResultCard,
                    { borderColor: evaluation.severityColor, backgroundColor: `${evaluation.severityColor}12` },
                  ]}>
                  <View style={styles.evalTop}>
                    <Text style={[styles.evalSeverityTitle, { color: evaluation.severityColor }]}>
                      {evaluation.severityLabelBn}
                    </Text>
                    <Text style={styles.evalHbText}>Hb: {evaluation.hbValue} g/dL</Text>
                  </View>

                  <Text style={styles.evalAdvice}>{evaluation.clinicalAdviceBn}</Text>

                  {evaluation.isEmergencyTransfusionCandidate && (
                    <View style={styles.dangerAlertBox}>
                      <MaterialIcons name="warning" size={20} color="#FFFFFF" />
                      <Text style={styles.dangerAlertText}>
                        জরুরি সতর্কতা: হিমোগ্লোবিনের মাত্রা বিপজ্জনকভাবে নিচে নেমে গেছে। জরুরি রক্ত পরিসঞ্চালন (Blood Transfusion) বা আইভি আয়রনের জন্য দ্রুত হাসপাতালে যান!
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: DESHI IRON RICH FOODS & VITAMIN-C SYNERGY */}
            {/* ========================================================================= */}
            {activeTab === 'IRON_DIET' && (
              <>
                <View style={styles.dietBanner}>
                  <Text style={styles.dietBannerTitle}>
                    🌿 দেশি আয়রন ডায়েট ও ভিটামিন-সি কম্বিনেশন
                  </Text>
                  <Text style={styles.dietBannerSub}>
                    উদ্ভিজ্জ শাকসবজির আয়রন শরীরে সহজে শোষণ হতে সাথে লেবুর রস খাওয়া অত্যন্ত জরুরি:
                  </Text>
                </View>

                {IRON_FOODS_CATALOG.map((food) => (
                  <View key={food.id} style={styles.ironFoodCard}>
                    <View style={styles.foodCardHeader}>
                      <Text style={styles.foodCategoryLabel}>{food.categoryLabelBn}</Text>
                      {food.ironMgPer100g && (
                        <Text style={styles.ironContentText}>আয়রন: {food.ironMgPer100g}</Text>
                      )}
                    </View>
                    <Text style={styles.foodName}>{food.nameBn}</Text>
                    <Text style={styles.synergyTip}>💡 {food.synergyTipBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: IRON VS CALCIUM / TANNIN TIMING GUARD */}
            {/* ========================================================================= */}
            {activeTab === 'TIMING_GUARD' && (
              <>
                <View style={styles.timingCard}>
                  <MaterialIcons name="timer" size={32} color="#EF4444" />
                  <Text style={styles.timingTitle}>
                    ⏰ আয়রন ও ক্যালসিয়ামের ২ ঘণ্টার ব্যবধান রুল
                  </Text>
                  <Text style={styles.timingDesc}>
                    দুধের ক্যালসিয়াম এবং চা-কফির ট্যানিন আয়রনকে অদ্রবণীয় যৌগ বানিয়ে শরীরে শোষণ সম্পূর্ণ আটকে দেয়।
                  </Text>
                </View>

                <View style={styles.timelineBox}>
                  <View style={styles.timelineItem}>
                    <Text style={styles.timeTag}>সকাল ৮:০০</Text>
                    <Text style={styles.timeTitle}>🥛 নাশতায় দুধ / ডিম / চা</Text>
                    <Text style={styles.timeSub}>ক্যালসিয়াম ও ট্যানিন সমৃদ্ধ খাবার খাওয়া হলো।</Text>
                  </View>

                  <View style={styles.gapWarningBox}>
                    <MaterialIcons name="pause-circle-filled" size={16} color="#F59E0B" />
                    <Text style={styles.gapWarningText}>⚠️ ২ ঘণ্টা অপেক্ষা করুন (শোষণ ব্লক এড়াতে)</Text>
                  </View>

                  <View style={styles.timelineItem}>
                    <Text style={[styles.timeTag, { color: '#10B981' }]}>সকাল ১০:৩০</Text>
                    <Text style={[styles.timeTitle, { color: '#10B981' }]}>
                      🩸 আয়রন ট্যাবলেট + ১ গ্লাস লেবু পানি
                    </Text>
                    <Text style={styles.timeSub}>
                      খালি পেটে বা হালকা খাবারের পর লেবু পানি দিয়ে খেলে আয়রন দ্রুত রক্তে মিশে যাবে।
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SYMPTOMS CHECKLIST & DOCTOR REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'SYMPTOMS_DOCTOR' && (
              <>
                <Text style={styles.symptomsHeader}>
                  আপনার মধ্যে কোনো লক্ষণ দৃশ্যমান কিনা টিক দিন:
                </Text>

                {ANEMIA_SYMPTOMS_LIST.map((sym) => {
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
                        color={isChecked ? '#EF4444' : C.onSurfaceVariant}
                      />
                      <View style={styles.symptomTextWrap}>
                        <Text
                          style={[
                            styles.symptomName,
                            isChecked && styles.symptomNameActive,
                          ]}>
                          {sym.nameBn} {sym.isSevereRedFlag ? '🚨' : ''}
                        </Text>
                        <Text style={styles.symptomDesc}>{sym.descriptionBn}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EF4444',
  },
  groupChipsContainer: {
    gap: 6,
  },
  chipTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  chipsRow: {
    gap: 6,
  },
  groupChip: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  groupChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  groupChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  groupChipTextActive: {
    fontFamily: F.bold,
    color: '#EF4444',
  },
  meterCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  meterLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepperBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  hbValueDisplay: {
    fontFamily: F.bold,
    fontSize: 28,
    minWidth: 70,
    textAlign: 'center',
  },
  normalRangeHint: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  evalResultCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  evalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evalSeverityTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  evalHbText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  evalAdvice: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  dangerAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
  },
  dangerAlertText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 15,
  },
  dietBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  dietBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EF4444',
  },
  dietBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  ironFoodCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  foodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodCategoryLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
  },
  ironContentText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  foodName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  synergyTip: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  timingCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  timingTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  timingDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 15,
  },
  timelineBox: {
    gap: 8,
  },
  timelineItem: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 3,
  },
  timeTag: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#F59E0B',
  },
  timeTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  timeSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  gapWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  gapWarningText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#F59E0B',
  },
  symptomsHeader: {
    fontFamily: F.bold,
    fontSize: 12,
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  symptomTextWrap: {
    flex: 1,
    gap: 2,
  },
  symptomName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  symptomNameActive: {
    color: '#EF4444',
  },
  symptomDesc: {
    fontFamily: F.regular,
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
    backgroundColor: '#EF4444',
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
