import {
  BeersCriteriaItem,
  RenalSafeDoseGuideline,
} from '@/types/polypharmacy-shield';

export const BEERS_CRITERIA_LIST: BeersCriteriaItem[] = [
  {
    id: 'beers_nsaids',
    drugClassEn: 'High-Risk NSAIDs (Painkillers)',
    drugClassBn: 'উচ্চ ঝুঁকিপূর্ণ ব্যথানাশক ওষুধ (NSAIDs)',
    genericExamplesBn: ['Ketorolac (টোরোডল)', 'Indomethacin', 'Naproxen', 'Diclofenac'],
    category: 'AVOID_IN_ELDERLY',
    severity: 'CRITICAL',
    adverseRiskBn:
      'প্রবীণদের পরিপাকতন্ত্রে হঠাৎ রক্তক্ষরণ (GI Bleeding), আলসার এবং কিডনি বিকল (Acute Kidney Injury) হওয়ার অত্যন্ত তীব্র ঝুঁকি তৈরি করে।',
    saferAlternativeBn:
      'হালকা ব্যথায় প্যারাসিটামল (Paracetamol সর্বোচ্চ ২ গ্রাম/দিন) বা স্থানীয় ব্যথানাশক জেল/প্যাচ ব্যবহার করুন।',
  },
  {
    id: 'beers_benzos',
    drugClassEn: 'Benzodiazepines & Sedatives (Sleeping Pills)',
    drugClassBn: 'ঘুম ও দুশ্চিন্তার সিডেটিভ ওষুধ (Benzodiazepines)',
    genericExamplesBn: ['Diazepam (সিডিল)', 'Clonazepam (রিভোট্রিল)', 'Alprazolam', 'Zolpidem'],
    category: 'HIGH_FALL_RISK',
    severity: 'CRITICAL',
    adverseRiskBn:
      'মাথা ঘোরা, ভারসাম্যহীনতা ও বাথরুমে পড়ে গিয়ে হিপ ফ্র্যাকচার (হাড় ভাঙা) এবং সাময়িক স্মৃতিভ্রম (Delirium) হওয়ার প্রধান কারণ।',
    saferAlternativeBn:
      'ঘুমের স্বাস্থ্যবিধি (Sleep Hygiene), মেলাটোনিন (Melatonin) অথবা চিকিৎসকের তত্ত্বাবধানে কগনিটিভ থেরাপি।',
  },
  {
    id: 'beers_antihistamines',
    drugClassEn: '1st Gen Anticholinergic Antihistamines',
    drugClassBn: '১ম প্রজন্মের অ্যান্টিকোলিনার্জিক এলার্জির ওষুধ',
    genericExamplesBn: ['Diphenhydramine (বেনাড্রিল)', 'Chlorpheniramine (হিস্টাসিন)', 'Hydroxyzine'],
    category: 'AVOID_IN_ELDERLY',
    severity: 'HIGH',
    adverseRiskBn:
      'বয়স্ক পুরুষদের প্রস্টেট বৃদ্ধি থাকলে মূত্র আটকে যাওয়া (Urinary Retention), তীব্র কোষ্ঠকাঠিন্য ও মুখ শুকিয়ে যাওয়া।',
    saferAlternativeBn:
      '২য় প্রজন্মের এলার্জির ওষুধ যেমন: ফেক্সোফেনাডিন (Fexofenadine) বা সিট্রিজিন (Cetirizine)।',
  },
  {
    id: 'beers_sulfonylureas',
    drugClassEn: 'Long-Acting Sulfonylureas',
    drugClassBn: 'দীর্ঘমেয়াদী ডায়াবেটিস ওষুধ (Sulfonylureas)',
    genericExamplesBn: ['Glibenclamide (ডায়াবেক্স/ডাওনিল)'],
    category: 'AVOID_IN_ELDERLY',
    severity: 'HIGH',
    adverseRiskBn:
      'বয়স্কদের কিডনি শ্লথ থাকায় দীর্ঘস্থায়ী মারাত্মক লো সুগার (Prolonged Severe Hypoglycemia) ও অজ্ঞান হওয়ার ঝুঁকি তৈরি করে।',
    saferAlternativeBn:
      'লিনাগ্লিপটিন (Linagliptin), মেটফরমিন (কিডনি ভালো থাকলে) অথবা ইনসুলিন ডোজ সমন্বয়।',
  },
  {
    id: 'beers_duplicate_ppi',
    drugClassEn: 'Duplicate Gastroprotective PPIs',
    drugClassBn: 'একাধিক ডাক্তারের প্রেসক্রিপশনে ডুপ্লিকেট গ্যাস্ট্রিক ওষুধ',
    genericExamplesBn: ['Omeprazole + Pantoprazole একসাথে', 'Esomeprazole + Rabeprazole'],
    category: 'DUPLICATE_OVERLAP',
    severity: 'MODERATE',
    adverseRiskBn:
      'দীর্ঘমেয়াদে অপ্রয়োজনে ডাবল অ্যান্টাসিড খেলে শরীরে ক্যালসিয়াম ও ভিটামিন বি১২ শোষণ ব্যাহত হয়ে হাড়ের ক্ষয় বাড়ে।',
    saferAlternativeBn:
      'শুধুমাত্র ১টি একক গ্যাস্ট্রিক ওষুধ নির্দিষ্ট মেয়াদে চিকিৎসকের পরামর্শে গ্রহণ করুন।',
  },
];

export const RENAL_SAFE_DOSE_GUIDELINES: RenalSafeDoseGuideline[] = [
  {
    id: 'renal_metformin',
    drugNameBn: 'মেটফরমিন (Metformin - ডায়াবেটিস)',
    eGfrThresholdBn: 'eGFR < ৩০ ml/min হলে সম্পূর্ণ নিষিদ্ধ',
    riskBn: 'ল্যাকটিক অ্যাসিডোসিস (Lactic Acidosis) এর প্রাণঘাতী ঝুঁকি।',
    safeAdjustmentBn: 'eGFR ৩০-৪৫ হলে সর্বোচ্চ ১০০০ mg/দিন; < ৩০ হলে বন্ধ করে ইনসুলিন বা লিনাগ্লিপটিন দিন।',
  },
  {
    id: 'renal_allopurinol',
    drugNameBn: 'অ্যালোপিউরিনল (Allopurinol - ইউরিক এসিড)',
    eGfrThresholdBn: 'eGFR < ৫০ ml/min হলে ডোজ কমাতে হবে',
    riskBn: 'শরীরে ড্রাগ জমে গিয়ে ত্বকের তীব্র এলার্জি (DRESS Syndrome)।',
    safeAdjustmentBn: 'eGFR ৩০-৫০ হলে ১০০ mg/দিন; < ৩০ হলে ১০০ mg একদিন পর পর।',
  },
  {
    id: 'renal_nsaids',
    drugNameBn: 'ব্যথানাশক ওষুধ (NSAIDs)',
    eGfrThresholdBn: 'eGFR < ৬০ ml/min হলে পরিহারযোগ্য',
    riskBn: 'কিডনির রক্তনালী সংকুচিত করে তাৎক্ষণিক সিরাম ক্রিয়েটিনিন বৃদ্ধি।',
    safeAdjustmentBn: 'দীর্ঘমেয়াদে সম্পূর্ণ পরিহার করুন।',
  },
];
