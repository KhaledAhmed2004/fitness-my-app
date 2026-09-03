import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import {
  computeMultiOrganHealthReport,
  generateGeminiOrganSynthesis,
} from '@/services/organ-health-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import {
  MultiOrganHealthReport,
  OrganHealthStatus,
  OrganScorecard,
} from '@/types/organ-health';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface OrganHealthScorecardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function OrganHealthScorecardModal({
  visible,
  onClose,
}: OrganHealthScorecardModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const labResults = useHealthVaultStore((s) => s.labResults);
  const addLabResult = useHealthVaultStore((s) => s.addLabResult);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const isBn = currentLanguage === 'bn';

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'AI_REPORT' | 'QUICK_LOG'>('DASHBOARD');

  // Quick Log Biomarker State
  const [logAnalyteCode, setLogAnalyteCode] = useState('CREATININE');
  const [logValue, setLogValue] = useState('');
  const [logTestDate, setLogTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [logSource, setLogSource] = useState('Square Hospital Lab');

  // AI Synthesis State
  const [aiSynthesisText, setAiSynthesisText] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const targetMember = members.find((m) => m.id === activeMemberId) || members[0];
  const targetMemberName = targetMember?.name || 'Khaled';

  // Filter lab results for active member
  const memberLabResults = useMemo(() => {
    return labResults.filter((r) => r.memberId === activeMemberId);
  }, [labResults, activeMemberId]);

  // Compute Full Multi-Organ Report
  const organReport: MultiOrganHealthReport = useMemo(() => {
    return computeMultiOrganHealthReport(memberLabResults, targetMemberName, activeMemberId);
  }, [memberLabResults, targetMemberName, activeMemberId]);

  useEffect(() => {
    if (visible && !aiSynthesisText) {
      void runGeminiOrganSynthesis();
    }
  }, [visible, organReport, currentLanguage]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const runGeminiOrganSynthesis = async () => {
    setIsAiLoading(true);
    try {
      const text = await generateGeminiOrganSynthesis(organReport, currentLanguage);
      setAiSynthesisText(text);
    } catch (err) {
      console.warn('AI Organ Synthesis error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveQuickBiomarker = async () => {
    const num = parseFloat(logValue);
    if (isNaN(num)) {
      Alert.alert('Invalid Value', 'Please enter a numeric test reading.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    let testName = 'Serum Creatinine';
    let unit = 'mg/dL';
    let min: number | undefined = 0.7;
    let max: number | undefined = 1.3;

    if (logAnalyteCode === 'HBA1C') {
      testName = 'HbA1c Glycated Hemoglobin';
      unit = '%';
      min = 4.0;
      max = 5.6;
    } else if (logAnalyteCode === 'SGPT_ALT') {
      testName = 'SGPT / ALT (Liver Function)';
      unit = 'U/L';
      min = undefined;
      max = 45;
    } else if (logAnalyteCode === 'CHOLESTEROL_TOTAL') {
      testName = 'Total Cholesterol';
      unit = 'mg/dL';
      min = undefined;
      max = 200;
    } else if (logAnalyteCode === 'HEMOGLOBIN') {
      testName = 'Hemoglobin (Hb)';
      unit = 'g/dL';
      min = 13.0;
      max = 17.0;
    } else if (logAnalyteCode === 'TSH') {
      testName = 'TSH (Thyroid)';
      unit = 'uIU/mL';
      min = 0.4;
      max = 4.5;
    }

    await addLabResult({
      memberId: activeMemberId,
      testName,
      analyteCode: logAnalyteCode,
      analyteName: testName,
      valueType: 'NUMERIC',
      numericValue: num,
      unit,
      referenceRange: { min, max },
      referenceSource: logSource,
      testDate: logTestDate,
      notes: `Quick logged from Organ Health Scorecard`,
    });

    setLogValue('');
    showToast(`✅ ${testName} recorded! Organ score updated.`);
    void runGeminiOrganSynthesis();
  };

  const handleShareOrganReport = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    let text = `
🫀 MULTI-ORGAN HEALTH SCORECARD & VITALITY REPORT
==================================================
Patient: ${targetMemberName}
Generated: ${new Date().toLocaleDateString()}
Overall Biological Vitality Index: ${organReport.overallVitalityIndex}% (${organReport.overallStatus})

ORGAN SYSTEM BREAKDOWN:
`;

    organReport.organCards.forEach((c, idx) => {
      text += `\n${idx + 1}. ${c.title} [Score: ${c.score}% - ${c.status}]\n• Biomarkers: ${c.primaryBiomarkers
        .map((b) => `${b.shortName}: ${b.latestValue} ${b.unit}`)
        .join(', ')}\n• Summary: ${c.clinicalSummary}\n`;
    });

    if (aiSynthesisText) {
      text += `\n🧠 CLINICAL GENOMIC & PATHOLOGY SYNTHESIS:\n${aiSynthesisText}\n`;
    }

    text += '\n(TrackMe Multi-Organ Health OS)';

    await Clipboard.setStringAsync(text.trim());
    showToast('📋 Organ Scorecard Copied to Clipboard!');

    Alert.alert('Share with Doctor', 'Scorecard copied! Share via WhatsApp?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'Open WhatsApp',
        onPress: () => {
          void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text.trim())}`).catch(() => {
            void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text.trim())}`).catch(() => {});
          });
        },
      },
    ]);
  };

  const getStatusBadgeColor = (status: OrganHealthStatus) => {
    if (status === 'OPTIMAL') return '#20C997';
    if (status === 'FAIR') return '#FCC419';
    if (status === 'NEEDS_ATTENTION') return '#FF6B6B';
    return '#8899A6';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="favorite" size={22} color="#FF6B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {isBn ? 'অর্গান হেলথ স্কোরকার্ড' : 'Organ Health Scorecard'}
                </Text>
                <Text style={styles.subtitle}>
                  {isBn
                    ? 'কিডনি, লিভার, হার্ট, মেটাবলিক ও ব্লাড ভাইটালিটি'
                    : 'Kidney, Liver, Heart, Metabolic, Blood & Thyroid Vitality'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          {feedbackToast && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{feedbackToast}</Text>
            </View>
          )}

          {/* FAMILY MEMBER SELECTOR */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              {members.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveMemberId(m.id);
                      setAiSynthesisText(null);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: '#FF6B6B',
                        borderColor: '#FF6B6B',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#101416', fontFamily: F.bold },
                      ]}>
                      👤 {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUB-TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('DASHBOARD');
              }}
              style={[styles.tabBtn, activeTab === 'DASHBOARD' && styles.tabBtnActive]}>
              <MaterialIcons
                name="dashboard"
                size={16}
                color={activeTab === 'DASHBOARD' ? '#FF6B6B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DASHBOARD' && styles.tabBtnTextActive,
                ]}>
                {isBn ? 'অর্গান স্কোর' : 'Organ Dashboard'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('AI_REPORT');
              }}
              style={[styles.tabBtn, activeTab === 'AI_REPORT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="psychology"
                size={16}
                color={activeTab === 'AI_REPORT' ? '#FF6B6B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'AI_REPORT' && styles.tabBtnTextActive,
                ]}>
                {isBn ? 'এআই রিপোর্ট' : 'AI Clinical Report'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('QUICK_LOG');
              }}
              style={[styles.tabBtn, activeTab === 'QUICK_LOG' && styles.tabBtnActive]}>
              <MaterialIcons
                name="add-circle-outline"
                size={16}
                color={activeTab === 'QUICK_LOG' ? '#FF6B6B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'QUICK_LOG' && styles.tabBtnTextActive,
                ]}>
                {isBn ? '+ টেস্ট ইনপুট' : '+ Log Reading'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLLABLE BODY */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {activeTab === 'DASHBOARD' && (
              /* ================= TAB 1: ORGAN DASHBOARD ================= */
              <View style={styles.sectionWrap}>
                {/* Overall Vitality Index Hero */}
                <View style={styles.vitalityHeroCard}>
                  <View style={styles.vitalityGaugeBox}>
                    <Text style={styles.vitalityScoreNumber}>
                      {organReport.overallVitalityIndex}%
                    </Text>
                    <Text style={styles.vitalityScoreLabel}>VITALITY</Text>
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.vitalityHeroTitle}>
                      {isBn
                        ? `${targetMemberName}-এর সার্বিক ভাইটালিটি স্কোর`
                        : `${targetMemberName}'s Biological Vitality Index`}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: `${getStatusBadgeColor(
                            organReport.overallStatus
                          )}22`,
                          borderColor: getStatusBadgeColor(organReport.overallStatus),
                        },
                      ]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: getStatusBadgeColor(organReport.overallStatus) },
                        ]}>
                        {organReport.overallStatus} FUNCTIONAL STATUS
                      </Text>
                    </View>
                    <Text style={styles.vitalitySub}>
                      {isBn
                        ? `${organReport.testedBiomarkersCount}টি বায়োমার্কার অ্যানালাইসিস করে শরীরের ৬টি অঙ্গের স্বাস্থ্য নির্ধারণ করা হয়েছে।`
                        : `Calculated from ${organReport.testedBiomarkersCount} active lab biomarkers across 6 physiological systems.`}
                    </Text>
                  </View>
                </View>

                {/* 6 Organ System Cards */}
                {organReport.organCards.map((card) => {
                  const badgeColor = getStatusBadgeColor(card.status);
                  return (
                    <View key={card.organ} style={styles.organCard}>
                      <View style={styles.organCardHeader}>
                        <View
                          style={[
                            styles.organIconBox,
                            { backgroundColor: `${badgeColor}18` },
                          ]}>
                          <MaterialIcons
                            name={card.icon as any}
                            size={20}
                            color={badgeColor}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.organCardTitle}>
                            {isBn ? card.bengaliTitle : card.title}
                          </Text>
                          <Text style={styles.organBiomarkerSummary}>
                            {card.primaryBiomarkers
                              .map((b) => `${b.shortName}: ${b.latestValue} ${b.unit}`)
                              .join(' • ') || 'No active lab reading'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.organScoreBadge,
                            { backgroundColor: `${badgeColor}22`, borderColor: badgeColor },
                          ]}>
                          <Text style={[styles.organScoreText, { color: badgeColor }]}>
                            {card.score}% {card.status}
                          </Text>
                        </View>
                      </View>

                      {/* Clinical Summary */}
                      <Text style={styles.organClinicalSummary}>
                        {isBn ? card.bengaliSummary : card.clinicalSummary}
                      </Text>

                      {/* Biomarkers Breakdown */}
                      {card.primaryBiomarkers.length > 0 && (
                        <View style={styles.biomarkerListWrap}>
                          {card.primaryBiomarkers.map((bm, i) => (
                            <View key={i} style={styles.biomarkerItemRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.bmName}>{bm.name}</Text>
                                <Text style={styles.bmDate}>
                                  Tested: {bm.testDate} • Ref: {bm.refMin || 0} - {bm.refMax || 'Max'} {bm.unit}
                                </Text>
                              </View>
                              <View style={styles.bmValBox}>
                                <Text style={styles.bmValText}>
                                  {bm.latestValue} {bm.unit}
                                </Text>
                                <Text
                                  style={[
                                    styles.bmStatusTag,
                                    {
                                      color:
                                        bm.status === 'NORMAL'
                                          ? '#20C997'
                                          : bm.status === 'ELEVATED'
                                          ? '#FCC419'
                                          : '#FF6B6B',
                                    },
                                  ]}>
                                  {bm.status}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Lifestyle Shield */}
                      <View style={styles.shieldBox}>
                        <Text style={styles.shieldTitle}>
                          🛡️ {isBn ? 'প্রতিরোধমূলক পরামর্শ:' : 'PROTECTIVE LIFESTYLE SHIELD:'}
                        </Text>
                        {(isBn ? card.bengaliRecommendations : card.lifestyleRecommendations).map(
                          (rec, i) => (
                            <Text key={i} style={styles.shieldText}>
                              • {rec}
                            </Text>
                          )
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'AI_REPORT' && (
              /* ================= TAB 2: GEMINI AI REPORT ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.aiReportHeroCard}>
                  <View style={styles.aiReportHeader}>
                    <MaterialIcons name="psychology" size={22} color="#20C997" />
                    <Text style={styles.aiReportTitle}>
                      {isBn ? 'এআই মাল্টি-অর্গান সিন্থেসিস' : 'GEMINI MULTI-ORGAN SYNTHESIS'}
                    </Text>
                    {isAiLoading && <ActivityIndicator size="small" color="#20C997" />}
                  </View>

                  <Text style={styles.aiReportBody}>
                    {aiSynthesisText ||
                      (isBn
                        ? 'আপনার ল্যাব রিপোর্টগুলোর পারস্পরিক সম্পর্ক বিশ্লেষণ করা হচ্ছে...'
                        : 'Synthesizing multi-organ cross-talk and clinical risk markers...')}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleShareOrganReport}
                  style={styles.shareReportBtn}>
                  <MaterialIcons name="share" size={18} color="#101416" />
                  <Text style={styles.shareReportBtnText}>
                    {isBn
                      ? 'ডাক্তার ও হোয়াটসঅ্যাপে স্কোরকার্ড শেয়ার করুন'
                      : 'Share Organ Scorecard (WhatsApp / PDF)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'QUICK_LOG' && (
              /* ================= TAB 3: QUICK BIOMARKER LOG ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.quickLogCard}>
                  <Text style={styles.quickLogTitle}>
                    {isBn ? '+ নতুন ল্যাব টেস্ট ইনপুট করুন' : '+ LOG NEW LAB TEST READING'}
                  </Text>
                  <Text style={styles.quickLogSub}>
                    {isBn
                      ? 'টেস্টের মান প্রবেশ করানোর সাথে সাথে অর্গান স্কোরকার্ড স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।'
                      : 'Log any biomarker from your latest prescription/report to dynamically update organ health scores.'}
                  </Text>

                  {/* Analyte Picker */}
                  <View style={styles.pickerWrap}>
                    <Text style={styles.inputLabel}>
                      {isBn ? 'টেস্টের ধরন নির্বাচন করুন:' : 'Select Lab Biomarker:'}
                    </Text>
                    <View style={styles.analyteGrid}>
                      {[
                        { code: 'CREATININE', label: 'Creatinine (Kidney)' },
                        { code: 'HBA1C', label: 'HbA1c (Diabetes)' },
                        { code: 'SGPT_ALT', label: 'SGPT/ALT (Liver)' },
                        { code: 'CHOLESTEROL_TOTAL', label: 'Cholesterol (Heart)' },
                        { code: 'HEMOGLOBIN', label: 'Hemoglobin (Blood)' },
                        { code: 'TSH', label: 'TSH (Thyroid)' },
                      ].map((item) => {
                        const isSelected = logAnalyteCode === item.code;
                        return (
                          <TouchableOpacity
                            key={item.code}
                            onPress={() => {
                              void Haptics.selectionAsync().catch(() => {});
                              setLogAnalyteCode(item.code);
                            }}
                            style={[
                              styles.analyteChip,
                              isSelected && styles.analyteChipActive,
                            ]}>
                            <Text
                              style={[
                                styles.analyteChipText,
                                isSelected && styles.analyteChipTextActive,
                              ]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Value Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {isBn ? 'পরীক্ষার ফলাফল (Numeric Reading):' : 'Numeric Value / Reading:'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={logValue}
                      onChangeText={setLogValue}
                      placeholder="e.g. 1.1 or 5.4 or 38..."
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.rowTwoInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>
                        {isBn ? 'টেস্টের তারিখ:' : 'Test Date (YYYY-MM-DD):'}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={logTestDate}
                        onChangeText={setLogTestDate}
                        placeholder="2026-08-29"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>
                        {isBn ? 'ল্যাব বা হাসপাতালের নাম:' : 'Lab / Hospital:'}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={logSource}
                        onChangeText={setLogSource}
                        placeholder="Square Hospital Lab"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleSaveQuickBiomarker}
                    style={styles.saveBiomarkerBtn}>
                    <MaterialIcons name="save" size={18} color="#101416" />
                    <Text style={styles.saveBiomarkerBtnText}>
                      {isBn ? 'ল্যাব মান সংরক্ষণ ও স্কোর আপডেট' : 'Save & Refresh Organ Score'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBox: {
    backgroundColor: '#20C997',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  membersBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#181F23',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#181F23',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#FF6B6B',
    fontFamily: F.bold,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  sectionWrap: {
    gap: 14,
  },
  vitalityHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  vitalityGaugeBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#101416',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  vitalityScoreNumber: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FF6B6B',
  },
  vitalityScoreLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  vitalityHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  statusPillText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  vitalitySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  organCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  organCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  organIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organCardTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  organBiomarkerSummary: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },
  organScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  organScoreText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  organClinicalSummary: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  biomarkerListWrap: {
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  biomarkerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  bmName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  bmDate: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  bmValBox: {
    alignItems: 'flex-end',
  },
  bmValText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  bmStatusTag: {
    fontFamily: F.bold,
    fontSize: 8,
  },
  shieldBox: {
    backgroundColor: 'rgba(32, 201, 151, 0.08)',
    borderRadius: 8,
    padding: 8,
    gap: 3,
  },
  shieldTitle: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
  },
  shieldText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#E2E8F0',
    lineHeight: 14,
  },
  aiReportHeroCard: {
    backgroundColor: 'rgba(32, 201, 151, 0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.25)',
  },
  aiReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiReportTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
    letterSpacing: 0.5,
    flex: 1,
  },
  aiReportBody: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  shareReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 13,
    borderRadius: 12,
  },
  shareReportBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  quickLogCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickLogTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FF6B6B',
  },
  quickLogSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  pickerWrap: {
    gap: 6,
  },
  analyteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  analyteChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#101416',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  analyteChipActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#FF6B6B',
  },
  analyteChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  analyteChipTextActive: {
    color: '#FF6B6B',
    fontFamily: F.bold,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: '#101416',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBiomarkerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  saveBiomarkerBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
});
