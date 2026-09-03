import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

import { summarizeDoctorVoiceConsultation } from '@/services/gemini-consultation-audio';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { DoctorConsultationRecording, DoctorConsultationSummary } from '@/types/voice-consultation';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const SPECIALTY_PRESETS = [
  'Cardiology',
  'General Medicine',
  'Endocrinology (Diabetes)',
  'Pediatrics',
  'Orthopedics',
  'Gastroenterology',
  'Neurology',
  'Gynecology',
];

interface DoctorVoiceConsultationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DoctorVoiceConsultationModal({
  visible,
  onClose,
}: DoctorVoiceConsultationModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const doctors = useHealthVaultStore((s) => s.doctors);
  const consultations = useHealthVaultStore((s) => s.consultations);
  const addConsultationRecording = useHealthVaultStore((s) => s.addConsultationRecording);
  const deleteConsultationRecording = useHealthVaultStore((s) => s.deleteConsultationRecording);
  const syncConsultationToTimeline = useHealthVaultStore((s) => s.syncConsultationToTimeline);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const translateClinical = useLanguageStore((s) => s.translateClinical);

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [activeTab, setActiveTab] = useState<'RECORD' | 'HISTORY'>('RECORD');

  // Recording State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  // Form State
  const [doctorName, setDoctorName] = useState(doctors[0]?.name || 'Prof. Dr. M. A. Rahman');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('National Heart Foundation, Dhaka');
  const [consultationTitle, setConsultationTitle] = useState('Doctor Visit Audio & Consultation');
  const [typedNotes, setTypedNotes] = useState('');

  // Processing & View State
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<DoctorConsultationRecording | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const memberConsultations = useMemo(() => {
    if (activeMemberId === 'ALL') return consultations;
    return consultations.filter((c) => c.memberId === activeMemberId);
  }, [consultations, activeMemberId]);

  const activeMember = members.find((m) => m.id === activeMemberId) || members[0];

  useEffect(() => {
    if (visible && memberConsultations.length > 0 && !selectedConsultation) {
      setSelectedConsultation(memberConsultations[0]);
    }
  }, [visible, memberConsultations, selectedConsultation]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const startRecording = async () => {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access in settings to record doctor consultations.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordDuration(0);
      setRecordedUri(null);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Audio recording failed to start:', err);
      // Fallback for web / simulator
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordedUri(uri);
        setRecording(null);
      } catch (err) {
        console.warn('Failed to stop recording:', err);
      }
    }
  };

  const handleProcessConsultation = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsProcessing(true);

    try {
      const summary: DoctorConsultationSummary = await summarizeDoctorVoiceConsultation({
        audioUri: recordedUri || undefined,
        transcriptOrNotes: typedNotes.trim() || undefined,
        doctorName,
        specialty,
        languageCode: currentLanguage,
      });

      const newId = await addConsultationRecording({
        memberId: activeMemberId,
        title: consultationTitle || `${specialty} Consultation with ${doctorName}`,
        doctorName,
        specialty,
        hospitalOrClinic,
        durationSeconds: recordDuration || 180,
        audioUri: recordedUri || undefined,
        status: 'SUMMARIZED',
        rawTranscript: typedNotes.trim() || undefined,
        summary,
        tags: [specialty, 'Voice Note', 'Gemini AI Scribe'],
        isSyncedToTimeline: false,
      });

      setIsProcessing(false);
      setTypedNotes('');
      setRecordDuration(0);
      setRecordedUri(null);

      const created = useHealthVaultStore.getState().consultations.find((c) => c.id === newId);
      if (created) {
        setSelectedConsultation(created);
        setActiveTab('HISTORY');
      }

      showToast('✅ Consultation analyzed & structured by Gemini AI!');
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Processing Failed', 'Could not process the audio consultation. Please try again.');
    }
  };

  const handleSyncToTimeline = async (rec: DoctorConsultationRecording) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await syncConsultationToTimeline(rec.id);
      showToast('✅ Synced to Health Timeline, Medicine Cabinet & Care Calendar!');
    } catch (err) {
      Alert.alert('Sync Error', 'Could not sync consultation to timeline.');
    }
  };

  const handleShareSummary = async (rec: DoctorConsultationRecording) => {
    if (!rec.summary) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const s = rec.summary;
    const text = `
🩺 DOCTOR CONSULTATION AI SUMMARY
----------------------------------------
Patient: ${activeMember.name}
Doctor: ${rec.doctorName} (${rec.specialty || 'General'})
Date: ${rec.recordedAt.split('T')[0]}

🎯 Diagnosis:
${s.doctorDiagnosis}

💡 Key Medical Advice:
${s.keyAdvicePoints.map((p) => `• ${p}`).join('\n')}

🚫 Diet & Restrictions:
${s.dietAndLifestyleRestrictions.map((d) => `• ${d}`).join('\n')}

💊 Prescribed Medications:
${s.medicationInstructions.map((m) => `• ${m.medicineName} (${m.dosage}) - ${m.timing}`).join('\n')}

🚨 Red Flag Symptoms:
${s.redFlagWarningSymptoms.map((w) => `• ${w}`).join('\n')}

📅 Follow-Up:
${s.followUpTimeline}

(Powered by TrackMe AI Clinical Scribe)
`.trim();

    await Clipboard.setStringAsync(text);
    showToast('📋 Formatted Summary Copied to Clipboard!');

    Alert.alert('Share Consultation', 'Summary copied! Would you like to open WhatsApp to share with family?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'Open WhatsApp',
        onPress: () => {
          void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
            void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {});
          });
        },
      },
    ]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
                <MaterialIcons name="mic" size={22} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>AI Doctor Voice Recorder</Text>
                <Text style={styles.subtitle}>
                  Live Consultation Scribe, Advice & Prescription Summary
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

          {/* FAMILY MEMBERS SELECTOR */}
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
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUB-TABS (RECORD vs HISTORY) */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('RECORD');
              }}
              style={[styles.tabBtn, activeTab === 'RECORD' && styles.tabBtnActive]}>
              <MaterialIcons
                name="mic"
                size={16}
                color={activeTab === 'RECORD' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'RECORD' && styles.tabBtnTextActive,
                ]}>
                Record & Summarize
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('HISTORY');
              }}
              style={[styles.tabBtn, activeTab === 'HISTORY' && styles.tabBtnActive]}>
              <MaterialIcons
                name="history-edu"
                size={16}
                color={activeTab === 'HISTORY' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'HISTORY' && styles.tabBtnTextActive,
                ]}>
                Saved Summaries ({memberConsultations.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN BODY SCROLL */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {activeTab === 'RECORD' ? (
              /* TAB 1: RECORD & TRANSCRIBE */
              <View style={styles.sectionWrap}>
                {/* Visualizer & Recorder HUD */}
                <View style={styles.recorderHud}>
                  <View style={styles.timerBadge}>
                    <View style={[styles.pulseRedDot, isRecording && styles.pulseDotBlink]} />
                    <Text style={styles.timerText}>
                      {isRecording ? 'LIVE RECORDING' : recordedUri ? 'AUDIO READY' : 'STANDBY'} • {formatTimer(recordDuration)}
                    </Text>
                  </View>

                  {/* Waveform graphic bars */}
                  <View style={styles.waveformContainer}>
                    {[40, 65, 85, 30, 95, 110, 45, 80, 105, 60, 90, 75, 45, 95, 60, 35].map(
                      (height, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.waveBar,
                            {
                              height: isRecording ? Math.max(12, height * (0.4 + (idx % 3) * 0.3)) : 8,
                              backgroundColor: isRecording ? '#38BDF8' : 'rgba(255,255,255,0.15)',
                            },
                          ]}
                        />
                      )
                    )}
                  </View>

                  {/* Record Control Buttons */}
                  <View style={styles.recorderControls}>
                    {!isRecording ? (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={startRecording}
                        style={styles.startRecordBtn}>
                        <MaterialIcons name="mic" size={24} color="#101416" />
                        <Text style={styles.startRecordText}>
                          {recordedUri ? 'Record Again' : 'Start Consultation Recording'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={stopRecording}
                        style={styles.stopRecordBtn}>
                        <MaterialIcons name="stop" size={24} color="#FFFFFF" />
                        <Text style={styles.stopRecordText}>Stop & Finalize Audio</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Consultation Details Input Form */}
                <View style={styles.formCard}>
                  <Text style={styles.formSectionHeader}>CONSULTATION METADATA</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Doctor Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={doctorName}
                      onChangeText={setDoctorName}
                      placeholder="e.g. Prof. Dr. M. A. Rahman"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Medical Specialty</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.specialtyScroll}>
                      {SPECIALTY_PRESETS.map((spec) => (
                        <TouchableOpacity
                          key={spec}
                          onPress={() => setSpecialty(spec)}
                          style={[
                            styles.specChip,
                            specialty === spec && styles.specChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.specChipText,
                              specialty === spec && styles.specChipTextActive,
                            ]}>
                            {spec}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hospital or Chamber</Text>
                    <TextInput
                      style={styles.textInput}
                      value={hospitalOrClinic}
                      onChangeText={setHospitalOrClinic}
                      placeholder="e.g. National Heart Foundation, Dhaka"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Additional Doctor Notes / Typed Complaints (Optional)
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      multiline
                      numberOfLines={3}
                      value={typedNotes}
                      onChangeText={setTypedNotes}
                      placeholder="Type key discussion points if audio was brief (e.g. Advised low salt, prescribed Olmesartan 20mg for BP, review in 2 weeks)..."
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  {/* Summarize Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={isProcessing}
                    onPress={handleProcessConsultation}
                    style={styles.processAiBtn}>
                    {isProcessing ? (
                      <>
                        <ActivityIndicator size="small" color="#101416" />
                        <Text style={styles.processAiBtnText}>
                          Gemini Clinical AI Analyzing Consultation...
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="auto-awesome" size={20} color="#101416" />
                        <Text style={styles.processAiBtnText}>
                          Transcribe & Generate Clinical Summary
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* TAB 2: SAVED CONSULTATIONS & STRUCTURED BREAKDOWN */
              <View style={styles.sectionWrap}>
                {memberConsultations.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="mic-off" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Recorded Consultations</Text>
                    <Text style={styles.emptySub}>
                      Tap "Record & Summarize" to capture your next doctor visit discussion.
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Consultation Selector Pills */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.consultationScroll}>
                      {memberConsultations.map((rec) => {
                        const isSelected = selectedConsultation?.id === rec.id;
                        return (
                          <TouchableOpacity
                            key={rec.id}
                            onPress={() => {
                              void Haptics.selectionAsync().catch(() => {});
                              setSelectedConsultation(rec);
                            }}
                            style={[
                              styles.consultationPill,
                              isSelected && styles.consultationPillActive,
                            ]}>
                            <MaterialIcons
                              name="record-voice-over"
                              size={16}
                              color={isSelected ? '#38BDF8' : C.onSurfaceVariant}
                            />
                            <View>
                              <Text
                                style={[
                                  styles.consultationPillTitle,
                                  isSelected && styles.consultationPillTitleActive,
                                ]}
                                numberOfLines={1}>
                                {rec.doctorName}
                              </Text>
                              <Text style={styles.consultationPillDate}>
                                {rec.recordedAt.split('T')[0]} • {rec.specialty || 'General'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Selected Consultation Detailed Summary Card */}
                    {selectedConsultation && selectedConsultation.summary && (
                      <View style={styles.summaryDossier}>
                        {/* Header Hero */}
                        <View style={styles.dossierHero}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dossierTitle}>
                              {selectedConsultation.title}
                            </Text>
                            <Text style={styles.dossierSub}>
                              {selectedConsultation.doctorName} • {selectedConsultation.hospitalOrClinic}
                            </Text>
                            <Text style={styles.dossierDate}>
                              Recorded on {selectedConsultation.recordedAt.split('T')[0]} ({formatTimer(selectedConsultation.durationSeconds)})
                            </Text>
                          </View>

                          <View style={styles.dossierActions}>
                            <TouchableOpacity
                              onPress={() => handleShareSummary(selectedConsultation)}
                              style={styles.shareIconBtn}>
                              <MaterialIcons name="share" size={16} color="#38BDF8" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => deleteConsultationRecording(selectedConsultation.id)}
                              style={styles.deleteIconBtn}>
                              <MaterialIcons name="delete-outline" size={16} color="#F43F5E" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* AI Clinical Insight Banner */}
                        <View style={styles.insightBanner}>
                          <MaterialIcons name="psychology" size={20} color="#38BDF8" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.insightTitle}>AI CLINICAL INSIGHT</Text>
                            <Text style={styles.insightBody}>
                              {selectedConsultation.summary.aiClinicalInsight}
                            </Text>
                          </View>
                        </View>

                        {/* 1. Doctor Assessment & Diagnosis */}
                        <View style={styles.dossierSection}>
                          <View style={styles.sectionHeaderRow}>
                            <MaterialIcons name="local-hospital" size={16} color="#20C997" />
                            <Text style={[styles.sectionHeading, { color: '#20C997' }]}>
                              DIAGNOSIS & CLINICAL ASSESSMENT
                            </Text>
                          </View>
                          <Text style={styles.diagnosisHighlight}>
                            {selectedConsultation.summary.doctorDiagnosis}
                          </Text>
                        </View>

                        {/* 2. Key Advice Points */}
                        <View style={styles.dossierSection}>
                          <View style={styles.sectionHeaderRow}>
                            <MaterialIcons name="lightbulb" size={16} color="#FCC419" />
                            <Text style={[styles.sectionHeading, { color: '#FCC419' }]}>
                              DOCTOR'S KEY ADVICE & INSTRUCTIONS
                            </Text>
                          </View>
                          {selectedConsultation.summary.keyAdvicePoints.map((pt, i) => (
                            <View key={i} style={styles.bulletItem}>
                              <Text style={styles.bulletSymbol}>•</Text>
                              <Text style={styles.bulletText}>{pt}</Text>
                            </View>
                          ))}
                        </View>

                        {/* 3. Diet & Lifestyle Restrictions */}
                        <View style={styles.dossierSection}>
                          <View style={styles.sectionHeaderRow}>
                            <MaterialIcons name="restaurant" size={16} color="#FF922B" />
                            <Text style={[styles.sectionHeading, { color: '#FF922B' }]}>
                              DIET & LIFESTYLE RESTRICTIONS
                            </Text>
                          </View>
                          {selectedConsultation.summary.dietAndLifestyleRestrictions.map((d, i) => (
                            <View key={i} style={styles.bulletItem}>
                              <Text style={styles.bulletText}>{d}</Text>
                            </View>
                          ))}
                        </View>

                        {/* 4. Prescribed Medicines */}
                        <View style={styles.dossierSection}>
                          <View style={styles.sectionHeaderRow}>
                            <MaterialIcons name="medication" size={16} color="#38BDF8" />
                            <Text style={[styles.sectionHeading, { color: '#38BDF8' }]}>
                              PRESCRIBED MEDICATIONS ({selectedConsultation.summary.medicationInstructions.length})
                            </Text>
                          </View>
                          {selectedConsultation.summary.medicationInstructions.map((m, i) => (
                            <View key={i} style={styles.medCardItem}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.medCardTitle}>{m.medicineName}</Text>
                                <Text style={styles.medCardDosage}>
                                  {m.dosage} • {m.timing} {m.duration ? `(${m.duration})` : ''}
                                </Text>
                                {m.notes ? <Text style={styles.medCardNotes}>{m.notes}</Text> : null}
                              </View>
                            </View>
                          ))}
                        </View>

                        {/* 5. Advised Investigations */}
                        {selectedConsultation.summary.advisedInvestigations.length > 0 && (
                          <View style={styles.dossierSection}>
                            <View style={styles.sectionHeaderRow}>
                              <MaterialIcons name="biotech" size={16} color="#A78BFA" />
                              <Text style={[styles.sectionHeading, { color: '#A78BFA' }]}>
                                ADVISED LAB & DIAGNOSTIC TESTS
                              </Text>
                            </View>
                            <View style={styles.testTagsRow}>
                              {selectedConsultation.summary.advisedInvestigations.map((t, i) => (
                                <View key={i} style={styles.testTag}>
                                  <Text style={styles.testTagText}>{t}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* 6. Red Flag Warning Symptoms (Urgent Alert) */}
                        {selectedConsultation.summary.redFlagWarningSymptoms.length > 0 && (
                          <View style={styles.redFlagCard}>
                            <View style={styles.sectionHeaderRow}>
                              <MaterialIcons name="crisis-alert" size={18} color="#FF6B6B" />
                              <Text style={[styles.sectionHeading, { color: '#FF6B6B' }]}>
                                RED FLAG EMERGENCY SYMPTOMS
                              </Text>
                            </View>
                            {selectedConsultation.summary.redFlagWarningSymptoms.map((w, i) => (
                              <View key={i} style={styles.redFlagItem}>
                                <Text style={styles.redFlagText}>{w}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* 7. Follow-Up Timeline */}
                        <View style={styles.followUpCard}>
                          <MaterialIcons name="calendar-month" size={18} color="#38BDF8" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.followUpTitle}>RECOMMENDED FOLLOW-UP</Text>
                            <Text style={styles.followUpSub}>
                              {selectedConsultation.summary.followUpTimeline}
                            </Text>
                          </View>
                        </View>

                        {/* Sync to Timeline 1-Tap Action */}
                        <TouchableOpacity
                          activeOpacity={0.88}
                          disabled={selectedConsultation.isSyncedToTimeline}
                          onPress={() => handleSyncToTimeline(selectedConsultation)}
                          style={[
                            styles.syncTimelineBtn,
                            selectedConsultation.isSyncedToTimeline && styles.syncTimelineBtnDisabled,
                          ]}>
                          <MaterialIcons
                            name={selectedConsultation.isSyncedToTimeline ? 'check-circle' : 'sync'}
                            size={18}
                            color={selectedConsultation.isSyncedToTimeline ? '#20C997' : '#101416'}
                          />
                          <Text
                            style={[
                              styles.syncTimelineBtnText,
                              selectedConsultation.isSyncedToTimeline && { color: '#20C997' },
                            ]}>
                            {selectedConsultation.isSyncedToTimeline
                              ? 'Synced to Medical Timeline & Cabinet'
                              : '1-Tap Sync to Timeline & Medicine Cabinet'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
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
    gap: 10,
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
    fontSize: 12,
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
  recorderHud: {
    backgroundColor: '#141A1D',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
  },
  pulseDotBlink: {
    backgroundColor: '#20C997',
  },
  timerText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    width: '100%',
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  recorderControls: {
    width: '100%',
  },
  startRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 12,
  },
  startRecordText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#101416',
  },
  stopRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F43F5E',
    paddingVertical: 12,
    borderRadius: 12,
  },
  stopRecordText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  formSectionHeader: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: '#101416',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: F.regular,
    fontSize: 13,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  specialtyScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#101416',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  specChipText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  specChipTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  processAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
  },
  processAiBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
  emptyBox: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  consultationScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  consultationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  consultationPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  consultationPillTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  consultationPillTitleActive: {
    color: '#38BDF8',
  },
  consultationPillDate: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  summaryDossier: {
    backgroundColor: '#181F23',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dossierHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  dossierTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  dossierSub: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
  },
  dossierDate: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  dossierActions: {
    flexDirection: 'row',
    gap: 6,
  },
  shareIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#101416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  insightTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  insightBody: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 2,
    lineHeight: 17,
  },
  dossierSection: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  diagnosisHighlight: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    backgroundColor: '#101416',
    padding: 10,
    borderRadius: 10,
    lineHeight: 18,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 2,
  },
  bulletSymbol: {
    color: '#FCC419',
    fontSize: 14,
    lineHeight: 17,
  },
  bulletText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 17,
  },
  medCardItem: {
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  medCardTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  medCardDosage: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },
  medCardNotes: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  testTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  testTag: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testTagText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#A78BFA',
  },
  redFlagCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  redFlagItem: {
    paddingVertical: 2,
  },
  redFlagText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#FF6B6B',
    lineHeight: 17,
  },
  followUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#101416',
    borderRadius: 12,
    padding: 12,
  },
  followUpTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  followUpSub: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  syncTimelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
  },
  syncTimelineBtnDisabled: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    borderWidth: 1,
    borderColor: '#20C997',
  },
  syncTimelineBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
});
