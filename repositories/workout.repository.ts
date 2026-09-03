import { getDatabase } from '../lib/db';
import * as Crypto from 'expo-crypto'; // Need to generate UUIDs

// Core Types matching SQLite schema
export type WorkoutStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface WorkoutSession {
  id: string;
  user_id: string | null;
  name: string;
  status: WorkoutStatus;
  sync_status: SyncStatus;
  start_time: number | null;
  end_time: number | null;
  created_at: number;
  updated_at: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  weight: number;
  reps: number;
  is_completed: boolean; // mapped to 0/1 in SQLite
  sort_order: number;
}

export interface ExerciseConfig {
  id: string;
  exercise_id: string;
  default_sets: number;
  default_reps: number;
  default_weight: number;
  rest_time_seconds: number;
}

// Data Transfer Object for creating/resuming an active workout
export interface ActiveWorkoutData extends WorkoutSession {
  exercises: (WorkoutExercise & {
    exerciseDetails: Exercise;
    sets: WorkoutSet[];
    prevSets?: { weight: number; reps: number }[];
  })[];
}

export const WorkoutRepository = {
  async getActiveSession(): Promise<ActiveWorkoutData | null> {
    const db = await getDatabase();
    
    // 1. Check for an ACTIVE session
    const session = await db.getFirstAsync<WorkoutSession>(
      `SELECT * FROM workout_sessions WHERE status = 'ACTIVE' LIMIT 1`
    );
    
    if (!session) return null;
    
    // 2. Fetch linked exercises
    const workoutExercises = await db.getAllAsync<WorkoutExercise & Exercise>(
      `SELECT we.*, e.name, e.muscle_group, e.equipment 
       FROM workout_exercises we 
       JOIN exercises e ON we.exercise_id = e.id 
       WHERE we.session_id = ? ORDER BY we.sort_order ASC`,
       [session.id]
    );

    const exercisesWithSets = await Promise.all(workoutExercises.map(async (we) => {
      const sets = await db.getAllAsync<any>(
        `SELECT * FROM workout_sets WHERE workout_exercise_id = ? ORDER BY sort_order ASC`,
        [we.id]
      );

      // Fetch last completed sets for this exercise from previous sessions
      const prevSets = await db.getAllAsync<{ weight: number; reps: number }>(
        `SELECT ws.weight, ws.reps 
         FROM workout_sets ws
         JOIN workout_exercises we2 ON ws.workout_exercise_id = we2.id
         JOIN workout_sessions s ON we2.session_id = s.id
         WHERE we2.exercise_id = ? AND s.status = 'COMPLETED' AND ws.is_completed = 1 AND s.id != ?
         ORDER BY s.end_time DESC, ws.sort_order ASC
         LIMIT 10`,
        [we.exercise_id, session.id]
      );

      return {
        ...we,
        exerciseDetails: {
          id: we.exercise_id,
          name: we.name,
          muscle_group: we.muscle_group,
          equipment: we.equipment,
        },
        sets: sets.map(s => ({ ...s, is_completed: s.is_completed === 1 })),
        prevSets: prevSets || [],
      };
    }));

    return {
      ...session,
      exercises: exercisesWithSets,
    };
  },

  async startNewSession(name: string): Promise<string> {
    const db = await getDatabase();
    const sessionId = Crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    await db.runAsync(
      `INSERT INTO workout_sessions (id, name, status, sync_status, start_time, created_at, updated_at) 
       VALUES (?, ?, 'ACTIVE', 'PENDING', ?, ?, ?)`,
      [sessionId, name, now, now, now]
    );
    
    return sessionId;
  },

  async finishSession(sessionId: string): Promise<void> {
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    await db.runAsync(
      `UPDATE workout_sessions SET status = 'COMPLETED', end_time = ?, updated_at = ? WHERE id = ?`,
      [now, now, sessionId]
    );
  },

  async addExerciseToSession(sessionId: string, exerciseId: string, sortOrder: number, skipInitialSet: boolean = false): Promise<string> {
    const db = await getDatabase();
    const workoutExerciseId = Crypto.randomUUID();
    
    await db.runAsync(
      `INSERT INTO workout_exercises (id, session_id, exercise_id, sort_order) VALUES (?, ?, ?, ?)`,
      [workoutExerciseId, sessionId, exerciseId, sortOrder]
    );
    
    if (!skipInitialSet) {
      // Check if config exists
      const config = await this.getExerciseConfig(exerciseId);
      
      if (config) {
        // Add configured sets
        for (let i = 0; i < config.default_sets; i++) {
          await this.addSetToExercise(workoutExerciseId, config.default_weight, config.default_reps, i);
        }
      } else {
        // Automatically add 1 empty set
        await this.addSetToExercise(workoutExerciseId, 0, 0, 0);
      }
    }
    
    return workoutExerciseId;
  },

  async removeExerciseFromSession(workoutExerciseId: string): Promise<void> {
    const db = await getDatabase();
    
    // Delete the associated sets first
    await db.runAsync(
      `DELETE FROM workout_sets WHERE workout_exercise_id = ?`,
      [workoutExerciseId]
    );

    // Delete the exercise link
    await db.runAsync(
      `DELETE FROM workout_exercises WHERE id = ?`,
      [workoutExerciseId]
    );
  },

  async addSetToExercise(workoutExerciseId: string, weight: number, reps: number, sortOrder: number): Promise<string> {
    const db = await getDatabase();
    const setId = Crypto.randomUUID();
    
    await db.runAsync(
      `INSERT INTO workout_sets (id, workout_exercise_id, weight, reps, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [setId, workoutExerciseId, weight, reps, sortOrder]
    );
    
    return setId;
  },

  async updateSet(setId: string, weight: number, reps: number, isCompleted: boolean): Promise<void> {
    const db = await getDatabase();
    
    await db.runAsync(
      `UPDATE workout_sets SET weight = ?, reps = ?, is_completed = ? WHERE id = ?`,
      [weight, reps, isCompleted ? 1 : 0, setId]
    );
  },

  async deleteSet(setId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM workout_sets WHERE id = ?`,
      [setId]
    );
  },

  async getHistory(): Promise<WorkoutSession[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutSession>(
      `SELECT * FROM workout_sessions WHERE status = 'COMPLETED' ORDER BY start_time DESC`
    );
  },

  async getSessionById(sessionId: string): Promise<ActiveWorkoutData | null> {
    const db = await getDatabase();
    
    const session = await db.getFirstAsync<WorkoutSession>(
      `SELECT * FROM workout_sessions WHERE id = ?`,
      [sessionId]
    );
    
    if (!session) return null;
    
    const workoutExercises = await db.getAllAsync<WorkoutExercise & Exercise>(
      `SELECT we.*, e.name, e.muscle_group, e.equipment 
       FROM workout_exercises we 
       JOIN exercises e ON we.exercise_id = e.id 
       WHERE we.session_id = ? ORDER BY we.sort_order ASC`,
       [sessionId]
    );

    const exercisesWithSets = await Promise.all(workoutExercises.map(async (we) => {
      const sets = await db.getAllAsync<any>(
        `SELECT * FROM workout_sets WHERE workout_exercise_id = ? ORDER BY sort_order ASC`,
        [we.id]
      );
      return {
        ...we,
        exerciseDetails: {
          id: we.exercise_id,
          name: we.name,
          muscle_group: we.muscle_group,
          equipment: we.equipment,
        },
        sets: sets.map(s => ({ ...s, is_completed: s.is_completed === 1 })),
      };
    }));

    return {
      ...session,
      exercises: exercisesWithSets,
    };
  },

  async getPendingWorkouts(): Promise<WorkoutSession[]> {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutSession>(
      `SELECT * FROM workout_sessions WHERE status = 'COMPLETED' AND sync_status = 'PENDING'`
    );
  },

  async markAsSynced(sessionId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE workout_sessions SET sync_status = 'SYNCED' WHERE id = ?`,
      [sessionId]
    );
  },

  async getExerciseConfig(exerciseId: string): Promise<ExerciseConfig | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<ExerciseConfig>(
      `SELECT * FROM exercise_configs WHERE exercise_id = ?`,
      [exerciseId]
    );
  },

  async saveExerciseConfig(
    exerciseId: string, 
    defaultSets: number, 
    defaultReps: number, 
    defaultWeight: number, 
    restTimeSeconds: number
  ): Promise<void> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    
    await db.runAsync(
      `INSERT INTO exercise_configs (id, exercise_id, default_sets, default_reps, default_weight, rest_time_seconds)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(exercise_id) DO UPDATE SET
       default_sets=excluded.default_sets,
       default_reps=excluded.default_reps,
       default_weight=excluded.default_weight,
       rest_time_seconds=excluded.rest_time_seconds`,
      [id, exerciseId, defaultSets, defaultReps, defaultWeight, restTimeSeconds]
    );
  }
};
