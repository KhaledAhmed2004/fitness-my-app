// stores/blood-network-store.ts
// Emergency Blood Response Network - Zustand Store
// WARNING: LOCAL PROTOTYPE MODE only. No cross-device sync.

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  BloodCircleContact,
  BloodComponent,
  BloodRequest,
  BloodRequestStatus,
  DonationHistoryEntry,
  DonorAvailabilityStatus,
  DonorResponse,
  EmergencyLevel,
  HospitalVerification,
} from '@/types/blood-network';
import { BloodGroup } from '@/types/health-vault';
import { computeExpiresAt, createInitialSosWaves } from '@/services/blood-network-service';

const BLOOD_NETWORK_KEY = 'vital_blood_network_v1';

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') { return localStorage.getItem(key); }
  return SecureStore.getItemAsync(key);
}

const uid = (prefix: string) =>
  prefix + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

const nowIso = () => new Date().toISOString();

const SEED_CIRCLE: BloodCircleContact[] = [
  {
    id: 'bc_father', name: 'Father', relationship: 'FATHER',
    phone: '+880-1700-000001', phoneVisibility: 'ALWAYS', isDonor: true,
    donorProfile: { bloodGroup: 'B+', availabilityStatus: 'AVAILABLE',
      lastDonationDate: new Date(Date.now() - 104*86400000).toISOString().split('T')[0],
      donationHistory: [], cooldownEstimateDays: 90 },
    createdAt: nowIso(),
  },
  {
    id: 'bc_brother', name: 'Brother', relationship: 'SIBLING',
    phone: '+880-1700-000002', phoneVisibility: 'ALWAYS', isDonor: true,
    donorProfile: { bloodGroup: 'O+', availabilityStatus: 'AVAILABLE',
      lastDonationDate: new Date(Date.now() - 130*86400000).toISOString().split('T')[0],
      donationHistory: [], cooldownEstimateDays: 90 },
    createdAt: nowIso(),
  },
  {
    id: 'bc_rahim', name: 'Rahim (Friend)', relationship: 'FRIEND',
    phone: '+880-1800-000003', phoneVisibility: 'ALWAYS', isDonor: true,
    donorProfile: { bloodGroup: 'A+', availabilityStatus: 'MAYBE',
      lastDonationDate: new Date(Date.now() - 45*86400000).toISOString().split('T')[0],
      donationHistory: [], cooldownEstimateDays: 90 },
    createdAt: nowIso(),
  },
];

const SEED_HISTORY: DonationHistoryEntry[] = [
  { id: 'dh_1', donationDate: new Date(Date.now()-200*86400000).toISOString().split('T')[0],
    component: 'PACKED_RBC', hospitalOrBloodBank: 'Dhaka Medical College Blood Bank' },
  { id: 'dh_2', donationDate: new Date(Date.now()-104*86400000).toISOString().split('T')[0],
    component: 'PACKED_RBC', hospitalOrBloodBank: 'Popular Diagnostic Centre' },
];

export interface CreateBloodRequestPayload {
  patientName: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequired: number;
  emergencyLevel: EmergencyLevel;
  neededBy: string;
  hospitalName: string;
  hospitalAddress?: string;
  contactPerson: string;
  contactPhone: string;
  hospitalVerification: HospitalVerification;
}

interface BloodNetworkState {
  myBloodGroup: BloodGroup;
  myAvailabilityStatus: DonorAvailabilityStatus;
  myDonationHistory: DonationHistoryEntry[];
  myCircle: BloodCircleContact[];
  activeRequests: BloodRequest[];
  pastRequests: BloodRequest[];
  isLoaded: boolean;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => void;
  setMyBloodGroup: (group: BloodGroup) => void;
  setMyAvailability: (status: DonorAvailabilityStatus) => void;
  logDonation: (entry: Omit<DonationHistoryEntry, 'id'>) => void;
  addCircleMember: (member: Omit<BloodCircleContact, 'id' | 'createdAt'>) => void;
  updateCircleMember: (id: string, patch: Partial<BloodCircleContact>) => void;
  removeCircleMember: (id: string) => void;
  createBloodRequest: (payload: CreateBloodRequestPayload) => BloodRequest;
  cancelRequest: (requestId: string, reason: string) => void;
  markFulfilled: (requestId: string) => void;
  updateDonorResponse: (requestId: string, response: DonorResponse) => void;
  advanceSosWave: (requestId: string) => void;
  updateRequestStatus: (requestId: string, status: BloodRequestStatus) => void;
}

