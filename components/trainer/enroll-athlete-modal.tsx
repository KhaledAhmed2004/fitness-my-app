/**
 * Enroll Athlete Modal — Production-grade Onboarding System for Gym Trainers
 * 3-Step Animated Wizard Architecture (React Native Reanimated)
 * Features:
 *  Step 1: Athlete Identity & Demographics (Name, Phone, Email, Gender, Age, Height)
 *  Step 2: Biometrics & Training Goal (Start/Target Weight, Live BMI, Goal, Starter Split)
 *  Step 3: PT Package & Clinical Clearance (Package Picker, Injury Presets, Progressive PAR-Q & Emergency)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import { Vital, TrainingTheme, CoachTheme } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import { CoachPackagesManagerModal } from './coach-packages-manager-modal';
import type {
  ClientGoalType,
  ClientInjuryRecord,
  InjurySeverity,
} from '@/types/trainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const F = Vital.fonts;

type InjuryPresetType = 'NONE' | 'L4-L5_DISC' | 'KNEE_PATELLAR' | 'SHOULDER_IMPINGEMENT' | 'CUSTOM';

const STEP_TITLES = [
  '1. Athlete Identity',
  '2. Body Metrics & Goal',
  '3. Plan & Clearance',
];

const GOAL_META: Record<
  ClientGoalType,
  { label: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  HYPERTROPHY: { label: 'Build Muscle', icon: 'fitness-center' },
  FAT_LOSS: { label: 'Fat Loss & Cut', icon: 'local-fire-department' },
  POWERLIFTING: { label: 'Raw Strength', icon: 'sports' },
  REHAB: { label: 'Spine/Joint Rehab', icon: 'healing' },
  ATHLETIC_CONDITIONING: { label: 'Conditioning', icon: 'directions-run' },
};

const INJURY_PRESETS: Record<
  InjuryPresetType,
  {
    label: string;
    jointOrArea: string;
    severity: InjurySeverity;
    contraindicated: string[];
    safeAlt: string[];
    notes: string;
  }
> = {
  NONE: {
    label: 'None / Healthy Baseline',
    jointOrArea: '',
    severity: 'MILD',
    contraindicated: [],
    safeAlt: [],
    notes: '',
  },
  'L4-L5_DISC': {
    label: 'L4-L5 Disc Herniation',
    jointOrArea: 'Lumbar Spine (L4-L5 Disc Bulge)',
    severity: 'SEVERE_CONTRAINDICATED',
    contraindicated: [
      'Heavy Barbell Back Squats',
      'Romanian Deadlifts with Lumbar Flexion',
      'Standing Overhead Barbell Press',
      'Seated Torso Rotation with Load',
    ],
    safeAlt: [
      'Belt Squats / Goblet Box Squats',
      'McGill Big 3 (Bird-Dog, Side Plank, Curl-up)',
      'Chest-Supported Neutral Rows',
      'Neutral-Grip Lat Pulldowns',
    ],
    notes: 'Prescribed axial-unloaded spine shield protocol. Maintain strict neutral abdominal bracing.',
  },
  KNEE_PATELLAR: {
    label: 'Knee Patellar Tendinitis',
    jointOrArea: 'Right/Left Knee Patellar Tendon',
    severity: 'MODERATE',
    contraindicated: [
      'Deep Sissy Squats',
      'Walking Lunges with Forward Knee Shear',
      'Heavy Leg Extensions at 90°',
    ],
    safeAlt: [
      'Box Squats (Vertical Shin Angle)',
      'Spanish Squats (Isometric Quad Load)',
      'Glute Bridges / Hip Thrusts',
      'Hamstring Curls',
    ],
    notes: 'Reduce anterior shear on patellar tendon. Focus on hip-dominant mechanics.',
  },
  SHOULDER_IMPINGEMENT: {
    label: 'Shoulder Impingement / AC Joint',
    jointOrArea: 'Rotator Cuff & Supraspinatus Tendon',
    severity: 'MODERATE',
    contraindicated: [
      'Behind-the-Neck Barbell Press',
      'Wide-Grip Flared Bench Press',
      'Upright Barbell Rows',
    ],
    safeAlt: [
      'Neutral-Grip Dumbbell Press (Elbows 45°)',
      'Landmine Press',
      'Facepulls with External Rotation',
      'Incline DB Rows',
    ],
    notes: 'Keep elbows tucked at 45° in the scapular plane. Avoid end-range internal rotation under load.',
  },
  CUSTOM: {
    label: 'Custom Injury / Restriction',
    jointOrArea: '',
    severity: 'MODERATE',
    contraindicated: ['Heavy End-Range Loading'],
    safeAlt: ['Supported Neutral Alternatives'],
    notes: '',
  },
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
};

export function EnrollAthleteModal({ visible, onClose, onSuccess }: Props) {
  const { addClient, programs, customPackages } = useTrainerStore();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const translateX = useSharedValue(0);

  // Progressive Disclosure Toggles in Step 3
  const [showParqDetails, setShowParqDetails] = useState(false);
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);

  // Input Refs for smooth keyboard traversal
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const startWeightRef = useRef<TextInput>(null);
  const targetWeightRef = useRef<TextInput>(null);
  const customInjuryAreaRef = useRef<TextInput>(null);
  const customInjuryNotesRef = useRef<TextInput>(null);
  const emergencyNameRef = useRef<TextInput>(null);
  const emergencyRelationRef = useRef<TextInput>(null);
  const emergencyPhoneRef = useRef<TextInput>(null);

  // Form State: 1. Demographics
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [age, setAge] = useState('26');
  const [heightCm, setHeightCm] = useState('175');

  // Inline Validation Errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    gender?: string;
  }>({});

  // Form State: 2. Biometrics & Goal
  const [startWeight, setStartWeight] = useState('78.0');
  const [targetWeight, setTargetWeight] = useState('72.0');
  const [goal, setGoal] = useState<ClientGoalType>('HYPERTROPHY');
  const [starterSplitId, setStarterSplitId] = useState<string>('split_ppl');

  // Form State: 3. Package
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    customPackages.find((p) => p.isPopular)?.id || customPackages[0]?.id || 'pkg_monthly_12'
  );
  const [packagesManagerVisible, setPackagesManagerVisible] = useState(false);

  // Form State: 4. Clinical Injury Presets
  const [injuryPreset, setInjuryPreset] = useState<InjuryPresetType>('NONE');
  const [customInjuryArea, setCustomInjuryArea] = useState('');
  const [customInjuryNotes, setCustomInjuryNotes] = useState('');

  // Form State: 5. PAR-Q+ Screening
  const [hasHeartCondition, setHasHeartCondition] = useState(false);
  const [hasDizziness, setHasDizziness] = useState(false);
  const [isTakingBpMeds, setIsTakingBpMeds] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Family');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset wizard on modal open
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      translateX.value = 0;
      setFieldErrors({});
      setShowParqDetails(false);
      setShowEmergencyDetails(false);
    }
  }, [visible, translateX]);

  // Reanimated style for horizontal slide
  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Real-time Field Handlers with Automatic Error Clearing
  const handleNameChange = (val: string) => {
    setName(val);
    if (fieldErrors.name && val.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (fieldErrors.phone && val.trim()) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleGenderChange = (g: 'MALE' | 'FEMALE' | 'OTHER') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGender(g);
    if (fieldErrors.gender) {
      setFieldErrors((prev) => ({ ...prev, gender: undefined }));
    }
  };

  // Step Navigation Handlers with Step-gated Validation
  const goNext = () => {
    if (currentStep === 0) {
      const errors: { name?: string; phone?: string; gender?: string } = {};
      if (!name.trim()) errors.name = 'Full legal name is required';
      if (!phone.trim()) errors.phone = 'Contact phone number is required';
      if (!gender) errors.gender = 'Gender selection is required';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
      setFieldErrors({});
    }

    if (currentStep < 2) {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const next = (currentStep + 1) as 0 | 1 | 2;
      setCurrentStep(next);
      translateX.value = withTiming(-SCREEN_WIDTH * next, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const goBack = () => {
    if (currentStep === 0) {
      onClose();
      return;
    }
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const prev = (currentStep - 1) as 0 | 1 | 2;
    setCurrentStep(prev);
    translateX.value = withTiming(-SCREEN_WIDTH * prev, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  };

  // Dynamic BMI Calculation
  const bmiInfo = useMemo(() => {
    const w = parseFloat(startWeight);
    const h = parseFloat(heightCm) / 100;
    if (!w || !h || h <= 0) return null;
    const bmi = w / (h * h);
    let category = 'Normal';
    let color: string = CoachTheme.lime;
    if (bmi < 18.5) {
      category = 'Underweight';
      color = CoachTheme.cyan;
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      color = CoachTheme.gold;
    } else if (bmi >= 30) {
      category = 'Obese (Class 1)';
      color = CoachTheme.red;
    }
    return {
      value: bmi.toFixed(1),
      category,
      color,
      weightDelta: (parseFloat(targetWeight) || w) - w,
    };
  }, [startWeight, heightCm, targetWeight]);

  if (!visible) return null;

  const handleSubmit = async () => {
    // Final check for Step 1 fields
    const errors: { name?: string; phone?: string; gender?: string } = {};
    if (!name.trim()) errors.name = 'Full legal name is required';
    if (!phone.trim()) errors.phone = 'Contact phone number is required';
    if (!gender) errors.gender = 'Gender selection is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setCurrentStep(0);
      translateX.value = withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    const startW = parseFloat(startWeight) || 75;
    const targetW = parseFloat(targetWeight) || startW;
    const ageVal = parseInt(age) || 26;
    const heightVal = parseFloat(heightCm) || 175;

    // Package Calculations based on selected custom package
    const chosenPkg = customPackages.find((p) => p.id === selectedPackageId) || customPackages[0];
    const totalSess = chosenPkg ? chosenPkg.sessionsCount : 12;
    const priceVal = chosenPkg ? chosenPkg.priceBdt : 15000;
    const validityDays = chosenPkg ? chosenPkg.durationDays : 45;

    // Prepare Injury Record
    const injuriesList: ClientInjuryRecord[] = [];
    if (injuryPreset !== 'NONE') {
      const presetData = INJURY_PRESETS[injuryPreset];
      injuriesList.push({
        id: `inj_${Date.now()}`,
        jointOrArea:
          injuryPreset === 'CUSTOM'
            ? customInjuryArea.trim() || 'General Joint Precaution'
            : presetData.jointOrArea,
        severity: presetData.severity,
        contraindicatedMovements: presetData.contraindicated,
        safeAlternatives: presetData.safeAlt,
        notes:
          injuryPreset === 'CUSTOM'
            ? customInjuryNotes.trim() || 'Custom coach injury note recorded.'
            : presetData.notes,
      });
    }

    // Auto generate email if blank
    const cleanEmail =
      email.trim() ||
      `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gym.athlete`;

    const newClientId = await addClient({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      age: ageVal,
      gender,
      heightCm: heightVal,
      starterSplitId: starterSplitId !== 'NONE' ? starterSplitId : undefined,
      goal,
      currentPhase: `Week 1: Movement Screening & Baseline Onboarding`,
      startingWeightKg: startW,
      currentWeightKg: startW,
      targetWeightKg: targetW,
      bodyFatPercent: gender === 'FEMALE' ? 24.0 : 18.0,
      notes: `Enrolled via Coach Command Hub. Starter split: ${
        starterSplitId !== 'NONE' ? starterSplitId.toUpperCase() : 'Not assigned'
      }. Package: ${chosenPkg?.title || 'Custom PT Pack'}.`,
      status: 'ACTIVE',
      parQ: {
        hasHeartCondition,
        hasChestPainDuringExercise: hasHeartCondition,
        hasDizzinessOrLossOfConsciousness: hasDizziness,
        hasBoneOrJointProblem: injuriesList.length > 0,
        isTakingBloodPressureMeds: isTakingBpMeds,
        medicalClearanceApproved: !hasHeartCondition,
        emergencyContact: {
          name: emergencyName.trim() || `${name} Contact`,
          phone: emergencyPhone.trim() || phone.trim(),
          relation: emergencyRelation.trim() || 'Family',
        },
      },
      injuries: injuriesList,
      package: {
        packageType: chosenPkg?.id || 'pkg_monthly_12',
        packageName: chosenPkg?.title || '12-Session Monthly Package',
        totalSessions: totalSess,
        completedSessions: 0,
        remainingSessions: totalSess,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(
          Date.now() + validityDays * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0],
        priceBdt: priceVal,
        isPaid: true,
        attendanceHistory: [],
      },
    });

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSubmitting(false);
    onClose();
    if (onSuccess) onSuccess(newClientId);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* FIXED HEADER WITH PROGRESS INDICATOR */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.stepBadgeRow}>
              {[0, 1, 2].map((idx) => {
                const isDone = currentStep > idx;
                const isCurrent = currentStep === idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.stepDot,
                      isDone && styles.stepDotDone,
                      isCurrent && styles.stepDotCurrent,
                    ]}
                  />
                );
              })}
            </View>
            <View>
              <Text style={styles.headerStepText}>STEP {currentStep + 1} OF 3</Text>
              <Text style={styles.headerTitle}>{STEP_TITLES[currentStep]}</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color={CoachTheme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ANIMATED SLIDER VIEWPORT */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
          <View style={styles.wizardViewport}>
            <Animated.View style={[styles.wizardTrack, animatedSlideStyle]}>
              {/* ================= STEP 1: ATHLETE IDENTITY ================= */}
              <View style={styles.stepPane}>
                <ScrollView
                  contentContainerStyle={styles.stepScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(40).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="person" size={18} color={CoachTheme.lime} />
                      <Text style={styles.cardTitle}>ATHLETE IDENTITY & DEMOGRAPHICS</Text>
                    </View>

                    {/* Full Name with Inline Error */}
                    <Text style={styles.fieldLabel}>Full Legal Name *</Text>
                    <TextInput
                      value={name}
                      onChangeText={handleNameChange}
                      placeholder="e.g. Shakib Al Hasan"
                      placeholderTextColor={CoachTheme.textMuted}
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                      blurOnSubmit={false}
                      style={[styles.textInput, !!fieldErrors.name && styles.textInputError]}
                    />
                    {fieldErrors.name && (
                      <View style={styles.errorRow}>
                        <MaterialIcons name="error-outline" size={13} color={CoachTheme.red} />
                        <Text style={styles.errorText}>{fieldErrors.name}</Text>
                      </View>
                    )}

                    {/* Phone & Email */}
                    <View style={styles.rowTwo}>
                      <View style={{ flex: 1.1 }}>
                        <Text style={styles.fieldLabel}>Phone Number *</Text>
                        <TextInput
                          ref={phoneRef}
                          value={phone}
                          onChangeText={handlePhoneChange}
                          placeholder="e.g. +880 1711-223344"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          onSubmitEditing={() => emailRef.current?.focus()}
                          blurOnSubmit={false}
                          style={[styles.textInput, !!fieldErrors.phone && styles.textInputError]}
                        />
                        {fieldErrors.phone && (
                          <View style={styles.errorRow}>
                            <MaterialIcons name="error-outline" size={13} color={CoachTheme.red} />
                            <Text style={styles.errorText}>{fieldErrors.phone}</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 0.9 }}>
                        <Text style={styles.fieldLabel}>Email (Optional)</Text>
                        <TextInput
                          ref={emailRef}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="athlete@gym.com"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="next"
                          onSubmitEditing={() => ageRef.current?.focus()}
                          blurOnSubmit={false}
                          style={styles.textInput}
                        />
                      </View>
                    </View>

                    {/* Gender Selector */}
                    <Text style={styles.fieldLabel}>Gender *</Text>
                    <View style={styles.genderRow}>
                      {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => {
                        const isSelected = gender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            activeOpacity={0.8}
                            onPress={() => handleGenderChange(g)}
                            style={[
                              styles.genderBtn,
                              isSelected && styles.genderBtnActive,
                            ]}>
                            <MaterialIcons
                              name={g === 'MALE' ? 'male' : g === 'FEMALE' ? 'female' : 'person'}
                              size={16}
                              color={isSelected ? CoachTheme.lime : CoachTheme.textMuted}
                            />
                            <Text
                              style={[
                                styles.genderBtnText,
                                isSelected && styles.genderBtnTextActive,
                              ]}>
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Age & Height */}
                    <View style={styles.rowTwo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Age (Yrs)</Text>
                        <TextInput
                          ref={ageRef}
                          value={age}
                          onChangeText={setAge}
                          placeholder="26"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="number-pad"
                          returnKeyType="next"
                          onSubmitEditing={() => heightRef.current?.focus()}
                          blurOnSubmit={false}
                          style={styles.textInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Height (cm)</Text>
                        <TextInput
                          ref={heightRef}
                          value={heightCm}
                          onChangeText={setHeightCm}
                          placeholder="175"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="decimal-pad"
                          returnKeyType="done"
                          style={styles.textInput}
                        />
                      </View>
                    </View>
                  </Animated.View>
                </ScrollView>
              </View>

              {/* ================= STEP 2: BODY METRICS & GOAL ================= */}
              <View style={styles.stepPane}>
                <ScrollView
                  contentContainerStyle={styles.stepScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  {/* BIOMETRICS & BMI */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(40).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="monitor-weight" size={18} color={CoachTheme.gold} />
                      <Text style={styles.cardTitle}>BIOMETRICS & TARGET WEIGHT</Text>
                    </View>

                    <View style={styles.rowTwo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Starting Weight (kg)</Text>
                        <TextInput
                          ref={startWeightRef}
                          value={startWeight}
                          onChangeText={setStartWeight}
                          placeholder="78.0"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="decimal-pad"
                          returnKeyType="next"
                          onSubmitEditing={() => targetWeightRef.current?.focus()}
                          blurOnSubmit={false}
                          style={styles.textInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Target Weight (kg)</Text>
                        <TextInput
                          ref={targetWeightRef}
                          value={targetWeight}
                          onChangeText={setTargetWeight}
                          placeholder="72.0"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="decimal-pad"
                          returnKeyType="done"
                          style={styles.textInput}
                        />
                      </View>
                    </View>

                    {/* LIVE BMI PREVIEW CHIP */}
                    {bmiInfo && (
                      <View style={styles.bmiPreviewBanner}>
                        <View style={styles.bmiBadge}>
                          <Text style={styles.bmiBadgeLbl}>BASELINE BMI</Text>
                          <Text style={[styles.bmiBadgeVal, { color: bmiInfo.color }]}>
                            {bmiInfo.value}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.bmiCategoryText, { color: bmiInfo.color }]}>
                            {bmiInfo.category} Category
                          </Text>
                          <Text style={styles.bmiDeltaText}>
                            Target Net Delta:{' '}
                            <Text style={{ fontFamily: F.sansBold }}>
                              {bmiInfo.weightDelta > 0 ? `+${bmiInfo.weightDelta.toFixed(1)}kg (Bulk)` : `${bmiInfo.weightDelta.toFixed(1)}kg (Cut)`}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    )}
                  </Animated.View>

                  {/* PRIMARY GOAL */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(90).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="flag" size={18} color={CoachTheme.lime} />
                      <Text style={styles.cardTitle}>PRIMARY TRAINING GOAL</Text>
                    </View>
                    <View style={styles.gridPills}>
                      {(['HYPERTROPHY', 'FAT_LOSS', 'POWERLIFTING', 'REHAB', 'ATHLETIC_CONDITIONING'] as ClientGoalType[]).map(
                        (g) => {
                          const meta = GOAL_META[g];
                          const isSelected = goal === g;
                          return (
                            <TouchableOpacity
                              key={g}
                              activeOpacity={0.8}
                              onPress={() => {
                                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setGoal(g);
                              }}
                              style={[
                                styles.goalPill,
                                isSelected && styles.goalPillActive,
                              ]}>
                              <MaterialIcons
                                name={meta.icon}
                                size={15}
                                color={isSelected ? CoachTheme.gold : CoachTheme.textMuted}
                              />
                              <Text
                                style={[
                                  styles.goalPillText,
                                  isSelected && styles.goalPillTextActive,
                                ]}>
                                {meta.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </Animated.View>

                  {/* STARTER WORKOUT SPLIT */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(140).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="event-note" size={18} color={CoachTheme.cyan} />
                      <Text style={styles.cardTitle}>STARTER WORKOUT SPLIT</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.splitPickerRow}>
                      {[
                        ...programs.map((p) => ({ id: p.id, code: p.code, title: p.title, color: p.color })),
                        { id: 'NONE', code: 'NONE', title: 'Assign Later', color: CoachTheme.textMuted },
                      ].map((sp) => {
                        const isSelected = starterSplitId === sp.id;
                        return (
                          <TouchableOpacity
                            key={sp.id}
                            activeOpacity={0.8}
                            onPress={() => {
                              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setStarterSplitId(sp.id);
                            }}
                            style={[
                              styles.splitPickerChip,
                              isSelected && { borderColor: sp.color, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                            ]}>
                            <Text style={[styles.splitPickerCode, { color: sp.color }]}>{sp.code}</Text>
                            <Text style={styles.splitPickerTitle} numberOfLines={1}>
                              {sp.title.split(' ')[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </Animated.View>
                </ScrollView>
              </View>

              {/* ================= STEP 3: PLAN & CLINICAL CLEARANCE ================= */}
              <View style={styles.stepPane}>
                <ScrollView
                  contentContainerStyle={styles.stepScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  {/* PT COACHING PACKAGES */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(40).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardHeaderLeft}>
                        <MaterialIcons name="card-membership" size={18} color={CoachTheme.purple} />
                        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                          PT PACKAGES & FEES
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setPackagesManagerVisible(true);
                        }}
                        style={styles.customRatesBtn}>
                        <MaterialIcons name="tune" size={12} color={CoachTheme.lime} />
                        <Text style={styles.customRatesText}>Rates</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packageOptionRow}>
                      {customPackages
                        .filter((p) => p.isActive)
                        .map((pkg) => {
                          const isSelected = selectedPackageId === pkg.id;
                          const accent = pkg.color || CoachTheme.lime;
                          return (
                            <TouchableOpacity
                              key={pkg.id}
                              activeOpacity={0.8}
                              onPress={() => {
                                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                                setSelectedPackageId(pkg.id);
                              }}
                              style={[
                                styles.pkgOption,
                                { borderColor: isSelected ? accent : CoachTheme.inputBorder },
                                isSelected && { backgroundColor: accent + '18' },
                              ]}>
                              {pkg.tag ? (
                                <View style={[styles.pkgPopularBadge, { backgroundColor: accent }]}>
                                  <Text style={styles.pkgPopularText}>{pkg.tag}</Text>
                                </View>
                              ) : (
                                <View style={styles.pkgBadgePlaceholder} />
                              )}
                              <Text style={styles.pkgOptionHeader} numberOfLines={1}>
                                {pkg.title.split(' ')[0]} {pkg.sessionsCount}S
                              </Text>
                              <Text style={[styles.pkgOptionPrice, { color: accent }]}>
                                ৳{pkg.priceBdt.toLocaleString()}
                              </Text>
                              <Text style={styles.pkgOptionSub} numberOfLines={1}>
                                {pkg.frequencyPerWeek}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                  </Animated.View>

                  {/* CLINICAL INJURY SHIELD */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(80).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <View style={styles.cardHeader}>
                      <MaterialIcons name="healing" size={18} color={CoachTheme.red} />
                      <Text style={styles.cardTitle}>CLINICAL INJURY SHIELD</Text>
                    </View>

                    <View style={styles.injuryPresetGrid}>
                      {(Object.keys(INJURY_PRESETS) as InjuryPresetType[]).map((key) => {
                        const isSelected = injuryPreset === key;
                        const isNone = key === 'NONE';
                        return (
                          <TouchableOpacity
                            key={key}
                            activeOpacity={0.8}
                            onPress={() => {
                              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setInjuryPreset(key);
                            }}
                            style={[
                              styles.injuryPresetPill,
                              isSelected && (isNone ? styles.injuryPresetPillNoneActive : styles.injuryPresetPillActive),
                            ]}>
                            <MaterialIcons
                              name={isNone ? 'check-circle' : 'warning'}
                              size={14}
                              color={isSelected ? (isNone ? CoachTheme.lime : CoachTheme.red) : CoachTheme.textMuted}
                            />
                            <Text
                              style={[
                                styles.injuryPresetText,
                                isSelected && { color: isNone ? CoachTheme.lime : CoachTheme.red, fontFamily: F.sansBold },
                              ]}>
                              {INJURY_PRESETS[key].label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* PRESET PREVIEW (REACTIVELY DISCLOSED) */}
                    {injuryPreset !== 'NONE' && injuryPreset !== 'CUSTOM' && (
                      <Animated.View
                        entering={FadeInDown.duration(200).easing(Easing.out(Easing.cubic))}
                        exiting={FadeOut.duration(150)}
                        style={styles.injuryPresetDetailsBox}>
                        <Text style={styles.injDetailTitle}>🚫 Contraindicated Movements (Blocked):</Text>
                        {INJURY_PRESETS[injuryPreset].contraindicated.map((c, i) => (
                          <Text key={i} style={styles.redListItem}>
                            ✕ {c}
                          </Text>
                        ))}
                        <Text style={[styles.injDetailTitle, { color: CoachTheme.lime, marginTop: 6 }]}>
                          ✅ Safe Prescribed Alternatives:
                        </Text>
                        {INJURY_PRESETS[injuryPreset].safeAlt.map((s, i) => (
                          <Text key={i} style={styles.greenListItem}>
                            ✓ {s}
                          </Text>
                        ))}
                      </Animated.View>
                    )}

                    {/* CUSTOM INJURY INPUTS */}
                    {injuryPreset === 'CUSTOM' && (
                      <Animated.View
                        entering={FadeInDown.duration(200).easing(Easing.out(Easing.cubic))}
                        exiting={FadeOut.duration(150)}
                        style={{ gap: 8, marginTop: 4 }}>
                        <TextInput
                          ref={customInjuryAreaRef}
                          value={customInjuryArea}
                          onChangeText={setCustomInjuryArea}
                          placeholder="e.g. Left Ankle Sprain / Wrist Ganglion"
                          placeholderTextColor={CoachTheme.textMuted}
                          returnKeyType="next"
                          onSubmitEditing={() => customInjuryNotesRef.current?.focus()}
                          blurOnSubmit={false}
                          style={styles.textInput}
                        />
                        <TextInput
                          ref={customInjuryNotesRef}
                          value={customInjuryNotes}
                          onChangeText={setCustomInjuryNotes}
                          placeholder="Coach guidance & contraindicated movements..."
                          placeholderTextColor={CoachTheme.textMuted}
                          returnKeyType="done"
                          style={styles.textInput}
                        />
                      </Animated.View>
                    )}
                  </Animated.View>

                  {/* PAR-Q+ COLLAPSIBLE CLEARANCE */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(120).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowParqDetails(!showParqDetails);
                      }}
                      style={styles.accordionHeader}>
                      <View style={styles.accordionHeaderLeft}>
                        <MaterialIcons
                          name="health-and-safety"
                          size={18}
                          color={hasHeartCondition || hasDizziness || isTakingBpMeds ? CoachTheme.red : CoachTheme.cyan}
                        />
                        <View>
                          <Text style={styles.cardTitle}>PAR-Q+ MEDICAL SCREENING</Text>
                          <Text style={styles.accordionSub}>
                            {hasHeartCondition || hasDizziness || isTakingBpMeds
                              ? 'Flagged Precautions Present'
                              : 'Standard Baseline Approved (Default)'}
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons
                        name={showParqDetails ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={22}
                        color={CoachTheme.textSecondary}
                      />
                    </TouchableOpacity>

                    {showParqDetails && (
                      <Animated.View
                        entering={FadeInDown.duration(200).easing(Easing.out(Easing.cubic))}
                        exiting={FadeOut.duration(150)}
                        style={styles.accordionBody}>
                        <View style={styles.parqRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.parqLabel}>Heart condition or chest pain?</Text>
                            <Text style={styles.parqSub}>Pain during physical exertion</Text>
                          </View>
                          <Switch
                            value={hasHeartCondition}
                            onValueChange={setHasHeartCondition}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: CoachTheme.red }}
                          />
                        </View>

                        <View style={styles.parqRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.parqLabel}>Dizziness or loss of balance?</Text>
                            <Text style={styles.parqSub}>Syncope / balance restrictions</Text>
                          </View>
                          <Switch
                            value={hasDizziness}
                            onValueChange={setHasDizziness}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: CoachTheme.gold }}
                          />
                        </View>

                        <View style={styles.parqRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.parqLabel}>Taking Blood Pressure medication?</Text>
                            <Text style={styles.parqSub}>Requires beta-blocker/RPE pacing</Text>
                          </View>
                          <Switch
                            value={isTakingBpMeds}
                            onValueChange={setIsTakingBpMeds}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: CoachTheme.cyan }}
                          />
                        </View>
                      </Animated.View>
                    )}
                  </Animated.View>

                  {/* EMERGENCY CONTACT (COLLAPSIBLE) */}
                  <Animated.View
                    entering={FadeInDown.duration(240).delay(160).easing(Easing.out(Easing.cubic))}
                    layout={LinearTransition.duration(200)}
                    style={styles.formCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowEmergencyDetails(!showEmergencyDetails);
                      }}
                      style={styles.accordionHeader}>
                      <View style={styles.accordionHeaderLeft}>
                        <MaterialIcons name="contact-phone" size={18} color={CoachTheme.lime} />
                        <View>
                          <Text style={styles.cardTitle}>EMERGENCY CONTACT (OPTIONAL)</Text>
                          <Text style={styles.accordionSub}>
                            {emergencyName.trim()
                              ? `${emergencyName.trim()} (${emergencyRelation})`
                              : 'Auto-synced with athlete phone'}
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons
                        name={showEmergencyDetails ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={22}
                        color={CoachTheme.textSecondary}
                      />
                    </TouchableOpacity>

                    {showEmergencyDetails && (
                      <Animated.View
                        entering={FadeInDown.duration(200).easing(Easing.out(Easing.cubic))}
                        exiting={FadeOut.duration(150)}
                        style={styles.accordionBody}>
                        <View style={styles.rowTwo}>
                          <View style={{ flex: 1.2 }}>
                            <TextInput
                              ref={emergencyNameRef}
                              value={emergencyName}
                              onChangeText={setEmergencyName}
                              placeholder="Contact Name"
                              placeholderTextColor={CoachTheme.textMuted}
                              returnKeyType="next"
                              onSubmitEditing={() => emergencyRelationRef.current?.focus()}
                              blurOnSubmit={false}
                              style={styles.textInput}
                            />
                          </View>
                          <View style={{ flex: 0.8 }}>
                            <TextInput
                              ref={emergencyRelationRef}
                              value={emergencyRelation}
                              onChangeText={setEmergencyRelation}
                              placeholder="Relation (Family)"
                              placeholderTextColor={CoachTheme.textMuted}
                              returnKeyType="next"
                              onSubmitEditing={() => emergencyPhoneRef.current?.focus()}
                              blurOnSubmit={false}
                              style={styles.textInput}
                            />
                          </View>
                        </View>
                        <TextInput
                          ref={emergencyPhoneRef}
                          value={emergencyPhone}
                          onChangeText={setEmergencyPhone}
                          placeholder="Emergency Phone (+880 ...)"
                          placeholderTextColor={CoachTheme.textMuted}
                          keyboardType="phone-pad"
                          returnKeyType="done"
                          style={[styles.textInput, { marginTop: 8 }]}
                        />
                      </Animated.View>
                    )}
                  </Animated.View>
                </ScrollView>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

        {/* FIXED ERGONOMIC STICKY FOOTER */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={goBack}
            style={styles.footerBackBtn}>
            <MaterialIcons
              name={currentStep === 0 ? 'close' : 'arrow-back'}
              size={18}
              color={CoachTheme.textSecondary}
            />
            <Text style={styles.footerBackText}>
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          {currentStep < 2 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={goNext}
              style={styles.footerNextBtn}>
              <Text style={styles.footerNextText}>Next Step</Text>
              <MaterialIcons name="arrow-forward" size={18} color={CoachTheme.textDark} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.footerSubmitBtn, isSubmitting && { opacity: 0.75 }]}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={CoachTheme.textDark} />
              ) : (
                <MaterialIcons name="person-add" size={18} color={CoachTheme.textDark} />
              )}
              <Text style={styles.footerSubmitText}>
                {isSubmitting ? 'Enrolling Athlete...' : 'Enroll & Clear Athlete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ⚙️ COACH CUSTOM PACKAGES & RATES MANAGER */}
      <CoachPackagesManagerModal
        visible={packagesManagerVisible}
        onClose={() => setPackagesManagerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CoachTheme.canvas,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CoachTheme.glassBorder,
    backgroundColor: CoachTheme.canvas,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepDotCurrent: {
    width: 18,
    backgroundColor: CoachTheme.lime,
  },
  stepDotDone: {
    backgroundColor: CoachTheme.lime,
  },
  headerStepText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: CoachTheme.lime,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: F.mono,
    fontSize: 13,
    fontWeight: '800',
    color: CoachTheme.textPrimary,
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  wizardTrack: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
    flex: 1,
  },
  stepPane: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  formCard: {
    backgroundColor: CoachTheme.card,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  customRatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CoachTheme.limeDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CoachTheme.limeBorder,
    flexShrink: 0,
  },
  customRatesText: {
    fontFamily: F.sansBold,
    fontSize: 10,
    color: CoachTheme.lime,
  },
  cardTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: CoachTheme.textPrimary,
    fontWeight: '800',
    flexShrink: 1,
  },
  fieldLabel: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: CoachTheme.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  textInput: {
    backgroundColor: CoachTheme.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: CoachTheme.textPrimary,
    fontFamily: F.sans,
    fontSize: 13,
    borderWidth: 1,
    borderColor: CoachTheme.inputBorder,
  },
  textInputError: {
    borderColor: CoachTheme.red,
    borderWidth: 1.5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginLeft: 2,
  },
  errorText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: CoachTheme.red,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: CoachTheme.cardSubtle,
    paddingVertical: 11,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CoachTheme.inputBorder,
  },
  genderBtnActive: {
    backgroundColor: CoachTheme.limeDim,
    borderColor: CoachTheme.lime,
  },
  genderBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: CoachTheme.textSecondary,
  },
  genderBtnTextActive: {
    color: CoachTheme.lime,
    fontFamily: F.sansBold,
  },
  bmiPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CoachTheme.cardSubtle,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: CoachTheme.glassBorder,
    marginTop: 2,
  },
  bmiBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bmiBadgeLbl: {
    fontFamily: F.mono,
    fontSize: 8.5,
    color: CoachTheme.textMuted,
  },
  bmiBadgeVal: {
    fontFamily: F.mono,
    fontSize: 14,
    fontWeight: '800',
  },
  bmiCategoryText: {
    fontFamily: F.sansBold,
    fontSize: 12.5,
  },
  bmiDeltaText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: CoachTheme.textSecondary,
    marginTop: 1,
  },
  gridPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CoachTheme.cardSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 44,
    borderWidth: 1,
    borderColor: CoachTheme.inputBorder,
  },
  goalPillActive: {
    backgroundColor: CoachTheme.goldDim,
    borderColor: CoachTheme.gold,
  },
  goalPillText: {
    fontFamily: F.sansSemiBold,
    fontSize: 11.5,
    color: CoachTheme.textSecondary,
  },
  goalPillTextActive: {
    color: CoachTheme.gold,
    fontFamily: F.sansBold,
  },
  splitPickerRow: {
    gap: 8,
  },
  splitPickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: CoachTheme.cardSubtle,
    borderWidth: 1,
    borderColor: CoachTheme.inputBorder,
    alignItems: 'center',
    minWidth: 72,
  },
  splitPickerCode: {
    fontFamily: F.mono,
    fontSize: 11,
    fontWeight: '800',
  },
  splitPickerTitle: {
    fontFamily: F.sans,
    fontSize: 9.5,
    color: CoachTheme.textMuted,
    marginTop: 1,
  },
  packageOptionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  pkgOption: {
    width: 108,
    minHeight: 104,
    backgroundColor: CoachTheme.cardSubtle,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: CoachTheme.inputBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pkgBadgePlaceholder: {
    height: 14,
    marginBottom: 2,
  },
  pkgPopularBadge: {
    backgroundColor: CoachTheme.lime,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  pkgPopularText: {
    fontFamily: F.mono,
    fontSize: 7.5,
    color: CoachTheme.textDark,
    fontWeight: '800',
  },
  pkgOptionHeader: {
    fontFamily: F.sansBold,
    fontSize: 11.5,
    color: CoachTheme.textPrimary,
    textAlign: 'center',
  },
  pkgOptionPrice: {
    fontFamily: F.mono,
    fontSize: 12.5,
    color: CoachTheme.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 2,
  },
  pkgOptionSub: {
    fontFamily: F.mono,
    fontSize: 8.5,
    color: CoachTheme.textMuted,
    textAlign: 'center',
  },
  injuryPresetGrid: {
    gap: 6,
  },
  injuryPresetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CoachTheme.cardSubtle,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: CoachTheme.inputBorder,
  },
  injuryPresetPillActive: {
    backgroundColor: CoachTheme.redDim,
    borderColor: CoachTheme.red,
  },
  injuryPresetPillNoneActive: {
    backgroundColor: CoachTheme.limeDim,
    borderColor: CoachTheme.lime,
  },
  injuryPresetText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: CoachTheme.textSecondary,
    flex: 1,
  },
  injuryPresetDetailsBox: {
    backgroundColor: CoachTheme.cardSubtle,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: CoachTheme.glassBorder,
    marginTop: 4,
  },
  injDetailTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    color: CoachTheme.red,
    fontWeight: '700',
  },
  redListItem: {
    fontFamily: F.sans,
    fontSize: 11,
    color: '#FF8A80',
    paddingLeft: 4,
  },
  greenListItem: {
    fontFamily: F.sans,
    fontSize: 11,
    color: '#CCFF90',
    paddingLeft: 4,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accordionSub: {
    fontFamily: F.sans,
    fontSize: 10.5,
    color: CoachTheme.textMuted,
    marginTop: 1,
  },
  accordionBody: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 6,
    gap: 6,
  },
  parqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  parqLabel: {
    fontFamily: F.sansSemiBold,
    fontSize: 12,
    color: CoachTheme.textPrimary,
  },
  parqSub: {
    fontFamily: F.sans,
    fontSize: 10.5,
    color: CoachTheme.textMuted,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: CoachTheme.glassBorder,
    backgroundColor: CoachTheme.canvas,
  },
  footerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: CoachTheme.glassBorder,
  },
  footerBackText: {
    fontFamily: F.sansSemiBold,
    fontSize: 13,
    color: CoachTheme.textSecondary,
  },
  footerNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: CoachTheme.lime,
  },
  footerNextText: {
    fontFamily: F.sansBold,
    fontSize: 13.5,
    color: CoachTheme.textDark,
  },
  footerSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: CoachTheme.lime,
  },
  footerSubmitText: {
    fontFamily: F.sansBold,
    fontSize: 13.5,
    color: CoachTheme.textDark,
  },
});
