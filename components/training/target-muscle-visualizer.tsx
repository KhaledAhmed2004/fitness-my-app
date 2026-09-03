import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Body, { ExtendedBodyPart, Slug } from "react-native-body-highlighter";

import { Vital, TrainingTheme } from "@/constants/vital-theme";

const T = TrainingTheme;
const F = Vital.fonts;

export type MuscleSide = "FRONT" | "BACK";

export interface MuscleItem {
  id: string;
  name: string;
}

export const FRONT_MUSCLES: MuscleItem[] = [
  { id: "shoulder", name: "Shoulder" },
  { id: "triceps", name: "Triceps" },
  { id: "biceps", name: "Biceps" },
  { id: "chest", name: "Chest" },
  { id: "neck", name: "Neck" },
  { id: "legs", name: "Legs" },
  { id: "abs", name: "Abs" },
];

export const BACK_MUSCLES: MuscleItem[] = [
  { id: "neck", name: "Traps & Neck" },
  { id: "back", name: "Back & Lats" },
  { id: "shoulder", name: "Rear Delts" },
  { id: "triceps", name: "Triceps" },
  { id: "glutes", name: "Glutes" },
  { id: "legs", name: "Hamstrings" },
  { id: "calves", name: "Calves" },
];

interface TargetMuscleVisualizerProps {
  activeSide: MuscleSide;
  selectedMuscles: string[];
  contextBadge?: string;
  onSideChange: (side: MuscleSide) => void;
  onToggleMuscle: (id: string) => void;
}

