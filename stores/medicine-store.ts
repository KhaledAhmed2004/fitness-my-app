import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MedicineItem,
  MedicineLog,
  MedicineScheduleItem,
  TodayDoseView,
  MedicineEntry,
} from '@/types/medicine';

const MEDICINES_STORAGE_KEY = 'vital_medicines_items_v2';
const MEDICINES_LOGS_KEY = 'vital_medicines_logs_v2';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

async function setStorageItem(key: string, value: string) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

const DEFAULT_MEDICINES: MedicineItem[] = [
  {
    id: 'med-1',
    name: 'Vitamin D3',
    type: 'supplement',
    formFactor: 'capsule',
    strength: '5000 IU',
    unit: 'capsule',
    instructions: 'Take with morning meal',
    trackInventory: true,
    currentStock: 24,
    totalPackSize: 30,
    lowStockThreshold: 5,
    expiryDate: '2026-12-31',
    isAsNeeded: false,
    isCourse: false,
    schedules: [
      {
        id: 'sch-1-1',
        time: '08:00 AM',
        timeCategory: 'morning',
        doseAmount: 1,
        instructions: 'With breakfast',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    name: 'Paracetamol',
    type: 'medicine',
    formFactor: 'pill',
    strength: '500 mg',
    unit: 'pill',
    instructions: 'Take after lunch',
    trackInventory: true,
    currentStock: 4,
    totalPackSize: 20,
    lowStockThreshold: 5, // Triggers low-stock warning
    expiryDate: '2027-06-30',
    isAsNeeded: false,
    isCourse: false,
    schedules: [
      {
        id: 'sch-2-1',
        time: '02:00 PM',
        timeCategory: 'afternoon',
        doseAmount: 1,
        instructions: 'After lunch',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-3',
    name: 'Omega-3 Fish Oil',
    type: 'supplement',
    formFactor: 'capsule',
    strength: '1000 mg',
    unit: 'capsule',
    instructions: 'Take with dinner',
    trackInventory: true,
    currentStock: 45,
    totalPackSize: 60,
    lowStockThreshold: 10,
    expiryDate: '2027-01-15',
    isAsNeeded: false,
    isCourse: false,
    schedules: [
      {
        id: 'sch-3-1',
        time: '08:00 PM',
        timeCategory: 'evening',
        doseAmount: 1,
        instructions: 'With dinner',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

type CabinetTab = 'cabinet' | 'schedules' | 'history';

interface MedicineState {
  medicines: MedicineItem[];
  logs: Record<string, MedicineLog[]>; // date -> logs
  isLoaded: boolean;

  // Modals & UI States
  isLogModalOpen: boolean;
  editingMedicine: MedicineItem | null;
  isCabinetModalOpen: boolean;
  activeCabinetTab: CabinetTab;

  // Toast notifications
  toast: { id: number; title: string; message: string; undoId?: string } | null;

  // Core Actions
  loadData: () => Promise<void>;
  addMedicine: (
    data: Omit<MedicineItem, 'id' | 'createdAt' | 'isArchived'>
  ) => string;
  updateMedicine: (id: string, updates: Partial<MedicineItem>) => void;
  deleteMedicine: (id: string) => void;
  refillStock: (medicineId: string, amountToAdd: number) => void;

  // Dosing & Logs
  toggleDose: (medicineId: string, scheduleId: string, date?: string) => void;
  logAsNeededDose: (
    medicineId: string,
    amount?: number,
    date?: string
  ) => void;

  // Queries & Selectors
  getTodayDoses: (date?: string) => TodayDoseView[];
  getLowStockMedicines: () => MedicineItem[];
  getExpiringMedicines: (withinDays?: number) => MedicineItem[];
  getAdherenceStats: (daysCount?: number) => {
    totalDoses: number;
    takenDoses: number;
    percentage: number;
  };

  // UI Open/Close Helpers
  openLogModal: (medicine?: MedicineItem | MedicineEntry) => void;
  closeLogModal: () => void;
  openCabinetModal: (tab?: CabinetTab) => void;
  closeCabinetModal: () => void;
  setCabinetTab: (tab: CabinetTab) => void;
  showToast: (title: string, message: string, undoId?: string) => void;
  hideToast: () => void;
  _syncEntries: () => void;

  // Backward-compatibility bridge
  entries: MedicineEntry[];
  editingEntry: MedicineEntry | null;
  addEntry: (entry: Omit<MedicineEntry, 'id' | 'date'>) => string;
  updateEntry: (
    id: string,
    updates: Partial<Omit<MedicineEntry, 'id' | 'date'>>
  ) => void;
  removeEntry: (id: string) => void;
  toggleEntry: (id: string) => void;
  getRecentMedicines: () => Omit<
    MedicineEntry,
    'id' | 'date' | 'time' | 'isTaken'
  >[];
}

export const useMedicineStore = create<MedicineState>((set, get) => ({
  medicines: DEFAULT_MEDICINES,
  logs: {
    [getTodayDateString()]: [
      {
        id: 'log-mock-1',
        medicineId: 'med-1',
        scheduleId: 'sch-1-1',
        date: getTodayDateString(),
        takenAt: new Date().toISOString(),
        doseTaken: 1,
        isTaken: true,
      },
    ],
  },
  isLoaded: false,

  isLogModalOpen: false,
  editingMedicine: null,
  isCabinetModalOpen: false,
  activeCabinetTab: 'cabinet',
  toast: null,

  // Compatibility fields
  editingEntry: null,
  entries: [],

  loadData: async () => {
    try {
      const [savedMeds, savedLogs] = await Promise.all([
        getStorageItem(MEDICINES_STORAGE_KEY),
        getStorageItem(MEDICINES_LOGS_KEY),
      ]);

      let medicines = DEFAULT_MEDICINES;
      if (savedMeds) {
        try {
          const parsed = JSON.parse(savedMeds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            medicines = parsed;
          }
        } catch {}
      }

      let logs: Record<string, MedicineLog[]> = get().logs;
      if (savedLogs) {
        try {
          logs = JSON.parse(savedLogs);
        } catch {}
      }

      set({ medicines, logs, isLoaded: true });
      get()._syncEntries();
    } catch {
      set({ isLoaded: true });
    }
  },

  _syncEntries: () => {
    const today = getTodayDateString();
    const doses = get().getTodayDoses(today);
    const legacyEntries: MedicineEntry[] = doses.map((d) => ({
      id: `${d.medicineId}_${d.scheduleId}`,
      name: d.name,
      amount: d.doseAmount,
      unit: d.unit,
      time: d.time,
      timeCategory: d.timeCategory,
      type: d.type,
      formFactor: d.formFactor,
      date: today,
      isTaken: d.isTaken,
      medicineId: d.medicineId,
      scheduleId: d.scheduleId,
    }));
    set({ entries: legacyEntries });
  },

  addMedicine: (data) => {
    const id = generateId();
    const newMedicine: MedicineItem = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const next = [...state.medicines, newMedicine];
      void setStorageItem(MEDICINES_STORAGE_KEY, JSON.stringify(next));
      return { medicines: next };
    });

    get()._syncEntries();
    get().showToast('Added to Cabinet', `${newMedicine.name} is now tracked.`);
    return id;
  },

  updateMedicine: (id, updates) => {
    set((state) => {
      const next = state.medicines.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );
      void setStorageItem(MEDICINES_STORAGE_KEY, JSON.stringify(next));
      return { medicines: next };
    });
    get()._syncEntries();
  },

  deleteMedicine: (id) => {
    set((state) => {
      const next = state.medicines.filter((m) => m.id !== id);
      void setStorageItem(MEDICINES_STORAGE_KEY, JSON.stringify(next));
      return { medicines: next };
    });
    get()._syncEntries();
  },

  refillStock: (medicineId, amountToAdd) => {
    set((state) => {
      const next = state.medicines.map((m) => {
        if (m.id === medicineId) {
          const nextStock = Math.max(0, m.currentStock + amountToAdd);
          const nextTotal = Math.max(m.totalPackSize, nextStock);
          return {
            ...m,
            currentStock: nextStock,
            totalPackSize: nextTotal,
          };
        }
        return m;
      });
      void setStorageItem(MEDICINES_STORAGE_KEY, JSON.stringify(next));
      return { medicines: next };
    });

    const med = get().medicines.find((m) => m.id === medicineId);
    if (med) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      get().showToast(
        'Stock Refilled',
        `Added +${amountToAdd} ${med.unit} to ${med.name}. (Now ${med.currentStock} left)`
      );
    }
    get()._syncEntries();
  },

  toggleDose: (medicineId, scheduleId, date) => {
    const today = date || getTodayDateString();
    const med = get().medicines.find((m) => m.id === medicineId);
    if (!med) return;

    const schedule = med.schedules.find((s) => s.id === scheduleId);
    const doseAmount = schedule?.doseAmount ?? 1;

    set((state) => {
      const dateLogs = state.logs[today] || [];
      const existingLogIndex = dateLogs.findIndex(
        (l) => l.medicineId === medicineId && l.scheduleId === scheduleId
      );

      let nextDateLogs: MedicineLog[];
      let isNowTaken = false;

      if (existingLogIndex >= 0) {
        // Toggle existing
        isNowTaken = !dateLogs[existingLogIndex].isTaken;
        nextDateLogs = dateLogs.map((l, idx) =>
          idx === existingLogIndex
            ? { ...l, isTaken: isNowTaken, takenAt: new Date().toISOString() }
            : l
        );
      } else {
        // Create new log marked as taken
        isNowTaken = true;
        nextDateLogs = [
          ...dateLogs,
          {
            id: generateId(),
            medicineId,
            scheduleId,
            date: today,
            takenAt: new Date().toISOString(),
            doseTaken: doseAmount,
            isTaken: true,
          },
        ];
      }

      // Auto Adjust Inventory Stock!
      const updatedMedicines = state.medicines.map((m) => {
        if (m.id === medicineId && m.trackInventory) {
          const delta = isNowTaken ? -doseAmount : doseAmount;
          return {
            ...m,
            currentStock: Math.max(0, m.currentStock + delta),
          };
        }
        return m;
      });

      const nextLogs = { ...state.logs, [today]: nextDateLogs };

      void setStorageItem(MEDICINES_LOGS_KEY, JSON.stringify(nextLogs));
      void setStorageItem(
        MEDICINES_STORAGE_KEY,
        JSON.stringify(updatedMedicines)
      );

      return { logs: nextLogs, medicines: updatedMedicines };
    });

    // Feedback & Auto routine sync
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const updatedMed = get().medicines.find((m) => m.id === medicineId);
    const isTaken = get()
      .logs[today]?.find(
        (l) => l.medicineId === medicineId && l.scheduleId === scheduleId
      )?.isTaken;

    if (isTaken) {
      // Auto complete habit in routine store
      import('./routine-store')
        .then(({ useRoutineStore }) => {
          void useRoutineStore.getState().autoCompleteByAction('MEDICINE');
        })
        .catch(() => {});

      const stockMsg = updatedMed?.trackInventory
        ? ` • ${updatedMed.currentStock} ${updatedMed.unit} left`
        : '';
      get().showToast('Dose Logged', `${med.name} marked as taken${stockMsg}`);
    }

    get()._syncEntries();
  },

  logAsNeededDose: (medicineId, amount = 1, date) => {
    const today = date || getTodayDateString();
    const med = get().medicines.find((m) => m.id === medicineId);
    if (!med) return;

    set((state) => {
      const dateLogs = state.logs[today] || [];
      const newLog: MedicineLog = {
        id: generateId(),
        medicineId,
        date: today,
        takenAt: new Date().toISOString(),
        doseTaken: amount,
        isTaken: true,
      };

      const updatedMedicines = state.medicines.map((m) => {
        if (m.id === medicineId && m.trackInventory) {
          return {
            ...m,
            currentStock: Math.max(0, m.currentStock - amount),
          };
        }
        return m;
      });

      const nextLogs = { ...state.logs, [today]: [...dateLogs, newLog] };
      void setStorageItem(MEDICINES_LOGS_KEY, JSON.stringify(nextLogs));
      void setStorageItem(
        MEDICINES_STORAGE_KEY,
        JSON.stringify(updatedMedicines)
      );

      return { logs: nextLogs, medicines: updatedMedicines };
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    get().showToast(
      'As-Needed Dose Taken',
      `Logged ${amount} ${med.unit} of ${med.name}`
    );
    get()._syncEntries();
  },

  getTodayDoses: (date) => {
    const today = date || getTodayDateString();
    const { medicines, logs } = get();
    const todayLogs = logs[today] || [];

    const list: TodayDoseView[] = [];

    medicines.forEach((med) => {
      if (med.isArchived) return;

      if (med.schedules && med.schedules.length > 0) {
        med.schedules.forEach((sch) => {
          const log = todayLogs.find(
            (l) => l.medicineId === med.id && l.scheduleId === sch.id
          );
          list.push({
            medicineId: med.id,
            scheduleId: sch.id,
            name: med.name,
            type: med.type,
            formFactor: med.formFactor,
            strength: med.strength,
            unit: med.unit,
            time: sch.time,
            timeCategory: sch.timeCategory,
            doseAmount: sch.doseAmount,
            instructions: sch.instructions || med.instructions,
            isTaken: log?.isTaken ?? false,
            logId: log?.id,
            currentStock: med.currentStock,
            trackInventory: med.trackInventory,
            lowStockThreshold: med.lowStockThreshold,
            isAsNeeded: false,
          });
        });
      }
    });

    // Sort chronologically by time category
    const orderMap: Record<string, number> = {
      morning: 1,
      afternoon: 2,
      evening: 3,
      night: 4,
    };
    return list.sort(
      (a, b) => (orderMap[a.timeCategory] || 0) - (orderMap[b.timeCategory] || 0)
    );
  },

  getLowStockMedicines: () => {
    return get().medicines.filter(
      (m) =>
        !m.isArchived &&
        m.trackInventory &&
        m.currentStock <= m.lowStockThreshold
    );
  },

  getExpiringMedicines: (withinDays = 30) => {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + withinDays);

    return get().medicines.filter((m) => {
      if (!m.expiryDate || m.isArchived) return false;
      const exp = new Date(m.expiryDate);
      return exp <= targetDate;
    });
  },

  getAdherenceStats: (daysCount = 7) => {
    const { logs, medicines } = get();
    let totalExpectedDoses = 0;
    let totalTakenDoses = 0;

    const today = new Date();

    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Sum expected schedules
      medicines.forEach((m) => {
        if (!m.isArchived && !m.isAsNeeded) {
          totalExpectedDoses += m.schedules?.length || 0;
        }
      });

      const dayLogs = logs[dateKey] || [];
      totalTakenDoses += dayLogs.filter((l) => l.isTaken).length;
    }

    const percentage =
      totalExpectedDoses > 0
        ? Math.round((totalTakenDoses / totalExpectedDoses) * 100)
        : 100;

    return {
      totalDoses: totalExpectedDoses,
      takenDoses: totalTakenDoses,
      percentage: Math.min(100, percentage),
    };
  },

  openLogModal: (item) => {
    if (!item) {
      set({ isLogModalOpen: true, editingMedicine: null, editingEntry: null });
      return;
    }
    // Check if passed MedicineItem or MedicineEntry
    if ('trackInventory' in item) {
      set({
        isLogModalOpen: true,
        editingMedicine: item,
        editingEntry: null,
      });
    } else {
      const med = get().medicines.find((m) => m.name === item.name);
      set({
        isLogModalOpen: true,
        editingMedicine: med || null,
        editingEntry: item,
      });
    }
  },
  closeLogModal: () =>
    set({ isLogModalOpen: false, editingMedicine: null, editingEntry: null }),

  openCabinetModal: (tab = 'cabinet') =>
    set({ isCabinetModalOpen: true, activeCabinetTab: tab }),
  closeCabinetModal: () => set({ isCabinetModalOpen: false }),
  setCabinetTab: (tab) => set({ activeCabinetTab: tab }),

  showToast: (title, message, undoId) => {
    const id = Date.now();
    set({ toast: { id, title, message, undoId } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 4500);
  },
  hideToast: () => set({ toast: null }),

  // Legacy Bridge Methods
  addEntry: (entry) => {
    return get().addMedicine({
      name: entry.name,
      type: entry.type,
      formFactor: entry.formFactor,
      unit: entry.unit,
      strength: `${entry.amount} ${entry.unit}`,
      trackInventory: true,
      currentStock: 20,
      totalPackSize: 30,
      lowStockThreshold: 5,
      isAsNeeded: false,
      isCourse: false,
      schedules: [
        {
          id: generateId(),
          time: entry.time || '08:00 AM',
          timeCategory: entry.timeCategory || 'morning',
          doseAmount: entry.amount || 1,
        },
      ],
    });
  },

  updateEntry: (id, updates) => {
    const parts = id.split('_');
    const medId = parts[0];
    if (medId) {
      get().updateMedicine(medId, {
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.type ? { type: updates.type } : {}),
        ...(updates.formFactor ? { formFactor: updates.formFactor } : {}),
      });
    }
  },

  removeEntry: (id) => {
    const parts = id.split('_');
    const medId = parts[0];
    get().deleteMedicine(medId || id);
  },

  toggleEntry: (id) => {
    const parts = id.split('_');
    if (parts.length === 2) {
      get().toggleDose(parts[0], parts[1]);
    } else {
      const doses = get().getTodayDoses();
      const match = doses.find((d) => d.name.toLowerCase() === id.toLowerCase());
      if (match) {
        get().toggleDose(match.medicineId, match.scheduleId);
      }
    }
  },

  getRecentMedicines: () => {
    return get().medicines.slice(0, 5).map((m) => ({
      name: m.name,
      amount: m.schedules[0]?.doseAmount || 1,
      unit: m.unit,
      timeCategory: m.schedules[0]?.timeCategory || 'morning',
      type: m.type,
      formFactor: m.formFactor,
    }));
  },
}));

// Initialize storage load
void useMedicineStore.getState().loadData();
