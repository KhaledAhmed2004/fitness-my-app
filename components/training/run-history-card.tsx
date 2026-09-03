import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import type { RunSession } from '@/services/running-api';

const C = Vital.colors;
const F = Vital.fonts;

export function RunHistoryCard({ run }: { run: RunSession }) {
  const router = useRouter();

  const dateStr = new Date(run.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const m = Math.floor(run.duration_sec / 60);
  const s = run.duration_sec % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  const pM = Math.floor(run.pace_min_per_km);
  const pS = Math.floor((run.pace_min_per_km - pM) * 60);
  const paceStr = `${pM}'${pS.toString().padStart(2, '0')}"`;

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push({
      pathname: '/training/run-complete',
      params: {
        distance: run.distance_km.toFixed(2),
        duration: run.duration_sec.toString(),
        pace: run.pace_min_per_km.toFixed(2),
        calories: run.calories.toString(),
        steps: run.steps.toString(),
      },
    });
  };

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.leftRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="directions-run" size={20} color="#C8F135" />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.runTitle}>Outdoor Run</Text>
            <View style={styles.dateRow}>
              <MaterialIcons name="event" size={13} color="rgba(255, 255, 255, 0.45)" />
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>
          </View>
        </View>

        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{run.distance_km.toFixed(2)} km</Text>
        </View>
      </View>

      {/* 3-Column Stats Matrix */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>DURATION</Text>
          <Text style={styles.statValue}>{timeStr}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>AVG PACE</Text>
          <Text style={styles.statValue}>{paceStr}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>CALORIES</Text>
          <Text style={styles.statValue}>{run.calories} kcal</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12161B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    gap: 2,
  },
  runTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  distanceBadge: {
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontFamily: F.mono,
    fontSize: 13,
    fontWeight: '700',
    color: '#C8F135',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  statValue: {
    fontFamily: F.mono,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
