import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
import { SURGERY_CATEGORIES } from '@/services/surgery-recovery-knowledge';
import {
  calculatePostOpDay,
  calculateStitchRemovalSchedule,
  compile14DayRoadmap,
  evaluateWoundInfectionRisk,
} from '@/services/surgery-recovery-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import {
  StitchType,
  SurgeryCategory,
  WoundSymptomLog,
} from '@/types/surgery-recovery';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'ROADMAP' | 'STITCH_CARE' | 'INFECTION_SCREENER' | 'LIFESTYLE_RULES';

interface SurgeryRecoveryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SurgeryRecoveryModal({
  visible,
  onClose,
}: SurgeryRecoveryModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);

  const initialMember =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMember);

  const [activeTab, setActiveTab] = useState<MainTab>('ROADMAP');

  // Surgery Config State
  const [surgeryCategory, setSurgeryCategory] = useState<SurgeryCategory>('C_SECTION');
  const [surgeryDate, setSurgeryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 5); // Default: 5 days ago (Day 6)
    return d.toISOString().split('T')[0];
  });
  const [hospitalName, setHospitalName] = useState('Square Hospital, Dhaka');
  const [surgeonName, setSurgeonName] = useState('Prof. Dr. M. A. Rahman');
  const [surgeonPhone, setSurgeonPhone] = useState('+880 1711-234567');
  const [stitchType, setStitchType] = useState<StitchType>('NON_ABSORBABLE_STITCH');
  const [isStitchRemoved, setIsStitchRemoved] = useState(false);
  const [selectedDayView, setSelectedDayView] = useState<number | null>(null);

  // Infection Screener State
  const [symptoms, setSymptoms] = useState<WoundSymptomLog>({
    hasPusOrDischarge: false,
    hasSpreadingRedness: false,
    hasFeverOver100_4F: false,
    hasWoundGapingOrPopping: false,
    hasSevereThrobbingPain: false,
    painScore: 3,
  });

  const activeMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) || members[0],
    [members, activeMemberId]
  );

  const currentPostOpDay = useMemo(
    () => calculatePostOpDay(surgeryDate),
    [surgeryDate]
  );

  const roadmapMilestones = useMemo(
    () => compile14DayRoadmap(surgeryCategory, surgeryDate),
    [surgeryCategory, surgeryDate]
  );

  const activeMilestone = useMemo(() => {
    const targetDay = selectedDayView || currentPostOpDay;
    return (
      roadmapMilestones.find((m) => m.dayNumber === targetDay) ||
      roadmapMilestones[Math.min(13, currentPostOpDay - 1)] ||
      roadmapMilestones[0]
    );
  }, [roadmapMilestones, selectedDayView, currentPostOpDay]);

  const stitchSchedule = useMemo(
    () => calculateStitchRemovalSchedule(surgeryCategory, surgeryDate, stitchType),
    [surgeryCategory, surgeryDate, stitchType]
  );

  const woundAssessment = useMemo(
    () => evaluateWoundInfectionRisk(symptoms),
    [symptoms]
  );

  const currentCategoryMeta =
    SURGERY_CATEGORIES.find((c) => c.category === surgeryCategory) || SURGERY_CATEGORIES[0];

  const handleCallSurgeon = () => {
    if (!surgeonPhone) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void Linking.openURL(`tel:${surgeonPhone}`).catch(() => {
      Alert.alert('কল করা সম্ভব হয়নি', `ফোন নম্বর: ${surgeonPhone}`);
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
                <MaterialIcons name="healing" size={24} color="#EF4444" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Post-Surgery Home Recovery
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  অপারেশন পরবর্তী রিকভারি ও সেলাই ট্র্যাকার
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
              onPress={() => setActiveTab('ROADMAP')}
              style={[styles.tabBtn, activeTab === 'ROADMAP' && styles.tabBtnActive]}>
              <MaterialIcons
                name="timeline"
                size={16}
                color={activeTab === 'ROADMAP' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'ROADMAP' && styles.tabBtnTextActive,
                ]}>
                📅 ১৪ দিনের রোডম্যাপ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('STITCH_CARE')}
              style={[styles.tabBtn, activeTab === 'STITCH_CARE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="content-cut"
                size={16}
                color={activeTab === 'STITCH_CARE' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'STITCH_CARE' && styles.tabBtnTextActive,
                ]}>
                🧵 সেলাই কাটা
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('INFECTION_SCREENER')}
              style={[
                styles.tabBtn,
                activeTab === 'INFECTION_SCREENER' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="warning"
                size={16}
                color={activeTab === 'INFECTION_SCREENER' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'INFECTION_SCREENER' && styles.tabBtnTextActive,
                ]}>
                🚨 ইনফেকশন স্ক্রিনার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('LIFESTYLE_RULES')}
              style={[
                styles.tabBtn,
                activeTab === 'LIFESTYLE_RULES' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="verified-user"
                size={16}
                color={activeTab === 'LIFESTYLE_RULES' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'LIFESTYLE_RULES' && styles.tabBtnTextActive,
                ]}>
                🛡️ সতর্কতা
              </Text>
            </TouchableOpacity>
          </View>

          {/* FAMILY MEMBER BAR */}
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
                        backgroundColor: '#EF4444',
                        borderColor: '#EF4444',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#FFFFFF', fontFamily: F.bold },
                      ]}>
                      {m.name} ({m.relation})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MAIN CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Surgery Type & Date Configuration Header */}
            <View style={styles.configCard}>
              <Text style={styles.configLabel}>অপারেশনের ধরন নির্বাচন করুন:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catScroll}>
                {SURGERY_CATEGORIES.map((cat) => {
                  const isSelected = surgeryCategory === cat.category;
                  return (
                    <TouchableOpacity
                      key={cat.category}
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setSurgeryCategory(cat.category);
                      }}
                      style={[
                        styles.catChip,
                        isSelected && styles.catChipActive,
                      ]}>
                      <MaterialIcons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? '#EF4444' : C.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          isSelected && styles.catChipTextActive,
                        ]}>
                        {cat.nameBn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.configRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.configSubLabel}>অপারেশনের তারিখ:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={surgeryDate}
                    onChangeText={setSurgeryDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.configSubLabel}>সার্জন / ডাক্তার:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={surgeonName}
                    onChangeText={setSurgeonName}
                    placeholder="Surgeon Name"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>

            {/* ========================================================================= */}
            {/* TAB 1: 14-DAY RECOVERY ROADMAP */}
            {/* ========================================================================= */}
            {activeTab === 'ROADMAP' && (
              <>
                {/* Current Post-Op Day Hero Banner */}
                <View style={styles.dayHeroCard}>
                  <View style={styles.dayHeroBadge}>
                    <Text style={styles.dayHeroBadgeText}>
                      দিন {currentPostOpDay > 14 ? '১৪+' : currentPostOpDay}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayHeroTitle}>
                      {currentPostOpDay > 14
                        ? '২ সপ্তাহের পূর্ণাঙ্গ রিকভারি সম্পন্ন'
                        : `আজ অপারেশনের ${currentPostOpDay}ম দিন`}
                    </Text>
                    <Text style={styles.dayHeroSub}>
                      {activeMilestone.phaseTitleBn}
                    </Text>
                  </View>
                </View>

                {/* Day selector carousel 1-14 */}
                <View style={styles.dayCarouselWrap}>
                  <Text style={styles.sectionTitle}>
                    ১ থেকে ১৪ দিনের রোডম্যাপ সিলেক্টর:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayCarouselScroll}>
                    {roadmapMilestones.map((m) => {
                      const isToday = m.dayNumber === currentPostOpDay;
                      const isSelected = (selectedDayView || currentPostOpDay) === m.dayNumber;
                      return (
                        <TouchableOpacity
                          key={m.dayNumber}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setSelectedDayView(m.dayNumber);
                          }}
                          style={[
                            styles.dayBox,
                            isSelected && styles.dayBoxSelected,
                            isToday && styles.dayBoxToday,
                          ]}>
                          <Text
                            style={[
                              styles.dayBoxNumber,
                              isSelected && styles.dayBoxNumberSelected,
                            ]}>
                            দিন {m.dayNumber}
                          </Text>
                          {isToday && (
                            <View style={styles.todayIndicator}>
                              <Text style={styles.todayIndicatorText}>আজ</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Active Selected Day Detailed Milestone Card */}
                <View style={styles.milestoneCard}>
                  <View style={styles.milestoneCardHeader}>
                    <MaterialIcons name="event-note" size={20} color="#EF4444" />
                    <Text style={styles.milestoneCardTitle}>
                      দিন {activeMilestone.dayNumber}: {activeMilestone.phaseTitleBn}
                    </Text>
                  </View>

                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneLabel}>🎯 মূল লক্ষ্য ও পরিচর্যা:</Text>
                    <Text style={styles.milestoneValue}>
                      {activeMilestone.keyFocusBn}
                    </Text>
                  </View>

                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneLabel}>🩹 ড্রেসিং ও গোসলের নিয়ম:</Text>
                    <Text style={styles.milestoneValue}>
                      {activeMilestone.dressingAndShowerRuleBn}
                    </Text>
                  </View>

                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneLabel}>🩺 ব্যথার অনুভূতি ও প্রত্যাশা:</Text>
                    <Text style={styles.milestoneValue}>
                      {activeMilestone.painExpectationBn}
                    </Text>
                  </View>

                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneLabel}>🚶 চলাফেরা ও অ্যাক্টিভিটি:</Text>
                    <Text style={styles.milestoneValue}>
                      {activeMilestone.activityLevelBn}
                    </Text>
                  </View>

                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneLabel}>🥗 দ্রুত নিরাময়ে খাদ্য পরামর্শ:</Text>
                    <Text style={styles.milestoneValue}>
                      {activeMilestone.nutritionTipBn}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: STITCH REMOVAL & CARE COUNTDOWN */}
            {/* ========================================================================= */}
            {activeTab === 'STITCH_CARE' && (
              <>
                {/* Stitch Type Selector */}
                <View style={styles.stitchConfigCard}>
                  <Text style={styles.sectionTitle}>সেলাইয়ের ধরন (Stitch Type):</Text>
                  <View style={styles.stitchTypeGrid}>
                    <TouchableOpacity
                      onPress={() => setStitchType('NON_ABSORBABLE_STITCH')}
                      style={[
                        styles.stitchTypeBtn,
                        stitchType === 'NON_ABSORBABLE_STITCH' && styles.stitchTypeBtnActive,
                      ]}>
                      <Text style={styles.stitchTypeBtnText}>🧵 সাধারণ সুতা (কাটতে হবে)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setStitchType('SURGICAL_STAPLES')}
                      style={[
                        styles.stitchTypeBtn,
                        stitchType === 'SURGICAL_STAPLES' && styles.stitchTypeBtnActive,
                      ]}>
                      <Text style={styles.stitchTypeBtnText}>📎 মেটাল স্ট্যাপলার পিন</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setStitchType('ABSORBABLE_STITCH')}
                      style={[
                        styles.stitchTypeBtn,
                        stitchType === 'ABSORBABLE_STITCH' && styles.stitchTypeBtnActive,
                      ]}>
                      <Text style={styles.stitchTypeBtnText}>✨ গলে যাওয়া সুতা (কাটা লাগে না)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setStitchType('DERMABOND_GLUE')}
                      style={[
                        styles.stitchTypeBtn,
                        stitchType === 'DERMABOND_GLUE' && styles.stitchTypeBtnActive,
                      ]}>
                      <Text style={styles.stitchTypeBtnText}>🧴 স্কিন গ্লু / আঠা</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Suture Countdown Hero Card */}
                {stitchSchedule.requiresRemoval ? (
                  <View style={styles.sutureHeroCard}>
                    <MaterialIcons name="content-cut" size={28} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sutureHeroTitle}>
                        {isStitchRemoved
                          ? '✅ সেলাই কাটা সম্পন্ন হয়েছে'
                          : stitchSchedule.isPassed
                            ? '⚠️ সেলাই কাটার তারিখ পার হয়ে গেছে'
                            : `আর ${stitchSchedule.daysRemaining} দিন পর সেলাই কাটার সম্ভাব্য তারিখ`}
                      </Text>
                      <Text style={styles.sutureHeroSub}>
                        তারিখ: {stitchSchedule.targetDateStr} (অপারেশনের {stitchSchedule.recommendedDay}ম দিন)
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        ).catch(() => {});
                        setIsStitchRemoved(!isStitchRemoved);
                      }}
                      style={[
                        styles.markStitchDoneBtn,
                        isStitchRemoved && styles.markStitchDoneBtnActive,
                      ]}>
                      <MaterialIcons
                        name={isStitchRemoved ? 'check' : 'done-all'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.markStitchDoneText}>
                        {isStitchRemoved ? 'সম্পন্ন' : 'কাটা হয়েছে'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.dissolvableNoticeCard}>
                    <MaterialIcons name="check-circle" size={24} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dissolvableTitle}>
                        সেলাই কাটার প্রয়োজন নেই
                      </Text>
                      <Text style={styles.dissolvableSub}>
                        আপনার সেলাইয়ে স্বয়ংক্রিয়ভাবে গলে যাওয়া সুতা (Absorbable Suture) বা
                        মেডিকেল আঠা ব্যবহৃত হয়েছে, যা ২-৩ সপ্তাহের মধ্যে চামড়ার সাথে মিশে যায়।
                      </Text>
                    </View>
                  </View>
                )}

                {/* Surgeon Contact & Appointment Card */}
                <View style={styles.surgeonContactCard}>
                  <View style={styles.surgeonTop}>
                    <View style={styles.docAvatar}>
                      <MaterialIcons name="person" size={24} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName}>{surgeonName}</Text>
                      <Text style={styles.docHosp}>{hospitalName}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleCallSurgeon}
                    style={styles.callSurgeonBtn}>
                    <MaterialIcons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.callSurgeonText}>
                      সার্জনকে সরাসরি কল করুন ({surgeonPhone})
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: INFECTION RISK SCREENER */}
            {/* ========================================================================= */}
            {activeTab === 'INFECTION_SCREENER' && (
              <>
                {/* Result Triage Banner */}
                <View
                  style={[
                    styles.triageBanner,
                    woundAssessment.grade === 'CRITICAL_RED_FLAG' && styles.triageCritical,
                    woundAssessment.grade === 'POSSIBLE_INFECTION' && styles.triageWarning,
                    woundAssessment.grade === 'MILD_REDNESS' && styles.triageMild,
                    woundAssessment.grade === 'HEALTHY_HEALING' && styles.triageHealthy,
                  ]}>
                  <Text style={styles.triageTitle}>{woundAssessment.titleBn}</Text>
                  <Text style={styles.triageSub}>{woundAssessment.summaryBn}</Text>

                  {woundAssessment.actionRecommendationsBn.map((act, i) => (
                    <Text key={i} style={styles.triageActionItem}>
                      • {act}
                    </Text>
                  ))}
                </View>

                {/* 5-Point Symptom Checklist */}
                <Text style={styles.sectionTitle}>
                  ক্ষতের লক্ষণ চেকলিস্ট (যে লক্ষণগুলো আছে তাতে টিক দিন):
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setSymptoms((s) => ({
                      ...s,
                      hasPusOrDischarge: !s.hasPusOrDischarge,
                    }));
                  }}
                  style={[
                    styles.symptomToggle,
                    symptoms.hasPusOrDischarge && styles.symptomToggleActive,
                  ]}>
                  <MaterialIcons
                    name={symptoms.hasPusOrDischarge ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={symptoms.hasPusOrDischarge ? '#EF4444' : C.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.symptomTitle}>
                      ১. ক্ষত থেকে পুঁজ বা হলুদ দুর্গন্ধযুক্ত রস বের হচ্ছে
                    </Text>
                    <Text style={styles.symptomSub}>
                      Pus / Yellowish foul-smelling drainage from incision
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setSymptoms((s) => ({
                      ...s,
                      hasSpreadingRedness: !s.hasSpreadingRedness,
                    }));
                  }}
                  style={[
                    styles.symptomToggle,
                    symptoms.hasSpreadingRedness && styles.symptomToggleActive,
                  ]}>
                  <MaterialIcons
                    name={symptoms.hasSpreadingRedness ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={symptoms.hasSpreadingRedness ? '#EF4444' : C.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.symptomTitle}>
                      ২. ক্ষতের চারপাশ অস্বাভাবিক লাল, গরম ও ফোলা
                    </Text>
                    <Text style={styles.symptomSub}>
                      Spreading redness, warmth & swelling around stitches
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setSymptoms((s) => ({
                      ...s,
                      hasFeverOver100_4F: !s.hasFeverOver100_4F,
                    }));
                  }}
                  style={[
                    styles.symptomToggle,
                    symptoms.hasFeverOver100_4F && styles.symptomToggleActive,
                  ]}>
                  <MaterialIcons
                    name={symptoms.hasFeverOver100_4F ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={symptoms.hasFeverOver100_4F ? '#EF4444' : C.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.symptomTitle}>
                      ৩. কাঁপুনি দিয়ে ১০০.৪°F বা ১০১°F এর বেশি জ্বর এসেছে
                    </Text>
                    <Text style={styles.symptomSub}>
                      High fever & chills indicating systemic infection
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setSymptoms((s) => ({
                      ...s,
                      hasWoundGapingOrPopping: !s.hasWoundGapingOrPopping,
                    }));
                  }}
                  style={[
                    styles.symptomToggle,
                    symptoms.hasWoundGapingOrPopping && styles.symptomToggleActive,
                  ]}>
                  <MaterialIcons
                    name={
                      symptoms.hasWoundGapingOrPopping
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color={symptoms.hasWoundGapingOrPopping ? '#EF4444' : C.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.symptomTitle}>
                      ৪. ক্ষতের মুখ ফাঁকা হয়ে গেছে বা সেলাই খুলে গেছে
                    </Text>
                    <Text style={styles.symptomSub}>
                      Wound edges separating / Suture popping open
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setSymptoms((s) => ({
                      ...s,
                      hasSevereThrobbingPain: !s.hasSevereThrobbingPain,
                    }));
                  }}
                  style={[
                    styles.symptomToggle,
                    symptoms.hasSevereThrobbingPain && styles.symptomToggleActive,
                  ]}>
                  <MaterialIcons
                    name={
                      symptoms.hasSevereThrobbingPain
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color={symptoms.hasSevereThrobbingPain ? '#EF4444' : C.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.symptomTitle}>
                      ৫. তীব্র দপদপানি ব্যথা যা ওষুধ খাওয়ার পরও কমছে না
                    </Text>
                    <Text style={styles.symptomSub}>
                      Severe throbbing pain not responding to prescribed pain relief
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: POST-OP LIFESTYLE GUIDELINES */}
            {/* ========================================================================= */}
            {activeTab === 'LIFESTYLE_RULES' && (
              <>
                <View style={styles.ruleCard}>
                  <MaterialIcons name="fitness-center" size={20} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleTitle}>১. ভারী ওজন তোলার সীমাবদ্ধতা</Text>
                    <Text style={styles.ruleBody}>
                      {currentCategoryMeta.liftingLimitBn} পেটের প্রেসার বাড়লে
                      ক্ষতের সেলাই ছিঁড়ে হার্নিয়ার ঝুঁকি বাড়ে।
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleCard}>
                  <MaterialIcons name="airline-seat-flat" size={20} color="#38BDF8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleTitle}>২. কাশি বা হাঁচি দেওয়ার বিশেষ নিয়ম (Splinting)</Text>
                    <Text style={styles.ruleBody}>
                      হাঁচি বা কাশির সময় পেটে একটি নরম বালিশ চেপে ধরে সাপোর্ট দিন। এতে ক্ষতের
                      সেলাইয়ে সরাসরি চাপ পড়বে না।
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleCard}>
                  <MaterialIcons name="water-drop" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleTitle}>৩. কোষ্ঠকাঠিন্য প্রতিরোধ</Text>
                    <Text style={styles.ruleBody}>
                      টয়লেটে অতিরিক্ত চাপ দেওয়া ক্ষতের জন্য মারাত্মক ক্ষতিকর। প্রতিদিন পর্যাপ্ত
                      পানি (২.৫-৩ লিটার), পাকা পেঁপে, বেল ও ইসুপগুলের ভুসি খান।
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleCard}>
                  <MaterialIcons name="bloodtype" size={20} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleTitle}>৪. ডায়াবেটিস রোগীদের ব্লাড সুগার লক্ষ্য</Text>
                    <Text style={styles.ruleBody}>
                      সুগার ১০ mmol/L এর উপরে থাকলে শ্বেত রক্তকণিকা কাজ করতে পারে না এবং ইনফেকশন
                      হয়। অপারেশনের পর সুগার ৬-৮ mmol/L এ রাখতে ইনসুলিন/ওষুধ নিয়মিত নিন।
                    </Text>
                  </View>
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
    width: 40,
    height: 40,
    borderRadius: 12,
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
  configCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  configLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  catScroll: {
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  catChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  catChipTextActive: {
    fontFamily: F.bold,
    color: '#EF4444',
  },
  configRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  configSubLabel: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginBottom: 2,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: C.onSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 11,
    fontFamily: F.regular,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayHeroCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dayHeroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeroBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  dayHeroTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#EF4444',
  },
  dayHeroSub: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
    marginTop: 2,
  },
  dayCarouselWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  dayCarouselScroll: {
    gap: 6,
  },
  dayBox: {
    width: 58,
    height: 52,
    borderRadius: 12,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayBoxSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  dayBoxNumber: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  dayBoxNumberSelected: {
    fontFamily: F.bold,
    color: '#EF4444',
  },
  todayIndicator: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  todayIndicatorText: {
    fontFamily: F.bold,
    fontSize: 7,
    color: '#FFFFFF',
  },
  milestoneCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  milestoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 8,
  },
  milestoneCardTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EF4444',
  },
  milestoneItem: {
    gap: 2,
  },
  milestoneLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  milestoneValue: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  stitchConfigCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  stitchTypeGrid: {
    gap: 6,
  },
  stitchTypeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stitchTypeBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  stitchTypeBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  sutureHeroCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sutureHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EF4444',
  },
  sutureHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
  },
  markStitchDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markStitchDoneBtnActive: {
    backgroundColor: '#10B981',
  },
  markStitchDoneText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  dissolvableNoticeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  dissolvableTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#10B981',
  },
  dissolvableSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 16,
  },
  surgeonContactCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  surgeonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  docHosp: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  callSurgeonBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callSurgeonText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  triageBanner: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
  },
  triageCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  triageWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  triageMild: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  triageHealthy: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  triageTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  triageSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  triageActionItem: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurface,
  },
  symptomToggle: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  symptomToggleActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
  },
  symptomTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  symptomSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  ruleCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ruleTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  ruleBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 3,
    lineHeight: 16,
  },
});
