import { supabase } from "../db";
import * as SQLite from "expo-sqlite";
import type {
  WaterConsumption,
  Sleep,
  Meal,
  Workout,
  TodayData,
} from "../../types/localstore.types";
// Import the sync service
import { syncService } from "./sync";
import * as ExpoCrypto from "expo-crypto";

class DailyTrackingService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(database: SQLite.SQLiteDatabase): Promise<void> {
    console.log("Initializing daily tracking service...");
    this.db = database;
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error("DailyTrackingService not initialized");
    return this.db;
  }

  private getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  // ========== MEALS ==========

  async logMeal(userId: string, name: string, calories: number): Promise<Meal> {
    const db = this.getDb();
    const today = this.getTodayDate();
    const now = new Date().toISOString(); // Added for created_at and logged_at
    const id = ExpoCrypto.randomUUID();

    const meal: Meal = {
      id,
      user_id: userId,
      name,
      calories,
      date: today,
      logged_at: now,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO meals (id, user_id, name, calories, date, logged_at, created_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, name, calories, today, meal.logged_at, meal.created_at, 1] // All values now correctly mapped
    );

    // Add to sync queue and attempt sync
    await syncService.addToSyncQueue("meals", "insert", meal);
    await syncService.syncToSupabase(); // Attempt to sync immediately

    return meal;
  }

  async getTodayMeals(userId: string): Promise<Meal[]> {
    const db = this.getDb();
    const today = this.getTodayDate();

    return await db.getAllAsync<Meal>(
      "SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY logged_at ASC",
      [userId, today]
    );
  }

  async deleteMeal(mealId: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync("DELETE FROM meals WHERE id = ?", [mealId]);
    // TODO: Add sync logic for delete
  }

  // ========== WORKOUTS ==========

  async logWorkout(userId: string, caloriesBurned: number): Promise<Workout> {
    const db = this.getDb();
    const today = this.getTodayDate();
    const now = new Date().toISOString();
    const id = ExpoCrypto.randomUUID();

    const workout: Workout = {
      id,
      user_id: userId,
      calories_burned: caloriesBurned,
      date: today,
      completed_at: now,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO workouts (id, user_id, calories_burned, date, completed_at, created_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, caloriesBurned, today, now, now, 1] // All values now correctly mapped
    );

    // Add to sync queue and attempt sync
    await syncService.addToSyncQueue("workouts", "insert", workout);
    await syncService.syncToSupabase(); // Attempt to sync immediately

    return workout;
  }

  async getTodayWorkouts(userId: string): Promise<Workout[]> {
    const db = this.getDb();
    const today = this.getTodayDate();

    return await db.getAllAsync<Workout>(
      "SELECT * FROM workouts WHERE user_id = ? AND date = ? ORDER BY completed_at ASC",
      [userId, today]
    );
  }

  async getTodayWaterConsumption(
    userId: string
  ): Promise<WaterConsumption | null> {
    const db = this.getDb();
    const today = this.getTodayDate();

    const existingRecord = await db.getFirstAsync<WaterConsumption | null>(
      "SELECT * FROM water_consumption WHERE user_id = ? AND date = ?",
      [userId, today]
    );

    return existingRecord;
  }

  async getTodaySleep(userId: string): Promise<Sleep | null> {
    const db = this.getDb();
    const today = this.getTodayDate();

    const existingRecord = await db.getFirstAsync<Sleep | null>(
      "SELECT * FROM sleep WHERE user_id = ? AND date = ?",
      [userId, today]
    );

    return existingRecord;
  }

  async addWater(userId: string, ml: number): Promise<void> {
    const db = this.getDb();
    const today = this.getTodayDate();
    const now = new Date().toISOString();

    // Check if a record for today already exists
    const existingRecord = await this.getTodayWaterConsumption(userId);

    if (existingRecord) {
      // Update existing record
      const newWaterMl = existingRecord.water_ml + ml;
      await db.runAsync(
        "UPDATE water_consumption SET water_ml = ?, needs_sync = 1, updated_at = ? WHERE id = ?",
        [newWaterMl, now, existingRecord.id]
      );
      // Add to sync queue
      await syncService.addToSyncQueue("water_consumption", "update", {
        id: existingRecord.id,
        water_ml: newWaterMl,
      });
    } else {
      // Create new record
      const id = ExpoCrypto.randomUUID();
      const waterConsumption: WaterConsumption = {
        id,
        user_id: userId,
        date: today,
        water_ml: ml,
        created_at: now,
        updated_at: now,
      };
      await db.runAsync(
        `INSERT INTO water_consumption (id, user_id, date, water_ml, needs_sync, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [id, userId, today, ml, now, now]
      );
      // Add to sync queue
      await syncService.addToSyncQueue(
        "water_consumption",
        "insert",
        waterConsumption
      );
    }

    await syncService.syncToSupabase(); // Attempt to sync immediately
  }

  async addSleep(userId: string, sleepMinutes: number): Promise<void> {
    const db = this.getDb();
    const today = this.getTodayDate();
    const now = new Date().toISOString();

    // Check if a record for today already exists
    const existingRecord = await this.getTodaySleep(userId);

    if (existingRecord) {
      // Update existing record
      const newSleepMinutes = existingRecord.sleep_minutes + sleepMinutes;
      await db.runAsync(
        "UPDATE sleep SET sleep_minutes = ?, needs_sync = 1, updated_at = ? WHERE id = ?",
        [newSleepMinutes, now, existingRecord.id]
      );
      // Add to sync queue
      await syncService.addToSyncQueue("sleep", "update", {
        id: existingRecord.id,
        sleep_minutes: newSleepMinutes,
      });
    } else {
      // Create new record
      const id = ExpoCrypto.randomUUID();
      const sleep: Sleep = {
        id,
        user_id: userId,
        date: today,
        sleep_minutes: sleepMinutes,
        created_at: now,
        updated_at: now,
      };
      await db.runAsync(
        `INSERT INTO sleep (id, user_id, date, sleep_minutes, needs_sync, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [id, userId, today, sleepMinutes, now, now]
      );
      // Add to sync queue
      await syncService.addToSyncQueue("sleep", "insert", sleep);
    }

    await syncService.syncToSupabase(); // Attempt to sync immediately
  }

  async fetchAndUpdateLocal(userId: string): Promise<void> {
    console.log("Fetching today's data...");

    try {
      const today = this.getTodayDate();
      const db = this.getDb();

      // Fetch today's data from Supabase
      const { data: meals, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today);
      if (mealsError) throw mealsError;

      const { data: workouts, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today);
      if (workoutsError) throw workoutsError;

      const { data: water, error: waterError } = await supabase
        .from("water_consumption")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today);
      if (waterError) throw waterError;

      const { data: sleep, error: sleepError } = await supabase
        .from("sleep")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today);
      if (sleepError) throw sleepError;

      // Update local database
      if (meals) {
        for (const meal of meals) {
          await db.runAsync(
            `INSERT OR REPLACE INTO meals (id, user_id, name, calories, date, logged_at, created_at, needs_sync)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              meal.id,
              meal.user_id,
              meal.name,
              meal.calories,
              meal.date,
              meal.logged_at,
              meal.created_at,
            ]
          );
        }
      }
      if (workouts) {
        for (const workout of workouts) {
          await db.runAsync(
            `INSERT OR REPLACE INTO workouts (id, user_id, calories_burned, date, completed_at, created_at, needs_sync)
               VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [
              workout.id,
              workout.user_id,
              workout.calories_burned,
              workout.date,
              workout.completed_at,
              workout.created_at,
            ]
          );
        }
      }
      if (water) {
        for (const waterRecord of water) {
          await db.runAsync(
            `INSERT OR REPLACE INTO water_consumption (id, user_id, date, water_ml, needs_sync, updated_at)
               VALUES (?, ?, ?, ?, 0, ?)`,
            [
              waterRecord.id,
              waterRecord.user_id,
              waterRecord.date,
              waterRecord.water_ml,
              waterRecord.updated_at,
            ]
          );
        }
      }
      if (sleep) {
        for (const sleepRecord of sleep) {
          await db.runAsync(
            `INSERT OR REPLACE INTO sleep (id, user_id, date, sleep_minutes, needs_sync, updated_at)
               VALUES (?, ?, ?, ?, 0, ?)`,
            [
              sleepRecord.id,
              sleepRecord.user_id,
              sleepRecord.date,
              sleepRecord.sleep_minutes,
              sleepRecord.updated_at,
            ]
          );
        }
      }
    } catch (error) {
      console.error(
        "Error fetching and updating local daily tracking data:",
        error
      );
    }
  }

  // ========== GET TODAY'S COMPLETE DATA ==========

  async getTodayData(userId: string): Promise<TodayData> {
    await this.fetchAndUpdateLocal(userId);
    const [meals, workouts, water, sleep] = await Promise.all([
      this.getTodayMeals(userId),
      this.getTodayWorkouts(userId),
      this.getTodayWaterConsumption(userId),
      this.getTodaySleep(userId),
    ]);

    const data: TodayData = {
      meals,
      workouts,
      calories_consumed: meals.reduce((sum, m) => sum + m.calories, 0),
      calories_burned: workouts.reduce((sum, w) => sum + w.calories_burned, 0),
      water_ml: water?.water_ml ?? 0,
      sleep_minutes: sleep?.sleep_minutes ?? 0,
    };
    console.log("Fetched data for today:", data);

    return data;
  }
}

export const dailyTrackingService = new DailyTrackingService();
