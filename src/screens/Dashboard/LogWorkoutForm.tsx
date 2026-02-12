import React, { useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import ThemedText from '@components/ThemedText'
import ThemedCard from '@components/ThemedCard'
import ThemedButton from '@components/ThemedButton'
import { Colors } from '@constants/Colors'
import ThemedInput from '@components/ThemedInput'

const LogWorkoutForm = ({
	onSubmit,
	onCancel,
}: {
	onSubmit: (caloriesBurned: number) => void
	onCancel: () => void
}) => {
	const [calories, setCalories] = useState('')

	const handleSubmit = () => {
		const parsedCalories = parseInt(calories, 10)
		if (!isNaN(parsedCalories) && parsedCalories > 0) {
			onSubmit(parsedCalories)
		} else {
			Alert.alert('Invalid Input', 'Please enter a positive calorie count for the workout.')
		}
	}

	return (
		<ThemedCard style={styles.loggingCard}>
			<ThemedText title style={styles.loggingCardTitle}>
				Log Workout
			</ThemedText>
			<ThemedInput
				placeholder="Calories Burned"
				value={calories}
				onChangeText={setCalories}
				keyboardType="numeric"
				style={styles.input}
				placeholderTextColor={Colors.placeholderText}
			/>
			<View style={styles.loggingButtonContainer}>
				<ThemedButton onPress={handleSubmit} style={styles.loggingButton}>
					<ThemedText style={styles.loggingButtonText}>Log</ThemedText>
				</ThemedButton>
				<ThemedButton onPress={onCancel} style={[styles.loggingButton, styles.cancelButton]}>
					<ThemedText style={[styles.loggingButtonText, styles.cancelButtonText]}>
						Cancel
					</ThemedText>
				</ThemedButton>
			</View>
		</ThemedCard>
	)
}

const styles = StyleSheet.create({
	loggingCard: {
		padding: 16,
		marginBottom: 16,
		backgroundColor: Colors.surfaceBackground,
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	loggingCardTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
	},
	input: {
		height: 45,
		marginBottom: 12,
	},
	loggingButtonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
		gap: 16,
	},
	loggingButton: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: Colors.primary,
	},
	loggingButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	cancelButton: {
		backgroundColor: Colors.surfaceBackground,
	},
	cancelButtonText: {
		color: Colors.text,
	},
})

export default LogWorkoutForm
