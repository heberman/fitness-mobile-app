import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/db'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient<Database>(
	process.env.EXPO_PUBLIC_SUPABASE_URL!,
	process.env.EXPO_PUBLIC_SUPABASE_KEY!,
	{
		auth: {
			storage: AsyncStorage,
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: false,
		},
	},
)
