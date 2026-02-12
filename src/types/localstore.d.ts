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

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

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

export type NewMeal = Pick<Meal, 'name' | 'calories' | 'fat' | 'protein' | 'carbs'>
export type TodayMeal = NewMeal & { id: string }
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
	proteinGrams: number
	carbsGrams: number
	fatGrams: number
}

export type TodayProgress = TodayData & {
	xpGained: number
}

export type FoodMeta = {
	food_id: string
	food_name: string
	food_type: string
	brand_name?: string
}

export type Serving = {
	serving_id: string
	serving_description: string
	calories: number
	carbohydrate: number
	protein: number
	fat: number
}

export type FoodDetails = FoodMeta & {
	servings: { serving: Serving[] | Serving }
}

export type Macros = Pick<Meal, 'calories' | 'fat' | 'protein' | 'carbs'>
