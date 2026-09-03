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
  buildFamilyHealthCards,
  formatFamilyWeeklySummary,
  getUpcomingFamilyEvents,
} from '@/services/family-health-dashboard-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'OVERVIEW' | 'UPCOMING_EVENTS' | 'WEEKLY_REPORT';

interface FamilyHealthDashboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FamilyHealthDashboardModal({
  visible,
  onClose,
}: FamilyHealthDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('OVERVIEW');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const { members, events, healthConditions, labResults, diagnosticTests, followUps } =
    useHealthVaultStore();

  const memberCards = useMemo(() => {
    return buildFamilyHealthCards(
      members,
      events,
      healthConditions,
      labResults,
      diagnosticTests,
      followUps
    );
  }, [members, events, healthConditions, labResults, diagnosticTests, followUps]);

  const upcomingEvents = useMemo(() => {
    return getUpcomingFamilyEvents(members, events, diagnosticTests, followUps);
  }, [members, events, diagnosticTests, followUps]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleCopySummary = async () => {
    const text = formatFamilyWeeklySummary(memberCards, upcomingEvents);
    await Clipboard.setStringAsync(text);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('পারিবারিক স্বাস্থ্য সামারি কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const text = formatFamilyWeeklySummary(memberCards, upcomingEvents);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে রিপোর্টটি কপি করে সরাসরি শেয়ার করুন।');
    });
  };

  const totalAttentionCount = useMemo(() => {
    return memberCards.filter((c) => c.needsAttention).length;
  }, [memberCards]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="family-restroom" size={26} color="#8B5CF6" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Family Health Dashboard
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  পরিবারের সবার স্বাস্থ্য একনজরে ও সাপ্তাহিক বুলেটিন
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
              onPress={() => setActiveTab('OVERVIEW')}
              style={[styles.tabBtn, activeTab === 'OVERVIEW' && styles.tabBtnActive]}>
              <MaterialIcons
                name="dashboard"
                size={16}
                color={activeTab === 'OVERVIEW' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'OVERVIEW' && styles.tabBtnTextActive,
                ]}>
                👨‍👩‍👧‍👦 সদস্য ওভারভিউ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('UPCOMING_EVENTS')}
              style={[styles.tabBtn, activeTab === 'UPCOMING_EVENTS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="event"
                size={16}
                color={activeTab === 'UPCOMING_EVENTS' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'UPCOMING_EVENTS' && styles.tabBtnTextActive,
                ]}>
                📅 আসন্ন ইভেন্টস
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('WEEKLY_REPORT')}
              style={[styles.tabBtn, activeTab === 'WEEKLY_REPORT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="assignment"
                size={16}
                color={activeTab === 'WEEKLY_REPORT' ? '#8B5CF6' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'WEEKLY_REPORT' && styles.tabBtnTextActive,
                ]}>
                📋 সাপ্তাহিক বুলেটিন
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#8B5CF6" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: FAMILY OVERVIEW */}
            {/* ========================================================================= */}
            {activeTab === 'OVERVIEW' && (
              <>
                <View style={styles.statsBanner}>
                  <View style={styles.statsCol}>
                    <Text style={styles.statsNum}>{memberCards.length}</Text>
                    <Text style={styles.statsLabel}>মোট সদস্য</Text>
                  </View>
                  <View style={styles.statsDivider} />
                  <View style={styles.statsCol}>
                    <Text style={[styles.statsNum, { color: totalAttentionCount > 0 ? '#EF4444' : '#10B981' }]}>
                      {totalAttentionCount}
                    </Text>
                    <Text style={styles.statsLabel}>মনোযোগ প্রয়োজন</Text>
                  </View>
                  <View style={styles.statsDivider} />
                  <View style={styles.statsCol}>
                    <Text style={styles.statsNum}>{upcomingEvents.length}</Text>
                    <Text style={styles.statsLabel}>আসন্ন টেস্ট/ভিজিট</Text>
                  </View>
                </View>

                {memberCards.map((member) => (
                  <View
                    key={member.memberId}
                    style={[
                      styles.memberCard,
                      { borderLeftColor: member.accentColor, borderLeftWidth: 4 },
                    ]}>
                    <View style={styles.memberCardTop}>
                      <View style={styles.memberNameWrap}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberRelation}>{member.relationBn}</Text>
                      </View>
                      {member.bloodGroup && (
                        <View style={styles.bloodBadge}>
                          <Text style={styles.bloodText}>{member.bloodGroup}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.memberMetricsRow}>
                      <View style={styles.metricItem}>
                        <MaterialIcons name="medication" size={14} color="#F97316" />
                        <Text style={styles.metricText}>
                          {member.activeMedicationsCount} টি ওষুধ
                        </Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MaterialIcons name="healing" size={14} color="#3B82F6" />
                        <Text style={styles.metricText}>
                          {member.activeConditionsCount} টি দীর্ঘস্থায়ী রোগ
                        </Text>
                      </View>
                    </View>

                    {member.lastDoctorVisitDate && (
                      <Text style={styles.lastVisitText}>
                        🕒 শেষ ডাক্তার ভিজিট: {member.lastDoctorVisitDate}
                      </Text>
                    )}

                    {member.needsAttention && member.attentionReasonBn && (
                      <View style={styles.attentionAlert}>
                        <MaterialIcons name="warning" size={14} color="#EF4444" />
                        <Text style={styles.attentionAlertText}>
                          {member.attentionReasonBn}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: UPCOMING EVENTS */}
            {/* ========================================================================= */}
            {activeTab === 'UPCOMING_EVENTS' && (
              <>
                <Text style={styles.sectionHeader}>
                  📅 পরিবারের সকল সদস্যের আসন্ন টেস্ট ও অ্যাপয়েন্টমেন্ট:
                </Text>

                {upcomingEvents.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <MaterialIcons name="event-available" size={36} color="#10B981" />
                    <Text style={styles.emptyTitle}>কোনো আসন্ন স্বাস্থ্য টেস্ট বা ভিজিট পেন্ডিং নেই!</Text>
                    <Text style={styles.emptySub}>পরিবারের সবাই নিয়মিত ট্র্যাকে আছেন।</Text>
                  </View>
                ) : (
                  upcomingEvents.map((ev) => (
                    <View key={ev.id} style={styles.eventCard}>
                      <View
                        style={[
                          styles.eventIconBox,
                          { backgroundColor: `${ev.accentColor}20` },
                        ]}>
                        <MaterialIcons
                          name={ev.eventType === 'DOCTOR_VISIT' ? 'medical-services' : 'biotech'}
                          size={20}
                          color={ev.accentColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eventTitle}>{ev.titleBn}</Text>
                        <Text style={styles.eventMemberSub}>
                          👤 {ev.memberName} ({ev.memberRelationBn}) • 📅 {ev.dueDateStr}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: WEEKLY REPORT */}
            {/* ========================================================================= */}
            {activeTab === 'WEEKLY_REPORT' && (
              <>
                <View style={styles.reportSummaryCard}>
                  <Text style={styles.reportSummaryTitle}>
                    📋 সাপ্তাহিক ফ্যামিলি হেলথ বুলেটিন
                  </Text>
                  <Text style={styles.reportSummarySub}>
                    সদস্য সংখ্যা: {memberCards.length} জন • নিয়মিত ওষুধ খাচ্ছেন:{' '}
                    {memberCards.reduce((sum, m) => sum + m.activeMedicationsCount, 0)} টি
                  </Text>
                </View>

                {/* Share Action Row */}
                <View style={styles.shareActionRow}>
                  <TouchableOpacity onPress={handleCopySummary} style={styles.copySummaryBtn}>
                    <MaterialIcons name="content-copy" size={16} color="#FFFFFF" />
                    <Text style={styles.copySummaryBtnText}>বুলেটিন কপি করুন</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleWhatsAppShare} style={styles.waSummaryBtn}>
                    <MaterialIcons name="share" size={16} color="#25D366" />
                    <Text style={styles.waSummaryBtnText}>ফ্যামিলি WhatsApp-এ পাঠান</Text>
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8B5CF6',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#8B5CF6',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statsNum: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.onSurface,
  },
  statsLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  statsDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  memberCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  memberRelation: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  bloodBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bloodText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
  },
  memberMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  lastVisitText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  attentionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  attentionAlertText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#EF4444',
    flex: 1,
  },
  sectionHeader: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurface,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  eventIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  eventMemberSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  reportSummaryCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  reportSummaryTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#8B5CF6',
  },
  reportSummarySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  copySummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
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
