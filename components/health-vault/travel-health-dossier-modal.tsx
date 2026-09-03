import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { TRAVEL_DESTINATIONS } from '@/services/travel-health-knowledge';
import {
  compileTravelDossier,
  formatDossierPlainText,
} from '@/services/travel-health-service';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useMedicineStore } from '@/stores/medicine-store';
import { TravelPurpose } from '@/types/travel-health-dossier';

const C = Vital.colors;
const F = Vital.fonts;

type MainTab = 'TRIP_INFO' | 'MEDICINE_DECLARATION' | 'VACCINE_GATE' | 'OFFICIAL_DOSSIER';

interface TravelHealthDossierModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TravelHealthDossierModal({
  visible,
  onClose,
}: TravelHealthDossierModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const vaccinations = useHealthVaultStore((s) => s.vaccinations);
  const addVaccination = useHealthVaultStore((s) => s.addVaccination);
  const medicines = useMedicineStore((s) => s.medicines);

  const initialMember =
    selectedMemberId === 'ALL' ? members[0]?.id || 'mem_khaled' : selectedMemberId;
  const [activeMemberId, setActiveMemberId] = useState(initialMember);

  const [activeTab, setActiveTab] = useState<MainTab>('TRIP_INFO');

  // Trip Info State
  const [passportNumber, setPassportNumber] = useState('A09823412');
  const [destinationCode, setDestinationCode] = useState('SA');
  const [travelPurpose, setTravelPurpose] = useState<TravelPurpose>('HAJJ_UMRAH');
  const [departureDate, setDepartureDate] = useState('2026-10-15');
  const [returnDate, setReturnDate] = useState('2026-11-20');
  const [daysOfSupply, setDaysOfSupply] = useState(45);
  const [emergencyPhone, setEmergencyPhone] = useState('+880 1711-234567');
  const [doctorName, setDoctorName] = useState('Prof. Dr. M. A. Rahman');
  const [doctorBmdc, setDoctorBmdc] = useState('BMDC Reg: A-48291');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const activeMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) || members[0],
    [members, activeMemberId]
  );

  const memberVaccines = useMemo(
    () => vaccinations.filter((v) => v.memberId === activeMemberId),
    [vaccinations, activeMemberId]
  );

  const compiledDossier = useMemo(() => {
    return compileTravelDossier({
      member: activeMember,
      passportNumber,
      destinationCode,
      purpose: travelPurpose,
      departureDate,
      returnDate,
      daysOfSupply,
      emergencyContactName: 'Family Member',
      emergencyContactPhone: emergencyPhone,
      emergencyContactRelation: activeMember?.relation || 'Self',
      doctorName,
      doctorBmdc,
      hospitalName: 'Apollo Imperial / BIRDEM General Hospital',
      medicines,
      vaccinations: memberVaccines,
      activeConditions: ['Type 2 Diabetes', 'Hypertension'],
      knownAllergies: ['No Known Drug Allergies (NKDA)'],
    });
  }, [
    activeMember,
    passportNumber,
    destinationCode,
    travelPurpose,
    departureDate,
    returnDate,
    daysOfSupply,
    emergencyPhone,
    doctorName,
    doctorBmdc,
    medicines,
    memberVaccines,
  ]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleCopyDossier = async () => {
    const fullText = formatDossierPlainText(compiledDossier);
    await Clipboard.setStringAsync(fullText);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('অফিশিয়াল ট্রাভেল ডসিয়ার কপি হয়েছে! 📋');
  };

  const handleWhatsAppShare = () => {
    const fullText = formatDossierPlainText(compiledDossier);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const waUrl = `whatsapp://send?text=${encodeURIComponent(fullText)}`;
    void Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp খুলতে ব্যর্থ হয়েছে', 'দয়া করে ডসিয়ার কপি করে সরাসরি পেস্ট করুন।');
    });
  };

  const handleQuickLogVaccine = async (vacKey: string, vacName: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await addVaccination({
      memberId: activeMemberId,
      vaccineName: vacName,
      doseNumber: 1,
      vaccinationDate: new Date().toISOString().split('T')[0],
      providerName: 'হজ্ব ক্যাম্প মেডিকেল সেন্টার / আইইডিসিআর',
      batchNumber: `BN-2026-${vacKey}`,
      notes: 'Travel Health clearance record',
    });
    showToast(`${vacName} রেকর্ড যুক্ত হয়েছে! ✅`);
  };

  const currentDestination =
    TRAVEL_DESTINATIONS.find((d) => d.code === destinationCode) || TRAVEL_DESTINATIONS[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="flight-takeoff" size={24} color="#F59E0B" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  Travel Health & Customs Dossier
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  ভ্রমণ ও মেডিকেল ট্যুরিজম পাসপোর্ট
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
              }}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('TRIP_INFO')}
              style={[styles.tabBtn, activeTab === 'TRIP_INFO' && styles.tabBtnActive]}>
              <MaterialIcons
                name="person-pin"
                size={16}
                color={activeTab === 'TRIP_INFO' ? '#F59E0B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'TRIP_INFO' && styles.tabBtnTextActive,
                ]}>
                🛂 ট্রিপ তথ্য
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('MEDICINE_DECLARATION')}
              style={[
                styles.tabBtn,
                activeTab === 'MEDICINE_DECLARATION' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="medication"
                size={16}
                color={activeTab === 'MEDICINE_DECLARATION' ? '#F59E0B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'MEDICINE_DECLARATION' && styles.tabBtnTextActive,
                ]}>
                💊 কাস্টমস ওষুধ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('VACCINE_GATE')}
              style={[styles.tabBtn, activeTab === 'VACCINE_GATE' && styles.tabBtnActive]}>
              <MaterialIcons
                name="verified"
                size={16}
                color={activeTab === 'VACCINE_GATE' ? '#F59E0B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'VACCINE_GATE' && styles.tabBtnTextActive,
                ]}>
                💉 ভ্যাকসিন গেইট
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('OFFICIAL_DOSSIER')}
              style={[
                styles.tabBtn,
                activeTab === 'OFFICIAL_DOSSIER' && styles.tabBtnActive,
              ]}>
              <MaterialIcons
                name="description"
                size={16}
                color={activeTab === 'OFFICIAL_DOSSIER' ? '#F59E0B' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'OFFICIAL_DOSSIER' && styles.tabBtnTextActive,
                ]}>
                📜 অফিশিয়াল ডসিয়ার
              </Text>
            </TouchableOpacity>
          </View>

          {/* FAMILY MEMBER BAR */}
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
                        backgroundColor: '#F59E0B',
                        borderColor: '#F59E0B',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.memberChipText,
                        isSelected && { color: '#0F172A', fontFamily: F.bold },
                      ]}>
                      {m.name} ({m.relation})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {copiedToast && (
              <View style={styles.toastWrap}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.toastText}>{copiedToast}</Text>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: TRIP & TRAVELER INFO */}
            {/* ========================================================================= */}
            {activeTab === 'TRIP_INFO' && (
              <>
                {/* Destination Selector */}
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionTitle}>ভ্রমণের গন্তব্য দেশ নির্ধারণ করুন:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.countryScroll}>
                    {TRAVEL_DESTINATIONS.map((c) => {
                      const isSelected = destinationCode === c.code;
                      return (
                        <TouchableOpacity
                          key={c.code}
                          onPress={() => {
                            void Haptics.selectionAsync().catch(() => {});
                            setDestinationCode(c.code);
                            if (c.code === 'SA') setTravelPurpose('HAJJ_UMRAH');
                            else if (c.code === 'IN' || c.code === 'TH')
                              setTravelPurpose('MEDICAL_TOURISM');
                          }}
                          style={[
                            styles.countryChip,
                            isSelected && styles.countryChipActive,
                          ]}>
                          <Text style={styles.countryFlag}>{c.flagEmoji}</Text>
                          <Text
                            style={[
                              styles.countryName,
                              isSelected && styles.countryNameActive,
                            ]}>
                            {c.nameBn}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Customs Compliance Notice Card */}
                <View style={styles.customsNoticeCard}>
                  <View style={styles.noticeHeader}>
                    <MaterialIcons name="security" size={20} color="#F59E0B" />
                    <Text style={styles.noticeTitle}>
                      {currentDestination.flagEmoji} {currentDestination.nameEn} কাস্টমস গাইডলাইন
                    </Text>
                  </View>
                  <Text style={styles.noticeBody}>
                    {currentDestination.specialCustomsNoteBn}
                  </Text>
                </View>

                {/* Passport & Trip Form */}
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>ভ্রমণকারীর অফিসিয়াল তথ্য:</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>পাসপোর্ট নম্বর (Passport No):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={passportNumber}
                      onChangeText={setPassportNumber}
                      placeholder="e.g. A09823412"
                      placeholderTextColor={C.onSurfaceVariant}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>যাত্রা শুরু (Departure):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={departureDate}
                        onChangeText={setDepartureDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>প্রত্যাবর্তন (Return):</Text>
                      <TextInput
                        style={styles.textInput}
                        value={returnDate}
                        onChangeText={setReturnDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>জরুরি যোগাযোগ (ইমার্জেন্সি ফোন):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={emergencyPhone}
                      onChangeText={setEmergencyPhone}
                      placeholder="+880 1711-XXXXXX"
                      placeholderTextColor={C.onSurfaceVariant}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>চিকিৎসকের নাম ও BMDC রেজিস্ট্রেশন:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={doctorName}
                      onChangeText={setDoctorName}
                      placeholder="Doctor Name"
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                    <TextInput
                      style={[styles.textInput, { marginTop: 6 }]}
                      value={doctorBmdc}
                      onChangeText={setDoctorBmdc}
                      placeholder="BMDC Reg. No."
                      placeholderTextColor={C.onSurfaceVariant}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: CUSTOMS MEDICINE DECLARATION */}
            {/* ========================================================================= */}
            {activeTab === 'MEDICINE_DECLARATION' && (
              <>
                <View style={styles.medHeroCard}>
                  <MaterialIcons name="inventory-2" size={24} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medHeroTitle}>
                      আন্তর্জাতিক কাস্টমস ওষুধ ডিক্লারেশন
                    </Text>
                    <Text style={styles.medHeroSub}>
                      আপনার ড্রয়ারের ওষুধের ব্র্যান্ড নামের সাথে আন্তর্জাতিক
                      জেনেরিক নাম (INN) স্বয়ংক্রিয়ভাবে যুক্ত করে কাস্টমস ক্লিয়ারেন্স
                      তালিকা তৈরি করা হয়েছে।
                    </Text>
                  </View>
                </View>

                {/* Days of Supply Adjustment */}
                <View style={styles.daysSupplyCard}>
                  <Text style={styles.daysSupplyTitle}>
                    ভ্রমণের জন্য কতদিনের ওষুধ সাথে নিচ্ছেন?
                  </Text>
                  <View style={styles.daysBtnRow}>
                    {[30, 45, 60, 90].map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setDaysOfSupply(d);
                        }}
                        style={[
                          styles.dayPill,
                          daysOfSupply === d && styles.dayPillActive,
                        ]}>
                        <Text
                          style={[
                            styles.dayPillText,
                            daysOfSupply === d && styles.dayPillTextActive,
                          ]}>
                          {d} দিন
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Declared Medicines List */}
                <Text style={styles.sectionTitle}>
                  কাস্টমস ডিক্লেয়ার্ড ওষুধের তালিকা ({compiledDossier.declaredMedicines.length}টি):
                </Text>

                {compiledDossier.declaredMedicines.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardText}>
                      আপনার ক্যাবিনেটে কোনো ওষুধ নেই। পুষ্টি ট্যাবে ওষুধ যুক্ত করলে
                      কাস্টমস ডিক্লারেশনে তা চলে আসবে।
                    </Text>
                  </View>
                ) : (
                  compiledDossier.declaredMedicines.map((med, idx) => (
                    <View key={med.id || idx} style={styles.declaredMedCard}>
                      <View style={styles.declaredMedTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.declaredBrandName}>
                            {idx + 1}. {med.brandName}
                          </Text>
                          <Text style={styles.declaredGenericName}>
                            Generic (INN): {med.genericName} ({med.strength})
                          </Text>
                        </View>

                        {med.requiresCooling ? (
                          <View style={styles.coolingBadge}>
                            <MaterialIcons name="ac-unit" size={12} color="#38BDF8" />
                            <Text style={styles.coolingBadgeText}>কুলার / ইনসুলিন</Text>
                          </View>
                        ) : med.isControlledOrInjectable ? (
                          <View style={styles.controlledBadge}>
                            <Text style={styles.controlledBadgeText}>নিয়ন্ত্রিত ওষুধ</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.medMetaRow}>
                        <Text style={styles.medMetaItem}>
                          🕒 ডোজ: {med.dailyFrequency}
                        </Text>
                        <Text style={styles.medMetaItem}>
                          📦 পরিমাণ: {med.quantityCarried}
                        </Text>
                      </View>

                      <Text style={styles.medPurposeText}>
                        🎯 ব্যবহারের কারণ: {med.purpose}
                      </Text>

                      {med.doctorNotes ? (
                        <View style={styles.doctorNoticeBox}>
                          <Text style={styles.doctorNoticeText}>
                            ✈️ {med.doctorNotes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: VACCINE GATE */}
            {/* ========================================================================= */}
            {activeTab === 'VACCINE_GATE' && (
              <>
                <View style={styles.vaccineHeroCard}>
                  <MaterialIcons name="health-and-safety" size={24} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vaccineHeroTitle}>
                      {currentDestination.flagEmoji} {currentDestination.nameEn} ট্রাভেল ভ্যাকসিন ক্লিয়ারেন্স
                    </Text>
                    <Text style={styles.vaccineHeroSub}>
                      গন্তব্য দেশের ইমিগ্রেশন ও স্বাস্থ্য মন্ত্রণালয়ের নিয়ম অনুযায়ী
                      টিকা গ্রহণের সনদ যাচাই করুন।
                    </Text>
                  </View>
                </View>

                {compiledDossier.certifiedVaccines.map((vac) => {
                  const isValid = vac.status === 'VALID';
                  return (
                    <View key={vac.vaccineKey} style={styles.vaccineCard}>
                      <View style={styles.vaccineCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.vacNameRow}>
                            <Text style={styles.vacNameBn}>{vac.nameBn}</Text>
                            {vac.isMandatoryForDestination && (
                              <View style={styles.mandatoryBadge}>
                                <Text style={styles.mandatoryBadgeText}>বাধ্যতামূলক</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.vacNameEn}>{vac.nameEn}</Text>
                        </View>

                        <View
                          style={[
                            styles.vacStatusPill,
                            isValid ? styles.vacStatusValid : styles.vacStatusMissing,
                          ]}>
                          <MaterialIcons
                            name={isValid ? 'check-circle' : 'error-outline'}
                            size={14}
                            color={isValid ? '#10B981' : '#EF4444'}
                          />
                          <Text
                            style={[
                              styles.vacStatusText,
                              { color: isValid ? '#10B981' : '#EF4444' },
                            ]}>
                            {isValid ? 'ক্লিয়ারেন্স সম্পন্ন' : 'টিকা রেকর্ড নেই'}
                          </Text>
                        </View>
                      </View>

                      {isValid ? (
                        <View style={styles.vacDetailsBox}>
                          <Text style={styles.vacDetailText}>
                            📅 গ্রহণের তারিখ: {vac.dateAdministered} • ব্যাচ: {vac.batchNumber}
                          </Text>
                          <Text style={styles.vacDetailText}>
                            🏛️ প্রদানকারী প্রতিষ্ঠান: {vac.issuingAuthority}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.vacActionRow}>
                          <Text style={styles.vacReqNote}>
                            💡 {vac.requirementNoteBn}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleQuickLogVaccine(vac.vaccineKey, vac.nameEn)
                            }
                            style={styles.quickLogVacBtn}>
                            <MaterialIcons name="add-task" size={14} color="#F59E0B" />
                            <Text style={styles.quickLogVacText}>টিকা দিয়েছি (লগ করুন)</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: OFFICIAL DOSSIER & PDF EXPORT */}
            {/* ========================================================================= */}
            {activeTab === 'OFFICIAL_DOSSIER' && (
              <>
                {/* ACTION BUTTONS */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    onPress={handleCopyDossier}
                    style={styles.copyDossierBtn}
                    activeOpacity={0.8}>
                    <MaterialIcons name="content-copy" size={16} color="#0F172A" />
                    <Text style={styles.copyDossierText}>সম্পূর্ণ ডসিয়ার কপি করুন</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleWhatsAppShare}
                    style={styles.waDossierBtn}
                    activeOpacity={0.8}>
                    <MaterialIcons name="share" size={16} color="#25D366" />
                    <Text style={styles.waDossierText}>WhatsApp-এ পাঠান</Text>
                  </TouchableOpacity>
                </View>

                {/* EMBASSY-GRADE CERTIFICATE PREVIEW */}
                <View style={styles.certificatePaper}>
                  {/* Top Seal & Header */}
                  <View style={styles.certHeader}>
                    <View style={styles.certEmblem}>
                      <MaterialIcons name="verified" size={28} color="#F59E0B" />
                    </View>
                    <Text style={styles.certTitle}>
                      INTERNATIONAL TRAVEL MEDICAL DOSSIER
                    </Text>
                    <Text style={styles.certSubTitle}>
                      CUSTOMS DECLARATION & FIT-TO-FLY MEDICAL CERTIFICATE
                    </Text>
                    <Text style={styles.certStandard}>
                      Compliant with IATA / WHO International Health Regulations (2005)
                    </Text>
                  </View>

                  <View style={styles.certDivider} />

                  {/* Passenger Grid */}
                  <View style={styles.certSection}>
                    <Text style={styles.certSectionTitle}>1. PASSENGER & ITINERARY</Text>
                    <View style={styles.certGrid}>
                      <View style={styles.certGridCol}>
                        <Text style={styles.certLabel}>Traveler Name:</Text>
                        <Text style={styles.certValue}>{compiledDossier.travelerName}</Text>
                      </View>
                      <View style={styles.certGridCol}>
                        <Text style={styles.certLabel}>Passport No:</Text>
                        <Text style={styles.certValue}>{compiledDossier.passportNumber}</Text>
                      </View>
                    </View>

                    <View style={styles.certGrid}>
                      <View style={styles.certGridCol}>
                        <Text style={styles.certLabel}>Date of Birth / Blood:</Text>
                        <Text style={styles.certValue}>
                          {compiledDossier.dob} ({compiledDossier.gender}) • {compiledDossier.bloodGroup}
                        </Text>
                      </View>
                      <View style={styles.certGridCol}>
                        <Text style={styles.certLabel}>Destination:</Text>
                        <Text style={styles.certValue}>
                          {compiledDossier.destinationFlag} {compiledDossier.destinationCountry}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Customs Medicines Table */}
                  <View style={styles.certSection}>
                    <Text style={styles.certSectionTitle}>
                      2. CUSTOMS MEDICATION DECLARATION (INN / GENERIC)
                    </Text>
                    {compiledDossier.declaredMedicines.map((m, idx) => (
                      <View key={idx} style={styles.certMedRow}>
                        <Text style={styles.certMedNum}>{idx + 1}.</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.certMedHeading}>
                            {m.genericName} ({m.strength}) — Brand: {m.brandName}
                          </Text>
                          <Text style={styles.certMedSub}>
                            Dose: {m.dailyFrequency} | Carried: {m.quantityCarried} | Indication: {m.purpose}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Doctor Statement */}
                  <View style={styles.certSection}>
                    <Text style={styles.certSectionTitle}>
                      3. ATTENDING PHYSICIAN FIT-TO-TRAVEL CLEARANCE
                    </Text>
                    <Text style={styles.certDeclarationText}>
                      "{compiledDossier.fitToFlyDeclarationEn}"
                    </Text>
                    <View style={styles.certDoctorBlock}>
                      <Text style={styles.certDoctorName}>
                        {compiledDossier.attendingDoctorName}
                      </Text>
                      <Text style={styles.certDoctorReg}>
                        {compiledDossier.doctorBmdcRegNo} • {compiledDossier.doctorSpecialty}
                      </Text>
                      <Text style={styles.certDoctorHosp}>
                        {compiledDossier.hospitalName}
                      </Text>
                    </View>
                  </View>

                  {/* Verification Footer */}
                  <View style={styles.certFooter}>
                    <Text style={styles.certFooterText}>
                      Document Reference: {compiledDossier.id} • Issued: {compiledDossier.dossierDate}
                    </Text>
                    <Text style={styles.certFooterText}>
                      TrackMe Global Health Vault • Digital Certification
                    </Text>
                  </View>
                </View>
              </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '92%',
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.onSurface,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  tabBtnText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  tabBtnTextActive: {
    fontFamily: F.bold,
    color: '#F59E0B',
  },
  membersBar: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberChipText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  toastWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  toastText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  countryScroll: {
    gap: 8,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  countryChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  countryFlag: {
    fontSize: 16,
  },
  countryName: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurface,
  },
  countryNameActive: {
    fontFamily: F.bold,
    color: '#F59E0B',
  },
  customsNoticeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    gap: 6,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#F59E0B',
  },
  noticeBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurface,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  formCardTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: C.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 12,
    fontFamily: F.regular,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  medHeroCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  medHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#F59E0B',
  },
  medHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 15,
  },
  daysSupplyCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  daysSupplyTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  daysBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  dayPillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  dayPillTextActive: {
    fontFamily: F.bold,
    color: '#F59E0B',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  declaredMedCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  declaredMedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  declaredBrandName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.onSurface,
  },
  declaredGenericName: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 1,
  },
  coolingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coolingBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#38BDF8',
  },
  controlledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  controlledBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#EF4444',
  },
  medMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  medMetaItem: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  medPurposeText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
  },
  doctorNoticeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 6,
    borderRadius: 6,
  },
  doctorNoticeText: {
    fontFamily: F.medium,
    fontSize: 9,
    color: '#38BDF8',
  },
  vaccineHeroCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  vaccineHeroTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#10B981',
  },
  vaccineHeroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 15,
  },
  vaccineCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  vaccineCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vacNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vacNameBn: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.onSurface,
  },
  vacNameEn: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  mandatoryBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mandatoryBadgeText: {
    fontFamily: F.bold,
    fontSize: 8,
    color: '#EF4444',
  },
  vacStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vacStatusValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  vacStatusMissing: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  vacStatusText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  vacDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
    gap: 2,
  },
  vacDetailText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
  },
  vacActionRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  vacReqNote: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    lineHeight: 14,
  },
  quickLogVacBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickLogVacText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#F59E0B',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyDossierBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyDossierText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  waDossierBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  waDossierText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#25D366',
  },
  certificatePaper: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    gap: 12,
  },
  certHeader: {
    alignItems: 'center',
    gap: 4,
  },
  certEmblem: {
    marginBottom: 4,
  },
  certTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#F59E0B',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  certSubTitle: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.onSurface,
    textAlign: 'center',
  },
  certStandard: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  certDivider: {
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  certSection: {
    gap: 6,
  },
  certSectionTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  certGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
  },
  certGridCol: {
    flex: 1,
    gap: 2,
  },
  certLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  certValue: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  certMedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
  },
  certMedNum: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#F59E0B',
  },
  certMedHeading: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.onSurface,
  },
  certMedSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  certDeclarationText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurface,
    fontStyle: 'italic',
    lineHeight: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 8,
  },
  certDoctorBlock: {
    alignItems: 'flex-end',
    marginTop: 6,
    gap: 2,
  },
  certDoctorName: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#F59E0B',
  },
  certDoctorReg: {
    fontFamily: F.medium,
    fontSize: 9,
    color: C.onSurface,
  },
  certDoctorHosp: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
  certFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    alignItems: 'center',
    gap: 2,
  },
  certFooterText: {
    fontFamily: F.regular,
    fontSize: 8,
    color: C.onSurfaceVariant,
  },
});
