import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { RunningAPI } from '@/services/running-api';

const T = TrainingTheme;
const F = Vital.fonts;

export function CaloriesBurntChart() {
  const [weeklyData, setWeeklyData] = useState<{ day: string; calories: number }[]>([]);
  const [totalKcal, setTotalKcal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const data = await RunningAPI.getWeeklyCalories();
          setWeeklyData(data);
          const total = data.reduce((sum, item) => sum + item.calories, 0);
          setTotalKcal(total);
        } catch (e) {
          console.error("Failed to load calories", e);
        }
      };
      loadData();
    }, [])
  );

  const maxValue = Math.max(...weeklyData.map(d => d.calories), 500); // 500 as minimum max for scaling
  const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  // Shift index so Monday is 0, Sunday is 6
  const normalizedToday = todayIndex === 0 ? 6 : todayIndex - 1;

  // Use a fallback empty array if data isn't loaded yet to avoid layout shifts
  const chartData = weeklyData.length > 0 
    ? weeklyData 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, calories: 0 }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="local-fire-department" size={20} color={T.metricOrange} />
          </View>
          <View>
            <Text style={styles.title}>CALORIES BURNED</Text>
            <Text style={styles.subtitle}>7-Day Energy Expenditure</Text>
          </View>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalValue}>{Math.round(totalKcal).toLocaleString()}</Text>
          <Text style={styles.totalUnit}>kcal</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {chartData.map((data, index) => {
          const heightPercent = data.calories === 0 ? '6%' : `${Math.max((data.calories / maxValue) * 100, 6)}%`; 
          const isToday = index === normalizedToday;

          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.barTrack, isToday && styles.todayTrack]}>
                <View 
                  style={[
                    styles.barFill, 
                    { height: heightPercent as any },
                    isToday && styles.todayBarFill
                  ]} 
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{data.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: T.textMuted,
  },
  subtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    marginTop: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalValue: {
    fontFamily: F.mono,
    fontSize: 24,
    color: T.metricOrange,
    fontWeight: '700',
  },
  totalUnit: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textMuted,
    marginLeft: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 72,
    backgroundColor: T.glassFill,
    borderRadius: 7,
    justifyContent: 'flex-end',
    marginBottom: 8,
    overflow: 'hidden',
  },
  todayTrack: {
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 7,
  },
  todayBarFill: {
    backgroundColor: T.metricOrange,
  },
  dayLabel: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textMuted,
  },
  todayLabel: {
    color: T.metricOrange,
    fontFamily: F.mono,
    fontWeight: '700',
  },
});
