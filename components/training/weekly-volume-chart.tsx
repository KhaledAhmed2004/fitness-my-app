import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

// Mock data for weekly workout volume (e.g., number of exercises or total weight lifted)
const weeklyData = [
  { day: 'Mon', value: 4500 },
  { day: 'Tue', value: 6000 },
  { day: 'Wed', value: 2000 },
  { day: 'Thu', value: 8000 },
  { day: 'Fri', value: 0 },
  { day: 'Sat', value: 5000 },
  { day: 'Sun', value: 0 },
];

export function WeeklyVolumeChart() {
  const maxValue = Math.max(...weeklyData.map(d => d.value), 100);
  const totalVolume = weeklyData.reduce((sum, item) => sum + item.value, 0);
  const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  // Shift index so Monday is 0, Sunday is 6
  const normalizedToday = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="fitness-center" size={16} color={C.trainingAccent} />
          </View>
          <Text style={styles.title}>Weekly Volume</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalValue}>{totalVolume.toLocaleString()}</Text>
          <Text style={styles.totalUnit}>kg</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        {weeklyData.map((data, index) => {
          const heightPercent = data.value === 0 ? '4%' : `${Math.max((data.value / maxValue) * 100, 4)}%`;
          const isToday = index === normalizedToday;

          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.barTrack, isToday && styles.todayTrack]}>
                <View 
                  style={[
                    styles.barFill, 
                    { height: heightPercent as any },
                    isToday && { backgroundColor: C.trainingAccent } // Highlight today
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
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: F.sansSemiBold,
    fontSize: 16,
    color: C.onSurface,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalValue: {
    fontFamily: F.mono,
    fontSize: 22,
    color: C.onSurface,
  },
  totalUnit: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginLeft: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100, // Slightly shorter to fit nicely in the layout
  },
  barContainer: {
    alignItems: 'center',
    width: 36,
  },
  barTrack: {
    width: 16,
    height: 75,
    backgroundColor: C.surfaceHigh,
    borderRadius: 8,
    justifyContent: 'flex-end',
    marginBottom: 8,
    overflow: 'hidden',
  },
  todayTrack: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(167, 139, 250, 0.25)', // Faded purple by default
    borderRadius: 8,
  },
  dayLabel: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  todayLabel: {
    color: C.trainingAccent,
    fontFamily: F.sansBold,
  }
});
