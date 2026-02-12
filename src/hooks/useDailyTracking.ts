import { useContext } from 'react'
import { DailyTrackingContext, DailyTrackingContextType } from '@contexts/DailyTrackingContext'

export function useDailyTracking(): DailyTrackingContextType {
	const context = useContext(DailyTrackingContext)
	if (!context) {
		throw new Error('useDailyTracking must be used within DailyTrackingProvider')
	}
	return context
}
