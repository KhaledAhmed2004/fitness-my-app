import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  BLOOD_GROUPS,
  RELATION_CONFIG,
} from '@/components/health-vault/health-vault-constants';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';
import { BloodGroup, FamilyRelation } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

const RELATIONS: FamilyRelation[] = [
  'SELF',
  'FATHER',
  'MOTHER',
  'SPOUSE',
  'CHILD',
  'SIBLING',
  'OTHER',
];

interface FamilyMemberManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FamilyMemberManagerModal({
  visible,
  onClose,
}: FamilyMemberManagerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const addFamilyMember = useHealthVaultStore((s) => s.addFamilyMember);
  const deleteFamilyMember = useHealthVaultStore((s) => s.deleteFamilyMember);
  const addAllergy = useHealthVaultStore((s) => s.addAllergy);
  const addHealthCondition = useHealthVaultStore((s) => s.addHealthCondition);
  const allergies = useHealthVaultStore((s) => s.allergies);
  const healthConditions = useHealthVaultStore((s) => s.healthConditions);

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<FamilyRelation>('OTHER');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('UNKNOWN');
  const [allergiesText, setAllergiesText] = useState('');
  const [chronicText, setChronicText] = useState('');

  const handleSaveMember = async () => {
    if (!name.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const color = RELATION_CONFIG[relation]?.color || '#38BDF8';

    const memberId = await addFamilyMember({
      name: name.trim(),
      relation,
      bloodGroup,
      gender: relation === 'FATHER' || relation === 'SIBLING' ? 'MALE' : 'FEMALE',
      avatarColor: color,
    });

    // Save structured allergies
    const algList = allergiesText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    for (const alg of algList) {
      await addAllergy({
        memberId,
        allergen: alg,
        type: 'MEDICATION',
        severity: 'MODERATE',
        isCritical: true,
      });
    }

    // Save structured chronic conditions
    const condList = chronicText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    for (const cond of condList) {
      await addHealthCondition({
        memberId,
        conditionName: cond,
        status: 'MANAGED',
        isCritical: true,
      });
    }

    setName('');
    setRelation('OTHER');
    setBloodGroup('UNKNOWN');
    setAllergiesText('');
    setChronicText('');
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
                <MaterialIcons name="group" size={20} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Family Health Profiles</Text>
                <Text style={styles.subtitle}>
                  {members.length} Registered Family Members
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
                  {isAdding ? 'Cancel' : 'Add Member'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {isAdding ? (
              /* ADD MEMBER FORM */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>ADD FAMILY MEMBER PROFILE</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name / Nickname *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Father / আম্মা / Khaled"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Relation Chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Relation *</Text>
                  <View style={styles.chipsGrid}>
                    {RELATIONS.map((r) => {
                      const meta = RELATION_CONFIG[r];
                      const isSelected = relation === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setRelation(r);
                          }}
                          style={[
                            styles.chip,
                            isSelected && {
                              backgroundColor: meta.color,
                              borderColor: meta.color,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && {
                                color: '#101416',
                                fontFamily: F.bold,
                              },
                            ]}>
                            {meta.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Blood Group Chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Blood Group</Text>
                  <View style={styles.chipsGrid}>
                    {BLOOD_GROUPS.map((bg) => {
                      const isSelected = bloodGroup === bg;
                      return (
                        <TouchableOpacity
                          key={bg}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setBloodGroup(bg);
                          }}
                          style={[
                            styles.bloodChip,
                            isSelected && styles.bloodChipSelected,
                          ]}>
                          <Text
                            style={[
                              styles.bloodChipText,
                              isSelected && styles.bloodChipTextSelected,
                            ]}>
                            {bg}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Known Allergies (Comma separated)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Penicillin, Sulfa, Dust"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={allergiesText}
                    onChangeText={setAllergiesText}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Chronic Health Conditions (Comma separated)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Hypertension, Diabetes Type 2, Asthma"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={chronicText}
                    onChangeText={setChronicText}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveMember}
                  style={styles.saveBtn}>
                  <MaterialIcons name="check" size={18} color="#101416" />
                  <Text style={styles.saveBtnText}>Save Family Member</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* MEMBER LIST */
              <View style={styles.membersList}>
                {members.map((mem) => {
                  const relMeta = RELATION_CONFIG[mem.relation] || RELATION_CONFIG.OTHER;
                  const memAllergies = allergies.filter((a) => a.memberId === mem.id);
                  const memConditions = healthConditions.filter((c) => c.memberId === mem.id);

                  return (
                    <View key={mem.id} style={styles.memberCard}>
                      <View style={styles.memberTop}>
                        <View
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: `${mem.avatarColor}20` },
                          ]}>
                          <MaterialIcons
                            name={relMeta.icon}
                            size={20}
                            color={mem.avatarColor}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{mem.name}</Text>
                          <Text style={styles.memberRel}>{relMeta.label}</Text>
                        </View>

                        {mem.bloodGroup !== 'UNKNOWN' && (
                          <View style={styles.bloodBadge}>
                            <MaterialIcons name="bloodtype" size={12} color="#F43F5E" />
                            <Text style={styles.bloodBadgeText}>{mem.bloodGroup}</Text>
                          </View>
                        )}
                      </View>

                      {/* Allergies & Chronic Conditions */}
                      {(memAllergies.length > 0 || memConditions.length > 0) && (
                        <View style={styles.tagsContainer}>
                          {memAllergies.map((alg) => (
                            <View key={alg.id} style={styles.allergyTag}>
                              <MaterialIcons name="warning" size={10} color="#FF6B6B" />
                              <Text style={styles.allergyTagText}>
                                Allergy: {alg.allergen}
                              </Text>
                            </View>
                          ))}

                          {memConditions.map((chr) => (
                            <View key={chr.id} style={styles.chronicTag}>
                              <MaterialIcons name="healing" size={10} color="#A78BFA" />
                              <Text style={styles.chronicTagText}>
                                {chr.conditionName}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Delete Action (if not Self) */}
                      {mem.relation !== 'SELF' && (
                        <TouchableOpacity
                          onPress={() => deleteFamilyMember(mem.id)}
                          style={styles.deleteAction}>
                          <MaterialIcons name="delete-outline" size={14} color="#FA5252" />
                          <Text style={styles.deleteActionText}>Remove Profile</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
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
    backgroundColor: '#38BDF8',
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
    color: '#38BDF8',
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  bloodChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bloodChipSelected: {
    backgroundColor: '#F43F5E',
  },
  bloodChipText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  bloodChipTextSelected: {
    color: '#FFFFFF',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  memberRel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bloodBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#F43F5E',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allergyTagText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#FF6B6B',
  },
  chronicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chronicTagText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#A78BFA',
  },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingTop: 4,
  },
  deleteActionText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#FA5252',
  },
});
