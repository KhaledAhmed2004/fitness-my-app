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
  DOCUMENT_TYPE_CONFIG,
} from '@/components/health-vault/health-vault-constants';
import { AddMedicalEventModal } from '@/components/health-vault/add-medical-event-modal';
import { DoctorDirectoryModal } from '@/components/health-vault/doctor-directory-modal';
import { FamilyMemberManagerModal } from '@/components/health-vault/family-member-manager-modal';
import { EmergencyHealthCardModal } from '@/components/health-vault/emergency-health-card-modal';
import { VaccinationManagerModal } from '@/components/health-vault/vaccination-manager-modal';
import { AllergyConditionManagerModal } from '@/components/health-vault/allergy-condition-manager-modal';
import { LabResultManagerModal } from '@/components/health-vault/lab-result-manager-modal';
import { PharmacyReceiptModal } from '@/components/health-vault/pharmacy-receipt-modal';
import { HospitalAdmissionModal } from '@/components/health-vault/hospital-admission-modal';
import { CareCalendarModal } from '@/components/health-vault/care-calendar-modal';
import { AIHealthScannerModal } from '@/components/health-vault/ai-health-scanner-modal';
import { InsuranceClaimExportModal } from '@/components/health-vault/insurance-claim-export-modal';
import { LanguageSwitcherModal } from '@/components/health-vault/language-switcher-modal';
import { DoctorVoiceConsultationModal } from '@/components/health-vault/doctor-voice-consultation-modal';
import { DrugInteractionCheckerModal } from '@/components/health-vault/drug-interaction-checker-modal';
import { FamilyHereditaryTreeModal } from '@/components/health-vault/family-hereditary-tree-modal';
import { PhoneCalendarSyncModal } from '@/components/health-vault/phone-calendar-sync-modal';
import { OrganHealthScorecardModal } from '@/components/health-vault/organ-health-scorecard-modal';
import { DoctorVisitPrepModal } from '@/components/health-vault/doctor-visit-prep-modal';
import { DataCleanupModal } from '@/components/health-vault/data-cleanup-modal';
import { BloodNetworkModal } from '@/components/health-vault/blood-network-modal';
import { ChronicCareModal } from '@/components/health-vault/chronic-care-modal';
import { GenericMedicineFinderModal } from '@/components/health-vault/generic-medicine-finder-modal';
import { EmergencyHotlineModal } from '@/components/health-vault/emergency-hotline-modal';
import { BanglaFoodGiModal } from '@/components/nutrition/bangla-food-gi-modal';
import { AIReportExplainerModal } from '@/components/health-vault/ai-report-explainer-modal';
import { MedicineExpiryRadarModal } from '@/components/nutrition/medicine-expiry-radar-modal';
import { EpiVaccineTrackerModal } from '@/components/health-vault/epi-vaccine-tracker-modal';
import { RamadanGuardModal } from '@/components/fasting/ramadan-guard-modal';
import { TravelHealthDossierModal } from '@/components/health-vault/travel-health-dossier-modal';
import { SurgeryRecoveryModal } from '@/components/health-vault/surgery-recovery-modal';
import { LabCostComparatorModal } from '@/components/health-vault/lab-cost-comparator-modal';
import { DengueFluidMonitorModal } from '@/components/health-vault/dengue-fluid-monitor-modal';
import { AqiAsthmaShieldModal } from '@/components/health-vault/aqi-asthma-shield-modal';
import { PregnancyCareModal } from '@/components/health-vault/pregnancy-care-modal';
import { HypertensionHeartShieldModal } from '@/components/health-vault/hypertension-heart-shield-modal';
import { ElderlyCareModal } from '@/components/health-vault/elderly-care-modal';
import { UrineHydrationShieldModal } from '@/components/health-vault/urine-hydration-shield-modal';
import { UricAcidGoutModal } from '@/components/health-vault/uric-acid-gout-modal';
import { PostpartumCareModal } from '@/components/health-vault/postpartum-care-modal';
import { AnemiaHemoglobinShieldModal } from '@/components/health-vault/anemia-hemoglobin-shield-modal';
import { MemoryDementiaModal } from '@/components/health-vault/memory-dementia-modal';
import { OsteoporosisJointModal } from '@/components/health-vault/osteoporosis-joint-modal';
import { DiabeticVisionModal } from '@/components/health-vault/diabetic-vision-modal';
import { HearingTremorModal } from '@/components/health-vault/hearing-tremor-modal';
import { PolypharmacyShieldModal } from '@/components/health-vault/polypharmacy-shield-modal';
import { DiabeticMealPlannerModal } from '@/components/health-vault/diabetic-meal-planner-modal';
import { FamilyHealthDashboardModal } from '@/components/health-vault/family-health-dashboard-modal';
import { HealthDocumentCard } from '@/components/health-vault/health-document-card';
import { HealthDocumentViewerModal } from '@/components/health-vault/health-document-viewer-modal';
import { HealthTimelineCard } from '@/components/health-vault/health-timeline-card';
import { MedicalExpenseAnalyticsSheet } from '@/components/health-vault/medical-expense-analytics-sheet';
import { useHealthVaultStore } from '@/stores/health-vault-store';
import { useLanguageStore } from '@/stores/language-store';
import { Vital } from '@/constants/vital-theme';
import {
  MedicalDocument,
  MedicalDocumentType,
  MedicalEvent,
} from '@/types/health-vault';

const C = Vital.colors;
const F = Vital.fonts;

type StudioTab = 'TIMELINE' | 'VAULT' | 'DOCTORS' | 'TESTS_CARE';

