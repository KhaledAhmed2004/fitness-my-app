import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { RunningAPI, RunSession } from '@/services/running-api';
import { RunHistoryCard } from '@/components/training/run-history-card';
import { AppScreen } from '@/components/ui/app-screen';

const C = Vital.colors;
const F = Vital.fonts;

const { width } = Dimensions.get('window');

export default function RunHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [runs, setRuns] = useState<RunSession[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          const runData = await RunningAPI.getRuns();
          const sortedRuns = runData.sort((a, b) => b.date - a.date);
          setRuns(sortedRuns.slice(0, 5)); // Show only recent 5
          
          const dist = runData.reduce((acc, run) => acc + run.distance_km, 0);
          setTotalDistance(dist);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      
      loadHistory();
    }, [])
  );

  const handleStartRun = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/training/run-session');
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.sectionTitle}>Recent Runs</Text>
      <Pressable onPress={() => router.push('/training/history')} hitSlop={15} style={styles.viewAllBtn}>
        <Text style={styles.viewAllText}>View All</Text>
        <MaterialIcons name="chevron-right" size={16} color="#00D1FF" />
      </Pressable>
    </View>
  );

  return (
    <AppScreen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={C.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Running Hub</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      {/* Premium Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroSubtitle}>GPS tracking, pace, and route mapped automatically.</Text>
        <View style={styles.pulseRingOuter}>
          <View style={styles.pulseRingInner}>
            <Pressable 
              style={({ pressed }) => [
                styles.startBtnCircle,
                pressed && { transform: [{ scale: 0.95 }] }
              ]} 
              onPress={handleStartRun}
            >
              <FontAwesome5 name="running" size={36} style={styles.runningIcon} />
              <Text style={styles.startBtnText}>START</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Mini Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconBg}>
            <MaterialIcons name="map" size={20} color="#00D1FF" />
          </View>
          <View>
            {loading ? (
              <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 60 }]} />
            ) : (
              <Text style={styles.statValue}>{totalDistance.toFixed(1)} <Text style={styles.statUnit}>km</Text></Text>
            )}
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconBg}>
            <MaterialIcons name="format-list-numbered" size={20} color="#00D1FF" />
          </View>
          <View>
            {loading ? (
              <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 40 }]} />
            ) : (
              <Text style={styles.statValue}>{runs.length} <Text style={styles.statUnit}>runs</Text></Text>
            )}
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Animated.View style={[styles.skeletonText, { opacity: fadeAnim, width: 120, height: 24 }]} />
          </View>
          {[1, 2, 3].map((i) => (
            <Animated.View key={i} style={[styles.skeletonCard, { opacity: fadeAnim }]} />
          ))}
        </View>
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RunHistoryCard run={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={runs.length > 0 ? renderHeader : null}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="explore" size={48} color={C.trainingAccent} />
              </View>
              <Text style={styles.emptyTitle}>The road is waiting</Text>
              <Text style={styles.emptySubtitle}>You haven&apos;t logged any runs yet. Tap the large START button to begin your journey.</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: C.onSurface,
    textAlign: 'center',
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: C.background, // Match the main background for a seamless look
  },
  pulseRingOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 209, 255, 0.05)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRingInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(0, 209, 255, 0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#00D1FF', // Neon Cyan
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 15,
  },
  runningIcon: {
    marginLeft: 12, // The running man's head is far left, so we need a significant left margin to visually center it
    marginBottom: 6,
    color: '#FFFFFF',
  },
  startBtnText: {
    fontFamily: F.sansExtraBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginLeft: 2,
  },
  heroSubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 24,
    paddingHorizontal: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: C.background,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.1)',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 209, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: C.onSurface,
  },
  statUnit: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    fontFamily: F.sansMedium,
  },
  statLabel: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: F.sansBold,
    fontSize: 18,
    color: C.onSurface,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: F.sansSemiBold,
    fontSize: 14,
    color: '#00D1FF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  skeletonText: {
    height: 20,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonCard: {
    height: 80,
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: C.surfaceContainer,
    borderRadius: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.sansBold,
    fontSize: 20,
    color: C.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  }
});

