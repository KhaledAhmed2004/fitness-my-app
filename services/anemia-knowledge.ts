import {
  AnemiaSymptom,
  DemographicGroup,
  IronFoodItem,
} from '@/types/anemia-hemoglobin-shield';

export interface DemographicThreshold {
  group: DemographicGroup;
  labelBn: string;
  normalMin: number;
  mildMin: number;
  moderateMin: number;
  normalRangeTextBn: string;
}

export const DEMOGRAPHIC_THRESHOLDS: DemographicThreshold[] = [
  {
    group: 'MALE',
    labelBn: '👨 প্রাপ্তবয়স্ক পুরুষ (Adult Male)',
    normalMin: 13.0,
    mildMin: 11.0,
    moderateMin: 8.0,
    normalRangeTextBn: '১৩.০ – ১৭.০ g/dL',
  },
  {
    group: 'FEMALE_NON_PREGNANT',
    labelBn: '👩 প্রাপ্তবয়স্ক নারী (Non-Pregnant Female)',
    normalMin: 12.0,
    mildMin: 11.0,
    moderateMin: 8.0,
    normalRangeTextBn: '১২.০ – ১৫.৫ g/dL',
  },
  {
    group: 'PREGNANT_WOMAN',
    labelBn: '🤰 গর্ভবতী মা (Pregnant Woman)',
    normalMin: 11.0,
    mildMin: 10.0,
    moderateMin: 7.0,
    normalRangeTextBn: '১১.০ – ১৪.০ g/dL',
  },
  {
    group: 'CHILD',
    labelBn: '👶 শিশু (৬ মাস থেকে ৫ বছর)',
    normalMin: 11.0,
    mildMin: 10.0,
    moderateMin: 7.0,
    normalRangeTextBn: '১১.০ – ১৪.০ g/dL',
  },
];

export const IRON_FOODS_CATALOG: IronFoodItem[] = [
  {
    id: 'food_1',
    nameBn: 'গরু বা খাসির কলিজা (Liver)',
    nameEn: 'Liver (Beef/Mutton)',
    ironMgPer100g: '৯.০ – ১২.০ mg',
    category: 'HEME_ANIMAL',
    categoryLabelBn: '🥩 প্রাণিজ আয়রন (উচ্চ শোষণ)',
    synergyTipBn: 'প্রাণিজ হিম আয়রন (Heme Iron) শরীরে অত্যন্ত সহজে ও দ্রুত শোষিত হয়। সপ্তাহে ১ দিন কলিজা খাওয়া চমৎকার।',
  },
  {
    id: 'food_2',
    nameBn: 'দেশি ছোট মাছ (শিং, মাগুর, মলা-ঢেলা)',
    nameEn: 'Small Freshwater Fish',
    ironMgPer100g: '২.৫ – ৪.৫ mg',
    category: 'HEME_ANIMAL',
    categoryLabelBn: '🥩 প্রাণিজ আয়রন (উচ্চ শোষণ)',
    synergyTipBn: 'ছোট মাছের হাড় ও মাংসে প্রচুর জৈব আয়রন ও প্রোটিন থাকে যা রক্তকণিকা তৈরিতে সাহায্য করে।',
  },
  {
    id: 'food_3',
    nameBn: 'ডিমের কুসুম (Egg Yolk)',
    nameEn: 'Egg Yolk',
    ironMgPer100g: '২.৭ mg',
    category: 'HEME_ANIMAL',
    categoryLabelBn: '🥩 প্রাণিজ আয়রন (উচ্চ শোষণ)',
    synergyTipBn: 'প্রতিদিন সকালে ১টি সম্পূর্ণ ডিম খেলে পর্যাপ্ত আয়রন ও ভিটামিন বি১২ পাওয়া যায়।',
  },
  {
    id: 'food_4',
    nameBn: 'কচুশাক ও লালশাক',
    nameEn: 'Taro Greens & Red Amaranth',
    ironMgPer100g: '১০.০ – ১৫.০ mg',
    category: 'NON_HEME_PLANT',
    categoryLabelBn: '🌿 উদ্ভিজ্জ আয়রন (নন-হিম)',
    synergyTipBn: 'প্রচুর আয়রন থাকে তবে উদ্ভিজ্জ আয়রন শরীরে সহজে ঢুকতে পারে না। তাই শাকের সাথে লেবু চিপে খেলে শোষণ ৩ গুণ বাড়ে!',
  },
  {
    id: 'food_5',
    nameBn: 'কাঁচাকলা, বিট ও কাঁচা পেঁপে',
    nameEn: 'Raw Banana, Beetroot & Papaya',
    ironMgPer100g: '১.৮ – ৩.০ mg',
    category: 'NON_HEME_PLANT',
    categoryLabelBn: '🌿 উদ্ভিজ্জ আয়রন (নন-হিম)',
    synergyTipBn: 'কাঁচাকলার ঝোল ও বিটের রস রক্তস্বল্পতায় অত্যন্ত কার্যকরী।',
  },
  {
    id: 'food_6',
    nameBn: 'ডালিম, খেজুর ও কালো কিশমিশ',
    nameEn: 'Pomegranate, Dates & Black Raisins',
    ironMgPer100g: '১.৫ – ২.৬ mg',
    category: 'NON_HEME_PLANT',
    categoryLabelBn: '🌿 উদ্ভিজ্জ আয়রন (নন-হিম)',
    synergyTipBn: 'রাতে পানিতে ভিজিয়ে সকালে কিশমিশ ও খেজুর খেলে হিমোগ্লোবিনের মাত্রা দ্রুত উন্নত হয়।',
  },
  {
    id: 'food_7',
    nameBn: '🍋 তাজা লেবুর রস, আমলকী ও পেয়ারা',
    nameEn: 'Lemon, Amla & Guava (Vitamin C)',
    category: 'ABSORPTION_BOOSTER',
    categoryLabelBn: '⚡ শোষণ বুস্টার (ভিটামিন-সি)',
    synergyTipBn: 'ভিটামিন-সি নন-হিম উদ্ভিজ্জ আয়রনকে দ্রবণীয় অবস্থায় রূপান্তর করে ক্ষুদ্রান্ত্রে শোষণ বহু গুণ বাড়িয়ে দেয়।',
  },
  {
    id: 'food_8',
    nameBn: '🚫 লাল চা, কফি, দুধ ও অ্যান্টাসিড',
    nameEn: 'Tea, Coffee, Milk, Antacids (Blockers)',
    category: 'ABSORPTION_BLOCKER',
    categoryLabelBn: '⚠️ শোষণ বাধা প্রদানকারী',
    synergyTipBn: 'চা-কফির ট্যানিন এবং দুধের ক্যালসিয়াম আয়রনের সাথে যুক্ত হয়ে শোষণ আটকে দেয়। আয়রন খাওয়ার ২ ঘণ্টার মধ্যে এগুলো পরিহার করুন।',
  },
];

