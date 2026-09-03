/**
 * Attractive Calendar & Date Picker Modal (GymOS)
 * Ultra-sleek, interactive, multi-view date selector with Age Presets, Year/Month Grids,
 * Haptics, and instant Birthday & Age calculation.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

const F = Vital.fonts;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Common fitness / gym membership age presets
const AGE_PRESETS = [
  { label: '18 yrs', age: 18 },
  { label: '20 yrs', age: 20 },
  { label: '22 yrs', age: 22 },
  { label: '25 yrs', age: 25 },
  { label: '28 yrs', age: 28 },
  { label: '30 yrs', age: 30 },
  { label: '35 yrs', age: 35 },
  { label: '40 yrs', age: 40 },
  { label: '45 yrs', age: 45 },
  { label: '50 yrs', age: 50 },
];

type CalendarViewMode = 'DAYS' | 'MONTHS' | 'YEARS';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateString: string) => void;
  initialDate?: string; // YYYY-MM-DD
  title?: string;
  subtitle?: string;
  maxDate?: string; // YYYY-MM-DD (defaults to today for birthdays)
  minDate?: string; // YYYY-MM-DD (defaults to 1940)
};

export function AttractiveCalendarModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Birthday',
  subtitle = 'Pick member date of birth for age & milestone tracking',
  maxDate,
  minDate = '1940-01-01',
}: Props) {
  const { colors, isDark } = useThemeColors();

  // Current today reference
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Parse initial date or default to 25 years ago
  const defaultYear = today.getFullYear() - 24;
  const parseDate = (dStr?: string) => {
    if (dStr && /^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const parts = dStr.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(defaultYear, 0, 15);
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDate(initialDate));
  const [viewYear, setViewYear] = useState<number>(() => parseDate(initialDate).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => parseDate(initialDate).getMonth());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('DAYS');

  // Sync with initialDate prop changes
  useEffect(() => {
    if (visible) {
      const d = parseDate(initialDate);
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setViewMode('DAYS');
    }
  }, [visible, initialDate]);

  // Selected date formatted as YYYY-MM-DD
  const selectedDateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Calculate age & birthday meta
  const ageMeta = useMemo(() => {
    const birthYear = selectedDate.getFullYear();
    const birthMonth = selectedDate.getMonth();
    const birthDay = selectedDate.getDate();

    let age = today.getFullYear() - birthYear;
    const mDiff = today.getMonth() - birthMonth;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }

    // Days until next birthday
    const nextBday = new Date(today.getFullYear(), birthMonth, birthDay);
    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffDays = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      age: Math.max(0, age),
      daysUntilBday: diffDays,
      isTodayBirthday: diffDays === 0 || diffDays === 365,
    };
  }, [selectedDate, today]);

  // Days matrix for the current viewMonth & viewYear
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dayNumber: 0,
        dateStr: '',
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: true,
      });
    }

    // Days of the month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected =
        selectedDate.getFullYear() === viewYear &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getDate() === d;
      const isToday = dStr === todayStr;
      const isDisabled = maxDate ? dStr > maxDate : false;

      days.push({
        dayNumber: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isSelected,
        isToday,
        isDisabled,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, todayStr, maxDate]);

  // Years array (1940 to 2026)
  const availableYears = useMemo(() => {
    const minY = parseInt(minDate.split('-')[0], 10) || 1940;
    const maxY = maxDate ? parseInt(maxDate.split('-')[0], 10) : today.getFullYear();
    const years: number[] = [];
    for (let y = maxY; y >= minY; y--) {
      years.push(y);
    }
    return years;
  }, [minDate, maxDate, today]);

  const handlePrevMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
  };

  const handleSelectPresetAge = (age: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const targetYear = today.getFullYear() - age;
    const newDate = new Date(targetYear, selectedDate.getMonth(), selectedDate.getDate());
    setSelectedDate(newDate);
    setViewYear(targetYear);
    setViewMonth(newDate.getMonth());
    setViewMode('DAYS');
  };

  const handleConfirm = () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSelectDate(selectedDateStr);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#121920' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(137, 254, 0, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(137, 254, 0, 0.3)',
                }}>
                <MaterialIcons name="cake" size={18} color="#89FE00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.border,
                },
              ]}>
              <MaterialIcons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ACTIVE SELECTION GLOW HERO */}
          <View
            style={[
              styles.heroBanner,
              {
                backgroundColor: isDark ? 'rgba(137, 254, 0, 0.08)' : 'rgba(137, 254, 0, 0.12)',
                borderColor: 'rgba(137, 254, 0, 0.3)',
              },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.heroSubLabel}>SELECTED BIRTHDAY</Text>
                <Text style={[styles.heroDateText, { color: colors.textPrimary }]}>
                  {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                </Text>
              </View>

              <View style={styles.ageBadgePill}>
                <MaterialIcons name="fitness-center" size={12} color="#000" />
                <Text style={styles.ageBadgeText}>{ageMeta.age} YRS OLD</Text>
              </View>
            </View>

            {ageMeta.daysUntilBday <= 30 && (
              <View style={styles.milestoneNoticeRow}>
                <Text style={styles.milestoneNoticeText}>
                  🎉 Birthday coming in {ageMeta.daysUntilBday} days!
                </Text>
              </View>
            )}
          </View>

          {/* QUICK AGE PRESETS STRIP */}
          <View style={styles.presetsWrapper}>
            <Text style={[styles.presetsTitle, { color: colors.textSecondary }]}>QUICK AGE JUMP:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsScroll}>
              {AGE_PRESETS.map((p) => {
                const targetY = today.getFullYear() - p.age;
                const isSelectedAge = selectedDate.getFullYear() === targetY;
                return (
                  <TouchableOpacity
                    key={p.age}
                    activeOpacity={0.7}
                    onPress={() => handleSelectPresetAge(p.age)}
                    style={[
                      styles.presetPill,
                      isSelectedAge
                        ? { backgroundColor: '#89FE00', borderColor: '#89FE00' }
                        : {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: colors.border,
                          },
                    ]}>
                    <Text
                      style={[
                        styles.presetPillText,
                        { color: isSelectedAge ? '#000' : colors.textPrimary },
                      ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MONTH / YEAR NAVIGATION BAR */}
          <View style={styles.navBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              style={[styles.navArrowBtn, { borderColor: colors.border }]}>
              <MaterialIcons name="chevron-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setViewMode((current) => (current === 'DAYS' ? 'MONTHS' : 'DAYS'));
              }}
              style={[
                styles.navTitleBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.border,
                },
              ]}>
              <Text style={[styles.navTitleText, { color: colors.textPrimary }]}>
                {MONTH_NAMES[viewMonth]}
              </Text>
              <MaterialIcons
                name={viewMode === 'MONTHS' ? 'expand-less' : 'expand-more'}
                size={16}
                color="#89FE00"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setViewMode((current) => (current === 'YEARS' ? 'DAYS' : 'YEARS'));
              }}
              style={[
                styles.navTitleBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.border,
                },
              ]}>
              <Text style={[styles.navTitleText, { color: colors.textPrimary }]}>
                {viewYear}
              </Text>
              <MaterialIcons
                name={viewMode === 'YEARS' ? 'expand-less' : 'expand-more'}
                size={16}
                color="#89FE00"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              style={[styles.navArrowBtn, { borderColor: colors.border }]}>
              <MaterialIcons name="chevron-right" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* VIEW: DAYS MATRIX */}
          {viewMode === 'DAYS' && (
            <View style={styles.calendarBody}>
              {/* WEEKDAY LABELS */}
              <View style={styles.weekdayRow}>
                {WEEK_DAYS.map((wd, i) => (
                  <View key={wd + i} style={styles.weekdayCell}>
                    <Text
                      style={[
                        styles.weekdayText,
                        { color: i === 0 || i === 6 ? '#FF922B' : colors.textSecondary },
                      ]}>
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {/* DAYS GRID */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return <View key={`empty_${idx}`} style={styles.dayCell} />;
                  }

                  return (
                    <TouchableOpacity
                      key={`day_${item.dayNumber}`}
                      activeOpacity={0.7}
                      disabled={item.isDisabled}
                      onPress={() => handleSelectDay(item.dayNumber)}
                      style={[
                        styles.dayCell,
                        item.isSelected && styles.dayCellSelected,
                        item.isToday && !item.isSelected && styles.dayCellToday,
                        item.isDisabled && styles.dayCellDisabled,
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: item.isSelected
                              ? '#000'
                              : item.isToday
                              ? '#89FE00'
                              : item.isDisabled
                              ? colors.textMuted
                              : colors.textPrimary,
                            fontFamily: item.isSelected || item.isToday ? F.sansBold : F.sans,
                          },
                        ]}>
                        {item.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* VIEW: MONTHS PICKER GRID */}
          {viewMode === 'MONTHS' && (
            <View style={styles.gridPickerBody}>
              <Text style={[styles.gridPickerTitle, { color: colors.textSecondary }]}>
                Select Month for Year {viewYear}
              </Text>
              <View style={styles.monthsMatrix}>
                {MONTH_SHORT.map((mShort, idx) => {
                  const isSelectedMonth = viewMonth === idx;
                  return (
                    <TouchableOpacity
                      key={mShort}
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setViewMonth(idx);
                        setViewMode('DAYS');
                      }}
                      style={[
                        styles.monthOptionBtn,
                        isSelectedMonth
                          ? { backgroundColor: '#89FE00', borderColor: '#89FE00' }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                              borderColor: colors.border,
                            },
                      ]}>
                      <Text
                        style={[
                          styles.monthOptionText,
                          { color: isSelectedMonth ? '#000' : colors.textPrimary },
                        ]}>
                        {mShort}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* VIEW: YEARS PICKER GRID */}
          {viewMode === 'YEARS' && (
            <View style={styles.gridPickerBody}>
              <Text style={[styles.gridPickerTitle, { color: colors.textSecondary }]}>
                Select Year of Birth
              </Text>
              <ScrollView
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.yearsMatrix}>
                {availableYears.map((y) => {
                  const isSelectedYear = viewYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setViewYear(y);
                        setViewMode('DAYS');
                      }}
                      style={[
                        styles.yearOptionBtn,
                        isSelectedYear
                          ? { backgroundColor: '#89FE00', borderColor: '#89FE00' }
                          : {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                              borderColor: colors.border,
                            },
                      ]}>
                      <Text
                        style={[
                          styles.yearOptionText,
                          { color: isSelectedYear ? '#000' : colors.textPrimary },
                        ]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ACTION BUTTONS FOOTER */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onSelectDate('');
                onClose();
              }}
              style={[styles.clearBtn, { borderColor: colors.border }]}>
              <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              style={styles.confirmBtn}>
              <MaterialIcons name="check-circle" size={16} color="#000" />
              <Text style={styles.confirmBtnText}>Set Date ({selectedDateStr})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  heroSubLabel: {
    fontSize: 9,
    fontFamily: F.monoBold,
    color: '#89FE00',
    letterSpacing: 0.8,
  },
  heroDateText: {
    fontSize: 15,
    fontFamily: F.sansBold,
    marginTop: 1,
  },
  ageBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ageBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    color: '#000',
    letterSpacing: 0.3,
  },
  milestoneNoticeRow: {
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(137, 254, 0, 0.2)',
  },
  milestoneNoticeText: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: '#89FE00',
  },
  presetsWrapper: {
    gap: 4,
  },
  presetsTitle: {
    fontSize: 9,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  presetsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 10,
    fontFamily: F.sansBold,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingVertical: 4,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
  },
  navTitleText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  calendarBody: {
    gap: 6,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekdayText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#89FE00',
    shadowColor: '#89FE00',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#89FE00',
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 12,
  },
  gridPickerBody: {
    paddingVertical: 6,
    gap: 8,
  },
  gridPickerTitle: {
    fontSize: 11,
    fontFamily: F.monoBold,
    textAlign: 'center',
  },
  monthsMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthOptionBtn: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthOptionText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  yearsMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  yearOptionBtn: {
    width: '22%',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearOptionText: {
    fontSize: 11,
    fontFamily: F.monoBold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#89FE00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#89FE00',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#000',
    fontFamily: F.sansBold,
    fontSize: 12,
  },
});
