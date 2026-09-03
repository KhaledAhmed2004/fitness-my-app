import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { RADIOLOGY_FINDINGS_KNOWLEDGE_BASE } from '@/services/ai-imaging-knowledge';
import {
  analyzeRadiologyImpression,
  searchRadiologyFindings,
} from '@/services/ai-imaging-service';
import { PRESET_LAB_PANELS } from '@/services/ai-report-explainer-knowledge';
import {
  analyzeLabReport,
  findAnalyteDefinition,
  processLabReportFromOCR,
} from '@/services/ai-report-explainer-service';
import { extractLabReportOCR } from '@/services/gemini-health-ocr';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import {
  ImagingModality,
  RadiologyFindingDefinition,
} from '@/types/ai-imaging-explainer';
import { LabPanelType, TrafficLightSeverity } from '@/types/ai-report-explainer';

const C = Vital.colors;
const F = Vital.fonts;

type MainExplainerMode = 'LAB_TESTS' | 'RADIOLOGY_IMAGING';

interface AIReportExplainerModalProps {
  visible: boolean;
  onClose: () => void;
  initialPanel?: LabPanelType;
}

export function AIReportExplainerModal({
  visible,
  onClose,
  initialPanel = 'CBC',
}: AIReportExplainerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);

  const initialMember =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMember);

  // Top Mode Switch: Lab Tests vs Radiology Imaging
  const [explainerMode, setExplainerMode] = useState<MainExplainerMode>('LAB_TESTS');

  // --- LAB TESTS STATE ---
  const [selectedPanelId, setSelectedPanelId] = useState<LabPanelType>(initialPanel);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const defaultPanel =
    PRESET_LAB_PANELS.find((p) => p.id === initialPanel) || PRESET_LAB_PANELS[0];
  const [currentAnalytes, setCurrentAnalytes] = useState<
    Array<{ code: string; value: number; unit: string }>
  >(defaultPanel.defaultAnalytes);

  // --- RADIOLOGY IMAGING STATE ---
  const [selectedModality, setSelectedModality] = useState<ImagingModality | 'ALL'>('ALL');
  const [imagingSearchQuery, setImagingSearchQuery] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<RadiologyFindingDefinition>(
    RADIOLOGY_FINDINGS_KNOWLEDGE_BASE[0]
  );

  const activeMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) || members[0],
    [members, activeMemberId]
  );

  // Run AI Lab Analysis Engine
  const labAnalysisResult = useMemo(() => {
    return analyzeLabReport(currentAnalytes, {
      name: activeMember?.name,
    });
  }, [currentAnalytes, activeMember]);

  // Run AI Radiology Search / Analysis
  const searchedFindings = useMemo(() => {
    return searchRadiologyFindings(
      imagingSearchQuery,
      selectedModality === 'ALL' ? undefined : selectedModality
    );
  }, [imagingSearchQuery, selectedModality]);

  const customImpressionAnalysis = useMemo(() => {
    if (imagingSearchQuery.length > 5) {
      return analyzeRadiologyImpression(
        imagingSearchQuery,
        selectedModality === 'ALL' ? undefined : selectedModality
      );
    }
    return null;
  }, [imagingSearchQuery, selectedModality]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  // Switch Preset Panel
  const handleSelectPanel = (panelId: LabPanelType) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedPanelId(panelId);
    const panel = PRESET_LAB_PANELS.find((p) => p.id === panelId);
    if (panel) {
      setCurrentAnalytes(panel.defaultAnalytes);
    }
  };

  // Stepper / Value Editor
  const handleUpdateValue = (code: string, delta: number) => {
    void Haptics.selectionAsync().catch(() => {});
    setCurrentAnalytes((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          const next = Math.max(0, Math.round((item.value + delta) * 10) / 10);
          return { ...item, value: next };
        }
        return item;
      })
    );
  };

  // Gemini AI Vision Scanner
  const handleStartOcrScan = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsScanning(true);
    try {
      const result = await extractLabReportOCR();
      if (result && result.analytes && result.analytes.length > 0) {
        const mapped = result.analytes.map((a) => ({
          code: a.analyteCode || a.analyteName,
          value: a.numericValue,
          unit: a.unit,
        }));
        setCurrentAnalytes(mapped);
        setSelectedPanelId('CUSTOM');
        showToast('ল্যাব রিপোর্ট স্ক্যান ও বিশ্লেষণ সম্পন্ন! 🎉');
      }
    } catch {
      Alert.alert('স্ক্যান ব্যর্থ হয়েছে', 'দয়া করে পরিষ্কার ছবি তুলুন বা ম্যানুয়ালি মান দিন।');
    } finally {
      setIsScanning(false);
    }
  };

  // Copy Lab Doctor Questions
  const handleCopyLabQuestions = async () => {
    const text = `👨‍⚕️ ডাক্তারের চেম্বারে আলোচনা ও প্রশ্নের তালিকা:\n\n${labAnalysisResult.doctorQuestionsBn
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n')}\n\n— TrackMe AI Health Assistant`;
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('ডাক্তারের ৩টি প্রশ্ন কপি করা হয়েছে! 📋');
  };

  // Copy Radiology Doctor Questions
  const handleCopyRadiologyQuestions = async (questions: string[], findingTitle: string) => {
    const text = `🩻 রেডিওলজি রিপোর্ট আলোচনা (${findingTitle}):\n\n${questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n')}\n\n— TrackMe AI Radiology Explainer`;
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('রেডিওলজির প্রশ্নাবলী কপি করা হয়েছে! 📋');
  };

  // WhatsApp Share Lab Summary
  const handleWhatsAppShareLab = () => {
    const questionsText = labAnalysisResult.doctorQuestionsBn
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');
    const msg = `🩺 ল্যাব রিপোর্ট সারাংশ (${activeMember?.name || 'Patient'}):\n\n${labAnalysisResult.executiveSummaryBn}\n\n👨‍⚕️ ডাক্তারের জন্য প্রস্তুত প্রশ্নাবলী:\n${questionsText}\n\n— TrackMe AI Health Explainer`;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে প্রশ্ন কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  // WhatsApp Share Radiology Finding
  const handleWhatsAppShareRadiology = (finding: RadiologyFindingDefinition) => {
    const questionsText = finding.suggestedDoctorQuestionsBn
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');
    const msg = `🩻 রেডিওলজি/ইমেজিং ব্যাখ্যা (${activeMember?.name || 'Patient'}):\n\nপরীক্ষা: ${finding.modalityNameBn}\nফাইন্ডিংস: ${finding.termBn}\n\n💡 সহজ ব্যাখ্যা:\n${finding.simpleExplanationBn}\n\n👨‍⚕️ ডাক্তারকে জিজ্ঞেস করার ৩টি প্রশ্ন:\n${questionsText}\n\n— TrackMe AI Radiology Explainer`;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে প্রশ্ন কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const getSeverityBadgeColor = (sev: TrafficLightSeverity) => {
    switch (sev) {
      case 'NORMAL':
        return '#10B981';
      case 'MILD_BORDERLINE':
        return '#F59E0B';
      case 'HIGH_ALERT':
      case 'CRITICAL':
        return '#EF4444';
    }
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
                <MaterialIcons name="analytics" size={24} color="#38BDF8" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  AI Medical Report & Imaging Explainer
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ল্যাব ও রেডিওলজি রিপোর্ট সরল বাংলায় বিশ্লেষণ
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

          {/* DUAL MODE SWITCHER: LAB TESTS vs RADIOLOGY IMAGING */}
          <View style={styles.mainModeRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setExplainerMode('LAB_TESTS');
              }}
              style={[
                styles.mainModeBtn,
                explainerMode === 'LAB_TESTS' && styles.mainModeBtnActive,
              ]}>
              <MaterialIcons
                name="biotech"
                size={16}
                color={explainerMode === 'LAB_TESTS' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.mainModeBtnText,
                  explainerMode === 'LAB_TESTS' && styles.mainModeBtnTextActive,
                ]}>
                🔬 ল্যাব ও রক্ত পরীক্ষা
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setExplainerMode('RADIOLOGY_IMAGING');
              }}
              style={[
                styles.mainModeBtn,
                explainerMode === 'RADIOLOGY_IMAGING' && styles.mainModeBtnActive,
              ]}>
              <MaterialIcons
                name="camera"
                size={16}
                color={explainerMode === 'RADIOLOGY_IMAGING' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.mainModeBtnText,
                  explainerMode === 'RADIOLOGY_IMAGING' && styles.mainModeBtnTextActive,
                ]}>
                🩻 এক্স-রে, USG, MRI ও ECG
              </Text>
            </TouchableOpacity>
          </View>

          {/* Members Bar */}
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
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: '#38BDF8',
                        borderColor: '#38BDF8',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#0F172A', fontFamily: F.bold },
                      ]}>
                      {m.name} ({m.relation})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* MODE 1: LAB TESTS & BLOOD PANELS */}
            {/* ========================================================================= */}
            {explainerMode === 'LAB_TESTS' && (
              <>
                {/* OCR Scan Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.ocrBanner}
                  onPress={handleStartOcrScan}
                  disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#38BDF8" />
                  ) : (
                    <MaterialIcons name="document-scanner" size={22} color="#38BDF8" />
                  )}
                  <View style={styles.ocrTextWrap}>
                    <Text style={styles.ocrTitle}>
                      {isScanning ? 'স্ক্যান ও বিশ্লেষণ চলছে...' : '📷 ল্যাব রিপোর্টের ছবি তুলুন (Gemini OCR)'}
                    </Text>
                    <Text style={styles.ocrSub}>
                      সিবিসি, সুগার বা লিপিড প্রোফাইল রিপোর্ট ক্যামেরা দিয়ে তাৎক্ষণিক রিড করুন
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={C.onSurfaceVariant} />
                </TouchableOpacity>

                {/* Preset Panel Chips */}
                <View style={styles.panelsSection}>
                  <Text style={styles.sectionLabel}>ল্যাব টেস্ট প্যানেল সিলেক্ট করুন:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.panelsScroll}>
                    {PRESET_LAB_PANELS.map((p) => {
                      const isSelected = selectedPanelId === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => handleSelectPanel(p.id)}
                          style={[
                            styles.panelChip,
                            isSelected && styles.panelChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.panelChipText,
                              isSelected && styles.panelChipTextActive,
                            ]}>
                            {p.titleBn}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Executive Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryTopRow}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreText}>
                        {labAnalysisResult.overallHealthScore}
                      </Text>
                      <Text style={styles.scoreSub}>স্কোর</Text>
                    </View>
                    <View style={styles.summaryHeadlineWrap}>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>
                          {labAnalysisResult.overallStatusBn}
                        </Text>
                      </View>
                      <Text style={styles.summaryMetaText}>
                        মোট {labAnalysisResult.totalAnalytesCount}টি উপাদানের মধ্যে {labAnalysisResult.normalCount}টি সম্পূর্ণ স্বাভাবিক
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.summaryBody}>
                    {labAnalysisResult.executiveSummaryBn}
                  </Text>
                </View>

                {/* Suggested Doctor Questions Card */}
                <View style={styles.doctorQuestionsCard}>
                  <View style={styles.docHeaderRow}>
                    <View style={styles.docHeaderLeft}>
                      <MaterialIcons name="psychology" size={20} color="#38BDF8" />
                      <Text style={styles.docCardTitle}>
                        👨‍⚕️ ডাক্তারের চেম্বারে ৩টি জরুরি প্রশ্ন
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleCopyLabQuestions}
                      style={styles.copyQuestionsBtn}>
                      <MaterialIcons name="content-copy" size={14} color="#38BDF8" />
                      <Text style={styles.copyQuestionsBtnText}>কপি করুন</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.questionsList}>
                    {labAnalysisResult.doctorQuestionsBn.map((q, idx) => (
                      <View key={idx} style={styles.questionItem}>
                        <View style={styles.questionNumBadge}>
                          <Text style={styles.questionNumText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.questionText}>{q}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleWhatsAppShareLab}
                    style={styles.waShareBtn}
                    activeOpacity={0.8}>
                    <MaterialIcons name="share" size={16} color="#25D366" />
                    <Text style={styles.waShareBtnText}>
                      WhatsApp-এ সারাংশ ও প্রশ্ন পাঠান
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Analyte Breakdown List */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.sectionHeaderTitle}>
                    উপাদানভিত্তিক বিস্তারিত বিশ্লেষণ (Adjust Values):
                  </Text>

                  {labAnalysisResult.items.map((item) => {
                    const badgeColor = getSeverityBadgeColor(item.severity);
                    return (
                      <View key={item.id} style={styles.analyteCard}>
                        <View style={styles.analyteTopRow}>
                          <View style={styles.analyteNameWrap}>
                            <Text style={styles.analyteNameBn}>{item.analyteNameBn}</Text>
                            <Text style={styles.analyteNameEn}>
                              {item.analyteName} ({item.referenceRangeText})
                            </Text>
                          </View>

                          <View style={styles.stepperBox}>
                            <TouchableOpacity
                              onPress={() => handleUpdateValue(item.analyteCode, -1)}
                              style={styles.stepperBtn}>
                              <MaterialIcons name="remove" size={16} color={C.onSurface} />
                            </TouchableOpacity>
                            <Text style={styles.stepperValText}>
                              {item.numericValue} {item.unit}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleUpdateValue(item.analyteCode, 1)}
                              style={styles.stepperBtn}>
                              <MaterialIcons name="add" size={16} color={C.onSurface} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.analyteStatusPill,
                            { backgroundColor: `${badgeColor}15`, borderColor: badgeColor },
                          ]}>
                          <Text style={[styles.analyteStatusText, { color: badgeColor }]}>
                            {item.statusLabelBn}
                          </Text>
                        </View>

                        <View style={styles.meaningBox}>
                          <Text style={styles.meaningText}>💡 {item.simpleMeaningBn}</Text>
                          <Text style={[styles.clinicalImpactText, { color: badgeColor }]}>
                            ⚠️ {item.clinicalImpactBn}
                          </Text>
                        </View>

                        {item.dietAdviceBn ? (
                          <View style={styles.dietAdviceBox}>
                            <MaterialIcons name="restaurant" size={14} color="#10B981" />
                            <Text style={styles.dietAdviceText}>{item.dietAdviceBn}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* MODE 2: RADIOLOGY & MEDICAL IMAGING EXPLAINER */}
            {/* ========================================================================= */}
            {explainerMode === 'RADIOLOGY_IMAGING' && (
              <>
                {/* Modality Chips */}
                <View style={styles.panelsSection}>
                  <Text style={styles.sectionLabel}>ইমেজিং ক্যাটাগরি সিলেক্ট করুন:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.panelsScroll}>
                    <TouchableOpacity
                      onPress={() => setSelectedModality('ALL')}
                      style={[
                        styles.panelChip,
                        selectedModality === 'ALL' && styles.panelChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.panelChipText,
                          selectedModality === 'ALL' && styles.panelChipTextActive,
                        ]}>
                        সব রেডিওলজি
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedModality('XRAY_CHEST')}
                      style={[
                        styles.panelChip,
                        selectedModality === 'XRAY_CHEST' && styles.panelChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.panelChipText,
                          selectedModality === 'XRAY_CHEST' && styles.panelChipTextActive,
                        ]}>
                        বুকের এক্স-রে (Chest)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedModality('USG_ABDOMEN')}
                      style={[
                        styles.panelChip,
                        selectedModality === 'USG_ABDOMEN' && styles.panelChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.panelChipText,
                          selectedModality === 'USG_ABDOMEN' && styles.panelChipTextActive,
                        ]}>
                        আল্ট্রাসনোগ্রাম (USG)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedModality('XRAY_BONE_JOINT')}
                      style={[
                        styles.panelChip,
                        selectedModality === 'XRAY_BONE_JOINT' && styles.panelChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.panelChipText,
                          selectedModality === 'XRAY_BONE_JOINT' && styles.panelChipTextActive,
                        ]}>
                        হাড় ও জয়েন্ট (Bone)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedModality('MRI_CT_SPINE_BRAIN')}
                      style={[
                        styles.panelChip,
                        selectedModality === 'MRI_CT_SPINE_BRAIN' && styles.panelChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.panelChipText,
                          selectedModality === 'MRI_CT_SPINE_BRAIN' && styles.panelChipTextActive,
                        ]}>
                        এমআরআই ও সিটি (MRI/CT)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedModality('ECG_ECHO')}
                      style={[
                        styles.panelChip,
                        selectedModality === 'ECG_ECHO' && styles.panelChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.panelChipText,
                          selectedModality === 'ECG_ECHO' && styles.panelChipTextActive,
                        ]}>
                        ইসিজি ও ইকো (Heart)
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* Impression Search Box */}
                <View style={styles.searchBoxCard}>
                  <View style={styles.searchHeader}>
                    <MaterialIcons name="search" size={18} color="#38BDF8" />
                    <Text style={styles.searchLabel}>
                      রিপোর্টের ইংরেজি টেক্সট বা ইমপ্রেশন লিখুন / খুঁজুন:
                    </Text>
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    value={imagingSearchQuery}
                    onChangeText={setImagingSearchQuery}
                    placeholder="e.g. Grade 1 fatty liver, L4-L5 disc protrusion, Knee osteoarthritis..."
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                  {imagingSearchQuery ? (
                    <TouchableOpacity
                      onPress={() => setImagingSearchQuery('')}
                      style={styles.clearSearchBtn}>
                      <Text style={styles.clearSearchText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Multi-Finding Impression Summary (If multi matches) */}
                {customImpressionAnalysis && customImpressionAnalysis.matchedFindings.length > 1 && (
                  <View style={styles.multiMatchCard}>
                    <View style={styles.multiMatchHeader}>
                      <MaterialIcons name="auto-awesome" size={20} color="#38BDF8" />
                      <Text style={styles.multiMatchTitle}>
                        {customImpressionAnalysis.overallSeverityLabelBn}
                      </Text>
                    </View>
                    <Text style={styles.multiMatchBody}>
                      {customImpressionAnalysis.summaryBn}
                    </Text>
                  </View>
                )}

                {/* Preset Findings Horizontal / Grid Picker */}
                <Text style={styles.sectionLabel}>
                  সাধারণ ইমেজিং ফাইন্ডিংস সিলেক্ট করুন (Common Findings):
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.findingsChipScroll}>
                  {searchedFindings.map((finding) => {
                    const isSelected = selectedFinding.id === finding.id;
                    return (
                      <TouchableOpacity
                        key={finding.id}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setSelectedFinding(finding);
                        }}
                        style={[
                          styles.findingChip,
                          isSelected && styles.findingChipActive,
                          { borderColor: finding.badgeColor },
                        ]}>
                        <Text style={[styles.findingChipTitle, isSelected && { color: '#38BDF8' }]}>
                          {finding.termBn}
                        </Text>
                        <Text style={styles.findingChipSub} numberOfLines={1}>
                          {finding.anatomyRegionBn} • {finding.modalityNameBn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* DETAILED ACTIVE FINDING EXPLANATION CARD */}
                {selectedFinding && (
                  <View style={styles.imagingDetailCard}>
                    {/* Header with Severity Badge */}
                    <View style={styles.imagingCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.imagingModalityBadge}>
                          {selectedFinding.modalityNameBn}
                        </Text>
                        <Text style={styles.imagingFindingTitle}>
                          {selectedFinding.termBn}
                        </Text>
                        <Text style={styles.imagingFindingSub}>
                          {selectedFinding.termEn}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.imagingSeverityPill,
                          {
                            backgroundColor: selectedFinding.badgeBg,
                            borderColor: selectedFinding.badgeColor,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.imagingSeverityText,
                            { color: selectedFinding.badgeColor },
                          ]}>
                          {selectedFinding.severityLabelBn}
                        </Text>
                      </View>
                    </View>

                    {/* Simple Explanation Box */}
                    <View style={styles.imagingSectionBox}>
                      <View style={styles.sectionHeaderRow}>
                        <MaterialIcons name="lightbulb" size={16} color="#38BDF8" />
                        <Text style={styles.sectionBoxTitle}>সহজ বাংলায় মূল বিষয়:</Text>
                      </View>
                      <Text style={styles.sectionBoxBody}>
                        {selectedFinding.simpleExplanationBn}
                      </Text>
                    </View>

                    {/* Reassurance & Danger Check Box */}
                    <View style={styles.reassuranceBox}>
                      <View style={styles.sectionHeaderRow}>
                        <MaterialIcons name="verified-user" size={16} color="#10B981" />
                        <Text style={[styles.sectionBoxTitle, { color: '#10B981' }]}>
                          কেন অযথা ভয় পাওয়ার কিছু নেই / সতর্কতা:
                        </Text>
                      </View>
                      <Text style={styles.sectionBoxBody}>
                        {selectedFinding.isItDangerousBn}
                      </Text>
                    </View>

                    {/* What Happens Next / Treatment Pathway */}
                    <View style={styles.imagingSectionBox}>
                      <View style={styles.sectionHeaderRow}>
                        <MaterialIcons name="medical-services" size={16} color="#FF922B" />
                        <Text style={[styles.sectionBoxTitle, { color: '#FF922B' }]}>
                          পরবর্তী চিকিৎসা ও করণীয়:
                        </Text>
                      </View>
                      <Text style={styles.sectionBoxBody}>
                        {selectedFinding.whatHappensNextBn}
                      </Text>
                    </View>

                    {/* Lifestyle & Ergonomics Advice (If applicable) */}
                    {selectedFinding.lifestyleDietAdviceBn && (
                      <View style={styles.lifestyleBox}>
                        <View style={styles.sectionHeaderRow}>
                          <MaterialIcons name="accessibility-new" size={16} color="#38BDF8" />
                          <Text style={[styles.sectionBoxTitle, { color: '#38BDF8' }]}>
                            খাদ্যাভ্যাস, পসচার ও লাইফস্টাইল নিয়ম:
                          </Text>
                        </View>
                        <Text style={styles.lifestyleText}>
                          {selectedFinding.lifestyleDietAdviceBn}
                        </Text>
                      </View>
                    )}

                    {/* 3 Questions for Doctor */}
                    <View style={styles.doctorQuestionsCard}>
                      <View style={styles.docHeaderRow}>
                        <View style={styles.docHeaderLeft}>
                          <MaterialIcons name="psychology" size={18} color="#38BDF8" />
                          <Text style={styles.docCardTitle}>
                            👨‍⚕️ ডাক্তারের চেম্বারে ৩টি জরুরি প্রশ্ন
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            handleCopyRadiologyQuestions(
                              selectedFinding.suggestedDoctorQuestionsBn,
                              selectedFinding.termBn
                            )
                          }
                          style={styles.copyQuestionsBtn}>
                          <MaterialIcons name="content-copy" size={14} color="#38BDF8" />
                          <Text style={styles.copyQuestionsBtnText}>কপি করুন</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.questionsList}>
                        {selectedFinding.suggestedDoctorQuestionsBn.map((q, idx) => (
                          <View key={idx} style={styles.questionItem}>
                            <View style={styles.questionNumBadge}>
                              <Text style={styles.questionNumText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.questionText}>{q}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        onPress={() => handleWhatsAppShareRadiology(selectedFinding)}
                        style={styles.waShareBtn}
                        activeOpacity={0.8}>
                        <MaterialIcons name="share" size={16} color="#25D366" />
                        <Text style={styles.waShareBtnText}>
                          WhatsApp-এ ব্যাখ্যা ও প্রশ্ন পাঠান
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
  mainModeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  mainModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mainModeBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  mainModeBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  mainModeBtnTextActive: {
    fontFamily: F.bold,
    color: '#38BDF8',
  },
  membersBar: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
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
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 10,
  },
  ocrTextWrap: {
    flex: 1,
  },
  ocrTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#38BDF8',
  },
  ocrSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  panelsSection: {
    gap: 6,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  panelsScroll: {
    gap: 6,
  },
  panelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  panelChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  panelChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  panelChipTextActive: {
    fontFamily: F.bold,
    color: '#38BDF8',
  },
  summaryCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  scoreText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#38BDF8',
  },
  scoreSub: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  summaryHeadlineWrap: {
    flex: 1,
    gap: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  summaryMetaText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  summaryBody: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurface,
    lineHeight: 18,
  },
  doctorQuestionsCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 10,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  docCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  copyQuestionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyQuestionsBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  questionsList: {
    gap: 8,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  questionNumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  questionNumText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  questionText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  waShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    gap: 6,
    marginTop: 2,
  },
  waShareBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
  breakdownSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  analyteCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  analyteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  analyteNameWrap: {
    flex: 1,
    marginRight: 8,
  },
  analyteNameBn: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  analyteNameEn: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    padding: 4,
  },
  stepperValText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    paddingHorizontal: 6,
  },
  analyteStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  analyteStatusText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  meaningBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  meaningText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  clinicalImpactText: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  dietAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 8,
    borderRadius: 8,
  },
  dietAdviceText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },

  // --- RADIOLOGY IMAGING STYLES ---
  searchBoxCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  searchInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: C.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 12,
    fontFamily: F.regular,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearSearchBtn: {
    alignSelf: 'flex-end',
  },
  clearSearchText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
  },
  multiMatchCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 4,
  },
  multiMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiMatchTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  multiMatchBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  findingsChipScroll: {
    gap: 8,
  },
  findingChip: {
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 220,
    gap: 2,
  },
  findingChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  findingChipTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  findingChipSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  imagingDetailCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
    marginTop: 4,
  },
  imagingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  imagingModalityBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  imagingFindingTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
    marginTop: 2,
  },
  imagingFindingSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  imagingSeverityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  imagingSeverityText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  imagingSectionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  reassuranceBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  lifestyleBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionBoxTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  sectionBoxBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 17,
  },
  lifestyleText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 17,
  },
});
