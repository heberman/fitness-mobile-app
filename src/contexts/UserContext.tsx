import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@server/db'
import { User, Session, AuthError } from '@supabase/supabase-js'

type AuthResponse = {
	data: { user: User | null; session: Session | null } | null
	error: AuthError | null
}

type UserContextType = {
	user: User | null
	session: Session | null
	loading: boolean
	signIn: (email: string, password: string) => Promise<AuthResponse>
	signUp: (email: string, password: string) => Promise<AuthResponse>
	signOut: () => Promise<{ error: AuthError | null }>
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

type UserProviderProps = {
	children: ReactNode
}

export const UserProvider = ({ children }: UserProviderProps) => {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
			setUser(session?.user ?? null)
			setLoading(false)
		})

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
			setUser(session?.user ?? null)
			setLoading(false)
		})

		return () => subscription.unsubscribe()
	}, [])

	const signIn = async (email: string, password: string): Promise<AuthResponse> => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})
		return { data, error }
	}

	const signUp = async (email: string, password: string): Promise<AuthResponse> => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		})
		return { data, error }
	}

	const signOut = async (): Promise<{ error: AuthError | null }> => {
		const { error } = await supabase.auth.signOut()
		return { error }
	}

	const value: UserContextType = {
		user,
		session,
		loading,
		signIn,
		signUp,
		signOut,
	}

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
