import {
  AhaBpCategory,
  DashFoodItem,
  StrokeFastStepDef,
} from '@/types/hypertension-heart-shield';

export interface AhaCategoryDef {
  category: AhaBpCategory;
  labelBn: string;
  labelEn: string;
  color: string;
  badgeBg: string;
  systolicRangeBn: string;
  diastolicRangeBn: string;
  clinicalAdviceBn: string;
  isEmergency: boolean;
}

export const AHA_BP_CATEGORIES: Record<AhaBpCategory, AhaCategoryDef> = {
  NORMAL: {
    category: 'NORMAL',
    labelBn: '🟢 স্বাভাবিক রক্তচাপ (Normal BP)',
    labelEn: 'Normal Blood Pressure',
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    systolicRangeBn: '< ১২০ mmHg',
    diastolicRangeBn: '< ৮০ mmHg',
    clinicalAdviceBn:
      'আপনার রক্তচাপ চমৎকার ও স্বাস্থ্যকর সীমার মধ্যে রয়েছে। স্বাস্থ্যকর খাদ্যাভ্যাস ও নিয়মিত শারীরিক সক্রিয়তা বজায় রাখুন।',
    isEmergency: false,
  },
  ELEVATED: {
    category: 'ELEVATED',
    labelBn: '🟡 সামান্য বৃদ্ধি (Elevated BP)',
    labelEn: 'Elevated Blood Pressure',
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    systolicRangeBn: '১২০–১২৯ mmHg',
    diastolicRangeBn: '< ৮০ mmHg',
    clinicalAdviceBn:
      'রক্তচাপ সামান্য বাড়ছে। এখনই খাবারে কাঁচা লবণ বর্জন করুন, ওজন নিয়ন্ত্রণে রাখুন এবং নিয়মিত হাঁটা শুরু করুন।',
    isEmergency: false,
  },
  STAGE_1: {
    category: 'STAGE_1',
    labelBn: '🟠 উচ্চ রক্তচাপ স্টেজ-১ (Hypertension Stage 1)',
    labelEn: 'Hypertension Stage 1',
    color: '#FB923C',
    badgeBg: 'rgba(251, 146, 60, 0.15)',
    systolicRangeBn: '১৩০–১৩৯ mmHg',
    diastolicRangeBn: '৮০–৮৯ mmHg',
    clinicalAdviceBn:
      'আপনি স্টেজ-১ উচ্চ রক্তচাপে আছেন। ডাক্তারের পরামর্শ নিন, DASH ডায়েট মেনে চলুন এবং নিয়মিত প্রেশার রেকর্ড করুন।',
    isEmergency: false,
  },
  STAGE_2: {
    category: 'STAGE_2',
    labelBn: '🔴 উচ্চ রক্তচাপ স্টেজ-২ (Hypertension Stage 2)',
    labelEn: 'Hypertension Stage 2',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    systolicRangeBn: '১৪০+ mmHg',
    diastolicRangeBn: '৯০+ mmHg',
    clinicalAdviceBn:
      'উচ্চ রক্তচাপ স্টেজ-২। অবিলম্বে ডাক্তারের পরামর্শ অনুযায়ী রক্তচাপের ওষুধ শুরু/এডজাস্ট করা আবশ্যক। ওষুধ কখনোই বাদ দেবেন না।',
    isEmergency: false,
  },
  HYPERTENSIVE_CRISIS: {
    category: 'HYPERTENSIVE_CRISIS',
    labelBn: '🚨 অতি ঝুঁকিপূর্ণ ক্রাইসিস (Hypertensive Crisis)',
    labelEn: 'Hypertensive Crisis (Emergency)',
    color: '#991B1B',
    badgeBg: 'rgba(153, 27, 27, 0.25)',
    systolicRangeBn: '> ১৮০ mmHg',
    diastolicRangeBn: '> ১২০ mmHg',
    clinicalAdviceBn:
      '🚨 জরুরি সতর্কবার্তা: রক্তচাপ বিপজ্জনক মাত্রায় পৌঁছেছে! ৫ মিনিট বিশ্রাম নিয়ে পুনরায় মাপুন। মান অপরিবর্তিত থাকলে বা মাথাব্যথা/বুকব্যথা থাকলে অবিলম্বে হাসপাতালের জরুরি বিভাগে যান বা ৯৯৯ এ কল করুন।',
    isEmergency: true,
  },
};

