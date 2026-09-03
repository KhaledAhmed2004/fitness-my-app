import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

import { EMERGENCY_HOTLINE_CATALOG } from '@/services/emergency-hotline-catalog';
import {
  DivisionCity,
  EmergencyCategory,
  EmergencyContactItem,
} from '@/types/emergency-hotline';

const SECURE_STORAGE_KEY = 'trackme_emergency_hotlines_v1';

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(name, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(name);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

interface EmergencyHotlineState {
  customContacts: EmergencyContactItem[];
  recentCalledIds: string[];
  selectedCity: DivisionCity;
  selectedCategory: EmergencyCategory;

  // Actions
  setSelectedCity: (city: DivisionCity) => void;
  setSelectedCategory: (category: EmergencyCategory) => void;
  addCustomContact: (
    contact: Omit<EmergencyContactItem, 'id' | 'isCustom' | 'isVerified'>
  ) => void;
  deleteCustomContact: (id: string) => void;
  logRecentCall: (id: string) => void;
  getAllContacts: () => EmergencyContactItem[];
}

export const useEmergencyHotlineStore = create<EmergencyHotlineState>()(
  persist(
    (set, get) => ({
      customContacts: [
        {
          id: 'custom_sample_doc',
          name: 'Personal Family Doctor',
          nameBn: 'পারিবারিক ডাক্তার (ডা. রফিকুল ইসলাম)',
          category: 'CUSTOM_SAVED',
          city: 'DHAKA',
          areaDescriptionBn: 'জরুরি প্রেসক্রিপশন ও পরামর্শের জন্য ব্যক্তিগত নম্বর',
          primaryPhone: '01712998877',
          whatsappPhone: '+8801712998877',
          is24x7: false,
          isGovernment: false,
          servicesProvidedBn: ['টেলিমেডিসিন', 'জরুরি পরামর্শ'],
          badgeColor: '#8B5CF6',
          isVerified: true,
          isCustom: true,
        },
      ],
      recentCalledIds: [],
      selectedCity: 'ALL_BD',
      selectedCategory: 'ALL',

      setSelectedCity: (city) => set({ selectedCity: city }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      addCustomContact: (data) => {
        const newContact: EmergencyContactItem = {
          ...data,
          id: `custom_${Date.now()}`,
          isCustom: true,
          isVerified: true,
        };
        set((state) => ({
          customContacts: [newContact, ...state.customContacts],
        }));
      },

      deleteCustomContact: (id) => {
        set((state) => ({
          customContacts: state.customContacts.filter((c) => c.id !== id),
        }));
      },

      logRecentCall: (id) => {
        set((state) => {
          const filtered = state.recentCalledIds.filter((item) => item !== id);
          return {
            recentCalledIds: [id, ...filtered].slice(0, 5),
          };
        });
      },

      getAllContacts: () => {
        const { customContacts } = get();
        return [...customContacts, ...EMERGENCY_HOTLINE_CATALOG];
      },
    }),
    {
      name: SECURE_STORAGE_KEY,
      storage: createJSONStorage(() => customStorage),
    }
  )
);
