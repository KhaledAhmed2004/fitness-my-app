import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  ActiveCareProtocol,
  BloodPressureLog,
  BloodSugarLog,
  ChronicProtocolType,
  DailyProtocolProgress,
  PRESET_CHRONIC_PROTOCOLS,
  classifyBloodPressure,
  classifyBloodSugar,
} from '@/types/chronic-care';
import { useRoutineStore } from '@/stores/routine-store';

const CHRONIC_CARE_STORAGE_KEY = 'vital_chronic_care_master_v1';

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

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// DEVELOPMENT SEED DATA (Realistic Demo for Father & Self)
// -------------------------------------------------------------

function generateSeedSugarLogs(): BloodSugarLog[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const logs: BloodSugarLog[] = [];

  const fatherValues = [5.4, 5.8, 6.2, 5.5, 5.9, 5.3, 5.6]; // mmol/L
  const selfValues = [4.8, 4.9, 5.1, 4.7, 5.0, 4.9, 4.8];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const dateStr = d.toISOString().split('T')[0];

    // Father log
    const fVal = fatherValues[6 - i] || 5.5;
    const fStatus = classifyBloodSugar(fVal, 'FASTING').status;
    logs.push({
      id: `sug_fat_${i}`,
      memberId: 'mem_father',
      protocolId: 'proto_diabetes_master',
      date: dateStr,
      time: '07:30',
      type: 'FASTING',
      valueMmol: fVal,
      status: fStatus,
      notes: 'Morning fasting before Metformin',
      createdAt: now - i * dayMs,
    });

    // Self log
    const sVal = selfValues[6 - i] || 4.9;
    const sStatus = classifyBloodSugar(sVal, 'FASTING').status;
    logs.push({
      id: `sug_slf_${i}`,
      memberId: 'mem_khaled',
      protocolId: 'proto_diabetes_master',
      date: dateStr,
      time: '08:00',
      type: 'FASTING',
      valueMmol: sVal,
      status: sStatus,
      notes: 'Routine fasting sugar',
      createdAt: now - i * dayMs,
    });
  }
  return logs;
}

function generateSeedBpLogs(): BloodPressureLog[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const logs: BloodPressureLog[] = [];

  const fatherBp = [
    { sys: 125, dia: 82, pulse: 72, daysAgo: 6 },
    { sys: 128, dia: 84, pulse: 74, daysAgo: 4 },
    { sys: 122, dia: 80, pulse: 70, daysAgo: 2 },
    { sys: 120, dia: 78, pulse: 68, daysAgo: 0 },
  ];

  for (const b of fatherBp) {
    const d = new Date(now - b.daysAgo * dayMs);
    const dateStr = d.toISOString().split('T')[0];
    const status = classifyBloodPressure(b.sys, b.dia).status;

    logs.push({
      id: `bp_fat_${b.daysAgo}`,
      memberId: 'mem_father',
      protocolId: 'proto_hypertension_master',
      date: dateStr,
      time: '08:15',
      systolic: b.sys,
      diastolic: b.dia,
      pulse: b.pulse,
      status,
      notes: 'Sitting rest for 5 mins prior to reading',
      createdAt: now - b.daysAgo * dayMs,
    });
  }
  return logs;
}

const DEV_SEED_ACTIVE_PROTOCOLS: Record<string, ActiveCareProtocol[]> = {
  mem_father: [
    {
      ...PRESET_CHRONIC_PROTOCOLS.DIABETES_MANAGEMENT,
      id: 'proto_active_father_db',
      memberId: 'mem_father',
      isActive: true,
      activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    },
    {
      ...PRESET_CHRONIC_PROTOCOLS.HYPERTENSION_CONTROL,
      id: 'proto_active_father_bp',
      memberId: 'mem_father',
      isActive: true,
      activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    },
  ],
  mem_khaled: [
    {
      ...PRESET_CHRONIC_PROTOCOLS.FATTY_LIVER_REVERSAL,
      id: 'proto_active_khaled_fl',
      memberId: 'mem_khaled',
      isActive: true,
      activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    },
  ],
};

const DEV_SEED_SUGAR_LOGS: BloodSugarLog[] = generateSeedSugarLogs();
const DEV_SEED_BP_LOGS: BloodPressureLog[] = generateSeedBpLogs();

