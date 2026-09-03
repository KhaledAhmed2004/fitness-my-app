/**
 * Coach Training Studio & Floor Command View
 * Full-screen coaching command hub rendered on Tab 5 (Training) when user has 'TRAINER' role.
 * Features:
 *  1. Live PT Floor Command (Session Timeline & 1-Tap Punch In)
 *  2. Workout Program Designer & Mesocycle Studio (PPL, U/L, 5/3/1, Rehab, HIIT)
 *  3. Athlete 1RM Strength Radar & Volume Tonnage Load Matrix
 *  4. Anatomical Muscle Visualizer for Routine Planning
 *  5. Studio Operations & Quick Links (CRM, Schedule, Credentials, Session Notes)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import { AppScreen } from '@/components/ui/app-screen';
import { AppScreenHeader } from '@/components/navigation/app-screen-header';
import {
  TargetMuscleVisualizer,
  MuscleSide,
  FRONT_MUSCLES,
  BACK_MUSCLES,
} from '@/components/training/target-muscle-visualizer';
import { WorkoutProgramDesignerModal } from './workout-program-designer-modal';
import { ClientCrmModal } from './client-crm-modal';
import { TrainerScheduleModal } from './trainer-schedule-modal';
import { TrainerProfileModal } from './trainer-profile-modal';
import { CoachDietPrescriptionModal } from './coach-diet-prescription-modal';
import type { ProgramSplit } from '@/types/trainer';

const T = TrainingTheme;
const C = Vital.colors;
const F = Vital.fonts;

// Mock 1RM data for athletes
const ATHLETE_1RM_DATA: Record<
  string,
  {
    squat: { current: number; starting: number; target: number };
    bench: { current: number; starting: number; target: number };
    deadlift: { current: number; starting: number; target: number };
    ohp: { current: number; starting: number; target: number };
    weeklyTonnageKg: number[];
  }
> = {
  usr_client_1: {
    squat: { current: 125, starting: 80, target: 140 },
    bench: { current: 95, starting: 60, target: 110 },
    deadlift: { current: 162.5, starting: 100, target: 180 },
    ohp: { current: 72.5, starting: 45, target: 80 },
    weeklyTonnageKg: [18500, 19800, 21200, 22400],
  },
  usr_client_2: {
    squat: { current: 105, starting: 70, target: 120 },
    bench: { current: 80, starting: 50, target: 95 },
    deadlift: { current: 130, starting: 85, target: 150 },
    ohp: { current: 55, starting: 35, target: 65 },
    weeklyTonnageKg: [14200, 15100, 15900, 16800],
  },
  usr_client_3: {
    squat: { current: 85, starting: 60, target: 100 },
    bench: { current: 65, starting: 45, target: 80 },
    deadlift: { current: 95, starting: 70, target: 115 },
    ohp: { current: 40, starting: 30, target: 50 },
    weeklyTonnageKg: [9800, 10400, 11100, 11600],
  },
  usr_client_4: {
    squat: { current: 75, starting: 45, target: 90 },
    bench: { current: 45, starting: 25, target: 55 },
    deadlift: { current: 90, starting: 55, target: 105 },
    ohp: { current: 32.5, starting: 20, target: 40 },
    weeklyTonnageKg: [8500, 9200, 9900, 10800],
  },
  usr_client_5: {
    squat: { current: 140, starting: 95, target: 160 },
    bench: { current: 105, starting: 75, target: 120 },
    deadlift: { current: 175, starting: 120, target: 200 },
    ohp: { current: 77.5, starting: 50, target: 85 },
    weeklyTonnageKg: [22100, 23400, 24800, 26000],
  },
};

export function CoachTrainingStudioView() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    clients,
    appointments,
    programs,
    assignedPrograms,
    sessionNotes,
    punchAttendance,
    setSessionNotes,
  } = useTrainerStore();

  // Modals state
  const [selectedSplit, setSelectedSplit] = useState<ProgramSplit | null>(null);
  const [splitDesignerVisible, setSplitDesignerVisible] = useState(false);
  const [crmModalVisible, setCrmModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [dietModalVisible, setDietModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [draftNotes, setDraftNotes] = useState(sessionNotes);

  // 1RM Radar selected client
  const [radarClientId, setRadarClientId] = useState<string>(
    clients.length > 0 ? clients[0].id : 'usr_client_1'
  );

  // Muscle Target Visualizer State (Coach Program Planning)
  const [activeSide, setActiveSide] = useState<MuscleSide>('FRONT');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([
    'shoulder',
    'chest',
    'triceps',
  ]);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectedMuscleNames = useMemo(() => {
    const all = [...FRONT_MUSCLES, ...BACK_MUSCLES];
    const unique = Array.from(new Set(selectedMuscles));
    return unique
      .map((id) => all.find((m) => m.id === id)?.name || id)
      .join(', ');
  }, [selectedMuscles]);

  const nextAppointment = useMemo(() => {
    return appointments.find((a) => a.status === 'SCHEDULED');
  }, [appointments]);

  const selectedRadarClient = useMemo(() => {
    return clients.find((c) => c.id === radarClientId) || clients[0];
  }, [clients, radarClientId]);

  const radar1Rm = useMemo(() => {
    return (
      ATHLETE_1RM_DATA[radarClientId] ||
      ATHLETE_1RM_DATA.usr_client_1
    );
  }, [radarClientId]);

  const handlePunchSession = async (slotId: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await punchAttendance(slotId);
  };

  const handleOpenSplit = (split: ProgramSplit) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSplit(split);
    setSplitDesignerVisible(true);
  };

  const handleSaveNotes = async () => {
    await setSessionNotes(draftNotes);
    setNotesModalVisible(false);
  };

  return (
    <AppScreen style={styles.container}>
      <AppScreenHeader
        title="Training Studio"
        subtitle={`${profile.name} • ${profile.gymAffiliation}`}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 130 },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* 0. COACH STUDIO BADGE STRIP */}
        <View style={styles.coachHeaderCard}>
          <View style={styles.coachHeaderLeft}>
            <View style={styles.coachAvatar}>
              <Text style={styles.coachAvatarText}>{profile.name.charAt(0)}</Text>
            </View>
            <View>
              <View style={styles.coachBadgeRow}>
                <View style={styles.cscsBadge}>
                  <Text style={styles.cscsBadgeText}>CSCS • ACE</Text>
                </View>
                <View style={styles.floorStatusBadge}>
                  <View style={styles.liveGreenDot} />
                  <Text style={styles.floorStatusText}>ON FLOOR</Text>
                </View>
              </View>
              <Text style={styles.coachTitle}>Strength & Conditioning Floor</Text>
              <Text style={styles.coachMeta}>
                {profile.activeClientsCount} Active Athletes • {profile.yearsOfExperience}+ Yrs Exp
              </Text>
            </View>
          </View>
        </View>

        {/* 1. ⚡ LIVE PT FLOOR COMMAND (TODAY'S TIMELINE & PUNCH) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="timer" size={18} color="#89FE00" />
              <Text style={styles.sectionTitle}>TODAY'S PT FLOOR COMMAND</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setScheduleModalVisible(true)}>
              <Text style={styles.viewAllText}>Full Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* NEXT SESSION CALLOUT */}
          {nextAppointment && (
            <View style={styles.nextAlertBox}>
              <View style={styles.nextAlertTop}>
                <View style={styles.nextAlertBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.nextAlertBadgeText}>NEXT SESSION UP</Text>
                </View>
                <Text style={styles.nextTimeText}>{nextAppointment.timeSlot}</Text>
              </View>

              <View style={styles.nextClientRow}>
                <View style={styles.nextClientAvatar}>
                  <Text style={styles.nextClientAvatarText}>
                    {nextAppointment.clientName.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextClientName}>{nextAppointment.clientName}</Text>
                  <Text style={styles.nextClientFocus}>{nextAppointment.targetFocus}</Text>
                </View>

                {nextAppointment.status !== 'COMPLETED' ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePunchSession(nextAppointment.id)}
                    style={styles.punchBtn}>
                    <MaterialIcons name="check" size={16} color="#000" />
                    <Text style={styles.punchBtnText}>Punch In</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.punchedBadge}>
                    <MaterialIcons name="done-all" size={14} color="#89FE00" />
                    <Text style={styles.punchedBadgeText}>Punched</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* HORIZONTAL SESSION ROSTER */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sessionScrollRow}>
            {appointments.map((apt) => {
              const isPunched = apt.status === 'COMPLETED';
              return (
                <View
                  key={apt.id}
                  style={[
                    styles.sessionMiniCard,
                    isPunched && styles.sessionMiniCardPunched,
                  ]}>
                  <View style={styles.sessionMiniHeader}>
                    <Text style={styles.sessionMiniTime}>{apt.timeSlot.split(' - ')[0]}</Text>
                    <View
                      style={[
                        styles.sessionStatusPill,
                        isPunched
                          ? { backgroundColor: 'rgba(137, 254, 0, 0.15)' }
                          : { backgroundColor: 'rgba(255, 184, 0, 0.15)' },
                      ]}>
                      <Text
                        style={[
                          styles.sessionStatusText,
                          isPunched ? { color: '#89FE00' } : { color: '#FFB800' },
                        ]}>
                        {isPunched ? 'PUNCHED' : apt.sessionType.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sessionMiniName}>{apt.clientName}</Text>
                  <Text style={styles.sessionMiniFocus} numberOfLines={2}>
                    {apt.targetFocus}
                  </Text>

                  {!isPunched && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handlePunchSession(apt.id)}
                      style={styles.miniPunchBtn}>
                      <Text style={styles.miniPunchBtnText}>+ Punch Set</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. 📝 WORKOUT PROGRAM DESIGNER & MESOCYCLE STUDIO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="tune" size={18} color="#FFB800" />
              <Text style={styles.sectionTitle}>MESOCYCLE & SPLIT DESIGNER</Text>
            </View>
            <Text style={styles.sectionCount}>{programs.length} Splits</Text>
          </View>
          <Text style={styles.sectionSub}>
            Inspect day-by-day drills, RPE, tempo, and push customized programs to clients.
          </Text>

          {/* SPLIT CARDS GRID */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.splitsScrollRow}>
            {programs.map((split) => (
              <TouchableOpacity
                key={split.id}
                activeOpacity={0.85}
                onPress={() => handleOpenSplit(split)}
                style={[
                  styles.splitCard,
                  { borderColor: split.color + '44' },
                ]}>
                <View style={styles.splitCardTop}>
                  <View
                    style={[
                      styles.splitCodeBox,
                      { backgroundColor: split.bg, borderColor: split.color },
                    ]}>
                    <Text style={[styles.splitCodeText, { color: split.color }]}>
                      {split.code}
                    </Text>
                  </View>
                  <View style={styles.splitLevelChip}>
                    <Text style={styles.splitLevelText}>{split.daysPerWeek}D/WK</Text>
                  </View>
                </View>

                <Text style={styles.splitCardTitle}>{split.title}</Text>
                <Text style={styles.splitCardDesc} numberOfLines={2}>
                  {split.subtitle}
                </Text>

                <View style={styles.splitCardFooter}>
                  <Text style={[styles.splitDurationText, { color: split.color }]}>
                    {split.durationWeeks} Wks • {split.days.length} Cycles
                  </Text>
                  <View style={[styles.splitInspectBtn, { backgroundColor: split.bg }]}>
                    <Text style={[styles.splitInspectText, { color: split.color }]}>
                      Inspect →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ACTIVE CLIENT PRESCRIPTIONS */}
          {assignedPrograms.length > 0 && (
            <View style={styles.assignedSection}>
              <Text style={styles.assignedTitle}>ACTIVE CLIENT PRESCRIPTIONS</Text>
              <View style={styles.assignedList}>
                {assignedPrograms.map((asg) => (
                  <View key={asg.id} style={styles.assignedRow}>
                    <View style={styles.assignedCodeBox}>
                      <Text style={styles.assignedCodeText}>{asg.splitCode}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignedClientName}>{asg.clientName}</Text>
                      <Text style={styles.assignedSplitTitle}>{asg.splitTitle}</Text>
                    </View>
                    <View style={styles.assignedStatusBadge}>
                      <Text style={styles.assignedStatusText}>{asg.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 3. 📈 ATHLETE 1RM STRENGTH RADAR & VOLUME TONNAGE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="query-stats" size={18} color="#00B4D8" />
              <Text style={styles.sectionTitle}>ATHLETE 1RM STRENGTH RADAR</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCrmModalVisible(true)}>
              <Text style={styles.viewAllText}>Athlete CRM</Text>
            </TouchableOpacity>
          </View>

          {/* CLIENT SELECTOR PILLS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clientRadarScroll}>
            {clients.map((c) => {
              const isSelected = c.id === radarClientId;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRadarClientId(c.id);
                  }}
                  style={[
                    styles.radarClientPill,
                    isSelected && styles.radarClientPillSelected,
                  ]}>
                  <Text
                    style={[
                      styles.radarClientName,
                      isSelected && { color: '#00B4D8', fontFamily: F.sansBold },
                    ]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 1RM COMPOUND PROGRESS BARS */}
          <View style={styles.radarCard}>
            <View style={styles.radarClientHeader}>
              <Text style={styles.radarClientTitle}>
                {selectedRadarClient?.name} — Big 4 Strength Progression
              </Text>
              {selectedRadarClient?.injuries && selectedRadarClient.injuries.length > 0 && (
                <View style={styles.injuryMiniShield}>
                  <MaterialIcons name="shield" size={12} color="#FF5722" />
                  <Text style={styles.injuryMiniShieldText}>Injury Shield Active</Text>
                </View>
              )}
            </View>

            {/* SQUAT */}
            <View style={styles.liftProgressItem}>
              <View style={styles.liftLabelRow}>
                <Text style={styles.liftName}>🏋️ Squat</Text>
                <Text style={styles.liftValues}>
                  {radar1Rm.squat.current}kg{' '}
                  <Text style={styles.liftDelta}>
                    (+{radar1Rm.squat.current - radar1Rm.squat.starting}kg)
                  </Text>
                  {' • Target: '}
                  {radar1Rm.squat.target}kg
                </Text>
              </View>
              <View style={styles.liftBarTrack}>
                <View
                  style={[
                    styles.liftBarFill,
                    {
                      width: `${Math.min(
                        100,
                        (radar1Rm.squat.current / radar1Rm.squat.target) * 100
                      )}%`,
                      backgroundColor: '#FFB800',
                    },
                  ]}
                />
              </View>
            </View>

            {/* BENCH */}
            <View style={styles.liftProgressItem}>
              <View style={styles.liftLabelRow}>
                <Text style={styles.liftName}>💪 Flat Bench</Text>
                <Text style={styles.liftValues}>
                  {radar1Rm.bench.current}kg{' '}
                  <Text style={styles.liftDelta}>
                    (+{radar1Rm.bench.current - radar1Rm.bench.starting}kg)
                  </Text>
                  {' • Target: '}
                  {radar1Rm.bench.target}kg
                </Text>
              </View>
              <View style={styles.liftBarTrack}>
                <View
                  style={[
                    styles.liftBarFill,
                    {
                      width: `${Math.min(
                        100,
                        (radar1Rm.bench.current / radar1Rm.bench.target) * 100
                      )}%`,
                      backgroundColor: '#00B4D8',
                    },
                  ]}
                />
              </View>
            </View>

            {/* DEADLIFT */}
            <View style={styles.liftProgressItem}>
              <View style={styles.liftLabelRow}>
                <Text style={styles.liftName}>🔩 Conventional Deadlift</Text>
                <Text style={styles.liftValues}>
                  {radar1Rm.deadlift.current}kg{' '}
                  <Text style={styles.liftDelta}>
                    (+{radar1Rm.deadlift.current - radar1Rm.deadlift.starting}kg)
                  </Text>
                  {' • Target: '}
                  {radar1Rm.deadlift.target}kg
                </Text>
              </View>
              <View style={styles.liftBarTrack}>
                <View
                  style={[
                    styles.liftBarFill,
                    {
                      width: `${Math.min(
                        100,
                        (radar1Rm.deadlift.current / radar1Rm.deadlift.target) * 100
                      )}%`,
                      backgroundColor: '#FF5722',
                    },
                  ]}
                />
              </View>
            </View>

            {/* OHP */}
            <View style={styles.liftProgressItem}>
              <View style={styles.liftLabelRow}>
                <Text style={styles.liftName}>🎯 Overhead Press</Text>
                <Text style={styles.liftValues}>
                  {radar1Rm.ohp.current}kg{' '}
                  <Text style={styles.liftDelta}>
                    (+{radar1Rm.ohp.current - radar1Rm.ohp.starting}kg)
                  </Text>
                  {' • Target: '}
                  {radar1Rm.ohp.target}kg
                </Text>
              </View>
              <View style={styles.liftBarTrack}>
                <View
                  style={[
                    styles.liftBarFill,
                    {
                      width: `${Math.min(
                        100,
                        (radar1Rm.ohp.current / radar1Rm.ohp.target) * 100
                      )}%`,
                      backgroundColor: '#89FE00',
                    },
                  ]}
                />
              </View>
            </View>

            {/* WEEKLY TONNAGE LOAD TREND */}
            <View style={styles.tonnageBox}>
              <View style={styles.tonnageHeader}>
                <Text style={styles.tonnageTitle}>WEEKLY VOLUME TONNAGE (KG LOAD)</Text>
                <Text style={styles.tonnageVal}>
                  {radar1Rm.weeklyTonnageKg[radar1Rm.weeklyTonnageKg.length - 1].toLocaleString()} kg
                </Text>
              </View>
              <View style={styles.tonnageBarsRow}>
                {radar1Rm.weeklyTonnageKg.map((ton, idx) => (
                  <View key={idx} style={styles.tonnageCol}>
                    <View style={styles.tonnageBarTrack}>
                      <View
                        style={[
                          styles.tonnageBarFill,
                          { height: `${(ton / 28000) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.tonnageWeekLabel}>Wk {idx + 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 4. 🧬 ANATOMICAL MUSCLE VISUALIZER (COACH PROGRAMMING) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="accessibility" size={18} color="#89FE00" />
              <Text style={styles.sectionTitle}>TARGET MUSCLE ANATOMICAL PLANNER</Text>
            </View>
            <Text style={styles.sectionCount}>{selectedMuscles.length} Targeted</Text>
          </View>
          <Text style={styles.sectionSub}>
            Tap anterior or posterior muscle groups to define targeted stimulus for custom workouts.
          </Text>

          <TargetMuscleVisualizer
            activeSide={activeSide}
            selectedMuscles={selectedMuscles}
            contextBadge={`COACH PROGRAM FOCUS: ${selectedMuscleNames.toUpperCase()}`}
            onSideChange={setActiveSide}
            onToggleMuscle={toggleMuscle}
          />
        </View>

        {/* 5. 🔗 STUDIO OPERATIONS & QUICK LINKS */}
        <View style={styles.quickOpsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCrmModalVisible(true)}
            style={styles.quickOpBtn}>
            <MaterialIcons name="groups" size={18} color="#00B4D8" />
            <Text style={styles.quickOpTitle}>Athletes</Text>
            <Text style={styles.quickOpSub}>{clients.length} Active</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDietModalVisible(true)}
            style={styles.quickOpBtn}>
            <MaterialIcons name="restaurant-menu" size={18} color="#89FE00" />
            <Text style={styles.quickOpTitle}>Diets</Text>
            <Text style={styles.quickOpSub}>Desi Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setScheduleModalVisible(true)}
            style={styles.quickOpBtn}>
            <MaterialIcons name="calendar-month" size={18} color="#89FE00" />
            <Text style={styles.quickOpTitle}>Schedule</Text>
            <Text style={styles.quickOpSub}>{appointments.length} Slots</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setProfileModalVisible(true)}
            style={styles.quickOpBtn}>
            <MaterialIcons name="workspace-premium" size={18} color="#FFB800" />
            <Text style={styles.quickOpTitle}>Badges</Text>
            <Text style={styles.quickOpSub}>CSCS • ACE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setDraftNotes(sessionNotes);
              setNotesModalVisible(true);
            }}
            style={styles.quickOpBtn}>
            <MaterialIcons name="notes" size={18} color="#FCC419" />
            <Text style={styles.quickOpTitle}>Notes</Text>
            <Text style={styles.quickOpSub}>Floor Log</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* WORKOUT PROGRAM DESIGNER MODAL */}
      <WorkoutProgramDesignerModal
        visible={splitDesignerVisible}
        split={selectedSplit}
        onClose={() => setSplitDesignerVisible(false)}
      />

      {/* CLIENT CRM MODAL */}
      <ClientCrmModal
        visible={crmModalVisible}
        onClose={() => setCrmModalVisible(false)}
      />

      {/* TRAINER SCHEDULE MODAL */}
      <TrainerScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
      />

      {/* TRAINER PROFILE & CREDENTIALS MODAL */}
      <TrainerProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      {/* COACH DIET & MACRO PRESCRIPTION MODAL */}
      <CoachDietPrescriptionModal
        visible={dietModalVisible}
        onClose={() => setDietModalVisible(false)}
      />

      {/* SESSION NOTES MODAL */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotesModalVisible(false)}>
        <View style={styles.notesOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.notesBox}>
            <View style={styles.notesHeader}>
              <MaterialIcons name="edit-note" size={22} color="#FCC419" />
              <Text style={styles.notesTitle}>Coach Floor & Session Notes</Text>
            </View>

            <TextInput
              style={styles.notesTextInput}
              multiline
              numberOfLines={6}
              value={draftNotes}
              onChangeText={setDraftNotes}
              placeholder="Record cues, progression notes, and athlete comments..."
              placeholderTextColor={T.textMuted}
            />

            <View style={styles.notesBtnRow}>
              <TouchableOpacity
                onPress={() => setNotesModalVisible(false)}
                style={styles.notesCancelBtn}>
                <Text style={styles.notesCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNotes}
                style={styles.notesSaveBtn}>
                <Text style={styles.notesSaveText}>Save Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  coachHeaderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.2)',
  },
  coachHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#89FE00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarText: {
    fontFamily: F.sansBold,
    fontSize: 20,
    color: '#000',
  },
  coachBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cscsBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cscsBadgeText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: '#FFB800',
    fontWeight: '800',
  },
  floorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  liveGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#89FE00',
  },
  floorStatusText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: '#89FE00',
    fontWeight: '700',
  },
  coachTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: T.textPrimary,
  },
  coachMeta: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: T.textSecondary,
  },
  sectionCard: {
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 11.5,
    letterSpacing: 1.1,
    color: T.textPrimary,
    fontWeight: '800',
  },
  sectionCount: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.primary,
  },
  viewAllText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: T.primary,
  },
  sectionSub: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    marginTop: -4,
    lineHeight: 16,
  },
  nextAlertBox: {
    backgroundColor: 'rgba(137, 254, 0, 0.05)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(137, 254, 0, 0.25)',
    gap: 8,
  },
  nextAlertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(137, 254, 0, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#89FE00',
  },
  nextAlertBadgeText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: '#89FE00',
    fontWeight: '800',
  },
  nextTimeText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textSecondary,
  },
  nextClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextClientAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextClientAvatarText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: T.textPrimary,
  },
  nextClientName: {
    fontFamily: F.sansBold,
    fontSize: 13.5,
    color: T.textPrimary,
  },
  nextClientFocus: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  punchBtnText: {
    fontFamily: F.sansBold,
    fontSize: 11.5,
    color: '#000',
  },
  punchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  punchedBadgeText: {
    fontFamily: F.mono,
    fontSize: 11,
    color: '#89FE00',
  },
  sessionScrollRow: {
    gap: 10,
  },
  sessionMiniCard: {
    width: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 6,
  },
  sessionMiniCardPunched: {
    borderColor: 'rgba(137, 254, 0, 0.25)',
    backgroundColor: 'rgba(137, 254, 0, 0.03)',
  },
  sessionMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionMiniTime: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.textMuted,
  },
  sessionStatusPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sessionStatusText: {
    fontFamily: F.mono,
    fontSize: 8.5,
    fontWeight: '800',
  },
  sessionMiniName: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: T.textPrimary,
  },
  sessionMiniFocus: {
    fontFamily: F.sans,
    fontSize: 10.5,
    color: T.textSecondary,
    minHeight: 28,
  },
  miniPunchBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
    marginTop: 4,
  },
  miniPunchBtnText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.primary,
    fontWeight: '700',
  },
  splitsScrollRow: {
    gap: 10,
  },
  splitCard: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  splitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitCodeBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  splitCodeText: {
    fontFamily: F.mono,
    fontSize: 11,
    fontWeight: '800',
  },
  splitLevelChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  splitLevelText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: T.textMuted,
  },
  splitCardTitle: {
    fontFamily: F.sansBold,
    fontSize: 13.5,
    color: T.textPrimary,
  },
  splitCardDesc: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
    lineHeight: 15,
  },
  splitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  splitDurationText: {
    fontFamily: F.mono,
    fontSize: 10,
  },
  splitInspectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  splitInspectText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    fontWeight: '700',
  },
  assignedSection: {
    gap: 8,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  assignedTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textMuted,
    letterSpacing: 0.8,
  },
  assignedList: {
    gap: 6,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  assignedCodeBox: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assignedCodeText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: '#FFB800',
    fontWeight: '800',
  },
  assignedClientName: {
    fontFamily: F.sansSemiBold,
    fontSize: 12.5,
    color: T.textPrimary,
  },
  assignedSplitTitle: {
    fontFamily: F.sans,
    fontSize: 10.5,
    color: T.textSecondary,
  },
  assignedStatusBadge: {
    backgroundColor: 'rgba(137, 254, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assignedStatusText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: '#89FE00',
    fontWeight: '700',
  },
  clientRadarScroll: {
    gap: 8,
  },
  radarClientPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  radarClientPillSelected: {
    backgroundColor: 'rgba(0, 180, 216, 0.12)',
    borderColor: '#00B4D8',
  },
  radarClientName: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: T.textSecondary,
  },
  radarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  radarClientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarClientTitle: {
    fontFamily: F.sansBold,
    fontSize: 12.5,
    color: T.textPrimary,
  },
  injuryMiniShield: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  injuryMiniShieldText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: '#FF5722',
  },
  liftProgressItem: {
    gap: 4,
  },
  liftLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liftName: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: T.textPrimary,
  },
  liftValues: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textSecondary,
  },
  liftDelta: {
    color: '#89FE00',
    fontWeight: '700',
  },
  liftBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  liftBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tonnageBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  tonnageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tonnageTitle: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: T.textMuted,
  },
  tonnageVal: {
    fontFamily: F.mono,
    fontSize: 12,
    color: '#00B4D8',
    fontWeight: '800',
  },
  tonnageBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 12,
    paddingTop: 6,
  },
  tonnageCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
  },
  tonnageBarTrack: {
    flex: 1,
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tonnageBarFill: {
    width: '100%',
    backgroundColor: '#00B4D8',
    borderRadius: 4,
  },
  tonnageWeekLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    color: T.textMuted,
  },
  quickOpsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickOpBtn: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickOpTitle: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: T.textPrimary,
  },
  quickOpSub: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: T.textMuted,
  },
  notesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notesBox: {
    width: '100%',
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 14,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: T.textPrimary,
  },
  notesTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    color: T.textPrimary,
    fontFamily: F.sans,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  notesBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  notesCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  notesCancelText: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: T.textSecondary,
  },
  notesSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FCC419',
  },
  notesSaveText: {
    fontFamily: F.sansBold,
    fontSize: 12.5,
    color: '#000',
  },
});
