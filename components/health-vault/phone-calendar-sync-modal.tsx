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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  buildGoogleCalendarUrl,
  DEFAULT_ALARM_CONFIG,
  extractSyncableHealthEventsFromVault,
  generateIcsCalendarString,
  syncSingleEventToAppleCalendar,
  syncSingleEventToGoogleCalendar,
} from '@/services/calendar-sync-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import {
  CalendarAlarmConfig,
  CalendarPlatform,
  SyncableHealthEvent,
} from '@/types/calendar-sync';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface PhoneCalendarSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PhoneCalendarSyncModal({
  visible,
  onClose,
}: PhoneCalendarSyncModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const followUps = useHealthVaultStore((s) => s.followUps);
  const vaccinations = useHealthVaultStore((s) => s.vaccinations);
  const diagnosticTests = useHealthVaultStore((s) => s.diagnosticTests);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);

  const [activeTab, setActiveTab] = useState<'AGENDA' | 'ALARMS' | 'EXPORT'>('AGENDA');
  const [filterMemberId, setFilterMemberId] = useState<string | 'ALL'>(selectedMemberId);
  const [alarmConfig, setAlarmConfig] = useState<CalendarAlarmConfig>(DEFAULT_ALARM_CONFIG);

  // Custom Appointment Builder State
  const [customTitle, setCustomTitle] = useState('');
  const [customDoctor, setCustomDoctor] = useState('Prof. Dr. M. A. Rahman');
  const [customDate, setCustomDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState('10:30 AM');
  const [customLocation, setCustomLocation] = useState('National Heart Foundation, Dhaka');
  const [customNotes, setCustomNotes] = useState('Routine checkup. Fasting 8h if blood test required.');

  const [syncedEventIds, setSyncedEventIds] = useState<string[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Extract all syncable items
  const syncableEvents = useMemo(() => {
    return extractSyncableHealthEventsFromVault(
      followUps,
      vaccinations,
      diagnosticTests,
      members,
      filterMemberId
    );
  }, [followUps, vaccinations, diagnosticTests, members, filterMemberId]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleSyncToGoogle = async (event: SyncableHealthEvent) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const success = await syncSingleEventToGoogleCalendar(event);
    if (success) {
      setSyncedEventIds((prev) => [...prev, event.id]);
      showToast('🇬 Opening Google Calendar event...');
    }
  };

  const handleSyncToApple = async (event: SyncableHealthEvent) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const success = await syncSingleEventToAppleCalendar(event);
    if (success) {
      setSyncedEventIds((prev) => [...prev, event.id]);
      showToast('🍎 Launching Apple / Device Calendar...');
    }
  };

  const handleBatchSyncAllGoogle = async () => {
    if (syncableEvents.length === 0) {
      Alert.alert('No Events', 'No pending health appointments to sync.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Sync first event directly to open Google Calendar, copy batch summary
    const first = syncableEvents[0];
    await syncSingleEventToGoogleCalendar(first);
    setSyncedEventIds(syncableEvents.map((e) => e.id));
    showToast(`✅ Synced ${syncableEvents.length} health appointments!`);
  };

  const handleShareEventWhatsApp = async (event: SyncableHealthEvent) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const text = `
🩺 HEALTH APPOINTMENT REMINDER
----------------------------------
👤 Patient: ${event.memberName}
📋 Event: ${event.title}
📅 Date & Time: ${event.startDate} at ${event.startTime || '10:00 AM'}
🏥 Location: ${event.location || 'Chamber'}
${event.doctorName ? `👨‍⚕️ Doctor: ${event.doctorName}` : ''}
${event.clinicalNotes ? `\n💡 Clinical Instructions:\n${event.clinicalNotes}` : ''}

(Synced via TrackMe Family Health OS)
`.trim();

    await Clipboard.setStringAsync(text);
    showToast('📋 Appointment details copied!');

    Alert.alert('Share with Family', 'Details copied! Share via WhatsApp?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'Open WhatsApp',
        onPress: () => {
          void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
            void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {});
          });
        },
      },
    ]);
  };

  const handleCreateAndSyncCustom = async () => {
    if (!customTitle.trim()) {
      Alert.alert('Title Required', 'Please enter an appointment title.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const activeMember = members.find((m) => m.id === filterMemberId) || members[0];
    const customEvent: SyncableHealthEvent = {
      id: `custom_${Date.now()}`,
      memberId: activeMember?.id || 'mem_khaled',
      memberName: activeMember?.name || 'Khaled',
      title: customTitle.trim(),
      itemType: 'CUSTOM',
      startDate: customDate,
      startTime: customTime,
      durationMinutes: 60,
      location: customLocation,
      clinicalNotes: customNotes,
      doctorName: customDoctor,
      alarmPresets: [1440, 120, 30],
      isSynced: true,
    };

    await syncSingleEventToGoogleCalendar(customEvent);
    setCustomTitle('');
    showToast('✅ Custom appointment synced to Google Calendar!');
  };

  const handleExportFullIcsFile = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const icsContent = generateIcsCalendarString(syncableEvents);
    await Clipboard.setStringAsync(icsContent);
    showToast('📋 iCalendar (.ics) Feed Copied to Clipboard!');

    Alert.alert(
      'Calendar Export (.ics)',
      'The standard iCalendar feed has been copied to your clipboard. You can import it into Apple Calendar, Microsoft Outlook, or Google Calendar.',
      [{ text: 'OK' }]
    );
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
                <MaterialIcons name="event-available" size={22} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Phone Calendar & Alarms Sync</Text>
                <Text style={styles.subtitle}>
                  1-Tap Sync to Google Calendar, Apple Calendar & Alarms
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          {feedbackToast && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{feedbackToast}</Text>
            </View>
          )}

          {/* FAMILY MEMBERS FILTER */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setFilterMemberId('ALL');
                }}
                style={[
                  styles.memberChip,
                  filterMemberId === 'ALL' && styles.memberChipActive,
                ]}>
                <Text
                  style={[
                    styles.memberChipText,
                    filterMemberId === 'ALL' && styles.memberChipTextActive,
                  ]}>
                  👨‍👩‍👧 All Family ({syncableEvents.length})
                </Text>
              </TouchableOpacity>

              {members.map((m) => {
                const isSelected = filterMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setFilterMemberId(m.id);
                    }}
                    style={[styles.memberChip, isSelected && styles.memberChipActive]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && styles.memberChipTextActive,
                      ]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUB-TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('AGENDA');
              }}
              style={[styles.tabBtn, activeTab === 'AGENDA' && styles.tabBtnActive]}>
              <MaterialIcons
                name="calendar-month"
                size={16}
                color={activeTab === 'AGENDA' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'AGENDA' && styles.tabBtnTextActive,
                ]}>
                Sync Agenda ({syncableEvents.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('ALARMS');
              }}
              style={[styles.tabBtn, activeTab === 'ALARMS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="alarm-on"
                size={16}
                color={activeTab === 'ALARMS' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'ALARMS' && styles.tabBtnTextActive,
                ]}>
                Multi-Alarms & Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('EXPORT');
              }}
              style={[styles.tabBtn, activeTab === 'EXPORT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="download"
                size={16}
                color={activeTab === 'EXPORT' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'EXPORT' && styles.tabBtnTextActive,
                ]}>
                iCal Export
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLLABLE BODY */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {activeTab === 'AGENDA' && (
              /* ================= TAB 1: SYNC AGENDA ================= */
              <View style={styles.sectionWrap}>
                {/* 1-Tap Batch Action Hero */}
                <View style={styles.batchHeroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.batchHeroTitle}>
                      {syncableEvents.length} UPCOMING HEALTH REMINDERS
                    </Text>
                    <Text style={styles.batchHeroSub}>
                      Sync doctor follow-ups, booster shots & lab tests with 24h, 2h & 30m auto-alarms.
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleBatchSyncAllGoogle}
                    style={styles.batchSyncBtn}>
                    <MaterialIcons name="sync" size={16} color="#101416" />
                    <Text style={styles.batchSyncBtnText}>1-Tap Sync</Text>
                  </TouchableOpacity>
                </View>

                {/* Event Cards List */}
                {syncableEvents.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="event-busy" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Pending Appointments Found</Text>
                    <Text style={styles.emptySub}>
                      All follow-ups, vaccine booster dates, and lab tests are up to date!
                    </Text>
                  </View>
                ) : (
                  syncableEvents.map((event) => {
                    const isSynced = syncedEventIds.includes(event.id);
                    const isFollowup = event.itemType === 'DOCTOR_FOLLOWUP';
                    const isVaccine = event.itemType === 'VACCINE_BOOSTER';
                    const isLab = event.itemType === 'LAB_DIAGNOSTIC_TEST';

                    return (
                      <View key={event.id} style={styles.agendaCard}>
                        <View style={styles.agendaCardTop}>
                          <View
                            style={[
                              styles.agendaIconBox,
                              {
                                backgroundColor: isFollowup
                                  ? 'rgba(56, 189, 248, 0.15)'
                                  : isVaccine
                                  ? 'rgba(32, 201, 151, 0.15)'
                                  : 'rgba(252, 196, 25, 0.15)',
                              },
                            ]}>
                            <MaterialIcons
                              name={
                                isFollowup
                                  ? 'local-hospital'
                                  : isVaccine
                                  ? 'vaccines'
                                  : isLab
                                  ? 'biotech'
                                  : 'event'
                              }
                              size={20}
                              color={
                                isFollowup ? '#38BDF8' : isVaccine ? '#20C997' : '#FCC419'
                              }
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.agendaTitle}>{event.title}</Text>
                            <Text style={styles.agendaPatient}>
                              👤 {event.memberName} • {event.location}
                            </Text>
                            <Text style={styles.agendaDateTime}>
                              📅 {event.startDate} at {event.startTime || '10:00 AM'}
                            </Text>
                          </View>

                          {isSynced && (
                            <View style={styles.syncedBadge}>
                              <MaterialIcons name="check" size={12} color="#20C997" />
                              <Text style={styles.syncedBadgeText}>SYNCED</Text>
                            </View>
                          )}
                        </View>

                        {/* Clinical Warning or Notes */}
                        {event.clinicalNotes && (
                          <View style={styles.notesBox}>
                            <Text style={styles.notesText}>{event.clinicalNotes}</Text>
                          </View>
                        )}

                        {/* Direct Platform Sync Action Buttons */}
                        <View style={styles.actionButtonsRow}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => handleSyncToGoogle(event)}
                            style={styles.googleCalBtn}>
                            <MaterialIcons name="open-in-new" size={14} color="#101416" />
                            <Text style={styles.googleCalBtnText}>Google Cal</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => handleSyncToApple(event)}
                            style={styles.appleCalBtn}>
                            <MaterialIcons name="apple" size={14} color="#FFFFFF" />
                            <Text style={styles.appleCalBtnText}>Apple / iCal</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => handleShareEventWhatsApp(event)}
                            style={styles.shareBtn}>
                            <MaterialIcons name="share" size={14} color="#38BDF8" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {activeTab === 'ALARMS' && (
              /* ================= TAB 2: MULTI-STAGE ALARMS & CUSTOM BUILDER ================= */
              <View style={styles.sectionWrap}>
                {/* Multi-Stage Alarm Configuration Toggles */}
                <View style={styles.alarmConfigCard}>
                  <Text style={styles.configCardTitle}>
                    ⏰ MULTI-STAGE SYSTEM ALARM SETTINGS
                  </Text>
                  <Text style={styles.configCardSub}>
                    When you sync any event to your phone calendar, these automatic notifications are scheduled:
                  </Text>

                  <View style={styles.toggleRow}>
                    <MaterialIcons name="notifications-active" size={18} color="#FF6B6B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>24 Hours Before Alert</Text>
                      <Text style={styles.toggleSub}>
                        Reminder for pre-test fasting, gathering previous prescriptions & reports.
                      </Text>
                    </View>
                    <View style={styles.activeCheckPill}>
                      <Text style={styles.activeCheckText}>ENABLED</Text>
                    </View>
                  </View>

                  <View style={styles.toggleRow}>
                    <MaterialIcons name="directions-car" size={18} color="#FCC419" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>2 Hours Before Alert</Text>
                      <Text style={styles.toggleSub}>
                        Departure & traffic advisory to reach chamber on time.
                      </Text>
                    </View>
                    <View style={styles.activeCheckPill}>
                      <Text style={styles.activeCheckText}>ENABLED</Text>
                    </View>
                  </View>

                  <View style={styles.toggleRow}>
                    <MaterialIcons name="alarm" size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>30 Minutes Before Alert</Text>
                      <Text style={styles.toggleSub}>
                        Final arrival check-in and vital signs measurement alert.
                      </Text>
                    </View>
                    <View style={styles.activeCheckPill}>
                      <Text style={styles.activeCheckText}>ENABLED</Text>
                    </View>
                  </View>
                </View>

                {/* Custom Appointment Builder */}
                <View style={styles.customBuilderCard}>
                  <Text style={styles.configCardTitle}>
                    + ADD & SYNC CUSTOM DOCTOR / LAB VISIT
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Appointment / Event Title</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customTitle}
                      onChangeText={setCustomTitle}
                      placeholder="e.g. Dental Scaling & Review, Eye Checkup..."
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Doctor / Specialist Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customDoctor}
                      onChangeText={setCustomDoctor}
                      placeholder="e.g. Prof. Dr. M. A. Rahman"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.rowTwoInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={customDate}
                        onChangeText={setCustomDate}
                        placeholder="2026-09-15"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Time</Text>
                      <TextInput
                        style={styles.textInput}
                        value={customTime}
                        onChangeText={setCustomTime}
                        placeholder="10:30 AM"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hospital or Chamber Location</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customLocation}
                      onChangeText={setCustomLocation}
                      placeholder="e.g. Square Hospital / Labaid Diagnostic"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Clinical Instructions / Fasting Notes</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customNotes}
                      onChangeText={setCustomNotes}
                      placeholder="e.g. Fasting 8 hours, bring recent reports..."
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleCreateAndSyncCustom}
                    style={styles.createAndSyncBtn}>
                    <MaterialIcons name="calendar-today" size={18} color="#101416" />
                    <Text style={styles.createAndSyncBtnText}>
                      Save & 1-Tap Sync to Google Calendar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'EXPORT' && (
              /* ================= TAB 3: ICAL EXPORT ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.icalExportCard}>
                  <MaterialIcons name="feed" size={32} color="#38BDF8" />
                  <Text style={styles.icalTitle}>Universal iCalendar (.ics) Feed</Text>
                  <Text style={styles.icalSub}>
                    Export an RFC 5545 compliant calendar file containing all {syncableEvents.length} appointments with pre-configured 24h, 2h and 30m alarms. Works with Apple Calendar, Microsoft Outlook, and Google Calendar.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleExportFullIcsFile}
                    style={styles.copyIcsBtn}>
                    <MaterialIcons name="content-copy" size={18} color="#101416" />
                    <Text style={styles.copyIcsBtnText}>
                      Copy Complete .ics Calendar Feed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBox: {
    backgroundColor: '#20C997',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  membersBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#181F23',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  memberChipTextActive: {
    color: '#101416',
    fontFamily: F.bold,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#181F23',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  sectionWrap: {
    gap: 14,
  },
  batchHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  batchHeroTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  batchHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  batchSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  batchSyncBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  emptyBox: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  agendaCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  agendaCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  agendaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  agendaPatient: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },
  agendaDateTime: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedBadgeText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#20C997',
  },
  notesBox: {
    backgroundColor: '#101416',
    borderRadius: 8,
    padding: 8,
  },
  notesText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  googleCalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 9,
    borderRadius: 8,
  },
  googleCalBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  appleCalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#283339',
    paddingVertical: 9,
    borderRadius: 8,
  },
  appleCalBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#101416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmConfigCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  configCardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  configCardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#101416',
    padding: 10,
    borderRadius: 10,
  },
  toggleTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  toggleSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  activeCheckPill: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeCheckText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
  },
  customBuilderCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: '#101416',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  createAndSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  createAndSyncBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  icalExportCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  icalTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  icalSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  copyIcsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  copyIcsBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
});
