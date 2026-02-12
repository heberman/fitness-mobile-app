import * as SQLite from 'expo-sqlite'

export const initDatabase = async () => {
	const db = await SQLite.openDatabaseAsync('fitness_app.db')

	await db.execAsync(`
    -- Temp code to clear local
    DROP TABLE IF EXISTS daily_summaries;
    DROP TABLE IF EXISTS water_consumption;
    DROP TABLE IF EXISTS sleep;
    DROP TABLE IF EXISTS meals;
    DROP TABLE IF EXISTS workouts;
    DROP TABLE IF EXISTS today_stats;
    DROP TABLE IF EXISTS sync_queue;

    -- User profile table
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      experience_points INTEGER DEFAULT 0,
      date_of_birth TEXT,
      gender TEXT,
      height_inches INTEGER,
      weight_lbs INTEGER,
      last_synced TEXT,
      needs_sync INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Water consumption
    CREATE TABLE IF NOT EXISTS water_consumption (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      glasses INTEGER DEFAULT 0,
      needs_sync INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    -- Sleep
    CREATE TABLE IF NOT EXISTS sleep (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sleep_minutes INTEGER DEFAULT 0,
      needs_sync INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );
    
    -- Meals
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      date TEXT NOT NULL,
      logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
      needs_sync INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Workouts
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      calories_burned INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      needs_sync INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Sync queue
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      xp_gained INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_water_consumption_user_date 
      ON water_consumption(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_sleep_user_date 
      ON sleep(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_meals_user_date 
      ON meals(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_workouts_user_date 
      ON workouts(user_id, date DESC);
  `)

	return db
}
