// __tests__/syncService.test.ts
import { SyncService } from '../sync'
import * as SQLite from 'expo-sqlite'
import { SupabaseClient } from '@supabase/supabase-js'
import NetInfo from '@react-native-community/netinfo'
import { Database } from '../../../types/db'

jest.mock('@react-native-community/netinfo')

// Mock expo-sqlite
jest.mock('expo-sqlite')

describe('SyncService', () => {
	let syncService: SyncService
	let mockDb: jest.Mocked<SQLite.SQLiteDatabase>
	let mockSupabase: jest.Mocked<SupabaseClient<Database>>

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks()

		// Create mock database
		mockDb = {
			runAsync: jest.fn(),
			getFirstAsync: jest.fn(),
			getAllAsync: jest.fn(),
			execAsync: jest.fn(),
		} as unknown as jest.Mocked<SQLite.SQLiteDatabase>

		mockSupabase = {
			from: jest.fn(),
		} as unknown as jest.Mocked<SupabaseClient<Database>>

		// Create new instance for each test
		syncService = new SyncService()
	})

	describe('init', () => {
		it('should initialize the service with a database', async () => {
			await syncService.init(mockDb, mockSupabase)

			expect(syncService['isInitialized']).toBe(true)
			expect(syncService['db']).toBe(mockDb)
		})

		it('should not reinitialize if already initialized', async () => {
			await syncService.init(mockDb, mockSupabase)
			const firstDb = syncService['db']

			// Try to init again with a different db
			const mockDb2 = {
				runAsync: jest.fn(),
			} as unknown as jest.Mocked<SQLite.SQLiteDatabase>

			await syncService.init(mockDb2, mockSupabase)

			// Should still be the first db
			expect(syncService['db']).toBe(firstDb)
		})

		it('should throw error if getDb is called before init', () => {
			expect(() => {
				syncService['getDb']()
			}).toThrow('Database not initialized. Call init() first.')
		})
	})

	// ========== FETCH AND UPDATE LOCAL TESTS ==========

	describe('fetchAndUpdateLocal', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should fetch profile from Supabase and update local database', async () => {
			const userId = 'user-123'
			const mockProfile = {
				id: userId,
				first_name: 'John',
				last_name: 'Doe',
				experience_points: 100,
				date_of_birth: '1990-01-01',
				gender: 'M',
				height_inches: 70,
				weight_lbs: 180,
				last_synced: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
				created_at: '2024-01-01T00:00:00Z',
			}

			// Mock Supabase response
			const mockSupabaseFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: mockProfile,
							error: null,
						}),
					}),
				}),
			})

			;(mockSupabase.from as jest.Mock).mockImplementation(mockSupabaseFrom)

			// Call the function
			const result = await syncService.fetchAndUpdateLocal(userId)

			// Assert Supabase was called correctly
			expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
			expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles')

			// Assert database was updated with all profile fields
			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('INSERT OR REPLACE INTO user_profile'),
				[
					userId,
					'John',
					'Doe',
					100,
					'1990-01-01',
					'M',
					70,
					180,
					'2024-01-01T00:00:00Z',
					'2024-01-01T00:00:00Z',
					'2024-01-01T00:00:00Z',
				],
			)

			// Assert return value
			expect(result).toEqual(mockProfile)
		})

		it('should throw error if Supabase returns an error', async () => {
			const userId = 'user-123'
			const mockError = new Error('Supabase error')

			const mockSupabaseFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: mockError,
						}),
					}),
				}),
			})

			;(mockSupabase.from as jest.Mock).mockImplementation(mockSupabaseFrom)

			await expect(syncService.fetchAndUpdateLocal(userId)).rejects.toThrow(mockError)

			// Database should not be updated
			expect(mockDb.runAsync).not.toHaveBeenCalled()
		})

		it('should return null if no data is returned from Supabase', async () => {
			const userId = 'user-123'

			const mockSupabaseFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: null,
						}),
					}),
				}),
			})

			;(mockSupabase.from as jest.Mock).mockImplementation(mockSupabaseFrom)

			const result = await syncService.fetchAndUpdateLocal(userId)

			// Database should not be updated
			expect(mockDb.runAsync).not.toHaveBeenCalled()
			expect(result).toBeNull()
		})
	})

	describe('getLocalProfile', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should return the local profile when found', async () => {
			const userId = 'user-123'
			const mockProfile = {
				id: userId,
				experience_points: 150,
			}

			mockDb.getFirstAsync.mockResolvedValue(mockProfile)

			const result = await syncService.getLocalProfile(userId)

			expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM user_profile WHERE id = ?', [
				userId,
			])

			expect(result).toEqual(mockProfile)
		})

		it('should throw an error when profile is not found', async () => {
			mockDb.getFirstAsync.mockResolvedValue(null)

			await expect(syncService.getLocalProfile('missing')).rejects.toThrow(
				'Profile not found for user missing',
			)
		})
	})

	describe('updateLocalProfile', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should update local profile without syncing', async () => {
			const userId = 'user-123'
			const newXp = 300

			mockDb.runAsync.mockResolvedValue(undefined)

			await syncService.updateLocalProfileXp(userId, newXp)

			expect(mockDb.runAsync).toHaveBeenCalledTimes(1)
			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE user_profile'),
				expect.arrayContaining([newXp, expect.any(String), userId]),
			)
		})
	})

	describe('addToSyncQueue', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should insert into sync_queue', async () => {
			mockDb.runAsync.mockResolvedValue(undefined)

			await syncService.addToSyncQueue('profiles', 'update', { id: '1' }, 50)

			expect(mockDb.runAsync).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO sync_queue'),
				['profiles', 'update', JSON.stringify({ id: '1' }), 50],
			)
		})
	})

	describe('updateUserXp', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should call supabase update with correct fields', async () => {
			const updateFn = jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			})

			mockSupabase.from = jest.fn().mockReturnValue({
				update: updateFn,
			})

			const err = await syncService.updateUserXp('user-1', 500)

			expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
			expect(updateFn).toHaveBeenCalled()

			expect(err).toBe(null)
		})
	})

	describe('hasPendingSyncs', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should return true when count > 0', async () => {
			mockDb.getFirstAsync.mockResolvedValue({ count: 3 })

			const result = await syncService.hasPendingSyncs()
			expect(result).toBe(true)
		})

		it('should return false when count = 0', async () => {
			mockDb.getFirstAsync.mockResolvedValue({ count: 0 })

			const result = await syncService.hasPendingSyncs()
			expect(result).toBe(false)
		})
	})

	describe('getSyncStatus', () => {
		it('should return the sync status flags', () => {
			const service = new SyncService()
			expect(service.getSyncStatus()).toEqual({
				isSyncing: false,
				isInitialized: false,
			})
		})
	})

	describe('syncToSupabase (edge cases)', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should skip if already syncing', async () => {
			syncService['isSyncing'] = true
			const spy = jest.spyOn(console, 'log').mockImplementation(() => {})

			await syncService.syncToSupabase('user-1')

			expect(spy).toHaveBeenCalledWith('Already syncing, skipping.')
		})
	})

	describe('syncToSupabase offline', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should skip syncing when offline', async () => {
			;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false })

			const spy = jest.spyOn(console, 'log').mockImplementation(() => {})

			await syncService.syncToSupabase('user-1')

			expect(spy).toHaveBeenCalledWith('Offline - will sync later')
		})
	})

	// ========== INTEGRATION-STYLE TESTS ==========

	describe('Multiple operations', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should handle multiple consecutive fetches', async () => {
			const userId1 = 'user-1'
			const userId2 = 'user-2'

			const mockProfiles = {
				'user-1': {
					id: userId1,
					experience_points: 100,
					last_synced: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
				},
				'user-2': {
					id: userId2,
					experience_points: 200,
					last_synced: '2024-01-02T00:00:00Z',
					updated_at: '2024-01-02T00:00:00Z',
				},
			}

			const mockSupabaseFrom = jest.fn().mockImplementation(() => ({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockImplementation((col, val) => ({
						single: jest.fn().mockResolvedValue({
							data: mockProfiles[val as keyof typeof mockProfiles],
							error: null,
						}),
					})),
				}),
			}))

			;(mockSupabase.from as jest.Mock).mockImplementation(mockSupabaseFrom)

			await syncService.fetchAndUpdateLocal(userId1)
			await syncService.fetchAndUpdateLocal(userId2)

			expect(mockDb.runAsync).toHaveBeenCalledTimes(2)
			expect(mockSupabase.from).toHaveBeenCalledTimes(2)
		})
	})

	// ========== ERROR HANDLING TESTS ==========

	describe('Error handling', () => {
		beforeEach(async () => {
			await syncService.init(mockDb, mockSupabase)
		})

		it('should handle database errors during update', async () => {
			const userId = 'user-123'
			const mockProfile = {
				id: userId,
				experience_points: 100,
				last_synced: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
			}

			const mockSupabaseFrom = jest.fn().mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: mockProfile,
							error: null,
						}),
					}),
				}),
			})

			;(mockSupabase.from as jest.Mock).mockImplementation(mockSupabaseFrom)

			// Mock database error
			mockDb.runAsync.mockRejectedValueOnce(new Error('Database error'))

			await expect(syncService.fetchAndUpdateLocal(userId)).rejects.toThrow('Database error')
		})
	})
})
