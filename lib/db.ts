import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }
  
  // Open or create the database
  dbInstance = await SQLite.openDatabaseAsync('vital_training.db');
  
  await initializeDatabase(dbInstance);
  
  return dbInstance;
}

async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  // Use a transaction for schema initialization
  await db.withTransactionAsync(async () => {
    // 1. Exercises Table (Catalog)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        muscle_group TEXT,
        equipment TEXT,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      );
    `);

    // 2. Workout Sessions Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ABANDONED')),
        sync_status TEXT NOT NULL CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED')) DEFAULT 'PENDING',
        start_time INTEGER,
        end_time INTEGER,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      );
    `);

    // 3. Workout Exercises (Links Session to Exercise)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_exercises (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
      );
    `);

    // 3.5 Exercise Configs
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercise_configs (
        id TEXT PRIMARY KEY,
        exercise_id TEXT UNIQUE NOT NULL,
        default_sets INTEGER NOT NULL DEFAULT 1,
        default_reps INTEGER NOT NULL DEFAULT 0,
        default_weight REAL NOT NULL DEFAULT 0,
        rest_time_seconds INTEGER DEFAULT 60,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
    `);

    // 4. Workout Sets
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_sets (
        id TEXT PRIMARY KEY,
        workout_exercise_id TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL DEFAULT 0,
        is_completed INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
      );
    `);

    // 5. Run Sessions Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS run_sessions (
        id TEXT PRIMARY KEY,
        date INTEGER NOT NULL,
        distance_km REAL NOT NULL,
        duration_sec INTEGER NOT NULL,
        pace_min_per_km REAL NOT NULL,
        calories INTEGER NOT NULL,
        steps INTEGER NOT NULL,
        route_json TEXT
      );
    `);

    // 6. Workout Plans (Master Templates)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'HYPERTROPHY',
        is_active INTEGER NOT NULL DEFAULT 0,
        days_per_week INTEGER NOT NULL DEFAULT 3,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        updated_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
      );
    `);

    // 7. Workout Plan Days (e.g. Push Day, Pull Day)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_plan_days (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        day_label TEXT NOT NULL,
        day_of_week INTEGER,
        target_muscle_groups TEXT DEFAULT '',
        sort_order INTEGER NOT NULL,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
      );
    `);

    // 8. Workout Plan Exercises
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_plan_exercises (
        id TEXT PRIMARY KEY,
        plan_day_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        default_sets INTEGER NOT NULL DEFAULT 3,
        default_reps INTEGER NOT NULL DEFAULT 10,
        target_rpe REAL DEFAULT 8.0,
        rest_time_seconds INTEGER DEFAULT 90,
        sort_order INTEGER NOT NULL,
        created_at INTEGER DEFAULT (cast(strftime('%s','now') as int)),
        FOREIGN KEY (plan_day_id) REFERENCES workout_plan_days(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON workout_plan_days(plan_id);
      CREATE INDEX IF NOT EXISTS idx_plan_ex_day ON workout_plan_exercises(plan_day_id);
    `);

    // Seed additional staple exercises if needed
    await db.execAsync(`
      INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment) VALUES 
      ('ex_1', 'Bench Press', 'Chest', 'Barbell'),
      ('ex_2', 'Squat', 'Legs', 'Barbell'),
      ('ex_3', 'Deadlift', 'Back', 'Barbell'),
      ('ex_4', 'Overhead Press', 'Shoulders', 'Barbell'),
      ('ex_5', 'Pull Up', 'Back', 'Bodyweight'),
      ('ex_6', 'Dumbbell Curl', 'Arms', 'Dumbbell'),
      ('ex_7', 'Leg Extension', 'Legs', 'Machine'),
      ('ex_8', 'Cable Crunch', 'Core', 'Cable'),
      ('ex_9', 'Incline DB Press', 'Chest', 'Dumbbell'),
      ('ex_10', 'Triceps Pushdown', 'Arms', 'Cable'),
      ('ex_11', 'Lateral Raise', 'Shoulders', 'Dumbbell'),
      ('ex_12', 'Barbell Row', 'Back', 'Barbell'),
      ('ex_13', 'Romanian Deadlift', 'Legs', 'Barbell'),
      ('ex_14', 'Calf Raise', 'Legs', 'Machine'),
      -- Bodyweight Movements
      ('ex_bw_1', 'Push-ups', 'Chest', 'Bodyweight'),
      ('ex_bw_2', 'Diamond Push-ups', 'Arms', 'Bodyweight'),
      ('ex_bw_3', 'Pike Push-ups', 'Shoulders', 'Bodyweight'),
      ('ex_bw_4', 'Dips', 'Arms', 'Bodyweight'),
      ('ex_bw_5', 'Bodyweight Squats', 'Legs', 'Bodyweight'),
      ('ex_bw_6', 'Walking Lunges', 'Legs', 'Bodyweight'),
      ('ex_bw_7', 'Plank', 'Core', 'Bodyweight'),
      ('ex_bw_8', 'Hanging Leg Raise', 'Core', 'Bodyweight'),
      ('ex_bw_9', 'Inverted Row', 'Back', 'Bodyweight'),
      ('ex_bw_10', 'Glute Bridge', 'Legs', 'Bodyweight'),
      -- Dumbbell Movements
      ('ex_db_1', 'DB Flat Bench Press', 'Chest', 'Dumbbell'),
      ('ex_db_2', 'DB Shoulder Press', 'Shoulders', 'Dumbbell'),
      ('ex_db_3', 'DB Single-Arm Row', 'Back', 'Dumbbell'),
      ('ex_db_4', 'DB Goblet Squat', 'Legs', 'Dumbbell'),
      ('ex_db_5', 'DB Romanian Deadlift', 'Legs', 'Dumbbell'),
      ('ex_db_6', 'DB Hammer Curl', 'Arms', 'Dumbbell'),
      ('ex_db_7', 'DB Overhead Tricep Ext', 'Arms', 'Dumbbell'),
      ('ex_db_8', 'DB Chest Flyes', 'Chest', 'Dumbbell'),
      ('ex_db_9', 'DB Shrugs', 'Back', 'Dumbbell'),
      -- Kettlebell Movements
      ('ex_kb_1', 'Kettlebell Swing', 'Legs', 'Kettlebell'),
      ('ex_kb_2', 'Kettlebell Clean & Press', 'Shoulders', 'Kettlebell'),
      ('ex_kb_3', 'Kettlebell Goblet Squat', 'Legs', 'Kettlebell'),
      ('ex_kb_4', 'Kettlebell Deadlift', 'Back', 'Kettlebell'),
      -- Cables & Machines
      ('ex_mc_1', 'Lat Pulldown', 'Back', 'Machine'),
      ('ex_mc_2', 'Seated Cable Row', 'Back', 'Cable'),
      ('ex_mc_3', 'Cable Chest Fly', 'Chest', 'Cable'),
      ('ex_mc_4', 'Face Pulls', 'Shoulders', 'Cable'),
      ('ex_mc_5', 'Leg Press', 'Legs', 'Machine'),
      ('ex_mc_6', 'Leg Curl', 'Legs', 'Machine'),
      ('ex_mc_7', 'Pec Deck Fly', 'Chest', 'Machine'),
      ('ex_mc_8', 'Cable Bicep Curl', 'Arms', 'Cable');
    `);

    const { getRunCount } = await db.getFirstAsync<{ getRunCount: number }>('SELECT COUNT(*) as getRunCount FROM run_sessions') ?? { getRunCount: 0 };
    if (getRunCount === 0) {
      const nowMs = Date.now();
      await db.execAsync(`
        INSERT INTO run_sessions (id, date, distance_km, duration_sec, pace_min_per_km, calories, steps, route_json) VALUES 
        ('run_seed_1', ${nowMs - 86400000}, 5.2, 1800, 5.76, 360, 6200, '[]'),
        ('run_seed_2', ${nowMs - 172800000}, 3.8, 1320, 5.78, 260, 4500, '[]');
      `);
    }

    // Seed Pro Workout Plan Templates if empty
    const { getPlanCount } = await db.getFirstAsync<{ getPlanCount: number }>('SELECT COUNT(*) as getPlanCount FROM workout_plans') ?? { getPlanCount: 0 };
    if (getPlanCount === 0) {
      // 1. PPL Plan (Active by default)
      await db.execAsync(`
        INSERT INTO workout_plans (id, name, description, category, is_active, days_per_week) VALUES 
        ('plan_ppl_1', 'Push Pull Legs (PPL)', 'Classic hypertrophy split targeting push, pull, and leg muscle chains for balanced growth.', 'HYPERTROPHY', 1, 3),
        ('plan_ul_2', 'Upper / Lower Split', 'Efficient 4-day power and hypertrophy split dividing upper and lower body movements.', 'STRENGTH', 0, 4),
        ('plan_fb_3', 'Full Body Foundation', 'High-frequency 3-day routine hitting all major compound lifts per session.', 'FOUNDATION', 0, 3);
      `);

      // Plan 1 Days (PPL)
      // Mon (0), Wed (2), Fri (4)
      await db.execAsync(`
        INSERT INTO workout_plan_days (id, plan_id, day_label, day_of_week, target_muscle_groups, sort_order) VALUES 
        ('ppl_day_1', 'plan_ppl_1', 'Push Day – Chest, Shoulders & Triceps', 0, 'chest,shoulder,triceps', 0),
        ('ppl_day_2', 'plan_ppl_1', 'Pull Day – Back, Lats & Biceps', 2, 'back,biceps', 1),
        ('ppl_day_3', 'plan_ppl_1', 'Legs & Core – Quads, Hamstrings & Abs', 4, 'legs,abs,calves', 2);
      `);

      // PPL Day 1 Exercises (Push)
      await db.execAsync(`
        INSERT INTO workout_plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, target_rpe, rest_time_seconds, sort_order) VALUES 
        ('ppl_ex_1', 'ppl_day_1', 'ex_1', 4, 10, 8.5, 90, 0), -- Bench Press
        ('ppl_ex_2', 'ppl_day_1', 'ex_4', 3, 8, 8.0, 90, 1),  -- Overhead Press
        ('ppl_ex_3', 'ppl_day_1', 'ex_9', 3, 10, 8.5, 75, 2), -- Incline DB Press
        ('ppl_ex_4', 'ppl_day_1', 'ex_11', 4, 15, 8.0, 60, 3),-- Lateral Raise
        ('ppl_ex_5', 'ppl_day_1', 'ex_10', 3, 12, 8.5, 60, 4);-- Triceps Pushdown
      `);

      // PPL Day 2 Exercises (Pull)
      await db.execAsync(`
        INSERT INTO workout_plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, target_rpe, rest_time_seconds, sort_order) VALUES 
        ('ppl_ex_6', 'ppl_day_2', 'ex_3', 3, 5, 8.5, 120, 0), -- Deadlift
        ('ppl_ex_7', 'ppl_day_2', 'ex_5', 4, 8, 8.0, 90, 1),  -- Pull Up
        ('ppl_ex_8', 'ppl_day_2', 'ex_12', 3, 10, 8.0, 90, 2),-- Barbell Row
        ('ppl_ex_9', 'ppl_day_2', 'ex_6', 4, 12, 8.5, 60, 3); -- Dumbbell Curl
      `);

      // PPL Day 3 Exercises (Legs & Core)
      await db.execAsync(`
        INSERT INTO workout_plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, target_rpe, rest_time_seconds, sort_order) VALUES 
        ('ppl_ex_10', 'ppl_day_3', 'ex_2', 4, 8, 8.5, 120, 0), -- Squat
        ('ppl_ex_11', 'ppl_day_3', 'ex_13', 3, 10, 8.0, 90, 1),-- Romanian Deadlift
        ('ppl_ex_12', 'ppl_day_3', 'ex_7', 3, 12, 8.5, 60, 2), -- Leg Extension
        ('ppl_ex_13', 'ppl_day_3', 'ex_14', 4, 15, 8.0, 60, 3),-- Calf Raise
        ('ppl_ex_14', 'ppl_day_3', 'ex_8', 3, 15, 8.0, 45, 4); -- Cable Crunch
      `);

      // Plan 2 Days (Upper / Lower)
      await db.execAsync(`
        INSERT INTO workout_plan_days (id, plan_id, day_label, day_of_week, target_muscle_groups, sort_order) VALUES 
        ('ul_day_1', 'plan_ul_2', 'Upper Body A – Strength', 0, 'chest,back,shoulder', 0),
        ('ul_day_2', 'plan_ul_2', 'Lower Body A – Quads & Calves', 1, 'legs,calves', 1),
        ('ul_day_3', 'plan_ul_2', 'Upper Body B – Hypertrophy', 3, 'chest,back,biceps,triceps', 2),
        ('ul_day_4', 'plan_ul_2', 'Lower Body B – Posterior Chain', 4, 'legs,abs', 3);
      `);

      // Plan 3 Days (Full Body)
      await db.execAsync(`
        INSERT INTO workout_plan_days (id, plan_id, day_label, day_of_week, target_muscle_groups, sort_order) VALUES 
        ('fb_day_1', 'plan_fb_3', 'Full Body Workout A', 0, 'chest,back,legs', 0),
        ('fb_day_2', 'plan_fb_3', 'Full Body Workout B', 2, 'shoulder,legs,arms', 1),
        ('fb_day_3', 'plan_fb_3', 'Full Body Workout C', 4, 'chest,back,abs', 2);
      `);
    }
  });
}
