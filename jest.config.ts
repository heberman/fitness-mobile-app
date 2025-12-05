module.exports = {
	preset: 'jest-expo',
	testEnvironment: 'node',
	roots: ['<rootDir>'],
	testMatch: ['**/__tests__/**/*.test.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^~/(.*)$': '<rootDir>/src/$1',
	},
	testPathIgnorePatterns: ['/node_modules/'],
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
	],
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
}
