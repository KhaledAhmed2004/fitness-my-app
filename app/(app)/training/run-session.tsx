import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Vital } from '@/constants/vital-theme';
import { useRunningStore } from '@/stores/running-store';
import { RunningUseCases } from '@/use-cases/running.use-cases';
import { RunMapView } from '@/components/training/run-map-view';
import { RunRingTimer } from '@/components/training/run-ring-timer';

const C = Vital.colors;
const F = Vital.fonts;

export default function RunSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isInitializing, setIsInitializing] = useState(true);
  const isFinishing = useRef(false);

  const { 
    status, 
    elapsedSeconds, 
    distanceKm, 
    currentPaceMinPerKm, 
    calories, 
    routeCoordinates 
  } = useRunningStore();

  useEffect(() => {
    const initRun = async () => {
      try {
        await RunningUseCases.startRun();
      } catch (e: any) {
        Alert.alert("Permission Error", e.message, [
          { text: "OK", onPress: () => router.back() }
        ]);
      } finally {
        setIsInitializing(false);
      }
    };
    initRun();

    return () => {
      if (!isFinishing.current) {
        RunningUseCases.stopTracking();
      }
    };
  }, []);

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (status === 'active') {
      RunningUseCases.pauseRun();
    } else {
      RunningUseCases.resumeRun();
    }
  };

  const handleStop = async () => {
    isFinishing.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const runId = await RunningUseCases.finishRun();
    if (runId) {
      router.replace(`/training/run-complete?id=${runId}`);
    } else {
      router.back();
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Run?",
      "Are you sure you want to exit? This run will not be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive", 
          onPress: () => {
            RunningUseCases.discardRun();
            router.back();
          } 
        }
      ]
    );
  };

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Pressable style={[styles.backButton, { top: insets.top + 16 }]} onPress={handleDiscard}>
          <MaterialIcons name="close" size={28} color={C.onSurface} />
        </Pressable>
        <View style={styles.loadingContent}>
          <MaterialIcons name="gps-fixed" size={48} color={C.trainingAccent} />
          <Text style={styles.loadingText}>Acquiring GPS Signal...</Text>
          <Text style={styles.loadingSubtext}>Make sure you&apos;re outdoors for best accuracy</Text>
        </View>
      </View>
    );
  }

  const validPace = Number.isFinite(currentPaceMinPerKm) && currentPaceMinPerKm > 0;
  const pM = validPace ? Math.floor(currentPaceMinPerKm) : 0;
  const pS = validPace ? Math.floor((currentPaceMinPerKm - pM) * 60) : 0;
  const paceStr = validPace ? `${pM}'${pS.toString().padStart(2, '0')}"` : "--";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={[styles.backButton, { top: insets.top + 16 }]} onPress={handleDiscard}>
        <MaterialIcons name="close" size={28} color={C.onSurface} />
      </Pressable>
      
      {/* Top Map Section */}
      <View style={styles.mapContainer}>
        <RunMapView coordinates={routeCoordinates} isActive={status === 'active'} />
        {/* Gradient overlay to blend map into dark background could go here */}
      </View>

      {/* Timer Section (Overlays Map partially or sits below it) */}
      <View style={styles.timerWrapper}>
        <RunRingTimer elapsedSeconds={elapsedSeconds} isActive={status === 'active'} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
          <Text style={styles.statLabel}>KILOMETERS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{paceStr}</Text>
          <Text style={styles.statLabel}>PACE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{calories}</Text>
          <Text style={styles.statLabel}>CALORIES</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controlsContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {status === 'paused' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stopButtonWrapper}>
            <Pressable style={styles.stopButton} onLongPress={handleStop} delayLongPress={800}>
              <MaterialIcons name="stop" size={32} color={C.onSurface} />
            </Pressable>
            <Text style={styles.hintTextStop}>Hold to stop</Text>
          </Animated.View>
        )}

        <View style={styles.mainButtonWrapper}>
          <Pressable 
            style={[styles.mainButton, status === 'paused' && styles.resumeButton]} 
            onPress={handlePauseResume}
          >
            <MaterialIcons 
              name={status === 'active' ? "pause" : "play-arrow"} 
              size={40} 
              color={status === 'active' ? C.background : C.onSurface} 
            />
          </Pressable>
          {status === 'active' && (
            <Text style={styles.hintText}>Pause to stop</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: C.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: F.sansBold,
    color: C.onSurface,
    fontSize: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontFamily: F.sansMedium,
    color: C.onSurfaceVariant,
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  timerWrapper: {
    marginTop: -80, // Reduced overlap for smaller screens
    zIndex: 10,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.outlineVariant,
    alignSelf: 'center',
  },
  statValue: {
    fontFamily: F.sansBold,
    fontSize: 34,
    color: C.onSurface,
  },
  statLabel: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 24,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.trainingAccent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.trainingAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resumeButton: {
    backgroundColor: C.surfaceHigh,
    shadowColor: '#000',
  },
  stopButtonWrapper: {
    alignItems: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff4b4b', // Red for stop
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonWrapper: {
    alignItems: 'center',
  },
  hintText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
    position: 'absolute',
    bottom: -24,
  },
  hintTextStop: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
    position: 'absolute',
    bottom: -24,
    width: 80,
    textAlign: 'center',
  }
});
