import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Vital, TrainingTheme } from '@/constants/vital-theme';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { RunningAPI, RunSession } from '@/services/running-api';

const T = TrainingTheme;
const F = Vital.fonts;

export function RunStatsWidget() {
  const router = useRouter();
  const [weeklyKm, setWeeklyKm] = useState(0);
  const [lastRun, setLastRun] = useState<RunSession | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        try {
          const runs = await RunningAPI.getRuns();
          if (runs.length > 0) {
            setLastRun(runs[0]);
          } else {
            setLastRun(null);
          }
          
          const now = Date.now();
          const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
          const weekRuns = runs.filter(r => r.date >= oneWeekAgo);
          const totalKm = weekRuns.reduce((sum, run) => sum + run.distance_km, 0);
          setWeeklyKm(totalKm);
        } catch (e) {
          console.warn("Failed to load run stats", e);
        }
      };
      loadStats();
    }, [])
  );

  const handleStartRun = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/training/run-hub');
  };

  return (
    <Pressable
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="Open Running Hub"
      onPress={handleStartRun}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="directions-run" size={22} color={T.primary} />
        </View>
        <MaterialIcons name="arrow-forward" size={16} color={T.textMuted} />
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.value}>{weeklyKm.toFixed(1)}</Text>
        <Text style={styles.unit}>KM THIS WEEK</Text>
      </View>
      
      {lastRun ? (
        <View style={styles.footer}>
          <Text style={styles.footerText} numberOfLines={1}>
            Last: {lastRun.distance_km.toFixed(1)} km
          </Text>
        </View>
      ) : (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Tap to run</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.surfaceActiveTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginTop: 'auto',
    marginBottom: 8,
  },
  value: {
    fontFamily: F.mono,
    fontSize: 28,
    color: T.textPrimary,
    lineHeight: 34,
    fontWeight: '700',
  },
  unit: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: T.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.glassFill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  footerText: {
    fontFamily: F.sansMedium,
    fontSize: 11,
    color: T.primary,
  },
});
