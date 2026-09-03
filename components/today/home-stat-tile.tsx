import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Vital } from "@/constants/vital-theme";

const F = Vital.fonts;

type FitnessStatusProps = {
  activeCalories?: number; // e.g. 320
  calorieTarget?: number; // e.g. 500
  distanceKm?: number; // e.g. 4.2
  lastUpdated?: string; // e.g. "Updated 10 min ago"
  statusTitle?: string; // e.g. "Workout"
  statusSubtitle?: string; // e.g. "Ready to train"
  heartRate?: number; // e.g. 112
  onStart?: () => void;
  onPause?: () => void;
};

export function HomeStatTile({
  activeCalories = 320,
  calorieTarget = 500,
  distanceKm = 4.2,
  lastUpdated = "Updated 10 min ago",
  statusTitle = "Training",
  statusSubtitle = "Ready to start",
  heartRate = 72,
  onStart,
  onPause,
}: FitnessStatusProps) {
  const percentComplete = Math.min(100, Math.max(0, Math.round((activeCalories / calorieTarget) * 100)));

  return (
    <View style={styles.container}>
      {/* LEFT COLUMN */}
      <View style={styles.leftColumn}>
        {/* TOP TILE: ACTIVE CALORIES STAT */}
        <View style={styles.cardTile}>
          <View style={styles.cardHeader}>
            <View style={styles.iconTitleRow}>
              <MaterialIcons name="local-fire-department" size={16} color="#F97316" />
              <Text style={styles.headerTitle} numberOfLines={1}>
                Active Calories
              </Text>
            </View>
          </View>

          <View style={styles.batteryValueRow}>
            <Text style={styles.batteryBigText}>{activeCalories}</Text>
            <Text style={styles.batteryMaxText}>/ {calorieTarget}</Text>
          </View>

          {/* PROGRESS BAR */}
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${percentComplete}%`, backgroundColor: '#F97316' }]}
            />
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.percentText}>0</Text>
            <Text style={styles.percentText}>{calorieTarget} kcal</Text>
          </View>
        </View>

        {/* BOTTOM TILE: RUNNING DISTANCE CARD */}
        <View style={[styles.cardTile, styles.flexCard]}>
          <View style={styles.rangeHeader}>
            <Text style={styles.rangeTitle}>Distance</Text>
            <View style={styles.rangeValRow}>
              <Text style={styles.rangeBigText}>{distanceKm}</Text>
              <Text style={styles.rangeUnitText}>km</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerUpdatedRow}>
              <MaterialIcons name="refresh" size={12} color="#94A3B8" />
              <Text style={styles.footerText} numberOfLines={1}>
                {lastUpdated}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* RIGHT COLUMN: MAIN FITNESS SHOWCASE & CONTROLS */}
      <View style={[styles.cardTile, styles.rightColumn]}>
        <View>
          {/* STATUS TITLE */}
          <Text style={styles.modelNameText}>{statusTitle}</Text>
          <Text style={styles.subModelText}>{statusSubtitle}</Text>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="Start Workout"
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <MaterialIcons name="play-arrow" size={24} color="#F1F5F9" />
            <Text style={styles.actionLabel}>Start</Text>
          </Pressable>

          <Pressable
            onPress={onPause}
            accessibilityRole="button"
            accessibilityLabel="Pause Workout"
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <MaterialIcons name="pause" size={24} color="#F1F5F9" />
            <Text style={styles.actionLabel}>Pause</Text>
          </Pressable>
        </View>

        {/* HEART RATE MONITOR */}
        <View style={styles.tempBox}>
          <View style={[styles.tempControlsRow, { justifyContent: 'center', gap: 8 }]}>
            <MaterialIcons name="favorite" size={24} color="#EF4444" />
            <Text style={styles.tempDegreeText}>{heartRate}</Text>
            <Text style={[styles.tempSubtitle, { marginTop: 0 }]}>BPM</Text>
          </View>
          <Text style={[styles.tempSubtitle, { marginTop: 4 }]}>Current Heart Rate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginVertical: 12,
  },
  leftColumn: {
    flex: 1,
    gap: 12,
  },
  rightColumn: {
    flex: 1.15,
    padding: 16,
    justifyContent: "space-between",
  },
  cardTile: {
    backgroundColor: "#16181D",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  flexCard: {
    flex: 1,
    justifyContent: "space-between",
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  // Active Charging Card Styles
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  headerTitle: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: "#E2E8F0",
    flexShrink: 1,
  },
  headerBadge: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: "#94A3B8",
  },
  batteryValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: 10,
  },
  batteryBigText: {
    fontFamily: F.sansExtraBold,
    fontSize: 40,
    color: "#FFFFFF",
    lineHeight: 44,
  },
  batteryMaxText: {
    fontFamily: F.sansRegular,
    fontSize: 14,
    color: "#64748B",
    marginLeft: 4,
  },
  progressTrack: {
    height: 5,
    width: "100%",
    backgroundColor: "#262932",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  percentText: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: "#64748B",
  },

  // Range Card Styles
  rangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 4,
  },
  rangeTitle: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 15,
  },
  rangeValRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  rangeBigText: {
    fontFamily: F.sansExtraBold,
    fontSize: 26,
    color: "#FFFFFF",
  },
  rangeUnitText: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  footerUpdatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  footerText: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: "#64748B",
  },

  // Right Column Car Card Styles
  modelNameText: {
    fontFamily: F.sansExtraBold,
    fontSize: 34,
    color: "#FFFFFF",
    lineHeight: 36,
  },
  subModelText: {
    fontFamily: F.sansRegular,
    fontSize: 16,
    color: "#94A3B8",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    height: 68,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  actionLabel: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: "#CBD5E1",
  },
  tempBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  tempControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  tempBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tempBtnSymbol: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  tempDegreeText: {
    fontFamily: F.sansExtraBold,
    fontSize: 22,
    color: "#FFFFFF",
  },
  tempSubtitle: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  swipeBar: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  swipeBarPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeText: {
    flex: 1,
    textAlign: "center",
    fontFamily: F.sansBold,
    fontSize: 11,
    color: "#334155",
    letterSpacing: 0.5,
  },
});
