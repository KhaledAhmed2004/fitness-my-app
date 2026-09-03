import { FallRiskItem, ParentProfile } from '@/types/elderly-care';

export const DEFAULT_PARENT_PROFILE: ParentProfile = {
  id: 'parent_1',
  nameBn: 'আম্মু (সুলতানা বেগম)',
  relationBn: 'মা',
  age: 68,
  bloodPressureRecent: '১৩০/৮২ mmHg',
  bloodSugarRecent: '৭.২ mmol/L (খাবার পর)',
  emergencyPhone: '01711223344',
  doctorPhone: '01819998877',
};

export const DEFAULT_FALL_RISK_ITEMS: FallRiskItem[] = [
  {
    id: 'fall_1',
    category: 'BATHROOM_SAFETY',
    categoryLabelBn: '🛁 বাথরুম সেফটি',
    titleBn: 'বাথরুমে নন-স্লিপ ম্যাট (Anti-Skid Rubber Mat) পাতা আছে',
    importanceBn: 'ভিজা টাইলসে পা পিছলে মারাত্মক হিপ ফ্র্যাকচার রোধে এটি সবচেয়ে জরুরি।',
    isCompleted: true,
  },
  {
    id: 'fall_2',
    category: 'BATHROOM_SAFETY',
    categoryLabelBn: '🛁 বাথরুম সেফটি',
    titleBn: 'কমোডের পাশে ও শাওয়ারের নিচে গ্র্যাব বার (Grab Rails) শক্তভাবে লাগানো',
    importanceBn: 'উঠে দাঁড়ানোর সময় মাথা ঘোরা বা ভারসাম্য হারালে ধরার জন্য অবলম্বন দেয়।',
    isCompleted: true,
  },
  {
    id: 'fall_3',
    category: 'BEDROOM_LIGHTING',
    categoryLabelBn: '💡 বেডরুম ও করিডোর লাইটিং',
    titleBn: 'রাতে বাথরুমে যাওয়ার পথে অটোমেটিক নাইট ল্যাম্প বা ডিম লাইট সচল আছে',
    importanceBn: 'অন্ধকারে ঘুমভাঙা চোখে পথ চলতে গিয়ে হোঁচট খাওয়া প্রতিরোধ করে।',
    isCompleted: true,
  },
  {
    id: 'fall_4',
    category: 'BEDROOM_LIGHTING',
    categoryLabelBn: '💡 বেডরুম ও করিডোর লাইটিং',
    titleBn: 'বিছানার পাশেই লাইটের সুইচ বা চার্জার লাইট রাখা আছে',
    importanceBn: 'অন্ধকারে বিছানা থেকে নামার আগেই যেন আলো জ্বালানো যায়।',
    isCompleted: false,
  },
  {
    id: 'fall_5',
    category: 'FLOOR_HAZARDS',
    categoryLabelBn: '🧹 মেঝের বাধা অপসারণ',
    titleBn: 'চলার পথ থেকে আলগা পাপোশ, কার্পেট ও বৈদ্যুতিক তার সরানো হয়েছে',
    importanceBn: 'বুড়ো বয়সে পা হালকা তুলে হাঁটার কারণে আলগা কাপড়ে পা আটকে পড়ে যায়।',
    isCompleted: false,
  },
  {
    id: 'fall_6',
    category: 'FLOOR_HAZARDS',
    categoryLabelBn: '🧹 মেঝের বাধা অপসারণ',
    titleBn: 'মা-বাবার ঘরের স্যান্ডেল অ্যান্টি-স্লিপ রাবার সোলের (Slippery নয়)',
    importanceBn: 'পুরনো মসৃণ স্যান্ডেলে ঘরেও পিছলে যাওয়ার আশঙ্কা থাকে।',
    isCompleted: true,
  },
  {
    id: 'fall_7',
    category: 'MEDICATION_EFFECTS',
    categoryLabelBn: '💊 ওষুধ ও মাথা ঘোরা',
    titleBn: 'ঘুম থেকে উঠে হঠাৎ খাট থেকে না দাঁড়িয়ে ২ মিনিট বসে থাকার অভ্যাস',
    importanceBn: 'প্রেসারের ওষুধ খেলে শোয়া থেকে হঠাৎ দাঁড়ালে রক্তচাপ কমে মাথা ঘোরে (Orthostatic Drop)।',
    isCompleted: true,
  },
  {
    id: 'fall_8',
    category: 'MEDICATION_EFFECTS',
    categoryLabelBn: '💊 ওষুধ ও মাথা ঘোরা',
    titleBn: 'প্রতিদিন সকাল ও রাতের ওষুধ আলাদা রঙের বক্সে (Pill Organizer) সাজানো',
    importanceBn: 'ভুল ওষুধ ডাবল খাওয়া বা মিস হওয়া সম্পূর্ণ রোধ করে।',
    isCompleted: false,
  },
];

export const SENIOR_HEALTH_RULES = [
  {
    id: 'rule_1',
    titleBn: '💧 পর্যাপ্ত পানি ও ডিহাইড্রেশন প্রতিরোধ',
    bodyBn:
      'বয়স বাড়লে তৃষ্ণার অনুভূতি কমে যায়। পর্যাপ্ত পানি না খেলে প্রস্রাবে ইনফেকশন (UTI) ও রক্তচাপ কমে বিভ্রান্তি দেখা দেয়। দৈনিক কমপক্ষে ৬-৭ গ্লাস পানি নিশ্চিত করুন।',
  },
  {
    id: 'rule_2',
    titleBn: '🪑 শোয়া থেকে ওঠার ২-মিনিট রুল (Orthostatic Safety)',
    bodyBn:
      'ঘুম ভাঙার পর সোজা না দাঁড়িয়ে প্রথমে বিছানায় ২ মিনিট বসে পা দোলাতে হবে, তারপর ধীরে দাঁড়াতে হবে। এতে মাথায় রক্ত চলাচল স্বাভাবিক থাকে ও মাথা ঘুরে পড়ে যাওয়া ঠেকানো যায়।',
  },
  {
    id: 'rule_3',
    titleBn: '💊 সকাল ও রাতের ওষুধ আলাদা রাখা',
    bodyBn:
      'ডায়াবেটিস ও প্রেসারের ওষুধ কখনোই এক পাত্রে জগাখিচুড়ি করে রাখা যাবে না। কালার কোডেড বক্স ব্যবহার করুন যাতে ভুলবশত রাতের ঘুমের ওষুধ সকালে না খান।',
  },
  {
    id: 'rule_4',
    titleBn: '🚨 হঠাৎ বিভ্রান্তি বা ঝিমুনি (Delirium Alert)',
    bodyBn:
      'মা-বাবা হঠাৎ কথা বলতে গিয়ে উল্টাপাল্টা বললে বা অতিরিক্ত ঝিমালে বুঝবেন প্রস্রাবে ইনফেকশন, সোডিয়াম কমে যাওয়া বা সাইড-এফেক্ট হয়েছে। অবিলম্বে ডাক্তার দেখান।',
  },
];
