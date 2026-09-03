import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface HealthVaultSummaryCardProps {
  onOpenHealthVault: () => void;
  onLogEvent?: () => void;
}

export function HealthVaultSummaryCard({
  onOpenHealthVault,
  onLogEvent,
}: HealthVaultSummaryCardProps) {
  const members = useHealthVaultStore((s) => s.members);
  const events = useHealthVaultStore((s) => s.events);
  const documents = useHealthVaultStore((s) => s.documents);
  const doctors = useHealthVaultStore((s) => s.doctors);
  const followUps = useHealthVaultStore((s) => s.followUps);
  const diagnosticTests = useHealthVaultStore((s) => s.diagnosticTests);

  const upcomingFollowUp = useMemo(() => {
    const list = followUps.filter((f) => f.status === 'UPCOMING');
    return list.length > 0 ? list[0] : null;
  }, [followUps]);

  const pendingTestsCount = useMemo(() => {
    return diagnosticTests.filter((t) => t.status === 'PENDING').length;
  }, [diagnosticTests]);

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenHealthVault();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="health-and-safety" size={20} color="#38BDF8" />
          </View>
          <View>
            <Text style={styles.title}>FAMILY HEALTH VAULT</Text>
            <Text style={styles.subtitle}>
              Prescriptions, Care Timeline & Diagnostics
            </Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{members.length} Members</Text>
        </View>
      </View>

      {/* Upcoming Follow-Up Showcase */}
      {upcomingFollowUp ? (
        <View style={styles.followUpBanner}>
          <View style={styles.followUpLeft}>
            <MaterialIcons name="event-available" size={16} color="#FF922B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.followUpLabel}>UPCOMING APPOINTMENT</Text>
              <Text style={styles.followUpTitle} numberOfLines={1}>
                {upcomingFollowUp.doctorName} • {upcomingFollowUp.reason}
              </Text>
            </View>
          </View>

          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{upcomingFollowUp.dueDate}</Text>
          </View>
        </View>
      ) : null}

      {/* Bento Stats Row */}
      <View style={styles.bentoRow}>
        <View style={styles.bentoItem}>
          <Text style={styles.bentoLabel}>TOTAL VAULT DOCS</Text>
          <Text style={[styles.bentoVal, { color: '#38BDF8' }]}>
            {documents.length} Files
          </Text>
          <Text style={styles.bentoSub}>Prescriptions & Reports</Text>
        </View>

        <View style={styles.bentoItem}>
          <Text style={styles.bentoLabel}>DOCTOR VISITS</Text>
          <Text style={[styles.bentoVal, { color: '#20C997' }]}>
            {events.length} Consultations
          </Text>
          <Text style={styles.bentoSub}>{doctors.length} Doctors Registered</Text>
        </View>

        <View style={styles.bentoItem}>
          <Text style={styles.bentoLabel}>PENDING TESTS</Text>
          <Text style={[styles.bentoVal, { color: pendingTestsCount > 0 ? '#FF922B' : '#51CF66' }]}>
            {pendingTestsCount} Tests
          </Text>
          <Text style={styles.bentoSub}>
            {pendingTestsCount > 0 ? 'Awaiting Reports' : 'All Clear'}
          </Text>
        </View>
      </View>

      {/* Footer Navigation Action */}
      <View style={styles.footerRow}>
        <View style={styles.membersAvatarsRow}>
          {members.slice(0, 3).map((m) => (
            <View
              key={m.id}
              style={[
                styles.memberAvatarCircle,
                { backgroundColor: `${m.avatarColor}25`, borderColor: m.avatarColor },
              ]}>
              <Text style={[styles.memberAvatarText, { color: m.avatarColor }]}>
                {m.name.charAt(0)}
              </Text>
            </View>
          ))}
          <Text style={styles.footerTipText}>
            Khaled, Father & Family records synced
          </Text>
        </View>

        <View style={styles.chevronRow}>
          <Text style={styles.manageText}>Health OS</Text>
          <MaterialIcons name="chevron-right" size={16} color="#38BDF8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181F23',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13191C',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  followUpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  followUpLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#FF922B',
    letterSpacing: 0.4,
  },
  followUpTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 1,
  },
  datePill: {
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  datePillText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#FF922B',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bentoItem: {
    flex: 1,
    backgroundColor: '#13191C',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  bentoLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  bentoVal: {
    fontFamily: F.bold,
    fontSize: 13,
    marginTop: 2,
  },
  bentoSub: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  membersAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  memberAvatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  memberAvatarText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  footerTipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
});
