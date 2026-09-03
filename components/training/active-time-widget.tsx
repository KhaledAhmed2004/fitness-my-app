import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { RunningAPI } from '@/services/running-api';

const T = TrainingTheme;
const F = Vital.fonts;

export function ActiveTimeWidget() {
  const [totalSeconds, setTotalSeconds] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const data = await RunningAPI.getWeeklyActiveTime();
          const total = data.reduce((sum, item) => sum + item.duration_sec, 0);
          setTotalSeconds(total);
        } catch (e) {
          console.error("Failed to load active time", e);
        }
      };
      loadData();
    }, [])
  );

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let displayValue = '';

  if (hours > 0) {
    displayValue = `${hours}h ${minutes}m`;
  } else {
    displayValue = `${minutes}m`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="timer" size={22} color={T.secondary} />
        </View>
        <MaterialIcons name="trending-up" size={16} color={T.textMuted} />
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.value}>{displayValue}</Text>
        <Text style={styles.unit}>ACTIVE TIME</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>⚡ Keep streak</Text>
      </View>
    </View>
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
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
    color: T.secondary,
  },
});