interface ChronicCareState {
  activeProtocols: Record<string, ActiveCareProtocol[]>; // memberId -> protocols
  sugarLogs: BloodSugarLog[];
  bpLogs: BloodPressureLog[];
  dailyProgress: Record<string, DailyProtocolProgress>; // `${date}_${memberId}` -> progress
  isLoading: boolean;

  // Actions
  loadData: () => Promise<void>;
  activateProtocol: (
    memberId: string,
    protocolType: ChronicProtocolType
  ) => Promise<ActiveCareProtocol>;
  deactivateProtocol: (memberId: string, protocolId: string) => Promise<void>;
  toggleProtocol: (
    memberId: string,
    protocolType: ChronicProtocolType
  ) => Promise<boolean>;

  // Loggers
  logBloodSugar: (
    entry: Omit<BloodSugarLog, 'id' | 'createdAt' | 'status'>
  ) => Promise<BloodSugarLog>;
  deleteBloodSugarLog: (id: string) => Promise<void>;

  logBloodPressure: (
    entry: Omit<BloodPressureLog, 'id' | 'createdAt' | 'status'>
  ) => Promise<BloodPressureLog>;
  deleteBloodPressureLog: (id: string) => Promise<void>;

  // Daily Tasks & Rules
  toggleDietRule: (
    date: string,
    memberId: string,
    ruleId: string
  ) => Promise<void>;
  updateStepsCount: (
    date: string,
    memberId: string,
    steps: number
  ) => Promise<void>;

  // Selectors & Getters
  getTodayProgress: (memberId: string, date?: string) => DailyProtocolProgress;
  getActiveProtocols: (memberId: string) => ActiveCareProtocol[];
  isProtocolActive: (
    memberId: string,
    protocolType: ChronicProtocolType
  ) => boolean;
  getSugarLogs: (memberId: string, days?: number) => BloodSugarLog[];
  getBpLogs: (memberId: string, days?: number) => BloodPressureLog[];
  getAdherenceStats: (
    memberId: string,
    days?: number
  ) => {
    averageCompliance: number;
    streak: number;
    totalDays: number;
    perfectDays: number;
  };
}

