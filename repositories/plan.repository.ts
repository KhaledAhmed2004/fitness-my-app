import { getDatabase } from '../lib/db';
import * as Crypto from 'expo-crypto';

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  days_per_week: number;
  created_at: number;
  updated_at: number;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  day_label: string;
  day_of_week: number | null; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  target_muscle_groups: string; // e.g. "chest,shoulder,triceps"
  sort_order: number;
}

export interface PlanExercise {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string | null;
  equipment: string | null;
  default_sets: number;
  default_reps: number;
  target_rpe: number;
  rest_time_seconds: number;
  sort_order: number;
}

export interface PlanDayWithExercises extends PlanDay {
  exercises: PlanExercise[];
}

export interface FullWorkoutPlan extends WorkoutPlan {
  days: PlanDayWithExercises[];
}

export interface TodaysPlanResult {
  plan: WorkoutPlan;
  day: PlanDay | null;
  exercises: PlanExercise[];
  isRestDay: boolean;
  allDays: PlanDay[];
  currentWeekdayIndex: number; // 0=Mon...6=Sun
}

export const PlanRepository = {
  /**
   * Get the currently active workout plan with all its days and exercises
   */
  async getActivePlan(): Promise<FullWorkoutPlan | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM workout_plans WHERE is_active = 1 LIMIT 1`
    );

    if (!row) return null;

    const plan: WorkoutPlan = {
      ...row,
      is_active: row.is_active === 1,
    };

    const days = await this.getDaysForPlan(plan.id);
    return {
      ...plan,
      days,
    };
  },

  /**
   * Get all plans in the system
   */
  async getAllPlans(): Promise<WorkoutPlan[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM workout_plans ORDER BY is_active DESC, created_at ASC`
    );

    return rows.map((r) => ({
      ...r,
      is_active: r.is_active === 1,
    }));
  },

  /**
   * Get a single plan by ID
   */
  async getPlanById(planId: string): Promise<FullWorkoutPlan | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM workout_plans WHERE id = ? LIMIT 1`,
      [planId]
    );

    if (!row) return null;

    const plan: WorkoutPlan = {
      ...row,
      is_active: row.is_active === 1,
    };

    const days = await this.getDaysForPlan(plan.id);
    return {
      ...plan,
      days,
    };
  },

  /**
   * Get all days (and their exercises) for a given plan
   */
  async getDaysForPlan(planId: string): Promise<PlanDayWithExercises[]> {
    const db = await getDatabase();
    const days = await db.getAllAsync<PlanDay>(
      `SELECT * FROM workout_plan_days WHERE plan_id = ? ORDER BY sort_order ASC`,
      [planId]
    );

    const daysWithExercises = await Promise.all(
      days.map(async (day) => {
        const exercises = await db.getAllAsync<any>(
          `SELECT pe.*, e.name as exercise_name, e.muscle_group, e.equipment 
           FROM workout_plan_exercises pe 
           JOIN exercises e ON pe.exercise_id = e.id 
           WHERE pe.plan_day_id = ? 
           ORDER BY pe.sort_order ASC`,
          [day.id]
        );

        return {
          ...day,
          exercises,
        };
      })
    );

    return daysWithExercises;
  },

  /**
   * Activate a specific plan and deactivate all others
   */
  async activatePlan(planId: string): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`UPDATE workout_plans SET is_active = 0`);
      await db.runAsync(`UPDATE workout_plans SET is_active = 1 WHERE id = ?`, [planId]);
    });
  },

  /**
   * Create a new custom workout plan
   */
  async createPlan(
    name: string,
    description: string = '',
    category: string = 'HYPERTROPHY',
    daysPerWeek: number = 3
  ): Promise<string> {
    const db = await getDatabase();
    const planId = Crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Check if this is the first plan; if so, make it active
    const { count } = (await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_plans`
    )) ?? { count: 0 };

    const isActive = count === 0 ? 1 : 0;

    await db.runAsync(
      `INSERT INTO workout_plans (id, name, description, category, is_active, days_per_week, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [planId, name, description, category, isActive, daysPerWeek, now, now]
    );

    return planId;
  },

  /**
   * Add a day to a workout plan
   */
  async addDayToPlan(
    planId: string,
    dayLabel: string,
    dayOfWeek: number | null = null,
    targetMuscles: string = '',
    sortOrder: number = 0
  ): Promise<string> {
    const db = await getDatabase();
    const dayId = Crypto.randomUUID();

    await db.runAsync(
      `INSERT INTO workout_plan_days (id, plan_id, day_label, day_of_week, target_muscle_groups, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dayId, planId, dayLabel, dayOfWeek, targetMuscles, sortOrder]
    );

    return dayId;
  },

  /**
   * Add an exercise to a plan day
   */
  async addExerciseToDay(
    planDayId: string,
    exerciseId: string,
    defaultSets: number = 3,
    defaultReps: number = 10,
    targetRpe: number = 8.0,
    restTimeSeconds: number = 90,
    sortOrder: number = 0
  ): Promise<string> {
    const db = await getDatabase();
    const exId = Crypto.randomUUID();

    await db.runAsync(
      `INSERT INTO workout_plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, target_rpe, rest_time_seconds, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [exId, planDayId, exerciseId, defaultSets, defaultReps, targetRpe, restTimeSeconds, sortOrder]
    );

    return exId;
  },

  /**
   * Update an existing exercise in a plan day (sets, reps, RPE, rest time)
   */
  async updatePlanExercise(
    planExerciseId: string,
    defaultSets: number,
    defaultReps: number,
    targetRpe: number = 8.0,
    restTimeSeconds: number = 90
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE workout_plan_exercises 
       SET default_sets = ?, default_reps = ?, target_rpe = ?, rest_time_seconds = ? 
       WHERE id = ?`,
      [defaultSets, defaultReps, targetRpe, restTimeSeconds, planExerciseId]
    );
  },

  /**
   * Delete an exercise from a plan day
   */
  async deletePlanExercise(planExerciseId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM workout_plan_exercises WHERE id = ?`, [planExerciseId]);
  },

  /**
   * Update a plan day's label, muscle groups, or weekday
   */
  async updatePlanDay(
    planDayId: string,
    dayLabel: string,
    targetMuscles: string,
    dayOfWeek: number | null = null
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE workout_plan_days 
       SET day_label = ?, target_muscle_groups = ?, day_of_week = ? 
       WHERE id = ?`,
      [dayLabel, targetMuscles, dayOfWeek, planDayId]
    );
  },

  /**
   * Delete a plan day and its assigned exercises
   */
  async deletePlanDay(planDayId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM workout_plan_days WHERE id = ?`, [planDayId]);
  },

  /**
   * Delete a plan and all its days/exercises via CASCADE
   */
  async deletePlan(planId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM workout_plans WHERE id = ?`, [planId]);

    // If active plan was deleted, activate the next available one
    const active = await db.getFirstAsync<any>(
      `SELECT * FROM workout_plans WHERE is_active = 1 LIMIT 1`
    );
    if (!active) {
      await db.runAsync(
        `UPDATE workout_plans SET is_active = 1 WHERE id = (SELECT id FROM workout_plans LIMIT 1)`
      );
    }
  },

  /**
   * Intelligent helper: Determines today's scheduled workout from the active plan.
   * If a specific `forcedDayId` is provided (e.g. user tapped Swap/Pick Day), it returns that day instead.
   */
  async getTodaysPlanDay(forcedDayId?: string): Promise<TodaysPlanResult | null> {
    const activePlan = await this.getActivePlan();
    if (!activePlan || activePlan.days.length === 0) return null;

    // Normalizing Date.getDay() (0=Sun, 1=Mon, ..., 6=Sat) to Mon=0...Sun=6
    const jsDay = new Date().getDay();
    const todayWeekdayIndex = jsDay === 0 ? 6 : jsDay - 1;

    // 1. If forcedDayId requested by user
    if (forcedDayId) {
      const forcedDay = activePlan.days.find((d) => d.id === forcedDayId);
      if (forcedDay) {
        return {
          plan: activePlan,
          day: forcedDay,
          exercises: forcedDay.exercises,
          isRestDay: false,
          allDays: activePlan.days,
          currentWeekdayIndex: todayWeekdayIndex,
        };
      }
    }

    // 2. Look for explicit day_of_week match
    const matchedDay = activePlan.days.find((d) => d.day_of_week === todayWeekdayIndex);

    if (matchedDay) {
      return {
        plan: activePlan,
        day: matchedDay,
        exercises: matchedDay.exercises,
        isRestDay: false,
        allDays: activePlan.days,
        currentWeekdayIndex: todayWeekdayIndex,
      };
    }

    // 3. Check if plan has unmapped/rolling days (day_of_week is null or not matched)
    // If all days are fixed weekdays and today isn't one of them -> It's a Rest Day!
    const hasFixedWeekdays = activePlan.days.some((d) => d.day_of_week !== null);

    if (hasFixedWeekdays) {
      // Find the next upcoming workout day for preview
      const sortedByNext = [...activePlan.days].sort((a, b) => {
        const aDay = a.day_of_week ?? 0;
        const bDay = b.day_of_week ?? 0;
        const aDiff = (aDay - todayWeekdayIndex + 7) % 7;
        const bDiff = (bDay - todayWeekdayIndex + 7) % 7;
        return aDiff - bDiff;
      });

      const nextDay = sortedByNext[0] ?? null;

      return {
        plan: activePlan,
        day: nextDay,
        exercises: nextDay ? nextDay.exercises : [],
        isRestDay: true,
        allDays: activePlan.days,
        currentWeekdayIndex: todayWeekdayIndex,
      };
    }

    // 4. Pure rolling split without fixed weekdays -> Default to Day 1
    const firstDay = activePlan.days[0];
    return {
      plan: activePlan,
      day: firstDay,
      exercises: firstDay.exercises,
      isRestDay: false,
      allDays: activePlan.days,
      currentWeekdayIndex: todayWeekdayIndex,
    };
  },
};
