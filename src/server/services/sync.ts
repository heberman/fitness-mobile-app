import { supabase } from "../db";
import * as SQLite from "expo-sqlite";
import NetInfo from "@react-native-community/netinfo";
import type {
  UserProfile,
  SyncQueueItem,
  ProfileUpdate,
  DbUserProfile,
  WaterConsumption,
  Sleep,
} from "../../types/localstore.types";
import type { Meal, Workout } from "../../types/localstore.types";
import { calculateLevel } from "../../utils/levels";

class SyncService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isSyncing: boolean = false;
  private isInitialized: boolean = false;

  async init(database: SQLite.SQLiteDatabase): Promise<void> {
    if (this.isInitialized) return;
    console.log("Initializing sync service...");
    this.db = database;
    this.isInitialized = true;
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  /**
   * Fetch profile from Supabase and update local storage
   */
  async fetchAndUpdateLocal(userId: string): Promise<DbUserProfile | null> {
    try {
      console.log("Fetching profile...");
      const { data, error } = await supabase
        .from("profiles")
        .select("*") // Corrected: removed newline and space
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        console.log("Fetched profile:", data);
        console.log("Updating local profile...");
        const db = this.getDb();
        await db.runAsync(
          `INSERT OR REPLACE INTO user_profile 
           (id, experience_points, last_synced, needs_sync, updated_at)
           VALUES (?, ?, ?, 0, ?)`, // needs_sync is 0 because it's from Supabase
          [data.id, data.experience_points, data.last_synced, data.updated_at]
        );
        console.log("Successfully updated local profile");
      }

      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  /**
   * Get profile from local storage
   */
  async getLocalProfile(userId: string): Promise<UserProfile> {
    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<UserProfile>(
        "SELECT * FROM user_profile WHERE id = ?",
        [userId]
      );
      if (!result) {
        throw new Error(`Profile not found for user ${userId}`);
      }
      return result;
    } catch (error) {
      console.error("Error getting local profile:", error);
      throw error;
    }
  }

  /**
   * Update local profile (instant UI feedback)
   */
  async updateLocalProfile(
    userId: string,
    newXp: number,
    sync?: boolean
  ): Promise<void> {
    try {
      const db = this.getDb();
      const now = new Date().toISOString(); // For updated_at

      await db.runAsync(
        `UPDATE user_profile 
         SET experience_points = ?,
             level = ?,
             needs_sync = 1,
             updated_at = ?
         WHERE id = ?`,
        [newXp, 1, now, userId]
      );

      if (sync) {
        // Queue for sync
        await this.addToSyncQueue("profiles", "update", {
          id: userId,
          experience_points: newXp,
          updated_at: now, // Include updated_at for sync
        });

        // Try to sync immediately if online
        this.syncToSupabase(userId);
      }
    } catch (error) {
      console.error("Error updating local profile:", error);
      throw error;
    }
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    tableName: string,
    action: "update" | "insert" | "delete",
    data: Record<string, any>,
    xpGained?: number
  ): Promise<void> {
    try {
      const db = this.getDb();

      await db.runAsync(
        `INSERT INTO sync_queue (table_name, action, data, xp_gained)
         VALUES (?, ?, ?, ?)`,
        [tableName, action, JSON.stringify(data), xpGained]
      );
      console.log(`Added to sync queue: ${tableName} - ${action}`);
    } catch (error) {
      console.error("Error adding to sync queue:", error);
    }
  }

  async updateUserXp(userId: string, newXp: number) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        experience_points: newXp,
        updated_at: now,
      })
      .eq("id", userId);
    return error;
  }

  /**
   * Sync local changes to Supabase
   */
  async syncToSupabase(userId: string): Promise<void> {
    if (this.isSyncing) {
      console.log("Already syncing, skipping.");
      return;
    }

    try {
      // Check if online
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log("Offline - will sync later");
        return;
      }

      this.isSyncing = true;
      const db = this.getDb();

      // Get all pending syncs
      const pendingSyncs = await db.getAllAsync<SyncQueueItem>(
        "SELECT * FROM sync_queue ORDER BY created_at ASC" // Use created_at for ordering
      );

      console.log(
        pendingSyncs.length === 0
          ? "No syncs pending"
          : `Syncing ${pendingSyncs.length} changes`
      );

      if (pendingSyncs.length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("experience_points")
        .eq("id", userId)
        .single();
      let newXp = data.experience_points;

      for (const sync of pendingSyncs) {
        const data = JSON.parse(sync.data) as Record<string, any>;

        switch (sync.table_name) {
          case "profiles": {
            if (sync.action === "update") {
              const { error } = await supabase
                .from("profiles")
                .update({
                  experience_points: data.experience_points,
                  level: data.level,
                  updated_at: data.updated_at, // Use data's updated_at
                })
                .eq("id", data.id);

              if (!error) {
                // Remove from queue if successful
                await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [
                  sync.id!,
                ]);

                // Update local needs_sync flag
                await db.runAsync(
                  "UPDATE user_profile SET needs_sync = 0, last_synced = ?, updated_at = ? WHERE id = ?",
                  [new Date().toISOString(), data.updated_at, data.id] // Use data's updated_at for local updated_at
                );
                console.log(`Synced profile: ${data.id}`);
              } else {
                console.error(`Error syncing profile ${data.id}:`, error);
                // Optionally, you might want to retry or mark as failed after several attempts
              }
            }
            break;
          }
          case "meals": {
            if (sync.action === "insert") {
              const { error } = await supabase
                .from("meals")
                .insert([data as Meal]); // Assuming data is the meal object

              if (!error) {
                await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [
                  sync.id!,
                ]);
                // Update local needs_sync flag for meals
                await db.runAsync(
                  "UPDATE meals SET needs_sync = 0 WHERE id = ?",
                  [data.id]
                );
                console.log(`Synced meal: ${data.id}`);
              } else {
                console.error(`Error syncing meal ${data.id}:`, error);
              }
            }
            break;
          }
          case "workouts": {
            if (sync.action === "insert") {
              const { error } = await supabase
                .from("workouts")
                .insert([data as Workout]); // Assuming data is the workout object

              if (!error) {
                await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [
                  sync.id!,
                ]);
                // Update local needs_sync flag for workouts
                await db.runAsync(
                  "UPDATE workouts SET needs_sync = 0 WHERE id = ?",
                  [data.id]
                );
                console.log(`Synced workout: ${data.id}`);
              } else {
                console.error(`Error syncing workout ${data.id}:`, error);
              }
            }
            break;
          }
          case "water_consumption": {
            const { error } =
              sync.action === "insert"
                ? await supabase
                    .from("water_consumption")
                    .insert([data as WaterConsumption])
                : await supabase
                    .from("water_consumption")
                    .update({
                      glasses: data.glasses,
                    })
                    .eq("id", data.id);

            if (!error) {
              await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [
                sync.id!,
              ]);
              // Update local needs_sync flag for water consumption
              await db.runAsync(
                "UPDATE water_consumption SET needs_sync = 0 WHERE id = ?",
                [data.id]
              );
              console.log(`Synced water consumption: ${data.id}`);
            } else {
              console.error(
                `Error syncing water consumption ${data.id}:`,
                error
              );
            }
            break;
          }
          case "sleep": {
            const { error } =
              sync.action === "insert"
                ? await supabase.from("sleep").insert([data as Sleep])
                : await supabase
                    .from("sleep")
                    .update({
                      sleep_minutes: data.sleep_minutes,
                    })
                    .eq("id", data.id);

            if (!error) {
              await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [
                sync.id!,
              ]);
              // Update local needs_sync flag for sleep
              await db.runAsync(
                "UPDATE sleep SET needs_sync = 0 WHERE id = ?",
                [data.id]
              );
              console.log(`Synced sleep: ${data.id}`);
            } else {
              console.error(`Error syncing sleep ${data.id}:`, error);
            }
            break;
          }
        }

        newXp += sync.xp_gained ?? 0;
      }

      if (newXp > data.experience_points) {
        const updateXpError = await this.updateUserXp(userId, newXp);
        if (updateXpError) {
          console.error("Error updating XP in supabase:", updateXpError);
        }
      }
    } catch (error) {
      console.error("Error syncing to Supabase:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Full sync: pull from Supabase if local is outdated
   */
  async fullSync(userId: string): Promise<UserProfile | null> {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log("Offline - using local data");
        return await this.getLocalProfile(userId);
      }

      // First, push any pending changes
      await this.syncToSupabase(userId);

      // Then, pull latest from Supabase
      await this.fetchAndUpdateLocal(userId);

      return await this.getLocalProfile(userId);
    } catch (error) {
      console.error("Error in full sync:", error);
      // Fall back to local data
      return await this.getLocalProfile(userId);
    }
  }

  /**
   * Check if there are pending syncs
   */
  async hasPendingSyncs(): Promise<boolean> {
    try {
      const db = this.getDb();
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sync_queue"
      );
      return (result?.count ?? 0) > 0;
    } catch (error) {
      console.error("Error checking pending syncs:", error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { isSyncing: boolean; isInitialized: boolean } {
    return {
      isSyncing: this.isSyncing,
      isInitialized: this.isInitialized,
    };
  }
}

export const syncService = new SyncService();
