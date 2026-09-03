import {
  CalciumD3Item,
  KneeExerciseItem,
} from '@/types/osteoporosis-joint-shield';

export const KNEE_EXERCISES_CATALOG: KneeExerciseItem[] = [
  {
    id: 'ex_quad_raise',
    nameBn: 'চেয়ারে বসে পা সোজা করা (Seated Leg Raise)',
    targetMuscleBn: 'কোয়াড্রিসেপ্স পেশি (Quadriceps)',
    repsBn: 'প্রতি পায়ে ১০ বার করে দিনে ২ বার (৫ সেকেন্ড ধরে রাখুন)',
    instructionBn:
      'একটি আরামদায়ক চেয়ারে সোজা হয়ে বসুন। ধীরে ধীরে এক পা সোজা করে মেঝে থেকে ওপরে তুলুন এবং পায়ের পাতা নিজের দিকে টানুন। ৫ সেকেন্ড ধরে রেখে আস্তে আস্তে নামান।',
    precautionsBn: 'কোমরে অতিরিক্ত চাপ দেবেন না। হাঁটুতে তীব্র ব্যথা অনুভব হলে আরও নিচু করে রাখুন।',
  },
  {
    id: 'ex_isometric_press',
    nameBn: 'তোয়ালে চেপে আইসোমেট্রিক প্রেশার (Isometric Press)',
    targetMuscleBn: 'হাঁটুর চারপাশের সাপোর্টিং লিগামেন্ট',
    repsBn: '১০ বার করে দিনে ২ বার (৫-৮ সেকেন্ড চাপ দিয়ে ধরে রাখুন)',
    instructionBn:
      'বিছানায় সোজা হয়ে পা মেলে বসুন। হাঁটুর ঠিক নিচে একটি পাতলা তোয়ালে গোল করে রাখুন। এবার হাঁটু দিয়ে তোয়ালেটির ওপর নিচের দিকে চাপ দিন।',
    precautionsBn: 'হাঁটু ভাজ না করে শুধুমাত্র ওপরের উরুর পেশি শক্ত করে চাপ প্রয়োগ করুন।',
  },
  {
    id: 'ex_ankle_pump',
    nameBn: 'গোড়ালি ওঠানামা ও রক্ত সঞ্চালন (Ankle Pumps)',
    targetMuscleBn: 'কাফ মাসল ও পায়ের পাতা',
    repsBn: '১৫-২০ বার (বসে বা শুয়ে যেকোনো সময়)',
    instructionBn:
      'পায়ের পাতা একবার সামনের দিকে এবং একবার নিজের বুকের দিকে টানুন। এটি হাঁটুর জয়েন্টে সাইনোভিয়াল তরল চলাচল সচল রাখে।',
    precautionsBn: 'ধীরেসুস্থে করুন, কোনো ঝাঁকুনি দেবেন না।',
  },
  {
    id: 'ex_pillow_squeeze',
    nameBn: 'দুই হাঁটুর মাঝে বালিশ চেপে ধরা (Pillow Squeeze)',
    targetMuscleBn: 'উরুর ভেতরের পেশি (Adductors)',
    repsBn: '১০ বার (৫ সেকেন্ড ধরে রাখুন)',
    instructionBn:
      'চেয়ারে বসে দুই হাঁটুর মাঝে একটি নরম কুশন বা বালিশ রাখুন। এবার দুই হাঁটু দিয়ে বালিশটি জোরে চাপ দিয়ে ৫ সেকেন্ড ধরে রেখে ছেড়ে দিন।',
    precautionsBn: 'জয়েন্ট সোজা রাখুন এবং পিঠ সোজা রাখুন।',
  },
];

export const CALCIUM_D3_CATALOG: CalciumD3Item[] = [
  {
    id: 'cal_sunlight',
    nameBn: '☀️ সকালের মিষ্টি রোদ (প্রাকৃতিক ভিটামিন D3)',
    sourceCategory: 'SUNLIGHT_D3',
    categoryLabelBn: '☀️ ভিটামিন ডি৩ সংশ্লেষণ',
    benefitBn:
      'সপ্তাহে অন্তত ৩-৪ দিন সকাল ১০টা থেকে দুপুর ১২টার রোদে হাত-পা খোলা রেখে ১৫-২০ মিনিট থাকুন। রোদ ছাড়া শরীরের হাড় ক্যালসিয়াম শোষণ করতে পারে না।',
  },
  {
    id: 'cal_small_fish',
    nameBn: '🐟 দেশি ছোট মাছের নরম কাঁটা (মলা, ঢেলা, কাচকি)',
    calciumMgPerServing: '৩৫০ – ৫৫০ mg / ১০০ গ্রাম',
    sourceCategory: 'SMALL_FISH',
    categoryLabelBn: '🐟 প্রাকৃতিক হাড়ের খনিজ',
    benefitBn:
      'ছোট মাছের কাঁটা চিবিয়ে খেলে হাড়ের মূল উপাদান জৈব ক্যালসিয়াম ও ফসফরাস সরাসরি পাওয়া যায়।',
  },
  {
    id: 'cal_sesame',
    nameBn: '🌱 সাদা ও কালো তিল এবং তিলের নাড়ু',
    calciumMgPerServing: '৯৭৫ mg / ১০০ গ্রাম (অত্যন্ত উচ্চ)',
    sourceCategory: 'PLANT_SEEDS',
    categoryLabelBn: '🌱 উদ্ভিজ্জ ক্যালসিয়ামের খনি',
    benefitBn:
      '১ চামচ ভাজা তিলে এক গ্লাস দুধের চেয়েও বেশি ক্যালসিয়াম থাকে। মেনোপজ পরবর্তী মায়েদের জন্য মহৌষধ।',
  },
  {
    id: 'cal_curd_milk',
    nameBn: '🥛 টক দই, খাঁটি ছানা ও দুধ',
    calciumMgPerServing: '২৫০ – ৩০০ mg / কাপ',
    sourceCategory: 'DAIRY',
    categoryLabelBn: '🥛 সহজলভ্য দুগ্ধজাত ক্যালসিয়াম',
    benefitBn:
      'টক দইয়ের প্রোবায়োটিক অন্ত্রের স্বাস্থ্য ভালো রেখে ক্যালসিয়াম শোষণ নিশ্চিত করে। গ্যাস্ট্রিক থাকলে দুধের বদলে টক দই বা ছানা খান।',
  },
  {
    id: 'cal_moringa',
    nameBn: '🌿 সজনে পাতা ও সজনে ডাঁটার ঝোল',
    calciumMgPerServing: '৪৪০ mg / ১০০ গ্রাম',
    sourceCategory: 'PLANT_SEEDS',
    categoryLabelBn: '🌿 দেশি সুপারফুড',
    benefitBn:
      'প্রচুর ক্যালসিয়াম, ম্যাগনেসিয়াম ও অ্যান্টিঅক্সিডেন্ট রয়েছে যা জয়েন্টের ক্ষয়রোধ ও প্রদাহ কমায়।',
  },
];
