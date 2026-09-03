import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useFocusStore } from '@/stores/focus-store';

const C = Vital.colors;
const F = Vital.fonts;

interface FocusSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const FOCUS_PRESETS = [25, 45, 60, 90];
const SHORT_BREAK_PRESETS = [3, 5, 10];
const LONG_BREAK_PRESETS = [15, 20, 30];
const ROUNDS_PRESETS = [2, 3, 4, 6];

export function FocusSettingsModal({ visible, onClose }: FocusSettingsModalProps) {
  const { settings, updateSettings } = useFocusStore();

  const [focusDuration, setFocusDuration] = useState(settings.focusDuration);
  const [shortBreakDuration, setShortBreakDuration] = useState(settings.shortBreakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(settings.longBreakDuration);
  const [roundsBeforeLongBreak, setRoundsBeforeLongBreak] = useState(
    settings.roundsBeforeLongBreak
  );

  const handleSave = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await updateSettings({
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      roundsBeforeLongBreak,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdrop}
        />

        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconSquircle}>
                <MaterialIcons name="tune" size={18} color="#FCC419" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Focus & Break Engine</Text>
                <Text style={styles.sheetSubtitle}>Customize Pomodoro intervals & rounds</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}>
              <MaterialIcons name="close" size={18} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}>
            {/* 1. FOCUS SESSION DURATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎯 FOCUS INTERVAL</Text>
                <Text style={styles.sectionValue}>{focusDuration} min</Text>
              </View>

              <View style={styles.presetsRow}>
                {FOCUS_PRESETS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setFocusDuration(val);
                    }}
                    style={[
                      styles.presetChip,
                      focusDuration === val && styles.presetChipActiveFocus,
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
                        focusDuration === val && styles.presetChipTextActive,
                      ]}>
                      {val}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. SHORT BREAK DURATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🌱 SHORT BREAK</Text>
                <Text style={[styles.sectionValue, { color: '#20C997' }]}>
                  {shortBreakDuration} min
                </Text>
              </View>

              <View style={styles.presetsRow}>
                {SHORT_BREAK_PRESETS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setShortBreakDuration(val);
                    }}
                    style={[
                      styles.presetChip,
                      shortBreakDuration === val && styles.presetChipActiveShort,
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
                        shortBreakDuration === val && styles.presetChipTextActive,
                      ]}>
                      {val}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. LONG BREAK DURATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🌊 LONG BREAK</Text>
                <Text style={[styles.sectionValue, { color: '#89CEFF' }]}>
                  {longBreakDuration} min
                </Text>
              </View>

              <View style={styles.presetsRow}>
                {LONG_BREAK_PRESETS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setLongBreakDuration(val);
                    }}
                    style={[
                      styles.presetChip,
                      longBreakDuration === val && styles.presetChipActiveLong,
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
                        longBreakDuration === val && styles.presetChipTextActive,
                      ]}>
                      {val}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. ROUNDS BEFORE LONG BREAK */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔄 LONG BREAK INTERVAL</Text>
                <Text style={styles.sectionValue}>Every {roundsBeforeLongBreak} rounds</Text>
              </View>

              <View style={styles.presetsRow}>
                {ROUNDS_PRESETS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setRoundsBeforeLongBreak(val);
                    }}
                    style={[
                      styles.presetChip,
                      roundsBeforeLongBreak === val && styles.presetChipActiveRounds,
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
                        roundsBeforeLongBreak === val && styles.presetChipTextActive,
                      ]}>
                      {val} Rounds
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* SAVE BUTTON */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save & Apply Setup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: '#141A1D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(252, 196, 25, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sheetSubtitle: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: C.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  sectionValue: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#FCC419',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  presetChipActiveFocus: {
    backgroundColor: '#FCC419',
    borderColor: '#FCC419',
  },
  presetChipActiveShort: {
    backgroundColor: '#20C997',
    borderColor: '#20C997',
  },
  presetChipActiveLong: {
    backgroundColor: '#89CEFF',
    borderColor: '#89CEFF',
  },
  presetChipActiveRounds: {
    backgroundColor: '#C8F135',
    borderColor: '#C8F135',
  },
  presetChipText: {
    fontFamily: F.sansBold,
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  presetChipTextActive: {
    color: '#101416',
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  saveBtn: {
    backgroundColor: '#FCC419',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FCC419',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#101416',
    fontWeight: '800',
  },
});
