import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { CareCalendarItem, CareCalendarItemType } from '@/types/health-vault';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const EVENT_TYPE_CONFIG: Record<
  CareCalendarItemType,
  { label: string; icon: string; color: string; bg: string }
> = {
  DOCTOR_FOLLOWUP: {
    label: 'Doctor Follow-up',
    icon: 'event-repeat',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
  },
  DIAGNOSTIC_TEST: {
    label: 'Diagnostic Test',
    icon: 'biotech',
    color: '#20C997',
    bg: 'rgba(32, 201, 151, 0.15)',
  },
  VACCINE_BOOSTER: {
    label: 'Vaccine Booster',
    icon: 'vaccines',
    color: '#FF922B',
    bg: 'rgba(255, 146, 43, 0.15)',
  },
  HOSPITAL_EVENT: {
    label: 'Hospitalization Review',
    icon: 'local-hospital',
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.15)',
  },
};

interface CareCalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CareCalendarModal({
  visible,
  onClose,
}: CareCalendarModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const getCareCalendarEvents = useHealthVaultStore((s) => s.getCareCalendarEvents);
  const completeFollowUp = useHealthVaultStore((s) => s.completeFollowUp);
  const updateDiagnosticTestStatus = useHealthVaultStore(
    (s) => s.updateDiagnosticTestStatus
  );

  const initialMemberId =
    selectedMemberId === 'ALL' ? 'ALL' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState<string | 'ALL'>(initialMemberId);
  const [filterType, setFilterType] = useState<CareCalendarItemType | 'ALL'>('ALL');

  const events = useMemo(() => {
    let list = getCareCalendarEvents(activeMemberId);
    if (filterType !== 'ALL') {
      list = list.filter((e) => e.type === filterType);
    }
    return list;
  }, [getCareCalendarEvents, activeMemberId, filterType]);

  const handleAction = async (item: CareCalendarItem) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    if (item.type === 'DOCTOR_FOLLOWUP') {
      await completeFollowUp(item.id);
    } else if (item.type === 'DIAGNOSTIC_TEST') {
      await updateDiagnosticTestStatus(item.id, 'COMPLETED');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="calendar-month" size={20} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Unified Care Calendar</Text>
                <Text style={styles.subtitle}>
                  Aggregated Follow-ups, Tests & Booster Schedules
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* MEMBER SELECTOR BAR */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setActiveMemberId('ALL');
                }}
                style={[
                  styles.memberChip,
                  activeMemberId === 'ALL' && styles.memberChipActive,
                ]}>
                <Text
                  style={[
                    styles.memberChipText,
                    activeMemberId === 'ALL' && styles.memberChipTextActive,
                  ]}>
                  👨‍👩‍👧 All Family
                </Text>
              </TouchableOpacity>

              {members.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveMemberId(m.id);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: m.avatarColor,
                        borderColor: m.avatarColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#101416', fontFamily: F.bold },
                      ]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* EVENT TYPE FILTER CHIPS */}
          <View style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                onPress={() => setFilterType('ALL')}
                style={[
                  styles.filterChip,
                  filterType === 'ALL' && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === 'ALL' && styles.filterChipTextActive,
                  ]}>
                  All Schedules ({events.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterType('DOCTOR_FOLLOWUP')}
                style={[
                  styles.filterChip,
                  filterType === 'DOCTOR_FOLLOWUP' && {
                    backgroundColor: '#38BDF8',
                  },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === 'DOCTOR_FOLLOWUP' && {
                      color: '#101416',
                      fontFamily: F.bold,
                    },
                  ]}>
                  🩺 Doctor Follow-ups
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterType('DIAGNOSTIC_TEST')}
                style={[
                  styles.filterChip,
                  filterType === 'DIAGNOSTIC_TEST' && {
                    backgroundColor: '#20C997',
                  },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === 'DIAGNOSTIC_TEST' && {
                      color: '#101416',
                      fontFamily: F.bold,
                    },
                  ]}>
                  🧪 Lab Tests
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterType('VACCINE_BOOSTER')}
                style={[
                  styles.filterChip,
                  filterType === 'VACCINE_BOOSTER' && {
                    backgroundColor: '#FF922B',
                  },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === 'VACCINE_BOOSTER' && {
                      color: '#101416',
                      fontFamily: F.bold,
                    },
                  ]}>
                  💉 Vaccines & Boosters
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons
                  name="event-available"
                  size={36}
                  color={C.onSurfaceVariant}
                />
                <Text style={styles.emptyTitle}>No Upcoming Care Events</Text>
                <Text style={styles.emptySub}>
                  Scheduled follow-ups, diagnostic appointments, and vaccine boosters will show here chronologically.
                </Text>
              </View>
            ) : (
              events.map((ev) => {
                const conf = EVENT_TYPE_CONFIG[ev.type];

                return (
                  <View key={ev.id} style={styles.eventCard}>
                    <View style={styles.eventLeft}>
                      <View
                        style={[
                          styles.eventIconCircle,
                          { backgroundColor: conf.bg },
                        ]}>
                        <MaterialIcons
                          name={conf.icon as any}
                          size={18}
                          color={conf.color}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.eventBadgeRow}>
                          <Text
                            style={[
                              styles.eventTypeLabel,
                              { color: conf.color },
                            ]}>
                            {conf.label.toUpperCase()}
                          </Text>
                          {ev.memberName ? (
                            <Text style={styles.eventMemberName}>
                              • {ev.memberName}
                            </Text>
                          ) : null}
                        </View>

                        <Text style={styles.eventTitle}>{ev.title}</Text>
                        <Text style={styles.eventSubtitle}>{ev.subtitle}</Text>
                        <Text style={styles.eventDate}>📅 Due: {ev.date}</Text>
                      </View>
                    </View>

                    {(ev.type === 'DOCTOR_FOLLOWUP' ||
                      ev.type === 'DIAGNOSTIC_TEST') && (
                      <TouchableOpacity
                        onPress={() => handleAction(ev)}
                        style={styles.doneBtn}>
                        <MaterialIcons name="check" size={14} color="#101416" />
                        <Text style={styles.doneBtnText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  closeBtn: {
    padding: 6,
  },
  membersBar: {
    backgroundColor: '#141A1D',
    paddingVertical: 8,
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#1A2226',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  memberChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  filterBar: {
    backgroundColor: '#101416',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: '#38BDF8',
  },
  filterChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  filterChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  scrollBody: {
    padding: 16,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
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
    justifyContent: 'space-between',
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  eventIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  eventBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTypeLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  eventMemberName: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  eventTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
  },
  eventSubtitle: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  eventDate: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 4,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#20C997',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  doneBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#101416',
  },
});
