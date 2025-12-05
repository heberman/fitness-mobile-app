import { Database } from './db'

export type DbUserProfile = Database['public']['Tables']['profiles']['Row']

export type UserProfile = DbUserProfile & {
	needs_sync?: number
}

export type SyncQueueItem = {
	id?: number
	table_name: string
	action: 'update' | 'insert' | 'delete'
	data: string
	xp_gained: number | null
	created_at?: string
}

export type ProfileUpdate = {
	xpGained: number
	level: number
}

export type DbWaterConsumption = Database['public']['Tables']['water_consumption']['Row']

export type WaterConsumption = DbWaterConsumption & {
	needs_sync?: number
}

export type DbSleep = Database['public']['Tables']['sleep']['Row']

export type Sleep = DbSleep & {
	needs_sync?: number
}

export type DbMeal = Database['public']['Tables']['meals']['Row']

export type Meal = DbMeal & {
	needs_sync?: number
}

export type DbWorkout = Database['public']['Tables']['workouts']['Row']

export type Workout = DbWorkout & {
	needs_sync?: number
}

export type TodayMeal = Pick<Meal, 'id' | 'name' | 'calories'>
export type TodayWorkout = {
	id: string
	caloriesBurned: number
}

export type TodayData = {
	meals: TodayMeal[]
	workouts: TodayWorkout[]
	caloriesConsumed: number
	caloriesBurned: number
	waterGlasses: number
	sleepMinutes: number
}

export type TodayProgress = TodayData & {
	xpGained: number
}
