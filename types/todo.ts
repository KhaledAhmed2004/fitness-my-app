/**
 * Smart Todo & Task Planner Types
 */

export type TodoPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TodoCategory =
  | 'HEALTH'
  | 'GROCERY'
  | 'WORK'
  | 'FITNESS'
  | 'PERSONAL';

export interface TodoSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // e.g. "04:00 PM"
  isCompleted: boolean;
  completedAt?: number;
  subtasks?: TodoSubtask[];
  createdAt: number;
}

export interface TodoStats {
  total: number;
  completedToday: number;
  pendingToday: number;
  overdueCount: number;
}
