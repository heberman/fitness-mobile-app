import { createContext, ReactNode, useMemo, useState } from 'react'
import { Macros, NewMeal, TodayMeal } from 'src/types/localstore'
import * as ExpoCrypto from 'expo-crypto'

export type LogMealContextType = {
	foods: TodayMeal[]
	totalMacros: Macros
	addFood: (food: NewMeal) => void
	removeFood: (foodId: string) => void
	clearFoods: () => void
}

export const LogMealContext = createContext<LogMealContextType | undefined>(undefined)

export function LogMealProvider({ children }: { children: ReactNode }) {
	const [foods, setFoods] = useState<TodayMeal[]>([])

	const totalMacros = useMemo(() => {
		return foods.reduce(
			(acc, food) => {
				acc.calories += food.calories
				acc.protein += food.protein
				acc.carbs += food.carbs
				acc.fat += food.fat
				return acc
			},
			{ calories: 0, protein: 0, carbs: 0, fat: 0 },
		)
	}, [foods])

	const addFood = (food: NewMeal) => {
		const newFood: TodayMeal = {
			id: ExpoCrypto.randomUUID(),
			...food,
		}
		setFoods((prevFoods) => [...prevFoods, newFood])
	}

	const removeFood = (foodId: string) => {
		setFoods((prevFoods) => prevFoods.filter((food) => food.id !== foodId))
	}

	const clearFoods = () => {
		setFoods([])
	}

	return (
		<LogMealContext.Provider value={{ foods, totalMacros, addFood, removeFood, clearFoods }}>
			{children}
		</LogMealContext.Provider>
	)
}