export const DASH_DIET_CATALOG: DashFoodItem[] = [
  {
    id: 'dash_1',
    nameBn: 'কচি ডাবের পানি',
    nameEn: 'Green Coconut Water',
    category: 'POTASSIUM_RICH',
    categoryLabelBn: 'পটাশিয়াম সমৃদ্ধ (Potassium Booster)',
    isRecommended: true,
    benefitsBn:
      'প্রচুর প্রাকৃতিক পটাশিয়াম শরীর থেকে অতিরিক্ত সোডিয়াম বের করে রক্তনালী শিথিল রাখতে সাহায্য করে।',
    servingAdviceBn: 'সপ্তাহে ৩-৪ দিন সকালে বা বিকেলে ১ গ্লাস পান করুন। (কিডনি রোগী ছাড়া)',
  },
  {
    id: 'dash_2',
    nameBn: 'কাঁচা রসুন (অ্যালিসিন সমৃদ্ধ)',
    nameEn: 'Raw Garlic (Allicin)',
    category: 'GARLIC_ALLICIN',
    categoryLabelBn: 'রক্তনালী শিথিলকারী (Vasodilator)',
    isRecommended: true,
    benefitsBn:
      'রসুনের Allicin উপাদান রক্তনালীর পেশিকে প্রসারিত করে এবং সিস্টোলিক প্রেশার ৭-৮ mmHg কমাতে সাহায্য করে।',
    servingAdviceBn: 'প্রতিদিন সকালে খালি পেটে ১-২ কোয়া রসুন চিবিয়ে বা কুচি করে পানি দিয়ে গিলে ফেলুন।',
  },
  {
    id: 'dash_3',
    nameBn: 'পাকা কলা ও কাঁচাকলা',
    nameEn: 'Bananas & Green Plantain',
    category: 'POTASSIUM_RICH',
    categoryLabelBn: 'পটাশিয়াম ও ফাইবার সমৃদ্ধ',
    isRecommended: true,
    benefitsBn: 'প্রতিটি কলায় প্রায় ৪৫০ মিলিগ্রাম পটাশিয়াম থাকে যা রক্তচাপের ভারসাম্য বজায় রাখে।',
    servingAdviceBn: 'দৈনিক ১টি পাকা কলা বা তরকারিতে কাঁচাকলা রাখুন।',
  },
  {
    id: 'dash_4',
    nameBn: 'টক দই (প্রোবায়োটিক)',
    nameEn: 'Plain Sour Curd / Yogurt',
    category: 'MAGNESIUM_RICH',
    categoryLabelBn: 'ম্যাগনেশিয়াম ও ক্যালসিয়াম',
    isRecommended: true,
    benefitsBn: 'ক্যালসিয়াম ও ম্যাগনেশিয়াম রক্তনালীর সংকোচন রোধ করে এবং কোলেস্টেরল কমায়।',
    servingAdviceBn: 'দুপুরের খাবারের সাথে আধা কাপ মিষ্টিহীন ঘরে পাতা টক দই খান।',
  },
  {
    id: 'dash_5',
    nameBn: 'তেঁতুলের পাতলা শরবত (লবণহীন)',
    nameEn: 'Tamarind Water (Salt-Free)',
    category: 'POTASSIUM_RICH',
    categoryLabelBn: 'প্রাকৃতিক ভাসোডিলেটর',
    isRecommended: true,
    benefitsBn: 'তেঁতুলের ফ্ল্যাভোনয়েড ও পটাশিয়াম তাৎক্ষণিক হালকা ভাসোডিলেশনে সাহায্য করে।',
    servingAdviceBn: 'লবণ বা চিনি ছাড়া হালকা গরম পানিতে তেঁতুল গুলিয়ে পান করুন।',
  },
  {
    id: 'dash_6',
    nameBn: 'শুকনা শুঁটকি ও নোনা ইলিশ',
    nameEn: 'Dried Fish (Shutki) & Salted Hilsa',
    category: 'HIGH_SODIUM_AVOID',
    categoryLabelBn: 'চরম বিপজ্জনক সোডিয়াম (High Sodium Danger)',
    isRecommended: false,
    benefitsBn: 'শুঁটকি সংরক্ষণে প্রচুর লবণ ব্যবহার করা হয়। এটি রক্তচাপ মারাত্মকভাবে স্পাইক করায়।',
    servingAdviceBn: 'উচ্চ রক্তচাপের রোগীদের জন্য সম্পূর্ণ নিষিদ্ধ।',
  },
  {
    id: 'dash_7',
    nameBn: 'কাঁচা খাওয়ার টেবিল লবণ (Raw Table Salt)',
    nameEn: 'Raw Table Salt',
    category: 'HIGH_SODIUM_AVOID',
    categoryLabelBn: 'লবণ বর্জন রুল (Sodium Reducer)',
    isRecommended: false,
    benefitsBn: '১ চা চামচ কাঁচা লবণে ২,৩০০ মিগ্রা সোডিয়াম থাকে যা স্ট্রোকের ঝুঁকি বহুগুণ বাড়িয়ে দেয়।',
    servingAdviceBn: 'ভাতে বা সালাদে ওপর থেকে কোনো কাঁচা লবণ ছিটাবেন না।',
  },
  {
    id: 'dash_8',
    nameBn: 'টেস্টিং সল্ট (MSG), চিপস ও আচার',
    nameEn: 'MSG / Tasting Salt & Pickles',
    category: 'HIGH_SODIUM_AVOID',
    categoryLabelBn: 'লুকানো সোডিয়াম বোমা (Hidden Sodium Bomb)',
    isRecommended: false,
    benefitsBn: 'প্রক্রিয়াজাত খাবারে অত্যধিক সোডিয়াম রক্তনালীতে পানির চাপ বৃদ্ধি করে।',
    servingAdviceBn: 'আচার ও টেস্টিং সল্ট পরিহার করুন।',
  },
];

