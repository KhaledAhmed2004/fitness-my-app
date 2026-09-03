import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { SEED_TODOS } from '@/constants/default-todos';
import { TodoCategory, TodoItem, TodoStats } from '@/types/todo';

const TODOS_STORAGE_KEY = 'vital_todos_items_v1';

function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export type TodoFilterTab = 'TODAY' | 'UPCOMING' | 'ALL' | 'COMPLETED';

interface TodoState {
  todos: TodoItem[];
  activeFilter: TodoFilterTab;
  activeCategory: TodoCategory | 'ALL';
  searchQuery: string;
  isLoading: boolean;

  // Actions
  loadData: () => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'isCompleted'>) => Promise<TodoItem>;
  toggleTodo: (id: string) => Promise<boolean>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleSubtask: (todoId: string, subtaskId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  setActiveFilter: (filter: TodoFilterTab) => void;
  setActiveCategory: (cat: TodoCategory | 'ALL') => void;
  setSearchQuery: (query: string) => void;

  // Getters
  getStats: () => TodoStats;
  getFilteredTodos: () => TodoItem[];
  getTodayTodos: () => TodoItem[];
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: SEED_TODOS,
  activeFilter: 'TODAY',
  activeCategory: 'ALL',
  searchQuery: '',
  isLoading: false,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const storedJson = await getStorageItem(TODOS_STORAGE_KEY);
      let todos = SEED_TODOS;

      if (storedJson) {
        try {
          const parsed = JSON.parse(storedJson);
          if (Array.isArray(parsed)) {
            todos = parsed;
          }
        } catch {}
      }

      set({ todos, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTodo: async (todoData) => {
    const newTodo: TodoItem = {
      ...todoData,
      id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isCompleted: false,
      createdAt: Date.now(),
    };

    const updated = [newTodo, ...get().todos];
    set({ todos: updated });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(updated));

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return newTodo;
  },

  toggleTodo: async (id: string) => {
    let nowCompleted = false;
    const updated = get().todos.map((t) => {
      if (t.id === id) {
        nowCompleted = !t.isCompleted;
        return {
          ...t,
          isCompleted: nowCompleted,
          completedAt: nowCompleted ? Date.now() : undefined,
        };
      }
      return t;
    });

    void Haptics.impactAsync(
      nowCompleted
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});

    set({ todos: updated });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(updated));
    return nowCompleted;
  },

  updateTodo: async (id: string, updates: Partial<TodoItem>) => {
    const updated = get().todos.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ todos: updated });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(updated));
  },

  deleteTodo: async (id: string) => {
    const updated = get().todos.filter((t) => t.id !== id);
    set({ todos: updated });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(updated));
  },

  toggleSubtask: async (todoId: string, subtaskId: string) => {
    const updated = get().todos.map((t) => {
      if (t.id === todoId && t.subtasks) {
        const nextSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        const allDone = nextSubtasks.every((s) => s.isCompleted);
        return {
          ...t,
          subtasks: nextSubtasks,
          isCompleted: allDone,
          completedAt: allDone ? Date.now() : t.completedAt,
        };
      }
      return t;
    });

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    set({ todos: updated });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(updated));
  },

  clearCompleted: async () => {
    const updated = get().todos.filter((t) => !t.isCompleted);
    set({ todos: updated });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(updated));
  },

  resetToDefaults: async () => {
    set({ todos: SEED_TODOS });
    await setStorageItem(TODOS_STORAGE_KEY, JSON.stringify(SEED_TODOS));
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getStats: () => {
    const todayStr = getTodayStr();
    const todos = get().todos;

    const total = todos.length;
    const completedToday = todos.filter(
      (t) =>
        t.isCompleted &&
        t.completedAt &&
        new Date(t.completedAt).toISOString().split('T')[0] === todayStr
    ).length;

    const pendingToday = todos.filter(
      (t) => !t.isCompleted && (t.dueDate === todayStr || !t.dueDate)
    ).length;

    const overdueCount = todos.filter(
      (t) => !t.isCompleted && t.dueDate && t.dueDate < todayStr
    ).length;

    return {
      total,
      completedToday,
      pendingToday,
      overdueCount,
    };
  },

  getFilteredTodos: () => {
    const { todos, activeFilter, activeCategory, searchQuery } = get();
    const todayStr = getTodayStr();

    return todos.filter((t) => {
      // Category filter
      if (activeCategory !== 'ALL' && t.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Tab filter
      if (activeFilter === 'TODAY') {
        return !t.isCompleted && (t.dueDate === todayStr || !t.dueDate || (t.dueDate && t.dueDate < todayStr));
      }
      if (activeFilter === 'UPCOMING') {
        return !t.isCompleted && t.dueDate && t.dueDate > todayStr;
      }
      if (activeFilter === 'COMPLETED') {
        return t.isCompleted;
      }

      // ALL
      return true;
    });
  },

  getTodayTodos: () => {
    const todayStr = getTodayStr();
    const todos = get().todos;

    // Prioritize urgent/high priority and pending for today
    return todos
      .filter((t) => !t.isCompleted && (t.dueDate === todayStr || !t.dueDate || t.dueDate < todayStr))
      .sort((a, b) => {
        const pOrder: Record<string, number> = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
        return (pOrder[a.priority] || 3) - (pOrder[b.priority] || 3);
      });
  },
}));
