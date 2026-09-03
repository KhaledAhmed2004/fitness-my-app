/**
 * MENTOR: Central query keys — invalidate by factory, never magic strings.
 */
export const fastingKeys = {
  all: ['fasting'] as const,
  active: () => [...fastingKeys.all, 'active'] as const,
  preference: () => [...fastingKeys.all, 'preference'] as const,
  history: () => [...fastingKeys.all, 'history'] as const,
  protocols: () => [...fastingKeys.all, 'protocols'] as const,
};

export const nutritionKeys = {
  all: ['nutrition'] as const,
  day: (date: string, userId: string) =>
    [...nutritionKeys.all, 'day', userId, date] as const,
  hydration: (date: string) => [...nutritionKeys.all, 'hydration', date] as const,
  hydrationGoal: () => [...nutritionKeys.all, 'hydration', 'goal'] as const,
};
