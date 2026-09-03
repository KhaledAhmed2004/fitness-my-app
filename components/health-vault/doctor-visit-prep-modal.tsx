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

import {
  formatDoctorVisitBriefText,
  formatLabComparisonText,
  generateObjectiveLabDateComparison,
  getDistinctLabDates,
  synthesizeDoctorVisitBrief,
} from '@/services/doctor-visit-prep-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { useMedicineStore } from '@/stores/medicine-store';
import { DoctorVisitBrief, LabDateComparisonTable } from '@/types/doctor-visit-prep';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface DoctorVisitPrepModalProps {
  visible: boolean;
  onClose: () => void;
  onLaunchVoiceAi?: () => void;
  onLaunchAiScanner?: () => void;
  onLaunchCalendarSync?: () => void;
}

export function DoctorVisitPrepModal({
  visible,
  onClose,
  onLaunchVoiceAi,
  onLaunchAiScanner,
  onLaunchCalendarSync,
}: DoctorVisitPrepModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const getTimelineEvents = useHealthVaultStore((s) => s.getTimelineEvents);
  const documents = useHealthVaultStore((s) => s.documents);
  const labResults = useHealthVaultStore((s) => s.labResults);
  const allergies = useHealthVaultStore((s) => s.allergies);
  const healthConditions = useHealthVaultStore((s) => s.healthConditions);
  const followUps = useHealthVaultStore((s) => s.followUps);

  const medicines = useMedicineStore((s) => s.medicines);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const isBn = currentLanguage === 'bn';

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [activeTab, setActiveTab] = useState<'BRIEF' | 'LOOP' | 'COMPARE'>('BRIEF');

  const timelineEvents = useMemo(
    () => getTimelineEvents(activeMemberId),
    [getTimelineEvents, activeMemberId]
  );

  // Question scratchpad state
  const [questions, setQuestions] = useState<string[]>([
    'Can I taper or reduce the antacid dosage?',
    'Feeling mild morning knee stiffness for the last 2 weeks.',
  ]);
  const [newQuestionInput, setNewQuestionInput] = useState('');

  // Lab Date Comparison State
  const distinctDates = useMemo(() => {
    return getDistinctLabDates(labResults, activeMemberId);
  }, [labResults, activeMemberId]);

  const [dateA, setDateA] = useState<string>(distinctDates[1] || '2026-01-15');
  const [dateB, setDateB] = useState<string>(distinctDates[0] || '2026-08-20');

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const targetMember = members.find((m) => m.id === activeMemberId) || members[0];
  const targetMemberName = targetMember?.name || 'Khaled';

  // Synthesize Doctor Visit Brief
  const visitBrief: DoctorVisitBrief = useMemo(() => {
    return synthesizeDoctorVisitBrief(
      targetMember,
      timelineEvents,
      documents,
      labResults,
      allergies,
      healthConditions,
      medicines,
      followUps,
      questions
    );
  }, [
    targetMember,
    timelineEvents,
    documents,
    labResults,
    allergies,
    healthConditions,
    medicines,
    followUps,
    questions,
  ]);

  // Generate Objective Lab Date-to-Date Comparison
  const labComparison: LabDateComparisonTable = useMemo(() => {
    return generateObjectiveLabDateComparison(
      labResults,
      activeMemberId,
      targetMemberName,
      dateA,
      dateB
    );
  }, [labResults, activeMemberId, targetMemberName, dateA, dateB]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setQuestions((prev) => [...prev, newQuestionInput.trim()]);
    setNewQuestionInput('');
    showToast('✅ Question added to Doctor Brief!');
  };

  const handleRemoveQuestion = (idx: number) => {
    void Haptics.selectionAsync().catch(() => {});
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExportBrief = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const briefText = formatDoctorVisitBriefText(visitBrief);
    await Clipboard.setStringAsync(briefText);
    showToast('📋 Doctor Visit Brief Copied!');

    Alert.alert('Doctor Visit Brief', 'Brief copied to clipboard! Share via WhatsApp with doctor or family?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'WhatsApp',
        onPress: () => {
          void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(briefText)}`).catch(() => {
            void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(briefText)}`).catch(() => {});
          });
        },
      },
    ]);
  };

  const handleExportLabComparison = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const compText = formatLabComparisonText(labComparison);
    await Clipboard.setStringAsync(compText);
    showToast('📋 Lab Comparison Copied!');

    Alert.alert('Lab Comparison Table', 'Table copied! Share via WhatsApp?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'WhatsApp',
        onPress: () => {
          void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(compText)}`).catch(() => {
            void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(compText)}`).catch(() => {});
          });
        },
      },
    ]);
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
                <MaterialIcons name="assignment" size={22} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {isBn ? 'ডাক্তার ভিজিট প্রস্তুতি ও ল্যাব তুলনা' : 'Doctor Visit Prep & Care Loop'}
                </Text>
                <Text style={styles.subtitle}>
                  {isBn
                    ? '১-ট্যাপ ডক্টর ব্রিফ, ফুল কেয়ার সাইকেল ও অবজেক্টিভ ল্যাব তুলনা'
                    : '1-Tap Visit Brief, 360° Care Cycle & Objective Lab Compare'}
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

          {/* MEMBER SELECTOR */}
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
                setActiveTab('BRIEF');
              }}
              style={[styles.tabBtn, activeTab === 'BRIEF' && styles.tabBtnActive]}>
              <MaterialIcons
                name="article"
                size={16}
                color={activeTab === 'BRIEF' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'BRIEF' && styles.tabBtnTextActive,
                ]}>
                {isBn ? 'ডাক্তার ব্রিফ' : 'Doctor Brief'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('LOOP');
              }}
              style={[styles.tabBtn, activeTab === 'LOOP' && styles.tabBtnActive]}>
              <MaterialIcons
                name="loop"
                size={16}
                color={activeTab === 'LOOP' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'LOOP' && styles.tabBtnTextActive,
                ]}>
                {isBn ? 'কেয়ার লুপ' : 'Care Loop'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('COMPARE');
              }}
              style={[styles.tabBtn, activeTab === 'COMPARE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="compare-arrows"
                size={16}
                color={activeTab === 'COMPARE' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'COMPARE' && styles.tabBtnTextActive,
                ]}>
                {isBn ? 'ল্যাব তুলনা' : 'Lab Compare'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLLABLE BODY */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {activeTab === 'BRIEF' && (
              /* ================= TAB 1: DOCTOR VISIT BRIEF ================= */
              <View style={styles.sectionWrap}>
                {/* Hero Brief Action Card */}
                <View style={styles.briefHeroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.briefHeroTitle}>
                      {isBn ? 'ডাক্তারের ভিজিট ব্রিফ প্রস্তুত' : 'Doctor Visit Brief Ready'}
                    </Text>
                    <Text style={styles.briefHeroSub}>
                      {isBn
                        ? 'পুরো মেডিকেল হিস্ট্রি এক পাতায় সাজানো। ডাক্তারের কাছে যাওয়ার আগে এটি দেখে নিন।'
                        : 'Consolidated clinical summary prepared for your upcoming consultation.'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleExportBrief}
                    style={styles.shareBriefBtn}>
                    <MaterialIcons name="share" size={16} color="#101416" />
                    <Text style={styles.shareBriefBtnText}>
                      {isBn ? 'শেয়ার / কপি' : 'Share'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 1-Page Summary Container */}
                <View style={styles.briefPaper}>
                  <View style={styles.paperHeader}>
                    <Text style={styles.paperTitle}>DOCTOR VISIT BRIEF</Text>
                    <Text style={styles.paperDate}>{new Date().toLocaleDateString()}</Text>
                  </View>

                  {/* Patient Line */}
                  <View style={styles.briefRow}>
                    <Text style={styles.briefLabel}>Patient:</Text>
                    <Text style={styles.briefValBold}>{visitBrief.memberName}</Text>
                    {visitBrief.age && (
                      <Text style={styles.briefVal}>• Age {visitBrief.age} yrs</Text>
                    )}
                    <Text style={styles.briefVal}>• Blood {visitBrief.bloodGroup || 'B+'}</Text>
                  </View>

                  {/* Recent Visits & Docs */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{visitBrief.recentVisitsCount}</Text>
                      <Text style={styles.statLabel}>Recent Visits</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{visitBrief.activeMedications.length}</Text>
                      <Text style={styles.statLabel}>Current Meds</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{visitBrief.recentLabReadings.length}</Text>
                      <Text style={styles.statLabel}>Recent Tests</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>{visitBrief.recentDocumentsCount}</Text>
                      <Text style={styles.statLabel}>Vault Docs</Text>
                    </View>
                  </View>

                  {/* Current Medications */}
                  <View style={styles.paperSection}>
                    <Text style={styles.paperSectionHeading}>CURRENT MEDICATIONS:</Text>
                    {visitBrief.activeMedications.map((m, i) => (
                      <View key={i} style={styles.medItemRow}>
                        <Text style={styles.medItemName}>
                          {i + 1}. {m.name} ({m.dosage})
                        </Text>
                        <Text style={styles.medItemFreq}>{m.frequency}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Recent Labs */}
                  <View style={styles.paperSection}>
                    <Text style={styles.paperSectionHeading}>RECENT LAB RESULTS:</Text>
                    {visitBrief.recentLabReadings.map((l, i) => (
                      <View key={i} style={styles.labItemRow}>
                        <Text style={styles.labItemName}>• {l.analyteName}</Text>
                        <Text style={styles.labItemVal}>
                          {l.latestValue} {l.unit} ({l.testDate})
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Known Allergies */}
                  <View style={styles.paperSection}>
                    <Text style={styles.paperSectionHeading}>KNOWN ALLERGIES & ALERTS:</Text>
                    <Text style={styles.bulletText}>
                      {visitBrief.knownAllergies.join(', ')}
                    </Text>
                  </View>

                  {/* Follow-ups */}
                  <View style={styles.paperSection}>
                    <Text style={styles.paperSectionHeading}>UPCOMING / PREVIOUS FOLLOW-UPS:</Text>
                    {visitBrief.upcomingFollowUps.map((f, i) => (
                      <Text key={i} style={styles.bulletText}>
                        • {f}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Questions / Symptoms Scratchpad */}
                <View style={styles.scratchpadCard}>
                  <View style={styles.scratchpadHeader}>
                    <MaterialIcons name="edit-note" size={20} color="#38BDF8" />
                    <Text style={styles.scratchpadTitle}>
                      {isBn ? 'ডাক্তারকে জিজ্ঞেস করার প্রশ্ন ও নোট' : 'Questions & Symptoms for Doctor'}
                    </Text>
                  </View>
                  <Text style={styles.scratchpadSub}>
                    {isBn
                      ? 'চেম্বারে যাওয়ার আগে আপনার মনের প্রশ্নগুলো লিখে রাখুন যাতে ভুলে না যান।'
                      : 'Jot down questions or new symptoms to discuss during your consultation.'}
                  </Text>

                  {/* Question items */}
                  {questions.map((q, idx) => (
                    <View key={idx} style={styles.questionItemRow}>
                      <Text style={styles.questionItemText}>
                        {idx + 1}. {q}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveQuestion(idx)}>
                        <MaterialIcons name="delete-outline" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add question input */}
                  <View style={styles.addQuestionRow}>
                    <TextInput
                      style={styles.questionInput}
                      value={newQuestionInput}
                      onChangeText={setNewQuestionInput}
                      placeholder="e.g. Can I reduce antacid dosage? Any food restrictions?"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                    <TouchableOpacity onPress={handleAddQuestion} style={styles.addQBtn}>
                      <MaterialIcons name="add" size={18} color="#101416" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'LOOP' && (
              /* ================= TAB 2: HEALTHCARE WORKFLOW LOOP ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.loopHeroCard}>
                  <MaterialIcons name="all-inclusive" size={24} color="#20C997" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loopHeroTitle}>
                      {isBn ? '৩৬০° হেলথকেয়ার ভিজিট লুপ' : '360° Healthcare Consultation Loop'}
                    </Text>
                    <Text style={styles.loopHeroSub}>
                      {isBn
                        ? 'প্রস্তুতি থেকে শুরু করে ফলো-আপ ও পরবর্তী ভিজিটের একটি সমন্বিত সাইকেল।'
                        : 'A seamless, closed-loop treatment and consultation management workflow.'}
                    </Text>
                  </View>
                </View>

                {/* 7 Stage Interactive Pipeline */}
                <View style={styles.loopPipeline}>
                  {[
                    {
                      step: '1',
                      title: '1. Prepare for Visit',
                      sub: 'Generate visit brief, active meds & questions scratchpad.',
                      icon: 'article',
                      color: '#38BDF8',
                      btnLabel: 'View Brief',
                      action: () => setActiveTab('BRIEF'),
                    },
                    {
                      step: '2',
                      title: '2. Doctor Visit & Consultation',
                      sub: 'Record consultation voice note with AI structuring & summary.',
                      icon: 'mic',
                      color: '#FF6B6B',
                      btnLabel: 'Voice AI',
                      action: onLaunchVoiceAi || (() => {}),
                    },
                    {
                      step: '3',
                      title: '3. Prescription & OCR',
                      sub: 'Scan physical prescription with Gemini Vision OCR.',
                      icon: 'document-scanner',
                      color: '#20C997',
                      btnLabel: 'Scan Rx',
                      action: onLaunchAiScanner || (() => {}),
                    },
                    {
                      step: '4',
                      title: '4. Diagnostic Tests Log',
                      sub: 'Log lab samples and track organ biomarkers.',
                      icon: 'biotech',
                      color: '#FCC419',
                      btnLabel: 'Lab Tests',
                      action: () => setActiveTab('COMPARE'),
                    },
                    {
                      step: '5',
                      title: '5. Medicine Cabinet Sync',
                      sub: 'Auto-sync prescribed items to medicine reminders & cabinet.',
                      icon: 'medication',
                      color: '#A78BFA',
                      btnLabel: 'Cabinet',
                      action: () => showToast('Medicine cabinet synchronized.'),
                    },
                    {
                      step: '6',
                      title: '6. Follow-up & Phone Sync',
                      sub: '1-Tap sync doctor follow-up date to Google / Apple calendar.',
                      icon: 'event-available',
                      color: '#38BDF8',
                      btnLabel: 'Calendar Sync',
                      action: onLaunchCalendarSync || (() => {}),
                    },
                    {
                      step: '7',
                      title: '7. Prepare for Next Visit 🔁',
                      sub: 'Treatment loop complete. Review delta and prepare next brief.',
                      icon: 'refresh',
                      color: '#20C997',
                      btnLabel: 'Next Cycle',
                      action: () => setActiveTab('BRIEF'),
                    },
                  ].map((stage, i) => (
                    <View key={i} style={styles.loopStageCard}>
                      <View style={[styles.stageIconBox, { backgroundColor: `${stage.color}18` }]}>
                        <MaterialIcons name={stage.icon as any} size={20} color={stage.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stageTitle}>{stage.title}</Text>
                        <Text style={styles.stageSub}>{stage.sub}</Text>
                      </View>
                      <TouchableOpacity onPress={stage.action} style={[styles.stageBtn, { borderColor: stage.color }]}>
                        <Text style={[styles.stageBtnText, { color: stage.color }]}>
                          {stage.btnLabel}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'COMPARE' && (
              /* ================= TAB 3: OBJECTIVE LAB COMPARISON ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.compareHeroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareHeroTitle}>
                      {isBn ? 'অবজেক্টিভ ল্যাব টেস্ট তুলনা' : 'Objective Lab Date Comparison'}
                    </Text>
                    <Text style={styles.compareHeroSub}>
                      {isBn
                        ? 'দুইটি নির্দিষ্ট তারিখের ল্যাব টেস্টের মানের পিওর ডাটা তুলনা।'
                        : 'Pure side-by-side historical data comparison without subjective labels.'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleExportLabComparison}
                    style={styles.shareTableBtn}>
                    <MaterialIcons name="share" size={16} color="#101416" />
                    <Text style={styles.shareTableBtnText}>
                      {isBn ? 'টেবিল শেয়ার' : 'Share Table'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date Selectors */}
                <View style={styles.dateSelectorRow}>
                  <View style={styles.datePickCol}>
                    <Text style={styles.datePickLabel}>Baseline Date (Date A):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {distinctDates.map((d) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setDateA(d)}
                          style={[styles.dateChip, dateA === d && styles.dateChipActive]}>
                          <Text
                            style={[
                              styles.dateChipText,
                              dateA === d && styles.dateChipTextActive,
                            ]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.datePickCol}>
                    <Text style={styles.datePickLabel}>Recent Date (Date B):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {distinctDates.map((d) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setDateB(d)}
                          style={[styles.dateChip, dateB === d && styles.dateChipActive]}>
                          <Text
                            style={[
                              styles.dateChipText,
                              dateB === d && styles.dateChipTextActive,
                            ]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Side-by-Side Comparison Table */}
                <View style={styles.tableCard}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCell, { flex: 1.5 }]}>TEST / ANALYTE</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>{dateA}</Text>
                    <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>{dateB}</Text>
                    <Text style={[styles.thCell, { flex: 0.9, textAlign: 'right' }]}>DIFF (Δ)</Text>
                  </View>

                  {/* Table Rows */}
                  {labComparison.rows.map((row, idx) => {
                    const diff = row.diffNumeric;
                    let diffDisplay = '-';
                    if (diff !== undefined) {
                      diffDisplay = diff > 0 ? `+${diff}` : `${diff}`;
                    }

                    return (
                      <View key={idx} style={styles.tableRow}>
                        <View style={{ flex: 1.5 }}>
                          <Text style={styles.tdAnalyteName}>{row.analyteName}</Text>
                          <Text style={styles.tdUnit}>Unit: {row.unit}</Text>
                        </View>
                        <Text style={[styles.tdVal, { flex: 1, textAlign: 'center' }]}>
                          {row.valueA !== undefined ? row.valueA : '-'}
                        </Text>
                        <Text style={[styles.tdVal, { flex: 1, textAlign: 'center', color: '#38BDF8' }]}>
                          {row.valueB !== undefined ? row.valueB : '-'}
                        </Text>
                        <Text style={[styles.tdDiff, { flex: 0.9, textAlign: 'right' }]}>
                          {diffDisplay}
                        </Text>
                      </View>
                    );
                  })}
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  sectionWrap: {
    gap: 14,
  },
  briefHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  briefHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#38BDF8',
  },
  briefHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  shareBriefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBriefBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  briefPaper: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  paperTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  paperDate: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  briefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  briefLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  briefValBold: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  briefVal: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  paperSection: {
    gap: 4,
    backgroundColor: '#101416',
    padding: 10,
    borderRadius: 10,
  },
  paperSectionHeading: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
    marginBottom: 2,
  },
  medItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  medItemName: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  medItemFreq: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#20C997',
  },
  labItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  labItemName: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  labItemVal: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FCC419',
  },
  bulletText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  scratchpadCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  scratchpadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scratchpadTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  scratchpadSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  questionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101416',
    padding: 8,
    borderRadius: 8,
  },
  questionItemText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  addQuestionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  questionInput: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.regular,
    fontSize: 11,
    color: '#FFFFFF',
  },
  addQBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  loopHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#20C997',
  },
  loopHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  loopPipeline: {
    gap: 10,
  },
  loopStageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  stageIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  stageSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  stageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  compareHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  compareHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#38BDF8',
  },
  compareHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  shareTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareTableBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  dateSelectorRow: {
    gap: 8,
  },
  datePickCol: {
    gap: 4,
  },
  datePickLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#181F23',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  dateChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  dateChipTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  tableCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  thCell: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  tdAnalyteName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  tdUnit: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tdVal: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  tdDiff: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FCC419',
  },
});