async function saveStoreState(state: ChronicCareState) {
  try {
    const payload = {
      activeProtocols: state.activeProtocols,
      sugarLogs: state.sugarLogs,
      bpLogs: state.bpLogs,
      dailyProgress: state.dailyProgress,
    };
    await setStorageItem(CHRONIC_CARE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save chronic care state:', err);
  }
}

export const useChronicCareStore = create<ChronicCareState>((set, get) => ({
  activeProtocols: DEV_SEED_ACTIVE_PROTOCOLS,
  sugarLogs: DEV_SEED_SUGAR_LOGS,
  bpLogs: DEV_SEED_BP_LOGS,
  dailyProgress: {},
  isLoading: false,

  loadData: async () => {
    try {
      set({ isLoading: true });
      const raw = await getStorageItem(CHRONIC_CARE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          activeProtocols: parsed.activeProtocols || DEV_SEED_ACTIVE_PROTOCOLS,
          sugarLogs: parsed.sugarLogs || DEV_SEED_SUGAR_LOGS,
          bpLogs: parsed.bpLogs || DEV_SEED_BP_LOGS,
          dailyProgress: parsed.dailyProgress || {},
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  activateProtocol: async (memberId: string, protocolType: ChronicProtocolType) => {
    const preset = PRESET_CHRONIC_PROTOCOLS[protocolType];
    const newProtocol: ActiveCareProtocol = {
      ...preset,
      id: `proto_${protocolType.toLowerCase()}_${memberId}_${Date.now()}`,
      memberId,
      isActive: true,
      activatedAt: new Date().toISOString(),
    };

    const currentProtocols = get().activeProtocols[memberId] || [];
    // Remove if already exists of same type
    const filtered = currentProtocols.filter((p) => p.type !== protocolType);
    const updatedList = [newProtocol, ...filtered];

    const updatedMap = {
      ...get().activeProtocols,
      [memberId]: updatedList,
    };

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set({ activeProtocols: updatedMap });
    await saveStoreState(get());
    return newProtocol;
  },

  deactivateProtocol: async (memberId: string, protocolId: string) => {
    const currentProtocols = get().activeProtocols[memberId] || [];
    const updatedList = currentProtocols.filter((p) => p.id !== protocolId);
    const updatedMap = {
      ...get().activeProtocols,
      [memberId]: updatedList,
    };

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    set({ activeProtocols: updatedMap });
    await saveStoreState(get());
  },

  toggleProtocol: async (memberId: string, protocolType: ChronicProtocolType) => {
    const currentProtocols = get().activeProtocols[memberId] || [];
    const existing = currentProtocols.find((p) => p.type === protocolType && p.isActive);

    if (existing) {
      await get().deactivateProtocol(memberId, existing.id);
      return false;
    } else {
      await get().activateProtocol(memberId, protocolType);
      return true;
    }
  },

  logBloodSugar: async (entry) => {
    const status = classifyBloodSugar(entry.valueMmol, entry.type).status;
    const newLog: BloodSugarLog = {
      ...entry,
      id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status,
      createdAt: Date.now(),
    };

    const updatedLogs = [newLog, ...get().sugarLogs];
    const date = entry.date || getTodayKey();
    const progressKey = `${date}_${entry.memberId}`;
    const curProgress = get().getTodayProgress(entry.memberId, date);

    const updatedProgress: DailyProtocolProgress = {
      ...curProgress,
      sugarLogged: true,
      sugarValue: entry.valueMmol,
    };

    // Recalculate compliance
    let points = 0;
    let maxPoints = 0;

    const activeProtocols = get().getActiveProtocols(entry.memberId);
    const hasDiabetes = activeProtocols.some((p) => p.type === 'DIABETES_MANAGEMENT');
    const hasHypertension = activeProtocols.some((p) => p.type === 'HYPERTENSION_CONTROL');

    if (hasDiabetes) {
      maxPoints += 30; // Sugar check
      if (updatedProgress.sugarLogged) points += 30;
    }
    if (hasHypertension) {
      maxPoints += 25; // BP check
      if (updatedProgress.bpLogged) points += 25;
    }

    maxPoints += 25; // Steps
    if (updatedProgress.stepsCompleted) points += 25;

    maxPoints += 20; // Diet
    if (updatedProgress.totalDietRulesCount > 0) {
      const dietRatio =
        updatedProgress.completedDietRuleIds.length /
        updatedProgress.totalDietRulesCount;
      points += Math.round(dietRatio * 20);
    } else {
      points += 20;
    }

    updatedProgress.complianceScore =
      maxPoints > 0 ? Math.min(100, Math.round((points / maxPoints) * 100)) : 100;

    const updatedProgressMap = {
      ...get().dailyProgress,
      [progressKey]: updatedProgress,
    };

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set({ sugarLogs: updatedLogs, dailyProgress: updatedProgressMap });
    await saveStoreState(get());

    // Auto complete routine task if available
    try {
      void useRoutineStore.getState().autoCompleteByAction('LOG_SUGAR');
    } catch {}

    return newLog;
  },

  deleteBloodSugarLog: async (id: string) => {
    const updated = get().sugarLogs.filter((l) => l.id !== id);
    set({ sugarLogs: updated });
    await saveStoreState(get());
  },

  logBloodPressure: async (entry) => {
    const status = classifyBloodPressure(entry.systolic, entry.diastolic).status;
    const newLog: BloodPressureLog = {
      ...entry,
      id: `bp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status,
      createdAt: Date.now(),
    };

    const updatedLogs = [newLog, ...get().bpLogs];
    const date = entry.date || getTodayKey();
    const progressKey = `${date}_${entry.memberId}`;
    const curProgress = get().getTodayProgress(entry.memberId, date);

    const updatedProgress: DailyProtocolProgress = {
      ...curProgress,
      bpLogged: true,
      bpValue: `${entry.systolic}/${entry.diastolic}`,
    };

    // Recalculate compliance
    let points = 0;
    let maxPoints = 0;

    const activeProtocols = get().getActiveProtocols(entry.memberId);
    const hasDiabetes = activeProtocols.some((p) => p.type === 'DIABETES_MANAGEMENT');
    const hasHypertension = activeProtocols.some((p) => p.type === 'HYPERTENSION_CONTROL');

    if (hasDiabetes) {
      maxPoints += 30;
      if (updatedProgress.sugarLogged) points += 30;
    }
    if (hasHypertension) {
      maxPoints += 25;
      if (updatedProgress.bpLogged) points += 25;
    }

    maxPoints += 25;
    if (updatedProgress.stepsCompleted) points += 25;

    maxPoints += 20;
    if (updatedProgress.totalDietRulesCount > 0) {
      const dietRatio =
        updatedProgress.completedDietRuleIds.length /
        updatedProgress.totalDietRulesCount;
      points += Math.round(dietRatio * 20);
    } else {
      points += 20;
    }

    updatedProgress.complianceScore =
      maxPoints > 0 ? Math.min(100, Math.round((points / maxPoints) * 100)) : 100;

    const updatedProgressMap = {
      ...get().dailyProgress,
      [progressKey]: updatedProgress,
    };

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set({ bpLogs: updatedLogs, dailyProgress: updatedProgressMap });
    await saveStoreState(get());

    return newLog;
  },

  deleteBloodPressureLog: async (id: string) => {
    const updated = get().bpLogs.filter((l) => l.id !== id);
    set({ bpLogs: updated });
    await saveStoreState(get());
  },

  toggleDietRule: async (date: string, memberId: string, ruleId: string) => {
    const progressKey = `${date}_${memberId}`;
    const curProgress = get().getTodayProgress(memberId, date);
    const currentCompleted = curProgress.completedDietRuleIds || [];

    const isDone = currentCompleted.includes(ruleId);
    const updatedIds = isDone
      ? currentCompleted.filter((id) => id !== ruleId)
      : [...currentCompleted, ruleId];

    const updatedProgress: DailyProtocolProgress = {
      ...curProgress,
      completedDietRuleIds: updatedIds,
    };

    // Calculate score
    let points = 0;
    let maxPoints = 0;

    const activeProtocols = get().getActiveProtocols(memberId);
    const hasDiabetes = activeProtocols.some((p) => p.type === 'DIABETES_MANAGEMENT');
    const hasHypertension = activeProtocols.some((p) => p.type === 'HYPERTENSION_CONTROL');

    if (hasDiabetes) {
      maxPoints += 30;
      if (updatedProgress.sugarLogged) points += 30;
    }
    if (hasHypertension) {
      maxPoints += 25;
      if (updatedProgress.bpLogged) points += 25;
    }

    maxPoints += 25;
    if (updatedProgress.stepsCompleted) points += 25;

    maxPoints += 20;
    if (updatedProgress.totalDietRulesCount > 0) {
      const dietRatio = updatedIds.length / updatedProgress.totalDietRulesCount;
      points += Math.round(dietRatio * 20);
    } else {
      points += 20;
    }

    updatedProgress.complianceScore =
      maxPoints > 0 ? Math.min(100, Math.round((points / maxPoints) * 100)) : 100;

    const updatedMap = {
      ...get().dailyProgress,
      [progressKey]: updatedProgress,
    };

    void Haptics.impactAsync(
      isDone ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    ).catch(() => {});

    set({ dailyProgress: updatedMap });
    await saveStoreState(get());
  },

  updateStepsCount: async (date: string, memberId: string, steps: number) => {
    const progressKey = `${date}_${memberId}`;
    const curProgress = get().getTodayProgress(memberId, date);
    const target = curProgress.stepsTarget || 6000;
    const completed = steps >= target;

    const updatedProgress: DailyProtocolProgress = {
      ...curProgress,
      stepsCount: steps,
      stepsCompleted: completed,
    };

    // Calculate score
    let points = 0;
    let maxPoints = 0;

    const activeProtocols = get().getActiveProtocols(memberId);
    const hasDiabetes = activeProtocols.some((p) => p.type === 'DIABETES_MANAGEMENT');
    const hasHypertension = activeProtocols.some((p) => p.type === 'HYPERTENSION_CONTROL');

    if (hasDiabetes) {
      maxPoints += 30;
      if (updatedProgress.sugarLogged) points += 30;
    }
    if (hasHypertension) {
      maxPoints += 25;
      if (updatedProgress.bpLogged) points += 25;
    }

    maxPoints += 25;
    if (completed) points += 25;

    maxPoints += 20;
    if (updatedProgress.totalDietRulesCount > 0) {
      const dietRatio =
        updatedProgress.completedDietRuleIds.length /
        updatedProgress.totalDietRulesCount;
      points += Math.round(dietRatio * 20);
    } else {
      points += 20;
    }

    updatedProgress.complianceScore =
      maxPoints > 0 ? Math.min(100, Math.round((points / maxPoints) * 100)) : 100;

    const updatedMap = {
      ...get().dailyProgress,
      [progressKey]: updatedProgress,
    };

    set({ dailyProgress: updatedMap });
    await saveStoreState(get());
  },

  getTodayProgress: (memberId: string, dateParam?: string) => {
    const date = dateParam || getTodayKey();
    const key = `${date}_${memberId}`;
    const existing = get().dailyProgress[key];

    const activeProtocols = get().getActiveProtocols(memberId);
    let allDietRulesCount = 0;
    let targetSteps = 6000;

    for (const proto of activeProtocols) {
      allDietRulesCount += proto.dietRules.length;
      if (proto.dailyStepsTarget > targetSteps) {
        targetSteps = proto.dailyStepsTarget;
      }
    }

    // Check recent sugar log for today
    const todaySugar = get().sugarLogs.find(
      (l) => l.memberId === memberId && l.date === date
    );
    // Check recent BP log for today
    const todayBp = get().bpLogs.find(
      (l) => l.memberId === memberId && l.date === date
    );

    if (existing) {
      return {
        ...existing,
        totalDietRulesCount: allDietRulesCount,
        stepsTarget: targetSteps,
        sugarLogged: Boolean(existing.sugarLogged || todaySugar),
        sugarValue: existing.sugarValue || todaySugar?.valueMmol,
        bpLogged: Boolean(existing.bpLogged || todayBp),
        bpValue:
          existing.bpValue || (todayBp ? `${todayBp.systolic}/${todayBp.diastolic}` : undefined),
      };
    }

    // Default initial progress for today
    return {
      date,
      memberId,
      sugarLogged: Boolean(todaySugar),
      sugarValue: todaySugar?.valueMmol,
      bpLogged: Boolean(todayBp),
      bpValue: todayBp ? `${todayBp.systolic}/${todayBp.diastolic}` : undefined,
      stepsCount: 4200, // Demo active steps
      stepsTarget: targetSteps,
      stepsCompleted: 4200 >= targetSteps,
      completedDietRuleIds: ['db_rule_1', 'bp_rule_1'], // Sample completed
      totalDietRulesCount: allDietRulesCount || 5,
      complianceScore: 65, // Initial realistic score
    };
  },

  getActiveProtocols: (memberId: string) => {
    const list = get().activeProtocols[memberId] || [];
    return list.filter((p) => p.isActive);
  },

  isProtocolActive: (memberId: string, protocolType: ChronicProtocolType) => {
    const list = get().activeProtocols[memberId] || [];
    return list.some((p) => p.type === protocolType && p.isActive);
  },

  getSugarLogs: (memberId: string, days = 30) => {
    const list = get().sugarLogs.filter((l) => l.memberId === memberId);
    return [...list].sort((a, b) => b.createdAt - a.createdAt).slice(0, days);
  },

  getBpLogs: (memberId: string, days = 30) => {
    const list = get().bpLogs.filter((l) => l.memberId === memberId);
    return [...list].sort((a, b) => b.createdAt - a.createdAt).slice(0, days);
  },

  getAdherenceStats: (memberId: string, days = 7) => {
    const progressMap = get().dailyProgress;
    let totalScore = 0;
    let count = 0;
    let streak = 0;
    let perfectDays = 0;

    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const prog = get().getTodayProgress(memberId, dateStr);

      totalScore += prog.complianceScore;
      count++;
      if (prog.complianceScore >= 80) {
        streak++;
      }
      if (prog.complianceScore >= 95) {
        perfectDays++;
      }
    }

    const averageCompliance = count > 0 ? Math.round(totalScore / count) : 80;

    return {
      averageCompliance,
      streak: Math.max(streak, 4),
      totalDays: count,
      perfectDays,
    };
  },
}));
