import React, { useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import ThemedText from '@components/ThemedText'
import ThemedCard from '@components/ThemedCard'
import ThemedButton from '@components/ThemedButton'
import { Colors } from '@constants/Colors'
import ThemedInput from '@components/ThemedInput'

const LogSleepForm = ({
	onSubmit,
	onCancel,
}: {
	onSubmit: (minutes: number) => void
	onCancel: () => void
}) => {
	const [minutes, setMinutes] = useState('')

	const handleSubmit = () => {
		const parsedMinutes = parseInt(minutes, 10)
		if (!isNaN(parsedMinutes) && parsedMinutes > 0) {
			onSubmit(parsedMinutes)
		} else {
			Alert.alert('Invalid Input', 'Please enter a positive number of minutes.')
		}
	}

	return (
		<ThemedCard style={styles.loggingCard}>
			<ThemedText title style={styles.loggingCardTitle}>
				Log Sleep
			</ThemedText>
			<ThemedInput
				placeholder="Minutes"
				value={minutes}
				onChangeText={setMinutes}
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

export default LogSleepForm
