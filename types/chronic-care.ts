export type ChronicProtocolType =
  | 'DIABETES_MANAGEMENT'
  | 'HYPERTENSION_CONTROL'
  | 'FATTY_LIVER_REVERSAL'
  | 'CUSTOM_CARE';

export type GlucoseMeasurementType =
  | 'FASTING'
  | 'POST_MEAL_2H'
  | 'RANDOM'
  | 'BEDTIME';

export type BloodSugarStatus = 'OPTIMAL' | 'ELEVATED' | 'HIGH' | 'LOW';

export interface BloodSugarLog {
  id: string;
  memberId: string;
  protocolId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: GlucoseMeasurementType;
  valueMmol: number; // e.g. 5.4 mmol/L
  notes?: string;
  status: BloodSugarStatus;
  createdAt: number;
}

export type BloodPressureStatus =
  | 'OPTIMAL'
  | 'NORMAL'
  | 'ELEVATED'
  | 'STAGE_1'
  | 'STAGE_2'
  | 'CRISIS';

export interface BloodPressureLog {
  id: string;
  memberId: string;
  protocolId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  systolic: number; // e.g. 120
  diastolic: number; // e.g. 80
  pulse?: number; // e.g. 72
  status: BloodPressureStatus;
  notes?: string;
  createdAt: number;
}

export interface ChronicDietRuleItem {
  id: string;
  title: string;
  bengaliTitle: string;
  description: string;
  bengaliDescription: string;
  isPositiveHabit: boolean; // true = Positive recommendation / false = Prohibited / avoid item
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'GENERAL';
}

export interface DailyProtocolProgress {
  date: string; // YYYY-MM-DD
  memberId: string;
  sugarLogged: boolean;
  sugarValue?: number;
  bpLogged: boolean;
  bpValue?: string; // "120/80"
  stepsCount: number;
  stepsTarget: number; // e.g. 6000
  stepsCompleted: boolean;
  completedDietRuleIds: string[];
  totalDietRulesCount: number;
  complianceScore: number; // 0 - 100%
}

export interface ActiveCareProtocol {
  id: string;
  type: ChronicProtocolType;
  memberId: string;
  title: string;
  bengaliTitle: string;
  description: string;
  bengaliDescription: string;
  icon: string;
  color: string;
  accentBg: string;
  activatedAt: string;
  isActive: boolean;

  // Clinical Targets
  fastingSugarTargetMin: number; // e.g. 4.0 mmol/L
  fastingSugarTargetMax: number; // e.g. 5.6 mmol/L
  bpTargetSystolicMax: number; // e.g. 120 mmHg
  bpTargetDiastolicMax: number; // e.g. 80 mmHg
  dailyStepsTarget: number; // e.g. 6000
  bpWeeklyScheduleDays: number[]; // e.g. [1, 4] (Monday & Thursday, 0=Sun, 6=Sat)

  dietRules: ChronicDietRuleItem[];
  associatedConditionName?: string;
}

export const PRESET_CHRONIC_PROTOCOLS: Record<
  ChronicProtocolType,
  Omit<ActiveCareProtocol, 'id' | 'memberId' | 'activatedAt' | 'isActive'>
