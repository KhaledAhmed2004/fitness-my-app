import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
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
import { useChronicCareStore } from '@/stores/chronic-care-store';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import {
  ChronicProtocolType,
  PRESET_CHRONIC_PROTOCOLS,
  classifyBloodPressure,
  classifyBloodSugar,
} from '@/types/chronic-care';

const C = Vital.colors;
const F = Vital.fonts;

interface ChronicCareModalProps {
  visible: boolean;
  onClose: () => void;
  initialMemberId?: string;
  initialProtocolType?: ChronicProtocolType;
}

type TabType = 'TODAY_CARE' | 'PROTOCOLS' | 'HISTORY';

export function ChronicCareModal({
  visible,
  onClose,
  initialMemberId,
}: ChronicCareModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const t = useLanguageStore((s) => s.t);

  const defaultMember =
    initialMemberId ||
    (selectedMemberId !== 'ALL' ? selectedMemberId : members[0]?.id || 'mem_khaled');
  const [activeMemberId, setActiveMemberId] = useState(defaultMember);
  const [activeTab, setActiveTab] = useState<TabType>('TODAY_CARE');

  // Chronic Care Store Hooks
  const activeProtocolsMap = useChronicCareStore((s) => s.activeProtocols);
  const toggleProtocol = useChronicCareStore((s) => s.toggleProtocol);
  const logBloodSugar = useChronicCareStore((s) => s.logBloodSugar);
  const deleteBloodSugarLog = useChronicCareStore((s) => s.deleteBloodSugarLog);
  const logBloodPressure = useChronicCareStore((s) => s.logBloodPressure);
  const deleteBloodPressureLog = useChronicCareStore((s) => s.deleteBloodPressureLog);
  const toggleDietRule = useChronicCareStore((s) => s.toggleDietRule);
  const updateStepsCount = useChronicCareStore((s) => s.updateStepsCount);
  const getTodayProgress = useChronicCareStore((s) => s.getTodayProgress);
  const getSugarLogs = useChronicCareStore((s) => s.getSugarLogs);
  const getBpLogs = useChronicCareStore((s) => s.getBpLogs);
  const getAdherenceStats = useChronicCareStore((s) => s.getAdherenceStats);

  const currentMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) || members[0],
    [members, activeMemberId]
  );

  const activeProtocols = useMemo(() => {
    const list = activeProtocolsMap[activeMemberId] || [];
    return list.filter((p) => p.isActive);
  }, [activeProtocolsMap, activeMemberId]);

  const todayProgress = useMemo(
    () => getTodayProgress(activeMemberId),
    [getTodayProgress, activeMemberId, activeProtocolsMap]
  );

  const adherence = useMemo(
    () => getAdherenceStats(activeMemberId, 7),
    [getAdherenceStats, activeMemberId]
  );

  const sugarLogs = useMemo(
    () => getSugarLogs(activeMemberId, 15),
    [getSugarLogs, activeMemberId]
  );

  const bpLogs = useMemo(
    () => getBpLogs(activeMemberId, 15),
    [getBpLogs, activeMemberId]
  );

  // Forms State
  const [sugarInput, setSugarInput] = useState('');
  const [sugarType, setSugarType] = useState<'FASTING' | 'POST_MEAL_2H'>('FASTING');
  const [sugarNotes, setSugarNotes] = useState('');
  const [isLoggingSugar, setIsLoggingSugar] = useState(false);

  const [sysInput, setSysInput] = useState('');
  const [diaInput, setDiaInput] = useState('');
  const [pulseInput, setPulseInput] = useState('');
  const [bpNotes, setBpNotes] = useState('');
  const [isLoggingBp, setIsLoggingBp] = useState(false);

  const [historyCategory, setHistoryCategory] = useState<'SUGAR' | 'BP'>('SUGAR');

  // Handlers
  const handleToggleProtocol = async (type: ChronicProtocolType) => {
    await toggleProtocol(activeMemberId, type);
  };

  const handleSaveSugar = async () => {
    const val = parseFloat(sugarInput);
    if (isNaN(val) || val <= 0) return;

    await logBloodSugar({
      memberId: activeMemberId,
      protocolId: 'proto_diabetes_master',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      type: sugarType,
      valueMmol: val,
      notes: sugarNotes.trim() || undefined,
    });

    setSugarInput('');
    setSugarNotes('');
    setIsLoggingSugar(false);
  };

  const handleSaveBp = async () => {
    const sys = parseInt(sysInput, 10);
    const dia = parseInt(diaInput, 10);
    const pls = pulseInput ? parseInt(pulseInput, 10) : undefined;

    if (isNaN(sys) || isNaN(dia) || sys <= 40 || dia <= 30) return;

    await logBloodPressure({
      memberId: activeMemberId,
      protocolId: 'proto_hypertension_master',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      systolic: sys,
      diastolic: dia,
      pulse: pls,
      notes: bpNotes.trim() || undefined,
    });

    setSysInput('');
    setDiaInput('');
    setPulseInput('');
    setBpNotes('');
    setIsLoggingBp(false);
  };

  const handleStepAdjust = async (amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newSteps = Math.max(0, todayProgress.stepsCount + amount);
    await updateStepsCount(today, activeMemberId, newSteps);
  };

  const handleDietToggle = async (ruleId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await toggleDietRule(today, activeMemberId, ruleId);
  };

  // Compile active diet rules across all enabled protocols
  const combinedDietRules = useMemo(() => {
    const rules: Array<{
      rule: any;
      protocolTitle: string;
      protocolColor: string;
    }> = [];
    for (const proto of activeProtocols) {
      for (const r of proto.dietRules) {
        if (!rules.some((item) => item.rule.id === r.id)) {
          rules.push({
            rule: r,
            protocolTitle: proto.bengaliTitle,
            protocolColor: proto.color,
          });
        }
      }
    }
    return rules;
  }, [activeProtocols]);

  const latestSugar = sugarLogs[0];
  const latestBp = bpLogs[0];

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
                <MaterialIcons name="health-and-safety" size={22} color="#38BDF8" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {t('chronic_care_title', 'Chronic Disease Care Plans')}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {t('chronic_care_subtitle', 'ডায়াবেটিস, প্রেশার ও ফ্যাটি লিভার প্রটোকল')}
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

          {/* Member Picker */}
          <View style={styles.memberPickerWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.memberPickerScroll}>
              {members.map((m) => {
                const isSelected = m.id === activeMemberId;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.memberChip,
                      isSelected && styles.memberChipSelected,
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveMemberId(m.id);
                    }}>
                    <View
                      style={[
                        styles.memberAvatarDot,
                        { backgroundColor: m.avatarColor || '#38BDF8' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && styles.memberChipTextSelected,
                      ]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Top Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'TODAY_CARE' && styles.tabButtonActive]}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('TODAY_CARE');
              }}>
              <MaterialIcons
                name="today"
                size={16}
                color={activeTab === 'TODAY_CARE' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'TODAY_CARE' && styles.tabButtonTextActive,
                ]}>
                দৈনিক কেয়ার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'PROTOCOLS' && styles.tabButtonActive]}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('PROTOCOLS');
              }}>
              <MaterialIcons
                name="shield"
                size={16}
                color={activeTab === 'PROTOCOLS' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'PROTOCOLS' && styles.tabButtonTextActive,
                ]}>
                প্রটোকল সমূহ ({activeProtocols.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'HISTORY' && styles.tabButtonActive]}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('HISTORY');
              }}>
              <MaterialIcons
                name="show-chart"
                size={16}
                color={activeTab === 'HISTORY' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'HISTORY' && styles.tabButtonTextActive,
                ]}>
                হিস্ট্রি ও ট্রেন্ড
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollInner}
            showsVerticalScrollIndicator={false}>
            {/* ============================================================== */}
            {/* TAB 1: TODAY_CARE                                              */}
            {/* ============================================================== */}
            {activeTab === 'TODAY_CARE' && (
              <>
                {/* Adherence & Care Score Hero Bento */}
                <View style={styles.adherenceHero}>
                  <View style={styles.adherenceLeft}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scorePercent}>
                        {todayProgress.complianceScore}%
                      </Text>
                      <Text style={styles.scoreSub}>কেয়ার স্কোর</Text>
                    </View>
                  </View>

                  <View style={styles.adherenceRight}>
                    <View style={styles.streakBadge}>
                      <MaterialIcons name="local-fire-department" size={16} color="#FF7849" />
                      <Text style={styles.streakText}>
                        {adherence.streak} দিনের ধারাবাহিকতা
                      </Text>
                    </View>
                    <Text style={styles.adherenceTitle}>
                      {todayProgress.complianceScore >= 80
                        ? 'চমৎকার! আজ প্রটোকল খুব ভালোভাবে মানা হচ্ছে 🎉'
                        : 'আজকের নির্ধারিত সুগার লগ ও স্বাস্থ্য রুটিন সম্পন্ন করুন'}
                    </Text>
                    <Text style={styles.adherenceDesc}>
                      {currentMember?.name}-এর জন্য {activeProtocols.length}টি সক্রিয় প্রটোকল চলমান
                    </Text>
                  </View>
                </View>

                {/* 1. Fasting Blood Sugar Quick Card */}
                <View style={styles.actionCard}>
                  <View style={styles.actionCardHeader}>
                    <View
                      style={[
                        styles.actionIconBoxBase,
                        { backgroundColor: 'rgba(0, 180, 216, 0.15)' },
                      ]}>
                      <MaterialIcons name="water-drop" size={20} color="#00B4D8" />
                    </View>
                    <View style={styles.actionCardTextWrap}>
                      <Text style={styles.actionCardTitle}>খালি পেটে সুগার লগ (Fasting Glucose)</Text>
                      <Text style={styles.actionCardSub}>টার্গেট: ৪.০ – ৫.৬ mmol/L • প্রতিদিন সকালে</Text>
                    </View>
                    {todayProgress.sugarLogged ? (
                      <View style={styles.doneBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#51CF66" />
                        <Text style={styles.doneBadgeText}>{todayProgress.sugarValue} mmol/L</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.logActionBtnBase, { backgroundColor: '#00B4D8' }]}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setIsLoggingSugar(!isLoggingSugar);
                        }}>
                        <MaterialIcons name="add" size={16} color="#000" />
                        <Text style={styles.logActionBtnText}>লগ করুন</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Form toggle */}
                  {isLoggingSugar && (
                    <View style={styles.formContainer}>
                      <View style={styles.formRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>গ্লুকোজ রিডিং (mmol/L)</Text>
                          <TextInput
                            style={styles.numericInput}
                            placeholder="যেমন: 5.4"
                            placeholderTextColor={C.onSurfaceVariant}
                            keyboardType="numeric"
                            value={sugarInput}
                            onChangeText={setSugarInput}
                          />
                        </View>
                        <View style={styles.typeSelectorWrap}>
                          <Text style={styles.formLabel}>পরিমাপের সময়</Text>
                          <View style={styles.typeButtonsRow}>
                            <TouchableOpacity
                              style={[
                                styles.typeToggleBtn,
                                sugarType === 'FASTING' && styles.typeToggleBtnActive,
                              ]}
                              onPress={() => setSugarType('FASTING')}>
                              <Text
                                style={[
                                  styles.typeToggleBtnText,
                                  sugarType === 'FASTING' && styles.typeToggleBtnTextActive,
                                ]}>
                                খালি পেটে
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.typeToggleBtn,
                                sugarType === 'POST_MEAL_2H' && styles.typeToggleBtnActive,
                              ]}
                              onPress={() => setSugarType('POST_MEAL_2H')}>
                              <Text
                                style={[
                                  styles.typeToggleBtnText,
                                  sugarType === 'POST_MEAL_2H' && styles.typeToggleBtnTextActive,
                                ]}>
                                খাওয়ার ২ঘণ্টা পর
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Live preview badge */}
                      {sugarInput ? (
                        (() => {
                          const num = parseFloat(sugarInput);
                          if (isNaN(num)) return null;
                          const res = classifyBloodSugar(num, sugarType);
                          return (
                            <View style={[styles.classificationBox, { backgroundColor: res.badgeBg }]}>
                              <MaterialIcons name="info" size={16} color={res.color} />
                              <Text style={[styles.classificationText, { color: res.color }]}>
                                {res.bengaliLabel}: {res.advice}
                              </Text>
                            </View>
                          );
                        })()
                      ) : null}

                      <TextInput
                        style={styles.notesInput}
                        placeholder="অতিরিক্ত নোট (ঐচ্ছিক)"
                        placeholderTextColor={C.onSurfaceVariant}
                        value={sugarNotes}
                        onChangeText={setSugarNotes}
                      />

                      <View style={styles.formButtonsRow}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setIsLoggingSugar(false)}>
                          <Text style={styles.cancelBtnText}>বাতিল</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.saveBtnBase,
                            { backgroundColor: '#00B4D8' },
                            !sugarInput && styles.saveBtnDisabled,
                          ]}
                          disabled={!sugarInput}
                          onPress={handleSaveSugar}>
                          <Text style={styles.saveBtnText}>সেভ করুন</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Latest Log Display */}
                  {latestSugar && !isLoggingSugar && (
                    <View style={styles.readingSummaryRow}>
                      <Text style={styles.readingSummaryLabel}>সর্বশেষ রিডিং ({latestSugar.date}):</Text>
                      {(() => {
                        const cl = classifyBloodSugar(latestSugar.valueMmol, latestSugar.type);
                        return (
                          <View style={[styles.readingBadge, { backgroundColor: cl.badgeBg }]}>
                            <Text style={[styles.readingBadgeText, { color: cl.color }]}>
                              {latestSugar.valueMmol} mmol/L • {cl.bengaliLabel}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>

                {/* 2. Blood Pressure Logger Card */}
                <View style={styles.actionCard}>
                  <View style={styles.actionCardHeader}>
                    <View
                      style={[
                        styles.actionIconBoxBase,
                        { backgroundColor: 'rgba(244, 63, 94, 0.15)' },
                      ]}>
                      <MaterialIcons name="favorite" size={20} color="#F43F5E" />
                    </View>
                    <View style={styles.actionCardTextWrap}>
                      <Text style={styles.actionCardTitle}>রক্তচাপ পরিমাপ (Blood Pressure)</Text>
                      <Text style={styles.actionCardSub}>টার্গেট: &lt; ১২০/৮০ mmHg • সপ্তাহে ২ দিন</Text>
                    </View>
                    {todayProgress.bpLogged ? (
                      <View style={styles.doneBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#51CF66" />
                        <Text style={styles.doneBadgeText}>{todayProgress.bpValue}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.logActionBtnBase, { backgroundColor: '#F43F5E' }]}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setIsLoggingBp(!isLoggingBp);
                        }}>
                        <MaterialIcons name="add" size={16} color="#000" />
                        <Text style={styles.logActionBtnText}>লগ করুন</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* BP Form */}
                  {isLoggingBp && (
                    <View style={styles.formContainer}>
                      <View style={styles.formRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>সিস্টোলিক (উপরের)</Text>
                          <TextInput
                            style={styles.numericInput}
                            placeholder="যেমন: 120"
                            placeholderTextColor={C.onSurfaceVariant}
                            keyboardType="numeric"
                            value={sysInput}
                            onChangeText={setSysInput}
                          />
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={styles.formLabel}>ডায়াস্টোলিক (নিচের)</Text>
                          <TextInput
                            style={styles.numericInput}
                            placeholder="যেমন: 80"
                            placeholderTextColor={C.onSurfaceVariant}
                            keyboardType="numeric"
                            value={diaInput}
                            onChangeText={setDiaInput}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>পালস (ঐচ্ছিক)</Text>
                          <TextInput
                            style={styles.numericInput}
                            placeholder="72"
                            placeholderTextColor={C.onSurfaceVariant}
                            keyboardType="numeric"
                            value={pulseInput}
                            onChangeText={setPulseInput}
                          />
                        </View>
                      </View>

                      {/* Live BP preview */}
                      {sysInput && diaInput ? (
                        (() => {
                          const s = parseInt(sysInput, 10);
                          const d = parseInt(diaInput, 10);
                          if (isNaN(s) || isNaN(d)) return null;
                          const res = classifyBloodPressure(s, d);
                          return (
                            <View style={[styles.classificationBox, { backgroundColor: res.badgeBg }]}>
                              <MaterialIcons name="info" size={16} color={res.color} />
                              <Text style={[styles.classificationText, { color: res.color }]}>
                                {res.bengaliLabel}: {res.advice}
                              </Text>
                            </View>
                          );
                        })()
                      ) : null}

                      <TextInput
                        style={styles.notesInput}
                        placeholder="অতিরিক্ত নোট (যেমন: সকালে মাপার আগে ৫ মিনিট বিশ্রাম)"
                        placeholderTextColor={C.onSurfaceVariant}
                        value={bpNotes}
                        onChangeText={setBpNotes}
                      />

                      <View style={styles.formButtonsRow}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setIsLoggingBp(false)}>
                          <Text style={styles.cancelBtnText}>বাতিল</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.saveBtnBase,
                            { backgroundColor: '#F43F5E' },
                            (!sysInput || !diaInput) && styles.saveBtnDisabled,
                          ]}
                          disabled={!sysInput || !diaInput}
                          onPress={handleSaveBp}>
                          <Text style={styles.saveBtnText}>সেভ করুন</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {latestBp && !isLoggingBp && (
                    <View style={styles.readingSummaryRow}>
                      <Text style={styles.readingSummaryLabel}>সর্বশেষ রিডিং ({latestBp.date}):</Text>
                      {(() => {
                        const cl = classifyBloodPressure(latestBp.systolic, latestBp.diastolic);
                        return (
                          <View style={[styles.readingBadge, { backgroundColor: cl.badgeBg }]}>
                            <Text style={[styles.readingBadgeText, { color: cl.color }]}>
                              {latestBp.systolic}/{latestBp.diastolic} mmHg {latestBp.pulse ? `• ${latestBp.pulse} bpm` : ''} • {cl.bengaliLabel}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>

                {/* 3. 6,000 Steps Tracker Card */}
                <View style={styles.actionCard}>
                  <View style={styles.actionCardHeader}>
                    <View
                      style={[
                        styles.actionIconBoxBase,
                        { backgroundColor: 'rgba(255, 146, 43, 0.15)' },
                      ]}>
                      <MaterialIcons name="directions-walk" size={20} color="#FF922B" />
                    </View>
                    <View style={styles.actionCardTextWrap}>
                      <Text style={styles.actionCardTitle}>দৈনিক কদম ট্র্যাকার (Steps)</Text>
                      <Text style={styles.actionCardSub}>
                        টার্গেট: {todayProgress.stepsTarget.toLocaleString()} কদম • কার্ডিও ও ইনসুলিন এক্টিভেশন
                      </Text>
                    </View>
                    <View style={styles.stepsCountWrap}>
                      <Text style={styles.stepsCountBig}>
                        {todayProgress.stepsCount.toLocaleString()}
                      </Text>
                      <Text style={styles.stepsCountTotal}>
                        / {todayProgress.stepsTarget.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.round((todayProgress.stepsCount / todayProgress.stepsTarget) * 100)
                          )}%`,
                          backgroundColor: todayProgress.stepsCompleted ? '#51CF66' : '#FF922B',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.stepStepperRow}>
                    <Text style={styles.stepStepperLabel}>কদম অ্যাডজাস্ট:</Text>
                    <TouchableOpacity
                      style={styles.stepAddChip}
                      onPress={() => handleStepAdjust(500)}>
                      <Text style={styles.stepAddChipText}>+৫০০ কদম</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepAddChip}
                      onPress={() => handleStepAdjust(1000)}>
                      <Text style={styles.stepAddChipText}>+১,০০০ কদম</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepAddChip}
                      onPress={() => handleStepAdjust(2000)}>
                      <Text style={styles.stepAddChipText}>+২,০০০ কদম</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Disease Specific Nutrition & Checklist */}
                <View style={styles.checklistSection}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="restaurant-menu" size={18} color="#20C997" />
                    <Text style={styles.sectionTitle}>
                      নির্দিষ্ট খাদ্যাভ্যাস ও রুটিন চেকলিস্ট ({todayProgress.completedDietRuleIds.length}/{combinedDietRules.length || 5})
                    </Text>
                  </View>

                  {combinedDietRules.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyText}>কোনো প্রটোকল চালু নেই। নিচের থেকে ১-ট্যাপে প্রটোকল চালু করুন।</Text>
                    </View>
                  ) : (
                    combinedDietRules.map(({ rule, protocolTitle, protocolColor }) => {
                      const isCompleted = todayProgress.completedDietRuleIds.includes(rule.id);
                      return (
                        <TouchableOpacity
                          key={rule.id}
                          style={[
                            styles.dietRuleItem,
                            isCompleted && styles.dietRuleItemDone,
                          ]}
                          onPress={() => handleDietToggle(rule.id)}>
                          <View
                            style={[
                              styles.checkboxCircle,
                              isCompleted && {
                                backgroundColor: protocolColor || '#51CF66',
                                borderColor: protocolColor || '#51CF66',
                              },
                            ]}>
                            {isCompleted && (
                              <MaterialIcons name="check" size={14} color="#000" />
                            )}
                          </View>
                          <View style={styles.dietRuleContent}>
                            <View style={styles.dietRuleHeader}>
                              <Text
                                style={[
                                  styles.dietRuleTitle,
                                  isCompleted && styles.dietRuleTitleDone,
                                ]}>
                                {rule.bengaliTitle}
                              </Text>
                              <View
                                style={[
                                  styles.protocolTag,
                                  { backgroundColor: `${protocolColor}20` },
                                ]}>
                                <Text
                                  style={[
                                    styles.protocolTagText,
                                    { color: protocolColor },
                                  ]}>
                                  {protocolTitle}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.dietRuleDesc}>
                              {rule.bengaliDescription}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </>
            )}

            {/* ============================================================== */}
            {/* TAB 2: PROTOCOLS                                               */}
            {/* ============================================================== */}
            {activeTab === 'PROTOCOLS' && (
              <View style={styles.protocolsListContainer}>
                <Text style={styles.protocolsIntroText}>
                  {currentMember?.name}-এর জন্য ক্রনিক রোগ অনুযায়ী ১-ট্যাপে প্রটোকল চালু বা বন্ধ করুন:
                </Text>

                {Object.values(PRESET_CHRONIC_PROTOCOLS).map((proto) => {
                  const isEnabled = activeProtocols.some((p) => p.type === proto.type);
                  return (
                    <View
                      key={proto.type}
                      style={[
                        styles.protocolCard,
                        isEnabled && {
                          borderColor: proto.color,
                          backgroundColor: `${proto.color}08`,
                        },
                      ]}>
                      <View style={styles.protocolCardTop}>
                        <View
                          style={[
                            styles.protocolIconCircle,
                            { backgroundColor: proto.accentBg },
                          ]}>
                          <MaterialIcons
                            name={proto.icon as any}
                            size={24}
                            color={proto.color}
                          />
                        </View>
                        <View style={styles.protocolTitleWrap}>
                          <Text style={styles.protoCardTitle}>
                            {proto.bengaliTitle}
                          </Text>
                          <Text style={styles.protoCardEnglish}>
                            {proto.title}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.toggleStatusBtn,
                            isEnabled
                              ? { backgroundColor: proto.color }
                              : styles.toggleStatusBtnInactive,
                          ]}
                          onPress={() => handleToggleProtocol(proto.type)}>
                          <Text
                            style={[
                              styles.toggleStatusBtnText,
                              isEnabled && styles.toggleStatusBtnTextActive,
                            ]}>
                            {isEnabled ? 'চালু আছে' : 'চালু করুন'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.protoCardDesc}>
                        {proto.bengaliDescription}
                      </Text>

                      {/* Clinical Targets Chips */}
                      <View style={styles.targetsRow}>
                        {proto.type === 'DIABETES_MANAGEMENT' && (
                          <>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                🎯 খালি পেটে সুগার &lt; ৫.৬ mmol/L
                              </Text>
                            </View>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                👟 ৬,০০০ কদম
                              </Text>
                            </View>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                🩸 ৩ মাসে HbA1c টেস্ট
                              </Text>
                            </View>
                          </>
                        )}
                        {proto.type === 'HYPERTENSION_CONTROL' && (
                          <>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                🎯 প্রেশার &lt; ১২০/৮০ mmHg
                              </Text>
                            </View>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                🧂 পাতে কাঁচা লবণ নিষিদ্ধ
                              </Text>
                            </View>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                🩺 সপ্তাহে ২ দিন লগ
                              </Text>
                            </View>
                          </>
                        )}
                        {proto.type === 'FATTY_LIVER_REVERSAL' && (
                          <>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                ⏰ ১৪:১০ ফাস্টিং সিঙ্ক
                              </Text>
                            </View>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                🚫 ভাজাপোড়া বর্জন
                              </Text>
                            </View>
                            <View style={styles.targetChip}>
                              <Text style={styles.targetChipText}>
                                👟 ৭,০০০ কদম
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ============================================================== */}
            {/* TAB 3: HISTORY                                                 */}
            {/* ============================================================== */}
            {activeTab === 'HISTORY' && (
              <View style={styles.historyContainer}>
                {/* Category Switcher */}
                <View style={styles.historyCatRow}>
                  <TouchableOpacity
                    style={[
                      styles.historyCatBtn,
                      historyCategory === 'SUGAR' && styles.historyCatBtnActive,
                    ]}
                    onPress={() => setHistoryCategory('SUGAR')}>
                    <MaterialIcons
                      name="water-drop"
                      size={16}
                      color={historyCategory === 'SUGAR' ? '#00B4D8' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.historyCatBtnText,
                        historyCategory === 'SUGAR' && styles.historyCatBtnTextActive,
                      ]}>
                      সুগার হিস্ট্রি ({sugarLogs.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.historyCatBtn,
                      historyCategory === 'BP' && styles.historyCatBtnActive,
                    ]}
                    onPress={() => setHistoryCategory('BP')}>
                    <MaterialIcons
                      name="favorite"
                      size={16}
                      color={historyCategory === 'BP' ? '#F43F5E' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.historyCatBtnText,
                        historyCategory === 'BP' && styles.historyCatBtnTextActive,
                      ]}>
                      প্রেশার হিস্ট্রি ({bpLogs.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sugar History Table */}
                {historyCategory === 'SUGAR' && (
                  <View style={styles.historyList}>
                    {sugarLogs.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>এখনো কোনো সুগার লগ নেই।</Text>
                      </View>
                    ) : (
                      sugarLogs.map((log) => {
                        const cl = classifyBloodSugar(log.valueMmol, log.type);
                        return (
                          <View key={log.id} style={styles.historyItemCard}>
                            <View style={styles.historyItemLeft}>
                              <Text style={styles.historyValueBig}>
                                {log.valueMmol}{' '}
                                <Text style={styles.historyUnit}>mmol/L</Text>
                              </Text>
                              <Text style={styles.historyDateText}>
                                {log.date} • {log.time} •{' '}
                                {log.type === 'FASTING' ? 'খালি পেটে' : 'খাওয়ার পর'}
                              </Text>
                              {log.notes ? (
                                <Text style={styles.historyNotesText}>
                                  📝 {log.notes}
                                </Text>
                              ) : null}
                            </View>

                            <View style={styles.historyItemRight}>
                              <View
                                style={[
                                  styles.historyStatusBadge,
                                  { backgroundColor: cl.badgeBg },
                                ]}>
                                <Text
                                  style={[
                                    styles.historyStatusBadgeText,
                                    { color: cl.color },
                                  ]}>
                                  {cl.bengaliLabel}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.deleteLogBtn}
                                onPress={() => deleteBloodSugarLog(log.id)}>
                                <MaterialIcons
                                  name="delete-outline"
                                  size={16}
                                  color={C.onSurfaceVariant}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* BP History Table */}
                {historyCategory === 'BP' && (
                  <View style={styles.historyList}>
                    {bpLogs.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>এখনো কোনো রক্তচাপ লগ নেই।</Text>
                      </View>
                    ) : (
                      bpLogs.map((log) => {
                        const cl = classifyBloodPressure(log.systolic, log.diastolic);
                        return (
                          <View key={log.id} style={styles.historyItemCard}>
                            <View style={styles.historyItemLeft}>
                              <Text style={styles.historyValueBig}>
                                {log.systolic}/{log.diastolic}{' '}
                                <Text style={styles.historyUnit}>mmHg</Text>
                              </Text>
                              <Text style={styles.historyDateText}>
                                {log.date} • {log.time}{' '}
                                {log.pulse ? `• পালস: ${log.pulse} bpm` : ''}
                              </Text>
                              {log.notes ? (
                                <Text style={styles.historyNotesText}>
                                  📝 {log.notes}
                                </Text>
                              ) : null}
                            </View>

                            <View style={styles.historyItemRight}>
                              <View
                                style={[
                                  styles.historyStatusBadge,
                                  { backgroundColor: cl.badgeBg },
                                ]}>
                                <Text
                                  style={[
                                    styles.historyStatusBadgeText,
                                    { color: cl.color },
                                  ]}>
                                  {cl.bengaliLabel}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.deleteLogBtn}
                                onPress={() => deleteBloodPressureLog(log.id)}>
                                <MaterialIcons
                                  name="delete-outline"
                                  size={16}
                                  color={C.onSurfaceVariant}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.onSurface,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  memberPickerWrap: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  memberPickerScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  memberChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  memberAvatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  memberChipTextSelected: {
    color: C.onSurface,
    fontFamily: F.bold,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  tabButtonText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  tabButtonTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  adherenceHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  adherenceLeft: {
    marginRight: 16,
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercent: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#38BDF8',
  },
  scoreSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: -2,
  },
  adherenceRight: {
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 120, 73, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  streakText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FF7849',
  },
  adherenceTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
    lineHeight: 18,
  },
  adherenceDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBoxBase: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionCardTextWrap: {
    flex: 1,
  },
  actionCardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  actionCardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  doneBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#51CF66',
  },
  logActionBtnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  logActionBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#000',
  },
  formContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  numericInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.onSurface,
    fontFamily: F.bold,
    fontSize: 15,
  },
  typeSelectorWrap: {
    flex: 1.2,
    marginLeft: 10,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  typeToggleBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  typeToggleBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  typeToggleBtnTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  classificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  classificationText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: C.onSurface,
    fontFamily: F.regular,
    fontSize: 12,
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelBtnText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  saveBtnBase: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#000',
  },
  readingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  readingSummaryLabel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  readingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readingBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  stepsCountWrap: {
    alignItems: 'flex-end',
  },
  stepsCountBig: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FF922B',
  },
  stepsCountTotal: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  stepStepperLabel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginRight: 4,
  },
  stepAddChip: {
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepAddChipText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FF922B',
  },
  checklistSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  dietRuleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dietRuleItemDone: {
    backgroundColor: 'rgba(81, 207, 102, 0.06)',
    borderColor: 'rgba(81, 207, 102, 0.2)',
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  dietRuleContent: {
    flex: 1,
  },
  dietRuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dietRuleTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
    flex: 1,
  },
  dietRuleTitleDone: {
    textDecorationLine: 'line-through',
    color: C.onSurfaceVariant,
  },
  protocolTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  protocolTagText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  dietRuleDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 16,
  },
  protocolsListContainer: {
    gap: 14,
  },
  protocolsIntroText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  protocolCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 12,
  },
  protocolCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protocolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  protocolTitleWrap: {
    flex: 1,
  },
  protoCardTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.onSurface,
  },
  protoCardEnglish: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  toggleStatusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleStatusBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleStatusBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  toggleStatusBtnTextActive: {
    color: '#000',
  },
  protoCardDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    lineHeight: 18,
  },
  targetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  targetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  targetChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  historyContainer: {
    gap: 12,
  },
  historyCatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyCatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    gap: 6,
  },
  historyCatBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyCatBtnText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  historyCatBtnTextActive: {
    color: C.onSurface,
    fontFamily: F.bold,
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyValueBig: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.onSurface,
  },
  historyUnit: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  historyDateText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  historyNotesText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },
  historyItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyStatusBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  deleteLogBtn: {
    padding: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
});
