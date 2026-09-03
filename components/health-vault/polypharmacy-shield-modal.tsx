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
  BEERS_CRITERIA_LIST,
  RENAL_SAFE_DOSE_GUIDELINES,
} from '@/services/polypharmacy-knowledge';
import {
  evaluatePolypharmacyRisk,
  formatDeprescribingDoctorReport,
} from '@/services/polypharmacy-service';
import { PolypharmacyEvaluationResult } from '@/types/polypharmacy-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'PILL_BURDEN' | 'BEERS_CRITERIA' | 'RENAL_SAFETY' | 'DEPRESCRIBING_REPORT';

interface PolypharmacyShieldModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PolypharmacyShieldModal({ visible, onClose }: PolypharmacyShieldModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('PILL_BURDEN');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Pill Burden State
  const [patientAge, setPatientAge] = useState<number>(68);
  const [totalPillCount, setTotalPillCount] = useState<number>(8);

  // Tab 2: Beers Criteria Selected Drugs
  const [selectedBeersDrugs, setSelectedBeersDrugs] = useState<Record<string, boolean>>({
    beers_nsaids: true,
    beers_benzos: true,
  });

  const activeBeersIds = useMemo(() => {
    return Object.keys(selectedBeersDrugs).filter((k) => selectedBeersDrugs[k]);
  }, [selectedBeersDrugs]);

  const evaluation: PolypharmacyEvaluationResult = useMemo(() => {
    return evaluatePolypharmacyRisk(totalPillCount, activeBeersIds);
  }, [totalPillCount, activeBeersIds]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleStepPills = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTotalPillCount((p) => Math.max(1, Math.min(25, p + delta)));
  };

  const handleStepAge = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPatientAge((p) => Math.max(40, Math.min(100, p + delta)));
  };

  const toggleBeersDrug = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedBeersDrugs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySummary = async () => {
    const activeDrugNames: string[] = [];
    BEERS_CRITERIA_LIST.forEach((b) => {
      if (selectedBeersDrugs[b.id]) {
        activeDrugNames.push(`${b.drugClassBn} (${b.genericExamplesBn.join(', ')})`);
      }
    });

    const text = formatDeprescribingDoctorReport(
      evaluation,
      patientAge,
      activeDrugNames
    );
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('পলিফার্মাসি ও ড্রাগ রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const activeDrugNames: string[] = [];
    BEERS_CRITERIA_LIST.forEach((b) => {
      if (selectedBeersDrugs[b.id]) {
        activeDrugNames.push(`${b.drugClassBn} (${b.genericExamplesBn.join(', ')})`);
      }
    });

    const text = formatDeprescribingDoctorReport(
      evaluation,
      patientAge,
      activeDrugNames
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
                <MaterialIcons name="medication" size={26} color="#F97316" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Elderly Polypharmacy Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ওষুধের ওভারল্যাপ ও Beers Criteria গার্ড
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
              onPress={() => setActiveTab('PILL_BURDEN')}
              style={[styles.tabBtn, activeTab === 'PILL_BURDEN' && styles.tabBtnActive]}>
              <MaterialIcons
                name="calculate"
                size={16}
                color={activeTab === 'PILL_BURDEN' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PILL_BURDEN' && styles.tabBtnTextActive,
                ]}>
                📊 পিল বার্ডেন
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('BEERS_CRITERIA')}
              style={[styles.tabBtn, activeTab === 'BEERS_CRITERIA' && styles.tabBtnActive]}>
              <MaterialIcons
                name="warning"
                size={16}
                color={activeTab === 'BEERS_CRITERIA' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'BEERS_CRITERIA' && styles.tabBtnTextActive,
                ]}>
                🛑 Beers তালিকা
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('RENAL_SAFETY')}
              style={[styles.tabBtn, activeTab === 'RENAL_SAFETY' && styles.tabBtnActive]}>
              <MaterialIcons
                name="healing"
                size={16}
                color={activeTab === 'RENAL_SAFETY' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'RENAL_SAFETY' && styles.tabBtnTextActive,
                ]}>
                🩺 কিডনি প্রটেকশন
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DEPRESCRIBING_REPORT')}
              style={[styles.tabBtn, activeTab === 'DEPRESCRIBING_REPORT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={activeTab === 'DEPRESCRIBING_REPORT' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DEPRESCRIBING_REPORT' && styles.tabBtnTextActive,
                ]}>
                📋 ডাক্তার রিপোর্ট
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#F97316" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: PILL BURDEN CALCULATOR */}
            {/* ========================================================================= */}
            {activeTab === 'PILL_BURDEN' && (
              <>
                <View style={styles.paramsCard}>
                  <Text style={styles.cardSectionTitle}>রোগীর তথ্য ও দৈনিক মোট ওষুধের সংখ্যা:</Text>

                  {/* Age & Pill Count Steppers */}
                  <View style={styles.stepperRow}>
                    <View style={styles.stepperBox}>
                      <Text style={styles.stepperLabel}>বয়স: {patientAge} বছর</Text>
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
                      <Text style={styles.stepperLabel}>মোট ওষুধ: {totalPillCount} টি/দিন</Text>
                      <View style={styles.stepperBtnsWrap}>
                        <TouchableOpacity onPress={() => handleStepPills(-1)} style={styles.stepBtn}>
                          <Text style={styles.stepBtnText}>-১</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleStepPills(1)} style={styles.stepBtn}>
                          <Text style={styles.stepBtnText}>+১</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Polypharmacy Evaluation Card */}
                <View
                  style={[
                    styles.evalCard,
                    { borderColor: evaluation.levelColor, backgroundColor: `${evaluation.levelColor}12` },
                  ]}>
                  <View style={styles.evalTop}>
                    <Text style={[styles.evalTitle, { color: evaluation.levelColor }]}>
                      {evaluation.levelLabelBn}
                    </Text>
                    <Text style={styles.evalCount}>
                      {evaluation.totalPillCount} টি বড়ি/দিন
                    </Text>
                  </View>
                  <Text style={styles.evalDesc}>{evaluation.deprescribingAdviceBn}</Text>

                  {evaluation.polypharmacyLevel !== 'NORMAL_LOAD' && (
                    <View style={styles.badgeHighlight}>
                      <MaterialIcons name="medical-services" size={16} color="#F97316" />
                      <Text style={styles.badgeHighlightText}>
                        ডাক্তারের পরামর্শে অপ্রয়োজনীয় ওষুধ ডি-প্রেসক্রাইবিং (Deprescribing) করা উচিত
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: AGS BEERS CRITERIA PIM SCREENER */}
            {/* ========================================================================= */}
            {activeTab === 'BEERS_CRITERIA' && (
              <>
                <Text style={styles.sectionTitle}>
                  প্রবীণদের জন্য ঝুঁকিপূর্ণ ওষুধ নিয়মিত খাচ্ছেন কিনা নির্বাচন করুন:
                </Text>

                {BEERS_CRITERIA_LIST.map((item) => {
                  const isChecked = !!selectedBeersDrugs[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => toggleBeersDrug(item.id)}
                      style={[
                        styles.beersCard,
                        isChecked && styles.beersCardActive,
                      ]}>
                      <View style={styles.beersHeader}>
                        <MaterialIcons
                          name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                          size={20}
                          color={isChecked ? '#F97316' : C.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.beersDrugTitle,
                            isChecked && styles.beersDrugTitleActive,
                            { flex: 1 },
                          ]}>
                          {item.drugClassBn}
                        </Text>
                        <Text
                          style={[
                            styles.severityBadge,
                            item.severity === 'CRITICAL' && styles.severityBadgeCrit,
                          ]}>
                          {item.severity === 'CRITICAL' ? '🚨 অত্যন্ত ঝুঁকিপূর্ণ' : '⚠️ এড়িয়ে চলুন'}
                        </Text>
                      </View>

                      <Text style={styles.genericText}>
                        💊 সাধারণ জেনেরিক: {item.genericExamplesBn.join(', ')}
                      </Text>
                      <Text style={styles.riskText}>⚠️ পার্শ্বপ্রতিক্রিয়া: {item.adverseRiskBn}</Text>
                      <Text style={styles.altText}>✅ নিরাপদ বিকল্প: {item.saferAlternativeBn}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: RENAL & HEPATIC SAFE DOSING */}
            {/* ========================================================================= */}
            {activeTab === 'RENAL_SAFETY' && (
              <>
                <View style={styles.renalBanner}>
                  <Text style={styles.renalBannerTitle}>🩺 কিডনি (eGFR) ও লিভার সেফ ডোজ গাইডলাইন</Text>
                  <Text style={styles.renalBannerSub}>
                    বয়স বাড়লে কিডনির ছাঁকন ক্ষমতা কমে যাওয়ায় ওষুধের স্বাভাবিক ডোজও বিষক্রিয়া ঘটাতে পারে:
                  </Text>
                </View>

                {RENAL_SAFE_DOSE_GUIDELINES.map((g) => (
                  <View key={g.id} style={styles.renalCard}>
                    <Text style={styles.renalDrugName}>{g.drugNameBn}</Text>
                    <Text style={styles.renalThreshold}>⚠️ {g.eGfrThresholdBn}</Text>
                    <Text style={styles.renalRisk}>💥 ঝুঁকি: {g.riskBn}</Text>
                    <Text style={styles.renalAdjustment}>🎯 নিরাপদ সমন্বয়: {g.safeAdjustmentBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: DEPRESCRIBING & DOCTOR REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'DEPRESCRIBING_REPORT' && (
              <>
                <View style={styles.reportSummaryCard}>
                  <Text style={styles.repTitle}>💊 ডি-প্রেসক্রাইবিং অডিট সামারি</Text>
                  <Text style={styles.repSub}>
                    মোট ওষুধ: {evaluation.totalPillCount} টি/দিন • Beers ঝুঁকি চিহ্নিত: {evaluation.identifiedRisks.length} টি
                  </Text>
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#F97316',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#F97316',
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F97316',
  },
  paramsCard: {
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
  stepperRow: {
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
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
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
  evalCount: {
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
  badgeHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeHighlightText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#F97316',
    flex: 1,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  beersCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  beersCardActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  beersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  beersDrugTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  beersDrugTitleActive: {
    color: '#F97316',
  },
  severityBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityBadgeCrit: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  genericText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  riskText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#EF4444',
    lineHeight: 14,
  },
  altText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#10B981',
    lineHeight: 14,
  },
  renalBanner: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  renalBannerTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F97316',
  },
  renalBannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  renalCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  renalDrugName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  renalThreshold: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
  },
  renalRisk: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  renalAdjustment: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#10B981',
    lineHeight: 14,
  },
  reportSummaryCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  repTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F97316',
  },
  repSub: {
    fontFamily: F.regular,
    fontSize: 11,
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
    backgroundColor: '#F97316',
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
