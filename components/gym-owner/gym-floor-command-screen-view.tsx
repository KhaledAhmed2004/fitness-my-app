/**
 * Gym Floor Command & Equipment Health Screen View
 * Full-screen operations hub rendered on Tab 5 when user has 'GYM_OWNER' role.
 * Features:
 *  1. Live Floor Capacity & Rush Hour Telemetry.
 *  2. Equipment AMC Radar & Breakdown Alert Matrix with 1-tap technician dialer.
 *  3. Trainer Shift & Staff Management Roster.
 *  4. Quick Launchers for CRM, Leads, Financials, and Announcements.
 *  5. 1-Tap toggle to Personal Workout / GPS Running Session.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/ui/app-screen';
import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymEquipmentItem, GymTrainerStaff } from '@/types/gym';
import { GymEquipmentMaintenanceModal } from './gym-equipment-maintenance-modal';
import { GymCheckinStationModal } from './gym-checkin-station-modal';
import { GymFinancialsAnalyticsModal } from './gym-financials-analytics-modal';
import { GymLeadPipelineModal } from './gym-lead-pipeline-modal';
import { GymAnnouncementModal } from './gym-announcement-modal';
import { GymMemberCrmModal } from './gym-member-crm-modal';

const C = Vital.colors;
const F = Vital.fonts;

type Props = {
  onTogglePersonalTraining?: () => void;
};

export function GymFloorCommandScreenView({ onTogglePersonalTraining }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const {
    gymProfile,
    trainers,
    equipment,
    todayCheckInIds,
    getFinancialSnapshot,
  } = useGymOwnerStore();

  // Modals
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [financialsModalVisible, setFinancialsModalVisible] = useState(false);
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [crmModalVisible, setCrmModalVisible] = useState(false);

  const snapshot = getFinancialSnapshot();
  const brokenEquipment = equipment.filter((e) => e.status !== 'OPTIMAL');
  const serviceDueEquipment = equipment.filter((e) => e.status === 'SERVICE_DUE');
  const outOfOrderEquipment = equipment.filter((e) => e.status === 'OUT_OF_ORDER');

  const floorPercent = Math.min(
    100,
    Math.round((todayCheckInIds.length / gymProfile.maxFloorCapacity) * 100)
  );

  const handleCallTechnician = (eq: GymEquipmentItem) => {
    if (!eq.technicianPhone) {
      Alert.alert('No Contact', 'No technician phone number registered for this machine.');
      return;
    }
    const cleanPhone = eq.technicianPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Phone Call Failed', 'Could not initiate phone call.');
    });
  };

  return (
    <AppScreen>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="fitness-center" size={18} color="#89FE00" />
              <Text style={[styles.headerBadge, { color: '#89FE00' }]}>FLOOR COMMAND & ASSETS</Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {gymProfile.gymName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {trainers.length} Active Coaches • {equipment.length} Tracked Assets
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {onTogglePersonalTraining && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onTogglePersonalTraining();
                }}
                style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="directions-run" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setCheckinModalVisible(true);
              }}
              style={[styles.primaryActionBtn, { backgroundColor: '#89FE00' }]}>
              <MaterialIcons name="how-to-reg" size={16} color="#000" />
              <Text style={styles.primaryActionBtnText}>Check In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* FLOOR CAPACITY PULSE HERO */}
          <View
            style={[
              styles.floorCard,
              {
                backgroundColor: colors.surface,
                borderColor: floorPercent > 80 ? 'rgba(250, 82, 82, 0.4)' : colors.border,
              },
            ]}>
            <View style={styles.floorCardTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.pulseDot, { backgroundColor: floorPercent > 80 ? '#FA5252' : '#40C057' }]} />
                <Text style={[styles.floorCardLabel, { color: colors.textPrimary }]}>
                  REAL-TIME FLOOR OCCUPANCY
                </Text>
              </View>

              <View
                style={[
                  styles.rushBadge,
                  {
                    backgroundColor:
                      floorPercent > 80
                        ? 'rgba(250, 82, 82, 0.18)'
                        : floorPercent > 50
                        ? 'rgba(255, 184, 0, 0.18)'
                        : 'rgba(64, 192, 87, 0.18)',
                  },
                ]}>
                <Text
                  style={[
                    styles.rushBadgeText,
                    {
                      color:
                        floorPercent > 80
                          ? '#FA5252'
                          : floorPercent > 50
                          ? '#FFB800'
                          : '#40C057',
                    },
                  ]}>
                  {floorPercent > 80 ? 'PEAK CAPACITY' : floorPercent > 50 ? 'BUSY FLOOR' : 'NORMAL FLOW'}
                </Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${floorPercent}%`,
                    backgroundColor: floorPercent > 80 ? '#FA5252' : floorPercent > 50 ? '#FFB800' : '#40C057',
                  },
                ]}
              />
            </View>

            <View style={styles.floorStatsRow}>
              <Text style={[styles.floorStatText, { color: colors.textSecondary }]}>
                Occupancy: <Text style={{ color: colors.textPrimary, fontFamily: F.monoBold }}>{todayCheckInIds.length} / {gymProfile.maxFloorCapacity}</Text>
              </Text>
              <Text style={[styles.floorStatText, { color: colors.textSecondary }]}>
                Operating: <Text style={{ color: colors.textPrimary, fontFamily: F.monoBold }}>{gymProfile.operatingHours}</Text>
              </Text>
            </View>
          </View>

          {/* EQUIPMENT HEALTH & AMC RADAR PREVIEW */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="build" size={16} color="#FFB800" />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                EQUIPMENT AMC & REPAIR RADAR
              </Text>
            </View>

            <TouchableOpacity onPress={() => setEquipmentModalVisible(true)}>
              <Text style={{ color: colors.primary, fontFamily: F.sansBold, fontSize: 12 }}>
                Full AMC Log ➔
              </Text>
            </TouchableOpacity>
          </View>

          {/* AMC QUICK STATUS CARDS */}
          <View style={styles.amcGrid}>
            <View style={[styles.amcTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.amcTileLabel, { color: colors.textSecondary }]}>OPTIMAL</Text>
              <Text style={[styles.amcTileValue, { color: '#40C057' }]}>
                {equipment.filter((e) => e.status === 'OPTIMAL').length}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: F.mono, color: '#40C057' }}>All Systems Go</Text>
            </View>

            <View
              style={[
                styles.amcTile,
                {
                  backgroundColor: colors.surface,
                  borderColor: serviceDueEquipment.length > 0 ? 'rgba(255, 184, 0, 0.4)' : colors.border,
                },
              ]}>
              <Text style={[styles.amcTileLabel, { color: colors.textSecondary }]}>SERVICE DUE</Text>
              <Text style={[styles.amcTileValue, { color: '#FFB800' }]}>
                {serviceDueEquipment.length}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: F.mono, color: '#FFB800' }}>Routine Lube</Text>
            </View>

            <View
              style={[
                styles.amcTile,
                {
                  backgroundColor: colors.surface,
                  borderColor: outOfOrderEquipment.length > 0 ? 'rgba(250, 82, 82, 0.4)' : colors.border,
                },
              ]}>
              <Text style={[styles.amcTileLabel, { color: colors.textSecondary }]}>OUT OF ORDER</Text>
              <Text style={[styles.amcTileValue, { color: '#FA5252' }]}>
                {outOfOrderEquipment.length}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: F.mono, color: '#FA5252' }}>Down Machines</Text>
            </View>
          </View>

          {/* BROKEN / SERVICE DUE HIGHLIGHT LIST */}
          {brokenEquipment.length > 0 && (
            <View style={{ gap: 8, marginBottom: 18 }}>
              {brokenEquipment.map((eq) => (
                <View
                  key={eq.id}
                  style={[
                    styles.brokenCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: eq.status === 'OUT_OF_ORDER' ? 'rgba(250, 82, 82, 0.4)' : 'rgba(255, 184, 0, 0.4)',
                    },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons
                        name={eq.status === 'OUT_OF_ORDER' ? 'error' : 'schedule'}
                        size={16}
                        color={eq.status === 'OUT_OF_ORDER' ? '#FA5252' : '#FFB800'}
                      />
                      <Text style={[styles.eqName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {eq.name}
                      </Text>
                    </View>

                    <Text style={[styles.eqNotes, { color: colors.textSecondary }]}>
                      {eq.notes || 'Routine servicing inspection required.'}
                    </Text>
                  </View>

                  {eq.technicianPhone && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleCallTechnician(eq)}
                      style={[styles.callBtn, { backgroundColor: 'rgba(56, 189, 248, 0.18)' }]}>
                      <MaterialIcons name="phone" size={14} color="#38BDF8" />
                      <Text style={[styles.callBtnText, { color: '#38BDF8' }]}>Call Tech</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* TRAINER STAFF & COACHING ROSTER */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="badge" size={16} color="#00B4D8" />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                TRAINER STAFF & SHIFT ROSTER ({trainers.length})
              </Text>
            </View>
          </View>

          <View style={{ gap: 10, marginBottom: 20 }}>
            {trainers.map((tr) => (
              <View
                key={tr.id}
                style={[
                  styles.trainerCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.avatarWrap}>
                  {tr.avatarUrl ? (
                    <Image source={{ uri: tr.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: C.primaryAlpha20 }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {tr.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.trainerName, { color: colors.textPrimary }]}>
                      {tr.name}
                    </Text>
                    <View style={[styles.shiftTag, { backgroundColor: colors.glassFill }]}>
                      <Text style={[styles.shiftTagText, { color: colors.textSecondary }]}>
                        {tr.shift}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.trainerSpec, { color: colors.textSecondary }]}>
                    {tr.specialization}
                  </Text>

                  <View style={{ gap: 4, marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: F.mono, color: colors.accentLime || '#89FE00' }}>
                        👥 {tr.assignedClientsCount} Active PT Clients
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: F.monoBold, color: '#40C057' }}>
                        ৳{tr.monthlyRevenueGeneratedBdt.toLocaleString()} Generated
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: colors.glassFill,
                      }}>
                      <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                        Coach Payout ({tr.commissionPercentage}%): <Text style={{ color: colors.primary, fontFamily: F.monoBold }}>৳{Math.round(tr.monthlyRevenueGeneratedBdt * (tr.commissionPercentage / 100)).toLocaleString()}</Text>
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: F.sans, color: colors.textSecondary }}>
                        Gym Net: <Text style={{ color: '#40C057', fontFamily: F.monoBold }}>৳{Math.round(tr.monthlyRevenueGeneratedBdt * ((100 - tr.commissionPercentage) / 100)).toLocaleString()}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* MODALS */}
        <GymEquipmentMaintenanceModal
          visible={equipmentModalVisible}
          onClose={() => setEquipmentModalVisible(false)}
        />

        <GymCheckinStationModal
          visible={checkinModalVisible}
          onClose={() => setCheckinModalVisible(false)}
          onOpenMemberCrm={() => {
            setCheckinModalVisible(false);
            setCrmModalVisible(true);
          }}
        />

        <GymFinancialsAnalyticsModal
          visible={financialsModalVisible}
          onClose={() => setFinancialsModalVisible(false)}
        />

        <GymLeadPipelineModal
          visible={leadModalVisible}
          onClose={() => setLeadModalVisible(false)}
        />

        <GymAnnouncementModal
          visible={announcementModalVisible}
          onClose={() => setAnnouncementModalVisible(false)}
        />

        <GymMemberCrmModal
          visible={crmModalVisible}
          onClose={() => setCrmModalVisible(false)}
        />
      </View>
    </AppScreen>
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
    paddingVertical: 12,
  },
  headerBadge: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: F.sansBold,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: F.sans,
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  floorCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  floorCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floorCardLabel: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 0.8,
  },
  rushBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rushBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  floorStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorStatText: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.monoBold,
    letterSpacing: 1,
  },
  amcGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  amcTile: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  amcTileLabel: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  amcTileValue: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  brokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  eqName: {
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  eqNotes: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  trainerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  trainerName: {
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  shiftTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shiftTagText: {
    fontSize: 9,
    fontFamily: F.monoBold,
  },
  trainerSpec: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
});
