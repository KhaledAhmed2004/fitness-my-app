import {
  EyeNutrientItem,
  VisionSymptomItem,
} from '@/types/diabetic-vision-shield';

export const VISION_SYMPTOMS_LIST: VisionSymptomItem[] = [
  {
    id: 'sym_halos',
    nameBn: 'আলোর চারপাশে রঙিন বলয় বা রংধনু দেখা',
    descriptionBn: 'লাইটের দিকে তাকালে চারদিকে রিং দেখা যাওয়া। এটি চোখের অভ্যন্তরীণ চাপ বৃদ্ধি (গ্লুকোমা)-এর লক্ষণ।',
    conditionTarget: 'GLAUCOMA',
    isEmergencyRedFlag: true,
  },
  {
    id: 'sym_floaters',
    nameBn: 'হঠাৎ কালো ছোপ বা মাকড়সার জালের মতো ভাসমান রেখা (Floaters)',
    descriptionBn: 'চোখের সামনে কালো মাছি ওড়ার মতো অনুভূতি। রেটিনায় রক্তক্ষরণ বা রেটিনাল টিয়ারের লক্ষণ।',
    conditionTarget: 'DIABETIC_RETINOPATHY',
    isEmergencyRedFlag: true,
  },
  {
    id: 'sym_cloudy',
    nameBn: 'দৃষ্টিশক্তি ঝাপসা বা কুয়াশাচ্ছন্ন হওয়া (Cloudy / Blurred Vision)',
    descriptionBn: 'রোদ বা কড়া আলোতে চোখ ধাঁধিয়ে যাওয়া বা চশমা বদলেও স্পষ্ট দেখতে না পাওয়া (ছানি বা ম্যাকুলার ফোলা)।',
    conditionTarget: 'CATARACT',
    isEmergencyRedFlag: false,
  },
  {
    id: 'sym_night_blind',
    nameBn: 'রাতে বা কম আলোতে দেখতে চরম অসুবিধা হওয়া',
    descriptionBn: 'আবছা আলোতে পথ চলতে সমস্যা হওয়া। রেটিনার রড সেলের দুর্বলতা বা ভিটামিন-এ ঘাটতি।',
    conditionTarget: 'DIABETIC_RETINOPATHY',
    isEmergencyRedFlag: false,
  },
  {
    id: 'sym_dry_burn',
    nameBn: 'চোখে খচখচ করা, বালু পড়ার মতো জ্বালাপোড়া ও পানি পড়া',
    descriptionBn: 'ডায়াবেটিসের কারণে চোখের কর্নিয়ার আর্দ্রতা কমে ড্রাই আই সিন্ড্রোম হওয়া।',
    conditionTarget: 'DRY_EYE',
    isEmergencyRedFlag: false,
  },
];

export const EYE_NUTRIENTS_CATALOG: EyeNutrientItem[] = [
  {
    id: 'nut_mola_fish',
    nameBn: 'দেশি ছোট মাছের মাথা ও চোখ (মলা, ঢেলা, কাচকি)',
    nutrientBn: 'ভিটামিন এ (রেটিনল) ও ডিএইচএ ওমেগা-৩',
    benefitBn:
      'রেটিনার ফটোরিসেপ্টর সেলকে পুষ্টি জোগায় এবং ডায়াবেটিক রেটিনোপ্যাথির অগ্রগতি রোধ করে।',
    sourceFoodBn: 'ছোট মাছের হালকা চচ্চড়ি বা পাতলা ঝোল।',
  },
  {
    id: 'nut_egg_yolk',
    nameBn: 'ডিমের কুসুম ও ভুট্টা',
    nutrientBn: 'লুটিন (Lutein) ও জিয়াজ্যান্থিন (Zeaxanthin)',
    benefitBn:
      'চোখের ম্যাকুলায় প্রাকৃতিক সানগ্লাস ফিল্টার হিসেবে কাজ করে ক্ষতিকর নীল আলো থেকে রেটিনাকে রক্ষা করে।',
    sourceFoodBn: 'প্রতিদিন সকালে ১টি সম্পূর্ণ ডিমের কুসুম।',
  },
  {
    id: 'nut_carrot_papaya',
    nameBn: 'কাঁচা গাজর, পাকা পেঁপে ও মিষ্টি আলু',
    nutrientBn: 'বিটা-ক্যারোটিন (Beta-Carotene)',
    benefitBn:
      'কর্নিয়া সুস্থ রাখে এবং রাতের দৃষ্টিশক্তি (Night Vision) প্রখর রাখতে সাহায্য করে।',
    sourceFoodBn: 'সালাদে কাঁচা গাজর ও মিষ্টি পাকা পেঁপে।',
  },
  {
    id: 'nut_spinach_greens',
    nameBn: 'পালং শাক, লালশাক ও সজনে পাতা',
    nutrientBn: 'অ্যান্টিঅক্সিডেন্ট ও জিংক',
    benefitBn:
      'চোখের লেন্সের প্রোটিন অক্ষত রেখে বয়সজনিত ছানি (Cataract) পড়া বিলম্বিত করে।',
    sourceFoodBn: 'হালকা তেলে রান্না করা টাটকা দেশি শাক।',
  },
];
