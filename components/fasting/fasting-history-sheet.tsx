import React, { useMemo, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Vital } from '@/constants/vital-theme';
import { FastingSessionRow } from './fasting-session-row';
import type { FastingProtocol, FastingSessionStatus } from '@/types/fasting';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  visible: boolean;
  sessions: FastingSessionStatus[];
  onClose: () => void;
  onSelectSession?: (session: FastingSessionStatus) => void;
  onFetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
};

export type HistorySection = {
  title: string;
  count: number;
  data: FastingSessionStatus[];
};

type ProtocolFilter = 'ALL' | 'GOAL_MET' | FastingProtocol;

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Miller's Law (Chunking): Groups flat list of fasts into temporal chunks
 * (This Week, Last Week, Month Year).
 */
function groupSessions(sessions: FastingSessionStatus[]): HistorySection[] {
  if (!sessions.length) return [];

  // Ensure descending order
  const sorted = [...sessions].sort((a, b) => {
    const timeA = new Date(a.startedAt || a.endedAt || 0).getTime();
    const timeB = new Date(b.startedAt || b.endedAt || 0).getTime();
    return timeB - timeA;
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const groups: { [key: string]: FastingSessionStatus[] } = {};
  const order: string[] = [];

  for (const session of sorted) {
    const date = new Date(session.startedAt || session.endedAt || Date.now());
    const isThisYear = date.getFullYear() === currentYear;
    const isThisMonth = isThisYear && date.getMonth() === currentMonth;

    // Difference in calendar days
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let key: string;
    if (diffDays >= 0 && diffDays < 7) {
      key = 'THIS WEEK';
    } else if (diffDays >= 7 && diffDays < 14) {
      key = 'LAST WEEK';
    } else {
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      key = isThisYear ? monthName.toUpperCase() : `${monthName.toUpperCase()} ${date.getFullYear()}`;
    }

    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(session);
  }

  return order.map((title) => ({
    title,
    count: groups[title].length,
    data: groups[title],
  }));
}

export function FastingHistorySheet({
  visible,
  sessions,
  onClose,
  onSelectSession,
  onFetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: Props) {
  const insets = useSafeAreaInsets();

  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedFilter, setSelectedFilter] = useState<ProtocolFilter>('ALL');

  const isFiltered = selectedYear !== 'ALL' || selectedFilter !== 'ALL';

  // 1. Extract all available unique years from sessions
  const yearOptions = useMemo(() => {
    const yearsMap = new Map<string, number>();
    for (const session of sessions) {
      const d = new Date(session.startedAt || session.endedAt || Date.now());
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear().toString();
        yearsMap.set(y, (yearsMap.get(y) || 0) + 1);
      }
    }

    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => Number(b) - Number(a));
    return [
      { year: 'ALL', label: 'All Time', count: sessions.length },
      ...sortedYears.map((y) => ({
        year: y,
        label: y,
        count: yearsMap.get(y) || 0,
      })),
    ];
  }, [sessions]);

  // 2. Filter sessions by Year & Protocol / Goal Met
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Year filter
      if (selectedYear !== 'ALL') {
        const d = new Date(session.startedAt || session.endedAt || Date.now());
        if (d.getFullYear().toString() !== selectedYear) return false;
      }

      // Outcome / Protocol filter
      if (selectedFilter === 'GOAL_MET' && !session.goalMet) return false;
      if (
        selectedFilter !== 'ALL' &&
        selectedFilter !== 'GOAL_MET' &&
        session.protocol !== selectedFilter
      ) {
        return false;
      }

      return true;
    });
  }, [sessions, selectedYear, selectedFilter]);

  // 3. Chunk filtered sessions into sections
  const sections = useMemo(() => groupSessions(filteredSessions), [filteredSessions]);

  // 4. Compute Aggregate Stats for the filtered scope
  const stats = useMemo(() => {
    const total = filteredSessions.length;
    if (total === 0) return { total: 0, avgHours: '0.0', goalRate: 0, totalHours: '0' };

    const totalMinutes = filteredSessions.reduce((acc, s) => acc + (s.elapsedMinutes || 0), 0);
    const goalMetCount = filteredSessions.filter((s) => s.goalMet).length;

    const avgHours = (totalMinutes / total / 60).toFixed(1);
    const totalHours = Math.round(totalMinutes / 60).toLocaleString();
    const goalRate = Math.round((goalMetCount / total) * 100);

    return { total, avgHours, goalRate, totalHours };
  }, [filteredSessions]);

  // 5. Monthly Activity Heatmap counts for the selected year (or current year)
  const monthlyActivity = useMemo(() => {
    const targetYear =
      selectedYear !== 'ALL'
        ? Number(selectedYear)
        : new Date().getFullYear();

    const monthCounts = new Array(12).fill(0);
    for (const session of sessions) {
      const d = new Date(session.startedAt || session.endedAt || Date.now());
      if (d.getFullYear() === targetYear) {
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          monthCounts[m] += 1;
        }
      }
    }

    return { year: targetYear, counts: monthCounts };
  }, [sessions, selectedYear]);

  const handleResetFilters = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedYear('ALL');
    setSelectedFilter('ALL');
  };

  const toggleFilterOpen = () => {
    void Haptics.selectionAsync();
    setIsFilterOpen((prev) => !prev);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Fasting History</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>
                  {stats.total} {stats.total === 1 ? 'fast' : 'fasts'} in view
                </Text>
                {isFiltered && (
                  <Pressable
                    onPress={handleResetFilters}
                    style={styles.activeFilterPill}
                    accessibilityRole="button"
                    accessibilityLabel="Clear active filters">
                    <Text style={styles.activeFilterPillText}>
                      {selectedYear !== 'ALL' ? selectedYear : ''}
                      {selectedYear !== 'ALL' && selectedFilter !== 'ALL' ? ' · ' : ''}
                      {selectedFilter === 'GOAL_MET'
                        ? 'Goal Met'
                        : selectedFilter !== 'ALL'
                          ? selectedFilter
                          : ''}
                    </Text>
                    <MaterialIcons name="close" size={12} color={C.primary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Header Actions: Filter & Close */}
            <View style={styles.headerActions}>
              <Pressable
                onPress={toggleFilterOpen}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Filter fasting history"
                style={({ pressed }) => [
                  styles.iconButton,
                  (isFilterOpen || isFiltered) && styles.iconButtonActive,
                  pressed && { opacity: 0.7 },
                ]}>
                <MaterialIcons
                  name="tune"
                  size={18}
                  color={isFilterOpen || isFiltered ? C.primary : C.onSurfaceVariant}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  onClose();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
                <MaterialIcons name="close" size={18} color={C.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>

          {/* Collapsible Filter Panel */}
          {isFilterOpen && (
            <View style={styles.filterPanel}>
              {/* Filter Panel Header */}
              <View style={styles.filterPanelHeader}>
                <Text style={styles.filterPanelTitle}>FILTER BY TIMEFRAME & GOAL</Text>
                {isFiltered && (
                  <Pressable onPress={handleResetFilters} hitSlop={8}>
                    <Text style={styles.filterResetText}>Reset All</Text>
                  </Pressable>
                )}
              </View>

              {/* Year Selector */}
              {yearOptions.length > 2 && (
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>YEAR</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}>
                    {yearOptions.map((opt) => {
                      const isSelected = selectedYear === opt.year;
                      return (
                        <Pressable
                          key={opt.year}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            setSelectedYear(opt.year);
                          }}
                          style={({ pressed }) => [
                            styles.chipPressable,
                            pressed && { opacity: 0.75 },
                          ]}>
                          <View
                            style={[
                              styles.yearChipInner,
                              isSelected && styles.yearChipInnerSelected,
                            ]}>
                            <Text
                              style={[
                                styles.yearChipText,
                                isSelected && styles.yearChipTextSelected,
                              ]}>
                              {opt.label}
                            </Text>
                            <View
                              style={[
                                styles.yearCountBadge,
                                isSelected && styles.yearCountBadgeSelected,
                              ]}>
                              <Text
                                style={[
                                  styles.yearCountText,
                                  isSelected && styles.yearCountTextSelected,
                                ]}>
                                {opt.count}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Protocol & Goal Selector */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>PROTOCOL & OUTCOME</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScrollContent}>
                  {/* All */}
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedFilter('ALL');
                    }}
                    style={({ pressed }) => [
                      styles.chipPressable,
                      pressed && { opacity: 0.75 },
                    ]}>
                    <View
                      style={[
                        styles.filterChipInner,
                        selectedFilter === 'ALL' && styles.filterChipInnerSelected,
                      ]}>
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFilter === 'ALL' && styles.filterChipTextSelected,
                        ]}>
                        All
                      </Text>
                    </View>
                  </Pressable>

                  {/* Goal Met */}
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedFilter('GOAL_MET');
                    }}
                    style={({ pressed }) => [
                      styles.chipPressable,
                      pressed && { opacity: 0.75 },
                    ]}>
                    <View
                      style={[
                        styles.filterChipInner,
                        selectedFilter === 'GOAL_MET' && styles.filterChipInnerSelected,
                      ]}>
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFilter === 'GOAL_MET' && styles.filterChipTextSelected,
                        ]}>
                        Goal Met
                      </Text>
                    </View>
                  </Pressable>

                  {/* Protocols */}
                  {(['16:8', '18:6', '20:4', 'OMAD'] as const).map((proto) => {
                    const isSelected = selectedFilter === proto;
                    return (
                      <Pressable
                        key={proto}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setSelectedFilter(proto);
                        }}
                        style={({ pressed }) => [
                          styles.chipPressable,
                          pressed && { opacity: 0.75 },
                        ]}>
                        <View
                          style={[
                            styles.filterChipInner,
                            isSelected && styles.filterChipInnerSelected,
                          ]}>
                          <Text
                            style={[
                              styles.filterChipText,
                              isSelected && styles.filterChipTextSelected,
                            ]}>
                            {proto}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Option 1: Unified Hero Widget (Merged Consistency Strip + Stats Ribbon) */}
          {stats.total > 0 && (
            <View style={styles.unifiedHeroCard}>
              {/* Top: 12-Month Consistency Heatmap Strip */}
              <View style={styles.heroHeatmapSection}>
                <View style={styles.heroHeatmapHeader}>
                  <Text style={styles.heroHeatmapTitle}>
                    {monthlyActivity.year} CONSISTENCY
                  </Text>
                  <Text style={styles.heroHeatmapSubtitle}>
                    {stats.total} total fasts
                  </Text>
                </View>
                <View style={styles.heatmapRow}>
                  {MONTH_NAMES.map((mName, idx) => {
                    const count = monthlyActivity.counts[idx];
                    const hasFasts = count > 0;
                    return (
                      <View key={mName} style={styles.heatmapCol}>
                        <View
                          style={[
                            styles.heatmapDot,
                            hasFasts && styles.heatmapDotActive,
                            count >= 10 && styles.heatmapDotHigh,
                          ]}
                        />
                        <Text
                          style={[
                            styles.heatmapMonthText,
                            hasFasts && styles.heatmapMonthTextActive,
                          ]}>
                          {mName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Subtle Hairline Divider */}
              <View style={styles.heroDivider} />

              {/* Bottom: Compact Metrics Ribbon */}
              <View style={styles.heroStatsRibbon}>
                <View style={styles.heroStatCol}>
                  <Text style={styles.heroStatLabel}>TOTAL FASTS</Text>
                  <Text style={styles.heroStatVal}>{stats.total}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.heroStatCol}>
                  <Text style={styles.heroStatLabel}>AVG DURATION</Text>
                  <Text style={styles.heroStatVal}>{stats.avgHours}h</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.heroStatCol}>
                  <Text style={styles.heroStatLabel}>TOTAL HOURS</Text>
                  <Text style={styles.heroStatVal}>{stats.totalHours}h</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.heroStatCol}>
                  <Text style={styles.heroStatLabel}>GOAL SUCCESS</Text>
                  <Text style={styles.heroStatValHighlight}>{stats.goalRate}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* Virtualized & Chunked SectionList */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.sessionId}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={5}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage && onFetchNextPage) {
                onFetchNextPage();
              }
            }}
            renderSectionHeader={({ section: { title, count } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {count} {count === 1 ? 'fast' : 'fasts'}
                  </Text>
                </View>
              </View>
            )}
            renderItem={({ item, index, section }) => (
              <View
                style={[
                  styles.itemContainer,
                  index === 0 && styles.itemFirst,
                  index === section.data.length - 1 && styles.itemLast,
                ]}>
                <FastingSessionRow
                  session={item}
                  showDivider={index > 0}
                  onPress={onSelectSession ? () => onSelectSession(item) : undefined}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="filter-list-off" size={38} color={C.outline} />
                <Text style={styles.emptyTitle}>No matching fasts found</Text>
                <Text style={styles.emptyText}>
                  Try clearing your filters or selecting a different year.
                </Text>
                <Pressable onPress={handleResetFilters} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Reset Filters</Text>
                </Pressable>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={styles.footerLoaderText}>Loading more sessions...</Text>
                </View>
              ) : (
                <View style={styles.footerSpacer} />
              )
            }
          />

          {/* Footer Close CTA */}
          <View style={styles.footer}>
            <PrimaryButton label="Close" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  flex: { flex: 1 },
  sheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.glassBorder,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  subtitle: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 206, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(137, 206, 255, 0.25)',
  },
  activeFilterPillText: {
    color: C.primary,
    fontSize: 10,
    fontFamily: F.sansSemiBold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.glassBorder,
    position: 'relative',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(137, 206, 255, 0.18)',
    borderColor: C.primary,
  },

  // Collapsible Filter Panel
  filterPanel: {
    backgroundColor: C.surfaceLow,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterPanelTitle: {
    color: C.onSurfaceVariant,
    fontSize: 9,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
  },
  filterResetText: {
    color: C.primary,
    fontSize: 11,
    fontFamily: F.sansSemiBold,
  },
  filterGroup: {
    gap: 6,
  },
  filterGroupLabel: {
    color: C.outline,
    fontSize: 9,
    fontFamily: F.sansSemiBold,
    letterSpacing: 0.6,
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  chipPressable: {
    // NativeWind protection
  },
  yearChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  yearChipInnerSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  yearChipText: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sansSemiBold,
  },
  yearChipTextSelected: {
    color: C.background,
    fontFamily: F.sansBold,
  },
  yearCountBadge: {
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  yearCountBadgeSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  yearCountText: {
    color: C.onSurfaceVariant,
    fontSize: 9,
    fontFamily: F.sansMedium,
  },
  yearCountTextSelected: {
    color: C.background,
  },

  filterChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  filterChipInnerSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterChipText: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sansMedium,
  },
  filterChipTextSelected: {
    color: C.background,
    fontFamily: F.sansBold,
  },

  // Option 1: Unified Hero Widget
  unifiedHeroCard: {
    backgroundColor: C.surfaceLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  heroHeatmapSection: {
    gap: 6,
    paddingBottom: 8,
  },
  heroHeatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroHeatmapTitle: {
    color: C.onSurfaceVariant,
    fontSize: 9,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
  },
  heroHeatmapSubtitle: {
    color: C.outline,
    fontSize: 9,
    fontFamily: F.sansMedium,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heatmapCol: {
    alignItems: 'center',
    gap: 3,
  },
  heatmapDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  heatmapDotActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  heatmapDotHigh: {
    backgroundColor: C.primary,
    borderColor: '#6ee7b7',
  },
  heatmapMonthText: {
    color: C.outline,
    fontSize: 9,
    fontFamily: F.sansMedium,
  },
  heatmapMonthTextActive: {
    color: C.onSurfaceVariant,
    fontFamily: F.sansSemiBold,
  },
  heroDivider: {
    height: 1,
    backgroundColor: C.glassBorder,
    marginVertical: 4,
  },
  heroStatsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  heroStatCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  heroStatLabel: {
    color: C.outline,
    fontSize: 8.5,
    fontFamily: F.sansSemiBold,
    letterSpacing: 0.6,
  },
  heroStatVal: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  heroStatValHighlight: {
    color: C.primary,
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.glassBorder,
  },

  // Section Header
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sansBold,
    letterSpacing: 0.8,
  },
  sectionBadge: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  sectionBadgeText: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.sansMedium,
  },

  // Item card styling
  itemContainer: {
    backgroundColor: C.surfaceLow,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
  },
  itemFirst: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
  },
  itemLast: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 1,
    marginBottom: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: F.sansSemiBold,
    marginTop: 4,
  },
  emptyText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  resetBtnText: {
    color: C.primary,
    fontSize: 12,
    fontFamily: F.sansSemiBold,
  },

  // Footer & Loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  footerLoaderText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sans,
  },
  footerSpacer: {
    height: 8,
  },
  footer: {
    marginTop: 6,
  },
});
