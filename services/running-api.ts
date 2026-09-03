import { getDatabase } from '../lib/db';
import * as Crypto from 'expo-crypto';

export interface RunSession {
  id: string;
  date: number; // Unix timestamp
  distance_km: number;
  duration_sec: number;
  pace_min_per_km: number;
  calories: number;
  steps: number;
  route_json: string; // JSON string array of {lat, lng}
}

export const RunningAPI = {
  async saveRun(data: Omit<RunSession, 'id'>): Promise<string> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    
    await db.runAsync(
      `INSERT INTO run_sessions (id, date, distance_km, duration_sec, pace_min_per_km, calories, steps, route_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.date, data.distance_km, data.duration_sec, data.pace_min_per_km, data.calories, data.steps, data.route_json]
    );
    
    return id;
  },

  async getRuns(): Promise<RunSession[]> {
    const db = await getDatabase();
    return db.getAllAsync<RunSession>(
      `SELECT * FROM run_sessions ORDER BY date DESC`
    );
  },

  async getRunById(id: string): Promise<RunSession | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<RunSession>(
      `SELECT * FROM run_sessions WHERE id = ?`,
      [id]
    );
    return result;
  },

  async deleteRun(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM run_sessions WHERE id = ?`, [id]);
  },

  async getWeeklyCalories(): Promise<{ day: string, calories: number }[]> {
    const db = await getDatabase();
    
    // Get start of the current week (Sunday, 00:00:00)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekMs = startOfWeek.getTime();
    
    const runs = await db.getAllAsync<{ date: number, calories: number }>(
      `SELECT date, calories FROM run_sessions WHERE date >= ?`,
      [startOfWeekMs]
    );

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = days.map(day => ({ day, calories: 0 }));

    runs.forEach(run => {
      const runDate = new Date(run.date);
      const dayIndex = runDate.getDay();
      result[dayIndex].calories += run.calories;
    });

    return result;
  },

  async getWeeklyActiveTime(): Promise<{ day: string, duration_sec: number }[]> {
    const db = await getDatabase();
    
    // Get start of the current week (Sunday, 00:00:00)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekMs = startOfWeek.getTime();
    
    const runs = await db.getAllAsync<{ date: number, duration_sec: number }>(
      `SELECT date, duration_sec FROM run_sessions WHERE date >= ?`,
      [startOfWeekMs]
    );

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = days.map(day => ({ day, duration_sec: 0 }));

    runs.forEach(run => {
      const runDate = new Date(run.date);
      const dayIndex = runDate.getDay();
      result[dayIndex].duration_sec += run.duration_sec;
    });

    return result;
  }
};