> = {
  DIABETES_MANAGEMENT: {
    type: 'DIABETES_MANAGEMENT',
    title: 'Diabetes Control Protocol',
    bengaliTitle: 'ডায়াবেটিস কন্ট্রোল প্রটোকল',
    description:
      'Daily fasting glucose logging, low-glycemic meals, 6,000 steps & HbA1c surveillance.',
    bengaliDescription:
      'প্রতিদিন সকালে খালি পেটে সুগার লগ, লো-জিআই খাবার, ৬,০০০ কদম হাঁটা এবং ৩ মাস পর পর HbA1c টেস্ট।',
    icon: 'water-drop',
    color: '#00B4D8',
    accentBg: 'rgba(0, 180, 216, 0.15)',
    fastingSugarTargetMin: 4.0,
    fastingSugarTargetMax: 5.6,
    bpTargetSystolicMax: 130,
    bpTargetDiastolicMax: 80,
    dailyStepsTarget: 6000,
    bpWeeklyScheduleDays: [1, 4], // সোম ও বৃহস্পতি
    dietRules: [
      {
        id: 'db_rule_1',
        title: 'Fasting Blood Sugar Log',
        bengaliTitle: 'সকালে খালি পেটে গ্লুকোজ পরিমাপ',
        description: 'Check glucose before breakfast and log the reading in app',
        bengaliDescription: 'সকালের নাস্তার আগে গ্লুকোমিটার দিয়ে সুগার মেপে অ্যাপে লগ করুন',
        isPositiveHabit: true,
        category: 'BREAKFAST',
      },
      {
        id: 'db_rule_2',
        title: 'Fiber First Rule (Salad & Greens)',
        bengaliTitle: 'ফাইবার-ফার্স্ট নীতি (শাকসবজি ও সালাদ আগে)',
        description:
          'Eat raw salad or cooked green vegetables before carbs to reduce insulin spike',
        bengaliDescription:
          'ভাতের আগে শসা, টমেটো বা শাকসবজি খেলে রক্তের সুগার হুট করে বাড়ে না',
        isPositiveHabit: true,
        category: 'LUNCH',
      },
      {
        id: 'db_rule_3',
        title: 'Zero Added Sugar & Sweet Drinks',
        bengaliTitle: 'চিনিযুক্ত মিষ্টি পানীয় ও মিষ্টি বর্জন',
        description: 'No sugar in tea/coffee, zero soft drinks, zero sweets',
        bengaliDescription:
          'চিনি ছাড়া লাল চা/গ্রিন টি পান এবং যেকোনো কোল্ড ড্রিঙ্কস ও মিষ্টি পুরোপুরি বাদ',
        isPositiveHabit: false,
        category: 'GENERAL',
      },
      {
        id: 'db_rule_4',
        title: 'Portion-Controlled Carbs',
        bengaliTitle: 'সীমিত ভাত বা লাল আটার রুটি (১ কাপ/২টি)',
        description: 'Limit refined carbs to 1 cup cooked rice or 2 whole wheat rotis',
        bengaliDescription:
          'সাদা চালের ভাতের পরিমাণ কমিয়ে লাল চাল বা লাল আটার রুটি খান',
        isPositiveHabit: true,
        category: 'DINNER',
      },
      {
        id: 'db_rule_5',
        title: 'Post-Meal 15-min Brisk Walk',
        bengaliTitle: 'ভারী খাবারের পর ১৫ মিনিট হালকা হাঁটা',
        description: 'A gentle 15-min stroll drops postprandial glucose peaks by up to 25%',
        bengaliDescription:
          'দুপুর বা রাতের খাবারের পর সাথে সাথে না শুয়ে ১৫ মিনিট পায়চারি করুন',
        isPositiveHabit: true,
        category: 'GENERAL',
      },
    ],
    associatedConditionName: 'Type 2 Diabetes (ডায়াবেটিস)',
  },
  HYPERTENSION_CONTROL: {
    type: 'HYPERTENSION_CONTROL',
    title: 'Hypertension Protocol (BP Control)',
    bengaliTitle: 'হাইপারটেনশন / প্রেশার প্রটোকল',
    description:
      'Bi-weekly BP tracking, low sodium DASH diet, 6,000 steps & hydration balance.',
    bengaliDescription:
      'সপ্তাহে ২ দিন প্রেশার মাপা, পাতে কাঁচা লবণ বর্জন, ৬,০০০ কদম হাঁটা ও পটাসিয়াম সমৃদ্ধ খাবার।',
    icon: 'favorite',
    color: '#F43F5E',
    accentBg: 'rgba(244, 63, 94, 0.15)',
    fastingSugarTargetMin: 4.0,
    fastingSugarTargetMax: 6.0,
    bpTargetSystolicMax: 120,
    bpTargetDiastolicMax: 80,
    dailyStepsTarget: 6000,
    bpWeeklyScheduleDays: [0, 3], // রবি ও বুধ
    dietRules: [
      {
        id: 'bp_rule_1',
        title: 'Zero Added Table Salt',
        bengaliTitle: 'পাতে অতিরিক্ত কাঁচা লবণ নিষিদ্ধ',
        description: 'Avoid table salt during meals; limit total sodium below 2,000mg/day',
        bengaliDescription:
          'খাওয়ার সময় আলাদা লবণ নেয়া পুরোপুরি বন্ধ রাখুন, তরকারিতেও পরিমিত লবণ দিন',
        isPositiveHabit: false,
        category: 'GENERAL',
      },
      {
        id: 'bp_rule_2',
        title: 'Bi-Weekly BP Measurement',
        bengaliTitle: 'সপ্তাহে ২ দিন নির্ধারিত প্রেশার লগিং',
        description: 'Rest 5 minutes before taking blood pressure at morning or evening',
        bengaliDescription:
          '৫ মিনিট শান্তভাবে বসে রক্তচাপ মেপে অ্যাপে সিস্টোলিক ও ডায়াস্টোলিক লগ করুন',
        isPositiveHabit: true,
        category: 'GENERAL',
      },
      {
        id: 'bp_rule_3',
        title: 'Potassium Rich Foods (Banana, Greens, Coconut Water)',
        bengaliTitle: 'পটাশিয়াম সমৃদ্ধ খাবার (কলা, শাকসবজি, ডাবের পানি)',
        description: 'Potassium balances sodium levels in the vascular walls',
        bengaliDescription:
          'দৈনিক খাদ্যতালিকায় সবুজ শাক, কলা বা শসা রাখুন যা রক্তচাপ নিয়ন্ত্রণে সাহায্য করে',
        isPositiveHabit: true,
        category: 'LUNCH',
      },
      {
        id: 'bp_rule_4',
        title: 'Avoid Salty Snacks & Pickles',
        bengaliTitle: 'লোনা চিপস, চানাচুর ও আচার বর্জন',
        description: 'High sodium in packaged snacks directly spikes blood pressure',
        bengaliDescription:
          'চানাচুর, ফাস্টফুড, নোনতা বাদাম ও কাঁচা তেলের আচার এড়িয়ে চলুন',
        isPositiveHabit: false,
        category: 'GENERAL',
      },
      {
        id: 'bp_rule_5',
        title: '5-Minute Slow Box Breathing',
        bengaliTitle: '৫ মিনিট গভীর শ্বাস-প্রশ্বাসের ব্যায়াম',
        description: 'Engage parasympathetic relaxation to lower vascular resistance',
        bengaliDescription:
          'ঘুমানোর আগে ৫ মিনিট বুক ভরে শ্বাস নিয়ে ধীরে ধীরে ছাড়ুন',
        isPositiveHabit: true,
        category: 'DINNER',
      },
    ],
    associatedConditionName: 'Hypertension (উচ্চ রক্তচাপ)',
  },
  FATTY_LIVER_REVERSAL: {
    type: 'FATTY_LIVER_REVERSAL',
    title: 'Fatty Liver Reversal Guide',
    bengaliTitle: 'ফ্যাটি লিভার রিভার্সাল গাইড',
    description:
      '14:10 fasting sync, zero deep-fried trans-fats, 7,000 steps & liver detox greens.',
    bengaliDescription:
      '১৪:১০ ইন্টারমিটেন্ট ফাস্টিং, সিঙ্গাড়া-পুরি ও ভাজাপোড়া বর্জন, ৭,০০০ কদম এবং লিভার ডিটক্স খাবার।',
    icon: 'spa',
    color: '#20C997',
    accentBg: 'rgba(32, 201, 151, 0.15)',
    fastingSugarTargetMin: 4.0,
    fastingSugarTargetMax: 5.6,
    bpTargetSystolicMax: 125,
    bpTargetDiastolicMax: 80,
    dailyStepsTarget: 7000,
    bpWeeklyScheduleDays: [2, 5], // মঙ্গল ও শুক্র
    dietRules: [
      {
        id: 'fl_rule_1',
        title: 'Zero Deep-Fried Foods (Singara, Puri, Fried Snacks)',
        bengaliTitle: 'সিঙ্গাড়া, পুরি, সমুচা ও ভাজাপোড়া বর্জন',
        description: 'Reused cooking oils cause severe hepatic lipid accumulation',
        bengaliDescription:
          'দোকানের পোড়া তেলের ভাজাপোড়া লিভারের চর্বি বাড়িয়ে হেপাটিক ইনফ্ল্যামেশন ঘটায়',
        isPositiveHabit: false,
        category: 'GENERAL',
      },
      {
        id: 'fl_rule_2',
        title: '14:10 Gentle Intermittent Fasting',
        bengaliTitle: '১৪ ঘণ্টা না খেয়ে থাকা (ইন্টারমিটেন্ট ফাস্টিং)',
        description:
          'Night fasting forces hepatic beta-oxidation to burn liver triglycerides',
        bengaliDescription:
          'রাতের খাবারের পর সকাল পর্যন্ত ১৪ ঘণ্টা বিরতি দিয়ে লিভারকে চর্বি গলাতে সময় দিন',
        isPositiveHabit: true,
        category: 'GENERAL',
      },
      {
        id: 'fl_rule_3',
        title: 'Cruciferous Greens & Omega-3 (Chia/Flax Seeds)',
        bengaliTitle: 'ব্রোকলি, বাঁধাকপি ও চিয়া/তিসি বীজ গ্রহণ',
        description:
          'Rich in sulforaphane and healthy fats that clear fatty liver deposits',
        bengaliDescription:
          'দৈনিক খাবারে বাঁধাকপি, ফুলকপি, পেঁপে এবং এক চামচ চিয়া বা তিসি বীজ রাখুন',
        isPositiveHabit: true,
        category: 'LUNCH',
      },
      {
        id: 'fl_rule_4',
        title: 'Zero High-Fructose Soft Drinks & Packaged Juice',
        bengaliTitle: 'প্যাকেটজাত জুস ও ফ্রুক্টোজ মিষ্টি পানীয় বর্জন',
        description: 'Fructose is metabolized directly into liver fat (de novo lipogenesis)',
        bengaliDescription:
          'বোতলজাত ফ্রুট জুস ও সফট ড্রিঙ্কস লিভারে সরাসরি চর্বি তৈরি করে',
        isPositiveHabit: false,
        category: 'GENERAL',
      },
      {
        id: 'fl_rule_5',
        title: '7,000 Brisk Aerobic Steps Daily',
        bengaliTitle: 'দৈনিক ৭,০০০ কদম দ্রুত হাঁটা',
        description: 'Aerobic exercise directly burns visceral and hepatic fat stores',
        bengaliDescription:
          'ঘাম ঝরিয়ে দ্রুত হাঁটা লিভার এনজাইম (SGPT/ALT) স্বাভাবিক করতে সবচেয়ে কার্যকরী',
        isPositiveHabit: true,
        category: 'GENERAL',
      },
    ],
    associatedConditionName: 'Fatty Liver (ফ্যাটি লিভার / হেপাটিক স্টিয়াটোসিস)',
  },
  CUSTOM_CARE: {
    type: 'CUSTOM_CARE',
    title: 'Custom Chronic Care Protocol',
    bengaliTitle: 'কাস্টম কেয়ার প্রটোকল',
    description: 'Personalized chronic care checklist customized by your physician.',
    bengaliDescription:
      'আপনার চিকিৎসকের পরামর্শ অনুযায়ী কাস্টমাইজ করা বিশেষ রুটিন ও ফলো-আপ প্ল্যান।',
    icon: 'tune',
    color: '#A78BFA',
    accentBg: 'rgba(167, 139, 250, 0.15)',
    fastingSugarTargetMin: 4.0,
    fastingSugarTargetMax: 6.0,
    bpTargetSystolicMax: 130,
    bpTargetDiastolicMax: 85,
    dailyStepsTarget: 6000,
    bpWeeklyScheduleDays: [0, 3],
    dietRules: [
      {
        id: 'custom_rule_1',
        title: 'Prescribed Medicine on Schedule',
        bengaliTitle: 'ডাক্তারের প্রেসক্রিপশন অনুযায়ী সঠিক সময়ে ওষুধ সেবন',
        description: 'Take all prescribed doses without skipping',
        bengaliDescription: 'সময়মতো ডাক্তারের দেওয়া সকল ওষুধ গ্রহণ করুন',
        isPositiveHabit: true,
        category: 'GENERAL',
      },
      {
        id: 'custom_rule_2',
        title: 'Adequate Daily Hydration (2.5L+)',
        bengaliTitle: 'পর্যাপ্ত বিশুদ্ধ পানি পান (২.৫+ লিটার)',
        description: 'Maintain kidney filtration and vascular hydration',
        bengaliDescription: 'শরীর আর্দ্র ও সতেজ রাখতে নিয়মিত পানি পান করুন',
        isPositiveHabit: true,
        category: 'GENERAL',
      },
    ],
    associatedConditionName: 'General Chronic Care',
  },
};

