import {
  BrainExerciseItem,
  CognitiveObservationItem,
} from '@/types/memory-dementia-shield';

export const MINI_COG_WORD_SETS = [
  { id: 'set_1', words: ['কলা', 'চেয়ার', 'নদী'], labelBn: 'সেট ১ (কলা, চেয়ার, নদী)' },
  { id: 'set_2', words: ['আম', 'বই', 'ফুল'], labelBn: 'সেট ২ (আম, বই, ফুল)' },
  { id: 'set_3', words: ['আকাশ', 'টেবিল', 'পাখি'], labelBn: 'সেট ৩ (আকাশ, টেবিল, পাখি)' },
];

export const CAREGIVER_OBSERVATIONS: CognitiveObservationItem[] = [
  {
    id: 'obs_repetitive',
    category: 'স্মৃতি ও কথোপকথন',
    titleBn: 'একই প্রশ্ন বা কথা বারবার বলা',
    descriptionBn: 'একই প্রশ্ন কিছুক্ষণ পরপর জিজ্ঞেস করা বা একটু আগে ঘটা ঘটনা সম্পূর্ণ ভুলে যাওয়া।',
    isHighConcern: true,
  },
  {
    id: 'obs_spatial',
    category: 'দিকভ্রান্তি ও স্থানজ্ঞান',
    titleBn: 'চেনা রাস্তা বা ঘরের ভেতর পথ গুলিয়ে ফেলা',
    descriptionBn: 'পরিচিত বাজার বা নিজের ঘরের বাথরুমের দরজা খুঁজে পেতে বিভ্রান্ত হওয়া।',
    isHighConcern: true,
  },
  {
    id: 'obs_misplacing',
    category: 'দৈনন্দিন কাজ',
    titleBn: 'চাবি, চশমা বা টাকা অস্বাভাবিক জায়গায় রেখে ভুলে যাওয়া',
    descriptionBn: 'যেমন ফ্রিজের ভেতর চশমা রাখা বা জুতার ভেতর টাকা রেখে চুরির সন্দেহ করা।',
    isHighConcern: false,
  },
  {
    id: 'obs_meds',
    category: 'চিকিৎসা সচেতনতা',
    titleBn: 'নিয়মিত ওষুধ খাওয়া সম্পূর্ণ ভুলে যাওয়া বা দুইবার খাওয়া',
    descriptionBn: 'ওষুধ খেয়েছে কিনা মনে করতে না পারা বা ভুল সময়ে ভুল ওষুধ খাওয়া।',
    isHighConcern: true,
  },
  {
    id: 'obs_anomia',
    category: 'স্মৃতি ও কথোপকথন',
    titleBn: 'পরিচিত আত্মীয় বা নাতি-নাতনির নাম মনে না পড়া',
    descriptionBn: 'খুব ঘনিষ্ঠ মানুষের নাম মনে করতে দীর্ঘক্ষণ আটকে থাকা।',
    isHighConcern: false,
  },
  {
    id: 'obs_finance',
    category: 'হিসাব-নিকাশ',
    titleBn: 'টাকা-পয়সার সাধারণ হিসাব মেলাতে না পারা',
    descriptionBn: 'দোকানে গিয়ে বাকি টাকা গুনে নিতে সমস্যা বা বিল পরিশোধে বিভ্রান্তি।',
    isHighConcern: true,
  },
  {
    id: 'obs_mood',
    category: 'আচরণ ও ব্যক্তিত্ব',
    titleBn: 'হঠাৎ মেজাজের পরিবর্তন, অতিরিক্ত রাগ বা খিটখিটে ভাব',
    descriptionBn: 'শান্ত স্বভাবের মানুষ হঠাৎ কোনো কারণ ছাড়াই পরিবার নিয়ে সন্দেহপ্রবণ হওয়া।',
    isHighConcern: false,
  },
  {
    id: 'obs_hygiene',
    category: 'আত্মযত্ন',
    titleBn: 'ব্যক্তিগত পরিচ্ছন্নতা ও গোসল করার প্রতি চরম অনীহা',
    descriptionBn: 'নিয়মিত জামাকাপড় পরিবর্তন বা নিজের যত্ন নেওয়ার আগ্রহ হারিয়ে ফেলা।',
    isHighConcern: false,
  },
];

export const BRAIN_EXERCISES_CATALOG: BrainExerciseItem[] = [
  {
    id: 'ex_neurobic_hands',
    titleBn: 'বিপরীত হাতের নিউরোবিক্স চ্যালেঞ্জ',
    typeBn: 'শারীরিক মোটর উদ্দীপনা',
    instructionBn: 'প্রতিদিন সকালে দাঁত ব্রাশ করা বা চা খাওয়ার কাপ উল্টো হাত (নন-ডমিন্যান্ট হাত) দিয়ে ধরার অভ্যাস করান।',
    benefitBn: 'মস্তিষ্কের বিপরীত গোলার্ধের নিষ্ক্রিয় নিউরনগুলোকে সচল ও উদ্দীপিত করে।',
  },
  {
    id: 'ex_serial_sevens',
    titleBn: '১০০ থেকে ৭ বিয়োগের গণনা (Serial 7s)',
    typeBn: 'ক্যালকুলেশন ও মনোযোগ',
    instructionBn: '১০০ থেকে মুখে মুখে ৭ বিয়োগ করে করে বলতে বলুন: ৯৩, ৮৬, ৭৯, ৭২, ৬৫...',
    benefitBn: 'মস্তিষ্কের ফ্রন্টাল লোবের ওয়ার্কিং মেমরি ও কনসেন্ট্রেশন তীক্ষ্ণ রাখে।',
  },
  {
    id: 'ex_reminiscence',
    titleBn: 'পারিবারিক অ্যালবাম দেখে স্মৃতিকথন',
    typeBn: 'লং-টার্ম মেমরি থেরাপি',
    instructionBn: 'পুরনো ছবি দেখিয়ে সেই দিনের ঘটনা বা প্রিয় মানুষদের স্মৃতি নিয়ে গল্প করতে উৎসাহিত করুন।',
    benefitBn: 'দীর্ঘমেয়াদী স্মৃতি পুনরুদ্ধার করে এবং প্রবীণদের একাকীত্ব ও অবসাদ দূর করে।',
  },
  {
    id: 'ex_category_words',
    titleBn: '১ মিনিটে ১০টি ফলের নাম বলা',
    typeBn: 'ভার্বাল ফ্লুয়েন্সি (Verbal Fluency)',
    instructionBn: 'ঘড়ি দেখে ঠিক ১ মিনিটের মধ্যে দেশি ফুল, ফল বা নদীর নাম বলতে দিন।',
    benefitBn: 'শব্দ খোঁজার দ্রুততা (Lexical Access) বাড়ায় ও ব্রেন ড্যামেজ বিলম্বিত করে।',
  },
];
