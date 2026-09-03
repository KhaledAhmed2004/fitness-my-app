import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Vital } from '@/constants/vital-theme';
import { useLanguageStore } from '@/stores/language-store';

const C = Vital.colors;
const F = Vital.fonts;

export type QuickActionType =
  | 'EMERGENCY_HOTLINE'
  | 'CARE_PROTOCOL'
  | 'GENERIC_FINDER'
  | 'BANGLA_FOOD_GI'
  | 'REPORT_EXPLAINER'
  | 'EXPIRY_RADAR'
  | 'EPI_VACCINE'
  | 'RAMADAN_GUARD'
  | 'TRAVEL_DOSSIER'
  | 'SURGERY_RECOVERY'
  | 'LAB_COST_COMPARATOR'
  | 'DENGUE_MONITOR'
  | 'AQI_ASTHMA_SHIELD'
  | 'PREGNANCY_CARE'
  | 'HYPERTENSION_SHIELD'
  | 'ELDERLY_CARE'
  | 'URINE_HYDRATION_SHIELD'
  | 'URIC_ACID_GOUT'
  | 'POSTPARTUM_CARE'
  | 'ANEMIA_HEMOGLOBIN_SHIELD'
  | 'MEMORY_DEMENTIA_SHIELD'
  | 'OSTEOPOROSIS_JOINT_SHIELD'
  | 'DIABETIC_VISION_SHIELD'
  | 'HEARING_TREMOR_SHIELD'
  | 'POLYPHARMACY_SHIELD'
  | 'DIABETIC_MEAL_PLANNER'
  | 'FAMILY_HEALTH_DASHBOARD'
  | 'DOCTOR_VISIT'
  | 'MEDICINE'
  | 'LAB_RESULT'
  | 'VACCINE'
  | 'DOCUMENT'
  | 'EXPENSE';

interface HealthQuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: QuickActionType) => void;
}

