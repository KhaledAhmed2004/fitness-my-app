import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CANONICAL_MEDICAL_DICTIONARY,
  computeDataQualityReport,
  detectDuplicateCandidates,
} from '@/services/data-cleanup-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { Vital } from '@/constants/vital-theme';
import { CleanupAuditEntry, DuplicateCandidate } from '@/types/data-cleanup';

const C = Vital.colors;
const F = Vital.fonts;

interface DataCleanupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DataCleanupModal({ visible, onClose }: DataCleanupModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const diagnosticTests = useHealthVaultStore((s) => s.diagnosticTests);
  const labResults = useHealthVaultStore((s) => s.labResults);
  const documents = useHealthVaultStore((s) => s.documents);
  const expenses = useHealthVaultStore((s) => s.expenses);

  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const isBn = currentLanguage === 'bn';

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'STANDARDIZE' | 'AUDIT'>('QUEUE');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Active duplicate candidates
  const initialCandidates = useMemo(() => {
    return detectDuplicateCandidates(
      members,
      diagnosticTests,
      labResults,
      documents,
      expenses
    );
  }, [members, diagnosticTests, labResults, documents, expenses]);

  const [candidates, setCandidates] = useState<DuplicateCandidate[]>(initialCandidates);
  const [auditLog, setAuditLog] = useState<CleanupAuditEntry[]>([
    {
      id: 'audit_init_01',
      timestamp: '2026-08-28 14:30',
      memberId: 'mem_father',
      action: 'MERGE',
      summary: 'Merged "Lipid Profile Test" into "Lipid Profile Panel (Fasting)"',
      retainedRecordId: 'test_001',
      mergedRecordId: 'test_001_dup',
      mergedDetails: 'Preserved Popular Diagnostic lab slip attachment and notes.',
    },
  ]);

  // Compute Quality Report
  const pendingCount = candidates.filter((c) => c.status === 'PENDING').length;
  const qualityReport = useMemo(() => {
    return computeDataQualityReport(
      members,
      diagnosticTests,
      labResults,
      documents,
      expenses,
      pendingCount
    );
  }, [members, diagnosticTests, labResults, documents, expenses, pendingCount]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  // Handle Merge
  const handleMergeCandidate = (candidate: DuplicateCandidate) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, status: 'MERGED' } : c))
    );

    const auditEntry: CleanupAuditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      memberId: candidate.memberId,
      action: 'MERGE',
      summary: `Merged "${candidate.recordB.title}" into standardized "${candidate.primaryStandardName}"`,
      retainedRecordId: candidate.recordA.id,
      mergedRecordId: candidate.recordB.id,
      mergedDetails: `Consolidated record for ${candidate.memberName}. Retained all notes & attachments.`,
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
    showToast(isBn ? 'সফলভাবে মার্জ করা হয়েছে!' : 'Records merged successfully!');
  };

  // Handle Keep Separate
  const handleKeepSeparate = (candidate: DuplicateCandidate) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, status: 'DISMISSED' } : c))
    );

    const auditEntry: CleanupAuditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      memberId: candidate.memberId,
      action: 'DISMISS',
      summary: `Kept "${candidate.recordA.title}" and "${candidate.recordB.title}" as separate records.`,
      retainedRecordId: candidate.recordA.id,
      mergedDetails: `Marked as distinct entries for ${candidate.memberName}.`,
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
    showToast(isBn ? 'আলাদা হিসেবে সংরক্ষিত রাখা হয়েছে।' : 'Kept separate and dismissed.');
  };

  // Handle Batch Standardize
  const handleBatchStandardize = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const auditEntry: CleanupAuditEntry = {
      id: `audit_batch_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      memberId: 'ALL',
      action: 'STANDARDIZE',
      summary: 'Standardized all medical aliases to International Clinical Nomenclature.',
      retainedRecordId: 'ALL',
      mergedDetails: `Normalized 12 lab tests and OCR entries to canonical standard names.`,
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
    showToast(isBn ? 'সমস্ত নাম ক্লিন ও স্ট্যান্ডার্ড করা হয়েছে!' : 'All medical records standardized!');
  };

  const pendingCandidates = candidates.filter((c) => c.status === 'PENDING');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="auto-fix-high" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>
                  {isBn ? 'রিভিউ ও ডাটা ক্লিনআপ' : 'Review & Organize'}
                </Text>
                <Text style={styles.subtitle}>
                  {isBn
                    ? 'ডুপ্লিকেট রিমুভাল ও স্ট্যান্ডার্ডাইজেশন'
                    : 'Data Quality & Deduplication Studio'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* QUALITY REPORT HERO BANNER */}
          <View style={styles.qualityBanner}>
            <View style={styles.scoreRow}>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreNumber}>{qualityReport.overallScore}%</Text>
                <Text style={styles.scoreLabel}>
                  {isBn ? 'ডাটা কোয়ালিটি' : 'Clean Score'}
                </Text>
              </View>

              <View style={styles.statsCol}>
                <View style={styles.statLine}>
                  <MaterialIcons name="storage" size={14} color="#94A3B8" />
                  <Text style={styles.statText}>
                    {qualityReport.totalRecords} {isBn ? 'মোট রেকর্ড' : 'Total Records'}
                  </Text>
                </View>
                <View style={styles.statLine}>
                  <MaterialIcons name="warning" size={14} color="#FF922B" />
                  <Text style={[styles.statText, { color: '#FF922B' }]}>
                    {pendingCount} {isBn ? 'ডুপ্লিকেট পর্যালোচনা বাকি' : 'Duplicates to Review'}
                  </Text>
                </View>
                <View style={styles.statLine}>
                  <MaterialIcons name="check-circle" size={14} color="#20C997" />
                  <Text style={[styles.statText, { color: '#20C997' }]}>
                    {qualityReport.standardizedCount} {isBn ? 'স্ট্যান্ডার্ড নাম' : 'Standardized Names'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* TABS */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('QUEUE');
              }}
              style={[styles.tabBtn, activeTab === 'QUEUE' && styles.tabBtnActive]}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'QUEUE' && styles.tabBtnTextActive,
                ]}>
                {isBn ? `🔍 ডুপ্লিকেট (${pendingCount})` : `🔍 Duplicates (${pendingCount})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('STANDARDIZE');
              }}
              style={[styles.tabBtn, activeTab === 'STANDARDIZE' && styles.tabBtnActive]}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'STANDARDIZE' && styles.tabBtnTextActive,
                ]}>
                {isBn ? '🏷️ স্ট্যান্ডার্ডাইজ' : '🏷️ Nomenclature'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('AUDIT');
              }}
              style={[styles.tabBtn, activeTab === 'AUDIT' && styles.tabBtnActive]}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'AUDIT' && styles.tabBtnTextActive,
                ]}>
                {isBn ? '📜 অডিট লগ' : '📜 Audit Trail'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TOAST FEEDBACK */}
          {feedbackToast && (
            <View style={styles.toast}>
              <MaterialIcons name="check-circle" size={14} color="#101416" />
              <Text style={styles.toastText}>{feedbackToast}</Text>
            </View>
          )}

          {/* SCROLLABLE BODY */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* TAB 1: DUPLICATE REVIEW QUEUE */}
            {activeTab === 'QUEUE' && (
              <View style={styles.tabContent}>
                {pendingCandidates.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="task-alt" size={48} color="#20C997" />
                    <Text style={styles.emptyTitle}>
                      {isBn ? 'সব রেকর্ড সুবিন্যস্ত ও নিখুঁত!' : 'All Health Records Clean & Organized!'}
                    </Text>
                    <Text style={styles.emptySub}>
                      {isBn
                        ? 'কোনো ডুপ্লিকেট বা অগোছালো ডাটা পাওয়া যায়নি।'
                        : 'No conflicting duplicate entries found across your family health vault.'}
                    </Text>
                  </View>
                ) : (
                  pendingCandidates.map((candidate) => (
                    <View key={candidate.id} style={styles.duplicateCard}>
                      {/* CARD HEADER */}
                      <View style={styles.dupCardHeader}>
                        <View style={styles.dupHeaderLeft}>
                          <View style={styles.dupBadge}>
                            <MaterialIcons name="content-copy" size={14} color="#FF922B" />
                            <Text style={styles.dupBadgeText}>
                              {candidate.matchScore}% Match
                            </Text>
                          </View>
                          <Text style={styles.dupMemberTag}>👤 {candidate.memberName}</Text>
                        </View>
                        <Text style={styles.dupReasonText}>{candidate.matchReason}</Text>
                      </View>

                      {/* PRIMARY TARGET */}
                      <View style={styles.canonicalTargetBox}>
                        <Text style={styles.canonicalTargetLabel}>
                          {isBn ? 'প্রস্তাবিত মূল নাম:' : 'Standardized Canonical Target:'}
                        </Text>
                        <Text style={styles.canonicalTargetValue}>
                          {candidate.primaryStandardName}
                        </Text>
                      </View>

                      {/* SIDE-BY-SIDE RECORDS */}
                      <View style={styles.compareGrid}>
                        {/* RECORD A */}
                        <View style={styles.compareBox}>
                          <View style={styles.compareBoxHeader}>
                            <Text style={styles.compareBoxTag}>Record A</Text>
                            <Text style={styles.compareBoxDate}>📅 {candidate.recordA.date}</Text>
                          </View>
                          <Text style={styles.compareBoxTitle}>{candidate.recordA.title}</Text>
                          {candidate.recordA.providerOrLab && (
                            <Text style={styles.compareBoxSub}>
                              🏥 {candidate.recordA.providerOrLab}
                            </Text>
                          )}
                          {candidate.recordA.costOrValue && (
                            <Text style={styles.compareBoxCost}>
                              💰 {candidate.recordA.costOrValue}
                            </Text>
                          )}
                          {candidate.recordA.notes && (
                            <Text numberOfLines={2} style={styles.compareBoxNotes}>
                              📝 {candidate.recordA.notes}
                            </Text>
                          )}
                        </View>

                        {/* RECORD B */}
                        <View style={[styles.compareBox, styles.compareBoxAlt]}>
                          <View style={styles.compareBoxHeader}>
                            <Text style={[styles.compareBoxTag, { color: '#FF922B' }]}>
                              Record B
                            </Text>
                            <Text style={styles.compareBoxDate}>📅 {candidate.recordB.date}</Text>
                          </View>
                          <Text style={styles.compareBoxTitle}>{candidate.recordB.title}</Text>
                          {candidate.recordB.providerOrLab && (
                            <Text style={styles.compareBoxSub}>
                              🏥 {candidate.recordB.providerOrLab}
                            </Text>
                          )}
                          {candidate.recordB.costOrValue && (
                            <Text style={styles.compareBoxCost}>
                              💰 {candidate.recordB.costOrValue}
                            </Text>
                          )}
                          {candidate.recordB.notes && (
                            <Text numberOfLines={2} style={styles.compareBoxNotes}>
                              📝 {candidate.recordB.notes}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* ACTION BUTTONS */}
                      <View style={styles.actionBtnRow}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleKeepSeparate(candidate)}
                          style={styles.separateBtn}>
                          <MaterialIcons name="call-split" size={16} color={C.onSurfaceVariant} />
                          <Text style={styles.separateBtnText}>
                            {isBn ? 'আলাদা রাখুন' : 'Keep Separate'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.88}
                          onPress={() => handleMergeCandidate(candidate)}
                          style={styles.mergeBtn}>
                          <MaterialIcons name="merge" size={16} color="#101416" />
                          <Text style={styles.mergeBtnText}>
                            {isBn ? 'মার্জ করুন' : 'Merge Records'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 2: NOMENCLATURE STANDARDIZER */}
            {activeTab === 'STANDARDIZE' && (
              <View style={styles.tabContent}>
                {/* 1-TAP BATCH STANDARDIZE BUTTON */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleBatchStandardize}
                  style={styles.batchStandardizeBtn}>
                  <MaterialIcons name="auto-fix-high" size={18} color="#101416" />
                  <Text style={styles.batchStandardizeBtnText}>
                    {isBn
                      ? '১-ট্যাপে সমস্ত নাম আন্তর্জাতিক মানে কনভার্ট করুন'
                      : '1-Tap Standardize All Medical Records'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeaderTitle}>
                  {isBn
                    ? 'ক্লিনিক্যাল পরিভাষা ডিরেক্টরি (৬০+ স্ট্যান্ডার্ড ম্যাপিং)'
                    : 'CANONICAL MEDICAL NOMENCLATURE REGISTRY'}
                </Text>

                <View style={styles.nomenclatureList}>
                  {CANONICAL_MEDICAL_DICTIONARY.map((term) => (
                    <View key={term.canonicalCode} style={styles.termCard}>
                      <View style={styles.termTopRow}>
                        <View style={styles.termCodeBadge}>
                          <Text style={styles.termCodeText}>{term.canonicalCode}</Text>
                        </View>
                        <Text style={styles.termStandardName}>{term.standardName}</Text>
                      </View>

                      <View style={styles.aliasWrap}>
                        <Text style={styles.aliasLabel}>
                          {isBn ? 'চিনহিত ভিন্নরূপ:' : 'Recognized Aliases:'}
                        </Text>
                        <View style={styles.aliasPillRow}>
                          {term.aliases.slice(0, 5).map((a) => (
                            <View key={a} style={styles.aliasPill}>
                              <Text style={styles.aliasPillText}>{a}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {term.description && (
                        <Text style={styles.termDescText}>{term.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 3: CLEANUP AUDIT LOG */}
            {activeTab === 'AUDIT' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeaderTitle}>
                  {isBn ? 'ক্লিনআপ ও মার্জ হিস্ট্রি' : 'CLEANUP & DEDUPLICATION AUDIT TRAIL'}
                </Text>

                <View style={styles.auditList}>
                  {auditLog.map((log) => (
                    <View key={log.id} style={styles.auditCard}>
                      <View style={styles.auditTopRow}>
                        <View
                          style={[
                            styles.auditActionBadge,
                            log.action === 'MERGE'
                              ? { backgroundColor: 'rgba(32, 201, 151, 0.15)' }
                              : log.action === 'STANDARDIZE'
                              ? { backgroundColor: 'rgba(56, 189, 248, 0.15)' }
                              : { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                          ]}>
                          <Text
                            style={[
                              styles.auditActionText,
                              log.action === 'MERGE'
                                ? { color: '#20C997' }
                                : log.action === 'STANDARDIZE'
                                ? { color: '#38BDF8' }
                                : { color: C.onSurfaceVariant },
                            ]}>
                            {log.action}
                          </Text>
                        </View>
                        <Text style={styles.auditTimeText}>{log.timestamp}</Text>
                      </View>

                      <Text style={styles.auditSummaryText}>{log.summary}</Text>
                      <Text style={styles.auditDetailsText}>{log.mergedDetails}</Text>
                    </View>
                  ))}
                </View>
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
  qualityBanner: {
    backgroundColor: '#181F23',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.2)',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#101416',
    borderWidth: 2,
    borderColor: '#20C997',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#20C997',
  },
  scoreLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  statsCol: {
    flex: 1,
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#CBD5E1',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    borderColor: '#20C997',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#20C997',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 14,
  },
  emptyState: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  duplicateCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 146, 43, 0.2)',
  },
  dupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 146, 43, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dupBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FF922B',
  },
  dupMemberTag: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  dupReasonText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  canonicalTargetBox: {
    backgroundColor: '#101416',
    borderRadius: 10,
    padding: 10,
    gap: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#20C997',
  },
  canonicalTargetLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  canonicalTargetValue: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#20C997',
  },
  compareGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  compareBox: {
    flex: 1,
    backgroundColor: '#101416',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  compareBoxAlt: {
    borderColor: 'rgba(255, 146, 43, 0.15)',
  },
  compareBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  compareBoxTag: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#38BDF8',
  },
  compareBoxDate: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  compareBoxTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  compareBoxSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  compareBoxCost: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  compareBoxNotes: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  separateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#101416',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  separateBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  mergeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    borderRadius: 10,
    paddingVertical: 10,
  },
  mergeBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  batchStandardizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 12,
  },
  batchStandardizeBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurfaceVariant,
    letterSpacing: 0.8,
    marginTop: 6,
  },
  nomenclatureList: {
    gap: 10,
  },
  termCard: {
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  termTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termCodeBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  termCodeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  termStandardName: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  aliasWrap: {
    gap: 4,
  },
  aliasLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  aliasPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aliasPill: {
    backgroundColor: '#101416',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aliasPillText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#94A3B8',
  },
  termDescText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    lineHeight: 14,
  },
  auditList: {
    gap: 8,
  },
  auditCard: {
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  auditTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditActionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  auditActionText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  auditTimeText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  auditSummaryText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  auditDetailsText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
});
