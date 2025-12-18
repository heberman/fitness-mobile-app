/**
 * Format the "member since" date
 * Returns month name if same year, otherwise returns year
 * @param createdAt - ISO timestamp string from created_at field
 * @returns Formatted string (e.g., "January" or "2023")
 */
export const formatMemberSince = (createdAt: string | null | undefined): string => {
	if (!createdAt) return 'Unknown'

	const joinDate = new Date(createdAt)
	const currentDate = new Date()

	// Check if same calendar year
	if (joinDate.getFullYear() === currentDate.getFullYear()) {
		// Return month name
		return joinDate.toLocaleDateString('en-US', { month: 'long' })
	} else {
		// Return year
		return joinDate.getFullYear().toString()
	}
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - ISO date string (YYYY-MM-DD) or timestamp
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
	if (!dateOfBirth) return null

	const birthDate = new Date(dateOfBirth)
	const today = new Date()

	let age = today.getFullYear() - birthDate.getFullYear()
	const monthDiff = today.getMonth() - birthDate.getMonth()

	// Adjust age if birthday hasn't occurred yet this year
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--
	}

	return age
}

/**
 * Convert total inches to formatted feet and inches string
 * @param inches - Total height in inches
 * @returns Formatted string (e.g., "5'10\"" or "Not set")
 */
export const formatHeight = (inches: number | null | undefined): string => {
	if (!inches || inches <= 0) return 'Not set'

	const feet = Math.floor(inches / 12)
	const remainingInches = Math.round(inches % 12)

	return `${feet}' ${remainingInches}"`
}