export const HEALTH_QUICK_ACTIONS: {
  type: QuickActionType;
  icon: any;
  labelEn: string;
  labelBn: string;
  subEn: string;
  subBn: string;
  color: string;
  badgeBg: string;
}[] = [
  {
    type: 'EMERGENCY_HOTLINE',
    icon: 'local-hospital',
    labelEn: 'Emergency Hotline',
    labelBn: '🚨 জরুরি অ্যাম্বুলেন্স ও হেল্পলাইন',
    subEn: '999, ICU Ambulance, Oxygen & 24/7 Pharmacy',
    subBn: '৯৯৯, অ্যাম্বুলেন্স, অক্সিজেন ও নাইট ফার্মেসি',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  {
    type: 'CARE_PROTOCOL',
    icon: 'health-and-safety',
    labelEn: 'Chronic Care Protocol',
    labelBn: '🛡️ ক্রনিক কেয়ার প্রটোকল',
    subEn: 'Diabetes, BP & Fatty Liver Daily Protocol',
    subBn: 'ডায়াবেটিস, প্রেশার ও ফ্যাটি লিভার গাইড',
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  {
    type: 'GENERIC_FINDER',
    icon: 'medication',
    labelEn: 'Generic Medicine Finder',
    labelBn: '💊 বিকল্প ও MRP দাম তুলনা',
    subEn: 'Find same formula brands & compare prices',
    subBn: 'একই ফর্মুলা ও শক্তির সমমানের ব্র্যান্ড',
    color: '#00B4D8',
    badgeBg: 'rgba(0, 180, 216, 0.15)',
  },
  {
    type: 'BANGLA_FOOD_GI',
    icon: 'eco',
    labelEn: 'Bangla Food GI & Calorie Guide',
    labelBn: '🥗 দেশীয় খাবারের GI ও সুগার গাইড',
    subEn: 'GI, Calorie, Purine & Plate Simulator',
    subBn: 'লাল চাল, মাছ, ডাল ও ফলের সুগার স্পাইক গাইড',
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  {
    type: 'REPORT_EXPLAINER',
    icon: 'analytics',
    labelEn: 'AI Medical Report Explainer',
    labelBn: '🩺 এআই ল্যাব রিপোর্ট বিশ্লেষক',
    subEn: 'Simple Bangla report meaning & doctor questions',
    subBn: 'রিপোর্টের সহজ বাংলা অর্থ ও ডাক্তারের ৩টি প্রশ্ন',
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  {
    type: 'EXPIRY_RADAR',
    icon: 'radar',
    labelEn: 'Medicine Expiry & Refill Radar',
    labelBn: '💊 মেডিসিন মেয়াদ ও স্টক রাডার',
    subEn: 'Expiry countdown, refill alert & drawer safety',
    subBn: 'মেয়াদোত্তীর্ণ ড্রয়ার অ্যালার্ট ও রিফিল নোটিফিকেশন',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  {
    type: 'EPI_VACCINE',
    icon: 'child-care',
    labelEn: 'EPI & Elderly Vaccine Vault',
    labelBn: '👶 সরকারি শিশু EPI ও ৫০+ টিকা ট্র্যাকার',
    subEn: 'DGHS EPI Child Schedule & Digital Vaccine Card',
    subBn: 'জন্মতারিখ অনুযায়ী অটো শিডিউল ও ডিজিটাল টিকা কার্ড',
    color: '#20C997',
    badgeBg: 'rgba(32, 201, 151, 0.15)',
  },
  {
    type: 'RAMADAN_GUARD',
    icon: 'nights-stay',
    labelEn: 'Ramadan & Fasting Diabetes Guard',
    labelBn: '🌙 রমজান ও রোজা ডায়াবেটিস কেয়ার',
    subEn: 'Iftar/Suhoor Combiner & Medication Shift Guide',
    subBn: 'সেহরি-ইফতার ফুড কম্বাইনার ও ওষুধের সময় শিডিউলার',
    color: '#00B4D8',
    badgeBg: 'rgba(0, 180, 216, 0.15)',
  },
  {
    type: 'TRAVEL_DOSSIER',
    icon: 'flight-takeoff',
    labelEn: 'Travel Health & Customs Dossier',
    labelBn: '🧳 ভ্রমণ ও মেডিকেল ট্যুরিজম পাসপোর্ট',
    subEn: 'Hajj/Umrah, Customs Medication & Fit-to-Fly PDF',
    subBn: 'হজ্ব/ওমরাহ, কাস্টমস ওষুধ ডিক্লারেশন ও ট্রাভেল পাসপোর্ট',
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  {
    type: 'SURGERY_RECOVERY',
    icon: 'healing',
    labelEn: 'Post-Surgery Home Recovery',
    labelBn: '🏥 অপারেশন রিকভারি ও সেলাই ট্র্যাকার',
    subEn: '14-Day Roadmap, Suture Countdown & Red-Flags',
    subBn: '১৪ দিনের কেয়ার রোডম্যাপ, সেলাই কাটা ও ইনফেকশন স্ক্রিনার',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  {
    type: 'LAB_COST_COMPARATOR',
    icon: 'science',
    labelEn: 'Lab Test Cost & Diagnostic Comparator',
    labelBn: '🧪 ল্যাব টেস্ট খরচ ও ডায়াগনস্টিক তুলনা',
    subEn: 'Popular, Ibn Sina, Labaid Price Comparison & Home Blood Draw',
    subBn: 'শীর্ষ ডায়াগনস্টিকের টেস্টের মূল্য তুলনা ও হোম স্যাম্পল হটলাইন',
    color: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
  },
  {
    type: 'DENGUE_MONITOR',
    icon: 'coronavirus',
    labelEn: 'Dengue & Fever Fluid Monitor',
    labelBn: '🦟 ডেঙ্গু ফিভার ও ফ্লুইড ব্যালেন্স ট্র্যাকার',
    subEn: 'Platelet Trend, Hourly ORS & Red-Flag Warnings',
    subBn: 'প্লাটিলেট গ্রাফ, ঘণ্টাভিত্তিক ফ্লুইড চার্ট ও বিপদচিহ্ন অ্যালার্ট',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  {
    type: 'AQI_ASTHMA_SHIELD',
    icon: 'air',
    labelEn: 'Live AQI & Asthma Air Pollution Shield',
    labelBn: '🫁 বায়ু দূষণ ও অ্যাজমা শিল্ড',
    subEn: 'Live City AQI, Inhaler Puff Counter & 4-4-4 Protocol',
    subBn: 'লাইভ AQI ইনডেক্স, ইনহেলার পাফ ট্র্যাকার ও পিক ফ্লো জোন',
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  {
    type: 'PREGNANCY_CARE',
    icon: 'pregnant-woman',
    labelEn: 'Pregnancy Care & Baby Kick Counter',
    labelBn: '🤰 গর্ভকালীন যত্ন ও বাচ্চার কিক ট্র্যাকার',
    subEn: 'Week-by-Week Growth, 10-Kick Stopwatch & GDM Shield',
    subBn: 'সপ্তাহভিত্তিক শিশুর বিকাশ, কিক কাউন্টার ও ডেলিভারি ব্যাগ',
    color: '#EC4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
  },
  {
    type: 'HYPERTENSION_SHIELD',
    icon: 'favorite',
    labelEn: 'Hypertension & Heart Shield',
    labelBn: '🩸 উচ্চ রক্তচাপ ও হার্ট শিল্ড',
    subEn: 'AHA 5-Tier Gauge, Morning Surge & DASH Diet',
    subBn: 'লাইভ বিপি গেজ, মর্নিং স্পাইক ও ড্যাশ ডায়েট গাইড',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  {
    type: 'ELDERLY_CARE',
    icon: 'elderly',
    labelEn: 'Elderly Parent Care & Safety Monitor',
    labelBn: '👴 মা-বাবার রিমোট কেয়ার ও সেফটি',
    subEn: '1-Tap Daily Check-in, Fall Risk & WhatsApp Update',
    subBn: 'বড় বোতামে ওষুধ চেক-ইন, বাথরুম সেফটি ও রিপোর্ট',
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  {
    type: 'URINE_HYDRATION_SHIELD',
    icon: 'water-drop',
    labelEn: 'Urine Color & Kidney Shield',
    labelBn: '🚰 ইউরিন রঙ ও কিডনি স্টোন গার্ড',
    subEn: 'Armstrong 8-Shades, Daily Water Target & UTI Screener',
    subBn: '৮-শেড ইউরিন ম্যাচ, পানির টার্গেট ও ইউটিআই স্ক্রিনার',
    color: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
  },
  {
    type: 'URIC_ACID_GOUT',
    icon: 'healing',
    labelEn: 'Uric Acid & Gout Joint Shield',
    labelBn: '🦶 ইউরিক এসিড ও বাতব্যথা গার্ড',
    subEn: 'Serum Uric Acid Meter, Purine Food & Flare First Aid',
    subBn: 'ইউরিক এসিড মিটার, পিউরিন ডায়েট ও বরফ সেঁক ফার্স্ট এইড',
    color: '#F97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
  },
  {
    type: 'POSTPARTUM_CARE',
    icon: 'child-care',
    labelEn: 'Postpartum & Newborn Care',
    labelBn: '👶 প্রসবোত্তর যত্ন ও নবজাতক বিকাশ',
    subEn: 'Kramer Jaundice Scale, 6+ Diaper Log & Lactation',
    subBn: 'ক্রেমার জন্ডিস স্কেল, ৬+ ডায়াপার ও ল্যাকটেশন ডায়েট',
    color: '#EC4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
  },
  {
    type: 'ANEMIA_HEMOGLOBIN_SHIELD',
    icon: 'bloodtype',
    labelEn: 'Anemia & Hemoglobin Shield',
    labelBn: '🩸 রক্তস্বল্পতা ও হিমোগ্লোবিন বুস্টার',
    subEn: 'Hb Meter, Deshi Iron Food Matrix & 2hr Timing Guard',
    subBn: 'হিমোগ্লোবিন মিটার, দেশি আয়রন ডায়েট ও টাইমিং গার্ড',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  {
    type: 'MEMORY_DEMENTIA_SHIELD',
    icon: 'psychology',
    labelEn: 'Memory & Dementia Shield',
    labelBn: '🧠 স্মৃতিভ্রম ও ব্রেন ফিটনেস গার্ড',
    subEn: 'Mini-Cog Screener, Behavior Log & Safe ID',
    subBn: 'Mini-Cog স্ক্রিনার, আচরণগত পর্যবেক্ষণ ও সেফটি আইডি',
    color: '#8B5CF6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
  },
  {
    type: 'OSTEOPOROSIS_JOINT_SHIELD',
    icon: 'accessibility-new',
    labelEn: 'Osteoporosis & Joint Shield',
    labelBn: '🦴 হাড়ের ক্ষয় ও হাঁটু ব্যথা কেয়ার',
    subEn: 'FRAX Fracture Risk, Knee Rehab & Sunlight D3',
    subBn: 'হাড়ের ফ্র্যাকচার ঝুঁকি, হাঁটুর ফিজিওথেরাপি ও রোদ',
    color: '#06B6D4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
  },
  {
    type: 'DIABETIC_VISION_SHIELD',
    icon: 'visibility',
    labelEn: 'Diabetic Eye & Vision Shield',
    labelBn: '👁️ ডায়াবেটিক রেটিনোপ্যাথি ও দৃষ্টি গার্ড',
    subEn: 'Amsler Grid, Fundoscopy & Eye Warning Signs',
    subBn: 'Amsler Grid টেস্ট, রেটিনা ফান্ডোস্কোপি ও চোখের বিপদচিহ্ন',
    color: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  {
    type: 'HEARING_TREMOR_SHIELD',
    icon: 'hearing',
    labelEn: 'Hearing & Tremor Guard',
    labelBn: '🧏 শ্রবণশক্তি ও পারকিনসন্স ট্র্যাকার',
    subEn: 'HHIE-S Hearing Screen, Rest Tremor & Parkinson Signs',
    subBn: 'শ্রবণ স্ক্রিনার, হাত কাঁপা ও পারকিনসন্স আর্লি সাইন',
    color: '#EC4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
  },
  {
    type: 'POLYPHARMACY_SHIELD',
    icon: 'medication',
    labelEn: 'Elderly Polypharmacy Shield',
    labelBn: '💊 অতিরিক্ত ওষুধের ওভারল্যাপ গার্ড',
    subEn: 'Pill Burden, Beers Criteria & Renal Dosing',
    subBn: 'পিল বার্ডেন, Beers ক্রাইটেরিয়া ও কিডনি সেফটি ডোজ',
    color: '#F97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
  },
  {
    type: 'DIABETIC_MEAL_PLANNER',
    icon: 'restaurant',
    labelEn: 'Diabetic Meal Planner BD',
    labelBn: '🍽️ দেশি ডায়াবেটিক মিল প্ল্যানার',
    subEn: 'GI Index, Ramadan Menu & Sugar Log',
    subBn: 'দেশি মিল প্ল্যান, ইফতার-সেহরি ও রক্তের শর্করা লগ',
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  {
    type: 'FAMILY_HEALTH_DASHBOARD',
    icon: 'family-restroom',
    labelEn: 'Family Health Dashboard',
    labelBn: '📊 ফ্যামিলি হেলথ ড্যাশবোর্ড',
    subEn: 'Member overview, upcoming events & weekly bulletin',
    subBn: 'সবার স্বাস্থ্য একনজরে, টেস্ট শিডিউল ও বুলেটিন',
    color: '#8B5CF6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
  },
  {
    type: 'DOCTOR_VISIT',
    icon: 'medical-services',
    labelEn: 'Doctor Visit',
    labelBn: 'ডাক্তার ভিজিট',
    subEn: 'Chamber consultation, advice & vitals',
    subBn: 'ডাক্তারের পরামর্শ ও প্রেসক্রিপশন লগ',
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  {
    type: 'MEDICINE',
    icon: 'medication',
    labelEn: 'Medicine',
    labelBn: 'ঔষধ / প্রেসক্রিপশন',
    subEn: 'Daily doses, reminders & cabinet refill',
    subBn: 'দৈনিক ঔষধ, রিমাইন্ডার ও ক্যাবিনেট সিঙ্ক',
    color: '#FF922B',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
  },
  {
    type: 'LAB_RESULT',
    icon: 'biotech',
    labelEn: 'Lab Result',
    labelBn: 'ল্যাব টেস্টের রিপোর্ট',
    subEn: 'HbA1c, Creatinine, Lipid & CBC values',
    subBn: 'ব্লাড টেস্ট, সিবিসি ও বায়োমার্কার মান',
    color: '#20C997',
    badgeBg: 'rgba(32, 201, 151, 0.15)',
  },
  {
    type: 'VACCINE',
    icon: 'vaccines',
    labelEn: 'Vaccine',
    labelBn: 'টিকা / ভ্যাকসিন',
    subEn: 'Booster doses, schedule & certificates',
    subBn: 'বুস্টার ডোজ ও পরবর্তী টিকার তারিখ',
    color: '#A78BFA',
    badgeBg: 'rgba(167, 139, 250, 0.15)',
  },
  {
    type: 'DOCUMENT',
    icon: 'document-scanner',
    labelEn: 'Document & OCR',
    labelBn: 'প্রেসক্রিপশন / রিপোর্ট স্ক্যান',
    subEn: 'AI Vision OCR scan & PDF vault',
    subBn: 'ক্যামেরা দিয়ে প্রেসক্রিপশন ও ফাইল সংরক্ষণ',
    color: '#2DD4BF',
    badgeBg: 'rgba(45, 212, 191, 0.15)',
  },
  {
    type: 'EXPENSE',
    icon: 'account-balance-wallet',
    labelEn: 'Expense',
    labelBn: 'চিকিৎসা খরচ',
    subEn: 'Doctor fee, pharmacy & test voucher',
    subBn: 'ডাক্তারের ফি, ঔষধ ক্রয় ও ভাউচার ট্র্যাকার',
    color: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
  },
];

export function HealthQuickActionsModal({
  visible,
  onClose,
  onSelectAction,
}: HealthQuickActionsModalProps) {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const isBn = currentLanguage === 'bn';

  const handleAction = (type: QuickActionType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onClose();
    setTimeout(() => {
      onSelectAction(type);
    }, 120);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheetContainer}
          onPress={(e) => e.stopPropagation()}>
          {/* DRAG HANDLE */}
          <View style={styles.dragHandle} />

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="add" size={22} color="#20C997" />
              </View>
              <View>
                <Text style={styles.title}>
                  {isBn ? 'দ্রুত রেকর্ড যুক্ত করুন' : '+ Quick Add Health Action'}
                </Text>
                <Text style={styles.subtitle}>
                  {isBn
                    ? '১-ট্যাপে সরাসরি স্বাস্থ্য তথ্য সংরক্ষণ'
                    : '1-Tap Instant Logging • No friction'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* ACTIONS LIST */}
          <View style={styles.actionGrid}>
            {HEALTH_QUICK_ACTIONS.map((item) => (
              <TouchableOpacity
                key={item.type}
                activeOpacity={0.82}
                onPress={() => handleAction(item.type)}
                style={styles.actionItemCard}>
                <View
                  style={[
                    styles.actionIconBox,
                    { backgroundColor: item.badgeBg },
                  ]}>
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={item.color}
                  />
                </View>

                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionLabel}>
                    {isBn ? item.labelBn : item.labelEn}
                  </Text>
                  <Text style={styles.actionSub}>
                    {isBn ? item.subBn : item.subEn}
                  </Text>
                </View>

                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={C.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#101416',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#181F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGrid: {
    gap: 10,
  },
  actionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F23',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  actionSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
});
