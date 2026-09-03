import React, { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';

const C = Vital.colors;
const F = Vital.fonts;

const ACTIVITY_LEVELS = [
  {
    id: 'SEDENTARY',
    label: 'Sedentary',
    desc: 'Desk job, minimal exercise',
    icon: 'weekend',
    color: '#89CEFF',
  },
  {
    id: 'LIGHT',
    label: 'Lightly Active',
    desc: '1–3 light walks or workouts/week',
    icon: 'directions-walk',
    color: '#38BDF8',
  },
  {
    id: 'MODERATE',
    label: 'Moderately Active',
    desc: '3–5 gym, run or sports sessions/week',
    icon: 'fitness-center',
    color: '#20C997',
  },
  {
    id: 'VERY_ACTIVE',
    label: 'Very Active / Athlete',
    desc: '6–7 daily high-intensity training sessions',
    icon: 'bolt',
    color: '#FCC419',
  },
] as const;

const GOAL_OPTIONS = [
  { id: 'fat_loss', label: 'Fat Loss & Ketosis', icon: 'local-fire-department', color: '#FF6B6B' },
  { id: 'muscle', label: 'Lean Muscle Mass', icon: 'fitness-center', color: '#38BDF8' },
  { id: 'endurance', label: 'Cardio Endurance', icon: 'directions-run', color: '#51CF66' },
  { id: 'focus', label: 'Deep Focus & Brain Health', icon: 'psychology', color: '#A78BFA' },
  { id: 'longevity', label: 'Metabolic Longevity', icon: 'favorite', color: '#20C997' },
  { id: 'meds', label: 'Medication Discipline', icon: 'medication', color: '#FCC419' },
];

function initials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();

  // Form State
  const [name, setName] = useState(user?.name ?? 'Khaled Nayeem');
  const [email] = useState(user?.email ?? 'khaled@demo.com');
  const [phone, setPhone] = useState(user?.phone ?? '+880 1712-345678');
  const [bio, setBio] = useState(
    user?.bio ??
      'Optimizing daily metabolic health, intermittent fasting (16:8), and 10k running endurance.'
  );
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>(user?.gender ?? 'MALE');
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user?.heightCm) : '178');
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user?.weightKg) : '74.5');
  const [targetWeightKg, setTargetWeightKg] = useState(
    user?.targetWeightKg ? String(user?.targetWeightKg) : '70.0'
  );
  const [activityLevel, setActivityLevel] = useState<
    'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE'
  >(user?.activityLevel ?? 'MODERATE');

  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    user?.goals ?? ['fat_loss', 'endurance', 'longevity']
  );

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleGoal = (goalId: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);

    try {
      await updateUser({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        gender,
        heightCm: parseFloat(heightCm) || undefined,
        weightKg: parseFloat(weightKg) || undefined,
        targetWeightKg: parseFloat(targetWeightKg) || undefined,
        activityLevel,
        goals: selectedGoals,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      triggerToast('Profile updated successfully!');
      setTimeout(() => {
        router.back();
      }, 700);
    } catch {
      Alert.alert('Error', 'Unable to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Difference calculation
  const currentWeightNum = parseFloat(weightKg) || 0;
  const targetWeightNum = parseFloat(targetWeightKg) || 0;
  const weightDiff = targetWeightNum - currentWeightNum;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* APP BAR */}
      <View style={styles.appBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={C.onSurface} />
        </Pressable>

        <Text style={styles.appBarTitle}>Edit Profile</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* TOAST FEEDBACK */}
          {toastMessage ? (
            <View style={styles.toastCard}>
              <MaterialIcons name="check-circle" size={18} color="#89FE00" />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          ) : null}

          {/* AVATAR HERO CARD */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials(name)}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                  Alert.alert('Avatar Photo', 'Camera and gallery photo uploads will be unlocked in next update.');
                }}
                style={styles.cameraBadge}>
                <MaterialIcons name="photo-camera" size={16} color="#002538" />
              </TouchableOpacity>
            </View>

            <Text style={styles.avatarName}>{name || 'Your Name'}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <MaterialIcons name="stars" size={12} color="#89CEFF" />
                <Text style={styles.badgePillText}>PRO MEMBER</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                <MaterialIcons name="verified" size={12} color="#20C997" />
                <Text style={[styles.badgePillText, { color: '#20C997' }]}>VERIFIED</Text>
              </View>
            </View>
          </View>

          {/* PERSONAL IDENTITY & CONTACT */}
          <Text style={styles.sectionHeader}>PERSONAL IDENTITY</Text>
          <View style={styles.cardGroup}>
            {/* FULL NAME */}
            <View style={[styles.inputRow, styles.inputRowBorder]}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={C.outline}
                style={styles.textInput}
              />
            </View>

            {/* EMAIL ADDRESS (READ ONLY) */}
            <View style={[styles.inputRow, styles.inputRowBorder]}>
              <View style={styles.labelWithBadge}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={styles.verifiedTag}>
                  <MaterialIcons name="check" size={10} color="#20C997" />
                  <Text style={styles.verifiedTagText}>VERIFIED</Text>
                </View>
              </View>
              <TextInput
                value={email}
                editable={false}
                style={[styles.textInput, { color: C.onSurfaceVariant }]}
              />
            </View>

            {/* PHONE NUMBER */}
            <View style={[styles.inputRow, styles.inputRowBorder]}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+880 1712-000000"
                placeholderTextColor={C.outline}
                style={styles.textInput}
              />
            </View>

            {/* BIO */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>BIO / DAILY HEALTH MANTRA</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                placeholder="Tell us about your fitness mission or daily routine..."
                placeholderTextColor={C.outline}
                style={[styles.textInput, styles.textArea]}
              />
            </View>
          </View>

          {/* BIOMETRICS & METABOLIC BODY METRICS */}
          <Text style={styles.sectionHeader}>BIOMETRICS & PHYSICAL HEALTH</Text>
          <View style={styles.cardGroup}>
            {/* GENDER SELECTOR */}
            <View style={[styles.inputRow, styles.inputRowBorder]}>
              <Text style={styles.inputLabel}>BIOLOGICAL SEX (FOR BMR / CALORIE FORMULAS)</Text>
              <View style={styles.genderRow}>
                {[
                  { id: 'MALE', label: 'Male', icon: 'male' },
                  { id: 'FEMALE', label: 'Female', icon: 'female' },
                  { id: 'OTHER', label: 'Other', icon: 'transgender' },
                ].map((item) => {
                  const isSelected = gender === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (Platform.OS === 'ios' || Platform.OS === 'android') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        }
                        setGender(item.id as any);
                      }}
                      style={[
                        styles.genderBtn,
                        isSelected && styles.genderBtnActive,
                      ]}>
                      <MaterialIcons
                        name={item.icon as any}
                        size={16}
                        color={isSelected ? '#002538' : '#89CEFF'}
                      />
                      <Text
                        style={[
                          styles.genderBtnText,
                          isSelected && styles.genderBtnTextActive,
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* HEIGHT & WEIGHT GRID */}
            <View style={[styles.twoColRow, styles.inputRowBorder]}>
              <View style={styles.colInput}>
                <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    value={heightCm}
                    onChangeText={setHeightCm}
                    keyboardType="numeric"
                    placeholder="178"
                    placeholderTextColor={C.outline}
                    style={styles.metricTextInput}
                  />
                  <Text style={styles.unitSuffix}>cm</Text>
                </View>
              </View>

              <View style={styles.colInput}>
                <Text style={styles.inputLabel}>CURRENT WEIGHT</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    value={weightKg}
                    onChangeText={setWeightKg}
                    keyboardType="numeric"
                    placeholder="74.5"
                    placeholderTextColor={C.outline}
                    style={styles.metricTextInput}
                  />
                  <Text style={styles.unitSuffix}>kg</Text>
                </View>
              </View>
            </View>

            {/* TARGET GOAL WEIGHT */}
            <View style={styles.inputRow}>
              <View style={styles.labelWithBadge}>
                <Text style={styles.inputLabel}>TARGET GOAL WEIGHT</Text>
                {weightDiff !== 0 ? (
                  <Text
                    style={[
                      styles.weightDiffText,
                      { color: weightDiff < 0 ? '#FF8787' : '#51CF66' },
                    ]}>
                    {weightDiff < 0 ? `${weightDiff.toFixed(1)} kg` : `+${weightDiff.toFixed(1)} kg`}
                  </Text>
                ) : null}
              </View>
              <View style={styles.metricInputWrap}>
                <TextInput
                  value={targetWeightKg}
                  onChangeText={setTargetWeightKg}
                  keyboardType="numeric"
                  placeholder="70.0"
                  placeholderTextColor={C.outline}
                  style={styles.metricTextInput}
                />
                <Text style={styles.unitSuffix}>kg</Text>
              </View>
            </View>
          </View>

          {/* ACTIVITY LEVEL */}
          <Text style={styles.sectionHeader}>ACTIVITY LEVEL</Text>
          <View style={styles.cardGroup}>
            {ACTIVITY_LEVELS.map((level, idx) => {
              const isSelected = activityLevel === level.id;
              const isLast = idx === ACTIVITY_LEVELS.length - 1;

              return (
                <TouchableOpacity
                  key={level.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    setActivityLevel(level.id);
                  }}
                  style={[styles.activityRow, !isLast && styles.inputRowBorder]}>
                  <View style={[styles.activityIconWrap, { backgroundColor: level.color + '20' }]}>
                    <MaterialIcons name={level.icon as any} size={20} color={level.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityTitle, isSelected && { color: '#89CEFF' }]}>
                      {level.label}
                    </Text>
                    <Text style={styles.activityDesc}>{level.desc}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <MaterialIcons name="check" size={14} color="#002538" />
                    </View>
                  ) : (
                    <View style={styles.uncheckCircle} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRIMARY WELLNESS GOALS */}
          <Text style={styles.sectionHeader}>PRIMARY GOALS (SELECT ALL THAT APPLY)</Text>
          <View style={styles.goalsContainer}>
            {GOAL_OPTIONS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <TouchableOpacity
                  key={goal.id}
                  activeOpacity={0.75}
                  onPress={() => toggleGoal(goal.id)}
                  style={[
                    styles.goalChip,
                    isSelected && styles.goalChipActive,
                  ]}>
                  <MaterialIcons
                    name={goal.icon as any}
                    size={16}
                    color={isSelected ? '#002538' : goal.color}
                  />
                  <Text
                    style={[
                      styles.goalChipText,
                      isSelected && styles.goalChipTextActive,
                    ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* STICKY SAVE BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveBtn}>
            <MaterialIcons name="check" size={20} color="#002538" />
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#89CEFF',
  },
  saveHeaderBtnText: {
    color: '#002538',
    fontSize: 13,
    fontFamily: F.sansBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },

  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  toastText: {
    flex: 1,
    color: '#E0E3E6',
    fontSize: 12,
    fontFamily: F.sansMedium,
  },

  /* AVATAR HERO */
  avatarCard: {
    borderRadius: Vital.radius.xxl,
    backgroundColor: C.surfaceContainer,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    height: 84,
    width: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(137, 206, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#89CEFF',
    fontSize: 28,
    fontFamily: F.sansExtraBold,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: '#89CEFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#161B22',
  },
  avatarName: {
    color: C.onSurface,
    fontSize: 18,
    fontFamily: F.sansBold,
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(137, 206, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  badgePillText: {
    color: '#89CEFF',
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },

  sectionHeader: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  cardGroup: {
    borderRadius: Vital.radius.xl,
    backgroundColor: C.surfaceContainer,
    overflow: 'hidden',
    marginBottom: 24,
  },
  inputRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inputRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  labelWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  verifiedTagText: {
    color: '#20C997',
    fontSize: 9,
    fontFamily: F.mono,
  },
  weightDiffText: {
    fontSize: 11,
    fontFamily: F.mono,
  },
  textInput: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: F.sansMedium,
    paddingVertical: 4,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    lineHeight: 19,
  },

  /* GENDER */
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  genderBtnActive: {
    backgroundColor: '#89CEFF',
  },
  genderBtnText: {
    color: '#BDC8D2',
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  genderBtnTextActive: {
    color: '#002538',
    fontFamily: F.sansBold,
  },

  /* TWO COL */
  twoColRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  colInput: {
    flex: 1,
  },
  metricInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTextInput: {
    flex: 1,
    color: C.onSurface,
    fontSize: 16,
    fontFamily: F.sansBold,
    paddingVertical: 2,
  },
  unitSuffix: {
    color: C.outline,
    fontSize: 13,
    fontFamily: F.mono,
    marginRight: 12,
  },

  /* ACTIVITY LEVEL */
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityIconWrap: {
    height: 38,
    width: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityTitle: {
    color: C.onSurface,
    fontSize: 13.5,
    fontFamily: F.sansSemiBold,
  },
  activityDesc: {
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  checkCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#89CEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* GOALS */
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.surfaceContainer,
    gap: 6,
  },
  goalChipActive: {
    backgroundColor: '#89CEFF',
  },
  goalChipText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: F.sansMedium,
  },
  goalChipTextActive: {
    color: '#002538',
    fontFamily: F.sansBold,
  },

  /* SAVE BTN */
  saveBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#89CEFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#002538',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
});
