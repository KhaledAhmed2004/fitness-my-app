import { TodoCategory, TodoItem, TodoPriority } from '@/types/todo';

export const TODO_PRIORITY_CONFIG: Record<
  TodoPriority,
  { label: string; color: string; badgeBg: string; level: number }
> = {
  URGENT: { label: 'P1 Urgent', color: '#FF4D6D', badgeBg: 'rgba(255, 77, 109, 0.15)', level: 1 },
  HIGH: { label: 'P2 High', color: '#FFB020', badgeBg: 'rgba(255, 176, 32, 0.15)', level: 2 },
  MEDIUM: { label: 'P3 Normal', color: '#89CEFF', badgeBg: 'rgba(137, 206, 255, 0.15)', level: 3 },
  LOW: { label: 'P4 Low', color: '#87929C', badgeBg: 'rgba(135, 146, 156, 0.15)', level: 4 },
};

export const TODO_CATEGORY_CONFIG: Record<
  TodoCategory,
  { label: string; icon: string; color: string }
> = {
  GROCERY: { label: 'Groceries & Supps', icon: 'shopping-basket', color: '#89FE00' },
  FITNESS: { label: 'Fitness & Gear', icon: 'fitness-center', color: '#A78BFA' },
  HEALTH: { label: 'Medical & Health', icon: 'favorite', color: '#FF4D6D' },
  WORK: { label: 'Work & Projects', icon: 'business-center', color: '#00B4FF' },
  PERSONAL: { label: 'Personal Goals', icon: 'flag', color: '#FFB020' },
};

function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const SEED_TODOS: TodoItem[] = [
  {
    id: 'todo_seed_1',
    title: 'Order Creapure Creatine & Whey Protein',
    description: 'Restock daily workout supplements from sports store',
    priority: 'HIGH',
    category: 'GROCERY',
    dueDate: getTodayStr(),
    dueTime: '02:00 PM',
    isCompleted: false,
    subtasks: [
      { id: 'sub_1_1', title: '500g Creatine Monohydrate', isCompleted: true },
      { id: 'sub_1_2', title: '2kg Whey Isolate Vanilla', isCompleted: false },
      { id: 'sub_1_3', title: 'Electrolyte Powder pack', isCompleted: false },
    ],
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'todo_seed_2',
    title: 'Book Annual Preventive Health & Blood Biomarkers',
    description: 'Comprehensive metabolic panel & lipid profile checkup',
    priority: 'URGENT',
    category: 'HEALTH',
    dueDate: getTodayStr(),
    dueTime: '05:00 PM',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'todo_seed_3',
    title: 'Wash Running Shoes & Prep Weekly Gear',
    description: 'Inspect tread wear and prep moisture-wicking socks',
    priority: 'MEDIUM',
    category: 'FITNESS',
    dueDate: getTodayStr(),
    dueTime: '08:30 PM',
    isCompleted: false,
    createdAt: Date.now() - 3600000,
  },
];
