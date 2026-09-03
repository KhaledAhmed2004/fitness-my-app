import {
  DengueWarningSymptomDef,
  DengueWarningSymptomKey,
  FluidItemType,
} from '@/types/dengue-fluid-monitor';

export const DENGUE_WARNING_SYMPTOMS: DengueWarningSymptomDef[] = [
  {
    key: 'SEVERE_ABDOMINAL_PAIN',
    titleBn: 'পেটে তীব্র ও অবিরাম ব্যথা (Severe Abdominal Pain)',
    descriptionBn:
      'পেট শক্ত হয়ে যাওয়া বা পেটে তীব্র যন্ত্রণা হওয়া পেটের ভেতর রক্তক্ষরণ বা লিভার স্ফীতির লক্ষণ হতে পারে।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'PERSISTENT_VOMITING',
    titleBn: 'বারবার বমি হওয়া (Persistent Vomiting)',
    descriptionBn:
      '২৪ ঘণ্টায় ৩ বারের বেশি বমি হওয়া এবং মুখে পানি বা কোনো খাবার না ধরে রাখা।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'MUCOSAL_BLEEDING',
    titleBn: 'মাড়ি, নাক বা কাশির সাথে রক্তপাত (Mucosal Bleeding)',
    descriptionBn:
      'দাঁত ব্রাশ করার সময় মাড়ি দিয়ে রক্ত পড়া, নাক দিয়ে রক্ত ঝরা, কালো পায়খানা বা বমির সাথে রক্ত দেখা দেওয়া।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'LETHARGY_RESTLESSNESS',
    titleBn: 'অতিরিক্ত নিস্তেজ ভাব বা অস্থিরতা (Lethargy / Restlessness)',
    descriptionBn:
      'রোগী অতিরিক্ত ঝিমুনি থাকা, অসংলগ্ন কথা বলা, চরম দুর্বলতা বা বিভ্রান্ত আচরণ করা।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'DECREASED_URINE_OUTPUT',
    titleBn: 'প্রস্রাবের পরিমাণ মারাত্মক কমে যাওয়া (Oliguria)',
    descriptionBn:
      'গত ৬ ঘণ্টায় রোগী একবারও প্রস্রাব না করা অথবা খুব গাঢ় সামান্য লালচে প্রস্রাব হওয়া (মারাত্মক পানিশূন্যতা ও শক)।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'COLD_CLAMMY_SKIN',
    titleBn: 'হাত-পা বরফের মতো ঠান্ডা ও ঘামে ভেজা (Cold Clammy Skin)',
    descriptionBn:
      'রক্তচাপ (BP) বিপজ্জনকভাবে কমে যাওয়ার লক্ষণ (Dengue Shock Syndrome)। দ্রুত আইসিইউ/হাসপাতাল প্রয়োজন।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'SUDDEN_DROP_IN_FEVER_WITH_WEAKNESS',
    titleBn: 'জ্বর হঠাৎ কমে যাওয়ার সাথে চরম দুর্বলতা (Critical Phase Transition)',
    descriptionBn:
      'জ্বর ১০৩°-১০৪° থেকে স্বাভাবিক বা ৯৭° এ নেমে যাওয়ার সময় রোগী যদি আরও দুর্বল ও নেতিয়ে পড়ে, তবে এটি বিপদসীমা।',
    severity: 'CRITICAL_RED_FLAG',
  },
  {
    key: 'RAPID_BREATHING_BREATHLESSNESS',
    titleBn: 'দ্রুত শ্বাস-প্রশ্বাস বা শ্বাসকষ্ট (Difficulty Breathing)',
    descriptionBn:
      'ফুসফুসের পর্দায় বা পেটে অতিরিক্ত পানি জমার লক্ষণ (Pleural Effusion / Plasma Leakage)।',
    severity: 'CRITICAL_RED_FLAG',
  },
];

export const NSAID_BANNED_MEDICINES = [
  { name: 'Diclofenac', brandExamples: 'Clofenac, Voltagel, Voveran, A-Fenac' },
  { name: 'Aceclofenac', brandExamples: 'Aceclo, Flexi, Moveran, Zerodol' },
  { name: 'Ibuprofen', brandExamples: 'Flammex, Profen, Intafen' },
  { name: 'Naproxen', brandExamples: 'Napryn, Xenole, Anaprox' },
  { name: 'Ketorolac', brandExamples: 'Torax, Ketonic, Rolac' },
  { name: 'Aspirin', brandExamples: 'Ecosprin, Disprin, Cardoprin' },
  { name: 'Indomethacin', brandExamples: 'Indomet, Indocid' },
];

export const FLUID_PRESETS: Array<{
  type: FluidItemType;
  labelBn: string;
  defaultAmountMl: number;
  icon: string;
  color: string;
}> = [
  {
    type: 'ORAL_SALINE_ORS',
    labelBn: 'খাবার স্যালাইন (ORS)',
    defaultAmountMl: 250,
    icon: 'water-drop',
    color: '#0284C7',
  },
  {
    type: 'COCONUT_WATER',
    labelBn: 'ডাবের পানি',
    defaultAmountMl: 200,
    icon: 'local-florist',
    color: '#10B981',
  },
  {
    type: 'WATER',
    labelBn: 'সাধারণ বিশুদ্ধ পানি',
    defaultAmountMl: 250,
    icon: 'opacity',
    color: '#38BDF8',
  },
  {
    type: 'SOUP_JUICE',
    labelBn: 'চিকেন স্যুপ / লেবুর শরবত / ফলের জুস',
    defaultAmountMl: 200,
    icon: 'local-cafe',
    color: '#F59E0B',
  },
  {
    type: 'MILK_OTHER',
    labelBn: 'দুধ / ডাল পানি / বার্লি',
    defaultAmountMl: 150,
    icon: 'local-drink',
    color: '#8B5CF6',
  },
];

export const DENGUE_HOTLINES = [
  { name: 'স্বাস্থ্য বাতায়ন (সরকারি ২৪/৭ স্বাস্থ্য সেবা)', number: '16263' },
  { name: 'আইইডিসিআর কন্ট্রোল রুম (IEDCR)', number: '10655' },
  { name: 'জাতীয় জরুরি সেবা ও অ্যাম্বুলেন্স', number: '999' },
  { name: 'ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH)', number: '02-55165088' },
  { name: 'মুগদা মেডিকেল কলেজ হাসপাতাল ডেঙ্গু সেল', number: '02-7278278' },
  { name: 'কুর্মিটোলা জেনারেল হাসপাতাল', number: '02-8712172' },
];
