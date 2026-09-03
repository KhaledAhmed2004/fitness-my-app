import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
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
  COMMON_SPECIALTIES,
} from '@/components/health-vault/health-vault-constants';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { Vital } from '@/constants/vital-theme';
import { Doctor } from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

interface DoctorDirectoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDoctor?: (doctor: Doctor) => void;
}

export function DoctorDirectoryModal({
  visible,
  onClose,
  onSelectDoctor,
}: DoctorDirectoryModalProps) {
  const doctors = useHealthVaultStore((s) => s.doctors);
  const events = useHealthVaultStore((s) => s.events);
  const addDoctor = useHealthVaultStore((s) => s.addDoctor);
  const deleteDoctor = useHealthVaultStore((s) => s.deleteDoctor);

  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [chamberAddress, setChamberAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hotline, setHotline] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.hospitalOrClinic.toLowerCase().includes(q)
    );
  });

  const handleSaveDoctor = async () => {
    if (!name.trim() || !specialty.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await addDoctor({
      name: name.trim(),
      specialty: specialty.trim(),
      hospitalOrClinic: hospital.trim() || 'Private Chamber',
      chamberAddress: chamberAddress.trim(),
      phone: phone.trim(),
      appointmentHotline: hotline.trim(),
      notes: notes.trim(),
    });

    setName('');
    setSpecialty('');
    setHospital('');
    setChamberAddress('');
    setPhone('');
    setHotline('');
    setNotes('');
    setIsAddingDoctor(false);
  };

  const handleCall = (phoneNum?: string) => {
    if (!phoneNum) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void Linking.openURL(`tel:${phoneNum}`);
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
                <MaterialIcons name="health-and-safety" size={20} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>Doctors & Specialists</Text>
                <Text style={styles.subtitle}>
                  {doctors.length} Registered Medical Providers
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setIsAddingDoctor((prev) => !prev);
                }}
                style={styles.addBtn}>
                <MaterialIcons
                  name={isAddingDoctor ? 'close' : 'add'}
                  size={18}
                  color="#101416"
                />
                <Text style={styles.addBtnText}>
                  {isAddingDoctor ? 'Cancel' : 'New Doctor'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          {!isAddingDoctor && (
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={18} color={C.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search doctor, specialty, hospital..."
                placeholderTextColor={C.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* ADD DOCTOR FORM */}
            {isAddingDoctor ? (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>REGISTER NEW DOCTOR</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Doctor Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Prof. Dr. M. A. Rahman"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Specialty *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Cardiologist / General Physician"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={specialty}
                    onChangeText={setSpecialty}
                  />
                </View>

                {/* Quick Specialty Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.specChipsRow}>
                  {COMMON_SPECIALTIES.map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      onPress={() => setSpecialty(spec.split(' (')[0])}
                      style={styles.specChip}>
                      <Text style={styles.specChipText}>
                        {spec.split(' (')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hospital or Clinic</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Square Hospital, Dhaka"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={hospital}
                    onChangeText={setHospital}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="01711..."
                      placeholderTextColor={C.onSurfaceVariant}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Appointment Hotline</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 10616"
                      placeholderTextColor={C.onSurfaceVariant}
                      value={hotline}
                      onChangeText={setHotline}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Chamber Address & Visiting Hours</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. OPD Room 402, Level 4 (5pm - 9pm)"
                    placeholderTextColor={C.onSurfaceVariant}
                    value={chamberAddress}
                    onChangeText={setChamberAddress}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSaveDoctor}
                  style={styles.saveBtn}>
                  <MaterialIcons name="check" size={18} color="#101416" />
                  <Text style={styles.saveBtnText}>Save Doctor Profile</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* DOCTOR LIST */
              <View style={styles.listContainer}>
                {filteredDoctors.map((doc) => {
                  const visitCount = events.filter((e) => e.doctorId === doc.id).length;

                  return (
                    <TouchableOpacity
                      key={doc.id}
                      activeOpacity={0.88}
                      onPress={() => onSelectDoctor && onSelectDoctor(doc)}
                      style={styles.doctorCard}>
                      <View style={styles.docCardHeader}>
                        <View style={styles.docIconCircle}>
                          <MaterialIcons
                            name="person-pin"
                            size={20}
                            color="#20C997"
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.docName}>{doc.name}</Text>
                          <Text style={styles.docSpec}>{doc.specialty}</Text>
                          <Text style={styles.docHosp}>{doc.hospitalOrClinic}</Text>
                        </View>

                        <View style={styles.visitBadge}>
                          <Text style={styles.visitBadgeText}>
                            {visitCount} {visitCount === 1 ? 'Visit' : 'Visits'}
                          </Text>
                        </View>
                      </View>

                      {doc.chamberAddress ? (
                        <View style={styles.addressRow}>
                          <MaterialIcons
                            name="place"
                            size={13}
                            color={C.onSurfaceVariant}
                          />
                          <Text style={styles.addressText} numberOfLines={2}>
                            {doc.chamberAddress}
                          </Text>
                        </View>
                      ) : null}

                      {/* Phone & Hotline Action Row */}
                      <View style={styles.docActionsRow}>
                        {doc.appointmentHotline ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleCall(doc.appointmentHotline)}
                            style={styles.callHotlineBtn}>
                            <MaterialIcons name="call" size={14} color="#101416" />
                            <Text style={styles.callHotlineText}>
                              Hotline ({doc.appointmentHotline})
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {doc.phone ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleCall(doc.phone)}
                            style={styles.callPhoneBtn}>
                            <MaterialIcons name="phone-android" size={14} color="#38BDF8" />
                            <Text style={styles.callPhoneText}>{doc.phone}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </TouchableOpacity>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F23',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12,
    color: '#FFFFFF',
    padding: 0,
  },
  scrollBody: {
    padding: 16,
    gap: 14,
  },
  formContainer: {
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
  specChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  specChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#38BDF8',
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
    fontSize: 12,
    color: '#101416',
  },
  listContainer: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 201, 151, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  docSpec: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#20C997',
    marginTop: 1,
  },
  docHosp: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  visitBadge: {
    backgroundColor: '#13191C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  visitBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  addressText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    flex: 1,
    lineHeight: 14,
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  callHotlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#20C997',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callHotlineText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#101416',
  },
  callPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callPhoneText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
});
