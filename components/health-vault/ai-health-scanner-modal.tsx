import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useMedicineStore } from '@/stores/medicine-store';
import {
  extractLabReportOCR,
  extractPrescriptionOCR,
  ExtractedLabReportOCR,
  ExtractedPrescriptionOCR,
} from '@/services/gemini-health-ocr';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

type ScanMode = 'PRESCRIPTION' | 'LAB_REPORT';

interface AIHealthScannerModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: ScanMode;
}

export function AIHealthScannerModal({
  visible,
  onClose,
  initialMode = 'PRESCRIPTION',
}: AIHealthScannerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const addMedicalEvent = useHealthVaultStore((s) => s.addMedicalEvent);
  const addMedicalDocument = useHealthVaultStore((s) => s.addMedicalDocument);
  const addLabResult = useHealthVaultStore((s) => s.addLabResult);
  const addMedicine = useMedicineStore((s) => s.addMedicine);

  const initialMember =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMember);
  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedPrescription, setExtractedPrescription] =
    useState<ExtractedPrescriptionOCR | null>(null);
  const [extractedLab, setExtractedLab] = useState<ExtractedLabReportOCR | null>(
    null
  );
  const [syncToCabinet, setSyncToCabinet] = useState(true);

  const handleStartScan = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsScanning(true);
    setExtractedPrescription(null);
    setExtractedLab(null);

    try {
      if (scanMode === 'PRESCRIPTION') {
        const result = await extractPrescriptionOCR();
        setExtractedPrescription(result);
      } else {
        const result = await extractLabReportOCR();
        setExtractedLab(result);
      }
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleImportPrescription = async () => {
    if (!extractedPrescription) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );

    const docId = `doc_${Date.now()}`;
    const eventId = `evt_${Date.now()}`;
    const today = extractedPrescription.date || new Date().toISOString().split('T')[0];

    // 1. Create Document Record
    await addMedicalDocument({
      memberId: activeMemberId,
      eventId: eventId,
      type: 'PRESCRIPTION',
      title: `Prescription - ${extractedPrescription.doctorName || 'Doctor Visit'}`,
      documentDate: today,
      fileUri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
      fileType: 'image',
      labOrHospital: extractedPrescription.clinicOrHospital,
      tags: ['AI-Scanned', 'Prescription'],
    });

    // 2. Create Medical Event Container
    await addMedicalEvent({
      memberId: activeMemberId,
      title: `Consultation: ${extractedPrescription.diagnosisOrSymptoms || 'General Checkup'}`,
      eventDate: today,
      doctorName: extractedPrescription.doctorName,
      hospitalOrClinic: extractedPrescription.clinicOrHospital,
      diagnosisOrReason: extractedPrescription.diagnosisOrSymptoms || 'Consultation',
      notes: extractedPrescription.advice,
      documentIds: [docId],
      testIds: [],
      prescribedMedicines: [],
      totalCost: 0,
    });

    // 3. Sync to Medicine Cabinet
    if (syncToCabinet && extractedPrescription.medications.length > 0) {
      for (const med of extractedPrescription.medications) {
        addMedicine({
          name: med.name,
          type: 'medicine',
          formFactor: 'pill',
          unit: 'pill',
          trackInventory: true,
          currentStock: med.quantity || 30,
          totalPackSize: med.quantity || 30,
          lowStockThreshold: 5,
          isAsNeeded: false,
          isCourse: true,
          courseDurationDays: med.durationDays || 30,
          courseStartDate: today,
          instructions: med.instructions || 'As prescribed',
          schedules: [
            {
              id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              time: '08:00 AM',
              timeCategory: 'morning',
              doseAmount: 1,
              instructions: med.instructions,
            },
          ],
        });
      }
    }

    onClose();
  };

  const handleImportLabResults = async () => {
    if (!extractedLab) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );

    const docId = `doc_${Date.now()}`;
    const testDate = extractedLab.testDate || new Date().toISOString().split('T')[0];

    // 1. Create Diagnostic Report Document
    await addMedicalDocument({
      memberId: activeMemberId,
      type: 'LAB_REPORT',
      title: `${extractedLab.testName || 'Diagnostic Report'} - ${
        extractedLab.labName || 'Diagnostic Lab'
      }`,
      documentDate: testDate,
      fileUri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80',
      fileType: 'image',
      labOrHospital: extractedLab.labName,
      tags: ['AI-Scanned', 'Lab-Report'],
    });

    // 2. Insert Structured Analyte Readings
    for (const an of extractedLab.analytes) {
      await addLabResult({
        memberId: activeMemberId,
        documentId: docId,
        testName: extractedLab.testName || 'Diagnostic Test',
        testDate,
        referenceSource: extractedLab.labName,
        analyteName: an.analyteName,
        analyteCode: an.analyteCode,
        numericValue: an.numericValue,
        unit: an.unit,
        valueType: 'NUMERIC',
        referenceRange: {
          text: an.referenceRange,
        },
      });
    }

    onClose();
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
                <MaterialIcons name="document-scanner" size={20} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>AI Health Document Scanner</Text>
                <Text style={styles.subtitle}>
                  Vision OCR for Prescriptions & Lab Reports
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* MODE SELECTOR */}
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setScanMode('PRESCRIPTION');
                setExtractedPrescription(null);
                setExtractedLab(null);
              }}
              style={[
                styles.modeTab,
                scanMode === 'PRESCRIPTION' && styles.modeTabActive,
              ]}>
              <MaterialIcons
                name="medical-services"
                size={16}
                color={scanMode === 'PRESCRIPTION' ? '#101416' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.modeTabText,
                  scanMode === 'PRESCRIPTION' && styles.modeTabTextActive,
                ]}>
                Prescription OCR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setScanMode('LAB_REPORT');
                setExtractedPrescription(null);
                setExtractedLab(null);
              }}
              style={[
                styles.modeTab,
                scanMode === 'LAB_REPORT' && styles.modeTabActive,
              ]}>
              <MaterialIcons
                name="insights"
                size={16}
                color={scanMode === 'LAB_REPORT' ? '#101416' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.modeTabText,
                  scanMode === 'LAB_REPORT' && styles.modeTabTextActive,
                ]}>
                Lab Report OCR
              </Text>
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* CAMERA / SCANNER HUD VIEWER */}
            <View style={styles.scannerHud}>
              <View style={styles.hudCornerTL} />
              <View style={styles.hudCornerTR} />
              <View style={styles.hudCornerBL} />
              <View style={styles.hudCornerBR} />

              <MaterialIcons
                name={scanMode === 'PRESCRIPTION' ? 'receipt-long' : 'biotech'}
                size={48}
                color="rgba(56, 189, 248, 0.6)"
              />
              <Text style={styles.hudTitle}>
                {scanMode === 'PRESCRIPTION'
                  ? 'Doctor Prescription Scanner'
                  : 'Diagnostic Lab Report Scanner'}
              </Text>
              <Text style={styles.hudSub}>
                Position the document inside the frame or click Scan Sample Image
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isScanning}
                onPress={handleStartScan}
                style={styles.scanActionBtn}>
                {isScanning ? (
                  <ActivityIndicator size="small" color="#101416" />
                ) : (
                  <>
                    <MaterialIcons name="camera-alt" size={18} color="#101416" />
                    <Text style={styles.scanActionBtnText}>
                      Run AI Vision Scan
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* EXTRACTED PRESCRIPTION RESULTS */}
            {extractedPrescription && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <MaterialIcons name="check-circle" size={18} color="#20C997" />
                  <Text style={styles.resultTitle}>
                    AI EXTRACTED PRESCRIPTION DATA
                  </Text>
                </View>

                <View style={styles.resultField}>
                  <Text style={styles.fieldLabel}>DOCTOR & CLINIC</Text>
                  <Text style={styles.fieldValue}>
                    {extractedPrescription.doctorName} (
                    {extractedPrescription.degrees})
                  </Text>
                  <Text style={styles.fieldSub}>
                    {extractedPrescription.clinicOrHospital} • {extractedPrescription.date}
                  </Text>
                </View>

                {extractedPrescription.diagnosisOrSymptoms ? (
                  <View style={styles.resultField}>
                    <Text style={styles.fieldLabel}>DIAGNOSIS / SYMPTOMS</Text>
                    <Text style={styles.fieldValue}>
                      {extractedPrescription.diagnosisOrSymptoms}
                    </Text>
                  </View>
                ) : null}

                {/* Parsed Medications */}
                <View style={styles.resultField}>
                  <Text style={styles.fieldLabel}>
                    PRESCRIBED MEDICINES ({extractedPrescription.medications.length})
                  </Text>
                  <View style={styles.medsList}>
                    {extractedPrescription.medications.map((m, idx) => (
                      <View key={idx} style={styles.medItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.medName}>{m.name}</Text>
                          <Text style={styles.medDosage}>
                            Dosage: {m.dosage} ({m.frequency}) • {m.instructions}
                          </Text>
                        </View>
                        <View style={styles.medQtyBadge}>
                          <Text style={styles.medQtyText}>{m.quantity} pills</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Advised Tests */}
                {extractedPrescription.advisedTests?.length ? (
                  <View style={styles.resultField}>
                    <Text style={styles.fieldLabel}>ADVISED TESTS</Text>
                    <Text style={styles.fieldSub}>
                      {extractedPrescription.advisedTests.join(' • ')}
                    </Text>
                  </View>
                ) : null}

                {/* Cabinet Sync Checkbox */}
                <TouchableOpacity
                  onPress={() => setSyncToCabinet((prev) => !prev)}
                  style={styles.syncRow}>
                  <MaterialIcons
                    name={syncToCabinet ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color="#38BDF8"
                  />
                  <Text style={styles.syncRowText}>
                    Auto-sync medicines into Nutrition & Medicine Cabinet
                  </Text>
                </TouchableOpacity>

                {/* Import Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleImportPrescription}
                  style={styles.importBtn}>
                  <MaterialIcons name="save-alt" size={18} color="#FFFFFF" />
                  <Text style={styles.importBtnText}>
                    Save to Health Vault & Timeline
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* EXTRACTED LAB RESULTS */}
            {extractedLab && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <MaterialIcons name="check-circle" size={18} color="#20C997" />
                  <Text style={styles.resultTitle}>AI EXTRACTED LAB BIOMARKERS</Text>
                </View>

                <View style={styles.resultField}>
                  <Text style={styles.fieldLabel}>DIAGNOSTIC TEST PANEL</Text>
                  <Text style={styles.fieldValue}>{extractedLab.testName}</Text>
                  <Text style={styles.fieldSub}>
                    {extractedLab.labName} • {extractedLab.testDate}
                  </Text>
                </View>

                {/* Analyte Parameters */}
                <View style={styles.resultField}>
                  <Text style={styles.fieldLabel}>
                    BIOMARKER READINGS ({extractedLab.analytes.length})
                  </Text>
                  <View style={styles.analytesList}>
                    {extractedLab.analytes.map((an, idx) => (
                      <View key={idx} style={styles.analyteRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.analyteName}>{an.analyteName}</Text>
                          <Text style={styles.analyteRef}>
                            Ref: {an.referenceRange || 'Standard'}
                          </Text>
                        </View>
                        <View style={styles.analyteValBadge}>
                          <Text style={styles.analyteValText}>
                            {an.numericValue} {an.unit}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Import Lab Results Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleImportLabResults}
                  style={styles.importBtn}>
                  <MaterialIcons name="insights" size={18} color="#FFFFFF" />
                  <Text style={styles.importBtnText}>
                    Import into Biomarker Trend Charts
                  </Text>
                </TouchableOpacity>
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
  closeBtn: {
    padding: 6,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#141A1D',
    padding: 6,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#38BDF8',
  },
  modeTabText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  modeTabTextActive: {
    color: '#101416',
    fontFamily: F.bold,
  },
  membersBar: {
    backgroundColor: '#101416',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#181F23',
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
  scannerHud: {
    position: 'relative',
    backgroundColor: '#141B1F',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  hudCornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#38BDF8',
  },
  hudCornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38BDF8',
  },
  hudCornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#38BDF8',
  },
  hudCornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#38BDF8',
  },
  hudTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  hudSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  scanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  scanActionBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#101416',
  },
  resultCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.3)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
    letterSpacing: 0.5,
  },
  resultField: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  fieldSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  medsList: {
    gap: 8,
    marginTop: 4,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13191C',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  medName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#38BDF8',
  },
  medDosage: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  medQtyBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  medQtyText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  analytesList: {
    gap: 6,
    marginTop: 4,
  },
  analyteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13191C',
    padding: 10,
    borderRadius: 10,
  },
  analyteName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  analyteRef: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  analyteValBadge: {
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  analyteValText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#20C997',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  syncRowText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  importBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
});
