import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppScreenHeader } from '@/components/navigation/app-screen-header';
import { RoutineTimelineModal } from '@/components/routine';
import { TodoManagerModal } from '@/components/todo';
import {
  AddMedicalEventModal,
  AIHealthScannerModal,
  LabResultManagerModal,
  VaccinationManagerModal,
} from '@/components/health-vault';
import {
  GymMemberCrmModal,
  GymLeadPipelineModal,
  GymFinancialsAnalyticsModal,
  GymAnnouncementModal,
  GymCheckinStationModal,
} from '@/components/gym-owner';
import { ROUTES } from '@/constants/routes';
import { Vital } from '@/constants/vital-theme';
import { useAuth } from '@/hooks/use-auth';
import { useLanguageStore } from '@/stores/language-store';
import { useMedicineStore } from '@/stores/medicine-store';
import { useNutritionUiStore } from '@/stores/nutrition-ui-store';
import type { MemberStatus } from '@/types/gym';

const C = Vital.colors;
const F = Vital.fonts;

export default function AddScreen() {
  const { user } = useAuth();
  const isGymOwner = user?.role === 'GYM_OWNER';
  const t = useLanguageStore((s) => s.t);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const isBn = currentLanguage === 'bn';

  const requestOpenLog = useNutritionUiStore((s) => s.requestOpenLog);
  const openMedicineModal = useMedicineStore((s) => s.openLogModal);

  // Modals state
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [doctorEventModalVisible, setDoctorEventModalVisible] = useState(false);
  const [vaccineModalVisible, setVaccineModalVisible] = useState(false);
  const [aiScannerModalVisible, setAiScannerModalVisible] = useState(false);
  const [labResultModalVisible, setLabResultModalVisible] = useState(false);

  // Gym Owner Modals state
  const [gymCheckinVisible, setGymCheckinVisible] = useState(false);
  const [gymMemberCrmVisible, setGymMemberCrmVisible] = useState(false);
  const [gymMemberFilter, setGymMemberFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [gymLeadVisible, setGymLeadVisible] = useState(false);
  const [gymFinancialsVisible, setGymFinancialsVisible] = useState(false);
  const [gymAnnouncementVisible, setGymAnnouncementVisible] = useState(false);

  const handleActionPress = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (id === 'gym_checkin') {
      setGymCheckinVisible(true);
    } else if (id === 'gym_member') {
      setGymMemberFilter('ALL');
      setGymMemberCrmVisible(true);
    } else if (id === 'gym_lead') {
      setGymLeadVisible(true);
    } else if (id === 'gym_fee') {
      setGymMemberFilter('UNPAID');
      setGymMemberCrmVisible(true);
    } else if (id === 'gym_expense') {
      setGymFinancialsVisible(true);
    } else if (id === 'gym_proshop') {
      router.push(ROUTES.nutrition);
    } else if (id === 'gym_announce') {
      setGymAnnouncementVisible(true);
    } else if (id === 'doctor') {
      setDoctorEventModalVisible(true);
    } else if (id === 'medicine') {
      openMedicineModal();
      router.push(ROUTES.nutrition);
    } else if (id === 'lab') {
      setLabResultModalVisible(true);
    } else if (id === 'vaccine') {
      setVaccineModalVisible(true);
    } else if (id === 'doc_ocr') {
      setAiScannerModalVisible(true);
    } else if (id === 'todo') {
      setTodoModalVisible(true);
    } else if (id === 'routine') {
      setRoutineModalVisible(true);
    } else if (id === 'meal') {
      requestOpenLog();
      router.push(ROUTES.nutrition);
    }
  };

  const GYM_OPERATIONS_ACTIONS = [
    {
      id: 'gym_checkin',
      label: isBn ? 'ফিজিক্যাল চেক-ইন টার্মিনাল' : 'Front-Desk Check-In',
      hint: isBn ? 'নাম, ফোন বা লকার দিয়ে ১-ট্যাপ উপস্থিতি' : 'Search & punch live member attendance',
      icon: 'how-to-reg' as const,
      color: '#89FE00',
      badgeBg: 'rgba(137, 254, 0, 0.15)',
    },
    {
      id: 'gym_member',
      label: isBn ? 'নতুন মেম্বার এনরোল' : 'Enroll New Member',
      hint: isBn ? 'মেম্বারশিপ প্যাকেজ, ফি ও পেমেন্ট রেজিস্ট্রেশন' : 'Register athlete, assign plan & locker',
      icon: 'person-add' as const,
      color: '#00B4D8',
      badgeBg: 'rgba(0, 180, 216, 0.15)',
    },
    {
      id: 'gym_lead',
      label: isBn ? 'ওয়াক-ইন ট্রায়াল ও লিড' : 'Capture Walk-In Lead',
      hint: isBn ? 'ফ্রি ট্রায়াল শিডিউল ও সোশ্যাল লিড ট্র্যাকিং' : 'Book free trial & follow up in 1 tap',
      icon: 'person-search' as const,
      color: '#FCC419',
      badgeBg: 'rgba(252, 196, 25, 0.15)',
    },
    {
      id: 'gym_fee',
      label: isBn ? 'বকেয়া মেম্বারশিপ ফি কালেকশন' : 'Collect Overdue Fees',
      hint: isBn ? 'বকেয়া ফিল্টার ও ১-ট্যাপ হোয়াটসঅ্যাপ ইনভয়েস' : 'Filter unpaid accounts & bill directly',
      icon: 'payments' as const,
      color: '#FA5252',
      badgeBg: 'rgba(250, 82, 82, 0.15)',
    },
    {
      id: 'gym_expense',
      label: isBn ? 'অপারেশনাল খরচ এন্ট্রি' : 'Log Facility Expense',
      hint: isBn ? 'বিদ্যুৎ বিল, ভাড়া, মেরামত ও স্টাফ পে-রোল' : 'Record utility, rent, AMC & payroll spend',
      icon: 'receipt-long' as const,
      color: '#FF922B',
      badgeBg: 'rgba(255, 146, 43, 0.15)',
    },
    {
      id: 'gym_proshop',
      label: isBn ? 'প্রো-শপ ও শেক বার POS' : 'Pro-Shop & Shake Bar POS',
      hint: isBn ? '১-ট্যাপে প্রোটিন শেক, সাপ্লিমেন্ট বিক্রি ও মেম্বার ট্যাব' : '1-Tap shake billing & supplement retail sale',
      icon: 'local-cafe' as const,
      color: '#FFB800',
      badgeBg: 'rgba(255, 184, 0, 0.15)',
    },
    {
      id: 'gym_announce',
      label: isBn ? 'ফ্যাসিলিটি নোটিশ ও ব্রডকাস্ট' : 'Broadcast Announcement',
      hint: isBn ? 'ছুটি, পাওয়ার শিডিউল বা স্পেশাল ডিসকাউন্ট' : 'Push alerts to all active member dashboards',
      icon: 'campaign' as const,
      color: '#A78BFA',
      badgeBg: 'rgba(167, 139, 250, 0.15)',
    },
  ];

  const HEALTH_ACTIONS = [
    {
      id: 'doctor',
      label: isBn ? 'ডাক্তার ভিজিট' : 'Doctor Visit',
      hint: isBn ? 'ডাক্তারের পরামর্শ ও প্রেসক্রিপশন লগ' : 'Chamber consultation, advice & vitals',
      icon: 'medical-services' as const,
      color: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
    },
    {
      id: 'medicine',
      label: isBn ? 'ঔষধ / প্রেসক্রিপশন' : 'Medicine & Rx',
      hint: isBn ? 'দৈনিক ঔষধ, রিমাইন্ডার ও ক্যাবিনেট সিঙ্ক' : 'Daily doses, reminders & cabinet refill',
      icon: 'medication' as const,
      color: '#FF922B',
      badgeBg: 'rgba(255, 146, 43, 0.15)',
    },
    {
      id: 'lab',
      label: isBn ? 'ল্যাব টেস্টের রিপোর্ট' : 'Lab Result & Biomarker',
      hint: isBn ? 'ব্লাড টেস্ট, সিবিসি ও বায়োমার্কার মান' : 'HbA1c, Creatinine, Lipid & CBC values',
      icon: 'biotech' as const,
      color: '#20C997',
      badgeBg: 'rgba(32, 201, 151, 0.15)',
    },
    {
      id: 'vaccine',
      label: isBn ? 'টিকা / ভ্যাকসিন' : 'Vaccine Shot',
      hint: isBn ? 'বুস্টার ডোজ ও পরবর্তী টিকার তারিখ' : 'Booster doses, schedule & certificates',
      icon: 'vaccines' as const,
      color: '#A78BFA',
      badgeBg: 'rgba(167, 139, 250, 0.15)',
    },
    {
      id: 'doc_ocr',
      label: isBn ? 'প্রেসক্রিপশন / রিপোর্ট স্ক্যান' : 'Document & AI Scanner',
      hint: isBn ? 'ক্যামেরা দিয়ে প্রেসক্রিপশন ও ফাইল সংরক্ষণ' : 'AI Vision OCR scan & PDF vault',
      icon: 'document-scanner' as const,
      color: '#2DD4BF',
      badgeBg: 'rgba(45, 212, 191, 0.15)',
    },
  ];

  const LIFESTYLE_ACTIONS = [
    {
      id: 'meal',
      label: isBn ? 'খাবার লগ করুন' : 'Log a meal',
      hint: isBn ? 'ব্রেকফাস্ট, লাঞ্চ, ডিনার বা স্ন্যাকস' : 'Add food to breakfast, lunch, or dinner',
      icon: 'restaurant' as const,
      color: '#FCC419',
      badgeBg: 'rgba(252, 196, 25, 0.15)',
    },
    {
      id: 'todo',
      label: isBn ? 'টু-ডু ও স্বাস্থ্য টাস্ক' : 'Tasks & Goals',
      hint: isBn ? 'মেডিকেল টাস্ক ও শপিং লিস্ট' : 'Manage to-dos & medical tasks',
      icon: 'checklist-rtl' as const,
      color: '#748FFC',
      badgeBg: 'rgba(116, 143, 252, 0.15)',
    },
    {
      id: 'routine',
      label: isBn ? 'ডেইলি রুটিন ও অভ্যাস' : 'Daily Routine & Habits',
      hint: isBn ? 'সকাল ও রাতের স্বাস্থ্য অভ্যাস' : 'Track circadian protocols and consistency',
      icon: 'checklist' as const,
      color: '#20C997',
      badgeBg: 'rgba(32, 201, 151, 0.15)',
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.background }} edges={['top']}>
      <AppScreenHeader
        title={isBn ? (isGymOwner ? 'জিম অপারেশনাল স্পিড ডায়াল' : 'কুইক অ্যাড') : isGymOwner ? 'Gym Ops Speed Dial' : 'Quick add'}
        subtitle={isGymOwner ? '⚡ 1-Tap Commercial Facility Actions' : (user?.email || '1-Tap Fast Logging')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}>
        <Text
          style={{
            color: C.onSurfaceVariant,
            fontSize: 14,
            fontFamily: F.sans,
            lineHeight: 20,
            marginBottom: 16,
          }}>
          {isGymOwner
            ? (isBn
                ? '১-ট্যাপে মেম্বার উপস্থিতি, ফি কালেকশন, ওয়াক-ইন লিড ও ব্রডকাস্ট নোটিশ হ্যান্ডেল করুন।'
                : 'Execute high-frequency gym operations, check-ins, fee collections, and leads instantly.')
            : (isBn
                ? '১-ট্যাপে সরাসরি যেকোনো স্বাস্থ্য বা লাইফস্টাইল রেকর্ড সংরক্ষণ করুন।'
                : 'Jump into 1-tap instant logging for health vault and lifestyle.')}
        </Text>

        {/* GYM OPERATIONS SECTION (FOR GYM OWNERS) */}
        {isGymOwner && (
          <>
            <Text
              style={{
                fontFamily: F.bold,
                fontSize: 11,
                color: '#89FE00',
                letterSpacing: 0.8,
                marginBottom: 10,
              }}>
              {isBn ? '🏢 জিম কমান্ড ও অপারেশনস' : '🏢 GYM OPERATIONS SPEED DIAL'}
            </Text>

            <View style={{ gap: 10, marginBottom: 24 }}>
              {GYM_OPERATIONS_ACTIONS.map((action) => (
                <Pressable
                  key={action.id}
                  onPress={() => handleActionPress(action.id)}
                  className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
                  style={{
                    borderRadius: Vital.radius.xl,
                    borderWidth: 1,
                    borderColor: 'rgba(137, 254, 0, 0.2)',
                    backgroundColor: C.surfaceContainer,
                  }}>
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: action.badgeBg }}>
                    <MaterialIcons name={action.icon} size={20} color={action.color} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: C.onSurface, fontSize: 14, fontFamily: F.sansSemiBold }}>
                      {action.label}
                    </Text>
                    <Text style={{ color: C.onSurfaceVariant, fontSize: 11, fontFamily: F.sans }}>
                      {action.hint}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={C.outline} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* HEALTH VAULT SECTION */}
        <Text
          style={{
            fontFamily: F.bold,
            fontSize: 11,
            color: '#38BDF8',
            letterSpacing: 0.8,
            marginBottom: 10,
          }}>
          {isBn ? '🏥 ফ্যামিলি হেলথ রেকর্ড' : '🏥 FAMILY HEALTH VAULT'}
        </Text>

        <View style={{ gap: 10, marginBottom: 24 }}>
          {HEALTH_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleActionPress(action.id)}
              className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
              style={{
                borderRadius: Vital.radius.xl,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
                backgroundColor: C.surfaceContainer,
              }}>
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: action.badgeBg }}>
                <MaterialIcons name={action.icon} size={20} color={action.color} />
              </View>
              <View className="flex-1">
                <Text style={{ color: C.onSurface, fontSize: 14, fontFamily: F.sansSemiBold }}>
                  {action.label}
                </Text>
                <Text style={{ color: C.onSurfaceVariant, fontSize: 11, fontFamily: F.sans }}>
                  {action.hint}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </Pressable>
          ))}
        </View>

        {/* LIFESTYLE & NUTRITION SECTION */}
        <Text
          style={{
            fontFamily: F.bold,
            fontSize: 11,
            color: '#FCC419',
            letterSpacing: 0.8,
            marginBottom: 10,
          }}>
          {isBn ? '⚡ লাইফস্টাইল ও নিউট্রিশন' : '⚡ LIFESTYLE & NUTRITION'}
        </Text>

        <View style={{ gap: 10, marginBottom: 24 }}>
          {LIFESTYLE_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleActionPress(action.id)}
              className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
              style={{
                borderRadius: Vital.radius.xl,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
                backgroundColor: C.surfaceContainer,
              }}>
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: action.badgeBg }}>
                <MaterialIcons name={action.icon} size={20} color={action.color} />
              </View>
              <View className="flex-1">
                <Text style={{ color: C.onSurface, fontSize: 14, fontFamily: F.sansSemiBold }}>
                  {action.label}
                </Text>
                <Text style={{ color: C.onSurfaceVariant, fontSize: 11, fontFamily: F.sans }}>
                  {action.hint}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.outline} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => router.push(ROUTES.profile)}
          className="flex-row items-center justify-center gap-2 py-3 active:opacity-80"
          style={{
            borderRadius: Vital.radius.full,
            borderWidth: 1,
            borderColor: C.outlineVariant,
            backgroundColor: C.surfaceHigh,
          }}>
          <MaterialIcons name="person" size={18} color={C.primary} />
          <Text style={{ color: C.primary, fontSize: 14, fontFamily: F.sansBold }}>
            {isBn ? 'প্রোফাইল ওপেন করুন' : 'Open profile'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* ALL HEALTH MODALS */}
      <AddMedicalEventModal
        visible={doctorEventModalVisible}
        onClose={() => setDoctorEventModalVisible(false)}
      />

      <VaccinationManagerModal
        visible={vaccineModalVisible}
        onClose={() => setVaccineModalVisible(false)}
      />

      <AIHealthScannerModal
        visible={aiScannerModalVisible}
        onClose={() => setAiScannerModalVisible(false)}
      />

      <LabResultManagerModal
        visible={labResultModalVisible}
        onClose={() => setLabResultModalVisible(false)}
      />

      <RoutineTimelineModal
        visible={routineModalVisible}
        onClose={() => setRoutineModalVisible(false)}
      />

      <TodoManagerModal
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
      />

      {/* GYM OWNER OPERATIONAL MODALS */}
      <GymCheckinStationModal
        visible={gymCheckinVisible}
        onClose={() => setGymCheckinVisible(false)}
        onOpenMemberCrm={() => {
          setGymCheckinVisible(false);
          setGymMemberCrmVisible(true);
        }}
      />

      <GymMemberCrmModal
        visible={gymMemberCrmVisible}
        initialFilter={gymMemberFilter}
        onClose={() => setGymMemberCrmVisible(false)}
      />

      <GymLeadPipelineModal
        visible={gymLeadVisible}
        onClose={() => setGymLeadVisible(false)}
      />

      <GymFinancialsAnalyticsModal
        visible={gymFinancialsVisible}
        onClose={() => setGymFinancialsVisible(false)}
      />

      <GymAnnouncementModal
        visible={gymAnnouncementVisible}
        onClose={() => setGymAnnouncementVisible(false)}
      />
    </SafeAreaView>
  );
}

