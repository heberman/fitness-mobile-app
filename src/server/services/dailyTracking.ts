import * as SQLite from 'expo-sqlite'
import type {
	WaterConsumption,
	Sleep,
	Meal,
	Workout,
	TodayData,
	TodayProgress,
	TodayMeal,
	TodayWorkout,
} from '../../types/localstore'
// Import the sync service
import { syncService } from './sync'
import {
	XP_CALORIE_BURNED,
	XP_GLASS_WATER,
	XP_MEAL_LOGGED,
	XP_MINUTE_SLEEP,
} from '@constants/XpValues'
import * as ExpoCrypto from 'expo-crypto'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/db'

export class DailyTrackingService {
	private db: SQLite.SQLiteDatabase | null = null
	private supabase: SupabaseClient<Database> | null = null

	async init(database: SQLite.SQLiteDatabase, supabase: SupabaseClient<Database>): Promise<void> {
		console.log('Initializing daily tracking service...')
		this.db = database
		this.supabase = supabase
	}

	private getDb(): SQLite.SQLiteDatabase {
		if (!this.db) throw new Error('DailyTrackingService not initialized')
		return this.db
	}

	private getTodayDate(): string {
		return new Date().toISOString().split('T')[0]
	}

	async logMeal(userId: string, newMeal: TodayMeal): Promise<Meal> {
		const db = this.getDb()
		const today = this.getTodayDate()
		const now = new Date().toISOString() // Added for created_at and logged_at

		const meal: Meal = {
			...newMeal,
			user_id: userId,
			date: today,
			logged_at: now,
			created_at: now,
		}

		await db.runAsync(
			`INSERT INTO meals (id, user_id, name, calories, carbs, fat, protein, date, logged_at, created_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				newMeal.id,
				userId,
				newMeal.name,
				newMeal.calories,
				newMeal.carbs,
				newMeal.fat,
				newMeal.protein,
				today,
				meal.logged_at,
				meal.created_at,
				1,
			], // All values now correctly mapped
		)

		// Add to sync queue and attempt sync
		await syncService.addToSyncQueue('meals', 'insert', meal, XP_MEAL_LOGGED)
		await syncService.syncToSupabase(userId) // Attempt to sync immediately

		return meal
	}

	async getTodayMeals(userId: string): Promise<Meal[]> {
		const db = this.getDb()
		const today = this.getTodayDate()

		return await db.getAllAsync<Meal>(
			'SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY logged_at ASC',
			[userId, today],
		)
	}

	async logWorkout(userId: string, { id, caloriesBurned }: TodayWorkout): Promise<Workout> {
		const db = this.getDb()
		const today = this.getTodayDate()
		const now = new Date().toISOString()

		const workout: Workout = {
			id,
			user_id: userId,
			calories_burned: caloriesBurned,
			date: today,
			completed_at: now,
			created_at: now,
		}

		await db.runAsync(
			`INSERT INTO workouts (id, user_id, calories_burned, date, completed_at, created_at, needs_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[id, userId, caloriesBurned, today, now, now, 1], // All values now correctly mapped
		)

		// Add to sync queue and attempt sync
		await syncService.addToSyncQueue(
			'workouts',
			'insert',
			workout,
			caloriesBurned * XP_CALORIE_BURNED,
		)
		await syncService.syncToSupabase(userId) // Attempt to sync immediately

		return workout
	}

	async getTodayWorkouts(userId: string): Promise<Workout[]> {
		const db = this.getDb()
		const today = this.getTodayDate()

		return await db.getAllAsync<Workout>(
			'SELECT * FROM workouts WHERE user_id = ? AND date = ? ORDER BY completed_at ASC',
			[userId, today],
		)
	}

	async getTodayWaterConsumption(userId: string): Promise<WaterConsumption | null> {
		const db = this.getDb()
		const today = this.getTodayDate()

		const existingRecord = await db.getFirstAsync<WaterConsumption | null>(
			'SELECT * FROM water_consumption WHERE user_id = ? AND date = ?',
			[userId, today],
		)

		return existingRecord
	}

	async getTodaySleep(userId: string): Promise<Sleep | null> {
		const db = this.getDb()
		const today = this.getTodayDate()

		const existingRecord = await db.getFirstAsync<Sleep | null>(
			'SELECT * FROM sleep WHERE user_id = ? AND date = ?',
			[userId, today],
		)

		return existingRecord
	}

	async addWater(userId: string): Promise<void> {
		const db = this.getDb()
		const today = this.getTodayDate()
		const now = new Date().toISOString()

		// Check if a record for today already exists
		const existingRecord = await this.getTodayWaterConsumption(userId)

		if (existingRecord) {
			// Update existing record
			const newWater = existingRecord.glasses + 1
			await db.runAsync(
				'UPDATE water_consumption SET glasses = ?, needs_sync = 1, updated_at = ? WHERE id = ?',
				[newWater, now, existingRecord.id],
			)
			// Add to sync queue
			await syncService.addToSyncQueue(
				'water_consumption',
				'update',
				{
					id: existingRecord.id,
					glasses: newWater,
				},
				XP_GLASS_WATER,
			)
		} else {
			// Create new record
			const id = ExpoCrypto.randomUUID()
			const waterConsumption: WaterConsumption = {
				id,
				user_id: userId,
				date: today,
				glasses: 1,
				created_at: now,
				updated_at: now,
			}
			await db.runAsync(
				`INSERT INTO water_consumption (id, user_id, date, glasses, needs_sync, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
				[id, userId, today, 1, now, now],
			)
			// Add to sync queue
			await syncService.addToSyncQueue(
				'water_consumption',
				'insert',
				waterConsumption,
				XP_GLASS_WATER,
			)
		}

		await syncService.syncToSupabase(userId) // Attempt to sync immediately
	}

	async addSleep(userId: string, sleepMinutes: number): Promise<void> {
		const db = this.getDb()
		const today = this.getTodayDate()
		const now = new Date().toISOString()

		const xpGained = sleepMinutes * XP_MINUTE_SLEEP

		// Check if a record for today already exists
		const existingRecord = await this.getTodaySleep(userId)

		if (existingRecord) {
			// Update existing record
			const newSleepMinutes = existingRecord.sleep_minutes + sleepMinutes
			await db.runAsync(
				'UPDATE sleep SET sleep_minutes = ?, needs_sync = 1, updated_at = ? WHERE id = ?',
				[newSleepMinutes, now, existingRecord.id],
			)
			// Add to sync queue
			await syncService.addToSyncQueue('sleep', 'update', {
				id: existingRecord.id,
				sleep_minutes: newSleepMinutes,
				xpGained,
			})
		} else {
			// Create new record
			const id = ExpoCrypto.randomUUID()
			const sleep: Sleep = {
				id,
				user_id: userId,
				date: today,
				sleep_minutes: sleepMinutes,
				created_at: now,
				updated_at: now,
			}
			await db.runAsync(
				`INSERT INTO sleep (id, user_id, date, sleep_minutes, needs_sync, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
				[id, userId, today, sleepMinutes, now, now],
			)
			// Add to sync queue
			await syncService.addToSyncQueue('sleep', 'insert', sleep, xpGained)
		}

		await syncService.syncToSupabase(userId) // Attempt to sync immediately
	}

	async fetchAndUpdateLocal(userId: string): Promise<void> {
		console.log("Fetching today's data...")

		try {
			const today = this.getTodayDate()
			const db = this.getDb()

			// Fetch today's data from Supabase
			const { data: meals, error: mealsError } = await this.supabase
				.from('meals')
				.select('*')
				.eq('user_id', userId)
				.eq('date', today)
			if (mealsError) throw mealsError

			const { data: workouts, error: workoutsError } = await this.supabase
				.from('workouts')
				.select('*')
				.eq('user_id', userId)
				.eq('date', today)
			if (workoutsError) throw workoutsError

			const { data: water, error: waterError } = await this.supabase
				.from('water_consumption')
				.select('*')
				.eq('user_id', userId)
				.eq('date', today)
			if (waterError) throw waterError

			const { data: sleep, error: sleepError } = await this.supabase
				.from('sleep')
				.select('*')
				.eq('user_id', userId)
				.eq('date', today)
			if (sleepError) throw sleepError

			// Update local database
			if (meals) {
				for (const meal of meals) {
					await db.runAsync(
						`INSERT OR REPLACE INTO meals (id, user_id, name, calories, protein, carbs, fat, date, logged_at, created_at, needs_sync)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
						[
							meal.id,
							meal.user_id,
							meal.name,
							meal.calories,
							meal.protein,
							meal.carbs,
							meal.fat,
							meal.date,
							meal.logged_at,
							meal.created_at,
						],
					)
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
						],
					)
				}
			}
			if (water) {
				for (const waterRecord of water) {
					await db.runAsync(
						`INSERT OR REPLACE INTO water_consumption (id, user_id, date, glasses, needs_sync, updated_at)
               VALUES (?, ?, ?, ?, 0, ?)`,
						[
							waterRecord.id,
							waterRecord.user_id,
							waterRecord.date,
							waterRecord.glasses,
							waterRecord.updated_at,
						],
					)
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
						],
					)
				}
			}
		} catch (error) {
			console.error('Error fetching and updating local daily tracking data:', error)
		}
	}

	getXPGained(todayData: TodayData): number {
		let xpGained = 0
		xpGained += todayData.meals.length * XP_MEAL_LOGGED
		xpGained += todayData.caloriesBurned * XP_CALORIE_BURNED
		xpGained += todayData.sleepMinutes * XP_MINUTE_SLEEP
		xpGained += todayData.waterGlasses * XP_GLASS_WATER
		return xpGained
	}

	async getTodayProgress(userId: string): Promise<TodayProgress> {
		await this.fetchAndUpdateLocal(userId)
		const [meals, workouts, water, sleep] = await Promise.all([
			this.getTodayMeals(userId),
			this.getTodayWorkouts(userId),
			this.getTodayWaterConsumption(userId),
			this.getTodaySleep(userId),
		])

		const todayData: TodayData = {
			meals,
			workouts: workouts.map((w) => ({
				...w,
				caloriesBurned: w.calories_burned,
			})),
			caloriesConsumed: meals.reduce((sum, m) => sum + m.calories, 0),
			caloriesBurned: workouts.reduce((sum, w) => sum + w.calories_burned, 0),
			waterGlasses: water?.glasses ?? 0,
			sleepMinutes: sleep?.sleep_minutes ?? 0,
			proteinGrams: meals.reduce((sum, m) => sum + m.protein, 0),
			carbsGrams: meals.reduce((sum, m) => sum + m.carbs, 0),
			fatGrams: meals.reduce((sum, m) => sum + m.fat, 0),
		}

		const todayProgress: TodayProgress = {
			...todayData,
			xpGained: this.getXPGained(todayData),
		}

		console.log('Fetched progress for today:', todayProgress)

		return todayProgress
	}
}

export const dailyTrackingService = new DailyTrackingService()
