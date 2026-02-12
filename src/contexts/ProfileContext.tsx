import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { ProfileUpdate, UserProfile } from '../types/localstore'
import { useUser } from '@hooks/useUser'
import { syncService } from '@services/sync'

type ProfileContextType = {
	profile: UserProfile | null
	loading: boolean
	error: Error | null
	awardXp: (xpAmount: number) => Promise<void>
	updateProfile: (newProfile: ProfileUpdate) => Promise<void>
	refreshProfile: () => Promise<void>
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
	const { user } = useUser()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	// Load profile once when user changes
	useEffect(() => {
		if (!user?.id) {
			setProfile(null)
			setLoading(false)
			return
		}

		const loadProfile = async () => {
			try {
				setLoading(true)
				const data = await syncService.getLocalProfile(user.id)
				setProfile(data)
				setError(null)
			} catch (err) {
				console.error('Failed to load profile:', err)
				setError(err as Error)
			} finally {
				setLoading(false)
			}
		}

		loadProfile()
	}, [user?.id])

	const updateProfile = useCallback(
		async (newProfile: ProfileUpdate): Promise<void> => {
			if (!user?.id) {
				throw new Error('No user available')
			}

			try {
				const updatedProfile = await syncService.updateProfile(user.id, newProfile)
				setProfile(updatedProfile)
			} catch (err) {
				console.error('Failed to update profile:', err)
				throw err
			}
		},
		[user?.id],
	)

	// Award XP with optimistic update
	const awardXp = useCallback(
		async (xpAmount: number): Promise<void> => {
			if (!user?.id || !profile) {
				throw new Error('No user or profile available')
			}

			const newXP = profile.experience_points + xpAmount

			// Optimistic update - update UI immediately
			const updatedProfile = {
				...profile,
				experience_points: newXP,
			}
			setProfile(updatedProfile)

			try {
				// Update local
				await syncService.updateLocalProfileXp(user.id, newXP)
			} catch (err) {
				// Rollback on error
				console.error('Failed to award XP:', err)
				setProfile(profile) // Revert to previous state
				throw err
			}
		},
		[user?.id, profile],
	)

	// Refresh profile from local DB
	const refreshProfile = useCallback(async () => {
		if (!user?.id) return

		try {
			const data = await syncService.getLocalProfile(user.id)
			setProfile(data)
		} catch (err) {
			console.error('Failed to refresh profile:', err)
		}
	}, [user?.id])

	return (
		<ProfileContext.Provider
			value={{
				profile,
				loading,
				error,
				awardXp,
				updateProfile,
				refreshProfile,
			}}
		>
			{children}
		</ProfileContext.Provider>
	)
}
