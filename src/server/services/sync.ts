import * as SQLite from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'
import type {
	UserProfile,
	SyncQueueItem,
	DbUserProfile,
	WaterConsumption,
	Sleep,
	Meal,
	Workout,
	ProfileUpdate,
} from '../../types/localstore'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/db'

export class SyncService {
	private db: SQLite.SQLiteDatabase | null = null
	private supabase: SupabaseClient<Database> | null = null
	private isSyncing: boolean = false
	private isInitialized: boolean = false

	async init(localDb: SQLite.SQLiteDatabase, supabase: SupabaseClient<Database>): Promise<void> {
		if (this.isInitialized) return
		console.log('Initializing sync service...')
		this.db = localDb
		this.supabase = supabase
		this.isInitialized = true
	}

	private getDb(): SQLite.SQLiteDatabase {
		if (!this.db) {
			throw new Error('Database not initialized. Call init() first.')
		}
		return this.db
	}

	/**
	 * Fetch profile from Supabase and update local storage
	 */
	async fetchAndUpdateLocal(userId: string): Promise<DbUserProfile | null> {
		try {
			console.log('Fetching profile...')
			const { data, error } = await this.supabase
				.from('profiles')
				.select('*') // Corrected: removed newline and space
				.eq('id', userId)
				.single()

			if (error) throw error

			if (data) {
				console.log('Fetched profile:', data)
				console.log('Updating local profile...')
				const db = this.getDb()
				await db.runAsync(
					`INSERT OR REPLACE INTO user_profile 
           (id, first_name, last_name, experience_points, date_of_birth, gender, height_inches, 
					 weight_lbs, last_synced, needs_sync, updated_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`, // needs_sync is 0 because it's from Supabase
					[
						data.id,
						data.first_name,
						data.last_name,
						data.experience_points,
						data.date_of_birth,
						data.gender,
						data.height_inches,
						data.weight_lbs,
						data.last_synced,
						data.updated_at,
						data.created_at,
					],
				)
				console.log('Successfully updated local profile')
			}

			return data
		} catch (error) {
			console.error('Error fetching profile:', error)
			throw error
		}
	}

	/**
	 * Get profile from local storage
	 */
	async getLocalProfile(userId: string): Promise<UserProfile> {
		try {
			const db = this.getDb()
			const result = await db.getFirstAsync<UserProfile>(
				'SELECT * FROM user_profile WHERE id = ?',
				[userId],
			)
			if (!result) {
				throw new Error(`Profile not found for user ${userId}`)
			}
			return result
		} catch (error) {
			console.error('Error getting local profile:', error)
			throw error
		}
	}

	/**
	 * Update full profile locally and queue for sync
	 */
	async updateProfile(userId: string, profile: ProfileUpdate): Promise<UserProfile> {
		try {
			const db = this.getDb()
			const now = new Date().toISOString()

			// Get current profile to merge with updates
			const currentProfile = await this.getLocalProfile(userId)

			// Merge current profile with updates
			const updatedProfile: UserProfile = {
				...currentProfile,
				...profile,
				id: userId,
				updated_at: now,
				needs_sync: 1,
			}

			// Update local database
			await db.runAsync(
				`UPDATE user_profile 
       SET first_name = ?,
           last_name = ?,
           date_of_birth = ?,
           gender = ?,
           height_inches = ?,
           weight_lbs = ?,
           needs_sync = 1,
           updated_at = ?
       WHERE id = ?`,
				[
					updatedProfile.first_name,
					updatedProfile.last_name,
					updatedProfile.date_of_birth,
					updatedProfile.gender,
					updatedProfile.height_inches,
					updatedProfile.weight_lbs,
					now,
					userId,
				],
			)

			console.log('Updated local profile')

			// Add to sync queue
			await this.addToSyncQueue('profiles', 'update', updatedProfile)
			await this.syncToSupabase(userId)

			return updatedProfile
		} catch (error) {
			console.error('Error updating profile:', error)
			throw error
		}
	}

