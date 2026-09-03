import {
  HospitalBagItem,
  PregnancyEmergencySignDef,
  WeekMilestoneInfo,
} from '@/types/pregnancy-care';

export const PREGNANCY_WEEKS_DATA: WeekMilestoneInfo[] = [
  {
    weekNumber: 8,
    trimester: 'FIRST_TRIMESTER',
    babyFruitSizeBn: 'জলপাই (Olive)',
    babyFruitSizeEn: 'Olive',
    babyWeightGrams: 1,
    babyLengthCm: 1.6,
    babyHighlightsBn:
      'বাচ্চার হৃৎস্পন্দন তৈরি হয়েছে এবং ক্ষুদ্র হাত-পায়ের আঙুল গঠিত হচ্ছে।',
    momChangesBn:
      'সকালের বমি বমি ভাব (Morning Sickness), মুখে অরুচি ও ক্লান্তি লাগতে পারে।',
    dietAdviceBn:
      'ফলিক এসিড (Folic Acid 5mg) নিয়মিত খান। অল্প অল্প করে বারবার খান ও আদা চা পান করুন।',
    recommendedTestsBn: 'Complete Blood Count (CBC), Urine R/E, Blood Grouping & USG Dating Scan',
  },
  {
    weekNumber: 12,
    trimester: 'FIRST_TRIMESTER',
    babyFruitSizeBn: 'লেবু (Lemon)',
    babyFruitSizeEn: 'Lemon',
    babyWeightGrams: 14,
    babyLengthCm: 5.4,
    babyHighlightsBn:
      'শিশুর সকল প্রধান অঙ্গ গঠিত হয়েছে এবং নখ ও কণ্ঠনালী তৈরি হচ্ছে।',
    momChangesBn:
      '১ম ট্রাইমেস্টার শেষ হচ্ছে। বমি ভাব কিছুটা কমতে শুরু করবে এবং ক্ষুধা বাড়বে।',
    dietAdviceBn:
      'প্রোটিনযুক্ত খাবার (ডিম, দেশি মুরগি, ডাল, বাদাম) ও প্রচুর তাজা ফলমূল গ্রহণ করুন।',
    recommendedTestsBn: 'First Trimester NT Scan & Dual Marker Screening (যদি প্রয়োজন হয়)',
  },
  {
    weekNumber: 16,
    trimester: 'SECOND_TRIMESTER',
    babyFruitSizeBn: 'আপেল (Apple)',
    babyFruitSizeEn: 'Apple',
    babyWeightGrams: 100,
    babyLengthCm: 11.6,
    babyHighlightsBn:
      'বাচ্চা আলো ও শব্দের প্রতি সংবেদনশীল হতে শুরু করেছে এবং ভ্রু তৈরি হচ্ছে।',
    momChangesBn:
      'পেটের আকার সামান্য স্পষ্ট হতে পারে। ত্বকে মেছতা বা হালকা পিগমেন্টেশন হতে পারে।',
    dietAdviceBn:
      'আয়রন ও ক্যালসিয়াম সাপ্লিমেন্ট শুরু করার আদর্শ সময়। কাঁচা লবণ এড়িয়ে চলুন।',
    recommendedTestsBn: 'Hb% ও ব্লাড প্রেসার নিয়মিত মনিটরিং',
  },
  {
    weekNumber: 20,
    trimester: 'SECOND_TRIMESTER',
    babyFruitSizeBn: 'কলা (Banana)',
    babyFruitSizeEn: 'Banana',
    babyWeightGrams: 300,
    babyLengthCm: 25.6,
    babyHighlightsBn:
      'বাচ্চা পেটে আঙুল চুষতে পারে এবং মায়ের কথার শব্দ শুনতে পায়। আল্ট্রাসাউন্ডে অঙ্গপ্রত্যঙ্গ স্পষ্ট।',
    momChangesBn:
      'মাইলস্টোন: মা পেটের ভেতর বাচ্চার প্রথম হালকা নড়াচড়া (Quickening / প্রজাপতির ডানার মতো) অনুভব করতে পারেন।',
    dietAdviceBn:
      'দুধ, ছানা, ডিমের কুসুম, ছোট মাছ ও সবুজ শাকসবজি খান। পর্যাপ্ত পানি (৩ লিটার) পান করুন।',
    recommendedTestsBn: '🎯 USG Anomaly Scan (বাচ্চার অঙ্গ নিখুঁত গঠন পরীক্ষার সবচেয়ে গুরুত্বপূর্ণ টেস্ট)',
  },
  {
    weekNumber: 24,
    trimester: 'SECOND_TRIMESTER',
    babyFruitSizeBn: 'ভুট্টা (Ear of Corn)',
    babyFruitSizeEn: 'Corn',
    babyWeightGrams: 600,
    babyLengthCm: 30.0,
    babyHighlightsBn:
      'বাচ্চার ফুসফুসের শ্বাসনালী শাখা-প্রশাখা বিস্তার করছে এবং চোখের পাতা খুলছে।',
    momChangesBn:
      'কোমরে বা পায়ে হালকা টান লাগতে পারে। বুকজ্বালা বা এসিডিটি হতে পারে।',
    dietAdviceBn:
      'রাতের খাবার ঘুমানোর ২ ঘণ্টা আগে খান। ভারী ঝাল-তেলযুক্ত খাবার পরিহার করুন।',
    recommendedTestsBn: '🩸 OGTT (Oral Glucose Tolerance Test - গর্ভকালীন ডায়াবেটিস পরীক্ষা)',
  },
  {
    weekNumber: 28,
    trimester: 'THIRD_TRIMESTER',
    babyFruitSizeBn: 'বেগুন (Eggplant)',
    babyFruitSizeEn: 'Eggplant',
    babyWeightGrams: 1000,
    babyLengthCm: 37.6,
    babyHighlightsBn:
      '৩য় ট্রাইমেস্টার শুরু! বাচ্চার মস্তিষ্ক দ্রুত বিকাশ লাভ করছে এবং নিয়মিত ঘুম ও জাগরণের ছন্দ তৈরি হয়েছে।',
    momChangesBn:
      'বাচ্চার নড়াচড়া বেশ শক্তভাবে অনুভব করবেন। এখন থেকে প্রতিদিন "বেবি কিক কাউন্টার" ব্যবহার করুন।',
    dietAdviceBn:
      'আয়রন ও ক্যালসিয়াম আলাদা সময়ে খান (ক্যালসিয়াম সকালে, আয়রন দুপুরে বা রাতে)। চা-কফির সাথে খাবেন না।',
    recommendedTestsBn: 'Repeat CBC (হিমোগ্লোবিন চেক) ও টিটেনাস (TT-2) টিকা নিশ্চিতকরণ',
  },
  {
    weekNumber: 32,
    trimester: 'THIRD_TRIMESTER',
    babyFruitSizeBn: 'নারিকেল (Coconut)',
    babyFruitSizeEn: 'Coconut',
    babyWeightGrams: 1700,
    babyLengthCm: 42.4,
    babyHighlightsBn:
      'বাচ্চার হাড় শক্ত হচ্ছে এবং শরীরে সাবকুটেনিয়াস ফ্যাট বা চর্বি জমছে।',
    momChangesBn:
      'জরায়ুর চাপ বৃদ্ধির কারণে ঘন ঘন প্রস্রাবের বেগ ও হালকা শ্বাসকষ্ট লাগতে পারে।',
    dietAdviceBn:
      'উঁচু বালিশে ঘুমান এবং সবসময় বাম কাত (Left Lateral Position) হয়ে শুতে চেষ্টা করুন।',
    recommendedTestsBn: 'Growth Scan USG & Fetal Doppler (বাচ্চার রক্ত চলাচল ও ওজন বৃদ্ধি)',
  },
  {
    weekNumber: 36,
    trimester: 'THIRD_TRIMESTER',
    babyFruitSizeBn: 'পেঁপে (Papaya)',
    babyFruitSizeEn: 'Papaya',
    babyWeightGrams: 2600,
    babyLengthCm: 47.4,
    babyHighlightsBn:
      'বাচ্চার ফুসফুস প্রায় সম্পূর্ণ পরিণত। বাচ্চা পেলভিসের নিচের দিকে মাথা নামাতে শুরু করে (Engaged)।',
    momChangesBn:
      'হাঁটতে ভারী লাগতে পারে। ফলস পেইন (Braxton Hicks) দেখা দিতে পারে।',
    dietAdviceBn:
      'হসপিটাল ডেলিভারি ব্যাগ গুছিয়ে রাখুন। সহজে হজম হয় এমন তরল ও পুষ্টিকর খাবার খান।',
    recommendedTestsBn: 'Weekly ANC Checkup (রক্তচাপ, ইউরিনে প্রোটিন ও বাচ্চার পজিশন)',
  },
  {
    weekNumber: 40,
    trimester: 'THIRD_TRIMESTER',
    babyFruitSizeBn: 'তরমুজ (Watermelon)',
    babyFruitSizeEn: 'Watermelon',
    babyWeightGrams: 3400,
    babyLengthCm: 51.2,
    babyHighlightsBn:
      'শিশু সম্পূর্ণ প্রস্তুত এবং মায়ের কোলে আসার প্রতীক্ষায়! 🎉',
    momChangesBn:
      'লেবার পেইনের লক্ষণ: নিয়মিত বিরতিতে পেটে তীব্র টান, পানি ভাঙা বা লালচে শ্লেষ্মা নির্গমন।',
    dietAdviceBn:
      'মানসিকভাবে শান্ত থাকুন। যে কোনো সময় ব্যথা শুরু হলে অবিলম্বে হাসপাতালে রওনা দিন।',
    recommendedTestsBn: 'CTG / Non-Stress Test (NST) & Admission Readiness',
  },
];