export const useBloodNetworkStore = create<BloodNetworkState>()((set, get) => ({
  myBloodGroup: 'B+',
  myAvailabilityStatus: 'AVAILABLE',
  myDonationHistory: SEED_HISTORY,
  myCircle: SEED_CIRCLE,
  activeRequests: [],
  pastRequests: [],
  isLoaded: false,

  loadFromStorage: async () => {
    try {
      const raw = await getStorageItem(BLOOD_NETWORK_KEY);
      if (raw) { const p = JSON.parse(raw); set({ ...p, isLoaded: true }); }
      else { set({ isLoaded: true }); }
    } catch { set({ isLoaded: true }); }
  },

  saveToStorage: () => {
    const s = get();
    const { isLoaded: _a, loadFromStorage: _b, saveToStorage: _c, ...persist } = s;
    void setStorageItem(BLOOD_NETWORK_KEY, JSON.stringify(persist)).catch(() => {});
  },

  setMyBloodGroup: (g) => { set({ myBloodGroup: g }); get().saveToStorage(); },
  setMyAvailability: (st) => { set({ myAvailabilityStatus: st }); get().saveToStorage(); },

  logDonation: (entry) => {
    set((s) => ({ myDonationHistory: [{ id: uid('dh'), ...entry }, ...s.myDonationHistory] }));
    get().saveToStorage();
  },

  addCircleMember: (member) => {
    set((s) => ({ myCircle: [...s.myCircle, { id: uid('bc'), createdAt: nowIso(), ...member }] }));
    get().saveToStorage();
  },

  updateCircleMember: (id, patch) => {
    set((s) => ({ myCircle: s.myCircle.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    get().saveToStorage();
  },

  removeCircleMember: (id) => {
    set((s) => ({ myCircle: s.myCircle.filter((c) => c.id !== id) }));
    get().saveToStorage();
  },

  createBloodRequest: (payload) => {
    const req: BloodRequest = {
      id: uid('req'), ...payload, status: 'SOS_ACTIVE', createdAt: nowIso(),
      expiresAt: computeExpiresAt(payload.emergencyLevel),
      sosWaves: createInitialSosWaves(), donorResponses: [],
    };
    set((s) => ({ activeRequests: [req, ...s.activeRequests] }));
    get().saveToStorage();
    return req;
  },

  updateRequestStatus: (reqId, status) => {
    set((s) => ({ activeRequests: s.activeRequests.map((r) => r.id === reqId ? { ...r, status } : r) }));
    get().saveToStorage();
  },

  cancelRequest: (reqId, reason) => {
    const { activeRequests: ar, pastRequests: pr } = get();
    const req = ar.find((r) => r.id === reqId);
    if (!req) return;
    set({
      activeRequests: ar.filter((r) => r.id !== reqId),
      pastRequests: [{ ...req, status: 'CANCELLED', cancelledAt: nowIso(), cancelledReason: reason }, ...pr],
    });
    get().saveToStorage();
  },

  markFulfilled: (reqId) => {
    const { activeRequests: ar, pastRequests: pr } = get();
    const req = ar.find((r) => r.id === reqId);
    if (!req) return;
    set({
      activeRequests: ar.filter((r) => r.id !== reqId),
      pastRequests: [{ ...req, status: 'FULFILLED', fulfilledAt: nowIso() }, ...pr],
    });
    get().saveToStorage();
  },

  updateDonorResponse: (reqId, response) => {
    set((s) => ({
      activeRequests: s.activeRequests.map((r) => {
        if (r.id !== reqId) return r;
        const idx = r.donorResponses.findIndex((d) => d.donorId === response.donorId);
        const updated = idx >= 0
          ? r.donorResponses.map((d, i) => (i === idx ? response : d))
          : [...r.donorResponses, response];
        return { ...r, donorResponses: updated };
      }),
    }));
    get().saveToStorage();
  },

  advanceSosWave: (reqId) => {
    set((s) => ({
      activeRequests: s.activeRequests.map((r) => {
        if (r.id !== reqId) return r;
        const ai = r.sosWaves.findIndex((w) => w.status === 'ACTIVE');
        if (ai < 0) return r;
        const ni = ai + 1;
        const waves = r.sosWaves.map((w, i) => {
          if (i === ai) return { ...w, status: 'COMPLETED' as const, endedAt: nowIso() };
          if (i === ni && ni < r.sosWaves.length - 1) return { ...w, status: 'ACTIVE' as const, startedAt: nowIso() };
          return w;
        });
        return { ...r, sosWaves: waves };
      }),
    }));
    get().saveToStorage();
  },
}));
