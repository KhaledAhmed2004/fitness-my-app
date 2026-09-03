import { RadiologyFindingDefinition } from '@/types/ai-imaging-explainer';

export const RADIOLOGY_FINDINGS_KNOWLEDGE_BASE: RadiologyFindingDefinition[] = [
  // =========================================================================
  // 1. CHEST X-RAY (বুকের এক্স-রে)
  // =========================================================================
  {
    id: 'xray_consolidation_pneumonia',
    modality: 'XRAY_CHEST',
    modalityNameBn: 'বুকের এক্স-রে (Chest X-Ray)',
    termEn: 'Consolidation / Patchy Opacity (Pneumonia / Lung Infection)',
    termBn: 'ফুসফুসে কফ জমা / নিউমোনিয়া বা ইনফেকশনের দাগ',
    keywords: ['consolidation', 'patchy opacity', 'opacity', 'pneumonia', 'infiltrate', 'hazy opacity'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 চিকিৎসকের পরামর্শ জরুরি (ইনফেকশন)',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'ফুসফুস (Lungs)',
    simpleExplanationBn:
      'ফুসফুসের কোনো অংশে কফ, মিউকাস বা ব্যাকটেরিয়াল প্রদাহের কারণে এক্স-রে ফিল্মে সাদা দাগ (Opacity) দেখা যাচ্ছে। এটি সাধারণত নিউমোনিয়া বা তীব্র ঠান্ডার কারণে হয়।',
    isItDangerousBn:
      'অযথা আতঙ্কিত হবেন না। সঠিক অ্যান্টিবায়োটিক ও কাশির চিকিৎসায় সাধারণত ৭ থেকে ১৪ দিনের মধ্যে এই কফ সম্পূর্ণ পরিষ্কার হয়ে যায়।',
    whatHappensNextBn:
      'ডাক্তার স্টেথোস্কোপ দিয়ে ফুসফুস পরীক্ষা করে কফ পরিষ্কার করার ওষুধ বা অ্যান্টিবায়োটিক কোর্স দেবেন। কোর্স শেষে এক্স-রে রিপিট করা হতে পারে।',
    suggestedDoctorQuestionsBn: [
      'স্যার, আমার কফ বা ইনফেকশন সারাতে কতদিনের অ্যান্টিবায়োটিক বা নেবুলাইজার লাগবে?',
      'এটি কি সংক্রামক বা পরিবারের অন্যদের ছড়াতে পারে?',
      'চিকিৎসা শেষ হওয়ার পর কি পুনরায় এক্স-রে করে নিশ্চিত হতে হবে?',
    ],
    lifestyleDietAdviceBn:
      'কুসুম গরম পানি, তুলসী-আদা চা, ও স্টিম ইনহেলেশন (গরম পানির ভাপ) নিন। ধূমপান ও ধুলোবালি সম্পূর্ণ এড়িয়ে চলুন।',
  },
  {
    id: 'xray_pleural_effusion',
    modality: 'XRAY_CHEST',
    modalityNameBn: 'বুকের এক্স-রে (Chest X-Ray)',
    termEn: 'Pleural Effusion (Blunting of Costophrenic Angle)',
    termBn: 'ফুসফুসের পর্দায় পানি জমা (Pleural Effusion)',
    keywords: ['pleural effusion', 'blunting', 'costophrenic angle', 'fluid in lung', 'cp angle'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 বিশেষ চিকিৎসা প্রয়োজন',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'ফুসফুসের পর্দা (Pleura)',
    simpleExplanationBn:
      'ফুসফুসের বাইরের আবরণে স্বাভাবিকের চেয়ে অতিরিক্ত তরল বা পানি জমেছে। এক্স-রে তে নিচের কোণটি (CP Angle) ভোঁতা দেখাচ্ছে।',
    isItDangerousBn:
      'দেরি না করে বক্ষব্যাধি বিশেষজ্ঞের কাছে যেতে হবে। পানি জমার কারণ (ইনফেকশন, হার্ট সমস্যা বা টিবি) শনাক্ত করে চিকিৎসা দিলে দ্রুত সুস্থ হওয়া যায়।',
    whatHappensNextBn:
      'চিকিৎসক প্রয়োজনবোধে রক্তের টেস্ট, স্পুটাম (কফ) টেস্ট বা সিরিঞ্জ দিয়ে অল্প পানি বের করে ল্যাব টেস্টের পরামর্শ দিতে পারেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, ফুসফুসে পানি জমার মূল কারণটি কী?',
      'পানি কি ওষুধের মাধ্যমেই শুকিয়ে যাবে নাকি সুঁই দিয়ে বের করতে হবে?',
      'শ্বাসকষ্ট বাড়লে তৎক্ষণাৎ কী পদক্ষেপ নেওয়া উচিত?',
    ],
    lifestyleDietAdviceBn:
      'লবণ কম খান এবং অতিরিক্ত ভারী পরিশ্রম থেকে বিরত থাকুন। চিকিৎসকের অনুমতি ছাড়া কোনো ভারী ওষুধ বন্ধ করবেন না।',
  },
  {
    id: 'xray_cardiomegaly',
    modality: 'XRAY_CHEST',
    modalityNameBn: 'বুকের এক্স-রে (Chest X-Ray)',
    termEn: 'Cardiomegaly (Enlarged Cardiac Silhouette / CTR > 50%)',
    termBn: 'হার্ট বা হৃৎপিণ্ডের আকার বড় হওয়া (Cardiomegaly)',
    keywords: ['cardiomegaly', 'cardiac silhouette', 'ctr >', 'enlarged heart', 'cardiac shadow'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 কার্ডিওলজিস্টের পরামর্শ জরুরি',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'হৃৎপিণ্ড (Heart)',
    simpleExplanationBn:
      'বুকের ছাতির তুলনায় হার্টের ছায়া ৫০% এর বেশি বড় দেখাচ্ছে। দীর্ঘদিনের অনিয়ন্ত্রিত উচ্চ রক্তচাপ বা হার্টের অতিরিক্ত চাপের কারণে এটি হতে পারে।',
    isItDangerousBn:
      'এটি হার্টের এক ধরনের ওয়ার্নিং সাইন। সময়মতো প্রেশার নিয়ন্ত্রণে রাখলে এবং হার্টের যত্ন নিলে এটি নিয়ন্ত্রণে থাকে।',
    whatHappensNextBn:
      'কার্ডিওলজিস্ট একটি ইকোকার্ডিওগ্রাম (Echo) ও ইসিজি করে হার্টের পাম্পিং ক্ষমতা ও ভালভ পরীক্ষা করবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, হার্টের আকার বড় হওয়ার কারণে আমার ইকোকার্ডিওগ্রাম (Echocardiogram) করানো দরকার কি?',
      'আমার প্রেশারের ওষুধের ডোজ কি পরিবর্তন করতে হবে?',
      'দৈনন্দিন হাঁটাচলা ও শরীরচর্চায় কোনো সীমাবদ্ধতা আছে কি?',
    ],
    lifestyleDietAdviceBn:
      'খাবারে কাঁচা লবণ ও অতিরিক্ত তেল-চর্বি সম্পূর্ণ বর্জন করুন। প্রতিদিন প্রেশার মাপুন ও রাতে ৮ ঘণ্টা ঘুমান।',
  },
  {
    id: 'xray_normal_chest',
    modality: 'XRAY_CHEST',
    modalityNameBn: 'বুকের এক্স-রে (Chest X-Ray)',
    termEn: 'Normal Chest Radiograph (Clear Lung Fields & Normal CTR)',
    termBn: 'সম্পূর্ণ স্বাভাবিক ফুসফুস ও হার্ট',
    keywords: ['clear lung fields', 'normal chest', 'normal study', 'both costophrenic', 'unremarkable'],
    severity: 'NORMAL',
    severityLabelBn: '🟢 আলহামদুলিল্লাহ সম্পূর্ণ স্বাভাবিক',
    badgeBg: 'rgba(32, 201, 151, 0.15)',
    badgeColor: '#20C997',
    anatomyRegionBn: 'বুক ও ফুসফুস (Normal)',
    simpleExplanationBn:
      'আপনার বুকের এক্স-রে সম্পূর্ণ পরিষ্কার। ফুসফুসে কোনো কফ, ইনফেকশন বা পানি নেই এবং হার্টের আকার একদম সঠিক রয়েছে।',
    isItDangerousBn:
      'কোনো ভয়ের কারণ নেই। আপনার ফুসফুস ও বুকের গঠন সম্পূর্ণ সুস্থ ও স্বাভাবিক।',
    whatHappensNextBn:
      'যদি এখনো কাশি থাকে, তবে তা নাকের এলার্জি (Post-nasal drip) বা গ্যাস্ট্রিক রিফ্লাক্সের কারণে হতে পারে।',
    suggestedDoctorQuestionsBn: [
      'স্যার, এক্স-রে স্বাভাবিক থাকা সত্ত্বেও কাশির জন্য কি কোনো অ্যালার্জির ড্রপ বা অ্যান্টাসিড দরকার?',
    ],
  },

  // =========================================================================
  // 2. BONE & JOINT X-RAY (হাড় ও জয়েন্টের এক্স-রে)
  // =========================================================================
  {
    id: 'bone_knee_osteoarthritis',
    modality: 'XRAY_BONE_JOINT',
    modalityNameBn: 'হাড় ও জয়েন্টের এক্স-রে (Knee / Joint X-Ray)',
    termEn: 'Knee Osteoarthritis / Reduced Joint Space',
    termBn: 'হাঁটুর কার্টিলেজ ক্ষয় ও জয়েন্ট স্পেস কমে যাওয়া (অস্টিওআর্থ্রাইটিস)',
    keywords: ['osteoarthritis', 'joint space narrowing', 'tibiofemoral', 'articular space', 'subchondral sclerosis'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 হাড়ের ক্ষয় - ফিজিওথেরাপি ও যত্ন প্রয়োজন',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'হাঁটুর জয়েন্ট (Knee Joint)',
    simpleExplanationBn:
      'হাঁটুর দুই হাড়ের মাঝখানের প্রাকৃতিক কুশন বা কার্টিলেজ বয়সের কারণে বা চাপে কিছুটা পাতলা হয়ে গেছে। ফলে হাড় কাছাকাছি চলে এসে ব্যথা হয়।',
    isItDangerousBn:
      'এটি একটি সাধারণ ও বয়সজনিত সমস্যা। সঠিক ব্যায়াম, ওজন নিয়ন্ত্রণ এবং নিচে বসা পরিহার করলে রোগী দীর্ঘদিন ব্যথামুক্ত থাকেন।',
    whatHappensNextBn:
      'অর্থোপেডিক বিশেষজ্ঞ ব্যথা কমানোর ওষুধ, ক্যালসিয়াম/ভিটামিন-ডি এবং কোয়াড্রিসেপস পেশী শক্তিশালী করার ফিজিওথেরাপি ব্যায়াম দেবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, আমার হাঁটুর ক্ষয়রোধে কোন কোন ফিজিওথেরাপি ব্যায়াম করতে হবে?',
      'হাই কমোড ব্যবহার ও চেয়ারে বসে নামাজ পড়া কি জরুরি?',
      'কার্টিলেজ সুরক্ষায় গ্লুকোসামিন বা কোনো সাপ্লিমেন্ট প্রয়োজন আছে কি?',
    ],
    lifestyleDietAdviceBn:
      'উবু হয়ে বসা, সিড়ি দিয়ে বারবার ওঠা-নামা এড়িয়ে চলুন। ওজন ৫-১০ কেজি কমালে হাঁটুর ওপর ৭০% চাপ কমে যায়।',
  },
  {
    id: 'bone_osteophytes',
    modality: 'XRAY_BONE_JOINT',
    modalityNameBn: 'হাড় ও জয়েন্টের এক্স-রে (Bone X-Ray)',
    termEn: 'Marginal Osteophytes (Bone Spurs)',
    termBn: 'হাড়ের কিনারায় বাড়তি হাড় বা কাঁটা বৃদ্ধি (Osteophytes)',
    keywords: ['osteophyte', 'osteophytes', 'bony spur', 'lipping', 'marginal osteophyte'],
    severity: 'MILD_EARLY',
    severityLabelBn: '🟡 মৃদু ক্ষয়জনিত পরিবর্তন',
    badgeBg: 'rgba(255, 184, 0, 0.15)',
    badgeColor: '#FFB800',
    anatomyRegionBn: 'হাড়ের সংযোগস্থল (Joint Margin)',
    simpleExplanationBn:
      'জয়েন্টের ভারসাম্য রক্ষা করতে শরীর প্রাকৃতিকভাবে হাড়ের কিনারায় সূক্ষ্ম বাড়তি হাড় (Spur) তৈরি করেছে। এটি কোনো টিউমার বা মারাত্মক রোগ নয়।',
    isItDangerousBn:
      'একদমই মারাত্মক কিছু নয়। এটি শুধু জয়েন্টের ক্ষয়জনিত বয়স বৃদ্ধির প্রমাণ। নিয়মিত স্ট্রেচিং ও ব্যয়ামে ব্যথা নিয়ন্ত্রণে থাকে।',
    whatHappensNextBn:
      'যদি ব্যথা থাকে তবে গরম সেক, ফিজিওথেরাপি ও সাপ্লিমেন্টের মাধ্যমে হাড়ের জয়েন্ট সচল রাখা হয়।',
    suggestedDoctorQuestionsBn: [
      'স্যার, বাড়তি হাড় কি অন্য নার্ভে চাপ দিচ্ছে?',
      'ব্যথা কমাতে গরম সেক না ঠান্ডা সেক কোনটি ভালো?',
    ],
  },
  {
    id: 'bone_calcaneal_spur',
    modality: 'XRAY_BONE_JOINT',
    modalityNameBn: 'গোড়ালির এক্স-রে (Heel / Foot X-Ray)',
    termEn: 'Calcaneal Spur / Plantar Fasciitis',
    termBn: 'গোড়ালির হাড় বৃদ্ধি ও প্লান্টার ফ্যাসাইটিস (সকালে পা ফেলতে ব্যথা)',
    keywords: ['calcaneal spur', 'spur', 'plantar fasciitis', 'heel spur'],
    severity: 'MILD_EARLY',
    severityLabelBn: '🟡 নরম জুতো ও এক্সারসাইজে নিরাময়যোগ্য',
    badgeBg: 'rgba(255, 184, 0, 0.15)',
    badgeColor: '#FFB800',
    anatomyRegionBn: 'পায়ের গোড়ালি (Heel)',
    simpleExplanationBn:
      'পায়ের গোড়ালির নিচে বাড়তি হাড় বা কাঁটার মতো সৃষ্টি হয়েছে। সকালে ঘুম থেকে উঠে প্রথম পা ফেলার সময় তীব্র ব্যথা অনুভব হয়।',
    isItDangerousBn:
      'এটি সম্পূর্ণ নিরাপদ ও নিরাময়যোগ্য সমস্যা। সঠিক সিলিকন হিল প্যাড ও ব্যয়ামে ২-৩ সপ্তাহের মধ্যে ব্যথা সেরে যায়।',
    whatHappensNextBn:
      'ডাক্তার নরম সিলিকন জুতো পরা, বরফ বোতল দিয়ে পায়ে রোলিং এক্সারসাইজ এবং ব্যথানাশক জেল ব্যবহারের পরামর্শ দেবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, গোড়ালির ব্যথায় সিলিকন হিল কাপ বা মেডিকেল জুতো ব্যবহার করব কিভাবে?',
      'কোন স্ট্রেচিং ব্যায়ামটি দিনে কতবার করা উচিত?',
    ],
    lifestyleDietAdviceBn:
      'খালি পায়ে শক্ত মেঝেতে হাঁটবেন না। ঘরে ও বাইরে সবসময় নরম সোলের জুতো ব্যবহার করুন।',
  },

  // =========================================================================
  // 3. WHOLE ABDOMEN USG (পেটের আল্ট্রাসনোগ্রাম)
  // =========================================================================
  {
    id: 'usg_fatty_liver_grade1',
    modality: 'USG_ABDOMEN',
    modalityNameBn: 'আল্ট্রাসনোগ্রাম (Whole Abdomen USG)',
    termEn: 'Grade 1 Fatty Liver (Mild Hepatic Steatosis)',
    termBn: 'ফ্যাটি লিভার গ্রেড-১ (লিভারে প্রাথমিক চর্বি জমা)',
    keywords: ['grade 1 fatty', 'grade i fatty', 'mild fatty liver', 'hepatic steatosis', 'increased liver echogenicity'],
    severity: 'MILD_EARLY',
    severityLabelBn: '🟡 প্রাথমিক পর্যায় - খাদ্য ও হাঁটায় ১০০% নিরাময়যোগ্য',
    badgeBg: 'rgba(255, 184, 0, 0.15)',
    badgeColor: '#FFB800',
    anatomyRegionBn: 'লিভার (Liver)',
    simpleExplanationBn:
      'লিভারের কোষে স্বাভাবিকের চেয়ে সামান্য অতিরিক্ত চর্বি জমা হয়েছে। এটি প্রাথমিক পর্যায় এবং লিভারের মূল কার্যক্ষমতা এখনো সম্পূর্ণ অক্ষত আছে।',
    isItDangerousBn:
      'একদমই ভয়ের কারণ নেই! বাংলাদেশের প্রায় ৫০% প্রাপ্তবয়স্কের এই গ্রেড-১ থাকে। মিষ্টি, তৈলাক্ত খাবার বাদ দিয়ে প্রতিদিন ৩০ মিনিট হাঁটলে চর্বি সম্পূর্ণ গলে যায়।',
    whatHappensNextBn:
      'ডাক্তার সাধারণত লিভার ফাংশন (SGPT) ও লিপিড প্রোফাইল চেক করে খাদ্যাভ্যাস পরিবর্তনের গাইড দেবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, আমার ফ্যাটি লিভার রিভার্স (সম্পূর্ণ দূর) করতে কোন কোন খাবার বাদ দেওয়া সবচেয়ে জরুরি?',
      'আমার কি কোনো লিভার সাপ্লিমেন্ট বা ভিটামিন-ই খাওয়ার প্রয়োজন আছে?',
      'কত মাস পর পুনরায় আল্ট্রাসনোগ্রাম করে দেখতে হবে?',
    ],
    lifestyleDietAdviceBn:
      'চিনির মিষ্টি, কোমল পানীয়, বিরিয়ানি ও পরোটা বন্ধ করুন। প্রতিদিন সকালে ও সন্ধ্যায় ১৫-২০ মিনিট দ্রুত হাঁটুন।',
  },
  {
    id: 'usg_gallstones_cholelithiasis',
    modality: 'USG_ABDOMEN',
    modalityNameBn: 'আল্ট্রাসনোগ্রাম (Whole Abdomen USG)',
    termEn: 'Cholelithiasis / Gallbladder Calculi (Gallstones)',
    termBn: 'পিত্তথলিতে পাথর (Cholelithiasis / Gallstones)',
    keywords: ['cholelithiasis', 'gallstone', 'gallbladder calculi', 'calculi in gallbladder', 'acoustic shadow'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 সার্জনের পরামর্শ অনুযায়ী করণীয় নির্ধারণ',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'পিত্তথলি (Gallbladder)',
    simpleExplanationBn:
      'পিত্তরসের কোলেস্টেরল বা লবণ জমে পিত্তথলির ভেতরে ছোট বা মাঝারি আকারের পাথর সৃষ্টি হয়েছে। পেটের ডানপাশে বা পিঠে তীব্র ব্যথা হতে পারে।',
    isItDangerousBn:
      'পাথর যদি পিত্তনালীতে আটকে না থাকে তবে জরুরি বিপদ নেই। তবে অতিরিক্ত তৈলাক্ত খাবার খেলে পিত্তথলিতে ইনফেকশন (Cholecystitis) হতে পারে।',
    whatHappensNextBn:
      'সার্জন পরীক্ষা করে দেখবেন পাথর কোনো প্রদাহ করছে কি না। লক্ষণযুক্ত হলে ল্যাপারোস্কোপিক (ছিদ্র করে) পিত্তথলি অপসারণই আধুনিক স্ট্যান্ডার্ড চিকিৎসা।',
    suggestedDoctorQuestionsBn: [
      'স্যার, পাথরের আকার কত এবং পিত্তথলির দেয়ালে কোনো প্রদাহ (Thickening) আছে কি?',
      'আমার কি এখনই ল্যাপারোস্কোপিক অপারেশন প্রয়োজন নাকি অপেক্ষা করা যাবে?',
      'ব্যথা শুরু হলে জরুরি প্রাথমিক চিকিৎসা কী হবে?',
    ],
    lifestyleDietAdviceBn:
      'ডুবো তেলে ভাজা খাবার, মাটন ও চর্বিযুক্ত খাবার এড়িয়ে চলুন। অল্প অল্প করে দিনে ৪-৫ বার হালকা খাবার খান।',
  },
  {
    id: 'usg_renal_calculus',
    modality: 'USG_ABDOMEN',
    modalityNameBn: 'আল্ট্রাসনোগ্রাম (KUB / Abdomen USG)',
    termEn: 'Renal Calculus / Nephrolithiasis (Kidney Stone)',
    termBn: 'কিডনিতে পাথর (Renal Calculus)',
    keywords: ['renal calculus', 'kidney stone', 'nephrolithiasis', 'renal calculi', 'calculus in kidney'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 পরিমাপ অনুযায়ী চিকিৎসা জরুরি',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'কিডনি (Kidney / KUB)',
    simpleExplanationBn:
      'কিডনির ভেতরে ইউরিক এসিড বা ক্যালসিয়াম জমে পাথর তৈরি হয়েছে। কোমরের পেছনের দিকে তীব্র খিঁচুনির মতো ব্যথা ও প্রস্রাবে জ্বালাপোড়া হতে পারে।',
    isItDangerousBn:
      'পাথরের আকার ৫ মিলিমিটারের (5mm) কম হলে প্রচুর পানি খেলে তা প্রাকৃতিকভাবেই প্রস্রাবের সাথে বের হয়ে যায়। বড় হলে চিকিৎসা প্রয়োজন।',
    whatHappensNextBn:
      'ইউরোলজিস্ট পাথরের সাইজ ও অবস্থান দেখে ওষুধ দিয়ে গলানোর চেষ্টা করবেন অথবা লেজার শকওয়েভ (ESWL) থেরাপির পরামর্শ দেবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, পাথরের সাইজ কত মিলিমিটার এবং এটি কি কিডনির কোনো নালী ব্লক করছে?',
      'দৈনিক কত লিটার পানি খাওয়া উচিত এবং কোন খাবারগুলো (যেমন পালং শাক, লাল মাংস) বর্জন করতে হবে?',
      'পাথর প্রস্রাব দিয়ে বের হতে কতদিন সময় লাগতে পারে?',
    ],
    lifestyleDietAdviceBn:
      'প্রতিদিন ৩ থেকে ৩.৫ লিটার বিশুদ্ধ পানি পান করুন। অতিরিক্ত লবণ, কোমল পানীয় ও অক্সালেট যুক্ত খাবার কমান।',
  },

  // =========================================================================
  // 4. SPINE & BRAIN MRI / CT SCAN (এমআরআই ও সিটি স্ক্যান)
  // =========================================================================
  {
    id: 'mri_lumbar_plid',
    modality: 'MRI_CT_SPINE_BRAIN',
    modalityNameBn: 'এমআরআই / সিটি স্ক্যান (Spine MRI)',
    termEn: 'Lumbar Disc Herniation / PLID (L4-L5 / L5-S1 Protrusion)',
    termBn: 'কোমরের ডিস্ক প্রল্যাপ্স ও নার্ভে চাপ (PLID / সায়াটিকা)',
    keywords: ['plid', 'disc protrusion', 'disc herniation', 'thecal sac', 'nerve root compression', 'l4-l5', 'l5-s1'],
    severity: 'MODERATE_NEEDS_CARE',
    severityLabelBn: '🟠 নার্ভে চাপ - নিউরো/ফিজিওথেরাপি প্রয়োজন',
    badgeBg: 'rgba(255, 146, 43, 0.15)',
    badgeColor: '#FF922B',
    anatomyRegionBn: 'কোমর ও মেরুদণ্ড (Lumbar Spine)',
    simpleExplanationBn:
      'কোমরের মেরুদণ্ডের দুই হাড়ের মাঝের ডিস্ক স্থানচ্যুত হয়ে পেছনের প্রধান স্নায়ু বা নার্ভ রুটে চাপ দিচ্ছে। ফলে কোমর থেকে ব্যথা পা পর্যন্ত ছড়িয়ে যায় (সায়াটিকা)।',
    isItDangerousBn:
      'অধিকাংশ ক্ষেত্রেই (৯০%) সার্জারি ছাড়া সঠিক ফিজিওথেরাপি, লাম্বার ট্র্যাকশন, বিশ্রাম ও ওষুধেই রোগী সম্পূর্ণ সুস্থ হন।',
    whatHappensNextBn:
      'নিউরোসার্জন বা স্পাইন স্পেশালিস্ট নার্ভের প্রদাহ কমানোর ওষুধ ও ব্যাক এক্সটেনশন ব্যায়ামের দিকনির্দেশনা দেবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, নার্ভে চাপের মাত্রা কেমন এবং এটি কি ফিজিওথেরাপিতে নিরাময় সম্ভব?',
      'সামনে ঝুঁকে কাজ করা বা ভারী ওজন তোলার বিষয়ে কী কী বিধিনিষেধ মানতে হবে?',
      'কোন কোন বিপদের লক্ষণে (যেমন প্রস্রাব আটকে যাওয়া বা পা অবশ হওয়া) অবিলম্বে হাসপাতালে আসতে হবে?',
    ],
    lifestyleDietAdviceBn:
      'সামনে ঝুঁকে ভারী জিনিস তুলবেন না। শক্ত ও সমান বিছানায় ঘুমাবেন এবং দীর্ঘক্ষণ টানা বসে থাকবেন না।',
  },
  {
    id: 'ct_maxillary_sinusitis',
    modality: 'MRI_CT_SPINE_BRAIN',
    modalityNameBn: 'সিটি স্ক্যান / এক্স-রে (PNS CT / X-Ray)',
    termEn: 'Maxillary Sinusitis / Mucosal Thickening',
    termBn: 'নাকের পাশের সাইনাসে প্রদাহ ও কফ জমা (ম্যাক্সিলারি সাইনোসাইটিস)',
    keywords: ['sinusitis', 'mucosal thickening', 'maxillary sinus', 'pns', 'hazy sinus'],
    severity: 'MILD_EARLY',
    severityLabelBn: '🟡 ইএনটি চিকিৎসা ও ভাপে নিরাময়যোগ্য',
    badgeBg: 'rgba(255, 184, 0, 0.15)',
    badgeColor: '#FFB800',
    anatomyRegionBn: 'নাক ও সাইনাস (PNS)',
    simpleExplanationBn:
      'নাকের দুই পাশের সাইনাসের ভেতরের দেয়ালে ধুলোবালি বা অ্যালার্জির কারণে প্রদাহ হয়ে মিউকাস জমেছে। এর ফলে কপালে ও চোখের নিচে ভারি ভাব বা মাথাব্যথা হয়।',
    isItDangerousBn:
      'এটি একটি অতি সাধারণ এলার্জিক সমস্যা। অ্যান্টি-হিস্টামিন ড্রপ, নেজাল স্প্রে ও গরম পানির ভাপেই দ্রুত প্রশান্তি মেলে।',
    whatHappensNextBn:
      'ইএনটি (নাক-কান-গলা) বিশেষজ্ঞ সাইনাসের ড্রেনেজ পরিষ্কারের স্প্রে এবং অ্যান্টিবায়োটিক বা অ্যালার্জির ওষুধ দেবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, সাইনাস পরিষ্কার রাখতে কোন নেজাল স্প্রে ও কতদিন ব্যবহার করতে হবে?',
      'ধুলাবালি ও ঠান্ডা এড়াতে কোনো বিশেষ সতর্কতা প্রয়োজন কি?',
    ],
  },

  // =========================================================================
  // 5. ECG & ECHOCARDIOGRAM (ইসিজি ও ইকো)
  // =========================================================================
  {
    id: 'ecg_sinus_tachycardia',
    modality: 'ECG_ECHO',
    modalityNameBn: 'ইসিজি ও ইকো (Heart ECG & Echo)',
    termEn: 'Sinus Tachycardia (Heart Rate > 100 bpm)',
    termBn: 'সাইনাস ট্যাকিকার্ডিয়া (হৃদস্পন্দন দ্রুত হওয়া / বুক ধড়ফড়)',
    keywords: ['sinus tachycardia', 'tachycardia', 'heart rate > 100', 'rapid heart rate'],
    severity: 'MILD_EARLY',
    severityLabelBn: '🟡 উদ্বেগ, জ্বর বা রক্তস্বল্পতার লক্ষণ হতে পারে',
    badgeBg: 'rgba(255, 184, 0, 0.15)',
    badgeColor: '#FFB800',
    anatomyRegionBn: 'হার্ট রেট (Heart Rate)',
    simpleExplanationBn:
      'ইসিজিতে আপনার হৃদস্পন্দন প্রতি মিনিটে ১০০ বারের বেশি রেকর্ড হয়েছে। এটি অতিরিক্ত মানসিক চাপ, রক্তস্বল্পতা (Anemia), থাইরয়েড বৃদ্ধি বা ক্যাফেইনের কারণে হতে পারে।',
    isItDangerousBn:
      'যদি কোনো তীব্র বুকে ব্যথা না থাকে, তবে সাধারণত এটি বিপদের কিছু নয়। কারণ খুঁজে সমাধান করলে হার্ট রেট স্বাভাবিক হয়ে যায়।',
    whatHappensNextBn:
      'চিকিৎসক হিমোগ্লোবিন, থাইরয়েড (TSH) ও ইলেক্ট্রলাইট টেস্ট করে দ্রুত স্পন্দনের কারণ শনাক্ত করবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, দ্রুত হৃদস্পন্দনের পেছনে রক্তস্বল্পতা বা থাইরয়েডের কোনো যোগসূত্র আছে কি?',
      'বুক ধড়ফড় কমাতে কি কোনো ওষুধ বা রিলাক্সেশন থেরাপি প্রয়োজন?',
    ],
  },
  {
    id: 'ecg_ischemic_st_t',
    modality: 'ECG_ECHO',
    modalityNameBn: 'ইসিজি ও ইকো (Heart ECG & Echo)',
    termEn: 'ST-T Wave Changes / Myocardial Ischemia',
    termBn: 'হার্টে রক্ত প্রবাহে সাময়িক ঘাটতি (Ischemia / ST-T পরিবর্তন)',
    keywords: ['st depression', 't inversion', 'ischemia', 'st-t changes', 'ischemic changes'],
    severity: 'CRITICAL_URGENT',
    severityLabelBn: '🔴 কার্ডিওলজিস্টের জরুরি মূল্যায়ন প্রয়োজন',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeColor: '#EF4444',
    anatomyRegionBn: 'হৃদপেশী (Myocardium)',
    simpleExplanationBn:
      'ইসিজির তরঙ্গে দেখা যাচ্ছে হৃদযন্ত্রের নির্দিষ্ট অংশে রক্ত ও অক্সিজেনের সরবরাহ সাময়িকভাবে কমে গেছে। এটি রক্তনালীতে চর্বি বা ব্লকের ইঙ্গিত হতে পারে।',
    isItDangerousBn:
      'এটি একটি সতর্কতামূলক রিপোর্ট। বুকে চাপ, ভারী লাগা বা বাম হাতে ব্যথা ছড়ালে অবহেলা না করে দ্রুত হৃদরোগ হাসপাতালে যেতে হবে।',
    whatHappensNextBn:
      'কার্ডিওলজিস্ট ট্রপোনিন-আই টেস্ট, ইকোকার্ডিওগ্রাম ও প্রয়োজনবোধে এনজিওগ্রাম (Coronary Angiogram) করে ব্লকের পরিমাণ নির্ণয় করবেন।',
    suggestedDoctorQuestionsBn: [
      'স্যার, আমার এই ইসিজি পরিবর্তনের জন্য কি ইকো বা এনজিওগ্রাম পরীক্ষা প্রয়োজন?',
      'জরুরি রক্ত পাতলা রাখার ওষুধ বা নাইট্রেট স্প্রে সাথে রাখার দরকার আছে কি?',
    ],
    lifestyleDietAdviceBn:
      'ধূমপান অবিলম্বে সম্পূর্ণ বন্ধ করুন। অতিরিক্ত তেল, খাসির মাংস ও লবণ বর্জন করুন।',
  },
];
