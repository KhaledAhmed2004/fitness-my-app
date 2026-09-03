import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

export type NotificationCategory = 'ALL' | 'COACHING' | 'TRAINING' | 'NUTRITION' | 'FASTING' | 'SYSTEM';
export type NotificationDateGroup = 'TODAY' | 'YESTERDAY' | 'EARLIER';

export type AppNotification = {
  id: string;
  category: 'COACHING' | 'TRAINING' | 'NUTRITION' | 'FASTING' | 'SYSTEM';
  dateGroup: NotificationDateGroup;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  actionLabel?: string;
  icon: string;
  accentColor: string;
  badgeBg: string;
};

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    category: 'COACHING',
    dateGroup: 'TODAY',
    title: 'Upcoming PT Session in 25 Mins',
    message: 'Personal training with Tanvir Ahmed at Gold’s Gym Floor — Target: Chest & Delts Hypertrophy.',
    timestamp: '15 mins ago',
    isRead: false,
    actionRoute: '/(app)/(tabs)',
    actionLabel: 'Punch In ➔',
    icon: 'alarm',
    accentColor: '#0E4D34',
    badgeBg: '#E7F3DD',
  },
  {
    id: 'notif_2',
    category: 'FASTING',
    dateGroup: 'TODAY',
    title: 'Autophagy Stage Reached! 🔥',
    message: 'You have completed 16 hours of fasting. Peak cellular repair & fat oxidation are now active.',
    timestamp: '1 hour ago',
    isRead: false,
    actionRoute: '/(app)/(tabs)/fasting',
    actionLabel: 'View Fast ➔',
    icon: 'timer',
    accentColor: '#007A99',
    badgeBg: '#D8F1F5',
  },
  {
    id: 'notif_3',
    category: 'NUTRITION',
    dateGroup: 'TODAY',
    title: 'Protein Target: 45g Remaining',
    message: 'Log your post-workout meal or whey isolate shake to hit your 165g daily target.',
    timestamp: '3 hours ago',
    isRead: false,
    actionRoute: '/(app)/(tabs)/nutrition',
    actionLabel: 'Log Food ➔',
    icon: 'restaurant',
    accentColor: '#B45309',
    badgeBg: '#FEF0DB',
  },
  {
    id: 'notif_4',
    category: 'TRAINING',
    dateGroup: 'YESTERDAY',
    title: 'New PR Logged! 🏆 Incline Bench Press',
    message: 'Congratulations! You set a new personal record of 85 kg × 6 reps on Incline DB Bench Press.',
    timestamp: 'Yesterday, 06:45 PM',
    isRead: true,
    actionRoute: '/(app)/(tabs)/training',
    actionLabel: 'View PRs ➔',
    icon: 'emoji-events',
    accentColor: '#6D28D9',
    badgeBg: '#EDE9FE',
  },
  {
    id: 'notif_5',
    category: 'COACHING',
    dateGroup: 'YESTERDAY',
    title: 'PAR-Q+ Health Alert: Knee Sensitivity',
    message: 'Athlete Rahat Kabir updated injury status for patellar tendon. Squats modified to Belt Squat.',
    timestamp: 'Yesterday, 02:15 PM',
    isRead: true,
    actionRoute: '/(app)/(tabs)',
    actionLabel: 'View Dossier ➔',
    icon: 'medical-services',
    accentColor: '#C2410C',
    badgeBg: '#FFEDD5',
  },
  {
    id: 'notif_6',
    category: 'SYSTEM',
    dateGroup: 'EARLIER',
    title: 'Weekly Health & Recovery Digest',
    message: 'Your sleep recovery averaged 8.2 hrs/night and fasting adherence was 94% this week. Keep crushing it!',
    timestamp: '2 days ago',
    isRead: true,
    actionRoute: '/(app)/today-focus',
    actionLabel: 'Read Digest ➔',
    icon: 'insights',
    accentColor: '#0E4D34',
    badgeBg: '#E7F3DD',
  },
];

const NOTIFICATIONS_STORAGE_KEY = 'vital_notifications_v2';

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(name);
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(name, value);
        return;
      }
      await SecureStore.setItemAsync(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(name);
        return;
      }
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead' | 'dateGroup'>) => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: SEED_NOTIFICATIONS,
      unreadCount: SEED_NOTIFICATIONS.filter((n) => !n.isRead).length,

      markAsRead: (id: string) => {
        const updated = get().notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        });
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        set({
          notifications: updated,
          unreadCount: 0,
        });
      },

      deleteNotification: (id: string) => {
        const updated = get().notifications.filter((n) => n.id !== id);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        });
      },

      clearAll: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      addNotification: (item) => {
        const newNotif: AppNotification = {
          ...item,
          id: `notif_${Date.now()}`,
          dateGroup: 'TODAY',
          timestamp: 'Just now',
          isRead: false,
        };
        const updated = [newNotif, ...get().notifications];
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        });
      },
    }),
    {
      name: NOTIFICATIONS_STORAGE_KEY,
      storage: createJSONStorage(() => customStorage),
    }
  )
);
