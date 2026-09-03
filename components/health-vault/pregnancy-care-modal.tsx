import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
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
import {
  DEFAULT_HOSPITAL_BAG_ITEMS,
  PREGNANCY_EMERGENCY_SIGNS,
  PREGNANCY_WEEKS_DATA,
} from '@/services/pregnancy-care-knowledge';
import {
  evaluateGdmAndBp,
  evaluateKickSession,
  formatPregnancyDoctorReport,
  getWeekMilestone,
} from '@/services/pregnancy-care-service';
import {
  HospitalBagItem,
  KickSession,
  PregnancyEmergencySignKey,
} from '@/types/pregnancy-care';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'WEEK_GROWTH' | 'KICK_COUNTER' | 'GDM_BP_SHIELD' | 'HOSPITAL_BAG';

interface PregnancyCareModalProps {
  visible: boolean;
  onClose: () => void;
  patientName?: string;
}

export function PregnancyCareModal({
  visible,
  onClose,
  patientName = 'মা ও শিশু',
}: PregnancyCareModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('WEEK_GROWTH');
  const [selectedWeek, setSelectedWeek] = useState<number>(28); // 3rd trimester start
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Kick Counter State
  const [currentKicks, setCurrentKicks] = useState<number>(7);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(1380); // 23 mins
  const [kickSessions, setKickSessions] = useState<KickSession[]>([
    {
      id: 'ks1',
      date: 'আজ (সকাল)',
      startTime: '০৮:৩০ AM',
      durationMinutes: 28,
      kickCount: 10,
      isCompleted: true,
      status: 'HEALTHY_ACTIVE',
      statusLabelBn: '🟢 শিশু অত্যন্ত চঞ্চল ও সুস্থ (২৮ মিনিট)',
    },
    {
      id: 'ks2',
      date: 'গতকাল (রাত)',
      startTime: '০৯:১৫ PM',
      durationMinutes: 42,
      kickCount: 10,
      isCompleted: true,
      status: 'HEALTHY_ACTIVE',
      statusLabelBn: '🟢 স্বাভাবিক সক্রিয়তা (৪২ মিনিট)',
    },
  ]);

  // GDM & BP State
  const [fastingSugarInput, setFastingSugarInput] = useState<string>('88');
  const [twoHourSugarInput, setTwoHourSugarInput] = useState<string>('125');
  const [systolicInput, setSystolicInput] = useState<string>('118');
  const [diastolicInput, setDiastolicInput] = useState<string>('76');

  // Hospital Bag State
  const [bagItems, setBagItems] = useState<HospitalBagItem[]>(DEFAULT_HOSPITAL_BAG_ITEMS);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Milestone Info
  const milestone = useMemo(() => {
    return getWeekMilestone(selectedWeek);
  }, [selectedWeek]);

  // GDM & BP Evaluation
  const gdmBpResult = useMemo(() => {
    const fbs = parseFloat(fastingSugarInput) || undefined;
    const s2h = parseFloat(twoHourSugarInput) || undefined;
    const sys = parseInt(systolicInput, 10) || undefined;
    const dia = parseInt(diastolicInput, 10) || undefined;
    return evaluateGdmAndBp(fbs, s2h, sys, dia);
  }, [fastingSugarInput, twoHourSugarInput, systolicInput, diastolicInput]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleRecordKick = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const nextKicks = currentKicks + 1;
    setCurrentKicks(nextKicks);

    if (nextKicks >= 10) {
      setIsTimerRunning(false);
      const durationMins = Math.max(1, Math.round(timerSeconds / 60));
      const evaluation = evaluateKickSession(nextKicks, durationMins);

      const newSession: KickSession = {
        id: `ks_${Date.now()}`,
        date: 'আজ',
        startTime: new Date().toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        durationMinutes: durationMins,
        kickCount: 10,
        isCompleted: true,
        status: evaluation.status,
        statusLabelBn: evaluation.labelBn,
      };

      setKickSessions((prev) => [newSession, ...prev]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast('🎉 ১০টি কিক সম্পন্ন হয়েছে!');
    }
  };

  const handleResetKickCounter = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentKicks(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    showToast('কিক কাউন্টার রিসেট হয়েছে 🔄');
  };

  const handleToggleBagItem = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setBagItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const handleCopyReport = async () => {
    const text = formatPregnancyDoctorReport(
      selectedWeek,
      milestone,
      kickSessions[0] || null,
      gdmBpResult,
      patientName
    );
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('গর্ভকালীন মেডিকেল রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatPregnancyDoctorReport(
      selectedWeek,
      milestone,
      kickSessions[0] || null,
      gdmBpResult,
      patientName
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="pregnant-woman" size={24} color="#EC4899" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Pregnancy Care & Kick Counter
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  গর্ভকালীন যত্ন ও বাচ্চার কিক ট্র্যাকার
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
              onPress={() => setActiveTab('WEEK_GROWTH')}
              style={[styles.tabBtn, activeTab === 'WEEK_GROWTH' && styles.tabBtnActive]}>
              <MaterialIcons
                name="child-care"
                size={16}
                color={activeTab === 'WEEK_GROWTH' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'WEEK_GROWTH' && styles.tabBtnTextActive,
                ]}>
                🌱 বৃদ্ধি ({selectedWeek} সপ্তাহ)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('KICK_COUNTER')}
              style={[styles.tabBtn, activeTab === 'KICK_COUNTER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="touch-app"
                size={16}
                color={activeTab === 'KICK_COUNTER' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'KICK_COUNTER' && styles.tabBtnTextActive,
                ]}>
                🦶 কিক কাউন্টার ({currentKicks}/১০)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('GDM_BP_SHIELD')}
              style={[styles.tabBtn, activeTab === 'GDM_BP_SHIELD' && styles.tabBtnActive]}>
              <MaterialIcons
                name="favorite"
                size={16}
                color={activeTab === 'GDM_BP_SHIELD' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'GDM_BP_SHIELD' && styles.tabBtnTextActive,
                ]}>
                🩸 সুগার ও প্রেশার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('HOSPITAL_BAG')}
              style={[styles.tabBtn, activeTab === 'HOSPITAL_BAG' && styles.tabBtnActive]}>
              <MaterialIcons
                name="shopping-bag"
                size={16}
                color={activeTab === 'HOSPITAL_BAG' ? '#EC4899' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'HOSPITAL_BAG' && styles.tabBtnTextActive,
                ]}>
                🎒 ডেলিভারি ব্যাগ
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
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
            {/* TAB 1: WEEK-BY-WEEK GROWTH & NUTRITION */}
            {/* ========================================================================= */}
            {activeTab === 'WEEK_GROWTH' && (
              <>
                {/* Week Selector Carousel */}
                <View style={styles.weekPickerCard}>
                  <Text style={styles.weekPickerLabel}>
                    গর্ভকালীন সপ্তাহ নির্বাচন করুন:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.weekPillsScroll}>
                    {PREGNANCY_WEEKS_DATA.map((w) => {
                      const isSelected = selectedWeek === w.weekNumber;
                      return (
                        <TouchableOpacity
                          key={w.weekNumber}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setSelectedWeek(w.weekNumber);
                          }}
                          style={[
                            styles.weekPill,
                            isSelected && styles.weekPillActive,
                          ]}>
                          <Text
                            style={[
                              styles.weekPillText,
                              isSelected && styles.weekPillTextActive,
                            ]}>
                            সপ্তাহ {w.weekNumber}
                          </Text>
                          <Text style={styles.weekPillFruit}>
                            {w.babyFruitSizeBn.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Baby Fruit Size Hero Card */}
                <View style={styles.babyHeroCard}>
                  <View style={styles.babyHeroTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.trimesterBadge}>
                        <Text style={styles.trimesterBadgeText}>
                          {milestone.trimester === 'FIRST_TRIMESTER'
                            ? '১ম ট্রাইমেস্টার (১-১২ সপ্তাহ)'
                            : milestone.trimester === 'SECOND_TRIMESTER'
                            ? '২য় ট্রাইমেস্টার (১৩-২৭ সপ্তাহ)'
                            : '৩য় ট্রাইমেস্টার (২৮-৪০ সপ্তাহ)'}
                        </Text>
                      </View>
                      <Text style={styles.babyFruitTitle}>
                        বাচ্চার আকার: {milestone.babyFruitSizeBn}
                      </Text>
                      <Text style={styles.babyMetrics}>
                        ওজন: ~{milestone.babyWeightGrams} গ্রাম • দৈর্ঘ্য: ~{milestone.babyLengthCm} সেমি
                      </Text>
                    </View>

                    <View style={styles.fruitCircle}>
                      <Text style={styles.fruitCircleEmoji}>👶</Text>
                    </View>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoBlockTitle}>👶 শিশুর বিকাশ:</Text>
                    <Text style={styles.infoBlockBody}>
                      {milestone.babyHighlightsBn}
                    </Text>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoBlockTitle}>🤰 মায়ের শারীরিক পরিবর্তন:</Text>
                    <Text style={styles.infoBlockBody}>
                      {milestone.momChangesBn}
                    </Text>
                  </View>
                </View>

                {/* Nutrition & Tests Advice */}
                <View style={styles.adviceCard}>
                  <View style={styles.adviceCardHeader}>
                    <MaterialIcons name="restaurant" size={18} color="#10B981" />
                    <Text style={styles.adviceCardTitle}>
                      পুষ্টি ও সাপ্লিমেন্ট নির্দেশিকা (সপ্তাহ {selectedWeek})
                    </Text>
                  </View>
                  <Text style={styles.adviceCardText}>
                    {milestone.dietAdviceBn}
                  </Text>

                  <View style={styles.testRow}>
                    <MaterialIcons name="medical-services" size={16} color="#EC4899" />
                    <Text style={styles.testRowText}>
                      প্রয়োজনীয় টেস্ট: {milestone.recommendedTestsBn}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: LIVE BABY KICK COUNTER */}
            {/* ========================================================================= */}
            {activeTab === 'KICK_COUNTER' && (
              <>
                {/* Big Kick Counter Interactive Hero */}
                <View style={styles.kickHeroCard}>
                  <Text style={styles.kickHeroTitle}>
                    কার্ডিফ "কাউন্ট-টু-১০" বেবি কিক কাউন্টার
                  </Text>
                  <Text style={styles.kickHeroSub}>
                    খাবারের পর বাম কাত হয়ে শুয়ে ১০টি স্পষ্ট নড়াচড়া রেকর্ড করুন।
                  </Text>

                  {/* Kick Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleRecordKick}
                    style={styles.bigKickBtn}>
                    <MaterialIcons name="touch-app" size={44} color="#FFFFFF" />
                    <Text style={styles.bigKickBtnCount}>{currentKicks}</Text>
                    <Text style={styles.bigKickBtnLbl}>কিক সম্পন্ন (টার্গেট ১০)</Text>
                  </TouchableOpacity>

                  {/* Timer & Controls */}
                  <View style={styles.kickTimerRow}>
                    <View style={styles.timerBox}>
                      <MaterialIcons name="timer" size={18} color="#EC4899" />
                      <Text style={styles.timerText}>
                        সময়: {formatTimerDisplay(timerSeconds)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleResetKickCounter}
                      style={styles.resetKickBtn}>
                      <MaterialIcons name="refresh" size={16} color={C.onSurfaceVariant} />
                      <Text style={styles.resetKickText}>নতুন সেশন</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cardiff Guidance Note */}
                <View style={styles.cardiffRuleCard}>
                  <MaterialIcons name="info" size={18} color="#0284C7" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardiffRuleTitle}>
                      কিক কাউন্ট করার ৩টি সোনালী নিয়ম:
                    </Text>
                    <Text style={styles.cardiffRuleText}>
                      ১. ভরপেটে বা মিষ্টি খাবার/দুধ খাওয়ার পর বাচ্চা সবচেয়ে বেশি নড়াচড়া করে।{'\n'}
                      ২. চিৎ হয়ে শোবেন না; সবসময় বাম পাশ ফিরে (Left Side) শুয়ে হাত পেটে রাখুন।{'\n'}
                      ৩. ২ ঘণ্টার মধ্যে ১০টি কিক না পেলে ঠান্ডা পানি পান করে পুনরায় ৩০ মিনিট খেয়াল করুন।
                    </Text>
                  </View>
                </View>

                {/* Previous Kick Sessions */}
                <View style={styles.kickHistorySection}>
                  <Text style={styles.sectionTitle}>
                    পূর্ববর্তী কিক হিস্ট্রি ({kickSessions.length}টি সেশন):
                  </Text>
                  {kickSessions.map((ks) => (
                    <View key={ks.id} style={styles.kickSessionCard}>
                      <View style={styles.kickSessionTop}>
                        <Text style={styles.kickSessionDate}>
                          {ks.date} • {ks.startTime}
                        </Text>
                        <Text style={styles.kickSessionCount}>
                          {ks.kickCount} কিক / {ks.durationMinutes} মিনিট
                        </Text>
                      </View>
                      <Text style={styles.kickSessionStatus}>
                        {ks.statusLabelBn}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: GDM SUGAR & BP SHIELD */}
            {/* ========================================================================= */}
            {activeTab === 'GDM_BP_SHIELD' && (
              <>
                <View style={styles.gdmBpInputCard}>
                  <Text style={styles.cardHeaderTitle}>
                    রক্তের সুগার ও ব্লাড প্রেসার স্ক্রিনিং:
                  </Text>

                  <View style={styles.gdmBpGrid}>
                    <View style={styles.gdmBpCol}>
                      <Text style={styles.inputColLabel}>খালি পেটে সুগার (FBS)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={fastingSugarInput}
                        onChangeText={setFastingSugarInput}
                        placeholder="e.g. 88 mg/dL"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.gdmBpCol}>
                      <Text style={styles.inputColLabel}>২ ঘণ্টা পর সুগার (2HABF)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={twoHourSugarInput}
                        onChangeText={setTwoHourSugarInput}
                        placeholder="e.g. 125 mg/dL"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  <View style={styles.gdmBpGrid}>
                    <View style={styles.gdmBpCol}>
                      <Text style={styles.inputColLabel}>সিস্টোলিক BP (উপরের)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={systolicInput}
                        onChangeText={setSystolicInput}
                        placeholder="e.g. 118"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.gdmBpCol}>
                      <Text style={styles.inputColLabel}>ডায়াস্টোলিক BP (নিচের)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={diastolicInput}
                        onChangeText={setDiastolicInput}
                        placeholder="e.g. 76"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  {/* Status Banner */}
                  <View
                    style={[
                      styles.gdmBpStatusBanner,
                      gdmBpResult.isPreEclampsiaAlert || gdmBpResult.isGdmAlert
                        ? styles.gdmBpStatusBannerAlert
                        : styles.gdmBpStatusBannerSafe,
                    ]}>
                    <MaterialIcons
                      name={
                        gdmBpResult.isPreEclampsiaAlert || gdmBpResult.isGdmAlert
                          ? 'warning'
                          : 'verified'
                      }
                      size={20}
                      color={
                        gdmBpResult.isPreEclampsiaAlert || gdmBpResult.isGdmAlert
                          ? '#EF4444'
                          : '#10B981'
                      }
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.gdmBpStatusTitle,
                          {
                            color:
                              gdmBpResult.isPreEclampsiaAlert || gdmBpResult.isGdmAlert
                                ? '#EF4444'
                                : '#10B981',
                          },
                        ]}>
                        {gdmBpResult.riskGradeBn}
                      </Text>
                      <Text style={styles.gdmBpStatusSub}>
                        {gdmBpResult.gdmMessageBn} • {gdmBpResult.bpMessageBn}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 6 Pregnancy Emergency Signs */}
                <Text style={styles.sectionTitle}>
                  🚨 গর্ভকালীন ৬টি মারাত্মক বিপদচিহ্ন (Danger Signs):
                </Text>
                {PREGNANCY_EMERGENCY_SIGNS.map((sign) => (
                  <View key={sign.key} style={styles.dangerSignCard}>
                    <MaterialIcons name="emergency" size={18} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dangerSignTitle}>{sign.titleBn}</Text>
                      <Text style={styles.dangerSignDesc}>
                        {sign.descriptionBn}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: HOSPITAL DELIVERY BAG CHECKLIST */}
            {/* ========================================================================= */}
            {activeTab === 'HOSPITAL_BAG' && (
              <>
                <View style={styles.bagHeroCard}>
                  <MaterialIcons name="shopping-bag" size={24} color="#EC4899" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bagHeroTitle}>
                      হসপিটাল ডেলিভারি ব্যাগ প্রস্তুতি চেকলিস্ট
                    </Text>
                    <Text style={styles.bagHeroSub}>
                      ৩৬তম সপ্তাহের মধ্যেই ব্যাগ গুছিয়ে রাখুন যেন লেবার পেইন শুরু হওয়া মাত্রই
                      হাসপাতালে রওনা হতে পারেন।
                    </Text>
                  </View>
                </View>

                {bagItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => handleToggleBagItem(item.id)}
                    style={[
                      styles.bagItemCard,
                      item.isChecked && styles.bagItemCardChecked,
                    ]}>
                    <MaterialIcons
                      name={item.isChecked ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={item.isChecked ? '#10B981' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.bagItemText,
                        item.isChecked && styles.bagItemTextChecked,
                      ]}>
                      {item.titleBn}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* DOCTOR SUMMARY SHARE ACTIONS */}
                <View style={styles.shareActionSection}>
                  <Text style={styles.sectionTitle}>
                    গাইনী বিশেষজ্ঞ বা হাসপাতালের জন্য প্রেগন্যান্সি সামারি:
                  </Text>
                  <View style={styles.shareActionRow}>
                    <TouchableOpacity
                      onPress={handleCopyReport}
                      style={styles.copySummaryBtn}>
                      <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                      <Text style={styles.copySummaryBtnText}>রিপোর্ট কপি করুন</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleWhatsAppShare}
                      style={styles.waSummaryBtn}>
                      <MaterialIcons name="share" size={16} color="#25D366" />
                      <Text style={styles.waSummaryBtnText}>WhatsApp-এ পাঠান</Text>
                    </TouchableOpacity>
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
  weekPickerCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  weekPickerLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  weekPillsScroll: {
    gap: 6,
  },
  weekPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  weekPillActive: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  weekPillText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  weekPillTextActive: {
    color: '#FFFFFF',
  },
  weekPillFruit: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  babyHeroCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    gap: 12,
  },
  babyHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trimesterBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  trimesterBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EC4899',
  },
  babyFruitTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  babyMetrics: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  fruitCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitCircleEmoji: {
    fontSize: 24,
  },
  infoBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  infoBlockTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EC4899',
  },
  infoBlockBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  adviceCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  adviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adviceCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  adviceCardText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  testRowText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#EC4899',
    flex: 1,
  },
  kickHeroCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    gap: 12,
  },
  kickHeroTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#EC4899',
    textAlign: 'center',
  },
  kickHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  bigKickBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#EC4899',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginVertical: 6,
  },
  bigKickBtnCount: {
    fontFamily: F.bold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  bigKickBtnLbl: {
    fontFamily: F.medium,
    fontSize: 8,
    color: '#FFFFFF',
    marginTop: 2,
  },
  kickTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timerText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  resetKickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetKickText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  cardiffRuleCard: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  cardiffRuleTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#0284C7',
  },
  cardiffRuleText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 3,
    lineHeight: 14,
  },
  kickHistorySection: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  kickSessionCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  kickSessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kickSessionDate: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  kickSessionCount: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EC4899',
  },
  kickSessionStatus: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  gdmBpInputCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  cardHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  gdmBpGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gdmBpCol: {
    flex: 1,
    gap: 4,
  },
  inputColLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  textInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gdmBpStatusBanner: {
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  gdmBpStatusBannerSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  gdmBpStatusBannerAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  gdmBpStatusTitle: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  gdmBpStatusSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  dangerSignCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerSignTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  dangerSignDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  bagHeroCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  bagHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#EC4899',
  },
  bagHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  bagItemCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bagItemCardChecked: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bagItemText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
    flex: 1,
  },
  bagItemTextChecked: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  shareActionSection: {
    gap: 8,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
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
