import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
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

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface InsuranceClaimExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InsuranceClaimExportModal({
  visible,
  onClose,
}: InsuranceClaimExportModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const admissions = useHealthVaultStore((s) => s.admissions);
  const expenses = useHealthVaultStore((s) => s.expenses);
  const documents = useHealthVaultStore((s) => s.documents);

  const initialMember =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMember);

  const member = useMemo(
    () => members.find((m) => m.id === activeMemberId) || members[0],
    [members, activeMemberId]
  );

  const memberAdmissions = useMemo(
    () => admissions.filter((a) => a.memberId === activeMemberId),
    [admissions, activeMemberId]
  );

  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(
    memberAdmissions[0]?.id || null
  );

  const selectedAdm = useMemo(
    () =>
      memberAdmissions.find((a) => a.id === selectedAdmissionId) ||
      memberAdmissions[0] ||
      admissions[0],
    [memberAdmissions, selectedAdmissionId, admissions]
  );

  const memberExpenses = useMemo(
    () => expenses.filter((e) => e.memberId === activeMemberId),
    [expenses, activeMemberId]
  );

  const memberDocs = useMemo(
    () => documents.filter((d) => d.memberId === activeMemberId),
    [documents, activeMemberId]
  );

  const [isCopied, setIsCopied] = useState(false);

  // Financial Rollup
  const hospitalBill = selectedAdm?.totalHospitalBill || 0;
  const medExpensesTotal = useMemo(
    () =>
      memberExpenses
        .filter((e) => e.category === 'MEDICINE')
        .reduce((sum, e) => sum + e.amount, 0),
    [memberExpenses]
  );
  const labExpensesTotal = useMemo(
    () =>
      memberExpenses
        .filter((e) => e.category === 'DIAGNOSTIC_TEST')
        .reduce((sum, e) => sum + e.amount, 0),
    [memberExpenses]
  );
  const totalClaimAmount = hospitalBill + medExpensesTotal + labExpensesTotal;
  const totalOutOfPocket = selectedAdm?.outOfPocketPaid || hospitalBill;

  const generateClaimText = () => {
    return `
=====================================================
🏥 HEALTH INSURANCE REIMBURSEMENT CLAIM DOSSIER
=====================================================
CLAIM REFERENCE: CLM-${Date.now().toString().substring(6)}
DATE GENERATED: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}

1. POLICYHOLDER & PATIENT INFORMATION:
-----------------------------------------------------
• Patient Name: ${member?.name || 'Khaled Hossain'}
• Relationship: ${member?.relation || 'Self'}
• Blood Group: ${member?.bloodGroup || 'B+'}
• Emergency Contact: ${member?.emergencyContactPhone || 'N/A'}

2. HOSPITAL INPATIENT & SURGERY DETAILS:
-----------------------------------------------------
• Hospital: ${selectedAdm?.hospitalName || 'Square Hospital, Dhaka'}
• Reason / Procedure: ${selectedAdm?.reason || 'Appendectomy'}
• Department: ${selectedAdm?.department || 'General Surgery'}
• Attending Doctor / Surgeon: ${selectedAdm?.doctorInCharge || 'Prof. Dr. M. A. Rahman'}
• Cabin / Bed No: ${selectedAdm?.cabinOrBedNo || 'Cabin 712'}
• Admission Date: ${selectedAdm?.admissionDate || 'N/A'}
• Discharge Date: ${selectedAdm?.dischargeDate || 'N/A'}
• Admission Status: ${selectedAdm?.status || 'DISCHARGED'}
• Discharge Notes: ${selectedAdm?.notes || 'Post-operative recovery stable'}

3. ITEMIZED MEDICAL EXPENSES & CHARGES:
-----------------------------------------------------
• Hospital Inpatient Bill: ৳${hospitalBill.toLocaleString()}
• Attached Pharmacy Medicines: ৳${medExpensesTotal.toLocaleString()}
• Diagnostic & Pathology Tests: ৳${labExpensesTotal.toLocaleString()}
-----------------------------------------------------
• TOTAL CLAIM SUBMISSION AMOUNT: ৳${totalClaimAmount.toLocaleString()}
• OUT-OF-POCKET EXPENSES PAID: ৳${totalOutOfPocket.toLocaleString()}

4. ATTACHED DIGITAL VERIFICATION DOCUMENTS:
-----------------------------------------------------
${memberDocs.map((d, i) => `${i + 1}. [${d.type}] ${d.title} (${d.documentDate})`).join('\n')}

=====================================================
Generated securely via TrackMe Family Health OS
=====================================================
`.trim();
  };

  const handleCopyClaim = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    const text = generateClaimText();
    await Clipboard.setStringAsync(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
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
                <MaterialIcons name="policy" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>Insurance Claim Packet</Text>
                <Text style={styles.subtitle}>
                  1-Click Consolidated Hospital & Pharmacy Dossier
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* MEMBER SELECTOR */}
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
                        backgroundColor: '#20C997',
                        borderColor: '#20C997',
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* ADMISSION SELECTION */}
            {memberAdmissions.length > 1 && (
              <View style={styles.admSelectRow}>
                <Text style={styles.admSelectLabel}>SELECT INPATIENT RECORD:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}>
                  {memberAdmissions.map((adm) => (
                    <TouchableOpacity
                      key={adm.id}
                      onPress={() => setSelectedAdmissionId(adm.id)}
                      style={[
                        styles.admPill,
                        selectedAdm?.id === adm.id && styles.admPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.admPillText,
                          selectedAdm?.id === adm.id && styles.admPillTextActive,
                        ]}>
                        {adm.reason} ({adm.admissionDate})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* FORMAL CLAIM SUMMARY CARD */}
            <View style={styles.claimCard}>
              <View style={styles.claimHeader}>
                <View>
                  <Text style={styles.claimBadge}>OFFICIAL CLAIM DOSSIER</Text>
                  <Text style={styles.claimHospital}>
                    {selectedAdm?.hospitalName || 'Hospital Admission'}
                  </Text>
                  <Text style={styles.claimProcedure}>
                    {selectedAdm?.reason || 'Medical Inpatient'} •{' '}
                    {selectedAdm?.department || 'General Surgery'}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {selectedAdm?.status || 'DISCHARGED'}
                  </Text>
                </View>
              </View>

              {/* Patient & Inpatient Meta */}
              <View style={styles.metaGrid}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>PATIENT</Text>
                  <Text style={styles.metaVal}>{member?.name}</Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>BLOOD GROUP</Text>
                  <Text style={[styles.metaVal, { color: '#F43F5E' }]}>
                    {member?.bloodGroup || 'B+'}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>SURGEON / DOCTOR</Text>
                  <Text style={styles.metaVal}>
                    {selectedAdm?.doctorInCharge || 'Attending Physician'}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>CABIN / BED #</Text>
                  <Text style={styles.metaVal}>
                    {selectedAdm?.cabinOrBedNo || 'Cabin 712'}
                  </Text>
                </View>
              </View>

              {/* Financial Breakdown Table */}
              <View style={styles.billTable}>
                <Text style={styles.tableTitle}>ITEMIZED FINANCIAL CHARGES</Text>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Hospital Inpatient & Cabin</Text>
                  <Text style={styles.tableValue}>
                    ৳{hospitalBill.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Pharmacy Medicines & Drugs</Text>
                  <Text style={styles.tableValue}>
                    ৳{medExpensesTotal.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Pathology & Diagnostic Tests</Text>
                  <Text style={styles.tableValue}>
                    ৳{labExpensesTotal.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.tableRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL CLAIM VALUE</Text>
                  <Text style={styles.totalValue}>
                    ৳{totalClaimAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Attached Documents List */}
              <View style={styles.docsSection}>
                <Text style={styles.tableTitle}>
                  ATTACHED VERIFICATION DOCS ({memberDocs.length})
                </Text>
                {memberDocs.slice(0, 4).map((d) => (
                  <View key={d.id} style={styles.docItemRow}>
                    <MaterialIcons name="description" size={14} color="#38BDF8" />
                    <Text style={styles.docItemTitle} numberOfLines={1}>
                      {d.title}
                    </Text>
                    <Text style={styles.docItemDate}>{d.documentDate}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleCopyClaim}
              style={styles.copyBtn}>
              <MaterialIcons
                name={isCopied ? 'check' : 'content-copy'}
                size={18}
                color="#101416"
              />
              <Text style={styles.copyBtnText}>
                {isCopied
                  ? 'Claim Dossier Copied to Clipboard!'
                  : 'Copy Formatted Claim Dossier Text'}
              </Text>
            </TouchableOpacity>
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
    borderBottomColor: 'rgba(32, 201, 151, 0.15)',
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
  scrollBody: {
    padding: 16,
    gap: 14,
  },
  admSelectRow: {
    gap: 6,
  },
  admSelectLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  admPill: {
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  admPillActive: {
    backgroundColor: '#20C997',
  },
  admPillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  admPillTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  claimCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 12,
  },
  claimBadge: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
    letterSpacing: 0.5,
  },
  claimHospital: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 2,
  },
  claimProcedure: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#20C997',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#13191C',
    padding: 12,
    borderRadius: 12,
  },
  metaCell: {
    width: '48%',
    gap: 2,
  },
  metaLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  metaVal: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  billTable: {
    gap: 8,
  },
  tableTitle: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tableLabel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  tableValue: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#20C997',
  },
  totalValue: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#20C997',
  },
  docsSection: {
    gap: 6,
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#13191C',
    padding: 8,
    borderRadius: 8,
  },
  docItemTitle: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  docItemDate: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
});