export const STROKE_FAST_STEPS: StrokeFastStepDef[] = [
  {
    key: 'FACE',
    stepLetter: 'F',
    titleBn: 'Face (মুখমণ্ডল পরীক্ষা)',
    testInstructionBn: 'রোগীকে হাসতে বা দাঁত দেখাতে বলুন।',
    warningSignBn: 'মুখের একপাশ ঝুলে গেছে বা অসমান মনে হচ্ছে কিনা দেখুন।',
    iconName: 'sentiment-very-dissatisfied',
  },
  {
    key: 'ARM',
    stepLetter: 'A',
    titleBn: 'Arm (হাতের শক্তি পরীক্ষা)',
    testInstructionBn: 'রোগীকে দুই হাত সমানভাবে ওপরে তুলতে বলুন।',
    warningSignBn: 'এক হাত নিচে নেমে যাচ্ছে বা অবশ হয়ে দুর্বল লাগছে কিনা খেয়াল করুন।',
    iconName: 'pan-tool',
  },
  {
    key: 'SPEECH',
    stepLetter: 'S',
    titleBn: 'Speech (কথা জড়িয়ে যাওয়া)',
    testInstructionBn: 'একটি সহজ বাক্য (যেমন: "আজকের দিনটি সুন্দর") বলতে বলুন।',
    warningSignBn: 'কথা জড়িয়ে যাচ্ছে, অস্পষ্ট শোনাচ্ছে বা শব্দ মনে করতে পারছে না।',
    iconName: 'record-voice-over',
  },
  {
    key: 'TIME',
    stepLetter: 'T',
    titleBn: 'Time (তৎক্ষণাৎ হাসপাতালে নেওয়া)',
    testInstructionBn: 'যেকোনো একটি লক্ষণ দেখা দিলেই ১ সেকেন্ডও দেরি করবেন না।',
    warningSignBn: 'স্ট্রোকের গোল্ডেন আওয়ার (৩-৪.৫ ঘণ্টা)। দ্রুত ৯৯৯ এ কল করুন বা নিকটস্থ স্ট্রোক ইউনিটে নিন।',
    iconName: 'emergency',
  },
];
