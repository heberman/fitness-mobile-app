import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { dailyTrackingService } from '@services/dailyTracking'
import { useUser } from '@hooks/useUser'
import type { NewMeal, TodayMeal, TodayProgress, TodayWorkout } from '../types/localstore'
import { useProfile } from '@hooks/useProfile'
import {
	XP_CALORIE_BURNED,
	XP_GLASS_WATER,
	XP_MEAL_LOGGED,
	XP_MINUTE_SLEEP,
} from '@constants/XpValues'
import * as ExpoCrypto from 'expo-crypto'

export type DailyTrackingContextType = {
	// Today's data
	todayProgress: TodayProgress | null
	loading: boolean
	error: Error | null

	// Actions for meals
	logMeal: (newMeal: NewMeal) => Promise<void>

	// Actions for workouts
	logWorkout: (caloriesBurned: number) => Promise<void>

	// Actions for stats
	addWater: () => Promise<void>
	addSleep: (minutes: number) => Promise<void>

	// Refresh
	refreshTodayData: () => Promise<void>
}

export const DailyTrackingContext = createContext<DailyTrackingContextType | undefined>(undefined)

export function DailyTrackingProvider({ children }: { children: ReactNode }) {
	const { user } = useUser()
	const { awardXp: awardXP } = useProfile()
	const [todayProgress, setTodayProgress] = useState<TodayProgress | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	// Load today's data when user changes
	const loadTodayData = useCallback(async () => {
		if (!user?.id) {
			setTodayProgress(null)
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			const data = await dailyTrackingService.getTodayProgress(user.id)
			setTodayProgress(data)
			setError(null)
		} catch (err) {
			console.error('Failed to load today data:', err)
			setError(err as Error)
		} finally {
			setLoading(false)
		}
	}, [user?.id])

	useEffect(() => {
		loadTodayData()
	}, [loadTodayData])

	const logMeal = useCallback(
		async (newMeal: NewMeal): Promise<void> => {
			if (!user?.id || !todayProgress) {
				throw new Error('No user or data available')
			}

			const todayMeal: TodayMeal = {
				id: ExpoCrypto.randomUUID(),
				...newMeal,
			}

			awardXP(XP_MEAL_LOGGED)

			setTodayProgress((prev) => {
				if (!prev) return prev

				const newMeals = [...prev.meals, todayMeal]
				const newCaloriesConsumed = prev.caloriesConsumed + todayMeal.calories
				const newProtienGrams = prev.proteinGrams + todayMeal.protein
				const newCarbsGrams = prev.carbsGrams + todayMeal.carbs
				const newFatGrams = prev.fatGrams + todayMeal.fat

				return {
					...prev,
					meals: newMeals,
					caloriesConsumed: newCaloriesConsumed,
					proteinGrams: newProtienGrams,
					carbsGrams: newCarbsGrams,
					fatGrams: newFatGrams,
					xpGained: prev.xpGained + XP_MEAL_LOGGED,
				}
			})

			try {
				await dailyTrackingService.logMeal(user.id, todayMeal)
			} catch (err) {
				console.error('Failed to log meal:', err)
				// Reload to get accurate state
				await loadTodayData()
				throw err
			}
		},
		[user?.id, todayProgress, loadTodayData],
	)

	const logWorkout = useCallback(
		async (caloriesBurned: number): Promise<void> => {
			if (!user?.id || !todayProgress) {
				throw new Error('No user or data available')
			}

			const newWorkout: TodayWorkout = {
				id: ExpoCrypto.randomUUID(),
				caloriesBurned,
			}

			const xpGained = XP_CALORIE_BURNED * caloriesBurned

			awardXP(xpGained)

			setTodayProgress((prev) => {
				if (!prev) return prev
				const newWorkouts = [...prev.workouts, newWorkout]
				const newCaloriesBurned = prev.caloriesBurned + caloriesBurned

				return {
					...prev,
					workouts: newWorkouts,
					caloriesBurned: newCaloriesBurned,
					xpGained: prev.xpGained + xpGained,
				}
			})

			try {
				await dailyTrackingService.logWorkout(user.id, newWorkout)
			} catch (err) {
				console.error('Failed to log workout:', err)
				await loadTodayData()
				throw err
			}
		},
		[user?.id, todayProgress, loadTodayData],
	)

	const addWater = useCallback(async (): Promise<void> => {
		if (!user?.id || !todayProgress) {
			throw new Error('No user or data available')
		}

		awardXP(XP_GLASS_WATER)

		setTodayProgress((prev) => {
			if (!prev) return prev

			return {
				...prev,
				waterGlasses: prev.waterGlasses + 1,
				xpGained: prev.xpGained + XP_GLASS_WATER,
			}
		})

		try {
			await dailyTrackingService.addWater(user.id)
		} catch (err) {
			console.error('Failed to add water:', err)
			await loadTodayData()
			throw err
		}
	}, [user?.id, todayProgress, loadTodayData])

	const addSleep = useCallback(
		async (minutes: number): Promise<void> => {
			if (!user?.id || !todayProgress) {
				throw new Error('No user or data available')
			}

			const xpGained = minutes * XP_MINUTE_SLEEP

			awardXP(xpGained)

			setTodayProgress((prev) => {
				if (!prev) return prev

				return {
					...prev,
					sleepMinutes: prev.sleepMinutes + minutes,
					xpGained: prev.xpGained + xpGained,
				}
			})

			try {
				await dailyTrackingService.addSleep(user.id, minutes)
			} catch (err) {
				console.error('Failed to add sleep:', err)
				await loadTodayData()
				throw err
			}
		},
		[user?.id, todayProgress, loadTodayData],
	)

	const refreshTodayData = useCallback(async () => {
		await loadTodayData()
	}, [loadTodayData])

	return (
		<DailyTrackingContext.Provider
			value={{
				todayProgress,
				loading,
				error,
				logMeal,
				logWorkout,
				addWater,
				addSleep,
				refreshTodayData,
			}}
		>
			{children}
		</DailyTrackingContext.Provider>
	)
}
