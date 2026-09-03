import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { AmbassadorTier } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymMemberReferralModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    members,
    referrals,
    membershipPlans,
    gymProfile,
    getReferralSummary,
    processMemberReferralAdmission,
    generateWhatsAppGuestPass,
    generateWhatsAppReferralGratitude,
  } = useGymOwnerStore();

  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'NEW_ADMISSION' | 'HISTORY'>('LEADERBOARD');

  // Quick Admission Form State
  const [selectedReferrerId, setSelectedReferrerId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [friendGender, setFriendGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    membershipPlans.length > 0 ? membershipPlans[0].id : ''
  );
  const [amountPaid, setAmountPaid] = useState<string>('4500');

  // WhatsApp Sub-Modal State
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [previewRecipientPhone, setPreviewRecipientPhone] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const summary = getReferralSummary();
  const selectedReferrer = members.find((m) => m.id === selectedReferrerId) || members[0];
  const selectedPlan = membershipPlans.find((p) => p.id === selectedPlanId) || membershipPlans[0];

  const getTierBadge = (tier: AmbassadorTier) => {
    switch (tier) {
      case 'GOLD_AMBASSADOR':
        return { label: '🥇 Gold Ambassador', color: '#FCC419', bg: 'rgba(252, 196, 25, 0.15)' };
      case 'SILVER_AMBASSADOR':
        return { label: '🥈 Silver Ambassador', color: '#ADB5BD', bg: 'rgba(173, 181, 189, 0.2)' };
      case 'BRONZE_AMBASSADOR':
      default:
        return { label: '🥉 Bronze Ambassador', color: '#D97706', bg: 'rgba(217, 119, 6, 0.15)' };
    }
  };

  const handleShareGuestPass = (memberId: string, phone: string) => {
    const text = generateWhatsAppGuestPass(memberId);
    setPreviewTitle('🎟️ Share VIP Guest Pass');
    setPreviewText(text);
    setPreviewRecipientPhone(phone);
    setPreviewModalVisible(true);
  };

  const handleSendGratitude = (referralId: string) => {
    const text = generateWhatsAppReferralGratitude(referralId);
    const ref = referrals.find((r) => r.id === referralId);
    const referrer = members.find((m) => m.id === ref?.referrerMemberId);
    setPreviewTitle('🎉 Send Gratitude WhatsApp Alert');
    setPreviewText(text);
    setPreviewRecipientPhone(referrer?.phone || '');
    setPreviewModalVisible(true);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = previewRecipientPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(previewText)}`;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPreviewModalVisible(false);

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('WhatsApp Message Ready', previewText);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
  };

  const handleEnrollFriend = async () => {
    if (!friendName.trim() || !friendPhone.trim()) {
      Alert.alert('Missing Info', 'Please enter friend’s name and phone number.');
      return;
    }

    try {
      const paidNum = parseInt(amountPaid, 10) || selectedPlan.feeBdt;
      const { newMember, referralRecord } = await processMemberReferralAdmission(selectedReferrer.id, {
        fullName: friendName.trim(),
        phone: friendPhone.trim(),
        gender: friendGender,
        planId: selectedPlan.id,
        amountPaidBdt: paidNum,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      Alert.alert(
        '🎉 Referral Enrollment Success!',
        `${newMember.fullName} enrolled successfully!\n\n🎁 15 Days Free Extension has been automatically credited to ${selectedReferrer.fullName}!\n\nAdmission Fee (৳1,000) was 100% waived.`,
        [
          {
            text: 'Send Gratitude to Referrer',
            onPress: () => handleSendGratitude(referralRecord.id),
          },
          { text: 'Done', style: 'cancel' },
        ]
      );

      setFriendName('');
      setFriendPhone('');
      setActiveTab('LEADERBOARD');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to process referral admission.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(121, 80, 242, 0.15)' }]}>
              <MaterialIcons name="card-giftcard" size={22} color="#7950F2" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Member Referral & Ambassador Hub
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Dual-Sided Viral Growth • +15 Days & Waived Admission
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* TOP KPI SUMMARY STRIP */}
        <View style={[styles.kpiRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: '#7950F2' }]}>{summary.totalReferralsCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Friends Joined</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: '#40C057' }]}>{summary.totalDaysRewarded}d</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Free Days Given</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: '#FCC419' }]}>{summary.activeAmbassadorsCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Ambassadors</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: '#339AF0' }]}>৳{summary.totalReferralsCount * 1000}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Fees Waived</Text>
          </View>
        </View>

        {/* NAVIGATION TABS */}
        <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('LEADERBOARD')}
            style={[
              styles.tabBtn,
              activeTab === 'LEADERBOARD' && { borderBottomColor: '#7950F2', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="military-tech"
              size={18}
              color={activeTab === 'LEADERBOARD' ? '#7950F2' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'LEADERBOARD' ? '#7950F2' : colors.textSecondary },
              ]}>
              Leaderboard ({summary.topReferrers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('NEW_ADMISSION')}
            style={[
              styles.tabBtn,
              activeTab === 'NEW_ADMISSION' && { borderBottomColor: '#40C057', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="person-add-alt-1"
              size={18}
              color={activeTab === 'NEW_ADMISSION' ? '#40C057' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'NEW_ADMISSION' ? '#40C057' : colors.textSecondary },
              ]}>
              Quick Admission
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('HISTORY')}
            style={[
              styles.tabBtn,
              activeTab === 'HISTORY' && { borderBottomColor: '#339AF0', borderBottomWidth: 2 },
            ]}>
            <MaterialIcons
              name="receipt-long"
              size={18}
              color={activeTab === 'HISTORY' ? '#339AF0' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'HISTORY' ? '#339AF0' : colors.textSecondary },
              ]}>
              Ledger ({referrals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: AMBASSADOR LEADERBOARD */}
        {activeTab === 'LEADERBOARD' && (
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* VALUE BANNER */}
            <View style={[styles.bannerCard, { backgroundColor: 'rgba(121, 80, 242, 0.12)', borderColor: '#7950F2' }]}>
              <MaterialIcons name="auto-awesome" size={24} color="#7950F2" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                  Dual-Sided Referral Rule Active
                </Text>
                <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                  Member gets <Text style={{ fontFamily: F.bold, color: '#40C057' }}>+15 Days Free</Text> • Friend gets <Text style={{ fontFamily: F.bold, color: '#7950F2' }}>৳1,000 Admission Fee Waived</Text>!
                </Text>
              </View>
            </View>

            {summary.topReferrers.map((referrer, idx) => {
              const badge = getTierBadge(referrer.tier);
              return (
                <View
                  key={referrer.memberId}
                  style={[styles.memberRankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.rankHeader}>
                    <View style={styles.rankLeft}>
                      <View style={[styles.rankNumberCircle, { backgroundColor: idx === 0 ? '#FCC419' : idx === 1 ? '#CED4DA' : '#E9ECEF' }]}>
                        <Text style={styles.rankNumberText}>{idx + 1}</Text>
                      </View>
                      <View>
                        <Text style={[styles.memberNameText, { color: colors.textPrimary }]}>
                          {referrer.memberName}
                        </Text>
                        <View style={styles.codePillRow}>
                          <View style={[styles.codePill, { backgroundColor: colors.background }]}>
                            <Text style={[styles.codePillText, { color: colors.textSecondary }]}>
                              CODE: {referrer.referralCode}
                            </Text>
                          </View>
                          <View style={[styles.tierPill, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.tierPillText, { color: badge.color }]}>{badge.label}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.rankRightStats}>
                      <Text style={[styles.countVal, { color: '#7950F2' }]}>{referrer.referralCount}</Text>
                      <Text style={[styles.countLabel, { color: colors.textSecondary }]}>Friends</Text>
                      <Text style={{ fontSize: 10, fontFamily: F.bold, color: '#40C057', marginTop: 2 }}>
                        +{referrer.daysEarned}d Free
                      </Text>
                    </View>
                  </View>

                  {/* Quick Share Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleShareGuestPass(referrer.memberId, referrer.phone)}
                    style={[styles.sharePassBtn, { backgroundColor: '#25D366' }]}>
                    <MaterialIcons name="share" size={16} color="#FFF" />
                    <Text style={styles.sharePassBtnText}>1-Tap WhatsApp VIP Guest Pass</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* TAB 2: QUICK REFERRAL ADMISSION */}
        {activeTab === 'NEW_ADMISSION' && (
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* STEP 1: SELECT REFERRER */}
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formHeading, { color: colors.textPrimary }]}>
                1. Select Referring Member
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                {members.map((m) => {
                  const isSelected = m.id === selectedReferrerId;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setSelectedReferrerId(m.id)}
                      style={[
                        styles.referrerOption,
                        {
                          backgroundColor: isSelected ? 'rgba(121, 80, 242, 0.15)' : colors.background,
                          borderColor: isSelected ? '#7950F2' : colors.border,
                        },
                      ]}>
                      <View style={[styles.refAvatar, { backgroundColor: '#7950F2' }]}>
                        <Text style={styles.refAvatarText}>{m.fullName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={[styles.refName, { color: isSelected ? '#7950F2' : colors.textPrimary }]}>
                          {m.fullName}
                        </Text>
                        <Text style={[styles.refCode, { color: colors.textSecondary }]}>
                          {m.referralCode || 'VIP'} • {m.referralCount || 0} refs
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* STEP 2: FRIEND DETAILS */}
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formHeading, { color: colors.textPrimary }]}>
                2. New Friend (Referee) Information
              </Text>

              <TextInput
                value={friendName}
                onChangeText={setFriendName}
                placeholder="Friend's Full Name (e.g. Zubair Al-Mamun)"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputBox, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              />

              <TextInput
                value={friendPhone}
                onChangeText={setFriendPhone}
                keyboardType="phone-pad"
                placeholder="Phone Number (e.g. 01712345678)"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputBox, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border, marginTop: 8 }]}
              />

              {/* Gender selector */}
              <View style={styles.genderRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setFriendGender(g)}
                    style={[
                      styles.genderPill,
                      {
                        backgroundColor: friendGender === g ? '#7950F2' : colors.background,
                        borderColor: colors.border,
                      },
                    ]}>
                    <Text style={{ fontSize: 12, fontFamily: F.bold, color: friendGender === g ? '#FFF' : colors.textSecondary }}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* STEP 3: PACKAGE & DUAL-BENEFIT PREVIEW */}
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formHeading, { color: colors.textPrimary }]}>
                3. Membership Plan
              </Text>
              <View style={{ gap: 6, marginTop: 8 }}>
                {membershipPlans.map((p) => {
                  const isSelected = p.id === selectedPlanId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setSelectedPlanId(p.id);
                        setAmountPaid(p.feeBdt.toString());
                      }}
                      style={[
                        styles.planSelectRow,
                        {
                          backgroundColor: isSelected ? 'rgba(64, 192, 87, 0.12)' : colors.background,
                          borderColor: isSelected ? '#40C057' : colors.border,
                        },
                      ]}>
                      <MaterialIcons
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                        size={18}
                        color={isSelected ? '#40C057' : colors.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planTitleText, { color: isSelected ? '#40C057' : colors.textPrimary }]}>
                          {p.title}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: F.regular, color: colors.textSecondary }}>
                          ৳{p.feeBdt} • Regular Admission Fee ৳1,000
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* DUAL VALUE PROMISE CARD */}
              <View style={[styles.rewardHighlightBox, { backgroundColor: 'rgba(37, 211, 102, 0.12)', borderColor: '#25D366' }]}>
                <View style={styles.rewardLine}>
                  <MaterialIcons name="check" size={16} color="#25D366" />
                  <Text style={[styles.rewardLineText, { color: colors.textPrimary }]}>
                    Friend: <Text style={{ fontFamily: F.bold, color: '#25D366' }}>৳1,000 Admission Fee Waived (Free!)</Text>
                  </Text>
                </View>
                <View style={styles.rewardLine}>
                  <MaterialIcons name="check" size={16} color="#25D366" />
                  <Text style={[styles.rewardLineText, { color: colors.textPrimary }]}>
                    {selectedReferrer.fullName}: <Text style={{ fontFamily: F.bold, color: '#7950F2' }}>+15 Days Free Extension</Text>
                  </Text>
                </View>
              </View>

              {/* Amount to collect */}
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 11, fontFamily: F.bold, color: colors.textSecondary, marginBottom: 4 }}>
                  Amount to Collect (BDT):
                </Text>
                <TextInput
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="numeric"
                  style={[styles.inputBox, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                />
              </View>
            </View>

            {/* ENROLL BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleEnrollFriend}
              style={[styles.submitEnrollBtn, { backgroundColor: '#7950F2' }]}>
              <MaterialIcons name="how-to-reg" size={20} color="#FFF" />
              <Text style={styles.submitEnrollBtnText}>Complete Referral Admission</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* TAB 3: REFERRAL HISTORY LEDGER */}
        {activeTab === 'HISTORY' && (
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {referrals.map((r) => (
              <View
                key={r.id}
                style={[styles.historyRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.historyCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                      {r.referredMemberName} <Text style={{ fontFamily: F.regular, color: colors.textSecondary }}>enrolled via</Text> {r.referrerMemberName}
                    </Text>
                    <Text style={[styles.historySub, { color: colors.textSecondary }]}>
                      {r.enrolledDate} • Plan: {r.packageTitle}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(64, 192, 87, 0.15)' }]}>
                    <Text style={{ fontSize: 10, fontFamily: F.bold, color: '#40C057' }}>
                      {r.rewardStatus}
                    </Text>
                  </View>
                </View>

                <View style={[styles.historyDetailsBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.historyDetailText, { color: colors.textPrimary }]}>
                    🎁 {r.rewardDescription} • Saved ৳{r.discountGivenToFriendBdt}
                  </Text>
                </View>

                {/* 1-Tap Gratitude Alert */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSendGratitude(r.id)}
                  style={[styles.gratitudeBtn, { backgroundColor: '#25D366' }]}>
                  <MaterialIcons name="chat" size={14} color="#FFF" />
                  <Text style={styles.gratitudeBtnText}>Send Gratitude Alert to Referrer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* WHATSAPP PREVIEW & SEND SUB-MODAL */}
        <Modal
          visible={previewModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPreviewModalVisible(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.subModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>{previewTitle}</Text>
                  <Text style={[styles.subModalSub, { color: colors.textSecondary }]}>
                    To: {previewRecipientPhone}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TextInput
                value={previewText}
                onChangeText={setPreviewText}
                multiline
                numberOfLines={11}
                style={[styles.previewInputBox, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendWhatsApp}
                style={[styles.submitEnrollBtn, { backgroundColor: '#25D366' }]}>
                <MaterialIcons name="send" size={18} color="#FFF" />
                <Text style={styles.submitEnrollBtnText}>Open WhatsApp & Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiVal: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: F.regular,
    marginTop: 2,
  },
  memberRankCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#000',
  },
  memberNameText: {
    fontSize: 14,
    fontFamily: F.bold,
  },
  codePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  codePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: 10,
    fontFamily: F.bold,
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierPillText: {
    fontSize: 10,
    fontFamily: F.bold,
  },
  rankRightStats: {
    alignItems: 'flex-end',
  },
  countVal: {
    fontSize: 16,
    fontFamily: F.bold,
  },
  countLabel: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  sharePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  sharePassBtnText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#FFF',
  },
  formCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  formHeading: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  referrerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  refAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refAvatarText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#FFF',
  },
  refName: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  refCode: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  inputBox: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: F.regular,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  planSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  planTitleText: {
    fontSize: 12,
    fontFamily: F.bold,
  },
  rewardHighlightBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    marginTop: 6,
  },
  rewardLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardLineText: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  submitEnrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  submitEnrollBtnText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFF',
  },
  historyRowCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyTitle: {
    fontSize: 13,
    fontFamily: F.bold,
  },
  historySub: {
    fontSize: 11,
    fontFamily: F.regular,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyDetailsBox: {
    borderRadius: 8,
    padding: 8,
  },
  historyDetailText: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  gratitudeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  gratitudeBtnText: {
    fontSize: 11,
    fontFamily: F.bold,
    color: '#FFF',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  subModalContent: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subModalTitle: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  subModalSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  previewInputBox: {
    height: 220,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontFamily: F.regular,
    textAlignVertical: 'top',
  },
});
