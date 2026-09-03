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

import { Vital } from '@/constants/vital-theme';
import {
  AHA_BP_CATEGORIES,
  DASH_DIET_CATALOG,
  STROKE_FAST_STEPS,
} from '@/services/hypertension-knowledge';
import {
  calculateBpMetrics,
  classifyBloodPressure,
  formatCardiologistBpReport,
} from '@/services/hypertension-service';
import {
  BpReading,
  BpTimeOfDay,
} from '@/types/hypertension-heart-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'LIVE_BP_METER' | 'MORNING_SURGE' | 'DASH_DIET' | 'STROKE_FAST';

interface HypertensionHeartShieldModalProps {
  visible: boolean;
  onClose: () => void;
  patientName?: string;
}

export function HypertensionHeartShieldModal({
  visible,
  onClose,
  patientName = 'রোগী',
}: HypertensionHeartShieldModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('LIVE_BP_METER');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Input states
  const [systolicInput, setSystolicInput] = useState<string>('134');
  const [diastolicInput, setDiastolicInput] = useState<string>('86');
  const [pulseInput, setPulseInput] = useState<string>('74');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<BpTimeOfDay>('MORNING_WAKEUP');

  // Readings history
  const [readings, setReadings] = useState<BpReading[]>([
    {
      id: 'bp_1',
      date: 'আজ',
      timestamp: '০৮:১৫ AM',
      timeOfDay: 'MORNING_WAKEUP',
      timeOfDayLabelBn: 'সকালে ঘুম থেকে উঠে',
      systolicMmHg: 138,
      diastolicMmHg: 88,
      pulseBpm: 76,
      category: 'STAGE_1',
      categoryLabelBn: 'উচ্চ রক্তচাপ স্টেজ-১',
      categoryColor: '#FB923C',
      pulsePressureMmHg: 50,
      meanArterialPressureMmHg: 104,
      isMorningSurge: true,
    },
    {
      id: 'bp_2',
      date: 'গতকাল',
      timestamp: '১০:৩০ PM',
      timeOfDay: 'EVENING_BEDTIME',
      timeOfDayLabelBn: 'রাতে ঘুমানোর আগে',
      systolicMmHg: 122,
      diastolicMmHg: 78,
      pulseBpm: 70,
      category: 'ELEVATED',
      categoryLabelBn: 'সামান্য বৃদ্ধি (Elevated)',
      categoryColor: '#F59E0B',
      pulsePressureMmHg: 44,
      meanArterialPressureMmHg: 92,
      isMorningSurge: false,
    },
    {
      id: 'bp_3',
      date: 'গতকাল',
      timestamp: '০৮:০০ AM',
      timeOfDay: 'MORNING_WAKEUP',
      timeOfDayLabelBn: 'সকালে ঘুম থেকে উঠে',
      systolicMmHg: 135,
      diastolicMmHg: 85,
      pulseBpm: 74,
      category: 'STAGE_1',
      categoryLabelBn: 'উচ্চ রক্তচাপ স্টেজ-১',
      categoryColor: '#FB923C',
      pulsePressureMmHg: 50,
      meanArterialPressureMmHg: 101,
      isMorningSurge: true,
    },
  ]);

  // Live evaluated category
  const liveCategoryDef = useMemo(() => {
    const sys = parseInt(systolicInput, 10) || 120;
    const dia = parseInt(diastolicInput, 10) || 80;
    return classifyBloodPressure(sys, dia);
  }, [systolicInput, diastolicInput]);

  // Metrics summary
  const metrics = useMemo(() => {
    return calculateBpMetrics(readings);
  }, [readings]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleSaveReading = () => {
    const sys = parseInt(systolicInput, 10);
    const dia = parseInt(diastolicInput, 10);
    const pul = parseInt(pulseInput, 10) || 72;

    if (!sys || !dia || sys < 60 || sys > 260 || dia < 40 || dia > 160) {
      Alert.alert('ভুল ইনপুট', 'দয়া করে সিস্টোলিক ও ডায়াস্টোলিক প্রেশারের সঠিক মান দিন।');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const cat = classifyBloodPressure(sys, dia);

    const timeLabelMap: Record<BpTimeOfDay, string> = {
      MORNING_WAKEUP: 'সকালে ঘুম থেকে উঠে',
      AFTERNOON: 'দুপুরে / বিকেলে',
      EVENING_BEDTIME: 'রাতে ঘুমানোর আগে',
      POST_MEDICATION: 'ওষুধ খাওয়ার পর',
    };

    const newReading: BpReading = {
      id: `bp_${Date.now()}`,
      date: 'আজ',
      timestamp: new Date().toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timeOfDay: selectedTimeOfDay,
      timeOfDayLabelBn: timeLabelMap[selectedTimeOfDay],
      systolicMmHg: sys,
      diastolicMmHg: dia,
      pulseBpm: pul,
      category: cat.category,
      categoryLabelBn: cat.labelBn.split('(')[0].trim(),
      categoryColor: cat.color,
      pulsePressureMmHg: sys - dia,
      meanArterialPressureMmHg: Math.round((2 * dia + sys) / 3),
      isMorningSurge: selectedTimeOfDay === 'MORNING_WAKEUP',
    };

    setReadings((prev) => [newReading, ...prev]);
    showToast(`রক্তচাপ ${sys}/${dia} mmHg সংরক্ষিত হয়েছে! 💾`);
  };

  const handleDeleteReading = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setReadings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCopyReport = async () => {
    const text = formatCardiologistBpReport(readings, metrics, patientName);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('কার্ডিওলজিস্ট বিপি রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatCardiologistBpReport(readings, metrics, patientName);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const handleCallEmergency = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    void Linking.openURL('tel:999');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="favorite" size={24} color="#EF4444" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Hypertension & Heart Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  উচ্চ রক্তচাপ ও স্ট্রোক রিস্ক গার্ড
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
              onPress={() => setActiveTab('LIVE_BP_METER')}
              style={[styles.tabBtn, activeTab === 'LIVE_BP_METER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="speed"
                size={16}
                color={activeTab === 'LIVE_BP_METER' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'LIVE_BP_METER' && styles.tabBtnTextActive,
                ]}>
                🩸 লাইভ বিপি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('MORNING_SURGE')}
              style={[styles.tabBtn, activeTab === 'MORNING_SURGE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="wb-sunny"
                size={16}
                color={activeTab === 'MORNING_SURGE' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'MORNING_SURGE' && styles.tabBtnTextActive,
                ]}>
                🌅 মর্নিং স্পাইক
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DASH_DIET')}
              style={[styles.tabBtn, activeTab === 'DASH_DIET' && styles.tabBtnActive]}>
              <MaterialIcons
                name="restaurant-menu"
                size={16}
                color={activeTab === 'DASH_DIET' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DASH_DIET' && styles.tabBtnTextActive,
                ]}>
                🥗 DASH ডায়েট
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('STROKE_FAST')}
              style={[styles.tabBtn, activeTab === 'STROKE_FAST' && styles.tabBtnActive]}>
              <MaterialIcons
                name="medical-services"
                size={16}
                color={activeTab === 'STROKE_FAST' ? '#EF4444' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'STROKE_FAST' && styles.tabBtnTextActive,
                ]}>
                🧠 F.A.S.T. স্ট্রোক
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
            {/* TAB 1: LIVE BP METER & INPUT */}
            {/* ========================================================================= */}
            {activeTab === 'LIVE_BP_METER' && (
              <>
                {/* Live AHA Traffic-Light Gauge Card */}
                <View
                  style={[
                    styles.gaugeHeroCard,
                    { borderColor: `${liveCategoryDef.color}60` },
                  ]}>
                  <View style={styles.gaugeHeroTop}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.gaugeCategoryTitle,
                          { color: liveCategoryDef.color },
                        ]}>
                        {liveCategoryDef.labelBn}
                      </Text>
                      <Text style={styles.gaugeRangeSub}>
                        সিস্টোলিক: {liveCategoryDef.systolicRangeBn} • ডায়াস্টোলিক:{' '}
                        {liveCategoryDef.diastolicRangeBn}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.gaugeCircle,
                        { backgroundColor: liveCategoryDef.color },
                      ]}>
                      <Text style={styles.gaugeCircleNum}>
                        {systolicInput || '0'}/{diastolicInput || '0'}
                      </Text>
                      <Text style={styles.gaugeCircleLbl}>mmHg</Text>
                    </View>
                  </View>

                  <Text style={styles.gaugeClinicalAdvice}>
                    {liveCategoryDef.clinicalAdviceBn}
                  </Text>

                  {/* Crisis Alarm Banner */}
                  {liveCategoryDef.isEmergency && (
                    <TouchableOpacity
                      onPress={handleCallEmergency}
                      style={styles.crisisAlarmBanner}>
                      <MaterialIcons name="emergency" size={20} color="#FFFFFF" />
                      <Text style={styles.crisisAlarmText}>
                        🚨 ক্রাইসিস অ্যালার্ট! জরুরি অ্যাম্বুলেন্সে কল দিন (৯৯৯)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Input Card */}
                <View style={styles.inputCard}>
                  <Text style={styles.cardHeaderTitle}>
                    নতুন ব্লাড প্রেসার মান পরিমাপ করুন:
                  </Text>

                  <View style={styles.inputGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputColLabel}>সিস্টোলিক (উপরের)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={systolicInput}
                        onChangeText={setSystolicInput}
                        placeholder="e.g. 134"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.inputCol}>
                      <Text style={styles.inputColLabel}>ডায়াস্টোলিক (নিচের)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={diastolicInput}
                        onChangeText={setDiastolicInput}
                        placeholder="e.g. 86"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.inputCol}>
                      <Text style={styles.inputColLabel}>পালস (Pulse)</Text>
                      <TextInput
                        style={styles.textInputField}
                        keyboardType="numeric"
                        value={pulseInput}
                        onChangeText={setPulseInput}
                        placeholder="e.g. 74"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  {/* Time of Day Pills */}
                  <Text style={styles.timePickerLabel}>পরিমাপের সময়:</Text>
                  <View style={styles.timePillsRow}>
                    {(
                      [
                        { id: 'MORNING_WAKEUP', label: '🌅 সকালে ঘুম থেকে উঠে' },
                        { id: 'EVENING_BEDTIME', label: '🌙 রাতে ঘুমানোর আগে' },
                        { id: 'AFTERNOON', label: '☀️ দুপুরে' },
                        { id: 'POST_MEDICATION', label: '💊 ওষুধ খাওয়ার পর' },
                      ] as const
                    ).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setSelectedTimeOfDay(t.id)}
                        style={[
                          styles.timePill,
                          selectedTimeOfDay === t.id && styles.timePillActive,
                        ]}>
                        <Text
                          style={[
                            styles.timePillText,
                            selectedTimeOfDay === t.id && styles.timePillTextActive,
                          ]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSaveReading}
                    style={styles.saveReadingBtn}>
                    <MaterialIcons name="save" size={18} color="#FFFFFF" />
                    <Text style={styles.saveReadingBtnText}>
                      ব্লাড প্রেসার সংরক্ষণ করুন
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: MORNING SURGE & HISTORY */}
            {/* ========================================================================= */}
            {activeTab === 'MORNING_SURGE' && (
              <>
                {/* Morning Surge Comparison Card */}
                <View style={styles.surgeHeroCard}>
                  <View style={styles.surgeHeroTop}>
                    <MaterialIcons name="wb-sunny" size={24} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.surgeHeroTitle}>
                        মর্নিং বিপি স্পাইক (Morning Surge Analysis)
                      </Text>
                      <Text style={styles.surgeHeroSub}>
                        সকালের ও রাতের সিস্টোলিক প্রেসারের পার্থক্য:{' '}
                        <Text style={{ fontFamily: F.bold, color: '#EF4444' }}>
                          +{metrics.morningSurgeDeltaMmHg} mmHg
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.surgeExplanation}>
                    {metrics.isMorningSurgeHigh
                      ? '🚨 সতর্কতা: আপনার সকালের প্রেশার রাতের তুলনায় ৩৫ mmHg এর বেশি বাড়ে। এটি প্রাতঃকালীন স্ট্রোকের একটি গুরুত্বপূর্ণ ঝুঁকির লক্ষণ। অবিলম্বে চিকিৎসকের সাথে ওষুধের সময়সূচি নিয়ে আলোচনা করুন।'
                      : '✅ স্বাভাবিক অবস্থা: সকালের প্রেশার বৃদ্ধি স্বাভাবিক শারীরবৃত্তীয় সীমার মধ্যে রয়েছে।'}
                  </Text>
                </View>

                {/* Metrics Summary Strip */}
                <View style={styles.metricsStrip}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLbl}>৭ দিনের গড় প্রেশার</Text>
                    <Text style={styles.metricItemVal}>
                      {metrics.avgSystolic}/{metrics.avgDiastolic}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLbl}>পালস প্রেশার</Text>
                    <Text style={styles.metricItemVal}>
                      {metrics.pulsePressureMmHg} mmHg
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLbl}>গড় MAP</Text>
                    <Text style={styles.metricItemVal}>
                      {metrics.meanArterialPressureMmHg} mmHg
                    </Text>
                  </View>
                </View>

                {/* Readings History List */}
                <Text style={styles.sectionTitle}>
                  সংরক্ষিত রিডিং হিস্ট্রি ({readings.length}টি):
                </Text>
                {readings.map((r) => (
                  <View key={r.id} style={styles.readingCard}>
                    <View
                      style={[
                        styles.readingColorBar,
                        { backgroundColor: r.categoryColor },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.readingCardTop}>
                        <Text style={styles.readingBpText}>
                          {r.systolicMmHg}/{r.diastolicMmHg} mmHg
                        </Text>
                        <Text
                          style={[
                            styles.readingCategoryBadge,
                            { color: r.categoryColor },
                          ]}>
                          {r.categoryLabelBn}
                        </Text>
                      </View>
                      <Text style={styles.readingMeta}>
                        {r.date} • {r.timestamp} ({r.timeOfDayLabelBn}) • পালস:{' '}
                        {r.pulseBpm} bpm
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteReading(r.id)}
                      style={styles.deleteBtn}>
                      <MaterialIcons name="close" size={16} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: DASH DIET & SODIUM SHIELD */}
            {/* ========================================================================= */}
            {activeTab === 'DASH_DIET' && (
              <>
                {/* Raw Salt Buster Banner */}
                <View style={styles.saltBusterCard}>
                  <MaterialIcons name="do-not-disturb" size={24} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saltBusterTitle}>
                      কাঁচা লবণ সম্পূর্ণ পরিহার করুন (Sodium Buster Rule)
                    </Text>
                    <Text style={styles.saltBusterDesc}>
                      ভাতে বা ফলের সাথে ১ চা চামচ কাঁচা লবণ যোগ করা মানে ২,৩০০ মিগ্রা অতিরিক্ত
                      সোডিয়াম গ্রহণ করা। হাইপারটেনশনে দৈনিক সর্বোচ্চ ১,৫০০ মিগ্রার বেশি খাওয়া
                      উচিত নয়।
                    </Text>
                  </View>
                </View>

                {/* Recommended & Dangerous Food Items */}
                <Text style={styles.sectionTitle}>
                  দেশি DASH ডায়েট: রক্তচাপ নিয়ন্ত্রণকারী ও ক্ষতিকর খাবার:
                </Text>
                {DASH_DIET_CATALOG.map((food) => (
                  <View
                    key={food.id}
                    style={[
                      styles.dashFoodCard,
                      food.isRecommended
                        ? styles.dashFoodCardRec
                        : styles.dashFoodCardAvoid,
                    ]}>
                    <View
                      style={[
                        styles.dashFoodIconCircle,
                        food.isRecommended
                          ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
                          : { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                      ]}>
                      <MaterialIcons
                        name={food.isRecommended ? 'check' : 'close'}
                        size={18}
                        color={food.isRecommended ? '#10B981' : '#EF4444'}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.dashFoodTop}>
                        <Text style={styles.dashFoodName}>{food.nameBn}</Text>
                        <Text
                          style={[
                            styles.dashFoodCategory,
                            { color: food.isRecommended ? '#10B981' : '#EF4444' },
                          ]}>
                          {food.categoryLabelBn}
                        </Text>
                      </View>
                      <Text style={styles.dashFoodBenefits}>
                        {food.benefitsBn}
                      </Text>
                      <Text style={styles.dashFoodAdvice}>
                        💡 {food.servingAdviceBn}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: STROKE F.A.S.T. & DOCTOR REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'STROKE_FAST' && (
              <>
                <View style={styles.fastHeroCard}>
                  <MaterialIcons name="psychology" size={24} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fastHeroTitle}>
                      F.A.S.T. স্ট্রোক ডিটেকশন ও জরুরি ফার্স্ট এইড
                    </Text>
                    <Text style={styles.fastHeroSub}>
                      উচ্চ রক্তচাপের রোগীর নিচের ৪টি লক্ষণের যেকোনো ১টি দেখা দিলে ১ সেকেন্ডও
                      দেরি না করে দ্রুত হাসপাতালে নিন:
                    </Text>
                  </View>
                </View>

                {STROKE_FAST_STEPS.map((step) => (
                  <View key={step.key} style={styles.fastStepCard}>
                    <View style={styles.fastStepLetterCircle}>
                      <Text style={styles.fastStepLetterText}>
                        {step.stepLetter}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fastStepTitle}>{step.titleBn}</Text>
                      <Text style={styles.fastStepInstruction}>
                        পরীক্ষা: {step.testInstructionBn}
                      </Text>
                      <Text style={styles.fastStepWarning}>
                        বিপদ সংকেত: {step.warningSignBn}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* DOCTOR SUMMARY SHARE ACTIONS */}
                <View style={styles.shareActionSection}>
                  <Text style={styles.sectionTitle}>
                    কার্ডিওলজিস্ট বা ডাক্তারের পরামর্শের জন্য সামারি:
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
  gaugeHeroCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  gaugeHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeCategoryTitle: {
    fontFamily: F.bold,
    fontSize: 14,
  },
  gaugeRangeSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  gaugeCircle: {
    width: 68,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  gaugeCircleNum: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  gaugeCircleLbl: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#FFFFFF',
  },
  gaugeClinicalAdvice: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  crisisAlarmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#991B1B',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  crisisAlarmText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
    flex: 1,
  },
  inputCard: {
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
  inputGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inputCol: {
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
  timePickerLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  timePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timePillActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  timePillText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  timePillTextActive: {
    fontFamily: F.bold,
    color: '#EF4444',
  },
  saveReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  saveReadingBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  surgeHeroCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 8,
  },
  surgeHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  surgeHeroTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F59E0B',
  },
  surgeHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    marginTop: 2,
  },
  surgeExplanation: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricItemLbl: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  metricItemVal: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  readingCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  readingColorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  readingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingBpText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  readingCategoryBadge: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  readingMeta: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  saltBusterCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  saltBusterTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  saltBusterDesc: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  dashFoodCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
  },
  dashFoodCardRec: {
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  dashFoodCardAvoid: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dashFoodIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashFoodTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dashFoodName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  dashFoodCategory: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  dashFoodBenefits: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  dashFoodAdvice: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurface,
    marginTop: 4,
  },
  fastHeroCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  fastHeroTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EF4444',
  },
  fastHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 14,
  },
  fastStepCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  fastStepLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastStepLetterText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#EF4444',
  },
  fastStepTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  fastStepInstruction: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  fastStepWarning: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
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
