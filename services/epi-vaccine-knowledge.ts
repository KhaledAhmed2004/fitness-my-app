export interface EpiMilestone {
  id: string;
  milestoneAgeDays: number;
  milestoneLabelEn: string;
  milestoneLabelBn: string;
  ageCategory: 'CHILD_EPI' | 'ADOLESCENT' | 'ELDERLY_ADULT';
  descriptionBn: string;
  vaccines: {
    code: string;
    nameEn: string;
    nameBn: string;
    diseaseEn: string;
    diseaseBn: string;
    routeBn: string; // e.g. 'বাম বাহুর চামড়ার নিচে (ইন্ট্রাডার্মাল)'
    doseCountText: string;
    criticalNotesBn: string;
  }[];
}

export const BANGLADESH_EPI_CHILD_SCHEDULE: EpiMilestone[] = [
  {
    id: 'epi_birth',
    milestoneAgeDays: 0,
    milestoneLabelEn: 'At Birth (0-14 Days)',
    milestoneLabelBn: 'জন্মের পরপরই (০ দিন)',
    ageCategory: 'CHILD_EPI',
    descriptionBn: 'হাসপাতালে বা বাড়িতে জন্মের সাথে সাথে বা ১৪ দিনের মধ্যে দিতে হবে।',
    vaccines: [
      {
        code: 'BCG',
        nameEn: 'BCG Vaccine',
        nameBn: 'বিসিজি টিকা',
        diseaseEn: 'Tuberculosis (TB)',
        diseaseBn: 'মারাত্মক যক্ষ্মা ও টিবি মেনিনজাইটিস',
        routeBn: 'বাম বাহুর উপরিভাগে চামড়ার ভেতরে (Intradermal)',
        doseCountText: '১টি ডোজ (০.০৫ মিলি)',
        criticalNotesBn: 'টিকার স্থানে ছোট লাল দানা হবে ও পরে হালকা দাগ থাকবে। পুঁজ টিপে ফেলা যাবে না।',
      },
    ],
  },
  {
    id: 'epi_6w',
    milestoneAgeDays: 42,
    milestoneLabelEn: '6 Weeks (1.5 Months)',
    milestoneLabelBn: '৬ সপ্তাহ (দেড় মাস / ৪২ দিন)',
    ageCategory: 'CHILD_EPI',
    descriptionBn: 'শিশুর দেড় মাস পূর্ণ হলে প্রথম ধাপের ৪টি অত্যন্ত গুরুত্বপূর্ণ টিকা।',
    vaccines: [
      {
        code: 'PENTA_1',
        nameEn: 'Pentavalent-1 (DTP-HepB-Hib)',
        nameBn: 'পেন্টাভ্যালেন্ট-১',
        diseaseEn: 'Diphtheria, Tetanus, Pertussis, Hep-B, Hib Meningitis',
        diseaseBn: 'ডিপথেরিয়া, ধনুষ্টংকার, হুপিংকাশি, হেপাটাইটিস-বি ও হিব নিউমোনিয়া',
        routeBn: 'বাম ঊরুর মাংসপেশিতে (Intramuscular)',
        doseCountText: '১ম ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'টিকার পর হালকা জ্বর ও ব্যথা হতে পারে, প্যারাসিটামল ড্রপ চিকিৎসকের পরামর্শে রাখা যায়।',
      },
      {
        code: 'PCV_1',
        nameEn: 'PCV-1 (Pneumococcal Conjugate)',
        nameBn: 'নিউমোকক্কাল-১ (PCV)',
        diseaseEn: 'Severe Pneumonia & Bacteremia',
        diseaseBn: 'মারাত্মক নিউমোকক্কাল নিউমোনিয়া ও রক্ত সংক্রমণ',
        routeBn: 'ডান ঊরুর মাংসপেশিতে',
        doseCountText: '১ম ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'শ্বাসকষ্ট ও ফুসফুসের প্রদাহ প্রতিরোধ করে।',
      },
      {
        code: 'bOPV_1',
        nameEn: 'bOPV-1 (Oral Polio Vaccine)',
        nameBn: 'ওপিভি-১ (মুখে খাওয়ার পোলিও)',
        diseaseEn: 'Polio (Poliomyelitis Paralysis)',
        diseaseBn: 'পোলিওমাইলাইটিস ও অঙ্গবিকল পক্ষাঘাত',
        routeBn: 'মুখে খাওয়ার ড্রপ (Oral)',
        doseCountText: '২ ফোঁটা',
        criticalNotesBn: 'টিকা খাওয়ানোর সাথে সাথে বমি করলে পুনরায় ২ ফোঁটা খাওয়াতে হবে।',
      },
      {
        code: 'ROTA_1',
        nameEn: 'Rotavirus-1',
        nameBn: 'রোটাভাইরাস-১',
        diseaseEn: 'Severe Rotaviral Diarrhea & Dehydration',
        diseaseBn: 'রোটাভাইরাসজনিত তীব্র ডায়রিয়া ও পানিশূন্যতা',
        routeBn: 'মুখে খাওয়ার সাসপেনশন (Oral)',
        doseCountText: '১ম ডোজ',
        criticalNotesBn: 'শিশুদের মারাত্মক ডায়রিয়ায় হাসপাতালে ভর্তি হওয়া রোধ করে।',
      },
    ],
  },
  {
    id: 'epi_10w',
    milestoneAgeDays: 70,
    milestoneLabelEn: '10 Weeks (2.5 Months)',
    milestoneLabelBn: '১০ সপ্তাহ (আড়াই মাস / ৭০ দিন)',
    ageCategory: 'CHILD_EPI',
    descriptionBn: 'প্রথম ডোজের ২৮ দিন (৪ সপ্তাহ) পর দ্বিতীয় ডোজ গ্রহণ করতে হয়।',
    vaccines: [
      {
        code: 'PENTA_2',
        nameEn: 'Pentavalent-2',
        nameBn: 'পেন্টাভ্যালেন্ট-২',
        diseaseEn: 'Diphtheria, Tetanus, Pertussis, Hep-B, Hib',
        diseaseBn: 'ডিপথেরিয়া, ধনুষ্টংকার, হুপিংকাশি, হেপাটাইটিস-বি ও হিব',
        routeBn: 'বাম ঊরুর মাংসপেশিতে',
        doseCountText: '২য় ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'নিয়মিত ব্যবধান বজায় রাখা অ্যান্টিবডি তৈরিতে জরুরি।',
      },
      {
        code: 'PCV_2',
        nameEn: 'PCV-2 (Pneumococcal)',
        nameBn: 'নিউমোকক্কাল-২ (PCV)',
        diseaseEn: 'Pneumonia',
        diseaseBn: 'নিউমোকক্কাল নিউমোনিয়া',
        routeBn: 'ডান ঊরুর মাংসপেশিতে',
        doseCountText: '২য় ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'ফুসফুস সংক্রমণ প্রতিরোধে প্রতিরোধ ক্ষমতা বৃদ্ধি করে।',
      },
      {
        code: 'bOPV_2',
        nameEn: 'bOPV-2 (Oral Polio)',
        nameBn: 'ওপিভি-২ (পোলিও ড্রপ)',
        diseaseEn: 'Polio',
        diseaseBn: 'পোলিও পক্ষাঘাত',
        routeBn: 'মুখে খাওয়ার ড্রপ',
        doseCountText: '২ ফোঁটা',
        criticalNotesBn: 'মুখে সরাসরি ২ ফোঁটা।',
      },
      {
        code: 'ROTA_2',
        nameEn: 'Rotavirus-2',
        nameBn: 'রোটাভাইরাস-২',
        diseaseEn: 'Rotaviral Diarrhea',
        diseaseBn: 'রোটা ডায়রিয়া প্রতিরোধ',
        routeBn: 'মুখে খাওয়ার সাসপেনশন',
        doseCountText: '২য় ডোজ',
        criticalNotesBn: 'রোটাভাইরাসের কোর্স সম্পূর্ণ করে।',
      },
    ],
  },
  {
    id: 'epi_14w',
    milestoneAgeDays: 98,
    milestoneLabelEn: '14 Weeks (3.5 Months)',
    milestoneLabelBn: '১৪ সপ্তাহ (সাড়ে তিন মাস / ৯৮ দিন)',
    ageCategory: 'CHILD_EPI',
    descriptionBn: 'প্রাথমিক কোর্সের সমাপনী পর্ব ও ইনজেকশন পোলিও ডোজ।',
    vaccines: [
      {
        code: 'PENTA_3',
        nameEn: 'Pentavalent-3',
        nameBn: 'পেন্টাভ্যালেন্ট-৩',
        diseaseEn: 'Diphtheria, Tetanus, Pertussis, Hep-B, Hib',
        diseaseBn: 'ডিপথেরিয়া, ধনুষ্টংকার, হুপিংকাশি, হেপাটাইটিস-বি ও হিব',
        routeBn: 'বাম ঊরুর মাংসপেশিতে',
        doseCountText: '৩য় ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'পেন্টাভ্যালেন্টের প্রাথমিক ৩ ডোজ কোর্স সম্পন্ন হয়।',
      },
      {
        code: 'PCV_3',
        nameEn: 'PCV-3 (Pneumococcal)',
        nameBn: 'নিউমোকক্কাল-৩ (PCV)',
        diseaseEn: 'Pneumonia',
        diseaseBn: 'নিউমোকক্কাল নিউমোনিয়া',
        routeBn: 'ডান ঊরুর মাংসপেশিতে',
        doseCountText: '৩য় ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'নিউমোনিয়ার ৩য় ডোজ সম্পন্ন।',
      },
      {
        code: 'bOPV_3',
        nameEn: 'bOPV-3 (Oral Polio)',
        nameBn: 'ওপিভি-৩ (পোলিও ড্রপ)',
        diseaseEn: 'Polio',
        diseaseBn: 'পোলিও পক্ষাঘাত',
        routeBn: 'মুখে খাওয়ার ড্রপ',
        doseCountText: '২ ফোঁটা',
        criticalNotesBn: 'পোলিও ড্রপ ৩য় ডোজ।',
      },
      {
        code: 'fIPV_1',
        nameEn: 'fIPV-1 (Fractional Inactivated Polio)',
        nameBn: 'এফআইপিভি-১ (ইনজেকশন পোলিও)',
        diseaseEn: 'Inactivated Poliovirus Protection',
        diseaseBn: 'ইনঅ্যাক্টিভেটেড পোলিও রক্ত সুরক্ষা',
        routeBn: 'ডান ঊরুর চামড়ার ভেতরে (Intradermal)',
        doseCountText: '১ম ডোজ (০.১ মিলি)',
        criticalNotesBn: 'ইনজেক্টেবল পোলিও রক্তের ভেতরে দীর্ঘস্থায়ী ইমিউনিটি তৈরি করে।',
      },
    ],
  },
  {
    id: 'epi_9m',
    milestoneAgeDays: 270,
    milestoneLabelEn: '9 Months Completed (270 Days)',
    milestoneLabelBn: '৯ মাস পূর্ণ হলে (২৭০ দিন)',
    ageCategory: 'CHILD_EPI',
    descriptionBn: 'হাম ও রুবেলা এবং পোলিওর দ্বিতীয় ইনজেকশন ডোজ।',
    vaccines: [
      {
        code: 'MR_1',
        nameEn: 'MR-1 (Measles & Rubella)',
        nameBn: 'এমআর-১ (হাম ও রুবেলা)',
        diseaseEn: 'Measles & Rubella Congenital Syndrome',
        diseaseBn: 'মারাত্মক হাম ও জন্মগত রুবেলা সিন্ড্রোম',
        routeBn: 'ডান বাহুর উপরিভাগে চামড়ার নিচে (Subcutaneous)',
        doseCountText: '১ম ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'হামের জটিলতা যেমন অন্ধত্ব, নিউমোনিয়া ও মস্তিষ্কের প্রদাহ প্রতিরোধ করে।',
      },
      {
        code: 'fIPV_2',
        nameEn: 'fIPV-2 (Fractional IPV Booster)',
        nameBn: 'এফআইপিভি-২ (ইনজেকশন পোলিও বুস্টার)',
        diseaseEn: 'Polio Booster Immunity',
        diseaseBn: 'পোলিও বুস্টার সুরক্ষা',
        routeBn: 'ডান বাহু / ঊরুর চামড়ার ভেতরে',
        doseCountText: '২য় ডোজ (০.১ মিলি)',
        criticalNotesBn: 'পোলিও ভাইরাসের বিরুদ্ধে সম্পূর্ণ সুরক্ষা নিশ্চিত করে।',
      },
    ],
  },
  {
    id: 'epi_15m',
    milestoneAgeDays: 450,
    milestoneLabelEn: '15 Months Completed (450 Days)',
    milestoneLabelBn: '১৫ মাস পূর্ণ হলে (সাড়ে ১২ মাস বা ৪৫০ দিন)',
    ageCategory: 'CHILD_EPI',
    descriptionBn: 'হাম ও রুবেলার চূড়ান্ত বুস্টার ডোজ। এটি বাদ দিলে পূর্ণ সুরক্ষা পাওয়া যায় না।',
    vaccines: [
      {
        code: 'MR_2',
        nameEn: 'MR-2 (Measles & Rubella Booster)',
        nameBn: 'এমআর-২ (হাম ও রুবেলা ২য় ডোজ)',
        diseaseEn: 'Measles & Rubella Lifelong Immunity',
        diseaseBn: 'হাম ও রুবেলার আজীবন সুরক্ষা',
        routeBn: 'বাম বাহুর উপরিভাগে চামড়ার নিচে',
        doseCountText: '২য় ডোজ (০.৫ মিলি)',
        criticalNotesBn: 'সরকারি ইপিআই শিডিউলের চূড়ান্ত শিশুকালীন টিকা।',
      },
    ],
  },
  {
    id: 'epi_hpv',
    milestoneAgeDays: 3650, // 10 years
    milestoneLabelEn: '10-14 Years (Adolescent Girls)',
    milestoneLabelBn: '১০-১৪ বছর বয়সী কিশোরী (স্কুল/কমিউনিটি)',
    ageCategory: 'ADOLESCENT',
    descriptionBn: 'বাংলাদেশ সরকারের জাতীয় এইচপিভি টিকাদান কার্যক্রম।',
    vaccines: [
      {
        code: 'HPV',
        nameEn: 'HPV Vaccine (Single Dose)',
        nameBn: 'এইচপিভি টিকা (জরায়ুমুখ ক্যান্সার প্রতিরোধক)',
        diseaseEn: 'Cervical Cancer (Human Papillomavirus)',
        diseaseBn: 'জরায়ুমুখ ক্যান্সার প্রতিরোধ',
        routeBn: 'বাম বাহুর মাংসপেশিতে',
        doseCountText: '১টি একক ডোজ',
        criticalNotesBn: '১০ থেকে ১৪ বছর বয়সী সকল কিশোরীর জন্য সরকারিভাবে বিনামূল্যে জরায়ুমুখ ক্যান্সার সুরক্ষায় দেওয়া হয়।',
      },
    ],
  },
];

