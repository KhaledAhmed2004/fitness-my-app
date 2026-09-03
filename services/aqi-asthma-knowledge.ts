import {
  AqiCategory,
  CityAqiInfo,
  InhalerItem,
  PeakFlowZone,
} from '@/types/aqi-asthma-shield';

export const BANGLADESH_CITIES_AQI: CityAqiInfo[] = [
  {
    cityId: 'dhaka',
    cityNameBn: 'ঢাকা (Dhaka)',
    cityNameEn: 'Dhaka',
    currentAqi: 245,
    pm25Concentration: 195,
    category: 'VERY_UNHEALTHY_201_300',
    categoryLabelBn: '🟣 মারাত্মক অস্বাস্থ্যকর (Very Unhealthy)',
    categoryColor: '#8B5CF6',
    advisoryBn:
      'বাতাসে ক্ষতিকর ধূলিকণার মাত্রা চরম পর্যায়ে। হাঁপানি ও শ্বাসকষ্টের রোগীরা বাইরে যাওয়া থেকে বিরত থাকুন এবং বের হলে N95 মাস্ক পরিধান করুন।',
    maskRequired: true,
    outdoorSafe: false,
  },
  {
    cityId: 'gazipur',
    cityNameBn: 'গাজীপুর (Gazipur)',
    cityNameEn: 'Gazipur',
    currentAqi: 260,
    pm25Concentration: 210,
    category: 'VERY_UNHEALTHY_201_300',
    categoryLabelBn: '🟣 মারাত্মক অস্বাস্থ্যকর (Very Unhealthy)',
    categoryColor: '#8B5CF6',
    advisoryBn:
      'শিল্পাঞ্চল ও যানবাহনের ধোঁয়া বেশি। ইনহেলার সাথে রাখুন এবং ঘরের দরজা-জানালা বন্ধ রাখুন।',
    maskRequired: true,
    outdoorSafe: false,
  },
  {
    cityId: 'narayanganj',
    cityNameBn: 'নারায়ণগঞ্জ (Narayanganj)',
    cityNameEn: 'Narayanganj',
    currentAqi: 230,
    pm25Concentration: 180,
    category: 'VERY_UNHEALTHY_201_300',
    categoryLabelBn: '🟣 মারাত্মক অস্বাস্থ্যকর (Very Unhealthy)',
    categoryColor: '#8B5CF6',
    advisoryBn:
      'ঘন ধোঁয়াশা রয়েছে। শিশু ও বৃদ্ধদের আউটডোর খেলাধুলা সম্পূর্ণ বন্ধ রাখা উচিত।',
    maskRequired: true,
    outdoorSafe: false,
  },
  {
    cityId: 'chittagong',
    cityNameBn: 'চট্টগ্রাম (Chittagong)',
    cityNameEn: 'Chittagong',
    currentAqi: 165,
    pm25Concentration: 85,
    category: 'UNHEALTHY_151_200',
    categoryLabelBn: '🔴 অস্বাস্থ্যকর (Unhealthy)',
    categoryColor: '#EF4444',
    advisoryBn:
      'অ্যাজমা ও অ্যালার্জির রোগীরা দীর্ঘক্ষণ বাইরে হাঁটাহাঁটি বা ব্যায়াম পরিহার করুন।',
    maskRequired: true,
    outdoorSafe: false,
  },
  {
    cityId: 'rajshahi',
    cityNameBn: 'রাজশাহী (Rajshahi)',
    cityNameEn: 'Rajshahi',
    currentAqi: 140,
    pm25Concentration: 55,
    category: 'UNHEALTHY_SENSITIVE_101_150',
    categoryLabelBn: '🟠 সংবেদনশীলদের জন্য ক্ষতিকর',
    categoryColor: '#F59E0B',
    advisoryBn:
      'শুষ্ক আবহাওয়ায় ধুলোবালি বেশি। সাধারণ মাস্ক ব্যবহার করুন এবং প্রচুর পানি পান করুন।',
    maskRequired: false,
    outdoorSafe: true,
  },
  {
    cityId: 'sylhet',
    cityNameBn: 'সিলেট (Sylhet)',
    cityNameEn: 'Sylhet',
    currentAqi: 75,
    pm25Concentration: 24,
    category: 'MODERATE_51_100',
    categoryLabelBn: '🟡 মধ্যম মানের বাতাস (Moderate)',
    categoryColor: '#EAB308',
    advisoryBn:
      'বাতাসের মান সহনশীল। তবে তীব্র অ্যালার্জি থাকলে সতর্ক থাকুন।',
    maskRequired: false,
    outdoorSafe: true,
  },
  {
    cityId: 'khulna',
    cityNameBn: 'খুলনা (Khulna)',
    cityNameEn: 'Khulna',
    currentAqi: 155,
    pm25Concentration: 70,
    category: 'UNHEALTHY_151_200',
    categoryLabelBn: '🔴 অস্বাস্থ্যকর (Unhealthy)',
    categoryColor: '#EF4444',
    advisoryBn:
      'বাইরে বের হওয়ার সময় মাস্ক ব্যবহার করুন। নিয়মিত প্রিভেন্টার ইনহেলার নিন।',
    maskRequired: true,
    outdoorSafe: false,
  },
  {
    cityId: 'barisal',
    cityNameBn: 'বরিশাল (Barisal)',
    cityNameEn: 'Barisal',
    currentAqi: 85,
    pm25Concentration: 30,
    category: 'MODERATE_51_100',
    categoryLabelBn: '🟡 মধ্যম মানের বাতাস (Moderate)',
    categoryColor: '#EAB308',
    advisoryBn:
      'আউটডোরে স্বাভাবিক চলাফেরা নিরাপদ।',
    maskRequired: false,
    outdoorSafe: true,
  },
  {
    cityId: 'rangpur',
    cityNameBn: 'রংপুর (Rangpur)',
    cityNameEn: 'Rangpur',
    currentAqi: 120,
    pm25Concentration: 45,
    category: 'UNHEALTHY_SENSITIVE_101_150',
    categoryLabelBn: '🟠 সংবেদনশীলদের জন্য ক্ষতিকর',
    categoryColor: '#F59E0B',
    advisoryBn:
      'কুয়াশা ও ধুলাবালি থেকে শিশুদের রক্ষা করুন।',
    maskRequired: false,
    outdoorSafe: true,
  },
];