export function classifyBloodSugar(
  valueMmol: number,
  type: GlucoseMeasurementType = 'FASTING'
): {
  status: BloodSugarStatus;
  label: string;
  bengaliLabel: string;
  color: string;
  badgeBg: string;
  advice: string;
} {
  if (valueMmol < 3.8) {
    return {
      status: 'LOW',
      label: 'Low (Hypoglycemia Alert)',
      bengaliLabel: 'হাইপোগ্লাইসেমিয়া (অতিরিক্ত কম)',
      color: '#FA5252',
      badgeBg: 'rgba(250, 82, 82, 0.15)',
      advice: 'দ্রুত চিনিযুক্ত পানি বা গ্লুকোজ গ্রহণ করুন এবং বিশ্রাম নিন।',
    };
  }

  if (type === 'FASTING') {
    if (valueMmol <= 5.5) {
      return {
        status: 'OPTIMAL',
        label: 'Optimal (Normal)',
        bengaliLabel: 'স্বাভাবিক (নরমাল)',
        color: '#51CF66',
        badgeBg: 'rgba(81, 207, 102, 0.15)',
        advice: 'আপনার খালি পেটে সুগার চমৎকার নিয়ন্ত্রণে রয়েছে।',
      };
    }
    if (valueMmol <= 6.9) {
      return {
        status: 'ELEVATED',
        label: 'Pre-diabetic / Borderline',
        bengaliLabel: 'বর্ডারলাইন (সতর্কতা)',
        color: '#FCC419',
        badgeBg: 'rgba(252, 196, 25, 0.15)',
        advice: 'খাদ্যাভ্যাস নিয়ন্ত্রণ ও নিয়মিত হাঁটা জরুরি।',
      };
    }
    return {
      status: 'HIGH',
      label: 'High (Hyperglycemia)',
      bengaliLabel: 'উচ্চ রক্তে সুগার (হাই)',
      color: '#F43F5E',
      badgeBg: 'rgba(244, 63, 94, 0.15)',
      advice: 'ডাক্তারের পরামর্শ অনুযায়ী ওষুধ ও ডায়েট কঠোরভাবে মেনে চলুন।',
    };
  }

  // Post-meal 2h or Random
  if (valueMmol <= 7.7) {
    return {
      status: 'OPTIMAL',
      label: 'Optimal Post-Meal',
      bengaliLabel: 'স্বাভাবিক (পোস্ট-মিল)',
      color: '#51CF66',
      badgeBg: 'rgba(81, 207, 102, 0.15)',
      advice: 'খাবারের ২ ঘণ্টা পরের সুগার নিখুঁত পরিসরে রয়েছে।',
    };
  }
  if (valueMmol <= 11.0) {
    return {
      status: 'ELEVATED',
      label: 'Elevated Post-Meal',
      bengaliLabel: 'কিছুটা বেশি (সতর্কতা)',
      color: '#FCC419',
      badgeBg: 'rgba(252, 196, 25, 0.15)',
      advice: 'পরবর্তী খাবারে শর্করার পরিমাণ কমান।',
    };
  }
  return {
    status: 'HIGH',
    label: 'High Glucose',
    bengaliLabel: 'অতিরিক্ত উচ্চ সুগার',
    color: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    advice: 'চিকিৎসকের সাথে ডোজ এডজাস্টমেন্ট নিয়ে কথা বলুন।',
  };
}

