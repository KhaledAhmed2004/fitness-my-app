import { getDatabase } from '../lib/db';
import { Exercise } from './workout.repository';
import * as Crypto from 'expo-crypto';

export const ExerciseRepository = {
  async getAllExercises(): Promise<Exercise[]> {
    const db = await getDatabase();
    return db.getAllAsync<Exercise>(`SELECT * FROM exercises ORDER BY name ASC`);
  },

  async searchExercises(query: string): Promise<Exercise[]> {
    const db = await getDatabase();
    return db.getAllAsync<Exercise>(
      `SELECT * FROM exercises WHERE name LIKE ? ORDER BY name ASC`,
      [`%${query}%`]
    );
  },

  async createCustomExercise(
    name: string,
    muscleGroup: string = 'Full Body',
    equipment: string = 'Other'
  ): Promise<string> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO exercises (id, name, muscle_group, equipment) VALUES (?, ?, ?, ?)`,
      [id, name, muscleGroup, equipment]
    );
    return id;
  },

  async updateExercise(
    id: string,
    name: string,
    muscleGroup: string,
    equipment: string
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE exercises SET name = ?, muscle_group = ?, equipment = ? WHERE id = ?`,
      [name, muscleGroup, equipment, id]
    );
  },

  async deleteExercise(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM exercises WHERE id = ?`, [id]);
  },
};
