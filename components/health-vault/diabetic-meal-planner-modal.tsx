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
  DIABETIC_SUPERFOODS,
  RAMADAN_DIABETIC_PRESETS,
} from '@/services/diabetic-meal-planner-knowledge';
import {
  classifyBloodSugar,
  formatDiabeticPlanWhatsAppReport,
  getDiabeticSafeFoods,
} from '@/services/diabetic-meal-planner-service';
import { BanglaFoodItem } from '@/types/bangla-food-gi';
import {
  BloodSugarLogEntry,
  BloodSugarSlot,
  DiabeticMealSlotSelection,
} from '@/types/diabetic-meal-planner';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'DAILY_MEAL_PLAN' | 'RAMADAN_MENU' | 'SUGAR_LOG' | 'SUPERFOOD_GUIDE';

interface DiabeticMealPlannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DiabeticMealPlannerModal({ visible, onClose }: DiabeticMealPlannerModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('DAILY_MEAL_PLAN');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Meal Slots
  const safeFoods = useMemo(() => getDiabeticSafeFoods(), []);
  
  const [mealSlots, setMealSlots] = useState<DiabeticMealSlotSelection[]>([
    {
      slot: 'BREAKFAST',
      labelBn: 'সকালের নাস্তা (Breakfast)',
      icon: 'free-breakfast',
      recommendedTimeBn: 'সকাল ৮:০০ – ৮:৩০',
      selectedFoods: [
        { food: safeFoods.find((f) => f.id === 'ruti_wholewheat') || safeFoods[0], quantity: 2 },
        { food: safeFoods.find((f) => f.id === 'egg_boiled') || safeFoods[1], quantity: 1 },
      ].filter(Boolean) as Array<{ food: BanglaFoodItem; quantity: number }>,
    },
    {
      slot: 'LUNCH',
      labelBn: 'দুপুরের খাবার (Lunch)',
      icon: 'lunch-dining',
      recommendedTimeBn: 'দুপুর ১:৩০ – ২:০০',
      selectedFoods: [
        { food: safeFoods.find((f) => f.id === 'brown_rice') || safeFoods[0], quantity: 1 },
        { food: safeFoods.find((f) => f.id === 'ruhi_fish') || safeFoods[2] || safeFoods[0], quantity: 1 },
        { food: safeFoods.find((f) => f.id === 'mixed_veg_korola') || safeFoods[3] || safeFoods[0], quantity: 1 },
      ].filter(Boolean) as Array<{ food: BanglaFoodItem; quantity: number }>,
    },
    {
      slot: 'DINNER',
      labelBn: 'রাতের খাবার (Dinner)',
      icon: 'dinner-dining',
      recommendedTimeBn: 'রাত ৮:৩০ – ৯:০০ (ঘুমানোর ২ ঘণ্টা আগে)',
      selectedFoods: [
        { food: safeFoods.find((f) => f.id === 'ruti_wholewheat') || safeFoods[0], quantity: 1 },
        { food: safeFoods.find((f) => f.id === 'dal_masoor') || safeFoods[1], quantity: 1 },
      ].filter(Boolean) as Array<{ food: BanglaFoodItem; quantity: number }>,
    },
  ]);

  // Tab 3: Blood Sugar Logs
  const [fastingInput, setFastingInput] = useState('6.2');
  const [postMealInput, setPostMealInput] = useState('8.4');
  const [bedtimeInput, setBedtimeInput] = useState('7.1');

  const sugarLogs: BloodSugarLogEntry[] = useMemo(() => {
    const list: BloodSugarLogEntry[] = [];
    const fVal = parseFloat(fastingInput);
    if (!isNaN(fVal) && fVal > 0) {
      list.push({
        id: 'fasting',
        slot: 'FASTING',
        valueMmol: fVal,
        measuredAt: 'আজ সকাল ৮:০০',
      });
    }
    const pVal = parseFloat(postMealInput);
    if (!isNaN(pVal) && pVal > 0) {
      list.push({
        id: 'post_meal',
        slot: 'POST_MEAL_2H',
        valueMmol: pVal,
        measuredAt: 'আজ দুপুর ৩:৩০',
      });
    }
    const bVal = parseFloat(bedtimeInput);
    if (!isNaN(bVal) && bVal > 0) {
      list.push({
        id: 'bedtime',
        slot: 'BEDTIME',
        valueMmol: bVal,
        measuredAt: 'আজ রাত ১০:৩০',
      });
    }
    return list;
  }, [fastingInput, postMealInput, bedtimeInput]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleCopyReport = async () => {
    const text = formatDiabeticPlanWhatsAppReport(sugarLogs, mealSlots);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('ডায়াবেটিক মিল ও সুগার রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatDiabeticPlanWhatsAppReport(sugarLogs, mealSlots);
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
                <MaterialIcons name="restaurant" size={26} color="#10B981" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Diabetic Meal Planner BD
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  দেশি খাদ্যাভ্যাস ও রক্তে শর্করা গার্ড
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
              onPress={() => setActiveTab('DAILY_MEAL_PLAN')}
              style={[styles.tabBtn, activeTab === 'DAILY_MEAL_PLAN' && styles.tabBtnActive]}>
              <MaterialIcons
                name="today"
                size={16}
                color={activeTab === 'DAILY_MEAL_PLAN' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DAILY_MEAL_PLAN' && styles.tabBtnTextActive,
                ]}>
                📅 মিল প্ল্যান
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('RAMADAN_MENU')}
              style={[styles.tabBtn, activeTab === 'RAMADAN_MENU' && styles.tabBtnActive]}>
              <MaterialIcons
                name="nights-stay"
                size={16}
                color={activeTab === 'RAMADAN_MENU' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'RAMADAN_MENU' && styles.tabBtnTextActive,
                ]}>
                🌙 ইফতার-সেহরি
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SUGAR_LOG')}
              style={[styles.tabBtn, activeTab === 'SUGAR_LOG' && styles.tabBtnActive]}>
              <MaterialIcons
                name="timeline"
                size={16}
                color={activeTab === 'SUGAR_LOG' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SUGAR_LOG' && styles.tabBtnTextActive,
                ]}>
                📊 সুগার লগ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SUPERFOOD_GUIDE')}
              style={[styles.tabBtn, activeTab === 'SUPERFOOD_GUIDE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="eco"
                size={16}
                color={activeTab === 'SUPERFOOD_GUIDE' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SUPERFOOD_GUIDE' && styles.tabBtnTextActive,
                ]}>
                🌿 সুপারফুড
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
            {/* TAB 1: DAILY MEAL PLANNER */}
            {/* ========================================================================= */}
            {activeTab === 'DAILY_MEAL_PLAN' && (
              <>
                <View style={styles.bannerBox}>
                  <Text style={styles.bannerTitle}>🌾 দেশি ডায়াবেটিক খাবারের প্লেট নিয়ম</Text>
                  <Text style={styles.bannerSub}>
                    প্লেটের ১/২ অংশ শাকসবজি ও সালাদ, ১/৪ অংশ প্রোটিন (মাছ/ডিম/ডাল) এবং ১/৪ অংশ লাল চালের ভাত বা লাল আটার রুটি রাখুন।
                  </Text>
                </View>

                {mealSlots.map((slot) => (
                  <View key={slot.slot} style={styles.slotCard}>
                    <View style={styles.slotHeader}>
                      <MaterialIcons name={slot.icon as any} size={20} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.slotTitle}>{slot.labelBn}</Text>
                        <Text style={styles.slotTime}>{slot.recommendedTimeBn}</Text>
                      </View>
                    </View>

                    <View style={styles.slotFoodsList}>
                      {slot.selectedFoods.map((f, idx) => (
                        <View key={`${slot.slot}_${f.food?.id || idx}`} style={styles.foodItemRow}>
                          <Text style={styles.foodName}>
                            • {f.food?.nameBn || 'খাবার'} ({f.quantity}x {f.food?.servingSizeBn || 'পরিমাণ'})
                          </Text>
                          <View style={styles.giBadge}>
                            <Text style={styles.giBadgeText}>GI {f.food?.giValue ?? '-'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.walkReminderBox}>
                  <MaterialIcons name="directions-walk" size={24} color="#3B82F6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.walkReminderTitle}>🚶 খাবারের পর ১৫ মিনিটের স্মার্ট ওয়াক</Text>
                    <Text style={styles.walkReminderSub}>
                      ভারী খাবারের ২০ মিনিট পর ঘরের ভেতরে বা বারান্দায় ধীরেসুস্থে ১৫ মিনিট হাঁটলে পেশি সরাসরি সুগার টেনে নেয় এবং স্পাইক ৫০% কমে যায়।
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: RAMADAN SAFE MENU */}
            {/* ========================================================================= */}
            {activeTab === 'RAMADAN_MENU' && (
              <>
                <Text style={styles.sectionHeader}>
                  🌙 রমজানে ডায়াবেটিস রোগীদের বিশেষ পুষ্টি মেনু:
                </Text>

                {RAMADAN_DIABETIC_PRESETS.map((preset) => (
                  <View key={preset.id} style={styles.presetCard}>
                    <View style={styles.presetTop}>
                      <MaterialIcons
                        name={preset.type === 'IFTAR' ? 'wb-twilight' : 'nights-stay'}
                        size={20}
                        color="#F59E0B"
                      />
                      <Text style={styles.presetTitle}>{preset.titleBn}</Text>
                    </View>
                    <Text style={styles.presetSub}>{preset.subtitleBn}</Text>

                    <View style={styles.presetItemsList}>
                      {preset.itemsBn.map((item, i) => (
                        <Text key={i} style={styles.presetItemText}>
                          ✅ {item}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.presetWarningBox}>
                      <MaterialIcons name="warning" size={16} color="#EF4444" />
                      <Text style={styles.presetWarningText}>{preset.insulinOrMedsWarningBn}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: BLOOD SUGAR LOG & TARGETS */}
            {/* ========================================================================= */}
            {activeTab === 'SUGAR_LOG' && (
              <>
                <View style={styles.sugarInputCard}>
                  <Text style={styles.sugarInputCardTitle}>
                    🩸 আজকের রক্তে শর্করার রিডিং (mmol/L):
                  </Text>

                  <View style={styles.inputRow}>
                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>খালি পেটে (Fasting)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="decimal-pad"
                        value={fastingInput}
                        onChangeText={setFastingInput}
                        placeholder="e.g. 6.2"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>খাবারের ২ ঘণ্টা পর</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="decimal-pad"
                        value={postMealInput}
                        onChangeText={setPostMealInput}
                        placeholder="e.g. 8.4"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.inputBox}>
                      <Text style={styles.inputLabel}>ঘুমানোর আগে</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="decimal-pad"
                        value={bedtimeInput}
                        onChangeText={setBedtimeInput}
                        placeholder="e.g. 7.1"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>
                </View>

                {sugarLogs.map((log) => {
                  const cls = classifyBloodSugar(log.valueMmol, log.slot);
                  const slotLabel =
                    log.slot === 'FASTING'
                      ? 'খালি পেটে (Fasting)'
                      : log.slot === 'POST_MEAL_2H'
                      ? 'খাবারের ২ ঘণ্টা পর (Post-Meal)'
                      : 'ঘুমানোর আগে (Bedtime)';
                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.sugarEvalCard,
                        { borderColor: cls.color, backgroundColor: `${cls.color}10` },
                      ]}>
                      <View style={styles.sugarEvalTop}>
                        <Text style={styles.sugarSlotText}>{slotLabel}</Text>
                        <Text style={[styles.sugarValueText, { color: cls.color }]}>
                          {log.valueMmol.toFixed(1)} mmol/L
                        </Text>
                      </View>
                      <Text style={[styles.sugarStatusLabel, { color: cls.color }]}>
                        {cls.labelBn}
                      </Text>
                      <Text style={styles.sugarFeedbackText}>{cls.feedbackBn}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SUPERFOOD GUIDE */}
            {/* ========================================================================= */}
            {activeTab === 'SUPERFOOD_GUIDE' && (
              <>
                <Text style={styles.sectionHeader}>
                  🌿 ডায়াবেটিস নিয়ন্ত্রণে বিজ্ঞানসম্মত দেশি ঘরোয়া টোটকা:
                </Text>

                {DIABETIC_SUPERFOODS.map((food) => (
                  <View key={food.id} style={styles.superfoodCard}>
                    <View style={styles.superfoodHeader}>
                      <View style={styles.superfoodIconBox}>
                        <MaterialIcons name={food.iconName as any} size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.superfoodTitle}>{food.nameBn}</Text>
                        <Text style={styles.superfoodSub}>{food.nameEn}</Text>
                      </View>
                      <View style={styles.superfoodGiBadge}>
                        <Text style={styles.superfoodGiText}>GI {food.giValue}</Text>
                      </View>
                    </View>

                    <Text style={styles.superfoodTime}>⏰ গ্রহণের সঠিক সময়: {food.bestTimeBn}</Text>
                    <Text style={styles.superfoodRecipe}>🥣 বানানোর নিয়ম: {food.preparationRecipeBn}</Text>
                    <Text style={styles.superfoodBenefit}>🎯 বৈজ্ঞানিক উপকারিতা: {food.clinicalBenefitBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* BOTTOM DOCTOR SHARE ACTIONS */}
            <View style={styles.bottomShareRow}>
              <TouchableOpacity onPress={handleCopyReport} style={styles.copyBtn}>
                <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                <Text style={styles.copyBtnText}>রিপোর্ট কপি করুন</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleWhatsAppShare} style={styles.waBtn}>
                <MaterialIcons name="share" size={16} color="#25D366" />
                <Text style={styles.waBtnText}>WhatsApp শেয়ার</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#10B981',
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
  bannerBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  bannerTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  bannerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  slotCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  slotTime: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  slotFoodsList: {
    gap: 4,
    paddingLeft: 4,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodName: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    flex: 1,
  },
  giBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  giBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#10B981',
  },
  walkReminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  walkReminderTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#3B82F6',
  },
  walkReminderSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeader: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  presetCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  presetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F59E0B',
  },
  presetSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  presetItemsList: {
    gap: 4,
    marginTop: 4,
  },
  presetItemText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  presetWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  presetWarningText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
    flex: 1,
  },
  sugarInputCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  sugarInputCardTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputBox: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  sugarEvalCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  sugarEvalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sugarSlotText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  sugarValueText: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  sugarStatusLabel: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  sugarFeedbackText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  superfoodCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  superfoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  superfoodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  superfoodTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  superfoodSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  superfoodGiBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  superfoodGiText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#10B981',
  },
  superfoodTime: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#F59E0B',
    marginTop: 2,
  },
  superfoodRecipe: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  superfoodBenefit: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#10B981',
    lineHeight: 14,
  },
  bottomShareRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  copyBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  waBtn: {
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
  waBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#25D366',
  },
});