export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): {
  status: BloodPressureStatus;
  label: string;
  bengaliLabel: string;
  color: string;
  badgeBg: string;
  advice: string;
} {
  if (systolic < 120 && diastolic < 80) {
    return {
      status: 'OPTIMAL',
      label: 'Optimal (Normal BP)',
      bengaliLabel: 'নিখুঁত ও স্বাভাবিক রক্তচাপ',
      color: '#51CF66',
      badgeBg: 'rgba(81, 207, 102, 0.15)',
      advice: 'আপনার রক্তচাপ সম্পূর্ণ আদর্শ অবস্থায় রয়েছে।',
    };
  }
  if (systolic <= 129 && diastolic < 80) {
    return {
      status: 'ELEVATED',
      label: 'Elevated BP',
      bengaliLabel: 'কিছুটা উচ্চ (এলিভেটেড)',
      color: '#FCC419',
      badgeBg: 'rgba(252, 196, 25, 0.15)',
      advice: 'পাতে কাঁচা লবণ বর্জন করুন ও মানসিক চাপ কমান।',
    };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      status: 'STAGE_1',
      label: 'Stage 1 Hypertension',
      bengaliLabel: 'স্টেজ-১ হাইপারটেনশন',
      color: '#FF922B',
      badgeBg: 'rgba(255, 146, 43, 0.15)',
      advice: 'ডাক্তারের প্রেসক্রিপশন এবং DASH ডায়েট মেনে চলুন।',
    };
  }
  if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
    return {
      status: 'STAGE_2',
      label: 'Stage 2 Hypertension',
      bengaliLabel: 'স্টেজ-২ উচ্চ রক্তচাপ',
      color: '#F43F5E',
      badgeBg: 'rgba(244, 63, 94, 0.15)',
      advice: 'নিয়মিত ওষুধ খান এবং চিকিৎসকের সাথে যোগাযোগ রাখুন।',
    };
  }
  return {
    status: 'CRISIS',
    label: 'Hypertensive Crisis Alert',
    bengaliLabel: 'জরুরি সতর্কতা (Hypertensive Crisis)',
    color: '#E03131',
    badgeBg: 'rgba(224, 49, 49, 0.2)',
    advice: 'অবিলম্বে চিকিৎসকের পরামর্শ বা জরুরি বিভাগে যোগাযোগ করুন!',
  };
}
