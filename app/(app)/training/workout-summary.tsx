import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { WorkoutRepository, ActiveWorkoutData } from '@/repositories/workout.repository';

const T = TrainingTheme;
const F = Vital.fonts;

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [session, setSession] = useState<ActiveWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!id) return;
      try {
        const data = await WorkoutRepository.getSessionById(id);
        setSession(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleGoBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleGoBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={20} color={T.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Workout Summary</Text>
            <Text style={styles.headerSubtitle}>Session Overview</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="fitness-center" size={40} color={T.textMuted} />
          <Text style={styles.emptyText}>Session not found.</Text>
        </View>
      </View>
    );
  }

  const duration = (session.start_time && session.end_time) ? Math.max(0, session.end_time - session.start_time) : 0;
  
  // Calculate total volume and sets
  let totalVolume = 0;
  let totalSets = 0;
  
  session.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      if (set.is_completed) {
        totalVolume += set.weight * set.reps;
        totalSets += 1;
      }
    });
  });

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* 1. ATTRACTIVE & MODERN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleGoBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={20} color={T.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Workout Summary</Text>
          <Text style={styles.headerSubtitle}>Session Overview</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 2. WORKOUT HERO INFO */}
        <View style={styles.workoutHero}>
          <Text style={styles.workoutName}>{session.name}</Text>
          <View style={styles.dateRow}>
            <MaterialIcons name="event" size={14} color={T.textSecondary} />
            <Text style={styles.workoutDate}>
              {session.start_time
                ? new Date(session.start_time * 1000).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Unknown Date'}
            </Text>
          </View>
        </View>

        {/* 3. PERFORMANCE STATS TILES */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <MaterialIcons name="timer" size={18} color={T.secondary} />
            </View>
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: T.surfaceActiveTint }]}>
              <MaterialIcons name="fitness-center" size={18} color={T.primary} />
            </View>
            <Text style={styles.statValue}>{totalVolume} kg</Text>
            <Text style={styles.statLabel}>VOLUME</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(251, 146, 60, 0.12)' }]}>
              <MaterialIcons name="format-list-numbered" size={18} color={T.metricOrange} />
            </View>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>SETS</Text>
          </View>
        </View>

        {/* 4. EXERCISE BREAKDOWN */}
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>EXERCISES</Text>
            <Text style={styles.exerciseCountText}>
              {session.exercises.filter((e) => e.sets.some((s) => s.is_completed)).length} performed
            </Text>
          </View>

          {session.exercises.map((ex) => {
            const completedSets = ex.sets.filter((s) => s.is_completed);
            if (completedSets.length === 0) return null;

            return (
              <View key={ex.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exName}>{ex.exerciseDetails.name}</Text>
                  <View style={styles.setCountBadge}>
                    <Text style={styles.setCountBadgeText}>{completedSets.length} sets</Text>
                  </View>
                </View>

                <View style={styles.setGridHeader}>
                  <Text style={[styles.colHeader, { flex: 1 }]}>SET</Text>
                  <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>KG</Text>
                  <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>REPS</Text>
                </View>

                {completedSets.map((set, index) => (
                  <View key={set.id} style={styles.setRow}>
                    <View style={styles.setNumberContainer}>
                      <Text style={styles.setNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.setValue}>{set.weight} kg</Text>
                    <Text style={styles.setValue}>{set.reps} reps</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* 5. RETURN / DONE BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.replace('/(app)/(tabs)/training');
          }}
          style={styles.doneBtn}>
          <MaterialIcons name="check" size={20} color="#000" />
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: T.textPrimary,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: T.textSecondary,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: F.sansMedium,
    color: T.textSecondary,
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  workoutHero: {
    gap: 4,
  },
  workoutName: {
    fontFamily: F.sansBold,
    fontSize: 22,
    color: T.textPrimary,
    letterSpacing: 0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutDate: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: T.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 5,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: F.mono,
    fontSize: 16.5,
    color: T.textPrimary,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: T.textMuted,
  },
  exercisesSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: T.textMuted,
    textTransform: 'uppercase',
  },
  exerciseCountText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
  },
  exerciseCard: {
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exName: {
    color: T.textPrimary,
    fontFamily: F.sansBold,
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  setCountBadge: {
    backgroundColor: T.glassFill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  setCountBadgeText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.textSecondary,
  },
  setGridHeader: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  colHeader: {
    color: T.textMuted,
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  setNumberContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  setNumber: {
    color: T.primary,
    fontFamily: F.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  setValue: {
    flex: 2,
    color: T.textPrimary,
    fontFamily: F.mono,
    fontSize: 13.5,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: 10,
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: T.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneBtnText: {
    color: '#000000',
    fontFamily: F.sansBold,
    fontSize: 15,
  },
});
