import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  BANGLADESHI_RAMADAN_FOODS,
  SIX_POINT_SUGAR_CHECK_SLOTS,
} from '@/services/ramadan-fasting-knowledge';
import {
  assessFastingRisk,
  calculateMedicationShift,
  evaluateIftarPlate,
  evaluateSuhoorPlate,
} from '@/services/ramadan-fasting-service';
import { useMedicineStore } from '@/stores/medicine-store';

const C = Vital.colors;
const F = Vital.fonts;

interface RamadanGuardModalProps {
  visible: boolean;
  onClose: () => void;
}

type MainTab = 'FOOD_COMBINER' | 'MEDICATION_SHIFT' | 'SUGAR_CHECK' | 'RISK_AUDIT';
type FoodSubTab = 'IFTAR' | 'SUHOOR';

export function RamadanGuardModal({ visible, onClose }: RamadanGuardModalProps) {
  const medicines = useMedicineStore((s) => s.medicines);

  const [activeTab, setActiveTab] = useState<MainTab>('FOOD_COMBINER');
  const [foodSubTab, setFoodSubTab] = useState<FoodSubTab>('IFTAR');

  // Food Quantities State
  const [iftarFoodMap, setIftarFoodMap] = useState<Record<string, number>>({
    food_khejur_ajwa: 1,
    food_chhola_seddho: 1,
    food_isabgol_lemon: 1,
    food_peyaju: 1,
  });

  const [suhoorFoodMap, setSuhoorFoodMap] = useState<Record<string, number>>({
    food_lal_chaal_bhaat: 1,
    food_deshi_fish_jhol: 1,
    food_egg_white_dim: 1,
  });

  // Simulated Sugar Check State
  const [testSugarValue, setTestSugarValue] = useState<string>('5.8');

  // Risk Audit State
  const [qType, setQType] = useState<number>(0); // 0 = Type 2 Metformin (0), 1 = Type 2 Insulin (2.5), 2 = Type 1 (4)
  const [qA1c, setQA1c] = useState<number>(0); // 0 = <7.5% (0), 1 = 7.5-9% (1.5), 2 = >9% (3)
  const [qHypo, setQHypo] = useState<number>(0); // 0 = No (0), 1 = Mild (1), 2 = Severe in 3m (3.5)
  const [qKidney, setQKidney] = useState<number>(0); // 0 = None (0), 1 = Mild (1.5), 2 = Advanced CKD (3.5)

  // Calculations
  const iftarEval = useMemo(() => evaluateIftarPlate(iftarFoodMap), [iftarFoodMap]);
  const suhoorEval = useMemo(() => evaluateSuhoorPlate(suhoorFoodMap), [suhoorFoodMap]);
  const medShifts = useMemo(() => calculateMedicationShift(medicines), [medicines]);

  const riskScore = useMemo(() => {
    return qType + qA1c + qHypo + qKidney;
  }, [qType, qA1c, qHypo, qKidney]);

  const riskResult = useMemo(() => assessFastingRisk(riskScore), [riskScore]);

  const handleUpdateFoodQty = (foodId: string, delta: number, isIftar: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isIftar) {
      setIftarFoodMap((prev) => {
        const current = prev[foodId] || 0;
        const next = Math.max(0, current + delta);
        return { ...prev, [foodId]: next };
      });
    } else {
      setSuhoorFoodMap((prev) => {
        const current = prev[foodId] || 0;
        const next = Math.max(0, current + delta);
        return { ...prev, [foodId]: next };
      });
    }
  };

  const parsedSugar = parseFloat(testSugarValue);
  const isHypoAlert = !isNaN(parsedSugar) && parsedSugar > 0 && parsedSugar < 3.9;
  const isHyperAlert = !isNaN(parsedSugar) && parsedSugar > 16.7;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="nights-stay" size={20} color="#00B4D8" />
              </View>
              <View>
                <Text style={styles.title}>Ramadan & Fasting Guard</Text>
                <Text style={styles.subtitle}>রমজান ও রোজা ডায়াবেটিস কেয়ার</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('FOOD_COMBINER')}
              style={[styles.tabBtn, activeTab === 'FOOD_COMBINER' && styles.tabBtnActive]}
            >
              <MaterialIcons
                name="restaurant-menu"
                size={16}
                color={activeTab === 'FOOD_COMBINER' ? '#00B4D8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FOOD_COMBINER' && styles.tabBtnTextActive,
                ]}
              >
                🍽️ ফুড কম্বাইনার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('MEDICATION_SHIFT')}
              style={[styles.tabBtn, activeTab === 'MEDICATION_SHIFT' && styles.tabBtnActive]}
            >
              <MaterialIcons
                name="medical-services"
                size={16}
                color={activeTab === 'MEDICATION_SHIFT' ? '#00B4D8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'MEDICATION_SHIFT' && styles.tabBtnTextActive,
                ]}
              >
                💊 ওষুধ শিডিউলার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SUGAR_CHECK')}
              style={[styles.tabBtn, activeTab === 'SUGAR_CHECK' && styles.tabBtnActive]}
            >
              <MaterialIcons
                name="bloodtype"
                size={16}
                color={activeTab === 'SUGAR_CHECK' ? '#00B4D8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SUGAR_CHECK' && styles.tabBtnTextActive,
                ]}
              >
                🩸 ৬-পয়েন্ট সুগার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('RISK_AUDIT')}
              style={[styles.tabBtn, activeTab === 'RISK_AUDIT' && styles.tabBtnActive]}
            >
              <MaterialIcons
                name="shield"
                size={16}
                color={activeTab === 'RISK_AUDIT' ? '#00B4D8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'RISK_AUDIT' && styles.tabBtnTextActive,
                ]}
              >
                🛡️ রিস্ক অডিট
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLLABLE CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'FOOD_COMBINER' && (
              <>
                {/* SUB-TABS: IFTAR vs SUHOOR */}
                <View style={styles.subTabRow}>
                  <TouchableOpacity
                    onPress={() => setFoodSubTab('IFTAR')}
                    style={[
                      styles.subTabBtn,
                      foodSubTab === 'IFTAR' && styles.subTabBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subTabBtnText,
                        foodSubTab === 'IFTAR' && styles.subTabBtnTextActive,
                      ]}
                    >
                      🌅 ইফতার প্লেট (Iftar Spike Predictor)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFoodSubTab('SUHOOR')}
                    style={[
                      styles.subTabBtn,
                      foodSubTab === 'SUHOOR' && styles.subTabBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subTabBtnText,
                        foodSubTab === 'SUHOOR' && styles.subTabBtnTextActive,
                      ]}
                    >
                      🌙 সেহরি প্লেট (Suhoor Endurance)
                    </Text>
                  </TouchableOpacity>
                </View>

                {foodSubTab === 'IFTAR' ? (
                  <>
                    {/* IFTAR GAUGE HERO */}
                    <View
                      style={[
                        styles.gaugeCard,
                        { borderColor: `${iftarEval.spikeColor}40`, backgroundColor: `${iftarEval.spikeColor}10` },
                      ]}
                    >
                      <View style={styles.gaugeHeader}>
                        <MaterialIcons name="speed" size={24} color={iftarEval.spikeColor} />
                        <Text style={[styles.gaugeStatusText, { color: iftarEval.spikeColor }]}>
                          {iftarEval.spikeRiskLabelBn}
                        </Text>
                      </View>

                      {/* STATS STRIP */}
                      <View style={styles.statsStrip}>
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{iftarEval.totalCalories} kcal</Text>
                          <Text style={styles.statSub}>ক্যালরি</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{iftarEval.totalCarbs}g</Text>
                          <Text style={styles.statSub}>শর্করা (Carbs)</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{iftarEval.totalFiber}g</Text>
                          <Text style={styles.statSub}>আঁশ (Fiber)</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>GI: {iftarEval.averageGi}</Text>
                          <Text style={styles.statSub}>গ্লাইসেমিক ইনডেক্স</Text>
                        </View>
                      </View>

                      {/* CLINICAL RECOMMENDATIONS */}
                      {iftarEval.recommendationsBn.map((rec, i) => (
                        <View key={i} style={styles.tipRow}>
                          <MaterialIcons name="info" size={14} color={iftarEval.spikeColor} />
                          <Text style={styles.tipText}>{rec}</Text>
                        </View>
                      ))}

                      {iftarEval.safeReplacementsBn.length > 0 && (
                        <View style={styles.replacementBox}>
                          <Text style={styles.replacementTitle}>💡 স্বাস্থ্যকর বিকল্প:</Text>
                          {iftarEval.safeReplacementsBn.map((r, i) => (
                            <Text key={i} style={styles.replacementText}>
                              • {r}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* FOOD ITEM SELECTORS */}
                    <Text style={styles.sectionTitle}>
                      ইফতারের খাবার যোগ করুন (Portion Adjustment):
                    </Text>

                    {BANGLADESHI_RAMADAN_FOODS.filter(
                      (f) =>
                        f.category === 'IFTAR_CORE' ||
                        f.category === 'FRIED_SNACK' ||
                        f.category === 'SWEET_DESSERT' ||
                        f.category === 'BEVERAGE'
                    ).map((food) => {
                      const qty = iftarFoodMap[food.id] || 0;
                      return (
                        <View key={food.id} style={styles.foodRowCard}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.foodNameRow}>
                              <Text style={styles.foodNameBn}>{food.nameBn}</Text>
                              <View
                                style={[
                                  styles.spikeBadge,
                                  food.spikeFactor === 'EXTREME'
                                    ? styles.spikeBadgeExtreme
                                    : food.spikeFactor === 'HIGH'
                                    ? styles.spikeBadgeHigh
                                    : styles.spikeBadgeLow,
                                ]}
                              >
                                <Text style={styles.spikeBadgeText}>
                                  GI: {food.giValue} • {food.spikeFactor}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.foodMetaText}>
                              {food.servingUnitBn} ({food.caloriesPerUnit} kcal • {food.carbsGrams}g Carbs)
                            </Text>
                            <Text style={styles.foodSafeLimit}>
                              নিরাপদ মাত্রা: {food.safeLimitBn}
                            </Text>
                          </View>

                          <View style={styles.stepperWrap}>
                            <TouchableOpacity
                              onPress={() => handleUpdateFoodQty(food.id, -1, true)}
                              style={styles.stepperBtn}
                            >
                              <MaterialIcons name="remove" size={16} color={C.onSurface} />
                            </TouchableOpacity>
                            <Text style={styles.stepperQty}>{qty}</Text>
                            <TouchableOpacity
                              onPress={() => handleUpdateFoodQty(food.id, 1, true)}
                              style={styles.stepperBtn}
                            >
                              <MaterialIcons name="add" size={16} color={C.onSurface} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* SUHOOR GAUGE HERO */}
                    <View
                      style={[
                        styles.gaugeCard,
                        { borderColor: `${suhoorEval.ratingColor}40`, backgroundColor: `${suhoorEval.ratingColor}10` },
                      ]}
                    >
                      <View style={styles.gaugeHeader}>
                        <MaterialIcons name="hourglass-top" size={24} color={suhoorEval.ratingColor} />
                        <Text style={[styles.gaugeStatusText, { color: suhoorEval.ratingColor }]}>
                          {suhoorEval.ratingLabelBn}
                        </Text>
                      </View>

                      <View style={styles.statsStrip}>
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{suhoorEval.totalCalories} kcal</Text>
                          <Text style={styles.statSub}>শক্তি</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{suhoorEval.totalProtein}g</Text>
                          <Text style={styles.statSub}>প্রোটিন</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{suhoorEval.totalFiber}g</Text>
                          <Text style={styles.statSub}>আঁশ</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                          <Text style={styles.statVal}>{suhoorEval.hydrationEnduranceHours} ঘণ্টা</Text>
                          <Text style={styles.statSub}>পানি স্থায়িত্ব</Text>
                        </View>
                      </View>

                      {suhoorEval.recommendationsBn.map((rec, i) => (
                        <View key={i} style={styles.tipRow}>
                          <MaterialIcons name="check-circle" size={14} color={suhoorEval.ratingColor} />
                          <Text style={styles.tipText}>{rec}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.sectionTitle}>
                      সেহরির খাবার যোগ করুন (Sustained Energy):
                    </Text>

                    {BANGLADESHI_RAMADAN_FOODS.filter(
                      (f) =>
                        f.category === 'SUHOOR_CARB' ||
                        f.category === 'SUHOOR_PROTEIN' ||
                        f.category === 'IFTAR_CORE'
                    ).map((food) => {
                      const qty = suhoorFoodMap[food.id] || 0;
                      return (
                        <View key={food.id} style={styles.foodRowCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.foodNameBn}>{food.nameBn}</Text>
                            <Text style={styles.foodMetaText}>
                              {food.servingUnitBn} ({food.caloriesPerUnit} kcal • {food.proteinGrams}g Protein)
                            </Text>
                            <Text style={styles.foodSafeLimit}>
                              💡 {food.healthTipBn}
                            </Text>
                          </View>

                          <View style={styles.stepperWrap}>
                            <TouchableOpacity
                              onPress={() => handleUpdateFoodQty(food.id, -1, false)}
                              style={styles.stepperBtn}
                            >
                              <MaterialIcons name="remove" size={16} color={C.onSurface} />
                            </TouchableOpacity>
                            <Text style={styles.stepperQty}>{qty}</Text>
                            <TouchableOpacity
                              onPress={() => handleUpdateFoodQty(food.id, 1, false)}
                              style={styles.stepperBtn}
                            >
                              <MaterialIcons name="add" size={16} color={C.onSurface} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {activeTab === 'MEDICATION_SHIFT' && (
              <>
                <View style={styles.medHeroCard}>
                  <MaterialIcons name="alarm-on" size={24} color="#00B4D8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medHeroTitle}>
                      রমজানে ওষুধের সময় পরিবর্তনের বৈজ্ঞানিক নিয়ম
                    </Text>
                    <Text style={styles.medHeroSub}>
                      বাংলাদেশ ডায়াবেটিক সমিতি (BADAS) ও IDF-DAR গাইডলাইন অনুযায়ী
                      আপনার ড্রয়ারের ওষুধের অটোমেটিক শিডিউল নিচে তৈরি করা হলো।
                    </Text>
                  </View>
                </View>

                {medShifts.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardText}>
                      আপনার ড্রয়ারে কোনো ওষুধ যুক্ত করা নেই। ক্যাবিনেটে ওষুধ যুক্ত
                      করলে রমজানের শিডিউল স্বয়ংক্রিয়ভাবে দেখাবে।
                    </Text>
                  </View>
                ) : (
                  medShifts.map((shift) => (
                    <View key={shift.medicineId} style={styles.medShiftCard}>
                      <View style={styles.medShiftHeader}>
                        <Text style={styles.medShiftName}>{shift.medicineName}</Text>
                        <View
                          style={[
                            styles.warnBadge,
                            shift.warningLevel === 'CRITICAL_DOCTOR_ALERT'
                              ? styles.warnBadgeCritical
                              : shift.warningLevel === 'CAUTION'
                              ? styles.warnBadgeCaution
                              : styles.warnBadgeInfo,
                          ]}
                        >
                          <Text style={styles.warnBadgeText}>
                            {shift.warningLevel === 'CRITICAL_DOCTOR_ALERT'
                              ? '🚨 বিশেষ সতর্কতা'
                              : shift.warningLevel === 'CAUTION'
                              ? '⚠️ সাবধানে'
                              : 'ℹ️ সাধারণ'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.originalDoseText}>
                        স্বাভাবিক সময়: {shift.originalDailyDoses}
                      </Text>

                      {/* SHIFT TIMING GRID */}
                      <View style={styles.timingGrid}>
                        <View style={styles.timingCol}>
                          <Text style={styles.timingLabel}>🌅 ইফতারের সময় (Iftar):</Text>
                          <Text style={styles.timingVal}>{shift.iftarDoseBn}</Text>
                        </View>
                        <View style={styles.timingDivider} />
                        <View style={styles.timingCol}>
                          <Text style={styles.timingLabel}>🌙 সেহরির সময় (Suhoor):</Text>
                          <Text style={styles.timingVal}>{shift.suhoorDoseBn}</Text>
                        </View>
                      </View>

                      <View style={styles.precautionBox}>
                        <Text style={styles.precautionText}>
                          💡 {shift.clinicalPrecautionBn}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {activeTab === 'SUGAR_CHECK' && (
              <>
                {/* LIVE SIMULATOR */}
                <View style={styles.simCard}>
                  <Text style={styles.simTitle}>
                    🩸 লাইভ সুগার টেস্ট ভেরিফায়ার (Red Alert Gate)
                  </Text>
                  <Text style={styles.simSub}>
                    রোজা অবস্থায় গ্লুকোমিটারে সুগার মেপে নিচের বক্সে লিখুন:
                  </Text>

                  <View style={styles.simInputRow}>
                    <TextInput
                      style={styles.simInput}
                      value={testSugarValue}
                      onChangeText={setTestSugarValue}
                      keyboardType="numeric"
                      placeholder="e.g. 5.8"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                    <Text style={styles.simUnit}>mmol/L</Text>
                  </View>

                  {isHypoAlert && (
                    <View style={styles.redAlertBanner}>
                      <MaterialIcons name="warning" size={24} color="#FFF" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.redAlertTitle}>
                          🚨 রোজা ভাঙার লাল সংকেত (Hypoglycemia Alert)!
                        </Text>
                        <Text style={styles.redAlertBody}>
                          ব্লাড সুগার ৩.৯ mmol/L এর নিচে নেমে গেছে! অবিলম্বে রোজা ভেঙে
                          চিনির শরবত বা খেজুর গ্রহণ করুন, নতুবা মস্তিষ্কে স্থায়ী ক্ষতি বা
                          অজ্ঞান হওয়ার চরম ঝুঁকি রয়েছে।
                        </Text>
                      </View>
                    </View>
                  )}

                  {isHyperAlert && (
                    <View style={styles.redAlertBanner}>
                      <MaterialIcons name="error" size={24} color="#FFF" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.redAlertTitle}>
                          🚨 চরম হাইপারগ্লাইসেমিয়া সংকেত (&gt; ১৬.৭ mmol/L)!
                        </Text>
                        <Text style={styles.redAlertBody}>
                          রক্তে সুগারের মাত্রা অতিরিক্ত বেশি (কিটোঅ্যাসিডোসিস ঝুঁকি)।
                          অবিলম্বে চিকিৎসকের সাথে যোগাযোগ করুন ও ইনসুলিন নিন।
                        </Text>
                      </View>
                    </View>
                  )}

                  {!isHypoAlert && !isHyperAlert && (
                    <View style={styles.safeAlertBanner}>
                      <MaterialIcons name="check-circle" size={20} color="#20C997" />
                      <Text style={styles.safeAlertText}>
                        সুগার স্বাভাবিক রেঞ্জে রয়েছে। নিশ্চিন্তে রোজা চালিয়ে যান।
                      </Text>
                    </View>
                  )}
                </View>

                {/* 6 POINT SCHEDULE LIST */}
                <Text style={styles.sectionTitle}>
                  রমজানের গুরুত্বপূর্ণ ৬টি সুগার টেস্ট সময়সূচি:
                </Text>

                {SIX_POINT_SUGAR_CHECK_SLOTS.map((slot) => (
                  <View key={slot.id} style={styles.slotCard}>
                    <View style={styles.slotTop}>
                      <Text style={styles.slotNameBn}>{slot.slotNameBn}</Text>
                      <View style={styles.slotTargetBadge}>
                        <Text style={styles.slotTargetText}>
                          টার্গেট: {slot.targetRangeBn}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.slotWhy}>💡 {slot.whyImportantBn}</Text>
                  </View>
                ))}
              </>
            )}

            {activeTab === 'RISK_AUDIT' && (
              <>
                <View style={styles.auditHero}>
                  <Text style={styles.auditHeroTitle}>
                    🛡️ IDF-DAR রোজা রাখার নিরাপত্তা অ্যাসেসমেন্ট
                  </Text>
                  <Text style={styles.auditHeroSub}>
                    আন্তর্জাতিক ডায়াবেটিস ফেডারেশন ও রমজান গাইডলাইন অনুযায়ী আপনার ঝুঁকি
                    যাচাই করুন:
                  </Text>
                </View>

                {/* RESULT CARD */}
                <View
                  style={[
                    styles.resultCard,
                    { backgroundColor: riskResult.badgeBg, borderColor: `${riskResult.textColor}40` },
                  ]}
                >
                  <Text style={[styles.resultTitle, { color: riskResult.textColor }]}>
                    {riskResult.levelLabelBn}
                  </Text>
                  <Text style={styles.resultAdvice}>{riskResult.adviceBn}</Text>
                </View>

                {/* QUESTION 1 */}
                <View style={styles.quizCard}>
                  <Text style={styles.quizQuestion}>
                    ১. আপনার ডায়াবেটিসের ধরন ও বর্তমান চিকিৎসা:
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQType(0)}
                    style={[styles.quizOption, qType === 0 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>
                      • টাইপ-২ (শুধু মেটফরমিন বা ডায়েট কন্ট্রোল)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQType(2.5)}
                    style={[styles.quizOption, qType === 2.5 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>
                      • টাইপ-২ (ইনসুলিন বা সালফোনাইলইউরিয়া খাচ্ছি)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQType(4)}
                    style={[styles.quizOption, qType === 4 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>
                      • টাইপ-১ ডায়াবেটিস
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* QUESTION 2 */}
                <View style={styles.quizCard}>
                  <Text style={styles.quizQuestion}>
                    ২. সাম্প্রতিক ৩ মাসের গড় সুগার (HbA1c):
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQA1c(0)}
                    style={[styles.quizOption, qA1c === 0 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>• ৭.৫% এর নিচে (ভালো নিয়ন্ত্রণ)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQA1c(1.5)}
                    style={[styles.quizOption, qA1c === 1.5 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>• ৭.৫% থেকে ৯.০% (মাঝারি)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQA1c(3)}
                    style={[styles.quizOption, qA1c === 3 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>• ৯.০% এর উপরে (অনিয়ন্ত্রিত)</Text>
                  </TouchableOpacity>
                </View>

                {/* QUESTION 3 */}
                <View style={styles.quizCard}>
                  <Text style={styles.quizQuestion}>
                    ৩. বিগত ৩ মাসে হাইপো হয়ে অজ্ঞান হওয়ার ইতিহাস:
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQHypo(0)}
                    style={[styles.quizOption, qHypo === 0 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>• কোনো ইতিহাস নেই</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQHypo(3.5)}
                    style={[styles.quizOption, qHypo === 3.5 && styles.quizOptionActive]}
                  >
                    <Text style={styles.quizOptionText}>
                      • হ্যাঁ, মারাত্মক হাইপো হয়ে হাসপাতালে যেতে হয়েছিল
                    </Text>
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
  container: {
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
    paddingTop: 18,
    paddingBottom: 12,
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
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    borderColor: 'rgba(0, 180, 216, 0.35)',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#00B4D8',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 3,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  subTabBtnActive: {
    backgroundColor: '#00B4D8',
  },
  subTabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  subTabBtnTextActive: {
    fontFamily: F.bold,
    color: '#00344D',
  },
  gaugeCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gaugeStatusText: {
    fontFamily: F.bold,
    fontSize: 13,
    flex: 1,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    borderRadius: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  statSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    flex: 1,
    lineHeight: 16,
  },
  replacementBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  replacementTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  replacementText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  foodRowCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodNameBn: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  spikeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  spikeBadgeLow: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
  },
  spikeBadgeHigh: {
    backgroundColor: 'rgba(255, 146, 43, 0.2)',
  },
  spikeBadgeExtreme: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  spikeBadgeText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurface,
  },
  foodMetaText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  foodSafeLimit: {
    fontFamily: F.medium,
    fontSize: 9,
    color: '#00B4D8',
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 4,
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
    minWidth: 16,
    textAlign: 'center',
  },
  medHeroCard: {
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.25)',
  },
  medHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#00B4D8',
  },
  medHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 15,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  medShiftCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  medShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medShiftName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  warnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warnBadgeCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  warnBadgeCaution: {
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
  },
  warnBadgeInfo: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
  },
  warnBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurface,
  },
  originalDoseText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  timingGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
  },
  timingCol: {
    flex: 1,
    gap: 2,
  },
  timingLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#00B4D8',
  },
  timingVal: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  timingDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  precautionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
    borderRadius: 8,
  },
  precautionText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  simCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  simTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  simSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  simInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: C.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: F.bold,
    borderWidth: 1,
    borderColor: '#00B4D8',
    width: 100,
    textAlign: 'center',
  },
  simUnit: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  redAlertBanner: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  redAlertTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFF',
  },
  redAlertBody: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#FFF',
    marginTop: 2,
    lineHeight: 15,
  },
  safeAlertBanner: {
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.3)',
  },
  safeAlertText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#20C997',
    flex: 1,
  },
  slotCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  slotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotNameBn: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  slotTargetBadge: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotTargetText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#00B4D8',
  },
  slotWhy: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  auditHero: {
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.25)',
    gap: 4,
  },
  auditHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#00B4D8',
  },
  auditHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  resultCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  resultTitle: {
    fontFamily: F.bold,
    fontSize: 12,
  },
  resultAdvice: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 15,
  },
  quizCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  quizQuestion: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  quizOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quizOptionActive: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderColor: '#00B4D8',
  },
  quizOptionText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
});
