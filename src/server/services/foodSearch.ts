import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/db'
import { FoodDetails, FoodMeta } from 'src/types/localstore'

const PROXY_URL = process.env.EXPO_PUBLIC_FATSECRET_PROXY_URL

export class FoodSearchService {
	private supabase: SupabaseClient<Database> | null = null

	async init(supabase: SupabaseClient<Database>): Promise<void> {
		console.log('Initializing food search service...')
		this.supabase = supabase
	}

	async searchFoods(searchTerm: string): Promise<FoodMeta[]> {
		const response = await fetch(`${PROXY_URL}/api/foods/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ searchTerm }),
		})

		if (!response.ok) {
			throw new Error('Failed to search foods')
		}

		const data = await response.json()

		if (data.error) throw data

		if (!data.foods?.food) return []

		return Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food]
	}

	async getFoodDetails(foodId: string): Promise<FoodDetails> {
		const response = await fetch(`${PROXY_URL}/api/foods/${foodId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		})

		if (!response.ok) {
			throw new Error('Failed to get food details')
		}

		const data = await response.json()

		if (data.error) throw data

		return data.food
	}

	async getFoodByBarcode(barcode: string): Promise<FoodDetails | null> {
		const response = await fetch(`${PROXY_URL}/api/foods/barcode`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ barcode }),
		})

		if (response.status === 404) {
			return null // Barcode not found
		}

		if (!response.ok) {
			throw new Error('Failed to lookup barcode')
		}

		const data = await response.json()

		if (data.error) throw data

		return data.food
	}
}

export const foodSearchService = new FoodSearchService()
