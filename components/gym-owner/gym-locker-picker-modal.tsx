/**
 * 🔒 Gym Locker Picker Modal (GymOS)
 * Streamlined changing room locker picker for assigning available lockers to members.
 * Shows only available/free lockers with 1-tap assignment and category tabs (Daily, Monthly, VIP).
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymLockerItem } from '@/types/gym';

const F = Vital.fonts;

type FilterTab = 'ALL_FREE' | 'DAILY' | 'RENTAL' | 'VIP';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectLocker: (lockerNumber: string) => void;
  selectedLockerNumber?: string;
  athleteName?: string;
  athleteGender?: 'MALE' | 'FEMALE' | 'OTHER';
};

export function GymLockerPickerModal({
  visible,
  onClose,
  onSelectLocker,
  selectedLockerNumber = '',
  athleteName = 'Athlete',
  athleteGender,
}: Props) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { lockers } = useGymOwnerStore();

  const [filterTab, setFilterTab] = useState<FilterTab>('ALL_FREE');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string>(selectedLockerNumber);

  // Sync tempSelected whenever modal opens
  React.useEffect(() => {
    if (visible) {
      setTempSelected(selectedLockerNumber);
    }
  }, [visible, selectedLockerNumber]);

  // Free lockers count
  const availableCount = lockers.filter((l) => l.status === 'AVAILABLE').length;

  // Filtered Lockers — strictly Free lockers (or currently selected locker)
  const filteredLockers = useMemo(() => {
    return lockers.filter((l) => {
      // Must be AVAILABLE, or the currently selected locker
      const isCandidate =
        l.status === 'AVAILABLE' ||
        l.lockerNumber.toUpperCase() === selectedLockerNumber.toUpperCase() ||
        l.lockerNumber.toUpperCase() === tempSelected.toUpperCase();

      if (!isCandidate) return false;

      // Tab filter
      if (filterTab === 'DAILY' && l.type !== 'DAILY_FREE') return false;
      if (filterTab === 'RENTAL' && l.type !== 'MONTHLY_RENTAL') return false;
      if (filterTab === 'VIP' && l.type !== 'VIP') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return l.lockerNumber.toLowerCase().includes(q);
      }
      return true;
    });
  }, [lockers, filterTab, searchQuery, selectedLockerNumber, tempSelected]);

  const firstAvailableLocker = useMemo(
    () => lockers.find((l) => l.status === 'AVAILABLE'),
    [lockers]
  );

  // 1-Tap Auto-Assign Next Available Locker
  const handleAutoAssign = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (firstAvailableLocker) {
      setTempSelected(firstAvailableLocker.lockerNumber);
    }
  };

  const handleSelectLockerTile = (locker: GymLockerItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTempSelected(locker.lockerNumber === tempSelected ? '' : locker.lockerNumber);
  };

  const handleConfirm = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectLocker(tempSelected);
    onClose();
  };

  const handleClear = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectLocker('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(0, 0, 0, 0.45)' }]}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#0F1318' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]}>
          
          {/* HEADER ROW */}
          <View style={[styles.headerRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.headerIconBubble, { backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7' }]}>
                <MaterialIcons name="meeting-room" size={20} color={isDark ? '#89FE00' : '#059669'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  ASSIGN LOCKER
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  Select an available changing room locker for {athleteName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9', borderColor: colors.border }]}>
              <MaterialIcons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* SEARCH & 1-TAP AUTO-ASSIGN ROW */}
          <View style={styles.actionToolbarRow}>
            <View style={[styles.searchBox, { backgroundColor: isDark ? '#161D24' : '#F1F5F9', borderColor: colors.border }]}>
              <MaterialIcons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search locker (e.g. 04)..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="cancel" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAutoAssign}
              style={[styles.autoAssignBtn, { backgroundColor: isDark ? '#89FE00' : '#059669' }]}>
              <MaterialIcons name="bolt" size={15} color={isDark ? '#000000' : '#FFFFFF'} />
              <Text style={[styles.autoAssignBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                {firstAvailableLocker ? `Auto-Pick #${firstAvailableLocker.lockerNumber}` : 'Auto-Pick'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* FILTER TABS */}
          <View style={styles.filterTabsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
              {[
                { id: 'ALL_FREE' as const, label: `All Free (${availableCount})` },
                { id: 'DAILY' as const, label: 'Daily' },
                { id: 'RENTAL' as const, label: 'Monthly' },
                { id: 'VIP' as const, label: 'VIP' },
              ].map((tab) => {
                const isTabActive = filterTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setFilterTab(tab.id);
                    }}
                    style={[
                      styles.filterTabPill,
                      isTabActive
                        ? {
                            backgroundColor: isDark ? 'rgba(137, 254, 0, 0.15)' : '#DCFCE7',
                            borderColor: isDark ? '#89FE00' : '#059669',
                          }
                        : {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                            borderColor: colors.border,
                          },
                    ]}>
                    <Text
                      style={[
                        styles.filterTabText,
                        {
                          color: isTabActive ? (isDark ? '#89FE00' : '#059669') : colors.textSecondary,
                          fontFamily: isTabActive ? F.sansBold : F.sans,
                        },
                      ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* LOCKER GRID (FREE LOCKERS ONLY - 4 PERFECT COLUMNS) */}
          <ScrollView contentContainerStyle={styles.gridScrollContent} showsVerticalScrollIndicator={false}>
            {filteredLockers.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <MaterialIcons name="lock-outline" size={36} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                  No Free Lockers Found
                </Text>
                <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                  All lockers in this category are currently occupied or in use
                </Text>
              </View>
            ) : (
              <View style={styles.gridWrap}>
                {filteredLockers.map((locker) => {
                  const isSelected = tempSelected.toUpperCase() === locker.lockerNumber.toUpperCase();

                  let tileBg = isDark ? 'rgba(64, 192, 87, 0.08)' : '#F0FDF4';
                  let tileBorder = isDark ? 'rgba(64, 192, 87, 0.25)' : '#86EFAC';
                  let textColor = colors.textPrimary;
                  let iconColor = '#40C057';

                  if (isSelected) {
                    tileBg = isDark ? '#89FE00' : '#059669';
                    tileBorder = isDark ? '#89FE00' : '#059669';
                    textColor = isDark ? '#000000' : '#FFFFFF';
                    iconColor = isDark ? '#000000' : '#FFFFFF';
                  }

                  return (
                    <TouchableOpacity
                      key={locker.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectLockerTile(locker)}
                      style={[
                        styles.lockerTile,
                        {
                          backgroundColor: tileBg,
                          borderColor: tileBorder,
                        },
                      ]}>
                      {/* TOP BADGE / TYPE */}
                      <View style={styles.tileHeaderRow}>
                        <MaterialIcons
                          name={isSelected ? 'check' : 'lock-open'}
                          size={12}
                          color={iconColor}
                        />
                        <Text
                          style={[
                            styles.tileWingText,
                            { color: isSelected ? (isDark ? '#000' : '#FFF') : colors.textMuted },
                          ]}>
                          {locker.type === 'VIP' ? 'VIP' : locker.type === 'MONTHLY_RENTAL' ? 'RENT' : 'DAILY'}
                        </Text>
                      </View>

                      {/* LOCKER NUMBER */}
                      <Text
                        style={[
                          styles.tileLockerNum,
                          { color: textColor },
                        ]}
                        numberOfLines={1}>
                        {locker.lockerNumber}
                      </Text>

                      {/* STATUS TEXT */}
                      <Text
                        style={[
                          styles.tileStatusText,
                          {
                            color: isSelected
                              ? (isDark ? '#000000' : '#FFFFFF')
                              : '#40C057',
                          },
                        ]}
                        numberOfLines={1}>
                        {isSelected ? 'SELECTED' : 'FREE'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* BOTTOM CONFIRMATION DOCK */}
          <View
            style={[
              styles.bottomDock,
              {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                backgroundColor: isDark ? '#0A0D10' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}>
            <View style={styles.selectionSummaryCol}>
              <Text style={[styles.summaryPreText, { color: colors.textSecondary }]}>
                ALLOCATION TARGET:
              </Text>
              <Text style={[styles.summaryLockerName, { color: tempSelected ? (isDark ? '#89FE00' : '#059669') : colors.textMuted }]}>
                {tempSelected ? `Locker #${tempSelected} Selected` : 'No Locker Assigned'}
              </Text>
            </View>

            <View style={styles.bottomButtonsRow}>
              {tempSelected ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClear}
                  style={[styles.clearBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirm}
                style={[styles.confirmBtn, { backgroundColor: isDark ? '#89FE00' : '#059669' }]}>
                <MaterialIcons name="done" size={16} color={isDark ? '#000000' : '#FFFFFF'} />
                <Text style={[styles.confirmBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                  {tempSelected ? 'Confirm Locker' : 'Done'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: F.sansBold,
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: F.sans,
    paddingVertical: 0,
    height: '100%',
  },
  autoAssignBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  autoAssignBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  filterTabsRow: {
    paddingBottom: 10,
  },
  filterTabsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
  },
  filterTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 11,
  },
  gridScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  lockerTile: {
    width: '23%',
    minWidth: 70,
    flexGrow: 1,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileWingText: {
    fontSize: 8,
    fontFamily: F.monoBold,
  },
  tileLockerNum: {
    fontSize: 13,
    fontFamily: F.monoBold,
    textAlign: 'center',
  },
  tileStatusText: {
    fontSize: 8,
    fontFamily: F.monoBold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyStateBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  emptyStateSub: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  bottomDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  selectionSummaryCol: {
    flex: 1,
    gap: 2,
  },
  summaryPreText: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  summaryLockerName: {
    fontSize: 12,
    fontFamily: F.monoBold,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
});
