import { TravelDestinationCountry } from '@/types/travel-health-dossier';

export const TRAVEL_DESTINATIONS: TravelDestinationCountry[] = [
  {
    code: 'SA',
    nameEn: 'Saudi Arabia (Hajj & Umrah)',
    nameBn: 'সৌদি আরব (হজ্ব ও ওমরাহ)',
    flagEmoji: '🇸🇦',
    hasSpecialHajjRules: true,
    requiredVaccines: ['MENINGITIS_ACWY', 'FLU', 'COVID'],
    customsMaxSupplyDays: 90,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'সৌদি স্বাস্থ্য মন্ত্রণালয় অনুযায়ী মেনিনজাইটিস (Meningococcal ACWY) টিকা বাধ্যতামূলক। সকল ওষুধের জেনেরিক নাম ও ডাক্তারের সিলযুক্ত প্রেসক্রিপশন সাথে রাখা আবশ্যক।',
  },
  {
    code: 'IN',
    nameEn: 'India (Medical Tourism & Visit)',
    nameBn: 'ভারত (মেডিকেল ট্যুরিজম ও ভ্রমণ)',
    flagEmoji: '🇮🇳',
    requiredVaccines: ['COVID', 'FLU'],
    customsMaxSupplyDays: 90,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: false,
    specialCustomsNoteBn:
      'চেন্নাই, ভেলোর, কলকাতা বা দিল্লীতে চিকিৎসার জন্য ৩০ দিনের বেশি ওষুধ নিলে চিকিৎসকের বিএমডিসি (BMDC) রেজিস্ট্রেশনযুক্ত প্রত্যয়নপত্র কাস্টমসে দেখাতে হবে।',
  },
  {
    code: 'TH',
    nameEn: 'Thailand (Bangkok Medical & Tour)',
    nameBn: 'থাইল্যান্ড (ব্যাংকক চিকিৎসা ও ভ্রমণ)',
    flagEmoji: '🇹🇭',
    requiredVaccines: ['COVID'],
    customsMaxSupplyDays: 30,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'থাই কাস্টমস সাইকোট্রপিক ও ঘুমের ওষুধের (যেমন ক্লোনাজিপাম) বিষয়ে কঠোর। সর্বোচ্চ ৩০ দিনের সরবরাহ এবং ডাক্তারের সুনির্দিষ্ট ডোজ সার্টিফিকেট প্রয়োজন।',
  },
  {
    code: 'SG',
    nameEn: 'Singapore',
    nameBn: 'সিঙ্গাপুর (চিকিৎসা ও ভ্রমণ)',
    flagEmoji: '🇸🇬',
    requiredVaccines: ['COVID', 'YELLOW_FEVER'],
    customsMaxSupplyDays: 90,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'সিঙ্গাপুর হেলথ সায়েন্সেস অথরিটি (HSA) অনুমোদনের জন্য প্রেসক্রিপশনে আন্তর্জাতিক জেনেরিক নাম (INN) থাকা বাধ্যতামূলক।',
  },
  {
    code: 'MY',
    nameEn: 'Malaysia',
    nameBn: 'মালয়েশিয়া',
    flagEmoji: '🇲🇾',
    requiredVaccines: ['COVID'],
    customsMaxSupplyDays: 60,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'ব্যক্তিগত ব্যবহারের জন্য ৬০ দিনের ওষুধ অনুমোদিত। ইনসুলিন ও সিরিঞ্জ হ্যান্ড ব্যাগেজের জন্য সিকিউরিটি লেটার সাথে রাখুন।',
  },
  {
    code: 'US',
    nameEn: 'USA (TSA & Customs)',
    nameBn: 'যুক্তরাষ্ট্র (USA)',
    flagEmoji: '🇺🇸',
    requiredVaccines: ['COVID'],
    customsMaxSupplyDays: 90,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'ইউএস কাস্টমস (CBP) ও TSA অনুযায়ী মূল প্যাকেজিংয়ে ওষুধ বহন করতে হবে এবং ডাক্তারের ইংরেজিতে লিখিত মেডিকেল ডসিয়ার থাকতে হবে।',
  },
  {
    code: 'GB',
    nameEn: 'United Kingdom (UK Border Force)',
    nameBn: 'যুক্তরাজ্য (UK)',
    flagEmoji: '🇬🇧',
    requiredVaccines: ['COVID'],
    customsMaxSupplyDays: 90,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'যুক্তরাজ্য বর্ডার ফোর্সের জন্য নিয়ন্ত্রিত ওষুধের (Controlled Drugs) লাইসেন্সিং ও ডাক্তারের অনুমোদিত প্রেসক্রিপশন বাধ্যতামূলক।',
  },
  {
    code: 'GLOBAL',
    nameEn: 'Other International Destination',
    nameBn: 'অন্যান্য আন্তর্জাতিক গন্তব্য',
    flagEmoji: '🌍',
    requiredVaccines: ['COVID', 'FLU'],
    customsMaxSupplyDays: 60,
    controlledSubstanceLetterRequired: true,
    sharpsCoolerLetterRequired: true,
    specialCustomsNoteBn:
      'আন্তর্জাতিক এয়ারলাইন্স ও কাস্টমসের জন্য WHO স্ট্যান্ডার্ড মেডিকেল ডসিয়ার ও প্রেসক্রিপশন সাথে রাখুন।',
  },
];

export const CONTROLLED_DRUG_KEYWORDS = [
  'clonazepam',
  'diazepam',
  'lorazepam',
  'alprazolam',
  'bromazepam',
  'zolpidem',
  'tramadol',
  'morphine',
  'codeine',
  'pregabalin',
  'gabapentin',
  'methylphenidate',
  'midazolam',
];

export const INJECTABLE_INSULIN_KEYWORDS = [
  'insulin',
  'lantus',
  'mixtard',
  'novomix',
  'humalog',
  'apidra',
  'tresiba',
  'toujeo',
  'victoza',
  'ozempic',
  'saxenda',
  'enoxaparin',
  'clexane',
  'heparin',
];
