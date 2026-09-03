import {
  DiabeticSuperfoodItem,
  RamadanDiabeticMenuPreset,
} from '@/types/diabetic-meal-planner';

export const DIABETIC_SUPERFOODS: DiabeticSuperfoodItem[] = [
  {
    id: 'super_karela',
    nameBn: 'তিতা করলার তাজা জুস',
    nameEn: 'Bitter Gourd (Karela) Juice',
    giValue: 15,
    bestTimeBn: 'সকালে খালি পেটে (ব্রেকফাস্টের ৩০ মিনিট আগে)',
    preparationRecipeBn: '১টি মাঝারি করলা ব্লেন্ড করে ছেঁকে আধা কাপ পানিতে সামান্য লেবুর রস মিশিয়ে পান করুন।',
    clinicalBenefitBn: 'করলায় রয়েছে চ্যারান্টিন (Charantin) ও পলিপেপটাইড-পি যা প্রাকৃতিক ইনসুলিনের মতো রক্তে শর্করা কমায়।',
    iconName: 'eco',
  },
  {
    id: 'super_fenugreek',
    nameBn: 'মেথি ভেজানো পানি',
    nameEn: 'Fenugreek (Methi) Infusion',
    giValue: 0,
    bestTimeBn: 'রাতে ভিজিয়ে রেখে সকালে খালি পেটে',
    preparationRecipeBn: '১ চা চামচ মেথি দানা ১ গ্লাস পানিতে সারা রাত ভিজিয়ে রেখে সকালে পানি ছেঁকে পান করুন ও মেথি চিবিয়ে খান।',
    clinicalBenefitBn: 'মেথির দ্রবণীয় ফাইবার কার্বোহাইড্রেট শোষণকে ধীর করে এবং ইনসুলিন সংবেদনশীলতা নাটকীয়ভাবে বৃদ্ধি করে।',
    iconName: 'water-drop',
  },
  {
    id: 'super_cinnamon',
    nameBn: 'দারুচিনির লিকার চা',
    nameEn: 'Ceylon Cinnamon Tea',
    giValue: 5,
    bestTimeBn: 'বিকেলে অথবা ভারী খাবারের ৩০ মিনিট পর',
    preparationRecipeBn: '১ টুকরো আসল সিলন দারুচিনি ফুটন্ত পানিতে ৫ মিনিট ফুটিয়ে গরম গরম পান করুন (চিনি ছাড়া)।',
    clinicalBenefitBn: 'দারুচিনি ইনসুলিন রিসেপ্টরকে সক্রিয় করে এবং খাবারের পর আকস্মিক সুগার স্পাইক ৩০% পর্যন্ত কমায়।',
    iconName: 'emoji-food-beverage',
  },
  {
    id: 'super_drumstick_leaves',
    nameBn: 'সজনে পাতার গুঁড়ো বা স্যুপ',
    nameEn: 'Moringa (Sojne Pata) Leaves',
    giValue: 15,
    bestTimeBn: 'দুপুরের ভাতের প্রথম লোকমায় বা স্যুপ হিসেবে',
    preparationRecipeBn: 'তাজা সজনে পাতা সামান্য রসুনে সাঁতলে বা শুকনা পাতার ১ চা চামচ গুঁড়ো হালকা কুসুম গরম পানিতে মিশিয়ে।',
    clinicalBenefitBn: 'ক্লোরোজেনিক অ্যাসিড সমৃদ্ধ যা কোষে গ্লুকোজ প্রবেশে সহায়তা করে এবং কোলেস্টেরল কমায়।',
    iconName: 'grass',
  },
];

export const RAMADAN_DIABETIC_PRESETS: RamadanDiabeticMenuPreset[] = [
  {
    id: 'ramadan_iftar_balanced',
    type: 'IFTAR',
    titleBn: 'ডায়াবেটিক ব্যালান্সড ইফতার মেনু',
    subtitleBn: 'সুগার স্পাইক ছাড়া পেট ভরা ও দীর্ঘক্ষণ এনার্জি',
    itemsBn: [
      '১টি সাধারণ তাজা খেজুর (বেশি মিষ্টি শুকনো খেজুর পরিহার করুন)',
      '১ গ্লাস লেবু ও পুদিনা পাতার চিনিছাড়া শরবত বা ১ কাপ ডাবের পানি',
      '১ বাটি সেদ্ধ ছোলা ও শসা-টমেটো-লেবুর তেলছাড়া সালাদ (১০০ গ্রাম)',
      '১টি সেদ্ধ ডিম বা গ্রিলড মুরগির টুকরো (প্রোটিন ফাস্ট লোড)',
    ],
    totalCalories: 340,
    estimatedGi: 'LOW',
    hydrationTipBn: 'ইফতার থেকে তারাবি পর্যন্ত প্রতি ঘন্টায় ১ গ্লাস করে পানি পান করুন (মোট ৮–১০ গ্লাস)।',
    insulinOrMedsWarningBn: 'ইফতারের আগে সুগার ৪.০ mmol/L এর নিচে থাকলে অবিলম্বে রোজা ভেঙে গ্লুকোজ নেওয়া আবশ্যক।',
  },
  {
    id: 'ramadan_sehri_sustained',
    type: 'SEHRI',
    titleBn: 'স্লো-রিলিজ সেহরি কম্বো',
    subtitleBn: 'দিনভর তৃষ্ণা ও হাইপোগ্লাইসেমিয়া মুক্ত থাকার ডায়েট',
    itemsBn: [
      '১-২টি হাতে বানানো লাল আটার আস্ত রুটি (কিংবা ১ কাপ লাল চালের ভাত)',
      '১ বাটি ঘন মুগ বা মসুর ডাল ও এক টুকরো রুই/শিং মাছের পাতলা ঝোল',
      '১ বাটি লাউ/পেঁপে/ঝিঙে বা শাপলা সবজি তরকারি',
      '১ কাপ ঘরে পাতা টক দই বা আধা কাপ ফ্যাট-ফ্রি দুধ ও ১ চা চামচ চিয়া সিড',
    ],
    totalCalories: 450,
    estimatedGi: 'LOW',
    hydrationTipBn: 'সেহরিতে অতিরিক্ত লবণাক্ত বা ভাজাভুজি এড়িয়ে চলুন যেন দিনে তীব্র তৃষ্ণা না লাগে।',
    insulinOrMedsWarningBn: 'সেহরির ওষুধের ডোজ ডাক্তারের সাথে আগেই সমন্বয় (Dose Reduction) করে নিন।',
  },
];

export const BLOOD_SUGAR_TARGETS_ADA = {
  FASTING: {
    normalMax: 5.6, // mmol/L (< 100 mg/dL)
    targetMax: 7.0, // For diabetics target (70-130 mg/dL => 3.9-7.2 mmol/L)
    elevatedMax: 10.0,
  },
  POST_MEAL_2H: {
    normalMax: 7.8, // mmol/L (< 140 mg/dL)
    targetMax: 10.0, // For diabetics target (< 180 mg/dL)
    elevatedMax: 13.9,
  },
  BEDTIME: {
    normalMax: 6.7,
    targetMax: 8.3,
    elevatedMax: 11.1,
  },
};
