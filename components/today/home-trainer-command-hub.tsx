/**
 * Home Trainer Command Hub — Dedicated Hero & Coaching Dashboard for Gym Trainers
 * Real-time Client Schedule Timeline, 1-Tap Attendance Punch, Roster & Compliance Bento
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { TrainerAppointmentSlot } from '@/types/trainer';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  onOpenSchedule: () => void;
  onOpenProfile: () => void;
  onOpenClientCrm?: () => void;
  onOpenPackages?: () => void;
  onOpenDietPrescription?: () => void;
};

export function HomeTrainerCommandHub({ onOpenSchedule, onOpenProfile, onOpenClientCrm, onOpenPackages, onOpenDietPrescription }: Props) {
  const { profile, appointments, punchAttendance, selectedDate, clients } = useTrainerStore();
  const { colors, isDark } = useThemeColors();

  const todaySlots = appointments.filter((s) => s.date === selectedDate);
  const completedSlots = todaySlots.filter((s) => s.status === 'COMPLETED').length;
  const pendingSlots = todaySlots.length - completedSlots;
  const attendanceRate = todaySlots.length > 0 ? Math.round((completedSlots / todaySlots.length) * 100) : 0;
  const clientsWithInjuries = clients.filter((c) => c.injuries && c.injuries.length > 0).length;

  // Next upcoming scheduled slot
  const nextSlot = todaySlots.find((s) => s.status === 'SCHEDULED');

  const handlePunchAttendance = async (slotId: string, clientName: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await punchAttendance(slotId);
  };

  const cardShadow = !isDark
    ? {
        shadowColor: '#0E4D34',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }
    : {};

  return (
    <View style={styles.container}>
      {/* 1. TODAY'S SHIFT & FLOOR COMMAND OVERVIEW */}
      <View
        style={[
          styles.shiftHeroCard,
          !isDark
            ? {
                backgroundColor: '#0E4D34',
                borderColor: '#0E4D34',
                shadowColor: '#0E4D34',
                shadowOpacity: 0.18,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }
            : {
                backgroundColor: C.surfaceContainer,
                borderColor: 'rgba(137, 254, 0, 0.3)',
              },
        ]}>
        {/* TOP STATUS ROW */}
        <View style={styles.shiftHeaderRow}>
          <View
            style={[
              styles.shiftBadge,
              !isDark && {
                backgroundColor: 'rgba(180, 232, 118, 0.2)',
                borderColor: 'rgba(180, 232, 118, 0.4)',
              },
            ]}>
            <View
              style={[
                styles.pulseDot,
                !isDark && { backgroundColor: '#B4E876' },
              ]}
            />
            <Text
              style={[
                styles.shiftBadgeText,
                !isDark && { color: '#B4E876' },
              ]}>
              ON FLOOR SHIFT
            </Text>
          </View>

          <View
            style={[
              styles.shiftDateChip,
              !isDark && { backgroundColor: 'rgba(0, 0, 0, 0.22)' },
            ]}>
            <MaterialIcons
              name="event-available"
              size={13}
              color={!isDark ? '#D5EDB8' : '#89FE00'}
            />
            <Text
              style={[
                styles.shiftDateChipText,
                !isDark && { color: '#D5EDB8' },
              ]}>
              TODAY'S WORKLOAD
            </Text>
          </View>
        </View>

        {/* PROGRESS METRICS & VISUAL BAR */}
        <View style={styles.shiftProgressContainer}>
          <View style={styles.shiftProgressTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={[
                  styles.shiftProgressTitle,
                  !isDark && { color: '#FFFFFF' },
                ]}>
                {completedSlots === todaySlots.length && todaySlots.length > 0
                  ? 'All Sessions Completed! 🎉'
                  : `${completedSlots} of ${todaySlots.length} PT Sessions Done`}
              </Text>
              <Text
                style={[
                  styles.shiftProgressSub,
                  !isDark && { color: '#D5EDB8' },
                ]}>
                {pendingSlots > 0
                  ? `${pendingSlots} client session${pendingSlots > 1 ? 's' : ''} remaining today`
                  : 'Daily coaching floor goal achieved'}
              </Text>
            </View>

            <View
              style={[
                styles.completionPctPill,
                !isDark
                  ? { backgroundColor: '#B4E876' }
                  : { backgroundColor: 'rgba(137, 254, 0, 0.2)', borderColor: '#89FE00', borderWidth: 1 },
              ]}>
              <Text
                style={[
                  styles.completionPctText,
                  !isDark && { color: '#0E4D34' },
                ]}>
                {attendanceRate}%
              </Text>
            </View>
          </View>

          {/* PROGRESS TRACK BAR */}
          <View
            style={[
              styles.progressBarTrack,
              !isDark && { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
            ]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${attendanceRate}%` },
                !isDark
                  ? { backgroundColor: '#B4E876' }
                  : { backgroundColor: '#89FE00' },
              ]}
            />
          </View>
        </View>

        {/* 4 ACTIONABLE FLOOR PILLARS */}
        <View
          style={[
            styles.floorMetricsRow,
            !isDark && { backgroundColor: 'rgba(0, 0, 0, 0.22)' },
          ]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenClientCrm}
            style={styles.floorMetricBox}>
            <Text
              style={[
                styles.floorMetricVal,
                { color: !isDark ? '#B4E876' : '#89FE00' },
              ]}>
              {clients.length}
            </Text>
            <Text
              style={[
                styles.floorMetricLbl,
                !isDark && { color: '#D5EDB8' },
              ]}>
              Athletes ➔
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenClientCrm}
            style={[
              styles.floorMetricBox,
              { borderLeftWidth: 1, borderLeftColor: !isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
            ]}>
            <Text
              style={[
                styles.floorMetricVal,
                { color: !isDark ? '#FFFFFF' : '#00B4D8' },
              ]}>
              {clientsWithInjuries}
            </Text>
            <Text
              style={[
                styles.floorMetricLbl,
                !isDark && { color: '#D5EDB8' },
              ]}>
              PAR-Q+ Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenDietPrescription}
            style={[
              styles.floorMetricBox,
              { borderLeftWidth: 1, borderLeftColor: !isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
            ]}>
            <Text
              style={[
                styles.floorMetricVal,
                { color: !isDark ? '#FFFFFF' : '#FFB800' },
              ]}>
              3
            </Text>
            <Text
              style={[
                styles.floorMetricLbl,
                !isDark && { color: '#D5EDB8' },
              ]}>
              Diet Stacks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenSchedule}
            style={[
              styles.floorMetricBox,
              { borderLeftWidth: 1, borderLeftColor: !isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)' },
            ]}>
            <Text
              style={[
                styles.floorMetricVal,
                { color: !isDark ? '#B4E876' : '#FCC419' },
              ]}>
              {pendingSlots} Left
            </Text>
            <Text
              style={[
                styles.floorMetricLbl,
                !isDark && { color: '#D5EDB8' },
              ]}>
              Schedule ➔
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. NEXT CLIENT SESSION ALERT */}
      {nextSlot ? (
        <View
          style={[
            styles.nextSessionAlert,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.15)',
                  ...cardShadow,
                }
              : {
                  backgroundColor: 'rgba(137, 254, 0, 0.06)',
                  borderColor: 'rgba(137, 254, 0, 0.25)',
                },
          ]}>
          <View style={styles.nextAlertLeft}>
            <View
              style={[
                styles.nextClockIcon,
                !isDark && {
                  backgroundColor: '#E7F3DD',
                },
              ]}>
              <MaterialIcons
                name="alarm"
                size={18}
                color={!isDark ? '#0E4D34' : '#89FE00'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.nextAlertTitle,
                  !isDark && { color: '#0E4D34' },
                ]}>
                NEXT UPCOMING PT SESSION
              </Text>
              <Text
                style={[
                  styles.nextClientName,
                  !isDark && { color: '#0E4D34' },
                ]}>
                {nextSlot.clientName} •{' '}
                <Text style={{ color: !isDark ? '#007A99' : '#00B4D8' }}>
                  {nextSlot.timeSlot}
                </Text>
              </Text>
              <Text
                style={[
                  styles.nextFocusText,
                  !isDark && { color: '#4A6956' },
                ]}>
                🎯 Focus: {nextSlot.targetFocus}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handlePunchAttendance(nextSlot.id, nextSlot.clientName)}
            style={[
              styles.quickPunchBtn,
              !isDark && { backgroundColor: '#B4E876' },
            ]}>
            <MaterialIcons
              name="touch-app"
              size={16}
              color={!isDark ? '#0E4D34' : '#002233'}
            />
            <Text
              style={[
                styles.quickPunchBtnText,
                !isDark && { color: '#0E4D34' },
              ]}>
              Punch In
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.allCompletedAlert,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.12)',
                  ...cardShadow,
                }
              : {},
          ]}>
          <MaterialIcons
            name="check-circle"
            size={20}
            color={!isDark ? '#0E4D34' : '#89FE00'}
          />
          <Text
            style={[
              styles.allCompletedText,
              !isDark && { color: '#0E4D34' },
            ]}>
            All scheduled client sessions completed today!
          </Text>
        </View>
      )}

      {/* 3. TODAY'S CLIENT SESSIONS TIMELINE (PREVIEW) */}
      <View
        style={[
          styles.timelineSection,
          !isDark
            ? {
                backgroundColor: '#FFFFFF',
                borderColor: 'rgba(14, 77, 52, 0.12)',
                ...cardShadow,
              }
            : {
                backgroundColor: C.surfaceContainer,
                borderColor: C.glassBorder,
              },
        ]}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons
              name="calendar-today"
              size={16}
              color={!isDark ? '#0E4D34' : '#89FE00'}
            />
            <Text
              style={[
                styles.sectionTitle,
                !isDark && { color: '#0E4D34' },
              ]}>
              TODAY'S SCHEDULE ({todaySlots.length})
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={onOpenSchedule}>
            <Text
              style={[
                styles.viewFullScheduleText,
                !isDark && { color: '#007A99' },
              ]}>
              Full Schedule →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.slotsList}>
          {todaySlots.slice(0, 3).map((slot: TrainerAppointmentSlot) => {
            const isCompleted = slot.status === 'COMPLETED';

            return (
              <View
                key={slot.id}
                style={[
                  styles.slotRowCard,
                  !isDark && {
                    backgroundColor: '#F0F5EC',
                    borderColor: 'rgba(14, 77, 52, 0.08)',
                  },
                  isCompleted && (
                    !isDark
                      ? {
                          backgroundColor: '#E7F3DD',
                          borderColor: 'rgba(14, 77, 52, 0.2)',
                        }
                      : styles.slotRowCardCompleted
                  ),
                ]}>
                <View
                  style={[
                    styles.slotTimeBadge,
                    !isDark && { backgroundColor: '#E7F3DD' },
                  ]}>
                  <Text
                    style={[
                      styles.slotTimeText,
                      !isDark && { color: '#0E4D34' },
                    ]}>
                    {slot.timeSlot.split(' - ')[0]}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.slotClientName,
                      !isDark && { color: '#0E4D34' },
                    ]}>
                    {slot.clientName}
                  </Text>
                  <Text
                    style={[
                      styles.slotFocusDesc,
                      !isDark && { color: '#4A6956' },
                    ]}
                    numberOfLines={1}>
                    {slot.targetFocus}
                  </Text>
                </View>

                {isCompleted ? (
                  <View
                    style={[
                      styles.punchedTag,
                      !isDark && {
                        backgroundColor: 'rgba(14, 77, 52, 0.12)',
                      },
                    ]}>
                    <MaterialIcons
                      name="check"
                      size={14}
                      color={!isDark ? '#0E4D34' : '#89FE00'}
                    />
                    <Text
                      style={[
                        styles.punchedTagText,
                        !isDark && { color: '#0E4D34' },
                      ]}>
                      Punched
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePunchAttendance(slot.id, slot.clientName)}
                    style={[
                      styles.miniPunchBtn,
                      !isDark && { backgroundColor: '#B4E876' },
                    ]}>
                    <Text
                      style={[
                        styles.miniPunchBtnText,
                        !isDark && { color: '#0E4D34' },
                      ]}>
                      Punch
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. COACHING QUICK ACTIONS DECK */}
      <View style={styles.coachingActionsGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenClientCrm}
          style={[
            styles.coachingActionCard,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.12)',
                  ...cardShadow,
                }
              : { borderColor: 'rgba(0, 180, 216, 0.35)' },
          ]}>
          <View
            style={[
              styles.actionIconCircle,
              {
                backgroundColor: !isDark ? '#D8F1F5' : 'rgba(0, 180, 216, 0.15)',
              },
            ]}>
            <MaterialIcons
              name="groups"
              size={20}
              color={!isDark ? '#007A99' : '#00B4D8'}
            />
          </View>
          <Text
            style={[
              styles.actionCardTitle,
              !isDark && { color: '#0E4D34' },
            ]}>
            Athlete CRM
          </Text>
          <Text
            style={[
              styles.actionCardSub,
              !isDark && { color: '#4A6956' },
            ]}>
            PAR-Q+ & 12-Pack
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenDietPrescription}
          style={[
            styles.coachingActionCard,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.12)',
                  ...cardShadow,
                }
              : { borderColor: 'rgba(137, 254, 0, 0.35)' },
          ]}>
          <View
            style={[
              styles.actionIconCircle,
              {
                backgroundColor: !isDark ? '#E7F3DD' : 'rgba(137, 254, 0, 0.15)',
              },
            ]}>
            <MaterialIcons
              name="restaurant-menu"
              size={20}
              color={!isDark ? '#0E4D34' : '#89FE00'}
            />
          </View>
          <Text
            style={[
              styles.actionCardTitle,
              !isDark && { color: '#0E4D34' },
            ]}>
            Diet Vault
          </Text>
          <Text
            style={[
              styles.actionCardSub,
              !isDark && { color: '#4A6956' },
            ]}>
            Desi Macros & Stacks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenSchedule}
          style={[
            styles.coachingActionCard,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.12)',
                  ...cardShadow,
                }
              : {},
          ]}>
          <View
            style={[
              styles.actionIconCircle,
              {
                backgroundColor: !isDark ? '#E7F3DD' : 'rgba(137, 254, 0, 0.15)',
              },
            ]}>
            <MaterialIcons
              name="calendar-month"
              size={20}
              color={!isDark ? '#0E4D34' : '#89FE00'}
            />
          </View>
          <Text
            style={[
              styles.actionCardTitle,
              !isDark && { color: '#0E4D34' },
            ]}>
            Daily Schedule
          </Text>
          <Text
            style={[
              styles.actionCardSub,
              !isDark && { color: '#4A6956' },
            ]}>
            Morning/Evening
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenProfile}
          style={[
            styles.coachingActionCard,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.12)',
                  ...cardShadow,
                }
              : { borderColor: 'rgba(255, 184, 0, 0.25)' },
          ]}>
          <View
            style={[
              styles.actionIconCircle,
              {
                backgroundColor: !isDark ? '#FEF0DB' : 'rgba(255, 184, 0, 0.15)',
              },
            ]}>
            <MaterialIcons
              name="military-tech"
              size={20}
              color={!isDark ? '#B45309' : '#FFB800'}
            />
          </View>
          <Text
            style={[
              styles.actionCardTitle,
              !isDark && { color: '#0E4D34' },
            ]}>
            Certifications
          </Text>
          <Text
            style={[
              styles.actionCardSub,
              !isDark && { color: '#4A6956' },
            ]}>
            CSCS • ACE • ISSA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenPackages}
          style={[
            styles.coachingActionCard,
            !isDark
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(14, 77, 52, 0.12)',
                  ...cardShadow,
                }
              : { borderColor: 'rgba(167, 139, 250, 0.35)' },
          ]}>
          <View
            style={[
              styles.actionIconCircle,
              {
                backgroundColor: !isDark ? '#EDE9FE' : 'rgba(167, 139, 250, 0.15)',
              },
            ]}>
            <MaterialIcons
              name="payments"
              size={20}
              color={!isDark ? '#6D28D9' : '#A78BFA'}
            />
          </View>
          <Text
            style={[
              styles.actionCardTitle,
              !isDark && { color: '#0E4D34' },
            ]}>
            PT Packages
          </Text>
          <Text
            style={[
              styles.actionCardSub,
              !isDark && { color: '#4A6956' },
            ]}>
            Rates & Custom Fees
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    marginBottom: 8,
  },
  shiftHeroCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.3)',
    padding: 16,
    gap: 14,
  },
  shiftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#89FE00',
  },
  shiftBadgeText: {
    fontSize: 10.5,
    fontFamily: F.sansBold,
    color: '#89FE00',
    letterSpacing: 0.6,
  },
  shiftDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  shiftDateChipText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    color: C.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  shiftProgressContainer: {
    gap: 10,
  },
  shiftProgressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftProgressTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
    color: C.onSurface,
    letterSpacing: 0.1,
  },
  shiftProgressSub: {
    fontSize: 11.5,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  completionPctPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionPctText: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: '#002233',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#89FE00',
  },
  floorMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  floorMetricBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  floorMetricVal: {
    fontSize: 15,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  floorMetricLbl: {
    fontSize: 10,
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
    marginTop: 3,
  },

  // NEXT SESSION ALERT
  nextSessionAlert: {
    backgroundColor: 'rgba(137, 254, 0, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.25)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nextAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  nextClockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAlertTitle: {
    fontSize: 10,
    fontFamily: F.sansBold,
    color: '#89FE00',
    letterSpacing: 0.6,
  },
  nextClientName: {
    fontSize: 14,
    fontFamily: F.sansBold,
    color: C.onSurface,
    marginTop: 2,
  },
  nextFocusText: {
    fontSize: 11,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  quickPunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickPunchBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#002233',
  },
  allCompletedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(137, 254, 0, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.2)',
  },
  allCompletedText: {
    fontSize: 12,
    fontFamily: F.sansMedium,
    color: '#89FE00',
  },

  // TIMELINE
  timelineSection: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: C.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  viewFullScheduleText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#89FE00',
  },
  slotsList: {
    gap: 8,
  },
  slotRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  slotRowCardCompleted: {
    borderColor: 'rgba(137, 254, 0, 0.2)',
    backgroundColor: 'rgba(137, 254, 0, 0.02)',
  },
  slotTimeBadge: {
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotTimeText: {
    fontSize: 11,
    fontFamily: F.monoBold,
    color: '#00B4D8',
  },
  slotClientName: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  slotFocusDesc: {
    fontSize: 11,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  punchedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  punchedTagText: {
    fontSize: 10,
    fontFamily: F.sansSemiBold,
    color: '#89FE00',
  },
  miniPunchBtn: {
    backgroundColor: '#89FE00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniPunchBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
    color: '#002233',
  },

  // ACTIONS GRID (2x2)
  coachingActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  coachingActionCard: {
    width: '48%',
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.25)',
    padding: 12,
    gap: 3,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionCardTitle: {
    fontSize: 13,
    fontFamily: F.sansBold,
    color: C.onSurface,
  },
  actionCardSub: {
    fontSize: 11,
    fontFamily: F.sans,
    color: C.onSurfaceVariant,
  },
});
