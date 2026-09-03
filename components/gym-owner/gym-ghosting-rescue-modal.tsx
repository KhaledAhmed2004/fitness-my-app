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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GhostingMemberInfo, AbsenceReasonTag } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  onClose: () => void;
};

const REASON_OPTIONS: { id: AbsenceReasonTag; label: string; icon: string }[] = [
  { id: 'NONE', label: 'Active Unattended', icon: 'schedule' },
  { id: 'TRAVEL', label: '✈️ Travel', icon: 'flight' },
  { id: 'SICK_INJURY', label: '🩹 Sick / Injury', icon: 'healing' },
  { id: 'EXAMS', label: '📚 Exams', icon: 'school' },
  { id: 'PERSONAL_BUSY', label: '💼 Work / Busy', icon: 'work' },
];

export function GymGhostingRescueModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    getGhostingMembersSnapshot,
    logMemberRescueContact,
    setMemberAbsenceReason,
    generateWhatsAppComebackMessage,
    gymProfile,
  } = useGymOwnerStore();

  const snapshot = getGhostingMembersSnapshot();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'DANGER' | 'COOLING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-modal: Message Preview
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GhostingMemberInfo | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  const filteredMembers = snapshot.members.filter((m) => {
    if (activeFilter === 'CRITICAL' && m.tier !== 'TIER_2_CRITICAL') return false;
    if (activeFilter === 'DANGER' && m.tier !== 'TIER_3_DANGER') return false;
    if (activeFilter === 'COOLING' && !m.isCoolingDown) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.assignedTrainerName && m.assignedTrainerName.toLowerCase().includes(q))
    );
  });

  const handleOpenPreview = (member: GhostingMemberInfo) => {
    setSelectedMember(member);
    const msg = generateWhatsAppComebackMessage(member.memberId);
    setCustomMessage(msg);
    setPreviewModalVisible(true);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedMember) return;

    const cleanPhone = selectedMember.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(customMessage)}`;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Log rescue contact to set cool-down timestamp
    await logMemberRescueContact(selectedMember.memberId);

    setPreviewModalVisible(false);

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Comeback Message Ready', customMessage);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Could not open WhatsApp. Please ensure WhatsApp is installed.');
      });
  };

  const handleSelectReason = async (memberId: string, reason: AbsenceReasonTag) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await setMemberAbsenceReason(memberId, reason);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
              <MaterialIcons name="radar" size={22} color="#FF6B6B" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Ghosting Member Rescue Radar
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Prevent Member Dropouts with Empathetic Re-engagement
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

        {/* TOP KPI CARDS */}
        <View style={[styles.kpiRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.kpiCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>At-Risk</Text>
            <Text style={[styles.kpiValue, { color: '#FF6B6B' }]}>{snapshot.totalGhostingCount}</Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>4+ Days Gap</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Critical</Text>
            <Text style={[styles.kpiValue, { color: '#FF922B' }]}>{snapshot.criticalCount}</Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>7–13 Days</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Danger Zone</Text>
            <Text style={[styles.kpiValue, { color: '#FA5252' }]}>{snapshot.dangerCount}</Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>14+ Days</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Rescued</Text>
            <Text style={[styles.kpiValue, { color: '#40C057' }]}>
              {snapshot.members.filter((m) => m.isCoolingDown).length}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>Cooling (3d)</Text>
          </View>
        </View>

        {/* SEARCH & FILTER TABS */}
        <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search member, phone or trainer..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            <TouchableOpacity
              onPress={() => setActiveFilter('ALL')}
              style={[
                styles.filterPill,
                activeFilter === 'ALL' && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
              ]}>
              <Text style={[styles.filterPillText, { color: activeFilter === 'ALL' ? '#FFF' : colors.textPrimary }]}>
                All Absent ({snapshot.totalGhostingCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('CRITICAL')}
              style={[
                styles.filterPill,
                activeFilter === 'CRITICAL' && { backgroundColor: '#FF922B', borderColor: '#FF922B' },
              ]}>
              <Text style={[styles.filterPillText, { color: activeFilter === 'CRITICAL' ? '#FFF' : colors.textPrimary }]}>
                🚨 Critical 7-13d ({snapshot.criticalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('DANGER')}
              style={[
                styles.filterPill,
                activeFilter === 'DANGER' && { backgroundColor: '#FA5252', borderColor: '#FA5252' },
              ]}>
              <Text style={[styles.filterPillText, { color: activeFilter === 'DANGER' ? '#FFF' : colors.textPrimary }]}>
                💀 Danger 14d+ ({snapshot.dangerCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('COOLING')}
              style={[
                styles.filterPill,
                activeFilter === 'COOLING' && { backgroundColor: '#40C057', borderColor: '#40C057' },
              ]}>
              <Text style={[styles.filterPillText, { color: activeFilter === 'COOLING' ? '#FFF' : colors.textPrimary }]}>
                ⏳ Contacted ({snapshot.members.filter((m) => m.isCoolingDown).length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* MEMBER CARDS LIST */}
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="celebration" size={48} color="#40C057" />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Zero Dropout Risk in this Category!
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Great job! Your athletes are maintaining high workout consistency.
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => {
              const isDanger = member.tier === 'TIER_3_DANGER';
              const isCritical = member.tier === 'TIER_2_CRITICAL';
              const badgeColor = isDanger ? '#FA5252' : isCritical ? '#FF922B' : '#FCC419';

              return (
                <View
                  key={member.memberId}
                  style={[
                    styles.memberCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: member.isCoolingDown ? '#40C057' : isDanger ? 'rgba(250, 82, 82, 0.4)' : colors.border,
                    },
                  ]}>
                  {/* Top Meta Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardUserLeft}>
                      <View style={[styles.avatar, { backgroundColor: badgeColor }]}>
                        <Text style={styles.avatarText}>{member.fullName.charAt(0)}</Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                            {member.fullName}
                          </Text>
                          {member.gender === 'FEMALE' && (
                            <Text style={styles.femaleTag}>🌸 Ladies Shift</Text>
                          )}
                        </View>
                        <Text style={[styles.memberPhone, { color: colors.textSecondary }]}>
                          📱 {member.phone} • {member.membershipPlanTitle}
                        </Text>
                      </View>
                    </View>

                    {/* ABSENCE BADGE */}
                    <View style={[styles.absenceBadge, { backgroundColor: `${badgeColor}15`, borderColor: badgeColor }]}>
                      <MaterialIcons
                        name={isDanger ? 'report-problem' : isCritical ? 'warning' : 'schedule'}
                        size={14}
                        color={badgeColor}
                      />
                      <Text style={[styles.absenceBadgeText, { color: badgeColor }]}>
                        {member.daysAbsent} Days Absent
                      </Text>
                    </View>
                  </View>

                  {/* LAST CHECK-IN & TRAINER ROW */}
                  <View style={[styles.infoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      📅 Last Visit: <Text style={{ fontFamily: F.bold, color: colors.textPrimary }}>{member.lastCheckInDate}</Text>
                    </Text>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      👤 Coach: <Text style={{ fontFamily: F.bold, color: '#339AF0' }}>{member.assignedTrainerName || 'Floor Team'}</Text>
                    </Text>
                  </View>

                  {/* REASON SELECTOR PILLS */}
                  <View style={styles.reasonSection}>
                    <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>
                      Absence Reason Tag:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {REASON_OPTIONS.map((opt) => {
                        const isSelected = member.absenceReason === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            onPress={() => handleSelectReason(member.memberId, opt.id)}
                            style={[
                              styles.reasonPill,
                              {
                                backgroundColor: isSelected ? 'rgba(51, 154, 240, 0.15)' : colors.background,
                                borderColor: isSelected ? '#339AF0' : colors.border,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.reasonPillText,
                                { color: isSelected ? '#339AF0' : colors.textSecondary },
                              ]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* CARD ACTIONS */}
                  <View style={styles.cardActionsRow}>
                    {member.isCoolingDown ? (
                      <View style={[styles.coolingBadge, { backgroundColor: 'rgba(64, 192, 87, 0.15)', borderColor: '#40C057' }]}>
                        <MaterialIcons name="check-circle" size={16} color="#40C057" />
                        <Text style={{ fontSize: 12, fontFamily: F.bold, color: '#40C057' }}>
                          Rescued! Contacted {member.lastRescueContactedDate} (Cooling 72h)
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleOpenPreview(member)}
                        style={[
                          styles.rescueActionBtn,
                          {
                            backgroundColor: isDanger ? '#FA5252' : isCritical ? '#FF922B' : '#25D366',
                          },
                        ]}>
                        <MaterialIcons name="chat" size={18} color="#FFF" />
                        <Text style={styles.rescueActionBtnText}>
                          {isDanger
                            ? 'Send Comeback Shake Pass'
                            : isCritical
                            ? 'Send 20-Min Stretch Invitation'
                            : 'Send Friendly Check-In'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* MESSAGE PREVIEW & PERSONALIZATION SUB-MODAL */}
        <Modal
          visible={previewModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPreviewModalVisible(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.subModalHeader}>
                <View>
                  <Text style={[styles.subModalTitle, { color: colors.textPrimary }]}>
                    Psychological Comeback Dispatcher
                  </Text>
                  <Text style={[styles.subModalSub, { color: colors.textSecondary }]}>
                    To: {selectedMember?.fullName} ({selectedMember?.daysAbsent} Days Absent)
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Message Box */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Tailored WhatsApp Message (Editable)
              </Text>
              <TextInput
                value={customMessage}
                onChangeText={setCustomMessage}
                multiline
                numberOfLines={10}
                style={[
                  styles.messageInputBox,
                  {
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
              />

              {/* Dispatch Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendWhatsApp}
                style={[styles.dispatchBtn, { backgroundColor: '#25D366' }]}>
                <MaterialIcons name="send" size={18} color="#FFF" />
                <Text style={styles.dispatchBtnText}>Open in WhatsApp & Mark Rescued</Text>
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
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: F.regular,
  },
  kpiValue: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  kpiSub: {
    fontSize: 9,
    fontFamily: F.regular,
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: F.regular,
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillText: {
    fontSize: 11,
    fontFamily: F.bold,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: F.bold,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: F.regular,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  memberCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: F.bold,
    color: '#FFF',
  },
  memberName: {
    fontSize: 14,
    fontFamily: F.bold,
  },
  femaleTag: {
    fontSize: 10,
    fontFamily: F.semiBold,
    color: '#F06595',
  },
  memberPhone: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  absenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  absenceBadgeText: {
    fontSize: 10,
    fontFamily: F.bold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  infoText: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  reasonSection: {
    gap: 6,
  },
  reasonLabel: {
    fontSize: 10,
    fontFamily: F.medium,
  },
  reasonPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reasonPillText: {
    fontSize: 10,
    fontFamily: F.medium,
  },
  cardActionsRow: {
    marginTop: 4,
  },
  coolingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  rescueActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rescueActionBtnText: {
    fontSize: 13,
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
    borderRadius: 20,
    padding: 18,
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
  inputLabel: {
    fontSize: 11,
    fontFamily: F.medium,
  },
  messageInputBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontFamily: F.regular,
    textAlignVertical: 'top',
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dispatchBtnText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: '#FFF',
  },
});