export const PREGNANCY_EMERGENCY_SIGNS: PregnancyEmergencySignDef[] = [
  {
    key: 'HEAVY_VAGINAL_BLEEDING',
    titleBn: 'যোনিপথে রক্তক্ষরণ (Vaginal Bleeding)',
    descriptionBn:
      'যেকোনো পরিমাণ লাল রক্তক্ষরণ প্ল্যাসেন্টা প্রিভিয়া বা গর্ভফুলের রক্তপাতের মারাত্মক সংকেত।',
  },
  {
    key: 'SEVERE_HEADACHE_BLURRED_VISION',
    titleBn: 'তীব্র মাথাব্যথা ও চোখে ঝাপসা দেখা (Pre-Eclampsia Alert)',
    descriptionBn:
      'উচ্চ রক্তচাপ ও খিঁচুনির (Eclampsia) পূর্বলক্ষণ। মুখে ও হাতে তীব্র ফোলা থাকতে পারে।',
  },
  {
    key: 'SUDDEN_FLUID_LEAKAGE',
    titleBn: 'অসময়ে পানি ভাঙা (Premature Rupture of Membranes)',
    descriptionBn:
      'প্রস্রাব ছাড়া যোনিপথে অবিরাম স্বচ্ছ তরল নির্গমন বাচ্চার চারপাশের অ্যামনিওটিক তরল কমে যাওয়ার লক্ষণ।',
  },
  {
    key: 'NO_KICKS_IN_12_HOURS',
    titleBn: 'বাচ্চার নড়াচড়া বন্ধ বা আশঙ্কাজনকভাবে কমে যাওয়া',
    descriptionBn:
      'মিষ্টি কিছু খেয়ে বাম কাত হয়ে শুয়ে থাকার পরও ২ ঘণ্টায় ১০টি কিক না পাওয়া বা ১২ ঘণ্টা নড়াচড়া না থাকা।',
  },
  {
    key: 'SEVERE_ABDOMINAL_PAIN',
    titleBn: 'পেটে তীব্র ও একটানা অসহ্য যন্ত্রণা',
    descriptionBn:
      'স্বাভাবিক লেবার পেইন ছাড়াও পেট পাথরের মতো শক্ত হয়ে যাওয়া।',
  },
  {
    key: 'HIGH_FEVER_CHILLS',
    titleBn: 'তীব্র জ্বর ও কাঁপুনি (১০১°F+)',
    descriptionBn:
      'জরায়ু বা ইউরিনারি ইনফেকশনের লক্ষণ যা দ্রুত অ্যান্টিবায়োটিক চিকিৎসা দাবি করে।',
  },
];