interface HealthVaultStudioModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HealthVaultStudioModal({
  visible,
  onClose,
}: HealthVaultStudioModalProps) {
  const members = useHealthVaultStore((s) => s.members);
  const selectedMemberId = useHealthVaultStore((s) => s.selectedMemberId);
  const setSelectedMemberId = useHealthVaultStore((s) => s.setSelectedMemberId);
  const getTimelineEvents = useHealthVaultStore((s) => s.getTimelineEvents);
  const getDocuments = useHealthVaultStore((s) => s.getDocuments);
  const getUpcomingFollowUps = useHealthVaultStore((s) => s.getUpcomingFollowUps);
  const getPendingDiagnosticTests = useHealthVaultStore((s) => s.getPendingDiagnosticTests);
  const diagnosticTests = useHealthVaultStore((s) => s.diagnosticTests);
  const completeFollowUp = useHealthVaultStore((s) => s.completeFollowUp);
  const updateDiagnosticTestStatus = useHealthVaultStore((s) => s.updateDiagnosticTestStatus);
  const deleteMedicalDocument = useHealthVaultStore((s) => s.deleteMedicalDocument);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<StudioTab>('TIMELINE');
  const [selectedDocType, setSelectedDocType] = useState<MedicalDocumentType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Language & Localization
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const supportedLanguages = useLanguageStore((s) => s.supportedLanguages);
  const t = useLanguageStore((s) => s.t);
  const currentLangInfo = useMemo(
    () => supportedLanguages.find((l) => l.code === currentLanguage) || supportedLanguages[0],
    [supportedLanguages, currentLanguage]
  );
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Sub-Modals
  const [addEventVisible, setAddEventVisible] = useState(false);
  const [docViewerItem, setDocViewerItem] = useState<MedicalDocument | null>(null);
  const [doctorDirectoryVisible, setDoctorDirectoryVisible] = useState(false);
  const [memberManagerVisible, setMemberManagerVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [emergencyCardVisible, setEmergencyCardVisible] = useState(false);
  const [vaccinationModalVisible, setVaccinationModalVisible] = useState(false);
  const [allergyModalVisible, setAllergyModalVisible] = useState(false);
  const [labTrendsVisible, setLabTrendsVisible] = useState(false);
  const [pharmacyModalVisible, setPharmacyModalVisible] = useState(false);
  const [admissionModalVisible, setAdmissionModalVisible] = useState(false);
  const [careCalendarVisible, setCareCalendarVisible] = useState(false);
  const [aiScannerVisible, setAiScannerVisible] = useState(false);
  const [insuranceClaimVisible, setInsuranceClaimVisible] = useState(false);
  const [voiceConsultationVisible, setVoiceConsultationVisible] = useState(false);
  const [interactionCheckerVisible, setInteractionCheckerVisible] = useState(false);
  const [hereditaryTreeVisible, setHereditaryTreeVisible] = useState(false);
  const [phoneSyncVisible, setPhoneSyncVisible] = useState(false);
  const [organScorecardVisible, setOrganScorecardVisible] = useState(false);
  const [doctorVisitPrepVisible, setDoctorVisitPrepVisible] = useState(false);
  const [dataCleanupVisible, setDataCleanupVisible] = useState(false);
  const [bloodNetworkVisible, setBloodNetworkVisible] = useState(false);
  const [chronicCareModalVisible, setChronicCareModalVisible] = useState(false);
  const [genericFinderVisible, setGenericFinderVisible] = useState(false);
  const [emergencyHotlineVisible, setEmergencyHotlineVisible] = useState(false);
  const [banglaFoodGiVisible, setBanglaFoodGiVisible] = useState(false);
  const [reportExplainerVisible, setReportExplainerVisible] = useState(false);
  const [expiryRadarVisible, setExpiryRadarVisible] = useState(false);
  const [epiTrackerVisible, setEpiTrackerVisible] = useState(false);
  const [ramadanGuardVisible, setRamadanGuardVisible] = useState(false);
  const [travelDossierVisible, setTravelDossierVisible] = useState(false);
  const [surgeryRecoveryVisible, setSurgeryRecoveryVisible] = useState(false);
  const [labCostVisible, setLabCostVisible] = useState(false);
  const [dengueMonitorVisible, setDengueMonitorVisible] = useState(false);
  const [aqiAsthmaVisible, setAqiAsthmaVisible] = useState(false);
  const [pregnancyCareVisible, setPregnancyCareVisible] = useState(false);
  const [hypertensionVisible, setHypertensionVisible] = useState(false);
  const [elderlyCareVisible, setElderlyCareVisible] = useState(false);
  const [urineHydrationVisible, setUrineHydrationVisible] = useState(false);
  const [uricAcidGoutVisible, setUricAcidGoutVisible] = useState(false);
  const [postpartumCareVisible, setPostpartumCareVisible] = useState(false);
  const [anemiaShieldVisible, setAnemiaShieldVisible] = useState(false);
  const [memoryDementiaVisible, setMemoryDementiaVisible] = useState(false);
  const [osteoporosisVisible, setOsteoporosisVisible] = useState(false);
  const [diabeticVisionVisible, setDiabeticVisionVisible] = useState(false);
  const [hearingTremorVisible, setHearingTremorVisible] = useState(false);
  const [polypharmacyVisible, setPolypharmacyVisible] = useState(false);
  const [diabeticMealPlannerVisible, setDiabeticMealPlannerVisible] = useState(false);
  const [familyDashboardVisible, setFamilyDashboardVisible] = useState(false);

  const timelineEvents = useMemo(
    () => getTimelineEvents(selectedMemberId),
    [getTimelineEvents, selectedMemberId]
  );

  const documents = useMemo(() => {
    const list = getDocuments(
      selectedMemberId,
      selectedDocType === 'ALL' ? undefined : selectedDocType
    );
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q)) ||
      (d.labOrHospital && d.labOrHospital.toLowerCase().includes(q))
    );
  }, [getDocuments, selectedMemberId, selectedDocType, searchQuery]);

  const followUps = useMemo(
    () => getUpcomingFollowUps(selectedMemberId),
    [getUpcomingFollowUps, selectedMemberId]
  );

  const pendingTests = useMemo(
    () => getPendingDiagnosticTests(selectedMemberId),
    [getPendingDiagnosticTests, selectedMemberId]
  );

  const allTestsForMember = useMemo(() => {
    if (selectedMemberId === 'ALL') return diagnosticTests;
    return diagnosticTests.filter((t) => t.memberId === selectedMemberId);
  }, [diagnosticTests, selectedMemberId]);

  const handleOpenDocViewerFromEvent = (event: MedicalEvent) => {
    const allDocs = getDocuments('ALL');
    const firstDoc = allDocs.find((d) => event.documentIds.includes(d.id));
    if (firstDoc) {
      setDocViewerItem(firstDoc);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="health-and-safety" size={20} color="#38BDF8" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {t('health_vault_title', 'Family Health Vault')}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {t('health_vault_subtitle', 'Care Timeline, Prescriptions & Medical OS')}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Language Switcher Pill */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLanguageModalVisible(true);
                }}
                style={styles.langPillBtn}>
                <Text style={styles.langFlagText}>{currentLangInfo.flag}</Text>
                <Text style={styles.langCodeText}>{currentLangInfo.code.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Emergency Medical ID & SOS */}
              <TouchableOpacity
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                  setEmergencyCardVisible(true);
                }}
                style={styles.emergencyIdBtn}>
                <MaterialIcons name="emergency" size={16} color="#FFFFFF" />
                <Text style={styles.emergencyIdBtnText}>{t('emergency_sos', 'SOS')}</Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* FAMILY MEMBERS FILTER BAR */}
          <View style={styles.membersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}>
              <TouchableOpacity
                onPress={() => setSelectedMemberId('ALL')}
                style={[
                  styles.memberChip,
                  selectedMemberId === 'ALL' && styles.memberChipActive,
                ]}>
                <Text
                  style={[
                    styles.memberChipText,
                    selectedMemberId === 'ALL' && styles.memberChipTextActive,
                  ]}>
                  {t('all_family', '👨‍👩‍👧 All Family')}
                </Text>
              </TouchableOpacity>

              {members.map((m) => {
                const isSelected = selectedMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setSelectedMemberId(m.id)}
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

              <TouchableOpacity
                onPress={() => setMemberManagerVisible(true)}
                style={styles.addMemberChip}>
                <MaterialIcons name="add" size={14} color="#38BDF8" />
                <Text style={styles.addMemberText}>Manage</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* CLINICAL SUITES & QUICK LAUNCHERS */}
          <View style={styles.suiteHubSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suiteHubScroll}>
              
              {/* 0. AI Doctor Voice Recorder & Summarizer */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setVoiceConsultationVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="mic" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_voice_ai', 'Doctor Voice AI')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_voice_ai_sub', 'Live Audio & Summary')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 1. Smart Drug & Food Interaction Checker */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setInteractionCheckerVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                  <MaterialIcons name="warning" size={18} color="#FF6B6B" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_interactions', 'Drug & Food Safety')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_interactions_sub', 'Interaction Checker')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 2. Family Hereditary Risk Tree */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setHereditaryTreeVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                  <MaterialIcons name="account-tree" size={18} color="#20C997" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_hereditary_tree', 'Family Risk Tree')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_hereditary_tree_sub', 'Hereditary Forecast')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3. Phone Calendar & Alarms Sync */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setPhoneSyncVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="event-available" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_phone_sync', 'Phone Calendar Sync')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_phone_sync_sub', 'Google/Apple & Alarms')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 4. Organ Health Scorecard */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setOrganScorecardVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                  <MaterialIcons name="favorite" size={18} color="#FF6B6B" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_organ_scorecard', 'Organ Health Card')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_organ_scorecard_sub', 'Vitality & Biomarkers')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 5. Doctor Visit Preparation & Lab Compare */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setDoctorVisitPrepVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="assignment" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_visit_prep', 'Doctor Visit Prep')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_visit_prep_sub', 'Brief & Lab Compare')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 6. Review & Organize (Data Cleanup & Deduplication) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setDataCleanupVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                  <MaterialIcons name="auto-fix-high" size={18} color="#20C997" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_cleanup', 'Review & Organize')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_cleanup_sub', 'Data Cleanup & Duplicates')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 8. Blood Response Network */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
                  setBloodNetworkVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <MaterialIcons name="bloodtype" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_blood_network', 'Blood Response')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_blood_network_sub', 'Emergency Matching')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 0. Chronic Disease Care Plans (Protocols) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setChronicCareModalVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                  <MaterialIcons name="health-and-safety" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#38BDF8' }]}>
                    {t('suite_chronic_care', 'Chronic Care Plans')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_chronic_care_sub', 'ডায়াবেটিস ও প্রেশার প্রটোকল')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Generic Medicine Alternative Finder */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setGenericFinderVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(0, 180, 216, 0.3)', backgroundColor: 'rgba(0, 180, 216, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(0, 180, 216, 0.2)' }]}>
                  <MaterialIcons name="medication" size={18} color="#00B4D8" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#00B4D8' }]}>
                    {t('suite_generic_finder', 'Generic Finder')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_generic_finder_sub', 'বিকল্প ও MRP দাম তুলনা')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Emergency Hotline & Ambulance Directory */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setEmergencyHotlineVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <MaterialIcons name="local-hospital" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EF4444' }]}>
                    {t('suite_emergency_hotline', 'Ambulance & Hotline')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_emergency_hotline_sub', '৯৯৯, আইসিইউ ও ২৪/৭ ফার্মেসি')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bangladeshi Food Glycemic Index Guide */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setBanglaFoodGiVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <MaterialIcons name="eco" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#10B981' }]}>
                    {t('suite_bangla_food_gi', 'Bangla Food GI')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_bangla_food_gi_sub', 'দেশীয় খাবারের সুগার ও ক্যালরি')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* AI Medical Report Explainer */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setReportExplainerVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                  <MaterialIcons name="analytics" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#38BDF8' }]}>
                    {t('suite_report_explainer', 'Report Explainer')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_report_explainer_sub', 'ল্যাব রিপোর্ট সরল বাংলায়')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Medicine Expiry Radar & Stock Refill */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setExpiryRadarVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <MaterialIcons name="radar" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EF4444' }]}>
                    {t('suite_expiry_radar', 'Expiry Radar')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_expiry_radar_sub', 'মেডিসিন মেয়াদ ও স্টক')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* EPI Child & Elderly Vaccination Tracker */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setEpiTrackerVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(32, 201, 151, 0.3)', backgroundColor: 'rgba(32, 201, 151, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(32, 201, 151, 0.2)' }]}>
                  <MaterialIcons name="child-care" size={18} color="#20C997" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#20C997' }]}>
                    {t('suite_epi_vaccine', 'EPI & Elderly')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_epi_vaccine_sub', 'শিশু ও ৫০+ টিকা ট্র্যাকার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Ramadan & Fasting Diabetes Guard */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setRamadanGuardVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(0, 180, 216, 0.3)', backgroundColor: 'rgba(0, 180, 216, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(0, 180, 216, 0.2)' }]}>
                  <MaterialIcons name="nights-stay" size={18} color="#00B4D8" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#00B4D8' }]}>
                    {t('suite_ramadan_guard', 'Ramadan Guard')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_ramadan_guard_sub', 'রমজান ও রোজা ডায়াবেটিস কেয়ার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Travel Health & Customs Medical Dossier */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setTravelDossierVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <MaterialIcons name="flight-takeoff" size={18} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#F59E0B' }]}>
                    {t('suite_travel_dossier', 'Travel Dossier')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_travel_dossier_sub', 'ভ্রমণ ও মেডিকেল পাসপোর্ট')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Post-Surgery & Discharge Home Recovery */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSurgeryRecoveryVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <MaterialIcons name="healing" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EF4444' }]}>
                    {t('suite_surgery_recovery', 'Surgery Recovery')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_surgery_recovery_sub', 'অপারেশন পরবর্তী রিকভারি ও সেলাই')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Lab Test Cost & Diagnostic Center Comparator */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLabCostVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(2, 132, 199, 0.3)', backgroundColor: 'rgba(2, 132, 199, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
                  <MaterialIcons name="science" size={18} color="#0284C7" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#0284C7' }]}>
                    {t('suite_lab_cost', 'Lab Cost Finder')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_lab_cost_sub', 'ল্যাব টেস্ট খরচ ও ডায়াগনস্টিক তুলনা')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Dengue & Seasonal Fever Fluid Monitor */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setDengueMonitorVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <MaterialIcons name="coronavirus" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EF4444' }]}>
                    {t('suite_dengue_monitor', 'Dengue Guard')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_dengue_monitor_sub', 'ডেঙ্গু ফিভার ও ফ্লুইড ব্যালেন্স ট্র্যাকার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Live AQI & Asthma Air Pollution Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAqiAsthmaVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                  <MaterialIcons name="air" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#38BDF8' }]}>
                    {t('suite_aqi_asthma', 'AQI Asthma Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_aqi_asthma_sub', 'বায়ু দূষণ ও ইনহেলার শিল্ড')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pregnancy Trimester Care & Baby Kick Counter */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setPregnancyCareVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(236, 72, 153, 0.3)', backgroundColor: 'rgba(236, 72, 153, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                  <MaterialIcons name="pregnant-woman" size={18} color="#EC4899" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EC4899' }]}>
                    {t('suite_pregnancy_care', 'Pregnancy & Kick Guard')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_pregnancy_care_sub', 'গর্ভকালীন যত্ন ও বাচ্চার কিক ট্র্যাকার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Hypertension & Blood Pressure Heart Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setHypertensionVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <MaterialIcons name="favorite" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EF4444' }]}>
                    {t('suite_hypertension_shield', 'Hypertension & Heart Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_hypertension_shield_sub', 'উচ্চ রক্তচাপ ও স্ট্রোক রিস্ক গার্ড')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Elderly Parent Care & Daily Safety Monitor */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setElderlyCareVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <MaterialIcons name="elderly" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#10B981' }]}>
                    {t('suite_elderly_care', 'Elderly Parent Care')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_elderly_care_sub', 'মা-বাবার রিমোট কেয়ার ও সেফটি')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Urine Color Hydration & Kidney Stone Guard */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setUrineHydrationVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(2, 132, 199, 0.3)', backgroundColor: 'rgba(2, 132, 199, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
                  <MaterialIcons name="water-drop" size={18} color="#0284C7" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#0284C7' }]}>
                    {t('suite_urine_hydration', 'Urine Color & Kidney Guard')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_urine_hydration_sub', 'ইউরিন রঙ, হাইড্রেশন ও কিডনি কেয়ার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Uric Acid & Gout Joint Pain Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setUricAcidGoutVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(249, 115, 22, 0.3)', backgroundColor: 'rgba(249, 115, 22, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                  <MaterialIcons name="healing" size={18} color="#F97316" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#F97316' }]}>
                    {t('suite_uric_acid_gout', 'Uric Acid & Gout Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_uric_acid_gout_sub', 'ইউরিক এসিড, পিউরিন ও বাতব্যথা')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Postpartum Care & Newborn Growth Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setPostpartumCareVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(236, 72, 153, 0.3)', backgroundColor: 'rgba(236, 72, 153, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                  <MaterialIcons name="child-care" size={18} color="#EC4899" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EC4899' }]}>
                    {t('suite_postpartum_care', 'Postpartum & Newborn Care')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_postpartum_care_sub', 'প্রসবোত্তর যত্ন ও নবজাতক বিকাশ')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Anemia & Hemoglobin Booster Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAnemiaShieldVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <MaterialIcons name="bloodtype" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EF4444' }]}>
                    {t('suite_anemia_shield', 'Anemia & Hemoglobin Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_anemia_shield_sub', 'রক্তস্বল্পতা ও হিমোগ্লোবিন বুস্টার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Memory & Dementia Early Screener */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setMemoryDementiaVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(139, 92, 246, 0.3)', backgroundColor: 'rgba(139, 92, 246, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <MaterialIcons name="psychology" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#8B5CF6' }]}>
                    {t('suite_memory_dementia', 'Memory & Dementia Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_memory_dementia_sub', 'স্মৃতিভ্রম ও ব্রেন ফিটনেস গার্ড')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Osteoporosis & Knee Joint Pain Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setOsteoporosisVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(6, 182, 212, 0.3)', backgroundColor: 'rgba(6, 182, 212, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                  <MaterialIcons name="accessibility-new" size={18} color="#06B6D4" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#06B6D4' }]}>
                    {t('suite_osteoporosis_joint', 'Osteoporosis & Joint Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_osteoporosis_joint_sub', 'হাড়ের ক্ষয় ও হাঁটু ব্যথা কেয়ার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Diabetic Eye & Vision Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setDiabeticVisionVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <MaterialIcons name="visibility" size={18} color="#3B82F6" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#3B82F6' }]}>
                    {t('suite_diabetic_vision', 'Diabetic Eye & Vision Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_diabetic_vision_sub', 'ডায়াবেটিক রেটিনোপ্যাথি ও দৃষ্টি গার্ড')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Age-Related Hearing & Tremor Guard */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setHearingTremorVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(236, 72, 153, 0.3)', backgroundColor: 'rgba(236, 72, 153, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                  <MaterialIcons name="hearing" size={18} color="#EC4899" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#EC4899' }]}>
                    {t('suite_hearing_tremor', 'Hearing & Tremor Guard')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_hearing_tremor_sub', 'শ্রবণশক্তি ও পারকিনসন্স ট্র্যাকার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Elderly Polypharmacy & Drug Conflict Shield */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setPolypharmacyVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(249, 115, 22, 0.3)', backgroundColor: 'rgba(249, 115, 22, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                  <MaterialIcons name="medication" size={18} color="#F97316" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#F97316' }]}>
                    {t('suite_polypharmacy_shield', 'Elderly Polypharmacy Shield')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_polypharmacy_shield_sub', 'ওষুধের ওভারল্যাপ ও Beers গার্ড')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Diabetic Meal Planner BD */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setDiabeticMealPlannerVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <MaterialIcons name="restaurant" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#10B981' }]}>
                    {t('suite_diabetic_meal_planner', 'Diabetic Meal Planner BD')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_diabetic_meal_planner_sub', 'দেশি মিল প্ল্যান ও সুগার ট্র্যাকার')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Family Health Dashboard */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setFamilyDashboardVisible(true);
                }}
                style={[styles.suiteCard, { borderColor: 'rgba(139, 92, 246, 0.3)', backgroundColor: 'rgba(139, 92, 246, 0.05)' }]}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <MaterialIcons name="family-restroom" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={[styles.suiteCardTitle, { color: '#8B5CF6' }]}>
                    {t('suite_family_dashboard', 'Family Health Dashboard')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_family_dashboard_sub', 'সবার স্বাস্থ্য একনজরে ও বুলেটিন')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 9. AI OCR Vision Scanner */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAiScannerVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="document-scanner" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_ai_scanner', 'AI Scanner')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_ai_scanner_sub', 'Rx & Lab Vision')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 2. Insurance Claim Dossier */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setInsuranceClaimVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                  <MaterialIcons name="policy" size={18} color="#20C997" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_insurance', 'Insurance Claim')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_insurance_sub', '1-Click Dossier')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3. Vaccination Vault */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setVaccinationModalVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                  <MaterialIcons name="vaccines" size={18} color="#20C997" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_vaccines', 'Vaccines')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_vaccines_sub', 'Doses & Boosters')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 4. Allergies & Conditions */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAllergyModalVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                  <MaterialIcons name="healing" size={18} color="#A78BFA" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_allergies', 'Allergies')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_allergies_sub', 'Critical Conditions')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 5. Lab Trends */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLabTrendsVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="insights" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_lab_trends', 'Lab Trends')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_lab_trends_sub', 'Biomarkers')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 6. Pharmacy Hub */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setPharmacyModalVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                  <MaterialIcons name="local-pharmacy" size={18} color="#20C997" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_pharmacy', 'Pharmacy Hub')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_pharmacy_sub', 'Receipts & Cabinet')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 7. Hospital & Surgery */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAdmissionModalVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <MaterialIcons name="local-hospital" size={18} color="#F43F5E" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_hospital', 'Hospital Log')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_hospital_sub', 'Admissions & Surgery')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 8. Care Calendar */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setCareCalendarVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="calendar-month" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_calendar', 'Care Calendar')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_calendar_sub', 'Unified Agenda')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 9. Medical Budget & Spending */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAnalyticsVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(255, 146, 43, 0.15)' }]}>
                  <MaterialIcons name="account-balance-wallet" size={18} color="#FF922B" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_budget', 'Health Budget')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_budget_sub', 'Expenses & Alerts')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 10. Doctors Directory */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setDoctorDirectoryVisible(true);
                }}
                style={styles.suiteCard}>
                <View style={[styles.suiteIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <MaterialIcons name="person-pin" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.suiteCardTitle}>
                    {t('suite_doctors', 'Doctors Directory')}
                  </Text>
                  <Text style={styles.suiteCardSub}>
                    {t('suite_doctors_sub', 'Consultants & Labs')}
                  </Text>
                </View>
              </TouchableOpacity>

            </ScrollView>
          </View>

          {/* SUB-TABS SWITCHER */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('TIMELINE');
              }}
              style={[
                styles.subTabItem,
                activeTab === 'TIMELINE' && styles.subTabItemActive,
              ]}>
              <MaterialIcons
                name="timeline"
                size={14}
                color={activeTab === 'TIMELINE' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.subTabText,
                  activeTab === 'TIMELINE' && styles.subTabTextActive,
                ]}>
                {t('tab_timeline', 'Timeline')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('VAULT');
              }}
              style={[
                styles.subTabItem,
                activeTab === 'VAULT' && styles.subTabItemActive,
              ]}>
              <MaterialIcons
                name="folder-special"
                size={14}
                color={activeTab === 'VAULT' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.subTabText,
                  activeTab === 'VAULT' && styles.subTabTextActive,
                ]}>
                {t('tab_vault', 'Vault')} ({documents.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync().catch(() => {});
                setActiveTab('TESTS_CARE');
              }}
              style={[
                styles.subTabItem,
                activeTab === 'TESTS_CARE' && styles.subTabItemActive,
              ]}>
              <MaterialIcons
                name="biotech"
                size={14}
                color={activeTab === 'TESTS_CARE' ? '#38BDF8' : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.subTabText,
                  activeTab === 'TESTS_CARE' && styles.subTabTextActive,
                ]}>
                {t('tab_care_tests', 'Care & Tests')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN CONTENT AREA */}
          <ScrollView
            style={styles.mainScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}>
            {/* 1. TIMELINE SUB-TAB */}
            {activeTab === 'TIMELINE' && (
              <View style={styles.tabContent}>
                {/* Upcoming Follow-Up Alert Banner */}
                {followUps.length > 0 && (
                  <View style={styles.followUpAlertBanner}>
                    <View style={styles.alertLeft}>
                      <MaterialIcons name="notifications-active" size={18} color="#FF922B" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertTitle}>UPCOMING FOLLOW-UP</Text>
                        <Text style={styles.alertSub} numberOfLines={1}>
                          {followUps[0].doctorName} • {followUps[0].reason}
                        </Text>
                        <Text style={styles.alertDate}>Due on {followUps[0].dueDate}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => completeFollowUp(followUps[0].id)}
                      style={styles.doneFollowUpBtn}>
                      <MaterialIcons name="check" size={12} color="#101416" />
                      <Text style={styles.doneFollowUpText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Timeline Events List */}
                {timelineEvents.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="event-busy" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Medical Events Logged</Text>
                    <Text style={styles.emptySub}>
                      Tap "Log Doctor Visit & Event" below to record your first consultation.
                    </Text>
                  </View>
                ) : (
                  timelineEvents.map((evt) => (
                    <HealthTimelineCard
                      key={evt.id}
                      event={evt}
                      onViewDocuments={handleOpenDocViewerFromEvent}
                    />
                  ))
                )}
              </View>
            )}

            {/* 2. VAULT SUB-TAB */}
            {activeTab === 'VAULT' && (
              <View style={styles.tabContent}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={16} color={C.onSurfaceVariant} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('search_placeholder', 'Search CBC, Lipid, Dr. Rahman, hospital...')}
                    placeholderTextColor={C.onSurfaceVariant}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialIcons name="cancel" size={16} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Document Type Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.typeChipsRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedDocType('ALL')}
                    style={[
                      styles.typeChip,
                      selectedDocType === 'ALL' && styles.typeChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.typeChipText,
                        selectedDocType === 'ALL' && styles.typeChipTextActive,
                      ]}>
                      All Files
                    </Text>
                  </TouchableOpacity>

                  {(['PRESCRIPTION', 'LAB_REPORT', 'IMAGING', 'DISCHARGE_SUMMARY', 'VACCINATION'] as MedicalDocumentType[]).map((t) => {
                    const meta = DOCUMENT_TYPE_CONFIG[t];
                    const isSelected = selectedDocType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setSelectedDocType(t)}
                        style={[
                          styles.typeChip,
                          isSelected && styles.typeChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.typeChipText,
                            isSelected && styles.typeChipTextActive,
                          ]}>
                          {meta.label.split(' (')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Document Cards Grid/List */}
                {documents.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="folder-open" size={40} color={C.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Documents Found</Text>
                    <Text style={styles.emptySub}>
                      Prescriptions and lab reports will appear here.
                    </Text>
                  </View>
                ) : (
                  documents.map((doc) => (
                    <HealthDocumentCard
                      key={doc.id}
                      document={doc}
                      onPress={(d) => setDocViewerItem(d)}
                      onDelete={(id) => deleteMedicalDocument(id)}
                    />
                  ))
                )}
              </View>
            )}

            {/* 3. TESTS & CARE SUB-TAB */}
            {activeTab === 'TESTS_CARE' && (
              <View style={styles.tabContent}>
                {/* 3-WAY HEALTH STUDIO ACTION CARDS */}
                <View style={styles.quickLaunchersGrid}>
                  {/* Biomarker Trends */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setLabTrendsVisible(true);
                    }}
                    style={styles.launcherCard}>
                    <View style={[styles.launcherIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                      <MaterialIcons name="insights" size={18} color="#38BDF8" />
                    </View>
                    <Text style={styles.launcherTitle}>Biomarker Trends</Text>
                    <Text style={styles.launcherSub}>HbA1c, CBC & Lipid graphs</Text>
                  </TouchableOpacity>

                  {/* Care Calendar */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setCareCalendarVisible(true);
                    }}
                    style={styles.launcherCard}>
                    <View style={[styles.launcherIconCircle, { backgroundColor: 'rgba(32, 201, 151, 0.15)' }]}>
                      <MaterialIcons name="calendar-month" size={18} color="#20C997" />
                    </View>
                    <Text style={styles.launcherTitle}>Care Calendar</Text>
                    <Text style={styles.launcherSub}>Follow-ups & Test due dates</Text>
                  </TouchableOpacity>

                  {/* Hospitalization Log */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setAdmissionModalVisible(true);
                    }}
                    style={styles.launcherCard}>
                    <View style={[styles.launcherIconCircle, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                      <MaterialIcons name="local-hospital" size={18} color="#F43F5E" />
                    </View>
                    <Text style={styles.launcherTitle}>Hospital Log</Text>
                    <Text style={styles.launcherSub}>Surgeries & Discharge notes</Text>
                  </TouchableOpacity>
                </View>

                {/* Follow-ups Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    SCHEDULED FOLLOW-UPS ({followUps.length})
                  </Text>

                  {followUps.map((flw) => (
                    <View key={flw.id} style={styles.careCard}>
                      <View style={styles.careLeft}>
                        <MaterialIcons name="event-repeat" size={18} color="#38BDF8" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.careTitle}>{flw.reason}</Text>
                          <Text style={styles.careSub}>
                            {flw.doctorName || 'Doctor Review'} • Due: {flw.dueDate}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => completeFollowUp(flw.id)}
                        style={styles.completeBtn}>
                        <MaterialIcons name="check" size={14} color="#101416" />
                        <Text style={styles.completeBtnText}>Mark Done</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Diagnostic Tests Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    DIAGNOSTIC & LAB TESTS ({allTestsForMember.length})
                  </Text>

                  {allTestsForMember.map((t) => (
                    <View key={t.id} style={styles.testItemCard}>
                      <View style={styles.testItemTop}>
                        <MaterialIcons name="biotech" size={16} color="#20C997" />
                        <Text style={styles.testItemName}>{t.testName}</Text>
                        <View
                          style={[
                            styles.testStatusPill,
                            {
                              backgroundColor:
                                t.status === 'COMPLETED'
                                  ? 'rgba(32, 201, 151, 0.15)'
                                  : 'rgba(255, 146, 43, 0.15)',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.testStatusPillText,
                              {
                                color:
                                  t.status === 'COMPLETED' ? '#20C997' : '#FF922B',
                              },
                            ]}>
                            {t.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.testItemSub}>
                        {t.testDate} • {t.labOrHospital || 'Diagnostic Center'}
                      </Text>

                      {t.notes ? (
                        <Text style={styles.testItemNotes}>Result: {t.notes}</Text>
                      ) : null}

                      {t.status === 'PENDING' && (
                        <TouchableOpacity
                          onPress={() => updateDiagnosticTestStatus(t.id, 'COMPLETED')}
                          style={styles.markTestCompleteBtn}>
                          <MaterialIcons name="upload-file" size={12} color="#20C997" />
                          <Text style={styles.markTestCompleteText}>
                            Mark Completed & Add Report
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* BOTTOM FLOATING LOG BUTTON */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAddEventVisible(true);
              }}
              style={styles.logEventBtn}>
              <MaterialIcons name="add" size={20} color="#101416" />
              <Text style={styles.logEventBtnText}>
                {t('log_event_btn', '+ Log Doctor Visit & Event')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* SUB-MODALS */}
      <AddMedicalEventModal
        visible={addEventVisible}
        onClose={() => setAddEventVisible(false)}
      />

      <HealthDocumentViewerModal
        visible={docViewerItem !== null}
        document={docViewerItem}
        onClose={() => setDocViewerItem(null)}
        onDeleteDocument={(id) => deleteMedicalDocument(id)}
      />

      <DoctorDirectoryModal
        visible={doctorDirectoryVisible}
        onClose={() => setDoctorDirectoryVisible(false)}
      />

      <FamilyMemberManagerModal
        visible={memberManagerVisible}
        onClose={() => setMemberManagerVisible(false)}
      />

      <MedicalExpenseAnalyticsSheet
        visible={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
      />

      <EmergencyHealthCardModal
        visible={emergencyCardVisible}
        onClose={() => setEmergencyCardVisible(false)}
      />

      <VaccinationManagerModal
        visible={vaccinationModalVisible}
        onClose={() => setVaccinationModalVisible(false)}
        onViewCertificate={(docId) => {
          const doc = documents.find((d) => d.id === docId);
          if (doc) setDocViewerItem(doc);
        }}
      />

      <AllergyConditionManagerModal
        visible={allergyModalVisible}
        onClose={() => setAllergyModalVisible(false)}
      />

      <LabResultManagerModal
        visible={labTrendsVisible}
        onClose={() => setLabTrendsVisible(false)}
        onViewDocument={(docId) => {
          const doc = documents.find((d) => d.id === docId);
          if (doc) setDocViewerItem(doc);
        }}
      />

      <PharmacyReceiptModal
        visible={pharmacyModalVisible}
        onClose={() => setPharmacyModalVisible(false)}
      />

      <HospitalAdmissionModal
        visible={admissionModalVisible}
        onClose={() => setAdmissionModalVisible(false)}
        onViewDischargeSummary={(docId) => {
          const doc = documents.find((d) => d.id === docId);
          if (doc) setDocViewerItem(doc);
        }}
      />

      <CareCalendarModal
        visible={careCalendarVisible}
        onClose={() => setCareCalendarVisible(false)}
      />

      <AIHealthScannerModal
        visible={aiScannerVisible}
        onClose={() => setAiScannerVisible(false)}
      />

      <InsuranceClaimExportModal
        visible={insuranceClaimVisible}
        onClose={() => setInsuranceClaimVisible(false)}
      />

      <LanguageSwitcherModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

      <DoctorVoiceConsultationModal
        visible={voiceConsultationVisible}
        onClose={() => setVoiceConsultationVisible(false)}
      />

      <DrugInteractionCheckerModal
        visible={interactionCheckerVisible}
        onClose={() => setInteractionCheckerVisible(false)}
      />

      <FamilyHereditaryTreeModal
        visible={hereditaryTreeVisible}
        onClose={() => setHereditaryTreeVisible(false)}
      />

      <PhoneCalendarSyncModal
        visible={phoneSyncVisible}
        onClose={() => setPhoneSyncVisible(false)}
      />

      <OrganHealthScorecardModal
        visible={organScorecardVisible}
        onClose={() => setOrganScorecardVisible(false)}
      />

      <DoctorVisitPrepModal
        visible={doctorVisitPrepVisible}
        onClose={() => setDoctorVisitPrepVisible(false)}
        onLaunchVoiceAi={() => setVoiceConsultationVisible(true)}
        onLaunchAiScanner={() => setAiScannerVisible(true)}
        onLaunchCalendarSync={() => setPhoneSyncVisible(true)}
      />

      <DataCleanupModal
        visible={dataCleanupVisible}
        onClose={() => setDataCleanupVisible(false)}
      />

      <BloodNetworkModal
        visible={bloodNetworkVisible}
        onClose={() => setBloodNetworkVisible(false)}
      />

      <ChronicCareModal
        visible={chronicCareModalVisible}
        onClose={() => setChronicCareModalVisible(false)}
        initialMemberId={selectedMemberId === 'ALL' ? undefined : selectedMemberId}
      />

      <GenericMedicineFinderModal
        visible={genericFinderVisible}
        onClose={() => setGenericFinderVisible(false)}
      />

      <EmergencyHotlineModal
        visible={emergencyHotlineVisible}
        onClose={() => setEmergencyHotlineVisible(false)}
      />

      <BanglaFoodGiModal
        visible={banglaFoodGiVisible}
        onClose={() => setBanglaFoodGiVisible(false)}
      />

      <AIReportExplainerModal
        visible={reportExplainerVisible}
        onClose={() => setReportExplainerVisible(false)}
      />

      <MedicineExpiryRadarModal
        visible={expiryRadarVisible}
        onClose={() => setExpiryRadarVisible(false)}
      />

      <EpiVaccineTrackerModal
        visible={epiTrackerVisible}
        onClose={() => setEpiTrackerVisible(false)}
        initialMemberId={selectedMemberId === 'ALL' ? undefined : selectedMemberId}
      />

      <RamadanGuardModal
        visible={ramadanGuardVisible}
        onClose={() => setRamadanGuardVisible(false)}
      />

      <TravelHealthDossierModal
        visible={travelDossierVisible}
        onClose={() => setTravelDossierVisible(false)}
      />

      <SurgeryRecoveryModal
        visible={surgeryRecoveryVisible}
        onClose={() => setSurgeryRecoveryVisible(false)}
      />

      <LabCostComparatorModal
        visible={labCostVisible}
        onClose={() => setLabCostVisible(false)}
      />

      <DengueFluidMonitorModal
        visible={dengueMonitorVisible}
        onClose={() => setDengueMonitorVisible(false)}
      />

      <AqiAsthmaShieldModal
        visible={aqiAsthmaVisible}
        onClose={() => setAqiAsthmaVisible(false)}
      />

      <PregnancyCareModal
        visible={pregnancyCareVisible}
        onClose={() => setPregnancyCareVisible(false)}
      />

      <HypertensionHeartShieldModal
        visible={hypertensionVisible}
        onClose={() => setHypertensionVisible(false)}
      />

      <ElderlyCareModal
        visible={elderlyCareVisible}
        onClose={() => setElderlyCareVisible(false)}
      />

      <UrineHydrationShieldModal
        visible={urineHydrationVisible}
        onClose={() => setUrineHydrationVisible(false)}
      />

      <UricAcidGoutModal
        visible={uricAcidGoutVisible}
        onClose={() => setUricAcidGoutVisible(false)}
      />

      <PostpartumCareModal
        visible={postpartumCareVisible}
        onClose={() => setPostpartumCareVisible(false)}
      />

      <AnemiaHemoglobinShieldModal
        visible={anemiaShieldVisible}
        onClose={() => setAnemiaShieldVisible(false)}
      />

      <MemoryDementiaModal
        visible={memoryDementiaVisible}
        onClose={() => setMemoryDementiaVisible(false)}
      />

      <OsteoporosisJointModal
        visible={osteoporosisVisible}
        onClose={() => setOsteoporosisVisible(false)}
      />

      <DiabeticVisionModal
        visible={diabeticVisionVisible}
        onClose={() => setDiabeticVisionVisible(false)}
      />

      <HearingTremorModal
        visible={hearingTremorVisible}
        onClose={() => setHearingTremorVisible(false)}
      />

      <PolypharmacyShieldModal
        visible={polypharmacyVisible}
        onClose={() => setPolypharmacyVisible(false)}
      />

      <DiabeticMealPlannerModal
        visible={diabeticMealPlannerVisible}
        onClose={() => setDiabeticMealPlannerVisible(false)}
      />

      <FamilyHealthDashboardModal
        visible={familyDashboardVisible}
        onClose={() => setFamilyDashboardVisible(false)}
      />
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
    flex: 1,
    backgroundColor: '#101416',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
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
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#181F23',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langFlagText: {
    fontSize: 13,
  },
  langCodeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#38BDF8',
  },
  emergencyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F43F5E',
  },
  emergencyIdBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suiteHubSection: {
    backgroundColor: '#141A1D',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  suiteHubScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  suiteIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suiteCardTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  suiteCardSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
  },
  mainScrollView: {
    flex: 1,
  },
  membersBar: {
    backgroundColor: '#181F23',
    paddingVertical: 8,
  },
  membersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  memberChip: {
    backgroundColor: '#13191C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipActive: {
    backgroundColor: '#38BDF8',
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
  addMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMemberText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#38BDF8',
  },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181F23',
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  subTabText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  subTabTextActive: {
    fontFamily: F.bold,
    color: '#38BDF8',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 80,
  },
  tabContent: {
    gap: 12,
  },
  followUpAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 146, 43, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 146, 43, 0.2)',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  alertTitle: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#FF922B',
    letterSpacing: 0.5,
  },
  alertSub: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 1,
  },
  alertDate: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  doneFollowUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF922B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  doneFollowUpText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#101416',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F23',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12,
    color: '#FFFFFF',
    padding: 0,
  },
  typeChipsRow: {
    gap: 6,
    paddingVertical: 4,
  },
  typeChip: {
    backgroundColor: '#181F23',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeChipActive: {
    backgroundColor: '#38BDF8',
  },
  typeChipText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  typeChipTextActive: {
    fontFamily: F.bold,
    color: '#101416',
  },
  quickLaunchersGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  launcherCard: {
    flex: 1,
    backgroundColor: '#181F23',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  launcherIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  launcherSub: {
    fontFamily: F.regular,
    fontSize: 9,
    color: C.onSurfaceVariant,
    lineHeight: 12,
  },
  biomarkerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181F23',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  biomarkerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biomarkerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  biomarkerPill: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  biomarkerPillText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#101416',
  },
  biomarkerSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  careCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F23',
    padding: 12,
    borderRadius: 12,
  },
  careLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  careTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  careSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#101416',
  },
  testItemCard: {
    backgroundColor: '#181F23',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  testItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testItemName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  testStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testStatusPillText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  testItemSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.onSurfaceVariant,
  },
  testItemNotes: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#20C997',
    fontStyle: 'italic',
  },
  markTestCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  markTestCompleteText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#20C997',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#101416',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  logEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#20C997',
    paddingVertical: 13,
    borderRadius: 12,
  },
  logEventBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#101416',
  },
});
