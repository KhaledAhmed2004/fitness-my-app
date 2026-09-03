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
  GOUT_FIRST_AID_STEPS,
  PURINE_FOOD_CATALOG,
} from '@/services/uric-acid-knowledge';
import {
  classifyUricAcid,
  formatRheumatologistGoutSummary,
} from '@/services/uric-acid-service';
import {
  GenderType,
  PurineRating,
  UricAcidReading,
  UricAcidStageDef,
} from '@/types/uric-acid-gout-shield';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'URIC_METER' | 'PURINE_CATALOG' | 'FIRST_AID' | 'DOCTOR_SUMMARY';

interface UricAcidGoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UricAcidGoutModal({ visible, onClose }: UricAcidGoutModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('URIC_METER');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Tab 1: Gender & Value Input
  const [gender, setGender] = useState<GenderType>('MALE');
  const [uricAcidInput, setUricAcidInput] = useState<string>('7.8');

  const stageDef: UricAcidStageDef = useMemo(() => {
    const val = parseFloat(uricAcidInput) || 6.0;
    return classifyUricAcid(val, gender);
  }, [uricAcidInput, gender]);

  // Tab 2: Food Filter
  const [purineFilter, setPurineFilter] = useState<'ALL' | PurineRating>('ALL');

  const filteredFoods = useMemo(() => {
    if (purineFilter === 'ALL') return PURINE_FOOD_CATALOG;
    return PURINE_FOOD_CATALOG.filter((f) => f.rating === purineFilter);
  }, [purineFilter]);

  // Tab 4: Pain Scale & Joint Location
  const [painScale, setPainScale] = useState<number>(7);
  const [jointLocation, setJointLocation] = useState<string>('পায়ের বুড়ো আঙুল (Podagra)');

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleCopySummary = async () => {
    const reading: UricAcidReading = {
      id: 'uric_1',
      valueMgDl: parseFloat(uricAcidInput) || 7.8,
      gender,
      date: 'আজ',
      painScale10: painScale,
      jointLocationBn: jointLocation,
    };
    const highFoods = PURINE_FOOD_CATALOG.filter((f) => f.rating === 'HIGH_PURINE_AVOID').map(
      (f) => f.nameBn
    );
    const text = formatRheumatologistGoutSummary(reading, stageDef, highFoods);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('বাতব্যথা ও ইউরিক এসিড রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const reading: UricAcidReading = {
      id: 'uric_1',
      valueMgDl: parseFloat(uricAcidInput) || 7.8,
      gender,
      date: 'আজ',
      painScale10: painScale,
      jointLocationBn: jointLocation,
    };
    const highFoods = PURINE_FOOD_CATALOG.filter((f) => f.rating === 'HIGH_PURINE_AVOID').map(
      (f) => f.nameBn
    );
    const text = formatRheumatologistGoutSummary(reading, stageDef, highFoods);
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
                <MaterialIcons name="healing" size={26} color="#F97316" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Uric Acid & Gout Joint Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ইউরিক এসিড, পিউরিন ডায়েট ও বাতব্যথা ফার্স্ট এইড
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
              onPress={() => setActiveTab('URIC_METER')}
              style={[styles.tabBtn, activeTab === 'URIC_METER' && styles.tabBtnActive]}>
              <MaterialIcons
                name="speed"
                size={16}
                color={activeTab === 'URIC_METER' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'URIC_METER' && styles.tabBtnTextActive,
                ]}>
                🧪 মিটার
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('PURINE_CATALOG')}
              style={[styles.tabBtn, activeTab === 'PURINE_CATALOG' && styles.tabBtnActive]}>
              <MaterialIcons
                name="restaurant"
                size={16}
                color={activeTab === 'PURINE_CATALOG' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'PURINE_CATALOG' && styles.tabBtnTextActive,
                ]}>
                🥩 পিউরিন ফুড
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('FIRST_AID')}
              style={[styles.tabBtn, activeTab === 'FIRST_AID' && styles.tabBtnActive]}>
              <MaterialIcons
                name="ac-unit"
                size={16}
                color={activeTab === 'FIRST_AID' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FIRST_AID' && styles.tabBtnTextActive,
                ]}>
                🧊 ফার্স্ট এইড
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('DOCTOR_SUMMARY')}
              style={[styles.tabBtn, activeTab === 'DOCTOR_SUMMARY' && styles.tabBtnActive]}>
              <MaterialIcons
                name="description"
                size={16}
                color={activeTab === 'DOCTOR_SUMMARY' ? '#F97316' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DOCTOR_SUMMARY' && styles.tabBtnTextActive,
                ]}>
                📋 ডাক্তার সামারি
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#F97316" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: URIC ACID METER & STAGE EVALUATOR */}
            {/* ========================================================================= */}
            {activeTab === 'URIC_METER' && (
              <>
                <View style={styles.genderToggleRow}>
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setGender('MALE');
                    }}
                    style={[
                      styles.genderBtn,
                      gender === 'MALE' && styles.genderBtnActive,
                    ]}>
                    <MaterialIcons
                      name="male"
                      size={18}
                      color={gender === 'MALE' ? '#FFFFFF' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.genderBtnText,
                        gender === 'MALE' && styles.genderBtnTextActive,
                      ]}>
                      পুরুষ (Cutoff: ৭.০)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setGender('FEMALE');
                    }}
                    style={[
                      styles.genderBtn,
                      gender === 'FEMALE' && styles.genderBtnActive,
                    ]}>
                    <MaterialIcons
                      name="female"
                      size={18}
                      color={gender === 'FEMALE' ? '#FFFFFF' : C.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.genderBtnText,
                        gender === 'FEMALE' && styles.genderBtnTextActive,
                      ]}>
                      নারী (Cutoff: ৬.০)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Input Card */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputCardTitle}>
                    রক্তের সিরাম ইউরিক এসিড মান (Serum Uric Acid):
                  </Text>
                  <View style={styles.inputValRow}>
                    <TextInput
                      style={styles.bigValInput}
                      keyboardType="numeric"
                      value={uricAcidInput}
                      onChangeText={setUricAcidInput}
                      placeholder="7.8"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                    <Text style={styles.unitText}>mg/dL</Text>
                  </View>
                </View>

                {/* Classification Stage Card */}
                <View
                  style={[
                    styles.stageCard,
                    { borderColor: stageDef.color, backgroundColor: `${stageDef.color}15` },
                  ]}>
                  <View style={styles.stageCardTop}>
                    <Text style={[styles.stageTitle, { color: stageDef.color }]}>
                      {stageDef.labelBn}
                    </Text>
                    <Text style={styles.stageThreshold}>
                      স্বাভাবিক মান: {gender === 'MALE' ? stageDef.thresholdMale : stageDef.thresholdFemale}
                    </Text>
                  </View>
                  <Text style={styles.stageDescription}>{stageDef.descriptionBn}</Text>

                  <View style={styles.stageAdviceBox}>
                    <MaterialIcons name="lightbulb" size={18} color="#F97316" />
                    <Text style={styles.stageAdviceText}>{stageDef.clinicalAdviceBn}</Text>
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PURINE FOOD CATALOG & RED ALERT */}
            {/* ========================================================================= */}
            {activeTab === 'PURINE_CATALOG' && (
              <>
                <View style={styles.filterRow}>
                  {(
                    [
                      { id: 'ALL', label: 'সব খাবার' },
                      { id: 'HIGH_PURINE_AVOID', label: '🚫 বর্জনীয় (উচ্চ)' },
                      { id: 'LOW_PURINE_SAFE', label: '🟢 নিরাপদ (কম)' },
                    ] as const
                  ).map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setPurineFilter(f.id);
                      }}
                      style={[
                        styles.filterBtn,
                        purineFilter === f.id && styles.filterBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.filterBtnText,
                          purineFilter === f.id && styles.filterBtnTextActive,
                        ]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {filteredFoods.map((food) => (
                  <View
                    key={food.id}
                    style={[
                      styles.foodCard,
                      { borderLeftColor: food.ratingColor, borderLeftWidth: 4 },
                    ]}>
                    <View style={styles.foodCardTop}>
                      <Text style={styles.foodNameBn}>{food.nameBn}</Text>
                      <Text
                        style={[
                          styles.foodRatingLabel,
                          { color: food.ratingColor },
                        ]}>
                        {food.ratingLabelBn}
                      </Text>
                    </View>
                    <Text style={styles.foodPurineValue}>
                      পিউরিনের মাত্রা: ~{food.purineMgPer100g} mg / ১০০ গ্রাম • ক্যাটাগরি: {food.categoryBn}
                    </Text>
                    <Text style={styles.foodAdvice}>💡 {food.clinicalAdviceBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: ACUTE GOUT ATTACK 4-STEP FIRST AID */}
            {/* ========================================================================= */}
            {activeTab === 'FIRST_AID' && (
              <>
                <View style={styles.firstAidHero}>
                  <Text style={styles.firstAidHeroTitle}>
                    তীব্র বাতব্যথায় (Acute Gout Flare) ৪-ধাপের ফার্স্ট এইড
                  </Text>
                  <Text style={styles.firstAidHeroSub}>
                    পায়ের বুড়ো আঙুল বা জয়েন্টে তীব্র প্রদাহ ও লালচে ফোলার তাত্ক্ষণিক উপশম:
                  </Text>
                </View>

                {GOUT_FIRST_AID_STEPS.map((step) => (
                  <View key={step.stepNumber} style={styles.stepCard}>
                    <View style={styles.stepCardTop}>
                      <View style={styles.stepIconWrap}>
                        <MaterialIcons
                          name={step.icon as any}
                          size={20}
                          color="#F97316"
                        />
                      </View>
                      <Text style={styles.stepTitle}>{step.titleBn}</Text>
                    </View>
                    <Text style={styles.stepAction}>{step.actionBn}</Text>
                    <Text style={styles.stepCaution}>{step.cautionBn}</Text>
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: JOINT PAIN LOG & DOCTOR SUMMARY */}
            {/* ========================================================================= */}
            {activeTab === 'DOCTOR_SUMMARY' && (
              <>
                <View style={styles.painCard}>
                  <Text style={styles.painCardTitle}>
                    বর্তমান জয়েন্ট ব্যথার মাত্রা: {painScale} / ১০
                  </Text>
                  <View style={styles.painButtonsRow}>
                    {[1, 3, 5, 7, 9, 10].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setPainScale(num);
                        }}
                        style={[
                          styles.painNumBtn,
                          painScale === num && styles.painNumBtnActive,
                        ]}>
                        <Text
                          style={[
                            styles.painNumText,
                            painScale === num && styles.painNumTextActive,
                          ]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.jointLocCard}>
                  <Text style={styles.jointLocTitle}>আক্রান্ত জয়েন্ট নির্বাচন করুন:</Text>
                  <View style={styles.jointChipRow}>
                    {[
                      'পায়ের বুড়ো আঙুল (Podagra)',
                      'হাঁটু (Knee Joint)',
                      'গোড়ালি (Ankle Joint)',
                      'হাতের আঙুল/কবজি',
                    ].map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setJointLocation(loc);
                        }}
                        style={[
                          styles.jointChip,
                          jointLocation === loc && styles.jointChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.jointChipText,
                            jointLocation === loc && styles.jointChipTextActive,
                          ]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.shareActionRow}>
                  <TouchableOpacity onPress={handleCopySummary} style={styles.copySummaryBtn}>
                    <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.copySummaryBtnText}>ডাক্তার রিপোর্ট কপি করুন</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleWhatsAppShare} style={styles.waSummaryBtn}>
                    <MaterialIcons name="share" size={16} color="#25D366" />
                    <Text style={styles.waSummaryBtnText}>WhatsApp-এ পাঠান</Text>
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#F97316',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#F97316',
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
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F97316',
  },
  genderToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genderBtnActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  genderBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  genderBtnTextActive: {
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
  inputCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  inputCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  inputValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  bigValInput: {
    fontFamily: F.bold,
    fontSize: 36,
    color: C.onSurface,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 120,
  },
  unitText: {
    fontFamily: F.medium,
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  stageCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  stageCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  stageThreshold: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  stageDescription: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  stageAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    padding: 10,
    borderRadius: 10,
  },
  stageAdviceText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#F97316',
    flex: 1,
    lineHeight: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#F97316',
  },
  filterBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  filterBtnTextActive: {
    fontFamily: F.bold,
    color: '#F97316',
  },
  foodCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  foodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodNameBn: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  foodRatingLabel: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  foodPurineValue: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  foodAdvice: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
    marginTop: 2,
  },
  firstAidHero: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  firstAidHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#F97316',
  },
  firstAidHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  stepCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  stepCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    flex: 1,
  },
  stepAction: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
  stepCaution: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#EF4444',
    lineHeight: 14,
  },
  painCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  painCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  painButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  painNumBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  painNumBtnActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  painNumText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  painNumTextActive: {
    color: '#FFFFFF',
  },
  jointLocCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  jointLocTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  jointChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  jointChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  jointChipActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#F97316',
  },
  jointChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  jointChipTextActive: {
    fontFamily: F.bold,
    color: '#F97316',
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  copySummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F97316',
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
