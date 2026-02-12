import { useContext } from 'react'
import { LogMealContext, LogMealContextType } from '@contexts/LogMealContext'

export function useLogMeal(): LogMealContextType {
	const context = useContext(LogMealContext)
	if (!context) {
		throw new Error('useLogMeal must be used within LogMealProvider')
	}
	return context
}
