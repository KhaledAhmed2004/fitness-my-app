export type EmergencyCategory =
  | 'ALL'
  | 'NATIONAL_GOVT' // 999, 16263, 333
  | 'AMBULANCE_ICU' // ICU, NICU, AC, Freezer
  | 'OXYGEN_CYLINDER' // Medical Oxygen 24/7
  | 'PHARMACY_24_7' // Lazz Pharma, Arogga, DMC Gate
  | 'BLOOD_BANK' // Quantum, Red Crescent, Sandhani
  | 'CUSTOM_SAVED'; // User's own saved local contacts

export type DivisionCity =
  | 'ALL_BD'
  | 'DHAKA'
  | 'CHITTAGONG'
  | 'SYLHET'
  | 'RAJSHAHI'
  | 'KHULNA'
  | 'BARISAL'
  | 'RANGPUR';

export interface EmergencyContactItem {
  id: string;
  name: string; // e.g. "Alif ICU Ambulance Service"
  nameBn: string; // e.g. "আলিফ আইসিইউ অ্যাম্বুলেন্স সার্ভিস"
  category: EmergencyCategory;
  city: DivisionCity;
  areaDescriptionBn: string; // e.g. "ঢাকা ও সারাদেশে ২৪ ঘণ্টা সার্ভিস"
  primaryPhone: string; // e.g. "01711-xxxxxx"
  alternatePhone?: string;
  whatsappPhone?: string;
  is24x7: boolean;
  isGovernment: boolean;
  servicesProvidedBn: string[]; // ["ICU সাপোর্ট", "ভেন্টিলেটর", "অক্সিজেন"]
  badgeColor?: string;
  isVerified: boolean;
  isCustom?: boolean;
}