	/**
	 * Update local profile XP(instant UI feedback)
	 */
	async updateLocalProfileXp(userId: string, newXp: number): Promise<void> {
		try {
			const db = this.getDb()
			const now = new Date().toISOString() // For updated_at

			await db.runAsync(
				`UPDATE user_profile 
         SET experience_points = ?,
             needs_sync = 1,
             updated_at = ?
         WHERE id = ?`,
				[newXp, now, userId],
			)
		} catch (error) {
			console.error('Error updating local profile:', error)
			throw error
		}
	}

	/**
	 * Add item to sync queue
	 */
	async addToSyncQueue(
		tableName: string,
		action: 'update' | 'insert' | 'delete',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: Record<string, any>,
		xpGained?: number,
	): Promise<void> {
		try {
			const db = this.getDb()

			await db.runAsync(
				`INSERT INTO sync_queue (table_name, action, data, xp_gained)
         VALUES (?, ?, ?, ?)`,
				[tableName, action, JSON.stringify(data), xpGained],
			)
			console.log(`Added to sync queue: ${tableName} - ${action}`)
		} catch (error) {
			console.error('Error adding to sync queue:', error)
		}
	}

	async updateUserXp(userId: string, newXp: number) {
		const now = new Date().toISOString()

		const { error } = await this.supabase
			.from('profiles')
			.update({
				experience_points: newXp,
				updated_at: now,
			})
			.eq('id', userId)
		return error
	}

