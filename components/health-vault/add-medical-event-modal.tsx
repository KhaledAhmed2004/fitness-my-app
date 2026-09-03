import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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

import {
  COMMON_SPECIALTIES,
  SAMPLE_DOCUMENT_IMAGES,
} from '@/components/health-vault/health-vault-constants';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';
import { PrescribedMedicineItem } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

interface AddMedicalEventModalProps {
  visible: boolean;
  onClose: () => void;
}

const FOLLOWUP_PRESETS = [
  { label: '7 Days', days: 7 },
  { label: '15 Days', days: 15 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
];

export function AddMedicalEventModal({
  visible,
  onClose,
}: AddMedicalEventModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const doctors = useHealthVaultStore((s) => s.doctors);
  const addMedicalEvent = useHealthVaultStore((s) => s.addMedicalEvent);
  const addMedicalDocument = useHealthVaultStore((s) => s.addMedicalDocument);
  const addDiagnosticTest = useHealthVaultStore((s) => s.addDiagnosticTest);
  const addFollowUp = useHealthVaultStore((s) => s.addFollowUp);
  const syncMedicinesToCabinet = useHealthVaultStore((s) => s.syncMedicinesToCabinet);

  // Form States
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 'mem_khaled');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [customDoctorName, setCustomDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [diagnosisOrReason, setDiagnosisOrReason] = useState('');
  const [notes, setNotes] = useState('');

  // Vitals
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');

  // Prescribed Medicines
  const [medicines, setMedicines] = useState<PrescribedMedicineItem[]>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('1+0+1');
  const [medDuration, setMedDuration] = useState('7 days');
  const [medInstructions, setMedInstructions] = useState('After meal');
  const [syncToCabinet, setSyncToCabinet] = useState(true);

  // Diagnostic Tests
  const [tests, setTests] = useState<string[]>([]);
  const [testInput, setTestInput] = useState('');

  // Follow-up
  const [hasFollowUp, setHasFollowUp] = useState(true);
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0]
  );
  const [followUpReason, setFollowUpReason] = useState('Routine Medication & Progress Review');

  // Costs & Attachments
  const [consultationCost, setConsultationCost] = useState('1200');
  const [hasPrescriptionImage, setHasPrescriptionImage] = useState(true);

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    void Haptics.selectionAsync().catch(() => {});
    setMedicines([
      ...medicines,
      {
        name: medName.trim(),
        dosage: medDosage.trim(),
        duration: medDuration.trim(),
        instructions: medInstructions.trim(),
      },
    ]);
    setMedName('');
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleAddTest = () => {
    if (!testInput.trim()) return;
    void Haptics.selectionAsync().catch(() => {});
    setTests([...tests, testInput.trim()]);
    setTestInput('');
  };

  const handleRemoveTest = (idx: number) => {
    setTests(tests.filter((_, i) => i !== idx));
  };

  const handleSetPresetFollowup = (days: number) => {
    void Haptics.selectionAsync().catch(() => {});
    const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const handleSaveEvent = async () => {
    if (!diagnosisOrReason.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const docObj = doctors.find((d) => d.id === selectedDoctorId);
    const docName = docObj ? docObj.name : customDoctorName || 'Consultant Physician';
    const hosp = hospital.trim() || docObj?.hospitalOrClinic || 'Chamber Consultation';
    const spec = specialty.trim() || docObj?.specialty || 'General Medicine';

    const costNum = parseFloat(consultationCost) || 0;

    // 1. Create Document if attached
    const docIds: string[] = [];
    if (hasPrescriptionImage) {
      const docId = await addMedicalDocument({
        memberId: selectedMemberId,
        type: 'PRESCRIPTION',
        title: `${docName} Prescription (${eventDate})`,
        documentDate: eventDate,
        doctorId: selectedDoctorId || undefined,
        labOrHospital: hosp,
        fileUri: SAMPLE_DOCUMENT_IMAGES[0],
        fileType: 'image',
        tags: ['Prescription', spec],
        cost: costNum,
      });
      docIds.push(docId);
    }

    // 2. Create Diagnostic Tests
    const testIds: string[] = [];
    for (const t of tests) {
      const tId = await addDiagnosticTest({
        memberId: selectedMemberId,
        testName: t,
        testCategory: 'BLOOD',
        testDate: eventDate,
        doctorId: selectedDoctorId || undefined,
        labOrHospital: hosp,
        status: 'PENDING',
      });
      testIds.push(tId);
    }

    // 3. Create Follow-up if active
    let followUpId: string | undefined;
    if (hasFollowUp && followUpDate) {
      followUpId = await addFollowUp({
        memberId: selectedMemberId,
        doctorId: selectedDoctorId || undefined,
        doctorName: docName,
        dueDate: followUpDate,
        reason: followUpReason || `${diagnosisOrReason} Follow-up`,
        status: 'UPCOMING',
        reminderDaysBefore: [7, 3, 1],
      });
    }

    // 4. Create Medical Event Backbone
    await addMedicalEvent({
      memberId: selectedMemberId,
      title: `${diagnosisOrReason} — ${docName}`,
      eventDate,
      doctorId: selectedDoctorId || undefined,
      doctorName: docName,
      specialty: spec,
      hospitalOrClinic: hosp,
      diagnosisOrReason: diagnosisOrReason.trim(),
      notes: notes.trim(),
      vitalSigns: {
        bloodPressure: bp.trim() || undefined,
        pulse: pulse ? parseInt(pulse) : undefined,
        temperatureF: temp ? parseFloat(temp) : undefined,
        weightKg: weight ? parseFloat(weight) : undefined,
      },
      documentIds: docIds,
      testIds,
      prescribedMedicines: medicines,
      totalCost: costNum,
      followUpId,
    });

    // 5. Sync to Medicine Cabinet
    if (syncToCabinet && medicines.length > 0) {
      void syncMedicinesToCabinet(medicines);
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
                <MaterialIcons name="local-hospital" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>Log Doctor Visit & Event</Text>
                <Text style={styles.subtitle}>
                  Consultation, Prescription, Medicines & Tests
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* 1. PATIENT / FAMILY MEMBER */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. SELECT FAMILY MEMBER *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.membersRow}>
                {members.map((m) => {
                  const isSelected = selectedMemberId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.selectionAsync().catch(() => {});
                        setSelectedMemberId(m.id);
                      }}
                      style={[
                        styles.memberChip,
                        isSelected && {
                          backgroundColor: m.avatarColor,
                          borderColor: m.avatarColor,
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

            {/* 2. DATE & DOCTOR */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. CONSULTATION & DOCTOR</Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Visit Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={eventDate}
                    onChangeText={setEventDate}
                    placeholder="2026-08-29"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Visit Fee (৳)</Text>
                  <TextInput
                    style={styles.input}
                    value={consultationCost}
                    onChangeText={setConsultationCost}
                    placeholder="1200"
                    placeholderTextColor={C.onSurfaceVariant}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Doctors Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Doctor</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.docChipsRow}>
                  {doctors.map((d) => {
                    const isSelected = selectedDoctorId === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setSelectedDoctorId(d.id);
                        }}
                        style={[
                          styles.docChip,
                          isSelected && styles.docChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.docChipText,
                            isSelected && styles.docChipTextActive,
                          ]}>
                          {d.name.split(' (')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hospital or Chamber</Text>
                <TextInput
                  style={styles.input}
                  value={hospital}
                  onChangeText={setHospital}
                  placeholder="e.g. Square Hospital / Ibn Sina"
                  placeholderTextColor={C.onSurfaceVariant}
                />
              </View>
            </View>

            {/* 3. DIAGNOSIS & REASON */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. DIAGNOSIS & REASON FOR VISIT *</Text>
              <TextInput
                style={styles.input}
                value={diagnosisOrReason}
                onChangeText={setDiagnosisOrReason}
                placeholder="e.g. High blood pressure routine review, Fever, Joint pain"
                placeholderTextColor={C.onSurfaceVariant}
              />
            </View>

            {/* 4. VITALS (OPTIONAL) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. VITALS RECORDED (OPTIONAL)</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Blood Pressure</Text>
                  <TextInput
                    style={styles.input}
                    value={bp}
                    onChangeText={setBp}
                    placeholder="120/80"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Pulse (bpm)</Text>
                  <TextInput
                    style={styles.input}
                    value={pulse}
                    onChangeText={setPulse}
                    placeholder="72"
                    placeholderTextColor={C.onSurfaceVariant}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Temp (°F)</Text>
                  <TextInput
                    style={styles.input}
                    value={temp}
                    onChangeText={setTemp}
                    placeholder="98.4"
                    placeholderTextColor={C.onSurfaceVariant}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* 5. PRESCRIBED MEDICINES */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>5. PRESCRIBED MEDICINES</Text>
                <View style={styles.switchWrapper}>
                  <Text style={styles.switchLabel}>Sync to Cabinet</Text>
                  <Switch
                    value={syncToCabinet}
                    onValueChange={setSyncToCabinet}
                    trackColor={{ false: '#263035', true: '#20C997' }}
                  />
                </View>
              </View>

              {/* Add Medicine Mini-Form */}
              <View style={styles.medMiniForm}>
                <TextInput
                  style={[styles.input, { flex: 1.5 }]}
                  value={medName}
                  onChangeText={setMedName}
                  placeholder="Medicine Name (e.g. Napa 500mg)"
                  placeholderTextColor={C.onSurfaceVariant}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={medDosage}
                  onChangeText={setMedDosage}
                  placeholder="Dosage (1+0+1)"
                  placeholderTextColor={C.onSurfaceVariant}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddMedicine}
                  style={styles.addMedBtn}>
                  <MaterialIcons name="add" size={18} color="#101416" />
                </TouchableOpacity>
              </View>

              {/* Medicine List */}
              {medicines.map((m, idx) => (
                <View key={idx} style={styles.medItemRow}>
                  <Text style={styles.medItemName}>{m.name}</Text>
                  <Text style={styles.medItemDose}>
                    {m.dosage} ({m.duration})
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveMedicine(idx)}>
                    <MaterialIcons name="close" size={16} color={C.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* 6. ORDERED DIAGNOSTIC TESTS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. ORDERED DIAGNOSTIC TESTS</Text>
              <View style={styles.testMiniForm}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={testInput}
                  onChangeText={setTestInput}
                  placeholder="e.g. CBC, Lipid Profile, Chest X-Ray"
                  placeholderTextColor={C.onSurfaceVariant}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddTest}
                  style={styles.addTestBtn}>
                  <MaterialIcons name="add" size={18} color="#101416" />
                  <Text style={styles.addTestBtnText}>Add Test</Text>
                </TouchableOpacity>
              </View>

              {/* Test List Chips */}
              <View style={styles.testChipsRow}>
                {tests.map((t, idx) => (
                  <View key={idx} style={styles.testChip}>
                    <Text style={styles.testChipText}>{t}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTest(idx)}>
                      <MaterialIcons name="close" size={14} color="#38BDF8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* 7. FOLLOW-UP CARE */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>7. FOLLOW-UP APPOINTMENT</Text>
                <Switch
                  value={hasFollowUp}
                  onValueChange={setHasFollowUp}
                  trackColor={{ false: '#263035', true: '#38BDF8' }}
                />
              </View>

              {hasFollowUp && (
                <View style={styles.followUpBox}>
                  {/* Preset Chips */}
                  <View style={styles.followUpPresetsRow}>
                    {FOLLOWUP_PRESETS.map((p) => (
                      <TouchableOpacity
                        key={p.days}
                        onPress={() => handleSetPresetFollowup(p.days)}
                        style={styles.presetChip}>
                        <Text style={styles.presetChipText}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Follow-up Due Date</Text>
                    <TextInput
                      style={styles.input}
                      value={followUpDate}
                      onChangeText={setFollowUpDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reason / Review Notes</Text>
                    <TextInput
                      style={styles.input}
                      value={followUpReason}
                      onChangeText={setFollowUpReason}
                      placeholder="e.g. Review BP medication progress"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 8. ATTACH PRESCRIPTION */}
            <View style={styles.section}>
              <View style={styles.attachBox}>
                <View style={styles.attachLeft}>
                  <MaterialIcons name="camera-alt" size={20} color="#20C997" />
                  <View>
                    <Text style={styles.attachTitle}>Attach Prescription Photo</Text>
                    <Text style={styles.attachSub}>Save document in health vault</Text>
                  </View>
                </View>

                <Switch
                  value={hasPrescriptionImage}
                  onValueChange={setHasPrescriptionImage}
                  trackColor={{ false: '#263035', true: '#20C997' }}
                />
              </View>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSaveEvent}
              style={styles.saveEventBtn}>
              <MaterialIcons name="check" size={20} color="#101416" />
              <Text style={styles.saveEventBtnText}>Save Consultation & Timeline</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    fontSize: 15,
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
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  membersRow: {
    gap: 8,
    paddingVertical: 2,
  },
  memberChip: {
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
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
    backgroundColor: '#181F23',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontFamily: F.medium,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  docChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  docChip: {
    backgroundColor: '#181F23',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docChipActive: {
    backgroundColor: '#20C997',
  },
  docChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  docChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  medMiniForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addMedBtn: {
    backgroundColor: '#FF922B',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F23',
    padding: 8,
    borderRadius: 8,
  },
  medItemName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  medItemDose: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginRight: 8,
  },
  testMiniForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addTestBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  testChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
  },
  followUpBox: {
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  followUpPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
  },
  attachBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F23',
    padding: 12,
    borderRadius: 12,
  },
  attachLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  attachSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  saveEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveEventBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
});
