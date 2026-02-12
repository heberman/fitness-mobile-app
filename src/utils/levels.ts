/**
 * Calculate level based on XP
 */
export function calculateLevel(xp: number): number {
	// Simple formula: Level = floor(sqrt(XP / 1000)) + 1
	// Adjust this to match your game design
	return Math.floor(Math.sqrt(xp / 1000)) + 1
}

/**
 * Calculate total XP needed for next level
 */
export function getTotalXpNeededForNextLevel(level: number): number {
	// Inverse of calculateLevel
	return level * level * 1000
}

/**
 * Calculate XP need for next level
 */
export function getXpNeedForNextLevel(totalXp: number): number {
	const currentLevel = calculateLevel(totalXp)
	return getTotalXpNeededForNextLevel(currentLevel) - totalXp
}

/**
 * Get XP progress to next level as percentage
 */
export function getLevelProgress(xp: number, level: number): number {
	const currentLevelXP = getTotalXpNeededForNextLevel(level - 1)
	const nextLevelXP = getTotalXpNeededForNextLevel(level)
	const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 1000
	return Math.min(Math.max(progress, 0), 100)
}
