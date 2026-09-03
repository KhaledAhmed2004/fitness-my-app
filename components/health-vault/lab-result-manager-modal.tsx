import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
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
  AnalytePreset,
  COMMON_ANALYTE_PRESETS,
} from '@/components/health-vault/health-vault-constants';
import { LabTrendChart } from '@/components/health-vault/lab-trend-chart';
import { AIReportExplainerModal } from '@/components/health-vault/ai-report-explainer-modal';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface LabResultManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onViewDocument?: (docId: string) => void;
}

export function LabResultManagerModal({
  visible,
  onClose,
  onViewDocument,
}: LabResultManagerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const getLabResults = useHealthVaultStore((s) => s.getLabResults);
  const getAvailableAnalytes = useHealthVaultStore((s) => s.getAvailableAnalytes);
  const addLabResult = useHealthVaultStore((s) => s.addLabResult);
  const deleteLabResult = useHealthVaultStore((s) => s.deleteLabResult);

  const initialMemberId = selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [selectedAnalyteCode, setSelectedAnalyteCode] = useState('HBA1C');
  const [isAdding, setIsAdding] = useState(false);
  const [explainerModalVisible, setExplainerModalVisible] = useState(false);

  // Add Reading Form State
  const [formAnalyteCode, setFormAnalyteCode] = useState('HBA1C');
  const [formAnalyteName, setFormAnalyteName] = useState('HbA1c Glycated Hemoglobin');
  const [formValue, setFormValue] = useState('');
  const [formUnit, setFormUnit] = useState('%');
  const [formRefMin, setFormRefMin] = useState('4.0');
  const [formRefMax, setFormRefMax] = useState('5.6');
  const [formRefText, setFormRefText] = useState('Normal: 4.0–5.6%');
  const [formSource, setFormSource] = useState('Square Hospital Lab');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  const availableAnalytes = useMemo(
    () => getAvailableAnalytes(activeMemberId),
    [getAvailableAnalytes, activeMemberId]
  );

  const activeReadings = useMemo(
    () => getLabResults(activeMemberId, selectedAnalyteCode),
    [getLabResults, activeMemberId, selectedAnalyteCode]
  );

  const currentPreset = useMemo(
    () => COMMON_ANALYTE_PRESETS.find((p) => p.code === selectedAnalyteCode),
    [selectedAnalyteCode]
  );

  const handleSelectPreset = (preset: AnalytePreset) => {
    void Haptics.selectionAsync().catch(() => {});
    setFormAnalyteCode(preset.code);
    setFormAnalyteName(preset.name);
    setFormUnit(preset.defaultUnit);
    setFormRefMin(preset.defaultRefMin !== undefined ? String(preset.defaultRefMin) : '');
    setFormRefMax(preset.defaultRefMax !== undefined ? String(preset.defaultRefMax) : '');
    setFormRefText(preset.defaultRefText || '');
  };

  const handleSaveReading = async () => {
    const num = parseFloat(formValue);
    if (isNaN(num)) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await addLabResult({
      memberId: activeMemberId,
      testName: formAnalyteName,
      analyteCode: formAnalyteCode,
      analyteName: formAnalyteName,
      valueType: 'NUMERIC',
      numericValue: num,
      unit: formUnit.trim() || '%',
      referenceRange: {
        min: formRefMin ? parseFloat(formRefMin) : undefined,
        max: formRefMax ? parseFloat(formRefMax) : undefined,
        text: formRefText.trim() || undefined,
      },
      referenceSource: formSource.trim() || undefined,
      testDate: formDate,
      notes: formNotes.trim() || undefined,
    });

    setFormValue('');
    setFormNotes('');
    setIsAdding(false);
    setSelectedAnalyteCode(formAnalyteCode);
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
                <MaterialIcons name="insights" size={20} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Biomarker & Lab Trends</Text>
                <Text style={styles.subtitle}>
                  Longitudinal Health Metrics & Trend Graphs
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
                  {isAdding ? 'Cancel' : 'Add Reading'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* AI REPORT EXPLAINER HERO BANNER */}
          <TouchableOpacity
            style={styles.explainerHeroBtn}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setExplainerModalVisible(true);
            }}>
            <View style={styles.explainerHeroLeft}>
              <MaterialIcons name="auto-awesome" size={18} color="#38BDF8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.explainerHeroTitle}>
                  🩺 এআই সরল বাংলায় রিপোর্ট বিশ্লেষণ ও পরামর্শ
                </Text>
                <Text style={styles.explainerHeroSub}>
                  রিপোর্টের ছবি স্ক্যান করুন ও ডাক্তারের ৩টি প্রশ্ন প্রস্তুত করুন
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={16} color="#38BDF8" />
          </TouchableOpacity>

          {/* MEMBER SELECTOR BAR */}
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
                        backgroundColor: '#38BDF8',
                        borderColor: '#38BDF8',
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

          {/* ANALYTE SELECTOR TABS */}
          <View style={styles.analytesBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.analytesScroll}>
              {COMMON_ANALYTE_PRESETS.map((preset) => {
                const isSelected = selectedAnalyteCode === preset.code;
                const existingData = availableAnalytes.find((a) => a.code === preset.code);

                return (
                  <TouchableOpacity
                    key={preset.code}
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setSelectedAnalyteCode(preset.code);
                      setIsAdding(false);
                    }}
                    style={[
                      styles.analyteChip,
                      isSelected && styles.analyteChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.analyteChipText,
                        isSelected && styles.analyteChipTextActive,
                      ]}>
                      {preset.shortName}
                    </Text>
                    {existingData?.count ? (
                      <View style={styles.badgeCount}>
                        <Text style={styles.badgeCountText}>{existingData.count}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {isAdding ? (
              /* ADD NEW LAB READING FORM */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>LOG NEW BIOMARKER READING</Text>

                {/* Preset Chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Biomarker Test</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetScroll}>
                    {COMMON_ANALYTE_PRESETS.map((p) => {
                      const isSelected = formAnalyteCode === p.code;
                      return (
                        <TouchableOpacity
                          key={p.code}
                          onPress={() => handleSelectPreset(p)}
                          style={[
                            styles.presetChip,
                            isSelected && styles.presetChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.presetChipText,
                              isSelected && styles.presetChipTextActive,
                            ]}>
                            {p.shortName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Test Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formAnalyteName}
                    onChangeText={setFormAnalyteName}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1.2 }]}>
                    <Text style={styles.inputLabel}>Recorded Value *</Text>
                    <TextInput
                      style={[styles.input, styles.valueInput]}
                      placeholder="e.g. 6.8"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={formValue}
                      onChangeText={setFormValue}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      value={formUnit}
                      onChangeText={setFormUnit}
                      placeholder="%"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Reference Min</Text>
                    <TextInput
                      style={styles.input}
                      value={formRefMin}
                      onChangeText={setFormRefMin}
                      placeholder="4.0"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Reference Max</Text>
                    <TextInput
                      style={styles.input}
                      value={formRefMax}
                      onChangeText={setFormRefMax}
                      placeholder="5.6"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Test Date</Text>
                  <TextInput
                    style={styles.input}
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Laboratory / Hospital Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formSource}
                    onChangeText={setFormSource}
                    placeholder="e.g. Popular Diagnostic, Square Hospital"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Clinical Notes / Context (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formNotes}
                    onChangeText={setFormNotes}
                    placeholder="e.g. Fasting 12 hours, routine 3-month review"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveReading}
                  style={styles.saveBtn}>
                  <MaterialIcons name="check" size={18} color="#101416" />
                  <Text style={styles.saveBtnText}>Save Reading & Plot Trend</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* TREND GRAPH & HISTORICAL READINGS */
              <View style={styles.resultsContainer}>
                {/* Visualizer Chart */}
                <LabTrendChart
                  analyteName={currentPreset?.name || selectedAnalyteCode}
                  unit={currentPreset?.defaultUnit || activeReadings[0]?.unit || ''}
                  readings={activeReadings}
                  referenceRange={
                    activeReadings[0]?.referenceRange || {
                      min: currentPreset?.defaultRefMin,
                      max: currentPreset?.defaultRefMax,
                      text: currentPreset?.defaultRefText,
                    }
                  }
                  referenceSource={activeReadings[activeReadings.length - 1]?.referenceSource}
                />

                {/* HISTORICAL READINGS LIST */}
                {activeReadings.length > 0 && (
                  <View style={styles.historyCard}>
                    <Text style={styles.historyTitle}>
                      HISTORICAL LOGS ({activeReadings.length})
                    </Text>

                    {activeReadings.map((r) => (
                      <View key={r.id} style={styles.readingRow}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.readingValueRow}>
                            <Text style={styles.readingValue}>
                              {r.numericValue} {r.unit}
                            </Text>
                            <Text style={styles.readingDate}>{r.testDate}</Text>
                          </View>

                          <Text style={styles.readingSource}>
                            {r.referenceSource || 'Diagnostic Center'}
                          </Text>

                          {r.notes ? (
                            <Text style={styles.readingNotes}>{r.notes}</Text>
                          ) : null}
                        </View>

                        <View style={styles.readingActions}>
                          {r.documentId ? (
                            <TouchableOpacity
                              onPress={() => onViewDocument?.(r.documentId!)}
                              style={styles.docIconBtn}>
                              <MaterialIcons name="description" size={16} color="#38BDF8" />
                            </TouchableOpacity>
                          ) : null}

                          <TouchableOpacity
                            onPress={() => deleteLabResult(r.id)}
                            style={styles.deleteIconBtn}>
                            <MaterialIcons name="delete-outline" size={16} color={C.onSurfaceVariant} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <AIReportExplainerModal
        visible={explainerModalVisible}
        onClose={() => setExplainerModalVisible(false)}
      />
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
    height: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
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
  analytesBar: {
    backgroundColor: '#101416',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  analytesScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  analyteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  analyteChipActive: {
    backgroundColor: '#38BDF8',
  },
  analyteChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  analyteChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  badgeCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeCountText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#FFFFFF',
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
  valueInput: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#38BDF8',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  presetScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  presetChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetChipActive: {
    backgroundColor: '#38BDF8',
  },
  presetChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  presetChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
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
  resultsContainer: {
    gap: 14,
  },
  historyCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  historyTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  readingValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  readingValue: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  readingDate: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  readingSource: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 2,
  },
  readingNotes: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 2,
  },
  readingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docIconBtn: {
    padding: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 6,
  },
  deleteIconBtn: {
    padding: 6,
  },
  explainerHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  explainerHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  explainerHeroTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  explainerHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
});
