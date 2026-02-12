import React, { useState, useCallback } from 'react'
import { StyleSheet, View, Alert, ActivityIndicator } from 'react-native'
import ThemedView from '@components/ThemedView'
import ThemedText from '@components/ThemedText'
import ThemedCard from '@components/ThemedCard'
import { useProfile } from '@hooks/useProfile'
import { calculateLevel, getXpNeedForNextLevel } from '../../utils/levels'
import ThemedButton from '@components/ThemedButton'
import { useDailyTracking } from '@hooks/useDailyTracking'
import { Colors } from '@constants/Colors'

import LogWorkoutForm from './LogWorkoutForm'
import LogWaterForm from './LogWaterForm'
import LogSleepForm from './LogSleepForm'
import ThemedScrollView from '@components/ThemedScrollView'
import { router } from 'expo-router'

export enum LoggingFormType {
	None = 'None',
	Meal = 'Meal',
	Workout = 'Workout',
	Water = 'Water',
	Sleep = 'Sleep',
}

export default function Dashboard() {
	const { profile, loading: profileLoading } = useProfile()
	const { todayProgress, logWorkout, addWater, addSleep } = useDailyTracking()

	// State to manage which logging form is visible
	const [currentLoggingForm, setCurrentLoggingForm] = useState<LoggingFormType>(
		LoggingFormType.None,
	)

	// Helper to close all logging forms
	const closeLoggingForm = useCallback(() => {
		setCurrentLoggingForm(LoggingFormType.None)
	}, [])

	// Handlers for button presses to open specific forms
	const handleLogMealPress = useCallback(() => {
		router.push('/log-meal')
	}, [])

	const handleLogWorkoutPress = useCallback(() => {
		setCurrentLoggingForm(LoggingFormType.Workout)
	}, [])

	const handleLogWaterPress = useCallback(() => {
		setCurrentLoggingForm(LoggingFormType.Water)
	}, [])

	const handleLogSleepPress = useCallback(() => {
		setCurrentLoggingForm(LoggingFormType.Sleep)
	}, [])

	// Handlers for submitting data from the logging forms
	const handleLogWorkoutSubmit = async (caloriesBurned: number) => {
		try {
			closeLoggingForm()
			await logWorkout(caloriesBurned)
		} catch (error) {
			console.error('Error logging workout:', error)
			Alert.alert('Error', 'Failed to log workout. Please try again.')
		}
	}

	const handleLogWaterSubmit = async () => {
		try {
			await addWater()
		} catch (error) {
			console.error('Error logging water:', error)
			Alert.alert('Error', 'Failed to log water. Please try again.')
		}
	}

	const handleLogSleepSubmit = async (minutes: number) => {
		try {
			closeLoggingForm()
			await addSleep(minutes)
		} catch (error) {
			console.error('Error logging sleep:', error)
			Alert.alert('Error', 'Failed to log sleep. Please try again.')
		}
	}

	// Show loading indicator if profile or todayData is not yet loaded
	if (profileLoading || !profile || !todayProgress) {
		return (
			<ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={Colors.logo} />
			</ThemedView>
		)
	}

	return (
		<ThemedScrollView safe style={{}}>
			<ThemedView style={styles.container}>
				<ThemedText title style={styles.appName}>
					FitGenie
				</ThemedText>
				<ThemedCard style={styles.levelCard}>
					<ThemedText title style={styles.levelText}>{`Level ${calculateLevel(
						profile.experience_points,
					)}`}</ThemedText>
					<View>
						<ThemedText style={{}}>{`XP earned today: ${todayProgress.xpGained}`}</ThemedText>
						<ThemedText style={{}}>{`XP needed for next level: ${getXpNeedForNextLevel(
							profile.experience_points,
						)}`}</ThemedText>
					</View>
				</ThemedCard>

				{/* Stats for the day */}
				<ThemedCard style={styles.statsCard}>
					<View style={styles.stat}>
						<ThemedText title style={{ ...styles.statNumberText, color: 'lightgreen' }}>
							{todayProgress.caloriesConsumed}
						</ThemedText>
						<ThemedText style={{}}>Calories consumed</ThemedText>
					</View>
					<View style={styles.stat}>
						<ThemedText title style={{ ...styles.statNumberText, color: 'lightcoral' }}>
							{todayProgress.caloriesBurned}
						</ThemedText>
						<ThemedText style={{}}>Calories burned</ThemedText>
					</View>
					<View style={styles.stat}>
						<ThemedText title style={{ ...styles.statNumberText, color: 'lightblue' }}>
							{todayProgress.waterGlasses}
						</ThemedText>
						<ThemedText style={{}}>Water glasses drank</ThemedText>
					</View>
					<View style={styles.stat}>
						<ThemedText title style={{ ...styles.statNumberText, color: 'plum' }}>
							{Math.round((todayProgress.sleepMinutes / 60) * 10) / 10}
						</ThemedText>
						<ThemedText style={{}}>Hours of sleep</ThemedText>
					</View>
				</ThemedCard>

				<ThemedCard style={styles.macrosCard}>
					<View style={styles.macro}>
						<ThemedText title style={{ ...styles.statNumberText }}>
							{todayProgress.proteinGrams}
						</ThemedText>
						<ThemedText style={{}}>Protein (g)</ThemedText>
					</View>
					<View style={styles.macro}>
						<ThemedText title style={{ ...styles.statNumberText }}>
							{todayProgress.carbsGrams}
						</ThemedText>
						<ThemedText style={{}}>Carbs (g)</ThemedText>
					</View>
					<View style={styles.macro}>
						<ThemedText title style={{ ...styles.statNumberText }}>
							{todayProgress.fatGrams}
						</ThemedText>
						<ThemedText style={{}}>Fat (g)</ThemedText>
					</View>
				</ThemedCard>

				<View style={styles.buttonGroup}>
					{/* Meal and Workout Buttons */}
					<View style={styles.buttonRow}>
						<ThemedButton onPress={handleLogMealPress} style={styles.logButton}>
							<ThemedText style={styles.logButtonText}>Log Meal</ThemedText>
						</ThemedButton>
						<ThemedButton onPress={handleLogWorkoutPress} style={styles.logButton}>
							<ThemedText style={styles.logButtonText}>Log Workout</ThemedText>
						</ThemedButton>
					</View>
					{/* Water and Sleep Buttons */}
					<View style={styles.buttonRow}>
						<ThemedButton onPress={handleLogWaterPress} style={styles.logButton}>
							<ThemedText style={styles.logButtonText}>Log Water</ThemedText>
						</ThemedButton>
						<ThemedButton onPress={handleLogSleepPress} style={styles.logButton}>
							<ThemedText style={styles.logButtonText}>Log Sleep</ThemedText>
						</ThemedButton>
					</View>
				</View>

				{/* Conditionally render Workout Log Form */}
				{currentLoggingForm === LoggingFormType.Workout && (
					<LogWorkoutForm onSubmit={handleLogWorkoutSubmit} onCancel={closeLoggingForm} />
				)}
				{/* Conditionally render Water Log Form */}
				{currentLoggingForm === LoggingFormType.Water && (
					<LogWaterForm onSubmit={handleLogWaterSubmit} onCancel={closeLoggingForm} />
				)}
				{/* Conditionally render Sleep Log Form */}
				{currentLoggingForm === LoggingFormType.Sleep && (
					<LogSleepForm onSubmit={handleLogSleepSubmit} onCancel={closeLoggingForm} />
				)}
			</ThemedView>
		</ThemedScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		gap: 24,
	},
	appName: {
		fontSize: 48,
		fontWeight: 'bold',
		color: Colors.logo,
	},
	levelCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	levelText: {
		fontSize: 36,
		fontWeight: 'bold',
	},
	statsCard: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		flexWrap: 'wrap',
		rowGap: 16,
	},
	macrosCard: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	stat: {
		width: '50%',
		alignItems: 'center',
	},
	macro: {
		alignItems: 'center',
	},
	statNumberText: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	buttonGroup: {
		gap: 16,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 16,
	},
	logButton: {
		flex: 1,
		alignItems: 'center',
	},
	logButtonText: {
		fontSize: 16,
	},
})