export const ANEMIA_SYMPTOMS_LIST: AnemiaSymptom[] = [
  {
    id: 'sym_fatigue',
    nameBn: 'চরম ক্লান্তি ও দুর্বলতা',
    descriptionBn: 'পর্যাপ্ত ঘুমের পরেও শরীর নিস্তেজ ও অবসাদগ্রস্ত লাগা।',
    isSevereRedFlag: false,
  },
  {
    id: 'sym_palpitations',
    nameBn: 'সিঁড়ি ভাঙলে বা হাঁটলে বুক ধড়ফড় করা',
    descriptionBn: 'হৃৎপিণ্ড দ্রুত পাম্প করার কারণে বুকে অস্বাভাবিক স্পন্দন হওয়া।',
    isSevereRedFlag: false,
  },
  {
    id: 'sym_breathless',
    nameBn: 'অল্প পরিশ্রমে শ্বাসকষ্ট হওয়া',
    descriptionBn: 'রক্তে অক্সিজেন পরিবহনের ঘাটতির কারণে হাঁপিয়ে যাওয়া।',
    isSevereRedFlag: true,
  },
  {
    id: 'sym_pallor',
    nameBn: 'চোখের নিচের পাতা, ঠোঁট ও জিহ্বা ফ্যাকাশে সাদাটে',
    descriptionBn: 'হিমোগ্লোবিনের লাল রঞ্জক পদার্থ কমে রক্তহীন ফ্যাকাসে বর্ণ ধারণ করা।',
    isSevereRedFlag: false,
  },
  {
    id: 'sym_koilonychia',
    nameBn: 'নখ পাতলা ও চামচের মতো গর্ত হয়ে যাওয়া (Koilonychia)',
    descriptionBn: 'দীর্ঘমেয়াদী তীব্র আয়রন ঘাটতির প্রত্যক্ষ শারীরিক লক্ষণ।',
    isSevereRedFlag: true,
  },
];
