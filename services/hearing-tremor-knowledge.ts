import {
  AdaptiveAidItem,
  ParkinsonSymptomItem,
} from '@/types/hearing-tremor-shield';

export const HEARING_CHECKLIST_QUESTIONS = [
  {
    id: 'h_tv_vol',
    questionBn: 'টেলিভিশন বা মোবাইলের ভলিউম পরিবারের অন্যদের তুলনায় অতিরিক্ত বেশি রাখতে হয়?',
    points: 2,
  },
  {
    id: 'h_noisy_crowd',
    questionBn: 'দোকান, বিয়ের অনুষ্ঠান বা কোলাহলপূর্ণ জায়গায় মানুষের কথা বুঝতে কষ্ট হয়?',
    points: 2,
  },
  {
    id: 'h_repeat_asking',
    questionBn: 'কথা স্পষ্ট বুঝতে না পেরে অন্যদের বারবার একই কথা পুনরাবৃত্তি করতে বলেন?',
    points: 2,
  },
  {
    id: 'h_phone_call',
    questionBn: 'ফোনে কথা বলার সময় কান চেপে ধরতে হয় বা উল্টোদিকের কথা অস্পষ্ট শোনেন?',
    points: 2,
  },
  {
    id: 'h_high_pitch',
    questionBn: 'ছোট বাচ্চাদের চিকন কণ্ঠের কথা বা দরজার কলিং বেলের আওয়াজ শুনতে পান না?',
    points: 2,
  },
];

export const PARKINSONS_SYMPTOMS_LIST: ParkinsonSymptomItem[] = [
  {
    id: 'pk_pill_roll',
    nameBn: 'আঙুলে বড়ি পাকানোর মতো কাঁপুনি (Pill-rolling Tremor)',
    descriptionBn: 'বৃদ্ধাঙ্গুলি ও তর্জনী নিজে থেকেই গোল করে নাড়াচাড়া করা বা হাত স্থির থাকলে কাঁপা।',
    isCoreMotorSign: true,
  },
  {
    id: 'pk_micrographia',
    nameBn: 'হাতের লেখা অস্বাভাবিক ছোট হয়ে যাওয়া (Micrographia)',
    descriptionBn: 'স্বাক্ষর বা লেখার অক্ষর আগের চেয়ে অনেক ছোট ও জড়িয়ে যাওয়া।',
    isCoreMotorSign: true,
  },
  {
    id: 'pk_shuffling',
    nameBn: 'ছোট ছোট পা ফেলে হাঁটা ও সামনে ঝুঁকে যাওয়া (Shuffling Gait)',
    descriptionBn: 'পা মেঝে থেকে কম উঁচু করে দ্রুত ছোট ছোট পদক্ষেপে হাঁটা।',
    isCoreMotorSign: true,
  },
  {
    id: 'pk_masked_face',
    nameBn: 'মুখের অভিব্যক্তিহীন ভাব বা চোখের পলক কম পড়া (Masked Face)',
    descriptionBn: 'হাসি বা আবেগের স্বাভাবিক চোখের ও মুখের নড়াচড়া কমে শান্ত/স্থির থাকা।',
    isCoreMotorSign: true,
  },
  {
    id: 'pk_soft_voice',
    nameBn: 'কথা খুব নিচু ও অস্পষ্ট হয়ে যাওয়া (Hypophonia)',
    descriptionBn: 'গলার স্বরের তীব্রতা কমে খুব ধীর বা ফিসফিস করে কথা বলা।',
    isCoreMotorSign: false,
  },
];

export const ADAPTIVE_AIDS_CATALOG: AdaptiveAidItem[] = [
  {
    id: 'aid_weighted_spoon',
    nameBn: 'ভারী ও মোটা হাতলযুক্ত চামচ (Weighted Utensils)',
    category: 'TREMOR_AID',
    benefitBn: 'চামচে অতিরিক্ত ওজন থাকার কারণে হাত কাঁপলেও খাবার মেঝেতে পড়ে না।',
    tipBn: 'চামচের হাতলে সিলিকন গ্রিপার ব্যবহার করলে সহজে মুঠো করা যায়।',
  },
  {
    id: 'aid_double_handle_mug',
    nameBn: 'দুই হাতলযুক্ত ঢাকনাওয়ালা মাগ (Double-Handled Cup)',
    category: 'TREMOR_AID',
    benefitBn: 'গরম চা বা পানি খাওয়ার সময় দুই হাত দিয়ে ধরে স্থিতিশীল রাখা যায়।',
    tipBn: 'সিপি কাপের মতো ঢাকনা থাকলে পানি ছলকে পড়ার কোনো ঝুঁকি থাকে না।',
  },
  {
    id: 'aid_visual_doorbell',
    nameBn: 'আলোর ফ্ল্যাশযুক্ত উচ্চ ফ্রিকোয়েন্সি কলিং বেল',
    category: 'HEARING_AID',
    benefitBn: 'কানে কম শুনলেও দরজায় কেউ এলে উজ্জ্বল এলইডি লাইট জ্বলে ওঠে।',
    tipBn: 'ঘরের লিভিং রুম ও বেডরুমে রিমোট লাইট রিসিভার প্লাগ-ইন করে রাখুন।',
  },
  {
    id: 'aid_face_to_face_talk',
    nameBn: 'সামনাসামনি স্পষ্ট উচ্চারণে কথা বলার অভ্যাস',
    category: 'HEARING_AID',
    benefitBn: 'বয়স্ক ব্যক্তিরা ঠোঁটের নড়াচড়া (Lip Reading) দেখে কথা ৭০% সহজে বোঝেন।',
    tipBn: 'চিৎকার না করে মুখের দিকে তাকিয়ে ধীরেসুস্থে প্রতিটি শব্দ উচ্চারণ করুন।',
  },
];