export const DEFAULT_HOSPITAL_BAG_ITEMS: HospitalBagItem[] = [
  {
    id: 'hb_1',
    category: 'MEDICAL_DOCS',
    titleBn: 'সকল আল্ট্রাসাউন্ড (USG) ও ডাক্তারের প্রেসক্রিপশন ফাইল',
    isChecked: true,
  },
  {
    id: 'hb_2',
    category: 'MEDICAL_DOCS',
    titleBn: 'মায়ের এনআইডি (NID) কার্ডের ফটোকপি ও রক্তের গ্রুপ রিপোর্ট',
    isChecked: true,
  },
  {
    id: 'hb_3',
    category: 'MOM_ESSENTIALS',
    titleBn: 'মায়ের ২টি ঢিলেঢালা সুতি গাউন / ম্যাক্সি ও ব্রেস্টফিডিং ব্রা',
    isChecked: false,
  },
  {
    id: 'hb_4',
    category: 'MOM_ESSENTIALS',
    titleBn: 'মেটারনিটি স্যানিটারি প্যাড (Maternity Pads) ও টিস্যু রোল',
    isChecked: false,
  },
  {
    id: 'hb_5',
    category: 'MOM_ESSENTIALS',
    titleBn: 'মায়ের আরামদায়ক স্যান্ডেল, গরম কাপড় / চাদর ও লিপবাম',
    isChecked: false,
  },
  {
    id: 'hb_6',
    category: 'BABY_ESSENTIALS',
    titleBn: 'নবজাতকের ৩-৪ সেট নরম সুতি জামা ও কাঁথা/র‍্যাপার',
    isChecked: false,
  },
  {
    id: 'hb_7',
    category: 'BABY_ESSENTIALS',
    titleBn: 'নবজাতকের ডায়াপার (NB Size), ওয়াইপ্স ও কটন বাড',
    isChecked: false,
  },
  {
    id: 'hb_8',
    category: 'BABY_ESSENTIALS',
    titleBn: 'শিশুর টুপি, মোজা, নরম তোয়ালে ও বেবি ব্ল্যাঙ্কেট',
    isChecked: false,
  },
];
