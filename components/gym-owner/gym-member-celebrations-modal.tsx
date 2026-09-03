import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymCelebrationItem, GymMemberItem } from '@/types/gym';
import { GymMemberIdPassModal } from './gym-member-id-pass-modal';

const C = Vital.colors;
const F = Vital.fonts;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'TODAY' | 'UPCOMING';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymMemberCelebrationsModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    members,
    getCelebrationsSnapshot,
    recordCelebrationWish,
    generateWhatsAppBirthdayWish,
    generateWhatsAppMilestoneWish,
  } = useGymOwnerStore();

  const [activeTab, setActiveTab] = useState<TabType>('TODAY');
  const [passModalMember, setPassModalMember] = useState<GymMemberItem | null>(null);

  const snapshot = useMemo(() => getCelebrationsSnapshot(), [getCelebrationsSnapshot, members]);

  const handleSendWish = async (celebration: GymCelebrationItem) => {
    const member = members.find((m) => m.id === celebration.memberId);
    if (!member) return;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const message =
      celebration.type === 'BIRTHDAY'
        ? generateWhatsAppBirthdayWish(member)
        : generateWhatsAppMilestoneWish(member, celebration);

    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    void Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        void Linking.openURL(webUrl);
      }
    });

    // Record wish for idempotency
    await recordCelebrationWish(member.id, celebration.type);
  };

  const handleWishAll = () => {
    if (snapshot.todaysCelebrations.length === 0) return;
    const unwished = snapshot.todaysCelebrations.filter((c) => !c.isWishedThisYear);
    if (unwished.length === 0) {
      Alert.alert('All Wished', 'All members celebrating today have already been sent wishes!');
      return;
    }

    // Trigger first wish
    void handleSendWish(unwished[0]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER BAR */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.iconFrame, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
              <Text style={{ fontSize: 18 }}>🎂</Text>
            </View>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Member Celebrations Hub</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Birthdays, Streaks & Century Milestones
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* TAB SWITCHER */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('TODAY')}
            style={[
              styles.tabBtn,
              activeTab === 'TODAY' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'TODAY' ? colors.primary : colors.textSecondary },
              ]}>
              🎉 Today's Events ({snapshot.todaysCelebrations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('UPCOMING')}
            style={[
              styles.tabBtn,
              activeTab === 'UPCOMING' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'UPCOMING' ? colors.primary : colors.textSecondary },
              ]}>
              📅 Upcoming 7 Days ({snapshot.upcomingBirthdays7Days.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'TODAY' ? (
            <>
              {/* BATCH WISH ALL BANNER IF UNWISHED */}
              {snapshot.todaysCelebrations.length > 0 && (
                <View style={[styles.batchBanner, { backgroundColor: 'rgba(255, 184, 0, 0.12)', borderColor: 'rgba(255, 184, 0, 0.3)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <MaterialIcons name="celebration" size={24} color="#FFB800" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.batchTitle, { color: colors.textPrimary }]}>
                        {snapshot.todaysCelebrations.length} Member{snapshot.todaysCelebrations.length > 1 ? 's' : ''} Celebrating Today!
                      </Text>
                      <Text style={[styles.batchSub, { color: colors.textSecondary }]}>
                        Delight athletes with a 1-tap birthday voucher on WhatsApp.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleWishAll}
                    style={[styles.wishAllBtn, { backgroundColor: '#25D366' }]}>
                    <MaterialIcons name="chat" size={14} color="#FFF" />
                    <Text style={styles.wishAllBtnText}>Wish on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* CELEBRATION CARDS LIST */}
              {snapshot.todaysCelebrations.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="cake" size={38} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Celebrations Today</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Check the Upcoming tab to view members celebrating birthdays this week.
                  </Text>
                </View>
              ) : (
                snapshot.todaysCelebrations.map((item) => {
                  const member = members.find((m) => m.id === item.memberId);
                  const isBday = item.type === 'BIRTHDAY';
                  const isCentury = item.type === 'CENTURY_100';

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.celebrationCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isBday ? '#FFB800' : isCentury ? '#40C057' : colors.primary,
                        },
                      ]}>
                      {/* CARD TOP ROW */}
                      <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.avatarWrap, { borderColor: isBday ? '#FFB800' : colors.primary }]}>
                            {item.memberAvatar ? (
                              <Image source={{ uri: item.memberAvatar }} style={styles.avatarImg} />
                            ) : (
                              <View style={[styles.avatarFallback, { backgroundColor: C.primaryAlpha20 }]}>
                                <Text style={[styles.avatarText, { color: colors.primary }]}>
                                  {item.memberName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                                {item.memberName}
                              </Text>
                              <Text style={{ fontSize: 14 }}>{item.badgeEmoji}</Text>
                            </View>
                            <Text style={[styles.memberPhone, { color: colors.textSecondary }]}>
                              {item.memberPhone} • {member?.planTitle || 'Member'}
                            </Text>
                          </View>
                        </View>

                        {/* STATUS PILL */}
                        <View
                          style={[
                            styles.wishedBadge,
                            item.isWishedThisYear
                              ? { backgroundColor: 'rgba(64, 192, 87, 0.15)', borderColor: '#40C057' }
                              : { backgroundColor: 'rgba(255, 184, 0, 0.15)', borderColor: '#FFB800' },
                          ]}>
                          <MaterialIcons
                            name={item.isWishedThisYear ? 'check-circle' : 'pending'}
                            size={12}
                            color={item.isWishedThisYear ? '#40C057' : '#FFB800'}
                          />
                          <Text
                            style={[
                              styles.wishedBadgeText,
                              { color: item.isWishedThisYear ? '#40C057' : '#FFB800' },
                            ]}>
                            {item.isWishedThisYear ? 'WISHED TODAY' : 'PENDING WISH'}
                          </Text>
                        </View>
                      </View>

                      {/* CELEBRATION DETAILS BOX */}
                      <View style={[styles.perkBox, { backgroundColor: isDark ? '#14171E' : '#F8F9FA' }]}>
                        <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                        <Text style={[styles.perkDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                        {item.perkOffer && (
                          <View style={styles.perkOfferRow}>
                            <Text style={[styles.perkOfferText, { color: colors.primary }]}>
                              🎁 Perk: {item.perkOffer}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* CARD ACTIONS */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => member && setPassModalMember(member)}
                          style={[styles.subBtn, { backgroundColor: colors.glassFill, borderColor: colors.border }]}>
                          <MaterialIcons name="badge" size={14} color={colors.textPrimary} />
                          <Text style={[styles.subBtnText, { color: colors.textPrimary }]}>ID Pass</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendWish(item)}
                          style={[
                            styles.mainWishBtn,
                            item.isWishedThisYear
                              ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                              : { backgroundColor: '#25D366' },
                          ]}>
                          <MaterialIcons
                            name="chat"
                            size={14}
                            color={item.isWishedThisYear ? colors.textPrimary : '#FFF'}
                          />
                          <Text
                            style={[
                              styles.mainWishBtnText,
                              { color: item.isWishedThisYear ? colors.textPrimary : '#FFF' },
                            ]}>
                            {item.isWishedThisYear ? 'Send Again (WhatsApp)' : 'Send WhatsApp Gift'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          ) : (
            /* TAB 2: UPCOMING 7-DAY FORECAST */
            <View>
              {snapshot.upcomingBirthdays7Days.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="event" size={38} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Upcoming Birthdays</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    No birthdays detected in the next 7 days for enrolled members.
                  </Text>
                </View>
              ) : (
                snapshot.upcomingBirthdays7Days.map((item) => {
                  const member = members.find((m) => m.id === item.memberId);
                  return (
                    <View
                      key={item.id}
                      style={[styles.upcomingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.upcomingDaysBadge, { backgroundColor: C.primaryAlpha20 }]}>
                          <Text style={[styles.upcomingDaysNum, { color: colors.primary }]}>
                            {item.daysRemaining}d
                          </Text>
                          <Text style={[styles.upcomingDaysLabel, { color: colors.primary }]}>LEFT</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.upcomingName, { color: colors.textPrimary }]}>
                            {item.memberName}
                          </Text>
                          <Text style={[styles.upcomingDate, { color: colors.textSecondary }]}>
                            {item.description} • {member?.planTitle || 'Member'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* DIGITAL ID PASS MODAL */}
        <GymMemberIdPassModal
          visible={!!passModalMember}
          member={passModalMember}
          onClose={() => setPassModalMember(null)}
        />
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
  iconFrame: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  batchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  batchTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  batchSub: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  wishAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wishAllBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: '#FFF',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  celebrationCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    padding: 1,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  memberName: {
    fontSize: 15,
    fontFamily: F.sansBold,
  },
  memberPhone: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  wishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  wishedBadgeText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  perkBox: {
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  perkTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  perkDesc: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  perkOfferRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  perkOfferText: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  subBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  mainWishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  mainWishBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  upcomingCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  upcomingDaysBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingDaysNum: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  upcomingDaysLabel: {
    fontSize: 8,
    fontFamily: F.monoBold,
  },
  upcomingName: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  upcomingDate: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
});
