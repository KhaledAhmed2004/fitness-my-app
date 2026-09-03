import { WorkoutRepository, ActiveWorkoutData } from '../repositories/workout.repository';

/**
 * Use cases orchestrate the business logic and interact with the Repository layer.
 * They keep the UI components clean and free of direct database calls.
 */
export const WorkoutUseCases = {
  /**
   * Check if there's an active workout session in the database.
   */
  async getActiveSession(): Promise<ActiveWorkoutData | null> {
    return await WorkoutRepository.getActiveSession();
  },

  /**
   * Start a brand new workout session.
   * Throws an error if an active session already exists.
   */
  async startWorkout(name: string = 'New Workout'): Promise<string> {
    const existing = await WorkoutRepository.getActiveSession();
    if (existing) {
      throw new Error('An active workout already exists. Please finish or discard it first.');
    }
    
    return await WorkoutRepository.startNewSession(name);
  },

  /**
   * Finish the active workout session.
   */
  async finishWorkout(sessionId: string): Promise<void> {
    // 1. Fetch the session to validate it exists and has completed sets
    const sessionData = await WorkoutRepository.getActiveSession();
    if (!sessionData || sessionData.id !== sessionId) {
      throw new Error('Session not found or not active.');
    }

    let hasCompletedSets = false;
    for (const we of sessionData.exercises) {
      if (we.sets.some(s => s.is_completed)) {
        hasCompletedSets = true;
        break;
      }
    }

    if (!hasCompletedSets) {
      throw new Error('Cannot finish a workout with zero completed sets. Discard it instead.');
    }

    // 2. Mark as completed
    await WorkoutRepository.finishSession(sessionId);
  },

  /**
   * Add a new exercise to the active session.
   */
  async addExercise(sessionId: string, exerciseId: string, currentExerciseCount: number): Promise<string> {
    return await WorkoutRepository.addExerciseToSession(sessionId, exerciseId, currentExerciseCount);
  },

  /**
   * Remove an exercise and its sets from the active session.
   */
  async removeExercise(workoutExerciseId: string): Promise<void> {
    return await WorkoutRepository.removeExerciseFromSession(workoutExerciseId);
  },

  /**
   * Add a new set to a specific exercise in the session.
   */
  async addSet(workoutExerciseId: string, currentSetCount: number, previousWeight: number = 0, previousReps: number = 0): Promise<string> {
    return await WorkoutRepository.addSetToExercise(workoutExerciseId, previousWeight, previousReps, currentSetCount);
  },

  /**
   * Update a set's data (weight, reps, completion status).
   * This handles the autosave functionality when a user interacts with a set.
   */
  async updateSet(setId: string, weight: number, reps: number, isCompleted: boolean): Promise<void> {
    if (weight < 0) throw new Error('Weight cannot be negative');
    if (reps < 0) throw new Error('Reps cannot be negative');
    
    await WorkoutRepository.updateSet(setId, weight, reps, isCompleted);
  },

  /**
   * Remove a single set from an exercise.
   */
  async removeSet(setId: string): Promise<void> {
    await WorkoutRepository.deleteSet(setId);
  },

  /**
   * Start a new session using an old session as a template.
   */
  async repeatWorkout(pastSessionId: string): Promise<string> {
    const existing = await WorkoutRepository.getActiveSession();
    if (existing) {
      throw new Error('An active workout already exists. Please finish or discard it first.');
    }

    const pastSession = await WorkoutRepository.getSessionById(pastSessionId);
    if (!pastSession) {
      throw new Error('Past session not found.');
    }

    // Start a new session
    const newSessionId = await WorkoutRepository.startNewSession(pastSession.name);

    // Loop through exercises and sets
    for (let i = 0; i < pastSession.exercises.length; i++) {
      const pastExercise = pastSession.exercises[i];
      const newWorkoutExerciseId = await WorkoutRepository.addExerciseToSession(
        newSessionId, 
        pastExercise.exercise_id, 
        i,
        true // skip the initial empty set
      );

      const pastSets = pastExercise.sets;
      
      for (let j = 0; j < pastSets.length; j++) {
        const pastSet = pastSets[j];
        await WorkoutRepository.addSetToExercise(newWorkoutExerciseId, pastSet.weight, pastSet.reps, j);
      }
    }
    
    return newSessionId;
  },

  /**
   * Start a brand new workout session pre-populated from a Workout Plan Day.
   */
  async startFromPlanDay(planDayId: string): Promise<string> {
    const existing = await WorkoutRepository.getActiveSession();
    if (existing) {
      throw new Error('An active workout already exists. Please finish or discard it first.');
    }

    const { getDatabase } = await import('../lib/db');
    const db = await getDatabase();

    const planDay = await db.getFirstAsync<any>(
      `SELECT * FROM workout_plan_days WHERE id = ? LIMIT 1`,
      [planDayId]
    );

    if (!planDay) {
      throw new Error('Plan day not found');
    }

    const planExercises = await db.getAllAsync<any>(
      `SELECT * FROM workout_plan_exercises WHERE plan_day_id = ? ORDER BY sort_order ASC`,
      [planDayId]
    );

    const sessionId = await WorkoutRepository.startNewSession(planDay.day_label);

    for (let i = 0; i < planExercises.length; i++) {
      const pe = planExercises[i];
      const workoutExerciseId = await WorkoutRepository.addExerciseToSession(
        sessionId,
        pe.exercise_id,
        i,
        true
      );

      const numSets = pe.default_sets || 3;
      const numReps = pe.default_reps || 10;
      const weight = pe.default_weight || 0;

      for (let s = 0; s < numSets; s++) {
        await WorkoutRepository.addSetToExercise(workoutExerciseId, weight, numReps, s);
      }
    }

    return sessionId;
  },
};
