/**
 * 🔒 Gym Locker Tracker Modal (Smart Locker Grid & Key Allocation Radar)
 * Real-time changing room locker occupancy, 1-tap member key assignment & vacating
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymLockerItem, LockerStatus, LockerType } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 40 - 24) / 4;

type FilterTab = 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RENTAL' | 'MAINTENANCE';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymLockerTrackerModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    lockers,
    members,
    assignLocker,
    releaseLocker,
    toggleLockerMaintenance,
    gymProfile,
  } = useGymOwnerStore();

  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocker, setSelectedLocker] = useState<GymLockerItem | null>(null);

  // Assign form inside action sheet
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [targetLockerForAssign, setTargetLockerForAssign] = useState<GymLockerItem | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customMemberName, setCustomMemberName] = useState('');
  const [customMemberPhone, setCustomMemberPhone] = useState('');
  const [lockerType, setLockerType] = useState<LockerType>('DAILY_FREE');
  const [monthlyRent, setMonthlyRent] = useState('500');

  // Stats
  const totalCount = lockers.length;
  const availableCount = lockers.filter((l) => l.status === 'AVAILABLE').length;
  const occupiedCount = lockers.filter((l) => l.status === 'OCCUPIED').length;
  const maintenanceCount = lockers.filter((l) => l.status === 'MAINTENANCE').length;
  const rentalCount = lockers.filter((l) => l.type === 'MONTHLY_RENTAL' || l.type === 'VIP').length;

  const filteredLockers = useMemo(() => {
    return lockers.filter((l) => {
      // Tab filter
      if (filterTab === 'AVAILABLE' && l.status !== 'AVAILABLE') return false;
      if (filterTab === 'OCCUPIED' && l.status !== 'OCCUPIED') return false;
      if (filterTab === 'MAINTENANCE' && l.status !== 'MAINTENANCE') return false;
      if (filterTab === 'RENTAL' && l.type !== 'MONTHLY_RENTAL' && l.type !== 'VIP') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = l.lockerNumber.toLowerCase().includes(q);
        const nameMatch = l.assignedMemberName?.toLowerCase().includes(q);
        const phoneMatch = l.assignedMemberPhone?.includes(q);
        return numMatch || nameMatch || phoneMatch;
      }
      return true;
    });
  }, [lockers, filterTab, searchQuery]);

  const handleOpenAssign = (locker: GymLockerItem) => {
    setTargetLockerForAssign(locker);
    setSelectedMemberId('');
    setCustomMemberName('');
    setCustomMemberPhone('');
    setLockerType(locker.type);
    setMonthlyRent(String(locker.monthlyRentBdt || 500));
    setAssignModalVisible(true);
  };

  const handleConfirmAssign = async () => {
    if (!targetLockerForAssign) return;

    let memberName = customMemberName.trim();
    let memberPhone = customMemberPhone.trim();

    if (selectedMemberId) {
      const m = members.find((mem) => mem.id === selectedMemberId);
      if (m) {
        memberName = m.fullName;
        memberPhone = m.phone;
      }
    }

    if (!memberName) {
      Alert.alert('Required', 'Please select a member or enter a name.');
      return;
    }

    try {
      await assignLocker(
        targetLockerForAssign.id,
        selectedMemberId || `walkin_${Date.now()}`,
        memberName,
        memberPhone || undefined,
        lockerType,
        lockerType !== 'DAILY_FREE' ? parseFloat(monthlyRent) || 0 : undefined
      );

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setAssignModalVisible(false);
      setTargetLockerForAssign(null);
      setSelectedLocker(null);
      Alert.alert('Locker Assigned! 🔒', `Locker ${targetLockerForAssign.lockerNumber} assigned to ${memberName}.`);
    } catch {
      Alert.alert('Error', 'Could not assign locker.');
    }
  };

  const handleRelease = (locker: GymLockerItem) => {
    Alert.alert(
      'Vacate Locker? 🔑',
      `Has ${locker.assignedMemberName || 'member'} returned the key for Locker ${locker.lockerNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Free Locker',
          style: 'destructive',
          onPress: async () => {
            await releaseLocker(locker.id);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setSelectedLocker(null);
          },
        },
      ]
    );
  };

  const handleSendWhatsAppKeyReminder = (locker: GymLockerItem) => {
    if (!locker.assignedMemberPhone) {
      Alert.alert('No Phone', 'No phone number is saved for this locker.');
      return;
    }
    const cleanPhone = locker.assignedMemberPhone.replace(/[^0-9]/g, '');
    const gymName = gymProfile?.gymName || 'IronForge Fitness Arena';
    const text =
      `*Locker Key Notice — ${gymName}* 🔒\n\n` +
      `Hello *${locker.assignedMemberName}*,\n` +
      `You are currently holding the key for *Locker #${locker.lockerNumber}*.\n\n` +
      `Please remember to return the locker key at the reception desk before leaving the gym floor.\n\n` +
      `Thank you for keeping our facility organized! 💪`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="lock" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Smart Locker Radar</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {availableCount} Vacant • {occupiedCount} Occupied • {totalCount} Total Units
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="close" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* METRICS STATS RIBBON */}
        <View style={[styles.statsRibbon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{availableCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>🟢 VACANT</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: '#FA5252' }]}>{occupiedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>🔴 OCCUPIED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: '#748FFC' }]}>{rentalCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>⭐ RENTALS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: '#FF922B' }]}>{maintenanceCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>🛠️ REPAIR</Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search locker (L-01) or member name..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {[
              { key: 'ALL' as FilterTab, label: `All (${totalCount})` },
              { key: 'AVAILABLE' as FilterTab, label: `🟢 Vacant (${availableCount})` },
              { key: 'OCCUPIED' as FilterTab, label: `🔴 Occupied (${occupiedCount})` },
              { key: 'RENTAL' as FilterTab, label: `⭐ Monthly (${rentalCount})` },
              { key: 'MAINTENANCE' as FilterTab, label: `🛠️ Repair (${maintenanceCount})` },
            ].map((tab) => {
              const active = filterTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setFilterTab(tab.key);
                  }}
                  style={[
                    styles.tabPill,
                    active
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Text
                    style={{
                      fontFamily: active ? F.sansBold : F.sans,
                      fontSize: 11,
                      color: active ? '#000' : colors.textSecondary,
                    }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* LOCKER GRID */}
        <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
          {filteredLockers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="lock-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Lockers Match Filter</Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {filteredLockers.map((locker) => {
                const isAvailable = locker.status === 'AVAILABLE';
                const isOccupied = locker.status === 'OCCUPIED';
                const isMaint = locker.status === 'MAINTENANCE';

                const cardBg = isAvailable
                  ? 'rgba(64, 192, 87, 0.08)'
                  : isOccupied
                  ? 'rgba(250, 82, 82, 0.08)'
                  : 'rgba(255, 146, 43, 0.08)';

                const borderColor = isAvailable
                  ? 'rgba(64, 192, 87, 0.35)'
                  : isOccupied
                  ? 'rgba(250, 82, 82, 0.4)'
                  : 'rgba(255, 146, 43, 0.4)';

                return (
                  <TouchableOpacity
                    key={locker.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSelectedLocker(locker);
                    }}
                    style={[
                      styles.lockerCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: borderColor,
                        width: GRID_CARD_WIDTH,
                      },
                    ]}>
                    <View style={styles.cardTopRow}>
                      <MaterialIcons
                        name={isAvailable ? 'lock-open' : isMaint ? 'build' : 'lock'}
                        size={16}
                        color={isAvailable ? '#40C057' : isMaint ? '#FF922B' : '#FA5252'}
                      />
                      {locker.type === 'VIP' ? (
                        <View style={[styles.miniTypeTag, { backgroundColor: '#FFD43B' }]}>
                          <Text style={{ fontSize: 8, fontFamily: F.monoBold, color: '#000' }}>VIP</Text>
                        </View>
                      ) : locker.type === 'MONTHLY_RENTAL' ? (
                        <View style={[styles.miniTypeTag, { backgroundColor: '#748FFC' }]}>
                          <Text style={{ fontSize: 8, fontFamily: F.monoBold, color: '#FFF' }}>MO</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.lockerNumText, { color: colors.textPrimary }]}>
                      {locker.lockerNumber}
                    </Text>

                    <Text
                      style={[
                        styles.occupantText,
                        {
                          color: isAvailable ? '#40C057' : isMaint ? '#FF922B' : colors.textPrimary,
                        },
                      ]}
                      numberOfLines={1}>
                      {isAvailable ? 'VACANT' : isMaint ? 'REPAIR' : locker.assignedMemberName || 'OCCUPIED'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ----------------- LOCKER DETAIL / ACTION SHEET ----------------- */}
        {selectedLocker && (
          <Modal
            visible={!!selectedLocker}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedLocker(null)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.actionSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.actionSheetHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={[
                        styles.sheetLockerBadge,
                        {
                          backgroundColor:
                            selectedLocker.status === 'AVAILABLE'
                              ? 'rgba(64, 192, 87, 0.15)'
                              : 'rgba(250, 82, 82, 0.15)',
                        },
                      ]}>
                      <Text
                        style={{
                          fontFamily: F.monoBold,
                          fontSize: 16,
                          color: selectedLocker.status === 'AVAILABLE' ? '#40C057' : '#FA5252',
                        }}>
                        {selectedLocker.lockerNumber}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                        {selectedLocker.type === 'VIP'
                          ? 'VIP Locker'
                          : selectedLocker.type === 'MONTHLY_RENTAL'
                          ? 'Monthly Rental Locker'
                          : 'Daily Floor Locker'}
                      </Text>
                      <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary }}>
                        Status:{' '}
                        <Text
                          style={{
                            fontFamily: F.sansBold,
                            color:
                              selectedLocker.status === 'AVAILABLE'
                                ? '#40C057'
                                : selectedLocker.status === 'MAINTENANCE'
                                ? '#FF922B'
                                : '#FA5252',
                          }}>
                          {selectedLocker.status}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedLocker(null)}>
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* OCCUPANCY DETAILS */}
                {selectedLocker.status === 'OCCUPIED' ? (
                  <View style={styles.sheetOccupiedDetails}>
                    <View style={[styles.detailBox, { backgroundColor: colors.glassFill, borderColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>CURRENT HOLDER</Text>
                      <Text style={[styles.detailVal, { color: colors.textPrimary }]}>
                        {selectedLocker.assignedMemberName || 'Unknown Member'}
                      </Text>
                      {selectedLocker.assignedMemberPhone && (
                        <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          📞 {selectedLocker.assignedMemberPhone}
                        </Text>
                      )}
                      {selectedLocker.assignedDate && (
                        <Text style={{ fontFamily: F.mono, fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
                          Assigned: {selectedLocker.assignedDate}
                          {selectedLocker.expiryDate ? ` • Expires: ${selectedLocker.expiryDate}` : ''}
                        </Text>
                      )}
                    </View>

                    {/* ACTION BUTTONS */}
                    <View style={{ gap: 8, marginTop: 14 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleRelease(selectedLocker)}
                        style={[styles.sheetActionBtn, { backgroundColor: '#FA5252' }]}>
                        <MaterialIcons name="key-off" size={16} color="#FFF" />
                        <Text style={[styles.sheetActionBtnText, { color: '#FFF' }]}>
                          Vacate Locker & Return Key (চাবি জমা)
                        </Text>
                      </TouchableOpacity>

                      {selectedLocker.assignedMemberPhone && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendWhatsAppKeyReminder(selectedLocker)}
                          style={[styles.sheetActionBtn, { backgroundColor: '#25D366' }]}>
                          <MaterialIcons name="chat" size={16} color="#FFF" />
                          <Text style={[styles.sheetActionBtnText, { color: '#FFF' }]}>
                            WhatsApp Key Return Reminder
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : selectedLocker.status === 'AVAILABLE' ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ fontFamily: F.sans, fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>
                      This locker is clean, empty, and ready for assignment.
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenAssign(selectedLocker)}
                      style={[styles.sheetActionBtn, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="person-add" size={16} color="#000" />
                      <Text style={[styles.sheetActionBtnText, { color: '#000' }]}>
                        Assign to Member (চাবি প্রদান)
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ fontFamily: F.sans, fontSize: 12, color: '#FF922B', marginBottom: 14 }}>
                      {selectedLocker.notes || 'This locker is marked for maintenance/repair.'}
                    </Text>
                  </View>
                )}

                {/* MAINTENANCE TOGGLE */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    await toggleLockerMaintenance(selectedLocker.id);
                    setSelectedLocker(null);
                  }}
                  style={[styles.maintenanceToggleBtn, { borderColor: colors.border, marginTop: 12 }]}>
                  <MaterialIcons
                    name={selectedLocker.status === 'MAINTENANCE' ? 'check-circle' : 'build'}
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary }}>
                    {selectedLocker.status === 'MAINTENANCE'
                      ? 'Mark as Repaired & Operational'
                      : 'Mark for Lock Repair / Maintenance'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* ----------------- ASSIGN LOCKER MODAL ----------------- */}
        {assignModalVisible && targetLockerForAssign && (
          <Modal
            visible={assignModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setAssignModalVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.assignSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.actionSheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                    Assign Locker {targetLockerForAssign.lockerNumber}
                  </Text>
                  <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {/* SELECT MEMBER */}
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>SELECT FROM ENROLLED MEMBERS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {members.slice(0, 10).map((mem) => {
                        const isSel = selectedMemberId === mem.id;
                        return (
                          <TouchableOpacity
                            key={mem.id}
                            onPress={() => {
                              setSelectedMemberId(isSel ? '' : mem.id);
                              setCustomMemberName(isSel ? '' : mem.fullName);
                              setCustomMemberPhone(isSel ? '' : mem.phone);
                            }}
                            style={[
                              styles.memberSelectPill,
                              isSel
                                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                : { backgroundColor: colors.glassFill, borderColor: colors.border },
                            ]}>
                            <Text
                              style={{
                                fontSize: 11,
                                fontFamily: isSel ? F.sansBold : F.sans,
                                color: isSel ? '#000' : colors.textPrimary,
                              }}>
                              {mem.fullName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* OR MANUAL INPUT */}
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>OR ENTER ATHLETE NAME</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder="e.g. Mahfuzur Rahman"
                    placeholderTextColor={colors.textMuted}
                    value={customMemberName}
                    onChangeText={setCustomMemberName}
                  />

                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 10 }]}>PHONE NUMBER</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder="e.g. 01711223344"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={customMemberPhone}
                    onChangeText={setCustomMemberPhone}
                  />

                  {/* LOCKER TYPE */}
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 10 }]}>LOCKER TYPE</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    {(['DAILY_FREE', 'MONTHLY_RENTAL', 'VIP'] as LockerType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setLockerType(t)}
                        style={[
                          styles.typePill,
                          lockerType === t
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.glassFill, borderColor: colors.border },
                        ]}>
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: F.sansBold,
                            color: lockerType === t ? '#000' : colors.textPrimary,
                          }}>
                          {t === 'DAILY_FREE' ? 'Daily Free' : t === 'MONTHLY_RENTAL' ? 'Monthly Rental' : 'VIP'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {lockerType !== 'DAILY_FREE' && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>MONTHLY RENT (BDT)</Text>
                      <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.glassFill, color: colors.textPrimary, borderColor: colors.border }]}
                        keyboardType="numeric"
                        value={monthlyRent}
                        onChangeText={setMonthlyRent}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmAssign}
                    style={[styles.sheetActionBtn, { backgroundColor: colors.primary, marginTop: 8 }]}>
                    <MaterialIcons name="check" size={16} color="#000" />
                    <Text style={[styles.sheetActionBtnText, { color: '#000' }]}>Confirm Allocation</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontFamily: F.monoBold,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: F.mono,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: F.sans,
  },
  tabsWrapper: {
    marginTop: 10,
    marginBottom: 6,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lockerCard: {
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniTypeTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  lockerNumText: {
    fontSize: 13,
    fontFamily: F.monoBold,
  },
  occupantText: {
    fontSize: 9,
    fontFamily: F.sansBold,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: F.sansBold,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetLockerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  sheetOccupiedDetails: {
    marginTop: 6,
  },
  detailBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  sheetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  sheetActionBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  maintenanceToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  assignSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  formLabel: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  memberSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: F.sans,
    marginBottom: 8,
  },
  typePill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
