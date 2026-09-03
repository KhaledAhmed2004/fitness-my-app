import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  DISEASE_METADATA,
  evaluateDiseaseHereditaryRisk,
  generateCompleteFamilyHereditaryReport,
  generateGeminiGenomicForecast,
} from '@/services/family-hereditary-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import {
  AncestorConditionEntry,
  FamilyAncestorRecord,
  HereditaryDiseaseType,
  PreventiveScreeningMilestone,
} from '@/types/family-hereditary';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const ALL_HEREDITARY_DISEASES: HereditaryDiseaseType[] = [
  'TYPE_2_DIABETES',
  'HYPERTENSION',
  'CORONARY_CAD',
  'THYROID_DISORDER',
  'DYSLIPIDEMIA_CHOLESTEROL',
  'COLORECTAL_RISK',
  'GLAUCOMA',
  'OSTEOPOROSIS',
];

interface FamilyHereditaryTreeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FamilyHereditaryTreeModal({
  visible,
  onClose,
}: FamilyHereditaryTreeModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const ancestors = useHealthVaultStore((s) => s.ancestors);
  const addAncestorCondition = useHealthVaultStore((s) => s.addAncestorCondition);
  const removeAncestorCondition = useHealthVaultStore((s) => s.removeAncestorCondition);
  const scheduleMilestoneInCalendar = useHealthVaultStore((s) => s.scheduleMilestoneInCalendar);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeChildMemberId, setActiveChildMemberId] = useState(initialMemberId);
  const [activeTab, setActiveTab] = useState<'TREE' | 'RISK_MATRIX' | 'SCREENING'>('TREE');

  // Selected Ancestor for editing
  const [editingAncestor, setEditingAncestor] = useState<FamilyAncestorRecord | null>(null);
  const [newDiseaseType, setNewDiseaseType] = useState<HereditaryDiseaseType>('TYPE_2_DIABETES');
  const [newDiagnosedAge, setNewDiagnosedAge] = useState('50');

  // AI Forecast state
  const [aiForecastText, setAiForecastText] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [scheduledMilestoneIds, setScheduledMilestoneIds] = useState<string[]>([]);

  const targetMember = members.find((m) => m.id === activeChildMemberId) || members[0];
  const targetMemberName = targetMember?.name || 'Khaled';

  // Compute Full Report
  const hereditaryReport = useMemo(() => {
    return generateCompleteFamilyHereditaryReport(
      ancestors,
      targetMemberName,
      currentLanguage
    );
  }, [ancestors, targetMemberName, currentLanguage]);

  useEffect(() => {
    if (visible && !aiForecastText) {
      void runAiGenomicForecast();
    }
  }, [visible, ancestors, targetMemberName, currentLanguage]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const runAiGenomicForecast = async () => {
    setIsAiLoading(true);
    try {
      const text = await generateGeminiGenomicForecast(
        ancestors,
        targetMemberName,
        currentLanguage
      );
      setAiForecastText(text);
    } catch (err) {
      console.warn('AI Forecast failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddConditionToAncestor = async () => {
    if (!editingAncestor) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const age = parseInt(newDiagnosedAge, 10) || 50;

    await addAncestorCondition(editingAncestor.id, {
      disease: newDiseaseType,
      diagnosedAge: age,
      notes: `Diagnosed around age ${age}`,
    });

    const updated = useHealthVaultStore
      .getState()
      .ancestors.find((a) => a.id === editingAncestor.id);
    if (updated) setEditingAncestor(updated);

    showToast('✅ Family health condition recorded!');
  };

  const handleRemoveCondition = async (condId: string) => {
    if (!editingAncestor) return;
    void Haptics.selectionAsync().catch(() => {});
    await removeAncestorCondition(editingAncestor.id, condId);

    const updated = useHealthVaultStore
      .getState()
      .ancestors.find((a) => a.id === editingAncestor.id);
    if (updated) setEditingAncestor(updated);
  };

  const handleScheduleMilestone = async (m: PreventiveScreeningMilestone) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await scheduleMilestoneInCalendar(m, activeChildMemberId);
      setScheduledMilestoneIds((prev) => [...prev, m.id]);
      showToast(`✅ Scheduled: ${m.testName} added to Care Calendar!`);
    } catch (err) {
      Alert.alert('Scheduling Error', 'Could not schedule milestone in calendar.');
    }
  };

  const handleExportPedigreeReport = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    let reportText = `
🌳 FAMILY HEREDITARY RISK & PREVENTIVE SCREENING REPORT
======================================================
Target Descendant: ${targetMemberName}
Generated: ${new Date().toLocaleDateString()}
Overall Hereditary Index: ${hereditaryReport.overallFamilyHereditaryIndex}%

🧬 IDENTIFIED HEREDITARY RISK PREDILECTIONS:
`;

    hereditaryReport.riskAssessments
      .filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'MODERATE')
      .forEach((r, idx) => {
        reportText += `\n${idx + 1}. ${r.diseaseName} [${r.riskLevel} RISK - ${r.riskScore}%]\n• Ancestors: ${r.contributingAncestors.map((c) => `${c.name} (${c.relation})`).join(', ')}\n• Bilateral: ${r.bilateralTransmission ? 'YES' : 'NO'}\n• Clinical: ${r.clinicalRationale}\n`;
      });

    reportText += `\n📅 PREVENTIVE SCREENING AGE ROADMAP FOR ${targetMemberName.toUpperCase()}:\n`;
    hereditaryReport.upcomingMilestonesSortedByAge.forEach((m, idx) => {
      reportText += `\n• Age ${m.targetAge}: ${m.testName} (${m.frequency}) - ${m.clinicalObjective}`;
    });

    if (aiForecastText) {
      reportText += `\n\n🧠 AI GENOMIC CLINICAL SYNTHESIS:\n${aiForecastText}`;
    }

    reportText += '\n\n(TrackMe Family Health Genomics Guard)';

    await Clipboard.setStringAsync(reportText.trim());
    showToast('📋 Pedigree Report Copied to Clipboard!');

    Alert.alert('Share Pedigree Report', 'Report copied to clipboard! Share via WhatsApp with physician or family?', [
      { text: 'Later', style: 'cancel' },
      {
        text: 'WhatsApp',
        onPress: () => {
          void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(reportText.trim())}`).catch(() => {
            void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(reportText.trim())}`).catch(() => {});
          });
        },
      },
    ]);
  };

  // Group ancestors for visual pedigree tree
  const patGf = ancestors.find((a) => a.relation === 'PATERNAL_GRANDFATHER');
  const patGm = ancestors.find((a) => a.relation === 'PATERNAL_GRANDMOTHER');
  const matGf = ancestors.find((a) => a.relation === 'MATERNAL_GRANDFATHER');
  const matGm = ancestors.find((a) => a.relation === 'MATERNAL_GRANDMOTHER');
  const father = ancestors.find((a) => a.relation === 'FATHER');
  const mother = ancestors.find((a) => a.relation === 'MOTHER');

  const getRiskBadgeColor = (level: string) => {
    if (level === 'HIGH') return '#FF6B6B';
    if (level === 'MODERATE') return '#FCC419';
    if (level === 'AVERAGE') return '#38BDF8';
    return '#20C997';
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
                <MaterialIcons name="account-tree" size={22} color="#20C997" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Family Hereditary Risk Tree</Text>
                <Text style={styles.subtitle}>
                  Multi-Generation Pedigree & Preventive Screening Roadmap
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          {feedbackToast && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{feedbackToast}</Text>
            </View>
          )}

          {/* TARGET CHILD / MEMBER SELECTOR */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              {members.map((m) => {
                const isSelected = activeChildMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setActiveChildMemberId(m.id);
                    }}
                    style={[
                      styles.memberChip,
                      isSelected && {
                        backgroundColor: '#20C997',
                        borderColor: '#20C997',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#101416', fontFamily: F.bold },
                      ]}>
                      Forecast for: {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUB-TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('TREE');
              }}
              style={[styles.tabBtn, activeTab === 'TREE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="device-hub"
                size={16}
                color={activeTab === 'TREE' ? '#20C997' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'TREE' && styles.tabBtnTextActive,
                ]}>
                Pedigree Tree
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('RISK_MATRIX');
              }}
              style={[styles.tabBtn, activeTab === 'RISK_MATRIX' && styles.tabBtnActive]}>
              <MaterialIcons
                name="analytics"
                size={16}
                color={activeTab === 'RISK_MATRIX' ? '#20C997' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'RISK_MATRIX' && styles.tabBtnTextActive,
                ]}>
                Hereditary Risks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('SCREENING');
              }}
              style={[styles.tabBtn, activeTab === 'SCREENING' && styles.tabBtnActive]}>
              <MaterialIcons
                name="event-note"
                size={16}
                color={activeTab === 'SCREENING' ? '#20C997' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'SCREENING' && styles.tabBtnTextActive,
                ]}>
                Screening Roadmap ({hereditaryReport.upcomingMilestonesSortedByAge.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN BODY SCROLL */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {activeTab === 'TREE' && (
              /* ================= TAB 1: PEDIGREE GENOGRAM TREE ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.treeInstructionsCard}>
                  <MaterialIcons name="touch-app" size={16} color="#20C997" />
                  <Text style={styles.treeInstructionsText}>
                    Tap any family member card below to record or update their known medical conditions and age of diagnosis.
                  </Text>
                </View>

                {/* GENERATION 1: GRANDPARENTS */}
                <View style={styles.genSection}>
                  <Text style={styles.genHeader}>1ST GENERATION: GRANDPARENTS</Text>
                  
                  <View style={styles.genRow}>
                    {/* Paternal Side */}
                    <View style={styles.branchBox}>
                      <Text style={styles.branchTitle}>PATERNAL (BABA'S SIDE)</Text>
                      <View style={styles.coupleRow}>
                        {patGf && (
                          <TouchableOpacity
                            onPress={() => setEditingAncestor(patGf)}
                            style={[
                              styles.nodeCard,
                              editingAncestor?.id === patGf.id && styles.nodeCardActive,
                            ]}>
                            <Text style={styles.nodeRole}>👴 Dada</Text>
                            <Text style={styles.nodeName} numberOfLines={1}>
                              {patGf.name.replace(/\(.*\)/, '')}
                            </Text>
                            <View style={styles.nodeBadges}>
                              {patGf.conditions.map((c, i) => (
                                <View key={i} style={styles.nodeBadge}>
                                  <Text style={styles.nodeBadgeText}>
                                    {c.disease === 'TYPE_2_DIABETES'
                                      ? '🩸 DM'
                                      : c.disease === 'HYPERTENSION'
                                      ? '🫀 HTN'
                                      : '🩺'}
                                  </Text>
                                </View>
                              ))}
                              {patGf.conditions.length === 0 && (
                                <Text style={styles.healthyLabel}>Healthy</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}

                        {patGm && (
                          <TouchableOpacity
                            onPress={() => setEditingAncestor(patGm)}
                            style={[
                              styles.nodeCard,
                              editingAncestor?.id === patGm.id && styles.nodeCardActive,
                            ]}>
                            <Text style={styles.nodeRole}>👵 Dadi</Text>
                            <Text style={styles.nodeName} numberOfLines={1}>
                              {patGm.name.replace(/\(.*\)/, '')}
                            </Text>
                            <View style={styles.nodeBadges}>
                              {patGm.conditions.map((c, i) => (
                                <View key={i} style={styles.nodeBadge}>
                                  <Text style={styles.nodeBadgeText}>{c.disease}</Text>
                                </View>
                              ))}
                              {patGm.conditions.length === 0 && (
                                <Text style={styles.healthyLabel}>Healthy</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Maternal Side */}
                    <View style={styles.branchBox}>
                      <Text style={styles.branchTitle}>MATERNAL (MA'S SIDE)</Text>
                      <View style={styles.coupleRow}>
                        {matGf && (
                          <TouchableOpacity
                            onPress={() => setEditingAncestor(matGf)}
                            style={[
                              styles.nodeCard,
                              editingAncestor?.id === matGf.id && styles.nodeCardActive,
                            ]}>
                            <Text style={styles.nodeRole}>👴 Nana</Text>
                            <Text style={styles.nodeName} numberOfLines={1}>
                              {matGf.name.replace(/\(.*\)/, '')}
                            </Text>
                            <View style={styles.nodeBadges}>
                              {matGf.conditions.map((c, i) => (
                                <View key={i} style={styles.nodeBadge}>
                                  <Text style={styles.nodeBadgeText}>
                                    {c.disease === 'HYPERTENSION' ? '🫀 HTN' : '🩺'}
                                  </Text>
                                </View>
                              ))}
                              {matGf.conditions.length === 0 && (
                                <Text style={styles.healthyLabel}>Healthy</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}

                        {matGm && (
                          <TouchableOpacity
                            onPress={() => setEditingAncestor(matGm)}
                            style={[
                              styles.nodeCard,
                              editingAncestor?.id === matGm.id && styles.nodeCardActive,
                            ]}>
                            <Text style={styles.nodeRole}>👵 Nani</Text>
                            <Text style={styles.nodeName} numberOfLines={1}>
                              {matGm.name.replace(/\(.*\)/, '')}
                            </Text>
                            <View style={styles.nodeBadges}>
                              {matGm.conditions.map((c, i) => (
                                <View key={i} style={styles.nodeBadge}>
                                  <Text style={styles.nodeBadgeText}>
                                    {c.disease === 'THYROID_DISORDER'
                                      ? '🦋 Thyroid'
                                      : c.disease === 'OSTEOPOROSIS'
                                      ? '🦴 Bone'
                                      : '🩺'}
                                  </Text>
                                </View>
                              ))}
                              {matGm.conditions.length === 0 && (
                                <Text style={styles.healthyLabel}>Healthy</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* GENERATION 2: PARENTS */}
                <View style={styles.genSection}>
                  <Text style={styles.genHeader}>2ND GENERATION: PARENTS</Text>
                  <View style={styles.parentsRow}>
                    {father && (
                      <TouchableOpacity
                        onPress={() => setEditingAncestor(father)}
                        style={[
                          styles.parentNodeCard,
                          editingAncestor?.id === father.id && styles.nodeCardActive,
                        ]}>
                        <Text style={styles.nodeRole}>👨 Father</Text>
                        <Text style={styles.parentNodeName}>{father.name}</Text>
                        <View style={styles.nodeBadges}>
                          {father.conditions.map((c, i) => (
                            <View key={i} style={[styles.nodeBadge, { backgroundColor: 'rgba(255,107,107,0.18)' }]}>
                              <Text style={[styles.nodeBadgeText, { color: '#FF6B6B' }]}>
                                {c.disease === 'HYPERTENSION' ? '🫀 HTN (Age 46)' : c.disease}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </TouchableOpacity>
                    )}

                    {mother && (
                      <TouchableOpacity
                        onPress={() => setEditingAncestor(mother)}
                        style={[
                          styles.parentNodeCard,
                          editingAncestor?.id === mother.id && styles.nodeCardActive,
                        ]}>
                        <Text style={styles.nodeRole}>👩 Mother</Text>
                        <Text style={styles.parentNodeName}>{mother.name}</Text>
                        <View style={styles.nodeBadges}>
                          {mother.conditions.map((c, i) => (
                            <View key={i} style={[styles.nodeBadge, { backgroundColor: 'rgba(56,189,248,0.18)' }]}>
                              <Text style={[styles.nodeBadgeText, { color: '#38BDF8' }]}>
                                {c.disease === 'TYPE_2_DIABETES'
                                  ? '🩸 DM (Age 49)'
                                  : c.disease === 'THYROID_DISORDER'
                                  ? '🦋 Thyroid (Age 42)'
                                  : c.disease}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* GENERATION 3: TARGET CHILD */}
                <View style={styles.genSection}>
                  <Text style={styles.genHeader}>3RD GENERATION: TARGET DESCENDANT</Text>
                  <View style={styles.childHeroNode}>
                    <MaterialIcons name="person" size={24} color="#20C997" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.childHeroTitle}>👦 {targetMemberName}</Text>
                      <Text style={styles.childHeroSub}>
                        Forecasting hereditary risks & preventive milestones from {ancestors.length} ancestors.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ANCESTOR CONDITION EDITOR MODAL / SHEET */}
                {editingAncestor && (
                  <View style={styles.editorCard}>
                    <View style={styles.editorHeader}>
                      <Text style={styles.editorTitle}>
                        EDIT HEALTH HISTORY: {editingAncestor.name}
                      </Text>
                      <TouchableOpacity onPress={() => setEditingAncestor(null)}>
                        <MaterialIcons name="close" size={18} color={C.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>

                    {/* Current Conditions */}
                    <View style={styles.existingConditionsWrap}>
                      <Text style={styles.editorSectionLabel}>ACTIVE RECORDED CONDITIONS:</Text>
                      {editingAncestor.conditions.length === 0 ? (
                        <Text style={styles.noConditionsText}>No chronic conditions logged.</Text>
                      ) : (
                        editingAncestor.conditions.map((c) => (
                          <View key={c.id} style={styles.condItemRow}>
                            <Text style={styles.condItemText}>
                              • {DISEASE_METADATA[c.disease]?.nameEn || c.disease}{' '}
                              {c.diagnosedAge ? `(Diagnosed at age ${c.diagnosedAge})` : ''}
                            </Text>
                            <TouchableOpacity onPress={() => handleRemoveCondition(c.id)}>
                              <MaterialIcons name="delete-outline" size={16} color="#FF6B6B" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>

                    {/* Add Condition Picker */}
                    <View style={styles.addCondBox}>
                      <Text style={styles.editorSectionLabel}>+ ADD CHRONIC ILLNESS:</Text>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.diseasePickerScroll}>
                        {ALL_HEREDITARY_DISEASES.map((d) => {
                          const isSelected = newDiseaseType === d;
                          return (
                            <TouchableOpacity
                              key={d}
                              onPress={() => setNewDiseaseType(d)}
                              style={[
                                styles.diseasePickerChip,
                                isSelected && styles.diseasePickerChipActive,
                              ]}>
                              <Text
                                style={[
                                  styles.diseasePickerText,
                                  isSelected && styles.diseasePickerTextActive,
                                ]}>
                                {DISEASE_METADATA[d].nameEn.split(' ')[0]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <View style={styles.ageInputRow}>
                        <Text style={styles.ageInputLabel}>Diagnosed Around Age:</Text>
                        <TextInput
                          style={styles.ageTextInput}
                          keyboardType="numeric"
                          value={newDiagnosedAge}
                          onChangeText={setNewDiagnosedAge}
                          placeholder="50"
                          placeholderTextColor={C.onSurfaceVariant}
                        />
                        <TouchableOpacity
                          onPress={handleAddConditionToAncestor}
                          style={styles.addCondBtn}>
                          <MaterialIcons name="add" size={18} color="#101416" />
                          <Text style={styles.addCondBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'RISK_MATRIX' && (
              /* ================= TAB 2: HEREDITARY RISK MATRIX & AI FORECAST ================= */
              <View style={styles.sectionWrap}>
                {/* AI GENOMIC FORECAST SYNTHESIS */}
                <View style={styles.aiInsightCard}>
                  <View style={styles.aiHeaderRow}>
                    <MaterialIcons name="psychology" size={20} color="#20C997" />
                    <Text style={styles.aiTitle}>GEMINI CLINICAL GENOMICS FORECAST</Text>
                    {isAiLoading && <ActivityIndicator size="small" color="#20C997" />}
                  </View>
                  <Text style={styles.aiBodyText}>
                    {aiForecastText || 'Generating multi-generational clinical synthesis...'}
                  </Text>
                </View>

                {/* DISEASE RISK GAUGES */}
                <View style={styles.hazardSection}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="biotech" size={18} color="#38BDF8" />
                    <Text style={styles.sectionHeading}>
                      HEREDITARY RISK PREDILECTION MATRIX
                    </Text>
                  </View>

                  {hereditaryReport.riskAssessments.map((res) => {
                    const badgeColor = getRiskBadgeColor(res.riskLevel);
                    return (
                      <View key={res.disease} style={styles.riskCard}>
                        <View style={styles.riskCardTop}>
                          <View style={styles.riskCardIconBox}>
                            <MaterialIcons name={res.icon as any} size={20} color={badgeColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.riskCardTitle}>{res.diseaseName}</Text>
                            <Text style={styles.riskCardSub}>
                              {res.contributingAncestors.length > 0
                                ? `Affected: ${res.contributingAncestors.map((c) => `${c.name} (${c.relation})`).join(', ')}`
                                : 'No direct family ancestors affected'}
                            </Text>
                          </View>
                          <View style={[styles.riskLevelBadge, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}>
                            <Text style={[styles.riskLevelText, { color: badgeColor }]}>
                              {res.riskLevel} ({res.riskScore}%)
                            </Text>
                          </View>
                        </View>

                        {/* Bilateral or Early-Onset alert */}
                        {res.bilateralTransmission && (
                          <View style={styles.bilateralAlert}>
                            <MaterialIcons name="warning" size={14} color="#FF6B6B" />
                            <Text style={styles.bilateralText}>
                              Bilateral Lineage Transmission (Both Maternal & Paternal sides positive)
                            </Text>
                          </View>
                        )}

                        <Text style={styles.riskRationale}>{res.clinicalRationale}</Text>

                        {/* Lifestyle Shield */}
                        <View style={styles.lifestyleShieldBox}>
                          <Text style={styles.lifestyleShieldTitle}>🛡️ PREVENTIVE LIFESTYLE SHIELD:</Text>
                          {res.lifestyleShield.map((s, i) => (
                            <Text key={i} style={styles.lifestyleItemText}>{s}</Text>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* EXPORT ACTION */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleExportPedigreeReport}
                  style={styles.exportReportBtn}>
                  <MaterialIcons name="share" size={18} color="#101416" />
                  <Text style={styles.exportReportBtnText}>
                    Export Complete Pedigree Report (WhatsApp)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'SCREENING' && (
              /* ================= TAB 3: PREVENTIVE SCREENING AGE ROADMAP ================= */
              <View style={styles.sectionWrap}>
                <View style={styles.roadmapHeroCard}>
                  <MaterialIcons name="timeline" size={20} color="#20C997" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roadmapHeroTitle}>
                      CHRONOLOGICAL PREVENTIVE SCREENING ROADMAP
                    </Text>
                    <Text style={styles.roadmapHeroSub}>
                      Evidence-based testing schedule for {targetMemberName} to detect conditions decades before symptoms emerge.
                    </Text>
                  </View>
                </View>

                {hereditaryReport.upcomingMilestonesSortedByAge.map((m) => {
                  const isScheduled = scheduledMilestoneIds.includes(m.id);
                  const isCritical = m.priority === 'CRITICAL';
                  return (
                    <View key={m.id} style={styles.milestoneCard}>
                      <View style={styles.milestoneAgeBadge}>
                        <Text style={styles.milestoneAgeNumber}>AGE {m.targetAge}</Text>
                        <Text style={styles.milestonePriorityText}>
                          {m.priority}
                        </Text>
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.milestoneTestName}>{m.testName}</Text>
                        <Text style={styles.milestoneFrequency}>
                          Frequency: {m.frequency}
                        </Text>
                        <Text style={styles.milestoneObjective}>
                          {m.clinicalObjective}
                        </Text>

                        {/* 1-Tap Schedule in Care Calendar */}
                        <TouchableOpacity
                          activeOpacity={0.88}
                          disabled={isScheduled}
                          onPress={() => handleScheduleMilestone(m)}
                          style={[
                            styles.scheduleBtn,
                            isScheduled && styles.scheduleBtnDisabled,
                          ]}>
                          <MaterialIcons
                            name={isScheduled ? 'check-circle' : 'calendar-today'}
                            size={14}
                            color={isScheduled ? '#20C997' : '#101416'}
                          />
                          <Text
                            style={[
                              styles.scheduleBtnText,
                              isScheduled && { color: '#20C997' },
                            ]}>
                            {isScheduled ? 'Scheduled in Care Calendar' : 'Schedule in Care Calendar'}
                          </Text>
                        </TouchableOpacity>
                      </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: 24,
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
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBox: {
    backgroundColor: '#20C997',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  membersBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#181F23',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#181F23',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    borderWidth: 1,
    borderColor: '#20C997',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#20C997',
    fontFamily: F.bold,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  sectionWrap: {
    gap: 14,
  },
  treeInstructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(32, 201, 151, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  treeInstructionsText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 15,
  },
  genSection: {
    backgroundColor: '#141A1D',
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  genHeader: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#20C997',
    letterSpacing: 0.5,
  },
  genRow: {
    gap: 10,
  },
  branchBox: {
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  branchTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  coupleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nodeCard: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  nodeCardActive: {
    borderColor: '#20C997',
    backgroundColor: 'rgba(32, 201, 151, 0.08)',
  },
  nodeRole: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  nodeName: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  nodeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  nodeBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#FF6B6B',
  },
  healthyLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#20C997',
  },
  parentsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  parentNodeCard: {
    flex: 1,
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  parentNodeName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  childHeroNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20C997',
  },
  childHeroTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  childHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  editorCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#20C997',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editorTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#20C997',
  },
  editorSectionLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  existingConditionsWrap: {
    gap: 6,
  },
  noConditionsText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  condItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101416',
    padding: 8,
    borderRadius: 8,
  },
  condItemText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  addCondBox: {
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  diseasePickerScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  diseasePickerChip: {
    backgroundColor: '#181F23',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  diseasePickerChipActive: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    borderColor: '#20C997',
  },
  diseasePickerText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  diseasePickerTextActive: {
    color: '#20C997',
    fontFamily: F.bold,
  },
  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ageInputLabel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  ageTextInput: {
    width: 60,
    backgroundColor: '#181F23',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  addCondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#20C997',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addCondBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  aiInsightCard: {
    backgroundColor: 'rgba(32, 201, 151, 0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.25)',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
    letterSpacing: 0.5,
    flex: 1,
  },
  aiBodyText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  hazardSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  riskCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  riskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  riskCardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#101416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskCardTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  riskCardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  riskLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskLevelText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  bilateralAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  bilateralText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FF6B6B',
    flex: 1,
  },
  riskRationale: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  lifestyleShieldBox: {
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  lifestyleShieldTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#20C997',
    marginBottom: 2,
  },
  lifestyleItemText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  exportReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  exportReportBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
  roadmapHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  roadmapHeroTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#20C997',
  },
  roadmapHeroSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  milestoneAgeBadge: {
    width: 60,
    backgroundColor: '#101416',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.3)',
  },
  milestoneAgeNumber: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  milestonePriorityText: {
    fontFamily: F.bold,
    fontSize: 7,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  milestoneTestName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  milestoneFrequency: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#38BDF8',
  },
  milestoneObjective: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  scheduleBtnDisabled: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    borderWidth: 1,
    borderColor: '#20C997',
  },
  scheduleBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
});
