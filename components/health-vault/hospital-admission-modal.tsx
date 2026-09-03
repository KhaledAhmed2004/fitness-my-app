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

import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

interface HospitalAdmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onViewDischargeSummary?: (docId: string) => void;
}

export function HospitalAdmissionModal({
  visible,
  onClose,
  onViewDischargeSummary,
}: HospitalAdmissionModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const getHospitalAdmissions = useHealthVaultStore((s) => s.getHospitalAdmissions);
  const addHospitalAdmission = useHealthVaultStore((s) => s.addHospitalAdmission);
  const updateHospitalAdmission = useHealthVaultStore((s) => s.updateHospitalAdmission);
  const deleteHospitalAdmission = useHealthVaultStore((s) => s.deleteHospitalAdmission);

  const initialMemberId =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMemberId);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [hospitalName, setHospitalName] = useState('Square Hospital, Dhaka');
  const [admissionDate, setAdmissionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dischargeDate, setDischargeDate] = useState('');
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('Cardiology & Inpatient');
  const [doctorInCharge, setDoctorInCharge] = useState('Prof. Dr. M. A. Rahman');
  const [cabinOrBedNo, setCabinOrBedNo] = useState('Cabin 712');
  const [totalBill, setTotalBill] = useState('');
  const [insuranceClaimed, setInsuranceClaimed] = useState('0');
  const [outOfPocket, setOutOfPocket] = useState('');
  const [status, setStatus] = useState<'ADMITTED' | 'DISCHARGED'>('DISCHARGED');
  const [notes, setNotes] = useState('');

  const admissions = useMemo(
    () => getHospitalAdmissions(activeMemberId),
    [getHospitalAdmissions, activeMemberId]
  );

  const handleSaveAdmission = async () => {
    if (!hospitalName.trim() || !reason.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );

    const bill = parseFloat(totalBill) || 0;
    const ins = parseFloat(insuranceClaimed) || 0;
    const oop = parseFloat(outOfPocket) || bill - ins;

    await addHospitalAdmission({
      memberId: activeMemberId,
      hospitalName: hospitalName.trim(),
      admissionDate,
      dischargeDate: dischargeDate.trim() || undefined,
      reason: reason.trim(),
      department: department.trim() || undefined,
      doctorInCharge: doctorInCharge.trim() || undefined,
      cabinOrBedNo: cabinOrBedNo.trim() || undefined,
      totalHospitalBill: bill,
      insuranceClaimed: ins,
      outOfPocketPaid: oop,
      status,
      notes: notes.trim() || undefined,
    });

    setReason('');
    setTotalBill('');
    setOutOfPocket('');
    setNotes('');
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
                <MaterialIcons name="local-hospital" size={20} color="#F43F5E" />
              </View>
              <View>
                <Text style={styles.title}>Hospital & Inpatient Log</Text>
                <Text style={styles.subtitle}>
                  Surgeries, Admissions & Discharge Summaries
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
                  size={16}
                  color="#101416"
                />
                <Text style={styles.addBtnText}>
                  {isAdding ? 'Cancel' : 'Log Admission'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

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
                        backgroundColor: '#F43F5E',
                        borderColor: '#F43F5E',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#FFFFFF', fontFamily: F.bold },
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
            {isAdding ? (
              /* LOG HOSPITAL ADMISSION FORM */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>NEW HOSPITAL ADMISSION / SURGERY</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hospital / Medical Center Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={hospitalName}
                    onChangeText={setHospitalName}
                    placeholder="e.g. Square Hospital, United Hospital, Evercare"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason for Admission / Surgery *</Text>
                  <TextInput
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="e.g. Appendectomy, Observation for Chest Pain"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Admission Date</Text>
                    <TextInput
                      style={styles.input}
                      value={admissionDate}
                      onChangeText={setAdmissionDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Discharge Date</Text>
                    <TextInput
                      style={styles.input}
                      value={dischargeDate}
                      onChangeText={setDischargeDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1.2 }]}>
                    <Text style={styles.inputLabel}>Department / Specialty</Text>
                    <TextInput
                      style={styles.input}
                      value={department}
                      onChangeText={setDepartment}
                      placeholder="e.g. General Surgery"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Cabin / Bed #</Text>
                    <TextInput
                      style={styles.input}
                      value={cabinOrBedNo}
                      onChangeText={setCabinOrBedNo}
                      placeholder="Cabin 502"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Surgeon / Doctor in Charge</Text>
                  <TextInput
                    style={styles.input}
                    value={doctorInCharge}
                    onChangeText={setDoctorInCharge}
                    placeholder="e.g. Prof. Dr. M. A. Rahman"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Total Bill (৳)</Text>
                    <TextInput
                      style={[styles.input, styles.moneyInput]}
                      value={totalBill}
                      onChangeText={setTotalBill}
                      keyboardType="numeric"
                      placeholder="45000"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Out-of-Pocket Paid (৳)</Text>
                    <TextInput
                      style={[styles.input, styles.moneyInput]}
                      value={outOfPocket}
                      onChangeText={setOutOfPocket}
                      keyboardType="numeric"
                      placeholder="45000"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Admission Status</Text>
                  <View style={styles.statusChipsRow}>
                    <TouchableOpacity
                      onPress={() => setStatus('ADMITTED')}
                      style={[
                        styles.statusChip,
                        status === 'ADMITTED' && {
                          backgroundColor: '#FF922B',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.statusChipText,
                          status === 'ADMITTED' && { color: '#101416', fontFamily: F.bold },
                        ]}>
                        Currently Admitted
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setStatus('DISCHARGED')}
                      style={[
                        styles.statusChip,
                        status === 'DISCHARGED' && {
                          backgroundColor: '#20C997',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.statusChipText,
                          status === 'DISCHARGED' && { color: '#101416', fontFamily: F.bold },
                        ]}>
                        Discharged Stable
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Discharge Notes & Advice</Text>
                  <TextInput
                    style={styles.input}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g. Suture removal in 7 days, strict bed rest"
                    placeholderTextColor={C.onSurfaceVariant}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveAdmission}
                  style={styles.saveAdmissionBtn}>
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.saveAdmissionBtnText}>Save Admission Record</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ADMISSIONS HISTORY LIST */
              <View style={styles.historyContainer}>
                <Text style={styles.sectionHeaderTitle}>
                  HOSPITALIZATION & SURGERY HISTORY ({admissions.length})
                </Text>

                {admissions.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <MaterialIcons
                      name="local-hospital"
                      size={36}
                      color={C.onSurfaceVariant}
                    />
                    <Text style={styles.emptyTitle}>No Hospital Records Found</Text>
                    <Text style={styles.emptySub}>
                      Inpatient records, surgeries, and discharge summaries will be logged here.
                    </Text>
                  </View>
                ) : (
                  admissions.map((adm) => (
                    <View key={adm.id} style={styles.admCard}>
                      <View style={styles.admTop}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.admTitleRow}>
                            <Text style={styles.admReason}>{adm.reason}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                adm.status === 'ADMITTED'
                                  ? { backgroundColor: 'rgba(255, 146, 43, 0.15)' }
                                  : { backgroundColor: 'rgba(32, 201, 151, 0.15)' },
                              ]}>
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  adm.status === 'ADMITTED'
                                    ? { color: '#FF922B' }
                                    : { color: '#20C997' },
                                ]}>
                                {adm.status}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.admHospital}>
                            {adm.hospitalName} • {adm.department || 'Inpatient'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.admMetaRow}>
                        <View style={styles.metaCol}>
                          <Text style={styles.metaLabel}>ADMITTED</Text>
                          <Text style={styles.metaVal}>{adm.admissionDate}</Text>
                        </View>
                        {adm.dischargeDate ? (
                          <View style={styles.metaCol}>
                            <Text style={styles.metaLabel}>DISCHARGED</Text>
                            <Text style={styles.metaVal}>{adm.dischargeDate}</Text>
                          </View>
                        ) : null}
                        {adm.cabinOrBedNo ? (
                          <View style={styles.metaCol}>
                            <Text style={styles.metaLabel}>CABIN / BED</Text>
                            <Text style={styles.metaVal}>{adm.cabinOrBedNo}</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Financial Pill */}
                      <View style={styles.finPillRow}>
                        <View style={styles.finPill}>
                          <Text style={styles.finLabel}>Total Bill:</Text>
                          <Text style={styles.finVal}>
                            ৳{adm.totalHospitalBill.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.finPill}>
                          <Text style={styles.finLabel}>Out of Pocket:</Text>
                          <Text style={[styles.finVal, { color: '#F43F5E' }]}>
                            ৳{adm.outOfPocketPaid.toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {adm.notes ? (
                        <Text style={styles.admNotesText}>Note: {adm.notes}</Text>
                      ) : null}

                      {/* Footer Actions */}
                      <View style={styles.admActionsRow}>
                        {adm.dischargeSummaryDocId ? (
                          <TouchableOpacity
                            onPress={() =>
                              onViewDischargeSummary?.(adm.dischargeSummaryDocId!)
                            }
                            style={styles.summaryDocBtn}>
                            <MaterialIcons name="description" size={14} color="#38BDF8" />
                            <Text style={styles.summaryDocText}>
                              View Discharge Summary
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                          onPress={() => deleteHospitalAdmission(adm.id)}
                          style={styles.deleteBtn}>
                          <MaterialIcons
                            name="delete-outline"
                            size={16}
                            color={C.onSurfaceVariant}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
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
    borderBottomColor: 'rgba(244, 63, 94, 0.15)',
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
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
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
    backgroundColor: '#F43F5E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
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
  formCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  formTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#F43F5E',
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
  moneyInput: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#F43F5E',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  saveAdmissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F43F5E',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  saveAdmissionBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  historyContainer: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  admCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  admTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  admTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  admReason: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  admHospital: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#F43F5E',
    marginTop: 2,
  },
  admMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#13191C',
    padding: 10,
    borderRadius: 10,
  },
  metaCol: {
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
  finPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  finPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141A1D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  finLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  finVal: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
  },
  admNotesText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    fontStyle: 'italic',
  },
  admActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  summaryDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  summaryDocText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  deleteBtn: {
    padding: 4,
  },
});
