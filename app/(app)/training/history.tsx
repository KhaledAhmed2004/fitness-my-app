import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { WorkoutRepository, WorkoutSession } from '@/repositories/workout.repository';
import { SyncService } from '@/services/sync.service';
import { RunningAPI, RunSession } from '@/services/running-api';
import { RunHistoryCard } from '@/components/training/run-history-card';

const C = Vital.colors;
const F = Vital.fonts;

export default function TrainingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [runs, setRuns] = useState<RunSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'workouts' | 'runs'>('workouts');

  const loadHistory = async () => {
    try {
      const [data, runData] = await Promise.all([
        WorkoutRepository.getHistory(),
        RunningAPI.getRuns(),
      ]);
      setHistory(data);
      setRuns(runData.sort((a, b) => b.date - a.date));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();

      const performSync = async () => {
        setSyncing(true);
        await SyncService.syncPendingWorkouts();
        await loadHistory();
        setSyncing(false);
      };

      performSync();
    }, [])
  );

  // Aggregate Metrics for Top Banner
  const workoutMetrics = useMemo(() => {
    const totalCount = history.length;
    let totalSecs = 0;
    history.forEach((w) => {
      if (w.start_time && w.end_time) {
        totalSecs += Math.max(0, w.end_time - w.start_time);
      }
    });

    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      count: totalCount,
      time: timeDisplay,
      rate: totalCount > 0 ? '100%' : '0%',
    };
  }, [history]);

  const runMetrics = useMemo(() => {
    const totalKm = runs.reduce((acc, r) => acc + r.distance_km, 0);
    const totalSecs = runs.reduce((acc, r) => acc + r.duration_sec, 0);
    const totalCal = runs.reduce((acc, r) => acc + r.calories, 0);

    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      distance: `${totalKm.toFixed(1)} km`,
      time: timeDisplay,
      calories: `${totalCal} kcal`,
    };
  }, [runs]);

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown Date';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderWorkoutItem = ({ item }: { item: WorkoutSession }) => {
    const durationMins =
      item.start_time && item.end_time
        ? Math.max(1, Math.round((item.end_time - item.start_time) / 60))
        : null;

    return (
      <Pressable
        style={styles.historyCard}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push(`/training/workout-summary?id=${item.id}`);
        }}>
        <View style={styles.iconBox}>
          <MaterialIcons name="fitness-center" size={22} color="#C8F135" />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.cardMetaRow}>
            <View style={styles.metaBadge}>
              <MaterialIcons name="event" size={12} color="rgba(255, 255, 255, 0.45)" />
              <Text style={styles.metaBadgeText}>{formatDate(item.start_time)}</Text>
            </View>

            {durationMins ? (
              <View style={styles.metaBadge}>
                <MaterialIcons name="timer" size={12} color="rgba(255, 255, 255, 0.45)" />
                <Text style={styles.metaBadgeText}>{durationMins}m</Text>
              </View>
            ) : null}

            {item.sync_status === 'SYNCED' ? (
              <View style={[styles.metaBadge, styles.syncedBadge]}>
                <MaterialIcons name="cloud-done" size={12} color="#4ADE80" />
                <Text style={[styles.metaBadgeText, { color: '#4ADE80' }]}>Synced</Text>
              </View>
            ) : item.sync_status === 'PENDING' ? (
              <View style={[styles.metaBadge, styles.pendingBadge]}>
                <MaterialIcons name="cloud-upload" size={12} color="#FACC15" />
                <Text style={[styles.metaBadgeText, { color: '#FACC15' }]}>Pending</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.chevronBox}>
          <MaterialIcons name="chevron-right" size={18} color="rgba(255, 255, 255, 0.4)" />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* 1. ATTRACTIVE & MODERN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.back();
          }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Training History</Text>
          <Text style={styles.headerSubtitle}>Activity Logs</Text>
        </View>
      </View>

      {/* 2. TOP AGGREGATE ANALYTICS BANNER */}
      <View style={styles.analyticsBanner}>
        {activeTab === 'workouts' ? (
          <>
            <View style={styles.analyticsStatCol}>
              <Text style={styles.analyticsLabel}>SESSIONS</Text>
              <Text style={styles.analyticsValue}>{workoutMetrics.count}</Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStatCol}>
              <Text style={styles.analyticsLabel}>ACTIVE TIME</Text>
              <Text style={styles.analyticsValue}>{workoutMetrics.time}</Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStatCol}>
              <Text style={styles.analyticsLabel}>COMPLETION</Text>
              <Text style={[styles.analyticsValue, { color: '#C8F135' }]}>
                {workoutMetrics.rate}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.analyticsStatCol}>
              <Text style={styles.analyticsLabel}>DISTANCE</Text>
              <Text style={[styles.analyticsValue, { color: '#C8F135' }]}>
                {runMetrics.distance}
              </Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStatCol}>
              <Text style={styles.analyticsLabel}>RUN TIME</Text>
              <Text style={styles.analyticsValue}>{runMetrics.time}</Text>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.analyticsStatCol}>
              <Text style={styles.analyticsLabel}>ENERGY</Text>
              <Text style={styles.analyticsValue}>{runMetrics.calories}</Text>
            </View>
          </>
        )}
      </View>

      {/* 3. SEGMENTED PILL SWITCHER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tab, activeTab === 'workouts' && styles.activeTab]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveTab('workouts');
          }}>
          <MaterialIcons
            name="fitness-center"
            size={16}
            color={activeTab === 'workouts' ? '#101416' : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>
            Workouts
          </Text>
          <View
            style={[
              styles.countPill,
              activeTab === 'workouts' && styles.countPillActive,
            ]}>
            <Text
              style={[
                styles.countPillText,
                activeTab === 'workouts' && styles.countPillTextActive,
              ]}>
              {history.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tab, activeTab === 'runs' && styles.activeTab]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveTab('runs');
          }}>
          <MaterialIcons
            name="directions-run"
            size={16}
            color={activeTab === 'runs' ? '#101416' : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[styles.tabText, activeTab === 'runs' && styles.activeTabText]}>
            Runs
          </Text>
          <View
            style={[
              styles.countPill,
              activeTab === 'runs' && styles.countPillActive,
            ]}>
            <Text
              style={[
                styles.countPillText,
                activeTab === 'runs' && styles.countPillTextActive,
              ]}>
              {runs.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. CONTENT LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C8F135" size="large" />
        </View>
      ) : activeTab === 'workouts' ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkoutItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="fitness-center" size={32} color="#C8F135" />
              </View>
              <Text style={styles.emptyTitle}>No workouts recorded yet</Text>
              <Text style={styles.emptySubtitle}>
                Complete a workout session from the Training Hub to log your sets, volume, and progress.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.back()}
                style={styles.emptyActionBtn}>
                <MaterialIcons name="play-arrow" size={18} color="#101416" />
                <Text style={styles.emptyActionBtnText}>Start a Workout</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RunHistoryCard run={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="directions-run" size={32} color="#C8F135" />
              </View>
              <Text style={styles.emptyTitle}>No runs recorded yet</Text>
              <Text style={styles.emptySubtitle}>
                Track your outdoor running distance, duration, and pace in the Run Hub.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/training/run-hub')}
                style={styles.emptyActionBtn}>
                <MaterialIcons name="directions-run" size={18} color="#101416" />
                <Text style={styles.emptyActionBtnText}>Start Outdoor Run</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#13171D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  analyticsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12161B',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  analyticsStatCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  analyticsDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  analyticsLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  analyticsValue: {
    fontFamily: F.mono,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#14181D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  activeTab: {
    backgroundColor: '#C8F135',
    borderColor: '#C8F135',
    shadowColor: '#C8F135',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontFamily: F.sansBold,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#101416',
  },
  countPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countPillActive: {
    backgroundColor: 'rgba(16, 20, 22, 0.2)',
  },
  countPillText: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  countPillTextActive: {
    color: '#101416',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161B',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(200, 241, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  syncedBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  metaBadgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12161B',
    borderRadius: 22,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(200, 241, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 241, 53, 0.25)',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C8F135',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyActionBtnText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: '#101416',
  },
});
