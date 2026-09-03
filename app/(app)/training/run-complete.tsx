import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Vital } from '@/constants/vital-theme';
import { RunningAPI, RunSession } from '@/services/running-api';
import { RunMapView } from '@/components/training/run-map-view';
import * as Haptics from 'expo-haptics';

const C = Vital.colors;
const F = Vital.fonts;

export default function RunCompleteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [run, setRun] = useState<RunSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string') {
      RunningAPI.getRunById(id).then(r => {
        setRun(r);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/training');
  };

  const handleDiscard = async () => {
    if (id && typeof id === 'string') {
      await RunningAPI.deleteRun(id);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/training');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading run details...</Text>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorTitle}>Run Not Found</Text>
        <Text style={styles.errorSubtitle}>We couldn&apos;t find the details for this run.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/training')}>
          <Text style={styles.backBtnText}>Go to Training</Text>
        </Pressable>
      </View>
    );
  }  const m = Math.floor(run.duration_sec / 60);
  const s = run.duration_sec % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
  
  const pM = Math.floor(run.pace_min_per_km);
  const pS = Math.floor((run.pace_min_per_km - pM) * 60);
  const paceStr = run.pace_min_per_km > 0 ? `${pM}'${pS.toString().padStart(2, '0')}"` : "--";

  let coords = [];
  try {
    coords = JSON.parse(run.route_json);
  } catch (e) {}

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="check" size={40} color={C.trainingAccent} />
          </View>
          <Text style={styles.title}>Run Completed</Text>
          <Text style={styles.subtitle}>Great job getting out there.</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{run.distance_km.toFixed(2)}</Text>
            <Text style={styles.mainStatLabel}>KILOMETERS</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>TIME</Text>
              <Text style={styles.gridValue}>{timeStr}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>PACE</Text>
              <Text style={styles.gridValue}>{paceStr}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>CALORIES</Text>
              <Text style={styles.gridValue}>{run.calories}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>STEPS</Text>
              <Text style={styles.gridValue}>{run.steps}</Text>
            </View>
          </View>
        </View>

        {coords.length > 0 ? (
          <View style={styles.mapWrapper}>
            <RunMapView coordinates={coords} isActive={false} />
          </View>
        ) : (
          <View style={styles.noMapWrapper}>
            <MaterialIcons name="location-off" size={32} color={C.outlineVariant} />
            <Text style={styles.noMapText}>No GPS data recorded</Text>
          </View>
        )}

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24 }]}>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Run</Text>
        </Pressable>
        <Pressable style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardBtnText}>Discard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  errorTitle: {
    fontFamily: F.sansBold,
    fontSize: 24,
    color: C.onSurface,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 14,
    color: C.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: F.sansBold,
    fontSize: 28,
    color: C.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: F.sansMedium,
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  statsCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainStatValue: {
    fontFamily: F.mono,
    fontSize: 64,
    color: C.trainingAccent,
    lineHeight: 72,
  },
  mainStatLabel: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: C.onSurfaceVariant,
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  gridItem: {
    width: '45%',
  },
  gridLabel: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: C.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 4,
  },
  gridValue: {
    fontFamily: F.sansBold,
    fontSize: 24,
    color: C.onSurface,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
  },
  noMapWrapper: {
    height: 160,
    borderRadius: 24,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderStyle: 'dashed',
  },
  noMapText: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.surfaceContainer,
  },
  saveBtn: {
    backgroundColor: C.trainingAccent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: C.background,
  },
  discardBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  discardBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 16,
    color: '#ff4b4b',
  }
});
