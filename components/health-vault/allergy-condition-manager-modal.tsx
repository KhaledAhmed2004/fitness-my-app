import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';
import { AllergySeverity, AllergyType, ConditionStatus } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

const ALLERGY_TYPES: { type: AllergyType; label: string }[] = [
  { type: 'MEDICATION', label: 'Medication' },
  { type: 'FOOD', label: 'Food' },
  { type: 'ENVIRONMENTAL', label: 'Environmental' },
  { type: 'OTHER', label: 'Other' },
];

const SEVERITIES: { severity: AllergySeverity; label: string; color: string }[] = [
  { severity: 'MILD', label: 'Mild', color: '#51CF66' },
  { severity: 'MODERATE', label: 'Moderate', color: '#FF922B' },
  { severity: 'SEVERE', label: 'Severe', color: '#FF6B6B' },
];

const CONDITION_STATUSES: { status: ConditionStatus; label: string }[] = [
  { status: 'ACTIVE', label: 'Active' },
  { status: 'MANAGED', label: 'Managed / Under Control' },
  { status: 'RESOLVED', label: 'Resolved / Past' },
];

interface AllergyConditionManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllergyConditionManagerModal({
  visible,
  onClose,
}: AllergyConditionManagerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const allergies = useHealthVaultStore((s) => s.allergies);
  const healthConditions = useHealthVaultStore((s) => s.healthConditions);
  const addAllergy = useHealthVaultStore((s) => s.addAllergy);
  const removeAllergy = useHealthVaultStore((s) => s.removeAllergy);
  const addHealthCondition = useHealthVaultStore((s) => s.addHealthCondition);
  const removeHealthCondition = useHealthVaultStore((s) => s.removeHealthCondition);

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [subTab, setSubTab] = useState<'ALLERGIES' | 'CONDITIONS'>('ALLERGIES');
  const [isAdding, setIsAdding] = useState(false);

  // Allergy Form
  const [allergen, setAllergen] = useState('');
  const [algType, setAlgType] = useState<AllergyType>('MEDICATION');
  const [algSeverity, setAlgSeverity] = useState<AllergySeverity>('SEVERE');
  const [algReaction, setAlgReaction] = useState('');
  const [algCritical, setAlgCritical] = useState(true);

  // Condition Form
  const [condName, setCondName] = useState('');
  const [condStatus, setCondStatus] = useState<ConditionStatus>('MANAGED');
  const [condDiagnosedDate, setCondDiagnosedDate] = useState('2022-01-15');
  const [condNotes, setCondNotes] = useState('');
  const [condCritical, setCondCritical] = useState(true);

  const memberAllergies = useMemo(
    () => allergies.filter((a) => a.memberId === activeMemberId),
    [allergies, activeMemberId]
  );

  const memberConditions = useMemo(
    () => healthConditions.filter((c) => c.memberId === activeMemberId),
    [healthConditions, activeMemberId]
  );

  const handleSaveAllergy = async () => {
    if (!allergen.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await addAllergy({
      memberId: activeMemberId,
      allergen: allergen.trim(),
      type: algType,
      severity: algSeverity,
      reaction: algReaction.trim() || undefined,
      isCritical: algCritical,
    });

    setAllergen('');
    setAlgReaction('');
    setIsAdding(false);
  };

  const handleSaveCondition = async () => {
    if (!condName.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await addHealthCondition({
      memberId: activeMemberId,
      conditionName: condName.trim(),
      status: condStatus,
      firstDiagnosedDate: condDiagnosedDate.trim() || undefined,
      notes: condNotes.trim() || undefined,
      isCritical: condCritical,
    });

    setCondName('');
    setCondNotes('');
    setIsAdding(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="healing" size={20} color="#A78BFA" />
              </View>
              <View>
                <Text style={styles.title}>Allergies & Conditions</Text>
                <Text style={styles.subtitle}>
                  Structured Clinical History & Emergency Alerts
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setIsAdding((prev) => !prev);
                }}
                style={styles.addBtn}>
                <MaterialIcons
                  name={isAdding ? 'close' : 'add'}
                  size={18}
                  color="#101416"
                />
                <Text style={styles.addBtnText}>
                  {isAdding ? 'Cancel' : subTab === 'ALLERGIES' ? 'Add Allergy' : 'Add Condition'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MEMBER TABS */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              {members.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveMemberId(m.id);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: '#A78BFA',
                        borderColor: '#A78BFA',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#101416', fontFamily: F.bold },
                      ]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUB-TABS (ALLERGIES vs CONDITIONS) */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setSubTab('ALLERGIES');
                setIsAdding(false);
              }}
              style={[
                styles.subTabItem,
                subTab === 'ALLERGIES' && styles.subTabItemActive,
              ]}>
              <MaterialIcons
                name="warning"
                size={14}
                color={subTab === 'ALLERGIES' ? '#FF6B6B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.subTabText,
                  subTab === 'ALLERGIES' && { color: '#FF6B6B', fontFamily: F.bold },
                ]}>
                Allergies ({memberAllergies.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setSubTab('CONDITIONS');
                setIsAdding(false);
              }}
              style={[
                styles.subTabItem,
                subTab === 'CONDITIONS' && styles.subTabItemActive,
              ]}>
              <MaterialIcons
                name="favorite-border"
                size={14}
                color={subTab === 'CONDITIONS' ? '#A78BFA' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.subTabText,
                  subTab === 'CONDITIONS' && { color: '#A78BFA', fontFamily: F.bold },
                ]}>
                Conditions ({memberConditions.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {isAdding ? (
              subTab === 'ALLERGIES' ? (
                /* ADD ALLERGY FORM */
                <View style={styles.formCard}>
                  <Text style={[styles.formTitle, { color: '#FF6B6B' }]}>
                    RECORD NEW ALLERGY
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Allergen Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Penicillin, Sulfa, Peanuts, Latex"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={allergen}
                      onChangeText={setAllergen}
                    />
                  </View>

                  {/* Allergy Type Chips */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Allergy Category</Text>
                    <View style={styles.chipsGrid}>
                      {ALLERGY_TYPES.map((t) => {
                        const isSelected = algType === t.type;
                        return (
                          <TouchableOpacity
                            key={t.type}
                            onPress={() => setAlgType(t.type)}
                            style={[
                              styles.chip,
                              isSelected && styles.chipSelectedRed,
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected,
                              ]}>
                              {t.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Severity Chips */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Severity Level</Text>
                    <View style={styles.chipsGrid}>
                      {SEVERITIES.map((s) => {
                        const isSelected = algSeverity === s.severity;
                        return (
                          <TouchableOpacity
                            key={s.severity}
                            onPress={() => setAlgSeverity(s.severity)}
                            style={[
                              styles.chip,
                              isSelected && { backgroundColor: s.color },
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected,
                              ]}>
                              {s.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Known Reaction (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Severe hives, breathing difficulty"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={algReaction}
                      onChangeText={setAlgReaction}
                    />
                  </View>

                  {/* Mark as Critical Switch */}
                  <View style={styles.switchBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchBoxTitle}>
                        Mark as Critical for Emergency ID
                      </Text>
                      <Text style={styles.switchBoxSub}>
                        Highlighted on Emergency Medical Card
                      </Text>
                    </View>
                    <Switch
                      value={algCritical}
                      onValueChange={setAlgCritical}
                      trackColor={{ false: '#263035', true: '#FF6B6B' }}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleSaveAllergy}
                    style={[styles.saveBtn, { backgroundColor: '#FF6B6B' }]}>
                    <MaterialIcons name="check" size={18} color="#101416" />
                    <Text style={styles.saveBtnText}>Save Allergy</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ADD HEALTH CONDITION FORM */
                <View style={styles.formCard}>
                  <Text style={[styles.formTitle, { color: '#A78BFA' }]}>
                    RECORD CHRONIC HEALTH CONDITION
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Condition Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={condName}
                      onChangeText={setCondName}
                    />
                  </View>

                  {/* Condition Status */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Current Status</Text>
                    <View style={styles.chipsGrid}>
                      {CONDITION_STATUSES.map((cs) => {
                        const isSelected = condStatus === cs.status;
                        return (
                          <TouchableOpacity
                            key={cs.status}
                            onPress={() => setCondStatus(cs.status)}
                            style={[
                              styles.chip,
                              isSelected && styles.chipSelectedPurple,
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected,
                              ]}>
                              {cs.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>First Diagnosed Date / Year</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD or 2021"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={condDiagnosedDate}
                      onChangeText={setCondDiagnosedDate}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Clinical Notes / Regimen</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Controlled with daily walking and medication"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={condNotes}
                      onChangeText={setCondNotes}
                    />
                  </View>

                  {/* Mark as Critical Switch */}
                  <View style={styles.switchBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchBoxTitle}>
                        Expose on Emergency Medical ID
                      </Text>
                      <Text style={styles.switchBoxSub}>
                        Visible to first responders during emergency
                      </Text>
                    </View>
                    <Switch
                      value={condCritical}
                      onValueChange={setCondCritical}
                      trackColor={{ false: '#263035', true: '#A78BFA' }}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleSaveCondition}
                    style={[styles.saveBtn, { backgroundColor: '#A78BFA' }]}>
                    <MaterialIcons name="check" size={18} color="#101416" />
                    <Text style={styles.saveBtnText}>Save Health Condition</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              /* LISTINGS */
              subTab === 'ALLERGIES' ? (
                <View style={styles.listContainer}>
                  {memberAllergies.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <MaterialIcons name="verified-user" size={40} color="#20C997" />
                      <Text style={styles.emptyTitle}>No Allergies Recorded</Text>
                      <Text style={styles.emptySub}>
                        Tap "Add Allergy" to log medication, food, or environmental allergies.
                      </Text>
                    </View>
                  ) : (
                    memberAllergies.map((alg) => (
                      <View key={alg.id} style={styles.itemCard}>
                        <View style={styles.itemTop}>
                          <MaterialIcons name="warning" size={16} color="#FF6B6B" />
                          <Text style={styles.itemTitle}>{alg.allergen}</Text>
                          <View
                            style={[
                              styles.pill,
                              {
                                backgroundColor:
                                  alg.severity === 'SEVERE'
                                    ? 'rgba(255, 107, 107, 0.15)'
                                    : 'rgba(255, 146, 43, 0.15)',
                              },
                            ]}>
                            <Text
                              style={[
                                styles.pillText,
                                {
                                  color:
                                    alg.severity === 'SEVERE'
                                      ? '#FF6B6B'
                                      : '#FF922B',
                                },
                              ]}>
                              {alg.severity}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.itemSub}>
                          Category: {alg.type} •{' '}
                          {alg.isCritical ? '🚨 Critical Alert' : 'Standard'}
                        </Text>

                        {alg.reaction ? (
                          <Text style={styles.itemNotes}>
                            Reaction: {alg.reaction}
                          </Text>
                        ) : null}

                        <TouchableOpacity
                          onPress={() => removeAllergy(alg.id)}
                          style={styles.deleteBtn}>
                          <MaterialIcons name="delete-outline" size={14} color={C.onSurfaceVariant} />
                          <Text style={styles.deleteBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {memberConditions.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <MaterialIcons name="favorite" size={40} color="#20C997" />
                      <Text style={styles.emptyTitle}>No Chronic Conditions</Text>
                      <Text style={styles.emptySub}>
                        Tap "Add Condition" to record diabetes, hypertension, or asthma.
                      </Text>
                    </View>
                  ) : (
                    memberConditions.map((cond) => (
                      <View key={cond.id} style={styles.itemCard}>
                        <View style={styles.itemTop}>
                          <MaterialIcons name="healing" size={16} color="#A78BFA" />
                          <Text style={styles.itemTitle}>{cond.conditionName}</Text>
                          <View
                            style={[
                              styles.pill,
                              { backgroundColor: 'rgba(167, 139, 250, 0.15)' },
                            ]}>
                            <Text style={[styles.pillText, { color: '#A78BFA' }]}>
                              {cond.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.itemSub}>
                          First Recorded: {cond.firstDiagnosedDate || 'N/A'} •{' '}
                          {cond.isCritical ? '🚨 Emergency ID Enabled' : 'Private'}
                        </Text>

                        {cond.notes ? (
                          <Text style={styles.itemNotes}>{cond.notes}</Text>
                        ) : null}

                        <TouchableOpacity
                          onPress={() => removeHealthCondition(cond.id)}
                          style={styles.deleteBtn}>
                          <MaterialIcons name="delete-outline" size={14} color={C.onSurfaceVariant} />
                          <Text style={styles.deleteBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A78BFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  closeBtn: {
    padding: 6,
  },
  membersBar: {
    backgroundColor: '#141A1D',
    paddingVertical: 8,
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#1A2226',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181F23',
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabItemActive: {
    backgroundColor: '#20282E',
  },
  subTabText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  scrollBody: {
    padding: 16,
    gap: 14,
  },
  formCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  formTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  input: {
    backgroundColor: '#13191C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontFamily: F.medium,
    fontSize: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipSelectedRed: {
    backgroundColor: '#FF6B6B',
  },
  chipSelectedPurple: {
    backgroundColor: '#A78BFA',
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  chipTextSelected: {
    fontFamily: F.bold,
    color: '#101416',
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13191C',
    padding: 10,
    borderRadius: 10,
  },
  switchBoxTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  switchBoxSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
  listContainer: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  itemSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  itemNotes: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingTop: 4,
  },
  deleteBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 240,
  },
});
