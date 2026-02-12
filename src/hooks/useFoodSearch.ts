import { foodSearchService } from '@server/services/foodSearch'
import { useState } from 'react'
import { FoodDetails, FoodMeta } from 'src/types/localstore'

export const useFoodSearch = () => {
	const [foods, setFoods] = useState<FoodMeta[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const search = async (searchTerm: string) => {
		setIsLoading(true)
		setError(null)

		try {
			const foodsResponse = await foodSearchService.searchFoods(searchTerm)
			setFoods(foodsResponse)
		} catch (err) {
			setError('Failed to get response. Please try again.')
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	const getFoodDetails = async (foodId: string): Promise<FoodDetails> => {
		setIsLoading(true)
		setError(null)

		try {
			const foodResponse = await foodSearchService.getFoodDetails(foodId)
			return foodResponse
		} catch (err) {
			setError('Failed to get response. Please try again.')
			console.error(err)
			return null
		} finally {
			setIsLoading(false)
		}
	}

	const getFoodByBarcode = async (barcode: string): Promise<FoodDetails> => {
		setIsLoading(true)
		setError(null)

		try {
			const foodResponse = await foodSearchService.getFoodByBarcode(barcode)
			if (!foodResponse) {
				setError('Food not found for this barcode.')
				return null
			}
			return foodResponse
		} catch (err) {
			setError('Failed to get response. Please try again.')
			console.error(err)
			return null
		} finally {
			setIsLoading(false)
		}
	}

	const clearFoods = () => {
		setFoods([])
	}

	return {
		foods,
		search,
		isLoading,
		error,
		getFoodDetails,
		getFoodByBarcode,
		clearFoods,
	}
}
