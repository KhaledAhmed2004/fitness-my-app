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
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import {
  DEFAULT_FALL_RISK_ITEMS,
  DEFAULT_PARENT_PROFILE,
  SENIOR_HEALTH_RULES,
} from '@/services/elderly-care-knowledge';
import {
  calculateFallSafetyScore,
  evaluateDailySeniorSafety,
  formatParentRemoteUpdateReport,
} from '@/services/elderly-care-service';
import {
  DailyCheckInStatus,
  FallRiskItem,
  ParentProfile,
  SeniorMoodLevel,
} from '@/types/elderly-care';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'DAILY_CHECKIN' | 'FALL_SAFETY' | 'REMOTE_WHATSAPP' | 'SENIOR_GUIDE';

interface ElderlyCareModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ElderlyCareModal({ visible, onClose }: ElderlyCareModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('DAILY_CHECKIN');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const [parentProfile, setParentProfile] = useState<ParentProfile>(DEFAULT_PARENT_PROFILE);

  const [checkInStatus, setCheckInStatus] = useState<DailyCheckInStatus>({
    isMorningMedTaken: true,
    morningTime: '০৮:১৫ AM',
    isNightMedTaken: false,
    moodLevel: 'FEELING_GOOD',
    moodLabelBn: 'আলহামদুলিল্লাহ ভালো',
    glassesOfWater: 5,
    lastCheckedInDate: 'আজ',
  });

  const [fallItems, setFallItems] = useState<FallRiskItem[]>(DEFAULT_FALL_RISK_ITEMS);

  // Computed Safety
  const safetyEvaluation = useMemo(() => {
    return evaluateDailySeniorSafety(checkInStatus, fallItems);
  }, [checkInStatus, fallItems]);

  const fallScore = useMemo(() => {
    return calculateFallSafetyScore(fallItems);
  }, [fallItems]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleToggleMorningMed = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setCheckInStatus((prev) => ({
      ...prev,
      isMorningMedTaken: !prev.isMorningMedTaken,
      morningTime: !prev.isMorningMedTaken
        ? new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
        : undefined,
    }));
    showToast(
      !checkInStatus.isMorningMedTaken
        ? '🌅 সকালের ওষুধ খাওয়া নিশ্চিত করা হয়েছে!'
        : 'সকালের ওষুধ আনচেক করা হয়েছে'
    );
  };

  const handleToggleNightMed = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setCheckInStatus((prev) => ({
      ...prev,
      isNightMedTaken: !prev.isNightMedTaken,
      nightTime: !prev.isNightMedTaken
        ? new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
        : undefined,
    }));
    showToast(
      !checkInStatus.isNightMedTaken
        ? '🌙 রাতের ওষুধ খাওয়া নিশ্চিত করা হয়েছে!'
        : 'রাতের ওষুধ আনচেক করা হয়েছে'
    );
  };

  const handleSelectMood = (mood: SeniorMoodLevel, label: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setCheckInStatus((prev) => ({
      ...prev,
      moodLevel: mood,
      moodLabelBn: label,
    }));
    showToast(`শারীরিক অবস্থা: ${label}`);
  };

  const handleAddWater = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCheckInStatus((prev) => ({
      ...prev,
      glassesOfWater: prev.glassesOfWater + 1,
    }));
    showToast('+১ গ্লাস পানি যোগ করা হয়েছে 💧');
  };

  const handleToggleFallItem = (id: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setFallItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const handleCopyReport = async () => {
    const text = formatParentRemoteUpdateReport(parentProfile, checkInStatus, fallScore);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('মা-বাবার কেয়ার রিপোর্ট কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatParentRemoteUpdateReport(parentProfile, checkInStatus, fallScore);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const handleCallEmergency = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    void Linking.openURL(`tel:${parentProfile.emergencyPhone}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="elderly" size={26} color="#10B981" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Elderly Care & Parent Shield
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  মা-বাবার দৈনিক যত্ন ও রিমোট সেফটি গার্ড
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
              onPress={() => setActiveTab('DAILY_CHECKIN')}
              style={[styles.tabBtn, activeTab === 'DAILY_CHECKIN' && styles.tabBtnActive]}>
              <MaterialIcons
                name="check-circle"
                size={16}
                color={activeTab === 'DAILY_CHECKIN' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'DAILY_CHECKIN' && styles.tabBtnTextActive,
                ]}>
                🟢 ডেইলি চেক-ইন
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('FALL_SAFETY')}
              style={[styles.tabBtn, activeTab === 'FALL_SAFETY' && styles.tabBtnActive]}>
              <MaterialIcons
                name="bathtub"
                size={16}
                color={activeTab === 'FALL_SAFETY' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FALL_SAFETY' && styles.tabBtnTextActive,
                ]}>
                🛁 হোম সেফটি ({fallScore}%)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('REMOTE_WHATSAPP')}
              style={[styles.tabBtn, activeTab === 'REMOTE_WHATSAPP' && styles.tabBtnActive]}>
              <MaterialIcons
                name="send"
                size={16}
                color={activeTab === 'REMOTE_WHATSAPP' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'REMOTE_WHATSAPP' && styles.tabBtnTextActive,
                ]}>
                📲 সন্তানের রিপোর্ট
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('SENIOR_GUIDE')}
              style={[styles.tabBtn, activeTab === 'SENIOR_GUIDE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="menu-book"
                size={16}
                color={activeTab === 'SENIOR_GUIDE' ? '#10B981' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SENIOR_GUIDE' && styles.tabBtnTextActive,
                ]}>
                👴 স্বাস্থ্য গাইড
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
            {/* TAB 1: ACCESSIBLE LARGE DAILY CHECK-IN */}
            {/* ========================================================================= */}
            {activeTab === 'DAILY_CHECKIN' && (
              <>
                {/* Profile Ribbon */}
                <View style={styles.profileRibbon}>
                  <Text style={styles.profileRibbonTitle}>
                    {parentProfile.nameBn} • বয়স {parentProfile.age} বছর
                  </Text>
                  <Text style={styles.profileRibbonSub}>
                    প্রেসার: {parentProfile.bloodPressureRecent} • সুগার: {parentProfile.bloodSugarRecent}
                  </Text>
                </View>

                {/* EXTRA LARGE 1-TAP MORNING CHECK-IN BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleToggleMorningMed}
                  style={[
                    styles.bigCheckinBtn,
                    checkInStatus.isMorningMedTaken
                      ? styles.bigCheckinBtnDone
                      : styles.bigCheckinBtnPending,
                  ]}>
                  <MaterialIcons
                    name={checkInStatus.isMorningMedTaken ? 'check-circle' : 'wb-sunny'}
                    size={36}
                    color="#FFFFFF"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bigCheckinBtnTitle}>
                      {checkInStatus.isMorningMedTaken
                        ? '✅ সকালের ওষুধ খাওয়া হয়েছে'
                        : '🌅 সকালের ওষুধ খেয়েছি ও ভালো আছি'}
                    </Text>
                    <Text style={styles.bigCheckinBtnSub}>
                      {checkInStatus.isMorningMedTaken
                        ? `সময়: ${checkInStatus.morningTime || 'সকালে'} (আলহামদুলিল্লাহ)`
                        : '১-ট্যাপে সন্তানকে নিশ্চিত করুন'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* EXTRA LARGE 1-TAP NIGHT CHECK-IN BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleToggleNightMed}
                  style={[
                    styles.bigCheckinBtn,
                    checkInStatus.isNightMedTaken
                      ? styles.bigCheckinBtnDone
                      : styles.bigCheckinBtnPendingNight,
                  ]}>
                  <MaterialIcons
                    name={checkInStatus.isNightMedTaken ? 'check-circle' : 'nights-stay'}
                    size={36}
                    color="#FFFFFF"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bigCheckinBtnTitle}>
                      {checkInStatus.isNightMedTaken
                        ? '✅ রাতের ওষুধ খাওয়া হয়েছে'
                        : '🌙 রাতের ওষুধ খেয়েছি'}
                    </Text>
                    <Text style={styles.bigCheckinBtnSub}>
                      {checkInStatus.isNightMedTaken
                        ? `সময়: ${checkInStatus.nightTime || 'রাতে'}`
                        : '১-ট্যাপে নিশ্চিত করুন'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Mood / Feeling Status Row */}
                <View style={styles.moodCard}>
                  <Text style={styles.cardHeaderTitle}>
                    আজকের শারীরিক অনুভূতি কেমন লাগছে?
                  </Text>
                  <View style={styles.moodRow}>
                    {(
                      [
                        { id: 'FEELING_GOOD', label: 'ভালো আছি', emoji: '😊' },
                        { id: 'A_BIT_TIRED', label: 'ক্লান্ত লাগছে', emoji: '😐' },
                        { id: 'UNWELL', label: 'শরীর খারাপ', emoji: '🤒' },
                      ] as const
                    ).map((m) => {
                      const isSelected = checkInStatus.moodLevel === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => handleSelectMood(m.id, m.label)}
                          style={[
                            styles.moodBtn,
                            isSelected && styles.moodBtnActive,
                          ]}>
                          <Text style={styles.moodEmoji}>{m.emoji}</Text>
                          <Text
                            style={[
                              styles.moodBtnLabel,
                              isSelected && styles.moodBtnLabelActive,
                            ]}>
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Water Hydration Quick Tracker */}
                <View style={styles.waterTrackerCard}>
                  <View style={styles.waterCardLeft}>
                    <MaterialIcons name="local-drink" size={24} color="#0284C7" />
                    <View>
                      <Text style={styles.waterCardTitle}>
                        পানি গ্রহণ: {checkInStatus.glassesOfWater} গ্লাস
                      </Text>
                      <Text style={styles.waterCardSub}>
                        ডিহাইড্রেশন ও প্রস্রাবের ইনফেকশন রোধে দৈনিক ৬-৭ গ্লাস পানি
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleAddWater} style={styles.addWaterBtn}>
                    <Text style={styles.addWaterBtnText}>+১ গ্লাস</Text>
                  </TouchableOpacity>
                </View>

                {/* 1-Tap SOS Emergency Dial Button */}
                <TouchableOpacity
                  onPress={handleCallEmergency}
                  style={styles.sosCallBtn}>
                  <MaterialIcons name="phone-in-talk" size={22} color="#FFFFFF" />
                  <Text style={styles.sosCallBtnText}>
                    সন্তানের কাছে জরুরি ফোন দিন ({parentProfile.emergencyPhone})
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: FALL RISK PREVENTION CHECKLIST */}
            {/* ========================================================================= */}
            {activeTab === 'FALL_SAFETY' && (
              <>
                <View style={styles.fallHeroCard}>
                  <View style={styles.fallHeroTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fallHeroTitle}>
                        বাথরুম ও বাসা সেফটি অডিট
                      </Text>
                      <Text style={styles.fallHeroSub}>
                        বয়স্কদের পড়ে যাওয়া ও হিপ ফ্র্যাকচার রোধের ৮টি গোল্ডেন রুল
                      </Text>
                    </View>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreCircleNum}>{fallScore}%</Text>
                      <Text style={styles.scoreCircleLbl}>সুরক্ষিত</Text>
                    </View>
                  </View>
                </View>

                {fallItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => handleToggleFallItem(item.id)}
                    style={[
                      styles.fallItemCard,
                      item.isCompleted && styles.fallItemCardCompleted,
                    ]}>
                    <MaterialIcons
                      name={item.isCompleted ? 'check-circle' : 'radio-button-unchecked'}
                      size={24}
                      color={item.isCompleted ? '#10B981' : C.onSurfaceVariant}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.fallItemTitle,
                          item.isCompleted && styles.fallItemTitleCompleted,
                        ]}>
                        {item.titleBn}
                      </Text>
                      <Text style={styles.fallItemImportance}>
                        {item.importanceBn}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: REMOTE WHATSAPP REPORT FOR DISTANT CHILDREN */}
            {/* ========================================================================= */}
            {activeTab === 'REMOTE_WHATSAPP' && (
              <>
                <View style={styles.previewBox}>
                  <Text style={styles.previewHeader}>
                    প্রবাসী সন্তানের জন্য আজকের আপডেট প্রিভিউ:
                  </Text>
                  <Text style={styles.previewContent}>
                    {formatParentRemoteUpdateReport(parentProfile, checkInStatus, fallScore)}
                  </Text>
                </View>

                <View style={styles.shareActionRow}>
                  <TouchableOpacity
                    onPress={handleCopyReport}
                    style={styles.copySummaryBtn}>
                    <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.copySummaryBtnText}>মেসেজ কপি করুন</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleWhatsAppShare}
                    style={styles.waSummaryBtn}>
                    <MaterialIcons name="share" size={16} color="#25D366" />
                    <Text style={styles.waSummaryBtnText}>WhatsApp-এ পাঠান</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SENIOR HEALTH & MEDICATION GUIDE */}
            {/* ========================================================================= */}
            {activeTab === 'SENIOR_GUIDE' && (
              <>
                <Text style={styles.sectionTitle}>
                  বয়োজ্যেষ্ঠ মা-বাবার স্বাস্থ্য সুরক্ষার নিয়মাবলী:
                </Text>
                {SENIOR_HEALTH_RULES.map((rule) => (
                  <View key={rule.id} style={styles.ruleCard}>
                    <Text style={styles.ruleTitle}>{rule.titleBn}</Text>
                    <Text style={styles.ruleBody}>{rule.bodyBn}</Text>
                  </View>
                ))}
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
  profileRibbon: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileRibbonTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  profileRibbonSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  bigCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    elevation: 4,
  },
  bigCheckinBtnPending: {
    backgroundColor: '#0284C7',
  },
  bigCheckinBtnPendingNight: {
    backgroundColor: '#6366F1',
  },
  bigCheckinBtnDone: {
    backgroundColor: '#10B981',
  },
  bigCheckinBtnTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bigCheckinBtnSub: {
    fontFamily: F.medium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  moodCard: {
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
  moodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  moodBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodBtnLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  moodBtnLabelActive: {
    fontFamily: F.bold,
    color: '#10B981',
  },
  waterTrackerCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  waterCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  waterCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
  },
  waterCardSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  addWaterBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addWaterBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  sosCallBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sosCallBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  fallHeroCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  fallHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#10B981',
  },
  fallHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleNum: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  scoreCircleLbl: {
    fontFamily: F.regular,
    fontSize: 7,
    color: '#FFFFFF',
  },
  fallItemCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  fallItemCardCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  fallItemTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  fallItemTitleCompleted: {
    color: '#10B981',
  },
  fallItemImportance: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  previewBox: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  previewHeader: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  previewContent: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 15,
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
    backgroundColor: '#0284C7',
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
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  ruleCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  ruleTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  ruleBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 15,
  },
});