export const DEFAULT_INHALERS_CATALOG: InhalerItem[] = [
  {
    id: 'inh_azmasol',
    brandName: 'Azmasol Inhaler (সালবুটামল)',
    genericName: 'Salbutamol 100mcg',
    type: 'RELIEVER_SOS',
    colorTag: '#EF4444',
    totalPuffsCapacity: 200,
    remainingPuffs: 142,
    lowPuffAlertThreshold: 25,
  },
  {
    id: 'inh_bexitrol',
    brandName: 'Bexitrol-F Inhaler (বেক্সিট্রল)',
    genericName: 'Salmeterol + Fluticasone 25/125',
    type: 'CONTROLLER_PREVENTER',
    colorTag: '#0284C7',
    totalPuffsCapacity: 120,
    remainingPuffs: 84,
    lowPuffAlertThreshold: 20,
  },
  {
    id: 'inh_budecort',
    brandName: 'Budecort Inhaler (বুডেকোর্ট)',
    genericName: 'Budesonide 200mcg',
    type: 'CONTROLLER_PREVENTER',
    colorTag: '#10B981',
    totalPuffsCapacity: 200,
    remainingPuffs: 190,
    lowPuffAlertThreshold: 25,
  },
];

export const ASTHMA_EMERGENCY_444_PROTOCOL = [
  {
    step: 1,
    titleBn: 'সোজা হয়ে বসুন ও শান্ত থাকুন',
    instructionBn:
      'কখনই রোগীকে শুইয়ে দেবেন না। আরামদায়কভাবে সোজা হয়ে বসুন এবং টাইট জামাকাপড় ঢিলে করে দিন।',
  },
  {
    step: 2,
    titleBn: '৪ পাফ রিলিভার ইনহেলার গ্রহণ',
    instructionBn:
      'নীল রঙের সালবুটামল (যেমন: Azmasol / Ventolin) স্পেসারের সাহায্যে ১ পাফ করে টেনে ৪ বার ধীরে ধীরে বুক ভরে শ্বাস নিন। প্রতি পাফের মাঝে ১ মিনিট বিরতি দিন।',
  },
  {
    step: 3,
    titleBn: '৪ মিনিট অপেক্ষা ও পর্যবেক্ষণ',
    instructionBn:
      '৪ মিনিট অপেক্ষা করুন। শ্বাসকষ্ট না কমলে পুনরায় আরও ৪ পাফ ইনহেলার দিন।',
  },
  {
    step: 4,
    titleBn: 'জরুরি হাসপাতালে যাওয়ার রেড অ্যালার্ট',
    instructionBn:
      'যদি ৮ পাফ নেওয়ার পরও শ্বাসকষ্ট না কমে, কথা বলতে কষ্ট হয় বা ঠোঁট নীলচে হতে থাকে, তবে বিলম্ব না করে তৎক্ষণাৎ অ্যাম্বুলেন্স বা নিকটস্থ জরুরি বিভাগে নিয়ে যান।',
  },
];
