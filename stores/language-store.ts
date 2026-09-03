import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { LanguageCode, LanguageInfo } from '@/types/language';
import {
  CLINICAL_TERMS_MAP,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '@/constants/translations';

const LANGUAGE_STORAGE_KEY = 'vital_app_language_v1';

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

interface LanguageState {
  currentLanguage: LanguageCode;
  supportedLanguages: LanguageInfo[];
  isLoaded: boolean;

  loadLanguage: () => Promise<void>;
  setLanguage: (lang: LanguageCode) => Promise<void>;

  // Translation helpers
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
  translateClinical: (term: string) => string;
  getLocalizedSOSMessage: (data: {
    name: string;
    bloodGroup: string;
    allergies: string;
    conditions: string;
    locationUrl?: string;
    qrUrl?: string;
  }) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: 'en',
  supportedLanguages: SUPPORTED_LANGUAGES,
  isLoaded: false,

  loadLanguage: async () => {
    try {
      const saved = await getStorageItem(LANGUAGE_STORAGE_KEY);
      if (saved && ['en', 'bn', 'es', 'ar', 'hi', 'fr', 'de'].includes(saved)) {
        set({ currentLanguage: saved as LanguageCode, isLoaded: true });
      } else {
        set({ currentLanguage: 'en', isLoaded: true });
      }
    } catch {
      set({ currentLanguage: 'en', isLoaded: true });
    }
  },

  setLanguage: async (lang: LanguageCode) => {
    void Haptics.selectionAsync().catch(() => {});
    set({ currentLanguage: lang });
    try {
      await setStorageItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  },

  t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
    const { currentLanguage } = get();
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'];
    let text = langDict[key] || TRANSLATIONS['en']?.[key] || fallback || key;

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
      });
    }

    return text;
  },

  translateClinical: (term: string) => {
    if (!term) return '';
    const { currentLanguage } = get();
    if (currentLanguage === 'en') return term;

    // Check exact term match
    if (CLINICAL_TERMS_MAP[term]?.[currentLanguage]) {
      return CLINICAL_TERMS_MAP[term][currentLanguage];
    }

    // Check case-insensitive / partial mappings
    const lower = term.toLowerCase().trim();
    for (const [key, mapping] of Object.entries(CLINICAL_TERMS_MAP)) {
      if (key.toLowerCase() === lower && mapping[currentLanguage]) {
        return mapping[currentLanguage];
      }
    }

    return term;
  },

  getLocalizedSOSMessage: (data) => {
    const { currentLanguage } = get();
    const { name, bloodGroup, allergies, conditions, locationUrl, qrUrl } = data;

    if (currentLanguage === 'bn') {
      return `
🚨 জরুরী মেডিকেল এসওএস সতর্কতা!
----------------------------------
রোগীর নাম: ${name || 'খালিদ হোসেন'}
রক্তের গ্রুপ: ${bloodGroup || 'B+'}
মারাত্মক অ্যালার্জি: ${allergies || 'পেনিসিলিন'}
ক্রনিক রোগ: ${conditions || 'উচ্চ রক্তচাপ'}

📍 লাইভ জিপিএস লোকেশন:
${locationUrl || 'উপলব্ধ নয়'}

🆔 ডিজিটাল মেডিকেল আইডি:
${qrUrl || 'https://trackme.health/emergency/token'}

(TrackMe Family Health OS থেকে স্বয়ংক্রিয়ভাবে প্রেরিত)
`.trim();
    }

    if (currentLanguage === 'es') {
      return `
🚨 ¡ALERTA MÉDICA DE EMERGENCIA SOS!
----------------------------------
Paciente: ${name || 'Paciente'}
Grupo Sanguíneo: ${bloodGroup || 'B+'}
Alergias Críticas: ${allergies || 'Ninguna'}
Condiciones Médicas: ${conditions || 'Ninguna'}

📍 Ubicación GPS en Vivo:
${locationUrl || 'No disponible'}

🆔 Tarjeta Médica Digital:
${qrUrl || 'https://trackme.health/emergency/token'}
`.trim();
    }

    if (currentLanguage === 'ar') {
      return `
🚨 نداء استغاثة طبي طارئ SOS!
----------------------------------
اسم المريض: ${name || 'المريض'}
فصيلة الدم: ${bloodGroup || 'B+'}
الحساسية الشديدة: ${allergies || 'لا يوجد'}
الأمراض المزمنة: ${conditions || 'لا يوجد'}

📍 موقع GPS المباشر:
${locationUrl || 'غير متوفر'}

🆔 الهوية الطبية الرقمية:
${qrUrl || 'https://trackme.health/emergency/token'}
`.trim();
    }

    // Default English
    return `
🚨 EMERGENCY MEDICAL SOS ALERT!
----------------------------------
Patient: ${name || 'Khaled Hossain'}
Blood Group: ${bloodGroup || 'B+'}
Critical Allergies: ${allergies || 'Penicillin'}
Chronic Conditions: ${conditions || 'Hypertension'}

📍 Live GPS Location:
${locationUrl || 'Location unavailable'}

🆔 Digital Emergency Medical ID:
${qrUrl || 'https://trackme.health/emergency/token'}

(Sent securely via TrackMe Family Health OS)
`.trim();
  },
}));
