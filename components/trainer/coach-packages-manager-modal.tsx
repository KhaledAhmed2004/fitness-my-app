/**
 * Coach Packages Manager Modal — Custom Coaching Package & Pricing Studio
 * Allows Gym Trainers to design custom PT packages, set session counts, validity, BDT fees, and features.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Vital, TrainingTheme } from '@/constants/vital-theme';
import { useTrainerStore } from '@/stores/trainer-store';
import type { CustomCoachingPackage } from '@/types/trainer';

const T = TrainingTheme;
const C = Vital.colors;
const F = Vital.fonts;

const COLOR_OPTIONS = ['#89FE00', '#00B4D8', '#FFB800', '#FF5722', '#A78BFA', '#E0E7FF'];

const PRESET_TEMPLATES: Omit<CustomCoachingPackage, 'id' | 'isActive'>[] = [
  {
    title: '1-Day Trial Assessment',
    tag: 'TRIAL',
    sessionsCount: 1,
    durationDays: 7,
    priceBdt: 1500,
    frequencyPerWeek: 'Single Assessment',
    features: [
      '1-on-1 Biomechanics & Movement Screen',
      'Body Composition & Baseline BMI Breakdown',
      'Lift Technique & Squat Bar Path Critique',
    ],
    color: '#00B4D8',
  },
  {
    title: 'Monthly Standard 12-Pack',
    tag: 'POPULAR',
    sessionsCount: 12,
    durationDays: 45,
    priceBdt: 15000,
    frequencyPerWeek: '3 Days / Week',
    features: [
      '3 Dedicated 1-on-1 PT Sessions / Week',
      'Custom Periodized Split Prescription',
      'Macro & Micronutrient Meal Blueprint',
      'Weekly Weigh-ins & Volume Tracking',
      'WhatsApp Direct Coach Chat',
    ],
    color: '#89FE00',
    isPopular: true,
  },
  {
    title: 'Elite 24-Session Transformation',
    tag: 'BEST VALUE',
    sessionsCount: 24,
    durationDays: 60,
    priceBdt: 26000,
    frequencyPerWeek: '6 Days / Week Intensive',
    features: [
      '6 Intensive 1-on-1 PT Sessions / Week',
      'Advanced Strength Mesocycle & Peaking Block',
      'Daily Calorie & Macro Pacing Adjustments',
      'Clinical Injury Shield Prehab Drills',
      'Weekly Video Form Breakdowns',
    ],
    color: '#FFB800',
  },
  {
    title: 'VIP 36-Session Contest Prep',
    tag: 'VIP ELITE',
    sessionsCount: 36,
    durationDays: 90,
    priceBdt: 38000,
    frequencyPerWeek: '6 Days / Week + Peak Week',
    features: [
      'Full 12-Week Competition / Hypertrophy Prep',
      'Stage Posing & Symmetry Audits',
      'Sodium / Water Manipulation Protocol',
      '24/7 Priority Emergency Access',
    ],
    color: '#A78BFA',
  },
  {
    title: '8-Session Spine & Joint Rehab',
    tag: 'CLINICAL REHAB',
    sessionsCount: 8,
    durationDays: 30,
    priceBdt: 10000,
    frequencyPerWeek: '2 Days / Week',
    features: [
      'NSCA Orthopedic Movement Screening',
      'McGill Big 3 Spinal Stabilization Drills',
      'Axial-Unloaded Exercise Programming',
      'Mobility & Soft Tissue Prehab Routine',
    ],
    color: '#FF5722',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CoachPackagesManagerModal({ visible, onClose }: Props) {
  const { customPackages, addCustomPackage, updateCustomPackage, deleteCustomPackage, togglePackageActive } =
    useTrainerStore();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [sessionsCount, setSessionsCount] = useState('12');
  const [durationDays, setDurationDays] = useState('45');
  const [priceBdt, setPriceBdt] = useState('15000');
  const [frequencyPerWeek, setFrequencyPerWeek] = useState('3 Days / Week');
  const [color, setColor] = useState('#89FE00');
  const [isPopular, setIsPopular] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [features, setFeatures] = useState<string[]>([
    '1-on-1 Dedicated Coaching Sessions',
    'Customized Workout Split Prescription',
    'Target Calorie & Macro Diet Plan',
  ]);

  const openEditorForNew = (template?: Omit<CustomCoachingPackage, 'id' | 'isActive'>) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (template) {
      setTitle(template.title);
      setTag(template.tag || '');
      setSessionsCount(template.sessionsCount.toString());
      setDurationDays(template.durationDays.toString());
      setPriceBdt(template.priceBdt.toString());
      setFrequencyPerWeek(template.frequencyPerWeek);
      setColor(template.color || '#89FE00');
      setIsPopular(!!template.isPopular);
      setFeatures(template.features);
    } else {
      setTitle('');
      setTag('');
      setSessionsCount('12');
      setDurationDays('45');
      setPriceBdt('15000');
      setFrequencyPerWeek('3 Days / Week');
      setColor('#89FE00');
      setIsPopular(false);
      setFeatures([
        '1-on-1 Dedicated Coaching Sessions',
        'Customized Workout Split Prescription',
        'Target Calorie & Macro Diet Plan',
      ]);
    }
    setEditingPkgId(null);
    setEditorVisible(true);
  };

  const openEditorForEdit = (pkg: CustomCoachingPackage) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditingPkgId(pkg.id);
    setTitle(pkg.title);
    setTag(pkg.tag || '');
    setSessionsCount(pkg.sessionsCount.toString());
    setDurationDays(pkg.durationDays.toString());
    setPriceBdt(pkg.priceBdt.toString());
    setFrequencyPerWeek(pkg.frequencyPerWeek);
    setColor(pkg.color || '#89FE00');
    setIsPopular(!!pkg.isPopular);
    setFeatures(pkg.features);
    setEditorVisible(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePackage = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a package title.');
      return;
    }
    const priceVal = parseFloat(priceBdt) || 10000;
    const sessVal = parseInt(sessionsCount) || 12;
    const durVal = parseInt(durationDays) || 45;

    if (editingPkgId) {
      await updateCustomPackage(editingPkgId, {
        title: title.trim(),
        tag: tag.trim() || undefined,
        sessionsCount: sessVal,
        durationDays: durVal,
        priceBdt: priceVal,
        frequencyPerWeek: frequencyPerWeek.trim() || 'Flexible',
        color,
        isPopular,
        features: features.length > 0 ? features : ['1-on-1 Coaching Sessions', 'Custom Workout Split'],
      });
      Alert.alert('Package Updated', `"${title.trim()}" has been updated.`);
    } else {
      await addCustomPackage({
        title: title.trim(),
        tag: tag.trim() || undefined,
        sessionsCount: sessVal,
        durationDays: durVal,
        priceBdt: priceVal,
        frequencyPerWeek: frequencyPerWeek.trim() || 'Flexible',
        color,
        isPopular,
        features: features.length > 0 ? features : ['1-on-1 Coaching Sessions', 'Custom Workout Split'],
        isActive: true,
      });
      Alert.alert('Package Created', `New custom package "${title.trim()}" is now active.`);
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setEditorVisible(false);
  };

  const handleDelete = (pkg: CustomCoachingPackage) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete "${pkg.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomPackage(pkg.id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* TOP HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="close" size={22} color={C.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>COACHING PACKAGES & FEES</Text>
            <Text style={styles.headerSubtitle}>Create, customize and set your PT rates in BDT (৳)</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openEditorForNew()}
            style={styles.addPkgBtn}>
            <MaterialIcons name="add" size={18} color="#000" />
            <Text style={styles.addPkgBtnText}>+ Package</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* QUICK PRESET TEMPLATES CAROUSEL */}
          <View style={styles.presetSection}>
            <Text style={styles.presetSectionTitle}>⚡ QUICK LOAD PRESET TEMPLATES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => openEditorForNew(tmpl)}
                  style={[styles.presetCard, { borderColor: tmpl.color + '60' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="local-offer" size={12} color={tmpl.color} />
                    <Text style={[styles.presetTag, { color: tmpl.color }]}>{tmpl.tag}</Text>
                  </View>
                  <Text style={styles.presetTitle} numberOfLines={1}>
                    {tmpl.title}
                  </Text>
                  <Text style={styles.presetPrice}>৳{tmpl.priceBdt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ACTIVE COACH PACKAGES LIST */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.listSectionTitle}>
                YOUR COACHING PACKAGES ({customPackages.length})
              </Text>
              <Text style={styles.listSectionSub}>Available for Athlete Enrolment & Renewals</Text>
            </View>

            {customPackages.map((pkg) => {
              const perSessionRate =
                pkg.sessionsCount > 0 ? Math.round(pkg.priceBdt / pkg.sessionsCount) : pkg.priceBdt;
              const accentColor = pkg.color || '#89FE00';

              return (
                <View
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    { borderColor: pkg.isActive ? accentColor + '40' : 'rgba(255,255,255,0.06)' },
                    !pkg.isActive && { opacity: 0.6 },
                  ]}>
                  {/* CARD TOP ROW */}
                  <View style={styles.pkgTopRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {pkg.tag && (
                          <View style={[styles.pkgTagBadge, { backgroundColor: accentColor + '20', borderColor: accentColor }]}>
                            <Text style={[styles.pkgTagText, { color: accentColor }]}>{pkg.tag}</Text>
                          </View>
                        )}
                        {pkg.isPopular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                          </View>
                        )}
                        {!pkg.isActive && (
                          <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.pkgTitle}>{pkg.title}</Text>
                      <Text style={styles.pkgFrequency}>
                        {pkg.frequencyPerWeek} • {pkg.durationDays} Days Validity
                      </Text>
                    </View>

                    {/* PRICE BADGE */}
                    <View style={styles.priceContainer}>
                      <Text style={[styles.priceVal, { color: accentColor }]}>
                        ৳{pkg.priceBdt.toLocaleString()}
                      </Text>
                      <Text style={styles.perSessionText}>
                        ৳{perSessionRate.toLocaleString()} / session
                      </Text>
                    </View>
                  </View>

                  {/* SESSIONS & DURATION PILLS */}
                  <View style={styles.pillsRow}>
                    <View style={styles.pillBox}>
                      <MaterialIcons name="fitness-center" size={12} color={accentColor} />
                      <Text style={styles.pillText}>{pkg.sessionsCount} Sessions</Text>
                    </View>
                    <View style={styles.pillBox}>
                      <MaterialIcons name="event" size={12} color="#00B4D8" />
                      <Text style={styles.pillText}>{pkg.durationDays} Days</Text>
                    </View>
                    <View style={styles.pillBox}>
                      <MaterialIcons name="schedule" size={12} color="#FFB800" />
                      <Text style={styles.pillText}>{pkg.frequencyPerWeek}</Text>
                    </View>
                  </View>

                  {/* FEATURES LIST */}
                  <View style={styles.featuresBox}>
                    {pkg.features.map((feat, i) => (
                      <View key={i} style={styles.featureItemRow}>
                        <MaterialIcons name="check-circle" size={13} color={accentColor} />
                        <Text style={styles.featureItemText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CARD ACTIONS ROW */}
                  <View style={styles.actionsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Switch
                        value={pkg.isActive}
                        onValueChange={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          void togglePackageActive(pkg.id);
                        }}
                        trackColor={{ false: 'rgba(255,255,255,0.1)', true: accentColor }}
                      />
                      <Text style={styles.statusSwitchLabel}>
                        {pkg.isActive ? 'Active' : 'Draft'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => openEditorForEdit(pkg)}
                        style={styles.actionBtn}>
                        <MaterialIcons name="edit" size={14} color={C.onSurface} />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDelete(pkg)}
                        style={[styles.actionBtn, styles.deleteActionBtn]}>
                        <MaterialIcons name="delete-outline" size={14} color="#FF5722" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* ✏️ CREATE / EDIT PACKAGE SUB-MODAL */}
        <Modal
          visible={editorVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditorVisible(false)}>
          <View style={styles.editorModalBackdrop}>
            <View style={styles.editorContainer}>
              <View style={styles.editorHeader}>
                <View>
                  <Text style={styles.editorTitle}>
                    {editingPkgId ? 'EDIT COACHING PACKAGE' : 'CREATE CUSTOM PACKAGE'}
                  </Text>
                  <Text style={styles.editorSubtitle}>Configure Session Count, BDT Fee & Perks</Text>
                </View>
                <TouchableOpacity onPress={() => setEditorVisible(false)} style={styles.closeIconBtn}>
                  <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.editorScroll} showsVerticalScrollIndicator={false}>
                {/* PACKAGE TITLE */}
                <Text style={styles.fieldLabel}>Package Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. 16-Session Powerlifting Block"
                  placeholderTextColor={T.textMuted}
                  style={styles.inputField}
                />

                {/* PRICE & SESSIONS */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Price (BDT ৳) *</Text>
                    <TextInput
                      value={priceBdt}
                      onChangeText={setPriceBdt}
                      placeholder="15000"
                      placeholderTextColor={T.textMuted}
                      keyboardType="numeric"
                      style={styles.inputField}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Total Sessions *</Text>
                    <TextInput
                      value={sessionsCount}
                      onChangeText={setSessionsCount}
                      placeholder="12"
                      placeholderTextColor={T.textMuted}
                      keyboardType="numeric"
                      style={styles.inputField}
                    />
                  </View>
                </View>

                {/* DURATION & FREQUENCY */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Validity (Days)</Text>
                    <TextInput
                      value={durationDays}
                      onChangeText={setDurationDays}
                      placeholder="45"
                      placeholderTextColor={T.textMuted}
                      keyboardType="numeric"
                      style={styles.inputField}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Frequency / Schedule</Text>
                    <TextInput
                      value={frequencyPerWeek}
                      onChangeText={setFrequencyPerWeek}
                      placeholder="3 Days / Week"
                      placeholderTextColor={T.textMuted}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                {/* TAG / BADGE */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Tag Badge (Optional)</Text>
                    <TextInput
                      value={tag}
                      onChangeText={setTag}
                      placeholder="e.g. POPULAR, VIP, KICKSTART"
                      placeholderTextColor={T.textMuted}
                      style={styles.inputField}
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.fieldLabel}>Highlight As Popular?</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Switch
                        value={isPopular}
                        onValueChange={setIsPopular}
                        trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#89FE00' }}
                      />
                      <Text style={{ color: isPopular ? '#89FE00' : T.textMuted, fontSize: 12, fontFamily: F.sansSemiBold }}>
                        {isPopular ? 'Featured Badge' : 'Standard'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* COLOR THEME SELECTOR */}
                <Text style={styles.fieldLabel}>Accent Color Theme</Text>
                <View style={styles.colorRow}>
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.8}
                      onPress={() => setColor(c)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        color === c && styles.colorCircleSelected,
                      ]}
                    />
                  ))}
                </View>

                {/* FEATURES BUILDER */}
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Package Features & Inclusions</Text>
                <View style={styles.addFeatureRow}>
                  <TextInput
                    value={newFeatureText}
                    onChangeText={setNewFeatureText}
                    placeholder="e.g. Weekly Video Form Breakdown"
                    placeholderTextColor={T.textMuted}
                    style={[styles.inputField, { flex: 1 }]}
                    onSubmitEditing={handleAddFeature}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddFeature}
                    style={styles.addFeatureBtn}>
                    <MaterialIcons name="add" size={18} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* CURRENT FEATURES LIST */}
                <View style={styles.editorFeaturesList}>
                  {features.map((feat, idx) => (
                    <View key={idx} style={styles.editorFeatureItem}>
                      <MaterialIcons name="check" size={14} color={color} />
                      <Text style={styles.editorFeatureText}>{feat}</Text>
                      <TouchableOpacity onPress={() => handleRemoveFeature(idx)}>
                        <MaterialIcons name="close" size={14} color={T.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* SAVE BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSavePackage}
                  style={[styles.savePackageBtn, { backgroundColor: color }]}>
                  <MaterialIcons name="check" size={18} color="#000" />
                  <Text style={styles.savePackageBtnText}>
                    {editingPkgId ? 'Update Package' : 'Publish & Save Package'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: F.mono,
    fontSize: 13.5,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
    marginTop: 1,
  },
  addPkgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#89FE00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addPkgBtnText: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  presetSection: {
    gap: 6,
  },
  presetSectionTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textMuted,
    fontWeight: '700',
  },
  presetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    minWidth: 140,
    gap: 3,
  },
  presetTag: {
    fontFamily: F.mono,
    fontSize: 8.5,
    fontWeight: '800',
  },
  presetTitle: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: T.textPrimary,
  },
  presetPrice: {
    fontFamily: F.mono,
    fontSize: 12,
    color: '#89FE00',
    fontWeight: '700',
  },
  listSectionTitle: {
    fontFamily: F.mono,
    fontSize: 11,
    color: T.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listSectionSub: {
    fontFamily: F.sans,
    fontSize: 10,
    color: T.textMuted,
  },
  packageCard: {
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  pkgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  pkgTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  pkgTagText: {
    fontFamily: F.mono,
    fontSize: 8.5,
    fontWeight: '800',
  },
  popularBadge: {
    backgroundColor: '#89FE00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontFamily: F.mono,
    fontSize: 8.5,
    color: '#000',
    fontWeight: '800',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontFamily: F.mono,
    fontSize: 8.5,
    color: T.textMuted,
  },
  pkgTitle: {
    fontFamily: F.sansBold,
    fontSize: 15,
    color: T.textPrimary,
  },
  pkgFrequency: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceVal: {
    fontFamily: F.mono,
    fontSize: 18,
    fontWeight: '800',
  },
  perSessionText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: T.textMuted,
    marginTop: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: T.textSecondary,
  },
  featuresBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureItemText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: T.textSecondary,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusSwitchLabel: {
    fontFamily: F.sansSemiBold,
    fontSize: 11,
    color: T.textSecondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontFamily: F.sansSemiBold,
    fontSize: 11,
    color: T.textPrimary,
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
  },
  editorModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  editorContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  editorTitle: {
    fontFamily: F.mono,
    fontSize: 14,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: 0.8,
  },
  editorSubtitle: {
    fontFamily: F.sans,
    fontSize: 11,
    color: T.textMuted,
    marginTop: 1,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  editorScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 10,
  },
  fieldLabel: {
    fontFamily: F.mono,
    fontSize: 10.5,
    color: T.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: T.textPrimary,
    fontFamily: F.sans,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  addFeatureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addFeatureBtn: {
    backgroundColor: '#89FE00',
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorFeaturesList: {
    gap: 6,
    marginTop: 4,
  },
  editorFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  editorFeatureText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: T.textSecondary,
    flex: 1,
    paddingHorizontal: 8,
  },
  savePackageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  savePackageBtnText: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: '#000',
  },
});
