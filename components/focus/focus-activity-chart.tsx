import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RollingNumber } from '@/components/ui/rolling-number';
import { Vital } from '@/constants/vital-theme';
import { FocusDailyPoint, FocusHeatmapCell, useFocusStore } from '@/stores/focus-store';

const C = Vital.colors;
const F = Vital.fonts;

type ViewMode = 'BARS' | 'HEATMAP';
type DaysRange = 7 | 14;

export function FocusActivityChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('BARS');
  const [daysRange, setDaysRange] = useState<DaysRange>(7);
  const [selectedBar, setSelectedBar] = useState<FocusDailyPoint | null>(null);
  const [selectedCell, setSelectedCell] = useState<FocusHeatmapCell | null>(null);

  const getWeeklyFocusSeries = useFocusStore((s) => s.getWeeklyFocusSeries);
  const getFocusHeatmapCells = useFocusStore((s) => s.getFocusHeatmapCells);
  const getFocusStats = useFocusStore((s) => s.getFocusStats);

  const series = useMemo(() => getWeeklyFocusSeries(daysRange), [getWeeklyFocusSeries, daysRange]);
  const heatmapCells = useMemo(() => getFocusHeatmapCells(), [getFocusHeatmapCells]);
  const stats = useMemo(() => getFocusStats(), [getFocusStats]);

  const maxMinutes = useMemo(() => {
    const max = Math.max(...series.map((s) => s.minutes), 60);
    return max;
  }, [series]);

  const handleSelectBar = (item: FocusDailyPoint) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selectedBar?.date === item.date) {
      setSelectedBar(null);
    } else {
      setSelectedBar(item);
    }
  };

  const handleSelectCell = (cell: FocusHeatmapCell) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selectedCell?.date === cell.date) {
      setSelectedCell(null);
    } else {
      setSelectedCell(cell);
    }
  };

  return (
    <View style={styles.card}>
      {/* 1. HEADER ROW: TITLE + VIEW SWITCHER (BARS VS HEATMAP) */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <MaterialIcons name="bar-chart" size={15} color="#FCC419" />
          <Text style={styles.titleText}>FOCUS MOMENTUM</Text>
        </View>

        <View style={styles.viewModeSwitcher}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setViewMode('BARS');
            }}
            style={[styles.modeBtn, viewMode === 'BARS' && styles.modeBtnActive]}>
            <MaterialIcons
              name="equalizer"
              size={14}
              color={viewMode === 'BARS' ? '#101416' : C.onSurfaceVariant}
            />
            <Text style={[styles.modeBtnText, viewMode === 'BARS' && styles.modeBtnTextActive]}>
              Bars
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setViewMode('HEATMAP');
            }}
            style={[styles.modeBtn, viewMode === 'HEATMAP' && styles.modeBtnActive]}>
            <MaterialIcons
              name="grid-view"
              size={14}
              color={viewMode === 'HEATMAP' ? '#101416' : C.onSurfaceVariant}
            />
            <Text style={[styles.modeBtnText, viewMode === 'HEATMAP' && styles.modeBtnTextActive]}>
              Heatmap
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. STATS SUMMARY BENTO */}
      <View style={styles.statsBento}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>7-DAY FLOW TIME</Text>
          <View style={styles.statValueRow}>
            <RollingNumber
              value={stats.weeklyTotalMinutes}
              style={styles.statValueMain}
            />
            <Text style={styles.statValueSub}>mins</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>DAILY AVERAGE</Text>
          <Text style={styles.statValueAccent}>{stats.dailyAverageMinutes}m / day</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statValueStreak}>🔥 {stats.streakDays}d active</Text>
        </View>
      </View>

      {/* 3. VIEW MODE 1: BAR CHART */}
      {viewMode === 'BARS' && (
        <View style={styles.chartContainer}>
          {/* RANGE TOGGLE (7D VS 14D) */}
          <View style={styles.rangeRow}>
            <Text style={styles.rangeLabel}>
              Showing last {daysRange} days of flow sessions
            </Text>
            <View style={styles.rangeButtons}>
              <TouchableOpacity
                onPress={() => setDaysRange(7)}
                style={[styles.rangePill, daysRange === 7 && styles.rangePillActive]}>
                <Text
                  style={[
                    styles.rangePillText,
                    daysRange === 7 && styles.rangePillTextActive,
                  ]}>
                  7D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDaysRange(14)}
                style={[styles.rangePill, daysRange === 14 && styles.rangePillActive]}>
                <Text
                  style={[
                    styles.rangePillText,
                    daysRange === 14 && styles.rangePillTextActive,
                  ]}>
                  14D
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BARS GRAPH AREA */}
          <View style={styles.barsArea}>
            {series.map((item) => {
              const heightPercent = Math.min(100, Math.max(8, (item.minutes / maxMinutes) * 100));
              const isSelected = selectedBar?.date === item.date;

              return (
                <TouchableOpacity
                  key={item.date}
                  activeOpacity={0.8}
                  onPress={() => handleSelectBar(item)}
                  style={styles.barCol}>
                  {/* BAR PILL */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPercent}%` },
                        item.isToday && styles.barFillToday,
                        isSelected && styles.barFillSelected,
                        item.minutes === 0 && styles.barFillEmpty,
                      ]}
                    />
                  </View>

                  {/* DAY LABEL */}
                  <Text
                    style={[
                      styles.dayLabel,
                      item.isToday && styles.dayLabelToday,
                      isSelected && styles.dayLabelSelected,
                    ]}>
                    {item.dayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* INTERACTIVE BAR TOOLTIP */}
          {selectedBar && (
            <View style={styles.tooltipCard}>
              <View style={styles.tooltipHeader}>
                <Text style={styles.tooltipDate}>{selectedBar.date}</Text>
                <TouchableOpacity onPress={() => setSelectedBar(null)}>
                  <MaterialIcons name="close" size={14} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <View style={styles.tooltipStatsRow}>
                <Text style={styles.tooltipMainText}>
                  ⏱️ {selectedBar.minutes} minutes in deep flow
                </Text>
                <Text style={styles.tooltipSubText}>
                  ({selectedBar.rounds} Pomodoro {selectedBar.rounds === 1 ? 'round' : 'rounds'})
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 4. VIEW MODE 2: GITHUB-STYLE FLOW HEATMAP */}
      {viewMode === 'HEATMAP' && (
        <View style={styles.heatmapContainer}>
          {/* WEEKDAYS HEADER */}
          <View style={styles.weekdaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekdayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* HEATMAP GRID */}
          <View style={styles.heatmapGrid}>
            {heatmapCells.map((cell) => {
              const isSelected = selectedCell?.date === cell.date;

              const getCellBg = () => {
                if (!cell.isCurrentMonth) return 'rgba(255, 255, 255, 0.02)';
                if (cell.level === 3) return '#FCC419';
                if (cell.level === 2) return 'rgba(252, 196, 25, 0.6)';
                if (cell.level === 1) return 'rgba(252, 196, 25, 0.25)';
                return 'rgba(255, 255, 255, 0.05)';
              };

              const textCol =
                cell.level === 3
                  ? '#101416'
                  : cell.isCurrentMonth
                  ? C.onSurface
                  : 'rgba(255, 255, 255, 0.2)';

              return (
                <TouchableOpacity
                  key={cell.date}
                  activeOpacity={0.75}
                  onPress={() => handleSelectCell(cell)}
                  style={[
                    styles.heatmapCell,
                    { backgroundColor: getCellBg() },
                    cell.isToday && styles.heatmapCellToday,
                    isSelected && styles.heatmapCellSelected,
                  ]}>
                  <Text
                    style={[
                      styles.heatmapCellText,
                      { color: textCol },
                      cell.level === 3 && styles.heatmapCellTextDark,
                    ]}>
                    {cell.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* HEATMAP LEGEND SCALE */}
          <View style={styles.legendRow}>
            <Text style={styles.legendLabel}>Less</Text>
            <View style={[styles.legendBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
            <View style={[styles.legendBox, { backgroundColor: 'rgba(252, 196, 25, 0.25)' }]} />
            <View style={[styles.legendBox, { backgroundColor: 'rgba(252, 196, 25, 0.6)' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#FCC419' }]} />
            <Text style={styles.legendLabel}>60m+ Flow</Text>
          </View>

          {/* INTERACTIVE CELL TOOLTIP */}
          {selectedCell && (
            <View style={styles.tooltipCard}>
              <View style={styles.tooltipHeader}>
                <Text style={styles.tooltipDate}>{selectedCell.date}</Text>
                <TouchableOpacity onPress={() => setSelectedCell(null)}>
                  <MaterialIcons name="close" size={14} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <Text style={styles.tooltipMainText}>
                {selectedCell.minutes > 0
                  ? `⚡ ${selectedCell.minutes} mins (${selectedCell.rounds} rounds completed)`
                  : '🌱 Rest day (0 mins recorded)'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141A1D',
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252, 196, 25, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 25, 0.2)',
  },
  titleText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: '#FCC419',
    letterSpacing: 0.6,
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: '#FCC419',
  },
  modeBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  modeBtnTextActive: {
    color: '#101416',
    fontWeight: '800',
  },
  statsBento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  statLabel: {
    fontFamily: F.sansBold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statValueMain: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statValueSub: {
    fontFamily: F.sansMedium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  statValueAccent: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#20C997',
  },
  statValueStreak: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#FCC419',
  },
  chartContainer: {
    gap: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  rangeButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  rangePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rangePillActive: {
    backgroundColor: 'rgba(252, 196, 25, 0.2)',
  },
  rangePillText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  rangePillTextActive: {
    color: '#FCC419',
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barTrack: {
    width: 14,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(252, 196, 25, 0.4)',
    borderRadius: 7,
  },
  barFillToday: {
    backgroundColor: '#FCC419',
    shadowColor: '#FCC419',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  barFillSelected: {
    backgroundColor: '#20C997',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  barFillEmpty: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayLabel: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  dayLabelToday: {
    fontFamily: F.sansBold,
    color: '#FCC419',
  },
  dayLabelSelected: {
    fontFamily: F.sansBold,
    color: '#20C997',
  },
  tooltipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(252, 196, 25, 0.25)',
    gap: 4,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tooltipDate: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tooltipStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipMainText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  tooltipSubText: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  heatmapContainer: {
    gap: 10,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    width: 34,
    textAlign: 'center',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  heatmapCell: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCellToday: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heatmapCellSelected: {
    borderWidth: 2,
    borderColor: '#20C997',
  },
  heatmapCellText: {
    fontFamily: F.sansBold,
    fontSize: 11,
  },
  heatmapCellTextDark: {
    color: '#101416',
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 6,
  },
  legendLabel: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
