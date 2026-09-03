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

import { VaccinationCard } from '@/components/health-vault/vaccination-card';
import { EpiVaccineTrackerModal } from '@/components/health-vault/epi-vaccine-tracker-modal';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';

const C = Vital.colors;
const F = Vital.fonts;

const VACCINE_PRESETS = [
  'COVID-19 Booster',
  'Hepatitis B',
  'Influenza (Flu)',
  'Tetanus Toxoid (TT)',
  'Typhoid',
  'Rabies',
  'HPV',
  'Pneumococcal',
];

interface VaccinationManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onViewCertificate?: (docId: string) => void;
}

export function VaccinationManagerModal({
  visible,
  onClose,
  onViewCertificate,
}: VaccinationManagerModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const getVaccinations = useHealthVaultStore((s) => s.getVaccinations);
  const getUpcomingVaccinations = useHealthVaultStore((s) => s.getUpcomingVaccinations);
  const addVaccination = useHealthVaultStore((s) => s.addVaccination);
  const deleteVaccination = useHealthVaultStore((s) => s.deleteVaccination);
  const providers = useHealthVaultStore((s) => s.providers);

  const [activeMemberId, setActiveMemberId] = useState<string | 'ALL'>(selectedMemberId);
  const [isAdding, setIsAdding] = useState(false);
  const [epiModalVisible, setEpiModalVisible] = useState(false);

  // Form State
  const [targetMemberId, setTargetMemberId] = useState(members[0]?.id || 'mem_khaled');
  const [vaccineName, setVaccineName] = useState('');
  const [doseNumber, setDoseNumber] = useState('1');
  const [totalDoses, setTotalDoses] = useState('1');
  const [vaccinationDate, setVaccinationDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [providerName, setProviderName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  const vaccinations = useMemo(
    () => getVaccinations(activeMemberId),
    [getVaccinations, activeMemberId]
  );

  const upcomingList = useMemo(
    () => getUpcomingVaccinations(activeMemberId),
    [getUpcomingVaccinations, activeMemberId]
  );

  const handleSaveVaccination = async () => {
    if (!vaccineName.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const doseNum = Math.max(1, parseInt(doseNumber) || 1);
    const totalNum = totalDoses ? Math.max(doseNum, parseInt(totalDoses) || 1) : undefined;

    await addVaccination({
      memberId: targetMemberId,
      vaccineName: vaccineName.trim(),
      doseNumber: doseNum,
      totalDoses: totalNum,
      vaccinationDate,
      nextDueDate: nextDueDate.trim() || undefined,
      providerName: providerName.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setVaccineName('');
    setDoseNumber('1');
    setTotalDoses('1');
    setNextDueDate('');
    setProviderName('');
    setBatchNumber('');
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
                <MaterialIcons name="vaccines" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>Vaccination Vault</Text>
                <Text style={styles.subtitle}>
                  Immunization History, Dose Counters & Due Alerts
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
                  {isAdding ? 'Cancel' : 'Log Vaccine'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MEMBER FILTER BAR */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              <TouchableOpacity
                onPress={() => setActiveMemberId('ALL')}
                style={[
                  styles.memberChip,
                  activeMemberId === 'ALL' && styles.memberChipActive,
                ]}>
                <Text
                  style={[
                    styles.memberChipText,
                    activeMemberId === 'ALL' && styles.memberChipTextActive,
                  ]}>
                  👨‍👩‍👧 All Family
                </Text>
              </TouchableOpacity>

              {members.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setActiveMemberId(m.id)}
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
            {/* GOVT EPI & ELDERLY VACCINE TRACKER BANNER */}
            {!isAdding && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setEpiModalVisible(true);
                }}
                style={styles.epiTrackerHeroBanner}
              >
                <View style={styles.epiIconWrap}>
                  <MaterialIcons name="child-care" size={24} color="#20C997" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.epiHeroTitle}>
                    🇧🇩 সরকারি শিশু EPI ও ৫০+ টিকা ক্যালেন্ডার
                  </Text>
                  <Text style={styles.epiHeroSub}>
                    জন্মতারিখ অনুযায়ী অটো শিডিউল ও ডিজিটাল টিকা কার্ড
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#20C997" />
              </TouchableOpacity>
            )}

            {/* UPCOMING VACCINATION ALERT BANNER */}
            {upcomingList.length > 0 && !isAdding && (
              <View style={styles.upcomingBanner}>
                <MaterialIcons name="notifications-active" size={18} color="#FF922B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingLabel}>NEXT VACCINE DUE</Text>
                  <Text style={styles.upcomingTitle}>
                    {upcomingList[0].vaccineName}
                  </Text>
                  <Text style={styles.upcomingDate}>
                    Scheduled for {upcomingList[0].nextDueDate}
                  </Text>
                </View>
              </View>
            )}

            {isAdding ? (
              /* ADD VACCINE FORM */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>LOG NEW VACCINATION</Text>

                {/* Family Member Select */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Family Member *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetChipsRow}>
                    {members.map((m) => {
                      const isSelected = targetMemberId === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => setTargetMemberId(m.id)}
                          style={[
                            styles.presetChip,
                            isSelected && styles.presetChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.presetChipText,
                              isSelected && styles.presetChipTextActive,
                            ]}>
                            {m.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Common Presets */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quick Vaccine Presets</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetChipsRow}>
                    {VACCINE_PRESETS.map((v) => (
                      <TouchableOpacity
                        key={v}
                        onPress={() => setVaccineName(v)}
                        style={styles.presetChip}>
                        <Text style={styles.presetChipText}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vaccine Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Hepatitis B, COVID-19 Booster, Flu"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={vaccineName}
                    onChangeText={setVaccineName}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Dose Number (e.g. 1, 2)</Text>
                    <TextInput
                      style={styles.input}
                      value={doseNumber}
                      onChangeText={setDoseNumber}
                      placeholder="1"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Total Doses (e.g. 3)</Text>
                    <TextInput
                      style={styles.input}
                      value={totalDoses}
                      onChangeText={setTotalDoses}
                      placeholder="3"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Vaccination Date</Text>
                    <TextInput
                      style={styles.input}
                      value={vaccinationDate}
                      onChangeText={setVaccinationDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Next Due Date (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={nextDueDate}
                      onChangeText={setNextDueDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Administered Provider / Hospital</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Square Hospital / DGHS Center"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={providerName}
                    onChangeText={setProviderName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Batch / Lot Number (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. BATCH-2026-X99"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={batchNumber}
                    onChangeText={setBatchNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes / Side Effects</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Left deltoid, mild soreness"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveVaccination}
                  style={styles.saveBtn}>
                  <MaterialIcons name="check" size={18} color="#101416" />
                  <Text style={styles.saveBtnText}>Save Vaccine Record</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* VACCINATIONS LIST */
              <View style={styles.vaccinesList}>
                {vaccinations.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="vaccines" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Vaccines Logged</Text>
                    <Text style={styles.emptySub}>
                      Tap "Log Vaccine" to record childhood or booster doses.
                    </Text>
                  </View>
                ) : (
                  vaccinations.map((vac) => (
                    <VaccinationCard
                      key={vac.id}
                      vaccination={vac}
                      onViewCertificate={onViewCertificate}
                      onDelete={(id) => deleteVaccination(id)}
                    />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* EPI CHILD & ELDERLY VACCINATION TRACKER MODAL */}
      <EpiVaccineTrackerModal
        visible={epiModalVisible}
        onClose={() => setEpiModalVisible(false)}
        initialMemberId={activeMemberId === 'ALL' ? undefined : activeMemberId}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#20C997',
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
  memberChipActive: {
    backgroundColor: '#20C997',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  memberChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  scrollBody: {
    padding: 16,
    gap: 14,
  },
  epiTrackerHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(32, 201, 151, 0.35)',
  },
  epiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epiHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#20C997',
  },
  epiHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
  },
  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 146, 43, 0.25)',
  },
  upcomingLabel: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#FF922B',
    letterSpacing: 0.5,
  },
  upcomingTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 1,
  },
  upcomingDate: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
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
    color: '#20C997',
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChipsRow: {
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
    backgroundColor: '#20C997',
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
    backgroundColor: '#20C997',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
  vaccinesList: {
    gap: 10,
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