export function TargetMuscleVisualizer({
  activeSide,
  selectedMuscles,
  contextBadge,
  onSideChange,
  onToggleMuscle,
}: TargetMuscleVisualizerProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Responsive breakpoints & dynamic tokens
  const isSmall = windowWidth < 375;
  const isLarge = windowWidth > 420;

  const bodyScale = useMemo(() => {
    if (windowWidth < 360) return 0.78;
    if (windowWidth < 380) return 0.84;
    if (windowWidth < 415) return 0.91;
    return 0.98;
  }, [windowWidth]);

  const containerPadding = isSmall ? 14 : isLarge ? 20 : 16;
  const columnGap = isSmall ? 8 : 12;
  const pillVerticalPadding = isSmall ? 7 : isLarge ? 10 : 8.5;
  const pillFontSize = isSmall ? 12 : isLarge ? 13.5 : 13;
  const checkSize = isSmall ? 18 : 20;
  const checkIconSize = isSmall ? 12 : 14;

  const currentList = activeSide === "FRONT" ? FRONT_MUSCLES : BACK_MUSCLES;

  const isSelected = (id: string) => selectedMuscles.includes(id);

  const handleMusclePress = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleMuscle(id);
  };

  // Convert selected muscle IDs to comprehensive react-native-body-highlighter data
  const bodyData: ExtendedBodyPart[] = useMemo(() => {
    const data: ExtendedBodyPart[] = [
      // Base non-muscle anatomical elements (Head, Hair, Hands, Feet) in dark graphite
      {
        slug: "head",
        color: T.anatomyBase,
        styles: { fill: T.anatomyBase, stroke: T.anatomyStroke, strokeWidth: 1 },
      },
      {
        slug: "hair",
        color: "#12161A",
        styles: { fill: "#12161A", stroke: "#222A33", strokeWidth: 1 },
      },
      {
        slug: "hands",
        color: T.anatomyBase,
        styles: { fill: T.anatomyBase, stroke: T.anatomyStroke, strokeWidth: 1 },
      },
      {
        slug: "feet",
        color: T.anatomyBase,
        styles: { fill: T.anatomyBase, stroke: T.anatomyStroke, strokeWidth: 1 },
      },
      {
        slug: "ankles",
        color: T.anatomyBase,
        styles: { fill: T.anatomyBase, stroke: T.anatomyStroke, strokeWidth: 1 },
      },
      {
        slug: "knees",
        color: T.anatomyBase,
        styles: { fill: T.anatomyBase, stroke: T.anatomyStroke, strokeWidth: 1 },
      },
    ];

    const activeColor = T.anatomyActive;
    const inactiveColor = T.anatomyInactive;
    const strokeColor = T.anatomyStroke;

    const registerMuscle = (slug: Slug, selected: boolean) => {
      data.push({
        slug,
        color: selected ? activeColor : inactiveColor,
        intensity: selected ? 2 : 1,
        styles: {
          fill: selected ? activeColor : inactiveColor,
          stroke: selected ? activeColor : strokeColor,
          strokeWidth: selected ? 1.4 : 1,
        },
      });
    };

    // Deltoids
    registerMuscle("deltoids", isSelected("shoulder"));

    // Chest
    registerMuscle("chest", isSelected("chest"));

    // Biceps
    registerMuscle("biceps", isSelected("biceps"));

    // Triceps
    registerMuscle("triceps", isSelected("triceps"));

    // Neck & Trapezius
    const isNeckSelected = isSelected("neck");
    registerMuscle("neck", isNeckSelected);
    registerMuscle("trapezius", isNeckSelected || isSelected("back"));

    // Abs & Obliques
    const isAbsSelected = isSelected("abs");
    registerMuscle("abs", isAbsSelected);
    registerMuscle("obliques", isAbsSelected);

    // Legs (Quads, Hamstrings, Adductors, Calves, Tibialis)
    const isLegsSelected = isSelected("legs");
    const isCalvesSelected = isSelected("calves") || isLegsSelected;
    registerMuscle("quadriceps", isLegsSelected);
    registerMuscle("hamstring", isLegsSelected);
    registerMuscle("adductors", isLegsSelected);
    registerMuscle("calves", isCalvesSelected);
    registerMuscle("tibialis", isCalvesSelected);

    // Back & Glutes
    const isBackSelected = isSelected("back");
    registerMuscle("upper-back", isBackSelected);
    registerMuscle("lower-back", isBackSelected);
    registerMuscle("gluteal", isSelected("glutes"));

    return data;
  }, [selectedMuscles, activeSide]);

  const handleBodyPartPress = (slug?: Slug) => {
    if (!slug) return;
    let targetId = "";

    switch (slug) {
      case "deltoids":
        targetId = "shoulder";
        break;
      case "chest":
        targetId = "chest";
        break;
      case "biceps":
        targetId = "biceps";
        break;
      case "triceps":
        targetId = "triceps";
        break;
      case "neck":
      case "trapezius":
        targetId =
          activeSide === "BACK"
            ? selectedMuscles.includes("neck")
              ? "neck"
              : "back"
            : "neck";
        break;
      case "abs":
      case "obliques":
        targetId = "abs";
        break;
      case "quadriceps":
      case "hamstring":
      case "adductors":
        targetId = "legs";
        break;
      case "upper-back":
      case "lower-back":
        targetId = "back";
        break;
      case "gluteal":
        targetId = "glutes";
        break;
      case "calves":
      case "tibialis":
        targetId = activeSide === "BACK" ? "calves" : "legs";
        break;
      default:
        break;
    }

    if (targetId) {
      handleMusclePress(targetId);
    }
  };

  return (
    <View style={[styles.container, { padding: containerPadding }]}>
      {/* 1. TOP STATS BAR (DAYS SINCE LAST WORKOUT & FRESH MUSCLE GROUPS) */}
      <View style={styles.statsBar}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>DAYS SINCE YOUR</Text>
          <Text style={styles.statValue}>LAST WORKOUT</Text>
        </View>

        <View style={[styles.statCol, { alignItems: "flex-end" }]}>
          <Text style={styles.statLabel}>FRESH MUSCLE</Text>
          <Text style={[styles.statValue, { color: T.primary }]}>GROUPS</Text>
        </View>
      </View>

      {/* 2. SECTION HEADER + SIDE TOGGLE */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.title, isSmall && { fontSize: 15 }]}>
            Target Muscle
          </Text>
          <Text style={styles.subtitle}>Select target muscle group</Text>
        </View>

        {/* SIDE TOGGLE PILLS */}
        <View style={styles.sideToggle}>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Switch to Front view"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onSideChange("FRONT");
            }}
            style={[
              styles.sideBtn,
              activeSide === "FRONT" && styles.sideBtnActive,
            ]}
          >
            <Text
              style={[
                styles.sideBtnText,
                activeSide === "FRONT" && styles.sideBtnTextActive,
              ]}
            >
              Front side
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Switch to Back view"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onSideChange("BACK");
            }}
            style={[
              styles.sideBtn,
              activeSide === "BACK" && styles.sideBtnActive,
            ]}
          >
            <Text
              style={[
                styles.sideBtnText,
                activeSide === "BACK" && styles.sideBtnTextActive,
              ]}
            >
              Back side
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. MAIN 2-COLUMN RESPONSIVE DISPLAY (BODY ON LEFT, PILLS ON RIGHT) */}
      <View style={[styles.mainRow, { gap: columnGap }]}>
        {/* LEFT COLUMN: PRO BODY HIGHLIGHTER */}
        <View style={styles.bodyColumn}>
          <Body
            data={bodyData}
            side={activeSide === "FRONT" ? "front" : "back"}
            gender="male"
            scale={bodyScale}
            colors={[T.anatomyInactive, T.anatomyActive]}
            defaultFill={T.anatomyInactive}
            defaultStroke={T.anatomyStroke}
            defaultStrokeWidth={1}
            border="none"
            onBodyPartPress={(b) => handleBodyPartPress(b.slug)}
          />
        </View>

        {/* RIGHT COLUMN: VERTICAL PILLS LIST */}
        <View style={styles.pillsColumn}>
          {currentList.map((item) => {
            const active = isSelected(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`Select ${item.name}`}
                onPress={() => handleMusclePress(item.id)}
                style={[
                  styles.pillButton,
                  { paddingVertical: pillVerticalPadding },
                  active && styles.pillButtonActive,
                ]}
              >
                <View
                  style={[
                    styles.checkCircle,
                    {
                      width: checkSize,
                      height: checkSize,
                      borderRadius: checkSize / 2,
                    },
                    active && styles.checkCircleActive,
                  ]}
                >
                  {active ? (
                    <MaterialIcons
                      name="check"
                      size={checkIconSize}
                      color={T.onPrimary}
                    />
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.pillText,
                    { fontSize: pillFontSize },
                    active && styles.pillTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    gap: 14,
    overflow: "hidden",
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  statCol: {
    gap: 3,
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: T.textMuted,
  },
  statValue: {
    fontFamily: F.mono,
    fontSize: 12,
    fontWeight: "700",
    color: T.textPrimary,
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontFamily: F.sansBold,
    fontSize: 17,
    color: T.textPrimary,
  },
  subtitle: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    marginTop: 2,
  },
  sideToggle: {
    flexDirection: "row",
    backgroundColor: T.glassFill,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: T.border,
  },
  sideBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtnActive: {
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.border,
  },
  sideBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 12,
    color: T.textMuted,
  },
  sideBtnTextActive: {
    color: T.textPrimary,
    fontFamily: F.sansBold,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyColumn: {
    flex: 0.95,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  pillsColumn: {
    flex: 1.15,
    gap: 7,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.glassFill,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
    minHeight: 36,
  },
  pillButtonActive: {
    backgroundColor: T.surfaceActiveTint,
    borderColor: T.borderFocus,
  },
  checkCircle: {
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkCircleActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  pillText: {
    fontFamily: F.sansMedium,
    color: T.textSecondary,
  },
  pillTextActive: {
    color: T.primary,
    fontFamily: F.sansBold,
  },
});
