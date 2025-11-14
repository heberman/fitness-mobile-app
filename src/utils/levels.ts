/**
 * Calculate level based on XP
 * Example: Level 1 = 0-99 XP, Level 2 = 100-299 XP, etc.
 */
export function calculateLevel(xp: number): number {
  // Simple formula: Level = floor(sqrt(XP / 100)) + 1
  // Adjust this to match your game design
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  // Inverse of calculateLevel
  return currentLevel * currentLevel * 100;
}

/**
 * Get XP progress to next level as percentage
 */
export function getLevelProgress(xp: number, level: number): number {
  const currentLevelXP = getXPForNextLevel(level - 1);
  const nextLevelXP = getXPForNextLevel(level);
  const progress =
    ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
