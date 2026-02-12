// __tests__/dailyTrackingService.test.ts
import { DailyTrackingService } from '@services/dailyTracking'
import * as SQLite from 'expo-sqlite'
import { SupabaseClient } from '@supabase/supabase-js'
import { syncService } from '@services/sync'
import * as ExpoCrypto from 'expo-crypto'
import {
	XP_CALORIE_BURNED,
	XP_GLASS_WATER,
	XP_MEAL_LOGGED,
	XP_MINUTE_SLEEP,
} from '@constants/XpValues'
import type { Database } from '../../../types/db'

// Mock dependencies
jest.mock('expo-sqlite')
jest.mock('expo-crypto')
jest.mock('@services/sync')

describe('DailyTrackingService', () => {
	let dailyTrackingService: DailyTrackingService
	let mockDb: jest.Mocked<SQLite.SQLiteDatabase>
	let mockSupabase: jest.Mocked<SupabaseClient<Database>>
	const userId = 'user-123'
	const today = new Date().toISOString().split('T')[0]

	beforeEach(() => {
		jest.clearAllMocks()

		// Mock database
		mockDb = {
			runAsync: jest.fn().mockResolvedValue(undefined),
			getFirstAsync: jest.fn(),
			getAllAsync: jest.fn().mockResolvedValue([]),
			execAsync: jest.fn(),
		} as unknown as jest.Mocked<SQLite.SQLiteDatabase>

		// Mock Supabase
		mockSupabase = {
			from: jest.fn(),
		} as unknown as jest.Mocked<SupabaseClient<Database>>

		// Mock ExpoCrypto
		;(ExpoCrypto.randomUUID as jest.Mock).mockReturnValue('uuid-123')

		// Create service instance
		dailyTrackingService = new DailyTrackingService()
	})

	// ========== INIT TESTS ==========

	describe('init', () => {
		it('should initialize with database and supabase', async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)

			expect(dailyTrackingService['db']).toBe(mockDb)
			expect(dailyTrackingService['supabase']).toBe(mockSupabase)
		})

		it('should throw error if getDb is called before init', () => {
			expect(() => {
				dailyTrackingService['getDb']()
			}).toThrow('DailyTrackingService not initialized')
		})
	})

	// ========== MEAL TESTS ==========

	describe('logMeal', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should log a meal and add to sync queue', async () => {
			const newMeal = {
				id: 'meal-1',
				name: 'breakfast',
				calories: 450,
				protein: 25,
				carbs: 50,
				fat: 15,
			}

			const result = await dailyTrackingService.logMeal(userId, newMeal)

			// Verify database insert
			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO meals'),
				expect.arrayContaining([userId, 'breakfast', 450, today]),
			)

			// Verify sync queue add
			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'meals',
				'insert',
				expect.objectContaining({
					name: 'breakfast',
					calories: 450,
					user_id: userId,
					date: today,
				}),
				XP_MEAL_LOGGED,
			)

			// Verify sync attempt
			expect(syncService.syncToSupabase).toHaveBeenCalledWith(userId)

			// Verify return value
			expect(result).toMatchObject({
				user_id: userId,
				name: 'breakfast',
				calories: 450,
				date: today,
			})
		})
	})

	describe('getTodayMeals', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should fetch todays meals from database', async () => {
			const mockMeals = [
				{ id: 'meal-1', name: 'breakfast', calories: 450, logged_at: '10:00' },
				{ id: 'meal-2', name: 'lunch', calories: 600, logged_at: '12:00' },
			]

			;(mockDb.getAllAsync as jest.Mock).mockResolvedValueOnce(mockMeals)

			const result = await dailyTrackingService.getTodayMeals(userId)

			expect(mockDb.getAllAsync).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM meals'),
				[userId, today],
			)

			expect(result).toEqual(mockMeals)
		})

		it('should return empty array if no meals logged', async () => {
			;(mockDb.getAllAsync as jest.Mock).mockResolvedValueOnce([])

			const result = await dailyTrackingService.getTodayMeals(userId)

			expect(result).toEqual([])
		})
	})

	// ========== WORKOUT TESTS ==========

	describe('logWorkout', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should log a workout and add to sync queue', async () => {
			const newWorkout = {
				id: 'workout-1',
				caloriesBurned: 300,
			}

			const result = await dailyTrackingService.logWorkout(userId, newWorkout)

			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO workouts'),
				expect.arrayContaining([userId, 300, today]),
			)

			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'workouts',
				'insert',
				expect.objectContaining({
					user_id: userId,
					calories_burned: 300,
					date: today,
				}),
				300 * XP_CALORIE_BURNED,
			)

			expect(result).toMatchObject({
				user_id: userId,
				calories_burned: 300,
				date: today,
			})
		})

		it('should calculate correct XP for workouts', async () => {
			const newWorkout = {
				id: 'workout-2',
				caloriesBurned: 500,
			}

			await dailyTrackingService.logWorkout(userId, newWorkout)

			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'workouts',
				'insert',
				expect.any(Object),
				500 * XP_CALORIE_BURNED,
			)
		})
	})

	describe('getTodayWorkouts', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should fetch todays workouts', async () => {
			const mockWorkouts = [
				{ id: 'w1', calories_burned: 300, completed_at: '08:00' },
				{ id: 'w2', calories_burned: 250, completed_at: '17:00' },
			]

			;(mockDb.getAllAsync as jest.Mock).mockResolvedValueOnce(mockWorkouts)

			const result = await dailyTrackingService.getTodayWorkouts(userId)

			expect(mockDb.getAllAsync).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM workouts'),
				[userId, today],
			)

			expect(result).toEqual(mockWorkouts)
		})
	})

	// ========== WATER TESTS ==========

	describe('addWater', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should create new water record if none exists', async () => {
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null)

			await dailyTrackingService.addWater(userId)

			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO water_consumption'),
				expect.arrayContaining([userId, today, 1]),
			)

			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'water_consumption',
				'insert',
				expect.objectContaining({
					user_id: userId,
					date: today,
					glasses: 1,
				}),
				XP_GLASS_WATER,
			)
		})

		it('should update existing water record', async () => {
			const existingRecord = {
				id: 'water-1',
				user_id: userId,
				date: today,
				glasses: 2,
			}

			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(existingRecord)

			await dailyTrackingService.addWater(userId)

			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE water_consumption'),
				expect.arrayContaining([3, 'water-1']), // 2 + 1 = 3
			)

			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'water_consumption',
				'update',
				expect.objectContaining({
					id: 'water-1',
					glasses: 3,
				}),
				expect.anything(),
			)
		})

		it('should attempt to sync after adding water', async () => {
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null)

			await dailyTrackingService.addWater(userId)

			expect(syncService.syncToSupabase).toHaveBeenCalledWith(userId)
		})
	})

	describe('getTodayWaterConsumption', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should return water consumption if it exists', async () => {
			const mockWater = {
				id: 'water-1',
				glasses: 3,
				date: today,
			}

			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(mockWater)

			const result = await dailyTrackingService.getTodayWaterConsumption(userId)

			expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
				expect.stringContaining('SELECT * FROM water_consumption'),
				[userId, today],
			)

			expect(result).toEqual(mockWater)
		})

		it('should return null if no water record exists', async () => {
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null)

			const result = await dailyTrackingService.getTodayWaterConsumption(userId)

			expect(result).toBeNull()
		})
	})

	// ========== SLEEP TESTS ==========

	describe('addSleep', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should create new sleep record if none exists', async () => {
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null)

			await dailyTrackingService.addSleep(userId, 420)

			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO sleep'),
				expect.arrayContaining([userId, today, 420]),
			)

			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'sleep',
				'insert',
				expect.objectContaining({
					sleep_minutes: 420,
				}),
				420 * XP_MINUTE_SLEEP,
			)
		})

		it('should update existing sleep record', async () => {
			const existingRecord = {
				id: 'sleep-1',
				user_id: userId,
				date: today,
				sleep_minutes: 300,
			}

			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(existingRecord)

			await dailyTrackingService.addSleep(userId, 120)

			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE sleep'),
				expect.arrayContaining([420, 'sleep-1']), // 300 + 120 = 420
			)
		})

		it('should calculate correct XP for sleep', async () => {
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null)

			await dailyTrackingService.addSleep(userId, 480)

			expect(syncService.addToSyncQueue).toHaveBeenCalledWith(
				'sleep',
				'insert',
				expect.any(Object),
				480 * XP_MINUTE_SLEEP,
			)
		})
	})

	describe('getTodaySleep', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should return sleep record if it exists', async () => {
			const mockSleep = {
				id: 'sleep-1',
				sleep_minutes: 420,
				date: today,
			}

			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(mockSleep)

			const result = await dailyTrackingService.getTodaySleep(userId)

			expect(result).toEqual(mockSleep)
		})

		it('should return null if no sleep record exists', async () => {
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null)

			const result = await dailyTrackingService.getTodaySleep(userId)

			expect(result).toBeNull()
		})
	})

	// ========== XP CALCULATION TESTS ==========

	describe('getXPGained', () => {
		it('should calculate total XP from all activities', () => {
			const todayData = {
				meals: [{ id: '1', name: 'lunch', calories: 600, carbs: 50, protein: 30, fat: 20 }],
				workouts: [{ id: '1', caloriesBurned: 300 }],
				caloriesConsumed: 450,
				caloriesBurned: 300,
				waterGlasses: 4,
				sleepMinutes: 420,
			}

			const xp = dailyTrackingService.getXPGained(todayData)

			const expected =
				1 * XP_MEAL_LOGGED + 300 * XP_CALORIE_BURNED + 420 * XP_MINUTE_SLEEP + 4 * XP_GLASS_WATER

			expect(xp).toBe(expected)
		})

		it('should handle zero activity', () => {
			const todayData = {
				meals: [],
				workouts: [],
				caloriesConsumed: 0,
				caloriesBurned: 0,
				waterGlasses: 0,
				sleepMinutes: 0,
			}

			const xp = dailyTrackingService.getXPGained(todayData)

			expect(xp).toBe(0)
		})

		it('should correctly weight different activities', () => {
			const todayData = {
				meals: [
					{ id: '1', name: 'lunch', calories: 600, carbs: 50, protein: 30, fat: 20 },
					{ id: '2', name: 'dinner', calories: 700, carbs: 60, protein: 40, fat: 30 },
				],
				workouts: [],
				caloriesConsumed: 0,
				caloriesBurned: 100, // Only 100 calories burned
				waterGlasses: 2,
				sleepMinutes: 60,
			}

			const xp = dailyTrackingService.getXPGained(todayData)

			const expected =
				2 * XP_MEAL_LOGGED + 100 * XP_CALORIE_BURNED + 60 * XP_MINUTE_SLEEP + 2 * XP_GLASS_WATER

			expect(xp).toBe(expected)
		})
	})

	// ========== GET TODAY PROGRESS TESTS ==========

	describe('getTodayProgress', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should fetch and return todays progress with XP calculated', async () => {
			const mockMeals = [{ id: 'meal-1', name: 'breakfast', calories: 450 }]
			const mockWorkouts = [{ id: 'w1', calories_burned: 300, caloriesBurned: 300 }]
			const mockWater = { id: 'water-1', glasses: 2 }
			const mockSleep = { id: 'sleep-1', sleep_minutes: 420 }

			;(mockDb.getAllAsync as jest.Mock)
				.mockResolvedValueOnce(mockMeals)
				.mockResolvedValueOnce(mockWorkouts)
			;(mockDb.getFirstAsync as jest.Mock)
				.mockResolvedValueOnce(mockWater)
				.mockResolvedValueOnce(mockSleep)

			const result = await dailyTrackingService.getTodayProgress(userId)

			expect(result).toHaveProperty('xpGained')
			expect(result.meals).toEqual(mockMeals)
			expect(result.waterGlasses).toBe(2)
			expect(result.sleepMinutes).toBe(420)
		})

		it('should handle missing water and sleep records', async () => {
			;(mockDb.getAllAsync as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([])
			;(mockDb.getFirstAsync as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null)

			const result = await dailyTrackingService.getTodayProgress(userId)

			expect(result.waterGlasses).toBe(0)
			expect(result.sleepMinutes).toBe(0)
		})
	})

	// ========== EDGE CASES ==========

	describe('Edge cases', () => {
		beforeEach(async () => {
			await dailyTrackingService.init(mockDb, mockSupabase)
		})

		it('should handle very large calorie burns', async () => {
			const newWorkout = {
				id: 'workout-extreme',
				caloriesBurned: 10000,
			}

			const result = await dailyTrackingService.logWorkout(userId, newWorkout)

			expect(result.calories_burned).toBe(10000)
		})

		it('should handle multiple additions throughout the day', async () => {
			;(mockDb.getFirstAsync as jest.Mock)
				.mockResolvedValueOnce(null) // First water call
				.mockResolvedValueOnce({
					id: 'water-1',
					glasses: 1,
				}) // Second water call
				.mockResolvedValueOnce({
					id: 'water-1',
					glasses: 2,
				}) // Third water call

			await dailyTrackingService.addWater(userId) // Creates with 1
			await dailyTrackingService.addWater(userId) // Updates to 2
			await dailyTrackingService.addWater(userId) // Updates to 3

			expect(mockDb.runAsync).toHaveBeenCalledTimes(3)
		})
	})
})