export interface ElderlyVaccineItem {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  targetGroupEn: string;
  targetGroupBn: string;
  frequencyBn: string;
  importanceBn: string;
  diseaseBn: string;
  recommendedMonthsBn?: string;
}

export const ELDERLY_ADULT_SCHEDULE: ElderlyVaccineItem[] = [
  {
    id: 'eld_flu',
    code: 'INFLUENZA_ANNUAL',
    nameEn: 'Influenza (Annual Flu Vaccine)',
    nameBn: 'বার্ষিক ফ্লু / ইনফ্লুয়েঞ্জা টিকা',
    targetGroupEn: 'All adults 50+ & Chronic Disease Patients',
    targetGroupBn: '৫০+ বয়স্ক, ডায়াবেটিস, অ্যাজমা, সিওপিডি ও হৃদরোগী',
    frequencyBn: 'প্রতি বছর সেপ্টেম্বর-অক্টোবর (শীতের আগে) ১ ডোজ',
    diseaseBn: 'তীব্র ইনফ্লুয়েঞ্জা, ভাইরাল জ্বর ও ফুসফুসের সেকেন্ডারি ইনফেকশন',
    importanceBn: 'বয়স্কদের ফ্লু থেকে মারাত্মক নিউমোনিয়া ও হাসপাতালে ভর্তির ঝুঁকি ৭০% পর্যন্ত কমিয়ে দেয়।',
    recommendedMonthsBn: 'ভাদ্র-আশ্বিন / সেপ্টেম্বর-নভেম্বর',
  },
  {
    id: 'eld_pneumo',
    code: 'PNEUMO_ADULT',
    nameEn: 'Pneumococcal Vaccine (PCV20 / PPSV23)',
    nameBn: 'নিউমোকক্কাল নিউমোনিয়া টিকা',
    targetGroupEn: 'Adults 50+ with Diabetes/Kidney/Heart issues & all 65+',
    targetGroupBn: '৫০+ ডায়াবেটিস/কিডনি রোগী এবং ৬৫+ সকল প্রবীণ নাগরিক',
    frequencyBn: '১টি বা চিকিৎসকের পরামর্শে ৫ বছর পর ১টি বুস্টার ডোজ',
    diseaseBn: 'মারাত্মক ব্যাকটেরিয়াল নিউমোনিয়া, ব্যাকটেরেমিয়া ও ফুসফুস সংক্রমণ',
    importanceBn: 'শীতকালে বয়স্কদের ফুসফুসের ব্যাকটেরিয়াল নিউমোনিয়া ও আইসিইউতে যাওয়ার ঝুঁকি প্রতিহত করে।',
  },
  {
    id: 'eld_shingles',
    code: 'SHINGLES_ZOSTER',
    nameEn: 'Shingles / Herpes Zoster Vaccine (Shingrix)',
    nameBn: 'হার্পিস জোস্টার / দাদ-এর টিকা (শিংগ্রিক্স)',
    targetGroupEn: 'Adults 50 years and older',
    targetGroupBn: '৫০ বছর বা তদূর্ধ্ব সকল নারী ও পুরুষ',
    frequencyBn: 'মোট ২ ডোজ (২ থেকে ৬ মাসের ব্যবধানে)',
    diseaseBn: 'দাদ (Shingles) ও অসহ্য স্নায়ুর দীর্ঘমেয়াদী ব্যথা (Postherpetic Neuralgia)',
    importanceBn: 'বয়স বাড়লে শৈশবের জলবসন্তের ভাইরাস সক্রিয় হয়ে তীব্র স্নায়ুবেদনা সৃষ্টি করে; এই টিকা ৯০%+ কার্যকর সুরক্ষা দেয়।',
  },
  {
    id: 'eld_tdap',
    code: 'TD_BOOSTER',
    nameEn: 'Tetanus & Diphtheria Booster (Td / Tdap)',
    nameBn: 'টিটেনাস ও ডিপথেরিয়া বুস্টার',
    targetGroupEn: 'All adults every 10 years',
    targetGroupBn: 'সকল প্রাপ্তবয়স্ক ও বয়স্ক মানুষ',
    frequencyBn: 'প্রতি ১০ বছর পর পর ১ ডোজ',
    diseaseBn: 'ধনুষ্টংকার (Tetanus) ও ডিপথেরিয়া',
    importanceBn: 'জং ধরা লোহা, মাটি বা কাটার ক্ষত থেকে ধনুষ্টংকারের প্রাণঘাতী ব্যাকটেরিয়া রোধে অত্যন্ত জরুরি।',
  },
  {
    id: 'eld_hepb',
    code: 'HEPB_ADULT',
    nameEn: 'Hepatitis B Adult (0, 1, 6 Months)',
    nameBn: 'হেপাটাইটিস-বি অ্যাডাল্ট ভ্যাকসিন',
    targetGroupEn: 'Adults without prior antibodies / Diabetic patients',
    targetGroupBn: 'যাঁদের আগে নেওয়া হয়নি বা অ্যান্টিবডি নেই, বিশেষত ডায়াবেটিস ও ডায়ালিসিস রোগী',
    frequencyBn: 'মোট ৩টি ডোজ (০, ১ ও ৬ মাসের ব্যবধানে)',
    diseaseBn: 'হেপাটাইটিস-বি ভাইরাস, জন্ডিস, লিভার সিরোসিস ও লিভার ক্যান্সার',
    importanceBn: 'রক্ত বা ইনজেকশনের মাধ্যমে লিভার ধ্বংসকারী হেপাটাইটিস-বি সংক্রমণ চিরতরে প্রতিরোধ করে।',
  },
];