	/**
	 * Sync local changes to Supabase
	 */
	async syncToSupabase(userId: string): Promise<void> {
		if (this.isSyncing) {
			console.log('Already syncing, skipping.')
			return
		}

		try {
			// Check if online
			const netInfo = await NetInfo.fetch()
			if (!netInfo.isConnected) {
				console.log('Offline - will sync later')
				return
			}

			this.isSyncing = true
			const db = this.getDb()

			// Get all pending syncs
			const pendingSyncs = await db.getAllAsync<SyncQueueItem>(
				'SELECT * FROM sync_queue ORDER BY created_at ASC', // Use created_at for ordering
			)

			console.log(
				pendingSyncs.length === 0 ? 'No syncs pending' : `Syncing ${pendingSyncs.length} changes`,
			)

			if (pendingSyncs.length === 0) {
				return
			}

			const { data, error } = await this.supabase
				.from('profiles')
				.select('experience_points')
				.eq('id', userId)
				.single()

			if (error) {
				console.error('Error fetching user XP:', error)
				return
			}
			let newXp = data.experience_points

			for (const sync of pendingSyncs) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = JSON.parse(sync.data) as Record<string, any>

				switch (sync.table_name) {
					case 'profiles': {
						if (sync.action === 'update') {
							const { error } = await this.supabase
								.from('profiles')
								.update({
									first_name: data.first_name,
									last_name: data.last_name,
									date_of_birth: data.date_of_birth,
									gender: data.gender,
									height_inches: data.height_inches,
									weight_lbs: data.weight_lbs,
									experience_points: data.experience_points,
									updated_at: data.updated_at,
								})
								.eq('id', data.id)

							if (!error) {
								// Remove from queue if successful
								await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [sync.id!])

								// Update local needs_sync flag
								await db.runAsync(
									'UPDATE user_profile SET needs_sync = 0, last_synced = ? WHERE id = ?',
									[new Date().toISOString(), data.id],
								)
								console.log(`Synced profile: ${data.id}`)
							} else {
								console.error(`Error syncing profile ${data.id}:`, error)
							}
						}
						break
					}
					case 'meals': {
						if (sync.action === 'insert') {
							const { error } = await this.supabase.from('meals').insert([data as Meal]) // Assuming data is the meal object

							if (!error) {
								await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [sync.id!])
								// Update local needs_sync flag for meals
								await db.runAsync('UPDATE meals SET needs_sync = 0 WHERE id = ?', [data.id])
								console.log(`Synced meal: ${data.id}`)
							} else {
								console.error(`Error syncing meal ${data.id}:`, error)
							}
						}
						break
					}
					case 'workouts': {
						if (sync.action === 'insert') {
							const { error } = await this.supabase.from('workouts').insert([data as Workout]) // Assuming data is the workout object

							if (!error) {
								await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [sync.id!])
								// Update local needs_sync flag for workouts
								await db.runAsync('UPDATE workouts SET needs_sync = 0 WHERE id = ?', [data.id])
								console.log(`Synced workout: ${data.id}`)
							} else {
								console.error(`Error syncing workout ${data.id}:`, error)
							}
						}
						break
					}
					case 'water_consumption': {
						const { error } =
							sync.action === 'insert'
								? await this.supabase.from('water_consumption').insert([data as WaterConsumption])
								: await this.supabase
										.from('water_consumption')
										.update({
											glasses: data.glasses,
										})
										.eq('id', data.id)

						if (!error) {
							await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [sync.id!])
							// Update local needs_sync flag for water consumption
							await db.runAsync('UPDATE water_consumption SET needs_sync = 0 WHERE id = ?', [
								data.id,
							])
							console.log(`Synced water consumption: ${data.id}`)
						} else {
							console.error(`Error syncing water consumption ${data.id}:`, error)
						}
						break
					}
					case 'sleep': {
						const { error } =
							sync.action === 'insert'
								? await this.supabase.from('sleep').insert([data as Sleep])
								: await this.supabase
										.from('sleep')
										.update({
											sleep_minutes: data.sleep_minutes,
										})
										.eq('id', data.id)

						if (!error) {
							await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [sync.id!])
							// Update local needs_sync flag for sleep
							await db.runAsync('UPDATE sleep SET needs_sync = 0 WHERE id = ?', [data.id])
							console.log(`Synced sleep: ${data.id}`)
						} else {
							console.error(`Error syncing sleep ${data.id}:`, error)
						}
						break
					}
				}

				newXp += sync.xp_gained ?? 0
			}

			if (newXp > data.experience_points) {
				const updateXpError = await this.updateUserXp(userId, newXp)
				if (updateXpError) {
					console.error('Error updating XP in supabase:', updateXpError)
				}
			}
		} catch (error) {
			console.error('Error syncing to Supabase:', error)
		} finally {
			this.isSyncing = false
		}
	}

	/**
	 * Full sync: pull from Supabase if local is outdated
	 */
	async fullSync(userId: string): Promise<UserProfile | null> {
		try {
			const netInfo = await NetInfo.fetch()
			if (!netInfo.isConnected) {
				console.log('Offline - using local data')
				return await this.getLocalProfile(userId)
			}

			// First, push any pending changes
			await this.syncToSupabase(userId)

			// Then, pull latest from Supabase
			await this.fetchAndUpdateLocal(userId)

			return await this.getLocalProfile(userId)
		} catch (error) {
			console.error('Error in full sync:', error)
			// Fall back to local data
			return await this.getLocalProfile(userId)
		}
	}

	/**
	 * Check if there are pending syncs
	 */
	async hasPendingSyncs(): Promise<boolean> {
		try {
			const db = this.getDb()
			const result = await db.getFirstAsync<{ count: number }>(
				'SELECT COUNT(*) as count FROM sync_queue',
			)
			return (result?.count ?? 0) > 0
		} catch (error) {
			console.error('Error checking pending syncs:', error)
			return false
		}
	}

	/**
	 * Get sync status
	 */
	getSyncStatus(): { isSyncing: boolean; isInitialized: boolean } {
		return {
			isSyncing: this.isSyncing,
			isInitialized: this.isInitialized,
		}
	}
}

export const syncService = new SyncService()
