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
  auditMedicineCabinet,
  checkDrugPair,
  checkDrugWithFoods,
  FOOD_INTERACTION_REGISTRY,
  normalizeDrugName,
  queryGeminiPharmacistDeepAnalysis,
} from '@/services/drug-interaction-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { useMedicineStore } from '@/stores/medicine-store';
import {
  CabinetSafetyAuditResult,
  DrugInteractionResult,
  FoodInteractionItem,
  InteractionSeverity,
} from '@/types/drug-interaction';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const QUICK_DRUG_PRESETS = [
  'Aspirin 75mg',
  'Warfarin 5mg',
  'Olmesartan 20mg (Olmetec)',
  'Rosuvastatin 10mg (Lipicon)',
  'Ciprofloxacin 500mg',
  'Antacid Plus',
  'Iron Polymaltose (Fefol)',
  'Metronidazole 400mg (Flamyd)',
  'Ketorolac 10mg (Torax)',
  'Omeprazole 20mg (Seclo)',
  'Tramadol 50mg',
  'Escitalopram 10mg',
  'Spironolactone 25mg',
  'Nitroglycerin Spray',
  'Salbutamol Inhaler',
];

interface DrugInteractionCheckerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DrugInteractionCheckerModal({
  visible,
  onClose,
}: DrugInteractionCheckerModalProps) {
  const cabinetMedicines = useMedicineStore((s) => s.medicines);
  const vaultMembers = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const vaultEvents = useHealthVaultStore((s) => s.events);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);

  const [activeTab, setActiveTab] = useState<'AUDIT' | 'CUSTOM' | 'FOODS'>('AUDIT');

  // Custom checker state
  const [selectedCustomDrugs, setSelectedCustomDrugs] = useState<string[]>([
    'Aspirin 75mg',
    'Warfarin 5mg',
  ]);
  const [customInputText, setCustomInputText] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [customResults, setCustomResults] = useState<DrugInteractionResult[]>([]);

  // Cabinet audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<CabinetSafetyAuditResult | null>(null);

  // Food directory state
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodInteractionItem | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Extract all active medication names from Medicine Store + Vault Events
  const activeCabinetDrugNames = useMemo(() => {
    const list: string[] = [];

    // From Medicine Store
    for (const m of cabinetMedicines) {
      if (m.name && !list.includes(m.name)) {
        list.push(m.name);
      }
    }

    // From recent Medical Events (prescriptions)
    for (const ev of vaultEvents) {
      if (ev.prescribedMedicines) {
        for (const p of ev.prescribedMedicines) {
          if (p.name && !list.includes(p.name)) {
            list.push(p.name);
          }
        }
      }
    }

    if (list.length === 0) {
      // Fallback demo meds
      return [
        'Olmesartan 20mg (Olmetec)',
        'Rosuvastatin 10mg (Lipicon)',
        'Antacid Plus Suspension',
        'Iron Polymaltose Complex (Fefol)',
        'Aspirin 75mg (Ecosprin)',
      ];
    }

    return list;
  }, [cabinetMedicines, vaultEvents]);

  // Run initial cabinet audit when opened
  useEffect(() => {
    if (visible) {
      void runCabinetAudit();
      void evaluateCustomDrugs(selectedCustomDrugs);
    }
  }, [visible, currentLanguage]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const runCabinetAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditMedicineCabinet(activeCabinetDrugNames, currentLanguage);
      setAuditResult(res);
    } catch (err) {
      console.warn('Cabinet audit error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const evaluateCustomDrugs = async (drugs: string[]) => {
    if (drugs.length < 2) {
      setCustomResults([]);
      return;
    }
    const pairings: DrugInteractionResult[] = [];
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const res = checkDrugPair(drugs[i], drugs[j], currentLanguage);
        if (res) pairings.push(res);
      }
    }
    setCustomResults(pairings);
  };

  const handleAddCustomDrug = (drugName: string) => {
    const trimmed = drugName.trim();
    if (!trimmed || selectedCustomDrugs.includes(trimmed)) return;
    void Haptics.selectionAsync().catch(() => {});
    const updated = [...selectedCustomDrugs, trimmed];
    setSelectedCustomDrugs(updated);
    setCustomInputText('');
    void evaluateCustomDrugs(updated);
  };

  const handleRemoveCustomDrug = (drugName: string) => {
    void Haptics.selectionAsync().catch(() => {});
    const updated = selectedCustomDrugs.filter((d) => d !== drugName);
    setSelectedCustomDrugs(updated);
    void evaluateCustomDrugs(updated);
  };

  const handleRunAiDeepPharmacist = async () => {
    if (selectedCustomDrugs.length < 2) {
      Alert.alert('Select Medicines', 'Please add at least 2 medicines to evaluate interactions.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsAiAnalyzing(true);

    try {
      const results = await queryGeminiPharmacistDeepAnalysis(
        selectedCustomDrugs,
        currentLanguage
      );
      setCustomResults(results);
      showToast('✅ Gemini Clinical AI Analysis Complete!');
    } catch (err) {
      Alert.alert('AI Check Failed', 'Could not complete AI analysis. Showing standard rule results.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleExportInteractionReport = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    let reportText = `
⚠️ DRUG & FOOD INTERACTION SAFETY REPORT
========================================
Generated: ${new Date().toLocaleDateString()}
Safety Score: ${auditResult ? `${auditResult.overallSafetyScore}%` : 'N/A'}
Total Medications Checked: ${auditResult?.totalDrugsAnalyzed || activeCabinetDrugNames.length}

🚨 CRITICAL CONTRAINDICATIONS (${auditResult?.criticalPairings.length || 0}):
`;

    if (auditResult?.criticalPairings && auditResult.criticalPairings.length > 0) {
      auditResult.criticalPairings.forEach((c, idx) => {
        reportText += `\n${idx + 1}. [CRITICAL] ${c.drug1} ⇄ ${c.drug2}\n• Risk: ${c.headline}\n• Action: ${c.actionableAdvice}\n`;
      });
    } else {
      reportText += '\nNo critical clashes detected in active cabinet.\n';
    }

    reportText += `\n⚠️ MODERATE CAUTIONS (${auditResult?.moderatePairings.length || 0}):\n`;
    if (auditResult?.moderatePairings && auditResult.moderatePairings.length > 0) {
      auditResult.moderatePairings.forEach((m, idx) => {
        reportText += `\n${idx + 1}. [CAUTION] ${m.drug1} ⇄ ${m.drug2}\n• Note: ${m.headline}\n• Guidance: ${m.actionableAdvice}\n`;
      });
    } else {
      reportText += 'None.\n';
    }

    reportText += `\n🍎 FOOD & DIETARY WARNINGS (${auditResult?.foodWarnings.length || 0}):\n`;
    if (auditResult?.foodWarnings && auditResult.foodWarnings.length > 0) {
      auditResult.foodWarnings.forEach((f, idx) => {
        reportText += `\n• ${f.drug1} ⇄ ${f.foodOrBeverage}: ${f.actionableAdvice}\n`;
      });
    }

    reportText += '\n(TrackMe Clinical Pharmacology Guard)';

    await Clipboard.setStringAsync(reportText.trim());
    showToast('📋 Interaction Report Copied to Clipboard!');

    Alert.alert('Share Safety Report', 'Report copied to clipboard! Share via WhatsApp with doctor or family?', [
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

  const filteredFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return FOOD_INTERACTION_REGISTRY;
    const q = foodSearchQuery.toLowerCase();
    return FOOD_INTERACTION_REGISTRY.filter(
      (f) =>
        f.foodName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.commonBrands.some((b) => b.toLowerCase().includes(q))
    );
  }, [foodSearchQuery]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#20C997'; // Green
    if (score >= 50) return '#FCC419'; // Yellow
    return '#FF6B6B'; // Red
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
                <MaterialIcons name="warning" size={22} color="#FF6B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Drug & Food Safety Guard</Text>
                <Text style={styles.subtitle}>
                  Contraindication, Multi-Drug Clashes & Food Interaction Checker
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

          {/* TOP NAVIGATION TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('AUDIT');
              }}
              style={[styles.tabBtn, activeTab === 'AUDIT' && styles.tabBtnActive]}>
              <MaterialIcons
                name="shield"
                size={16}
                color={activeTab === 'AUDIT' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'AUDIT' && styles.tabBtnTextActive,
                ]}>
                Cabinet Auto-Audit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('CUSTOM');
              }}
              style={[styles.tabBtn, activeTab === 'CUSTOM' && styles.tabBtnActive]}>
              <MaterialIcons
                name="medication"
                size={16}
                color={activeTab === 'CUSTOM' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'CUSTOM' && styles.tabBtnTextActive,
                ]}>
                Pair Checker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('FOODS');
              }}
              style={[styles.tabBtn, activeTab === 'FOODS' && styles.tabBtnActive]}>
              <MaterialIcons
                name="restaurant"
                size={16}
                color={activeTab === 'FOODS' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'FOODS' && styles.tabBtnTextActive,
                ]}>
                Food Directory
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN SCROLLABLE CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {activeTab === 'AUDIT' && (
              /* ================= TAB 1: CABINET AUTO-AUDIT ================= */
              <View style={styles.sectionWrap}>
                {/* SAFETY SCORE HERO CARD */}
                {auditResult && (
                  <View style={styles.scoreHeroCard}>
                    <View style={styles.scoreHeroLeft}>
                      <View
                        style={[
                          styles.scoreCircle,
                          { borderColor: getScoreColor(auditResult.overallSafetyScore) },
                        ]}>
                        <Text
                          style={[
                            styles.scoreNumber,
                            { color: getScoreColor(auditResult.overallSafetyScore) },
                          ]}>
                          {auditResult.overallSafetyScore}%
                        </Text>
                        <Text style={styles.scoreLabel}>SAFETY</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.scoreTitle}>
                        {auditResult.overallSafetyScore >= 80
                          ? '✅ High Compatibility'
                          : auditResult.overallSafetyScore >= 50
                          ? '⚠️ Caution Required'
                          : '🚨 Hazardous Pairings Found'}
                      </Text>
                      <Text style={styles.scoreSub}>
                        Analyzed {auditResult.totalDrugsAnalyzed} active cabinet medicines across all combinations.
                      </Text>

                      <View style={styles.statTagsRow}>
                        <View style={[styles.statTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                          <Text style={[styles.statTagText, { color: '#FF6B6B' }]}>
                            {auditResult.criticalPairings.length} Critical
                          </Text>
                        </View>
                        <View style={[styles.statTag, { backgroundColor: 'rgba(252, 196, 25, 0.15)' }]}>
                          <Text style={[styles.statTagText, { color: '#FCC419' }]}>
                            {auditResult.moderatePairings.length} Moderate
                          </Text>
                        </View>
                        <View style={[styles.statTag, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                          <Text style={[styles.statTagText, { color: '#38BDF8' }]}>
                            {auditResult.foodWarnings.length} Dietary
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* SCANNED ACTIVE MEDICINES CHIPS */}
                <View style={styles.cabinetDrugsSection}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="inventory-2" size={16} color="#38BDF8" />
                    <Text style={styles.sectionHeading}>
                      ACTIVE MEDICINES IN CABINET ({activeCabinetDrugNames.length})
                    </Text>
                  </View>
                  <View style={styles.drugsChipsWrap}>
                    {activeCabinetDrugNames.map((med, idx) => (
                      <View key={idx} style={styles.drugChip}>
                        <Text style={styles.drugChipText}>{med}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* CRITICAL WARNINGS SECTION */}
                {auditResult && auditResult.criticalPairings.length > 0 && (
                  <View style={styles.hazardSection}>
                    <View style={styles.sectionHeaderRow}>
                      <MaterialIcons name="error" size={18} color="#FF6B6B" />
                      <Text style={[styles.sectionHeading, { color: '#FF6B6B' }]}>
                        CRITICAL CONTRAINDICATIONS DETECTED
                      </Text>
                    </View>

                    {auditResult.criticalPairings.map((c, i) => (
                      <View key={i} style={styles.criticalCard}>
                        <View style={styles.hazardHeader}>
                          <Text style={styles.hazardDrugPair}>
                            {c.drug1} ⇄ {c.drug2}
                          </Text>
                          <View style={styles.criticalBadge}>
                            <Text style={styles.criticalBadgeText}>SEVERE CLASH</Text>
                          </View>
                        </View>
                        <Text style={styles.hazardHeadline}>{c.headline}</Text>
                        <Text style={styles.hazardMechanism}>{c.mechanism}</Text>
                        <View style={styles.actionBox}>
                          <MaterialIcons name="medical-services" size={15} color="#20C997" />
                          <Text style={styles.actionText}>
                            <Text style={{ fontFamily: F.bold, color: '#20C997' }}>Action: </Text>
                            {c.actionableAdvice}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* MODERATE WARNINGS SECTION */}
                {auditResult && auditResult.moderatePairings.length > 0 && (
                  <View style={styles.hazardSection}>
                    <View style={styles.sectionHeaderRow}>
                      <MaterialIcons name="warning-amber" size={18} color="#FCC419" />
                      <Text style={[styles.sectionHeading, { color: '#FCC419' }]}>
                        MODERATE DRUG INTERACTIONS (TIMING ADJUSTMENTS)
                      </Text>
                    </View>

                    {auditResult.moderatePairings.map((m, i) => (
                      <View key={i} style={styles.moderateCard}>
                        <View style={styles.hazardHeader}>
                          <Text style={styles.hazardDrugPair}>
                            {m.drug1} ⇄ {m.drug2}
                          </Text>
                          <View style={styles.moderateBadge}>
                            <Text style={styles.moderateBadgeText}>CAUTION</Text>
                          </View>
                        </View>
                        <Text style={styles.hazardHeadline}>{m.headline}</Text>
                        <Text style={styles.hazardMechanism}>{m.mechanism}</Text>
                        <View style={styles.actionBox}>
                          <MaterialIcons name="schedule" size={15} color="#FCC419" />
                          <Text style={styles.actionText}>
                            <Text style={{ fontFamily: F.bold, color: '#FCC419' }}>Guidance: </Text>
                            {m.actionableAdvice}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* FOOD WARNINGS LINKED TO CABINET */}
                {auditResult && auditResult.foodWarnings.length > 0 && (
                  <View style={styles.hazardSection}>
                    <View style={styles.sectionHeaderRow}>
                      <MaterialIcons name="no-meals" size={18} color="#38BDF8" />
                      <Text style={[styles.sectionHeading, { color: '#38BDF8' }]}>
                        FOOD & DIETARY HAZARDS FOR YOUR CABINET
                      </Text>
                    </View>

                    {auditResult.foodWarnings.map((f, i) => (
                      <View key={i} style={styles.foodWarningCard}>
                        <View style={styles.hazardHeader}>
                          <Text style={styles.hazardDrugPair}>
                            {f.drug1} ⇄ {f.foodOrBeverage}
                          </Text>
                          <View style={styles.foodBadge}>
                            <Text style={styles.foodBadgeText}>DIET GUARD</Text>
                          </View>
                        </View>
                        <Text style={styles.hazardHeadline}>{f.headline}</Text>
                        <Text style={styles.hazardMechanism}>{f.mechanism}</Text>
                        <View style={styles.actionBox}>
                          <MaterialIcons name="info" size={15} color="#38BDF8" />
                          <Text style={styles.actionText}>{f.actionableAdvice}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ACTIONS: EXPORT & RESCAN */}
                <View style={styles.auditActionRow}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={runCabinetAudit}
                    style={styles.rescanBtn}>
                    <MaterialIcons name="refresh" size={18} color="#38BDF8" />
                    <Text style={styles.rescanBtnText}>Re-Scan Cabinet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleExportInteractionReport}
                    style={styles.exportReportBtn}>
                    <MaterialIcons name="share" size={18} color="#101416" />
                    <Text style={styles.exportReportBtnText}>Export Safety Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'CUSTOM' && (
              /* ================= TAB 2: CUSTOM PAIR CHECKER ================= */
              <View style={styles.sectionWrap}>
                {/* Input & Search Box */}
                <View style={styles.customSearchCard}>
                  <Text style={styles.customSearchTitle}>
                    CHECK ANY COMBINATION OF MEDICINES
                  </Text>
                  <Text style={styles.customSearchSub}>
                    Add 2 or more medicines to check clinical contraindications and absorption blocks.
                  </Text>

                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.customTextInput}
                      value={customInputText}
                      onChangeText={setCustomInputText}
                      placeholder="Type medicine name (e.g. Napa, Seclo, Warfarin)..."
                      placeholderTextColor={C.onSurfaceVariant}
                      onSubmitEditing={() => handleAddCustomDrug(customInputText)}
                    />
                    <TouchableOpacity
                      onPress={() => handleAddCustomDrug(customInputText)}
                      style={styles.addDrugBtn}>
                      <MaterialIcons name="add" size={20} color="#101416" />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Preset Pills */}
                  <Text style={styles.presetLabel}>QUICK POPULAR PRESETS:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetScroll}>
                    {QUICK_DRUG_PRESETS.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleAddCustomDrug(preset)}
                        style={styles.presetChip}>
                        <MaterialIcons name="add-circle-outline" size={14} color="#38BDF8" />
                        <Text style={styles.presetChipText}>{preset}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Selected Medicines Tray */}
                <View style={styles.selectedTrayCard}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="checklist" size={16} color="#20C997" />
                    <Text style={styles.sectionHeading}>
                      SELECTED MEDICINES ({selectedCustomDrugs.length})
                    </Text>
                  </View>

                  <View style={styles.drugsChipsWrap}>
                    {selectedCustomDrugs.map((drug, i) => (
                      <View key={i} style={styles.selectedChip}>
                        <Text style={styles.selectedChipText}>{drug}</Text>
                        <TouchableOpacity onPress={() => handleRemoveCustomDrug(drug)}>
                          <MaterialIcons name="close" size={16} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* Gemini AI Deep Pharmacologist Check */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={isAiAnalyzing || selectedCustomDrugs.length < 2}
                    onPress={handleRunAiDeepPharmacist}
                    style={styles.aiDeepBtn}>
                    {isAiAnalyzing ? (
                      <>
                        <ActivityIndicator size="small" color="#101416" />
                        <Text style={styles.aiDeepBtnText}>
                          Gemini Pharmacist AI Evaluating Matrix...
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="auto-awesome" size={18} color="#101416" />
                        <Text style={styles.aiDeepBtnText}>
                          Run Gemini AI Deep Pharmacology Check
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Custom Results Display */}
                <View style={styles.hazardSection}>
                  <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="fact-check" size={16} color="#38BDF8" />
                    <Text style={styles.sectionHeading}>
                      INTERACTION ANALYSIS RESULTS ({customResults.length})
                    </Text>
                  </View>

                  {customResults.length === 0 ? (
                    <View style={styles.safeResultBox}>
                      <MaterialIcons name="check-circle" size={36} color="#20C997" />
                      <Text style={styles.safeResultTitle}>
                        No Known Severe Interactions Found
                      </Text>
                      <Text style={styles.safeResultSub}>
                        The selected combination did not trigger common contraindication warnings in our clinical pharmacology rule-base.
                      </Text>
                    </View>
                  ) : (
                    customResults.map((r, i) => {
                      const isCritical = r.severity === 'CRITICAL';
                      return (
                        <View
                          key={i}
                          style={isCritical ? styles.criticalCard : styles.moderateCard}>
                          <View style={styles.hazardHeader}>
                            <Text style={styles.hazardDrugPair}>
                              {r.drug1} ⇄ {r.drug2 || 'Diet/Food'}
                            </Text>
                            <View
                              style={
                                isCritical ? styles.criticalBadge : styles.moderateBadge
                              }>
                              <Text
                                style={
                                  isCritical
                                    ? styles.criticalBadgeText
                                    : styles.moderateBadgeText
                                }>
                                {r.severity}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.hazardHeadline}>{r.headline}</Text>
                          <Text style={styles.hazardMechanism}>{r.mechanism}</Text>
                          <View style={styles.actionBox}>
                            <MaterialIcons
                              name="medical-services"
                              size={15}
                              color={isCritical ? '#FF6B6B' : '#FCC419'}
                            />
                            <Text style={styles.actionText}>
                              <Text
                                style={{
                                  fontFamily: F.bold,
                                  color: isCritical ? '#FF6B6B' : '#FCC419',
                                }}>
                                Advice:{' '}
                              </Text>
                              {r.actionableAdvice}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {activeTab === 'FOODS' && (
              /* ================= TAB 3: FOOD DIRECTORY ================= */
              <View style={styles.sectionWrap}>
                {/* Search Foods */}
                <View style={styles.foodSearchWrap}>
                  <MaterialIcons name="search" size={18} color={C.onSurfaceVariant} />
                  <TextInput
                    style={styles.foodSearchInput}
                    value={foodSearchQuery}
                    onChangeText={setFoodSearchQuery}
                    placeholder="Search food, fruit, drinks (e.g. Grapefruit, Milk, Coffee)..."
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                  {foodSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setFoodSearchQuery('')}>
                      <MaterialIcons name="close" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Food Cards */}
                {filteredFoods.map((food) => (
                  <View key={food.id} style={styles.foodDirectoryCard}>
                    <View style={styles.foodCardHeader}>
                      <View style={styles.foodIconCircle}>
                        <MaterialIcons
                          name={
                            food.category === 'CITRUS'
                              ? 'eco'
                              : food.category === 'DAIRY'
                              ? 'local-drink'
                              : food.category === 'ALCOHOL'
                              ? 'wine-bar'
                              : food.category === 'CAFFEINE'
                              ? 'coffee'
                              : food.category === 'VITAMIN_K'
                              ? 'grass'
                              : 'restaurant'
                          }
                          size={20}
                          color="#FF922B"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodCardTitle}>{food.foodName}</Text>
                        <Text style={styles.foodCardSub}>{food.description}</Text>
                      </View>
                    </View>

                    {/* Prohibited Drug Brands */}
                    <View style={styles.prohibitedWrap}>
                      <Text style={styles.prohibitedLabel}>
                        PROHIBITED / CONFLICTING MEDICINES:
                      </Text>
                      <View style={styles.drugsChipsWrap}>
                        {food.commonBrands.map((brand, i) => (
                          <View key={i} style={styles.prohibitedChip}>
                            <Text style={styles.prohibitedChipText}>{brand}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Mechanism & Danger */}
                    <Text style={styles.foodMechanism}>{food.mechanismAndRisk}</Text>

                    {/* Patient Guideline */}
                    <View style={styles.foodGuidelineBox}>
                      <MaterialIcons name="tips-and-updates" size={16} color="#20C997" />
                      <Text style={styles.foodGuidelineText}>
                        {food.patientGuideline}
                      </Text>
                    </View>
                  </View>
                ))}
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
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#38BDF8',
    fontFamily: F.bold,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  sectionWrap: {
    gap: 14,
  },
  scoreHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#181F23',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scoreHeroLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101416',
  },
  scoreNumber: {
    fontFamily: F.bold,
    fontSize: 18,
  },
  scoreLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  scoreTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  scoreSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    lineHeight: 15,
  },
  statTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  statTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statTagText: {
    fontFamily: F.bold,
    fontSize: 10,
  },
  cabinetDrugsSection: {
    backgroundColor: '#141A1D',
    borderRadius: 14,
    padding: 12,
    gap: 8,
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
  drugsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  drugChip: {
    backgroundColor: '#181F23',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  drugChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#E2E8F0',
  },
  hazardSection: {
    gap: 10,
  },
  criticalCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  moderateCard: {
    backgroundColor: 'rgba(252, 196, 25, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCC419',
  },
  foodWarningCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hazardDrugPair: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  criticalBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  criticalBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#101416',
  },
  moderateBadge: {
    backgroundColor: '#FCC419',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moderateBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#101416',
  },
  foodBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  foodBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#101416',
  },
  hazardHeadline: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  hazardMechanism: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#101416',
    borderRadius: 8,
    padding: 8,
    marginTop: 2,
  },
  actionText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 15,
  },
  auditActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181F23',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  rescanBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  exportReportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingVertical: 12,
    borderRadius: 12,
  },
  exportReportBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  customSearchCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  customSearchTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  customSearchSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addDrugBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  presetScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#101416',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  presetChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#CBD5E1',
  },
  selectedTrayCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#101416',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#20C997',
  },
  selectedChipText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  aiDeepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  aiDeepBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  safeResultBox: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  safeResultTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  safeResultSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  foodSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181F23',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  foodSearchInput: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#FFFFFF',
  },
  foodDirectoryCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodCardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  foodCardSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  prohibitedWrap: {
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  prohibitedLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FF922B',
  },
  prohibitedChip: {
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prohibitedChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FF922B',
  },
  foodMechanism: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  foodGuidelineBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(32, 201, 151, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  foodGuidelineText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 11,
    color: '#20C997',
    lineHeight: 16,
  },
});
