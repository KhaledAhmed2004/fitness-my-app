/**
 * Gym Membership Plans & Pricing Customizer Modal (GymOS)
 * Dedicated manager for Gym Owners to configure membership tiers, pricing,
 * durations, perk inclusions, and seasonal promotions with live sync.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useGymOwnerStore } from '@/stores/gym-owner-store';
import type { GymMembershipPlan } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

const DEFAULT_PRESET_PERKS = [
  'Full Gym & Cardio Floor',
  'Steam & Sauna Access',
  'Dedicated Locker',
  'Free Personal Trainer Session',
  'Body Composition Scan',
  'Juice Bar Discount',
  'Guest Passes Included',
  'Shower & Towel Facility',
];

const PRESET_DURATIONS = [
  { label: '1 Mo', months: 1 },
  { label: '3 Mo', months: 3 },
  { label: '6 Mo', months: 6 },
  { label: '12 Mo (1 Yr)', months: 12 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function GymMembershipPlansModal({ visible, onClose }: Props) {
  const { colors, isDark } = useThemeColors();
  const {
    membershipPlans,
    addMembershipPlan,
    updateMembershipPlan,
    deleteMembershipPlan,
    toggleMembershipPlanActive,
  } = useGymOwnerStore();

  // Create / Edit Submodal State
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [feeBdt, setFeeBdt] = useState('4500');
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);
  const [customPerkText, setCustomPerkText] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePlansCount = useMemo(
    () => membershipPlans.filter((p) => p.isActive).length,
    [membershipPlans]
  );

  const openCreateModal = () => {
    setEditingPlanId(null);
    setTitle('');
    setDurationMonths('1');
    setFeeBdt('4500');
    setSelectedPerks(['Full Gym & Cardio Floor', 'Dedicated Locker']);
    setCustomPerkText('');
    setIsPopular(false);
    setEditorModalVisible(true);
  };

  const openEditModal = (plan: GymMembershipPlan) => {
    setEditingPlanId(plan.id);
    setTitle(plan.title);
    setDurationMonths(String(plan.durationMonths));
    setFeeBdt(String(plan.feeBdt));
    setSelectedPerks(plan.features || []);
    setCustomPerkText('');
    setIsPopular(!!plan.isPopular);
    setEditorModalVisible(true);
  };

  const togglePerk = (perk: string) => {
    setSelectedPerks((prev) =>
      prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]
    );
  };

  const addCustomPerk = () => {
    if (!customPerkText.trim()) return;
    if (!selectedPerks.includes(customPerkText.trim())) {
      setSelectedPerks((prev) => [...prev, customPerkText.trim()]);
    }
    setCustomPerkText('');
  };

  const handleSavePlan = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for this membership package.');
      return;
    }
    const parsedDuration = parseInt(durationMonths, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in months (e.g. 1, 3, 6, 12).');
      return;
    }
    const parsedFee = parseFloat(feeBdt);
    if (isNaN(parsedFee) || parsedFee <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid package fee in BDT.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlanId) {
        await updateMembershipPlan(editingPlanId, {
          title: title.trim(),
          durationMonths: parsedDuration,
          feeBdt: parsedFee,
          features: selectedPerks,
          isPopular,
        });
      } else {
        await addMembershipPlan({
          type: title.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'),
          title: title.trim(),
          durationMonths: parsedDuration,
          feeBdt: parsedFee,
          features: selectedPerks,
          isPopular,
          isActive: true,
        });
      }

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setEditorModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = (plan: GymMembershipPlan) => {
    Alert.alert(
      'Delete Package?',
      `Are you sure you want to delete "${plan.title}"? Existing members will keep their current memberships, but this plan won't be available for new enrollments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMembershipPlan(plan.id);
            if (Platform.OS !== 'web') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Membership Packages</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {activePlansCount} of {membershipPlans.length} plans active • Pricing & Duration Tiering
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                openCreateModal();
              }}
              style={[styles.addPlanBtn, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="add" size={16} color="#000" />
              <Text style={styles.addPlanBtnText}>New Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PLAN LIST */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {membershipPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="card-membership" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No membership packages found. Tap "New Plan" above to create your first package.
              </Text>
            </View>
          ) : (
            membershipPlans.map((plan) => {
              const monthlyEquivalent = Math.round(plan.feeBdt / plan.durationMonths);
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: plan.isPopular ? colors.primary : colors.border,
                      opacity: plan.isActive ? 1 : 0.6,
                    },
                  ]}>
                  {/* TOP BADGES */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View
                        style={[
                          styles.durationBadge,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                        ]}>
                        <MaterialIcons name="schedule" size={12} color={colors.textPrimary} />
                        <Text style={[styles.durationBadgeText, { color: colors.textPrimary }]}>
                          {plan.durationMonths === 1
                            ? '1 Month'
                            : plan.durationMonths === 12
                            ? '1 Year (12 Mo)'
                            : `${plan.durationMonths} Months`}
                        </Text>
                      </View>

                      {plan.isPopular && (
                        <View style={[styles.popularBadge, { backgroundColor: C.primaryAlpha20 }]}>
                          <MaterialIcons name="star" size={12} color={colors.primary} />
                          <Text style={[styles.popularBadgeText, { color: colors.primary }]}>
                            BEST VALUE
                          </Text>
                        </View>
                      )}

                      {!plan.isActive && (
                        <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(250, 82, 82, 0.15)' }]}>
                          <Text style={{ fontSize: 9, fontFamily: F.monoBold, color: '#FA5252' }}>
                            DISABLED
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* ACTIONS */}
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => openEditModal(plan)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.actionIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                        <MaterialIcons name="edit" size={15} color={colors.textPrimary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeletePlan(plan)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.actionIconBtn, { backgroundColor: isDark ? 'rgba(250,82,82,0.1)' : 'rgba(250,82,82,0.06)' }]}>
                        <MaterialIcons name="delete-outline" size={15} color="#FA5252" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* TITLE & PRICE */}
                  <View style={styles.cardTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{plan.title}</Text>
                      {plan.durationMonths > 1 && (
                        <Text style={[styles.monthlyEquivText, { color: colors.textSecondary }]}>
                          ~৳{monthlyEquivalent.toLocaleString()} / month equivalent
                        </Text>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.planFee, { color: plan.isPopular ? colors.primary : colors.textPrimary }]}>
                        ৳{plan.feeBdt.toLocaleString()}
                      </Text>
                      <Text style={[styles.feeSub, { color: colors.textMuted }]}>
                        Total package fee
                      </Text>
                    </View>
                  </View>

                  {/* FEATURE PERKS */}
                  {plan.features && plan.features.length > 0 && (
                    <View style={styles.perksContainer}>
                      {plan.features.map((feature, idx) => (
                        <View
                          key={idx}
                          style={styles.perkChip}>
                          <MaterialIcons name="check" size={13} color={isDark ? '#89FE00' : '#059669'} />
                          <Text style={[styles.perkChipText, { color: colors.textSecondary }]}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* BOTTOM TOGGLE */}
                  <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={{ fontSize: 11, fontFamily: F.sans, color: colors.textSecondary }}>
                      {plan.isActive ? 'Active for new enrollments' : 'Hidden from registration form'}
                    </Text>
                    <Switch
                      value={plan.isActive}
                      onValueChange={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        void toggleMembershipPlanActive(plan.id);
                      }}
                      trackColor={{ false: '#3e3e3e', true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ----------------- CREATE / EDIT PLAN SUBMODAL ----------------- */}
        <Modal
          visible={editorModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditorModalVisible(false)}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {editingPlanId ? 'Edit Package' : 'Create New Package'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Define duration, pricing, and perks included
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditorModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.editorScroll} showsVerticalScrollIndicator={false}>
              {/* PLAN TITLE */}
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>PACKAGE NAME *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Ramadan Special / Student Semester / Couple Pass"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              {/* DURATION */}
              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                DURATION (MONTHS) *
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {PRESET_DURATIONS.map((dur) => (
                  <TouchableOpacity
                    key={dur.months}
                    onPress={() => setDurationMonths(String(dur.months))}
                    style={[
                      styles.presetDurPill,
                      durationMonths === String(dur.months)
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <Text
                      style={{
                        fontFamily: F.sansBold,
                        fontSize: 11,
                        color: durationMonths === String(dur.months) ? '#000' : colors.textPrimary,
                      }}>
                      {dur.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="or enter custom months (e.g. 2, 4, 9)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={durationMonths}
                onChangeText={setDurationMonths}
              />

              {/* PRICING */}
              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                PACKAGE FEE (BDT ৳) *
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. 4500"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={feeBdt}
                onChangeText={setFeeBdt}
              />

              {/* POPULAR TOGGLE */}
              <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.sansBold, fontSize: 13, color: colors.textPrimary }}>
                    Highlight as "Best Value / Popular"
                  </Text>
                  <Text style={{ fontFamily: F.sans, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    Displays a prominent star badge on the card
                  </Text>
                </View>
                <Switch
                  value={isPopular}
                  onValueChange={setIsPopular}
                  trackColor={{ false: '#3e3e3e', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* PERKS INCLUSIONS */}
              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                INCLUDED PERKS & BENEFITS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {DEFAULT_PRESET_PERKS.map((perk) => {
                  const isSel = selectedPerks.includes(perk);
                  return (
                    <TouchableOpacity
                      key={perk}
                      onPress={() => togglePerk(perk)}
                      style={[
                        styles.perkSelectPill,
                        isSel
                          ? { backgroundColor: C.primaryAlpha20, borderColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}>
                      <MaterialIcons
                        name={isSel ? 'check-box' : 'check-box-outline-blank'}
                        size={14}
                        color={isSel ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: isSel ? F.sansBold : F.sans,
                          color: isSel ? colors.primary : colors.textPrimary,
                        }}>
                        {perk}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CUSTOM PERK ADDER */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TextInput
                  style={[
                    styles.formInput,
                    { flex: 1, backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  placeholder="+ Add custom benefit (e.g. Free Shaker)"
                  placeholderTextColor={colors.textMuted}
                  value={customPerkText}
                  onChangeText={setCustomPerkText}
                  onSubmitEditing={addCustomPerk}
                />
                <TouchableOpacity
                  onPress={addCustomPerk}
                  style={[styles.addPerkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ fontFamily: F.sansBold, color: colors.textPrimary, fontSize: 12 }}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSubmitting}
                onPress={handleSavePlan}
                style={[styles.submitPlanBtn, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={20} color="#000" />
                <Text style={{ color: '#000', fontFamily: F.sansBold, fontSize: 15 }}>
                  {isSubmitting
                    ? 'Saving...'
                    : editingPlanId
                    ? 'Update Membership Package'
                    : 'Create Package'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: F.sansBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addPlanBtnText: {
    fontSize: 12,
    fontFamily: F.sansBold,
    color: '#000',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: F.sans,
    lineHeight: 18,
  },
  planCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 11,
    fontFamily: F.sansBold,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 10,
    fontFamily: F.monoBold,
    letterSpacing: 0.5,
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: F.sansBold,
  },
  monthlyEquivText: {
    fontSize: 11,
    fontFamily: F.sans,
    marginTop: 2,
  },
  planFee: {
    fontSize: 18,
    fontFamily: F.monoBold,
  },
  feeSub: {
    fontSize: 9,
    fontFamily: F.sans,
    marginTop: 1,
  },
  perksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkChipText: {
    fontSize: 11,
    fontFamily: F.sans,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  editorScroll: {
    padding: 20,
    paddingBottom: 60,
  },
  formLabel: {
    fontSize: 10,
    fontFamily: F.mono,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: F.sans,
  },
  presetDurPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  perkSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  addPerkBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
});
