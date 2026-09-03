export type LanguageCode = 'en' | 'bn' | 'es' | 'ar' | 'hi' | 'fr' | 'de';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  direction: 'ltr' | 'rtl';
}

export type TranslationKey = string;
