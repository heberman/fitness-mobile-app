import React from 'react'
import { StyleSheet, View } from 'react-native'
import ThemedText from '@components/ThemedText'
import ThemedCard from '@components/ThemedCard'
import ThemedButton from '@components/ThemedButton'
import { Colors } from '@constants/Colors'

const LogWaterForm = ({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) => {
	return (
		<ThemedCard style={styles.loggingCard}>
			<ThemedText title style={styles.loggingCardTitle}>
				Log Water
			</ThemedText>
			<View style={styles.loggingButtonContainer}>
				<ThemedButton onPress={onSubmit} style={styles.loggingButton}>
					<ThemedText style={styles.loggingButtonText}>Add glass</ThemedText>
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

export default LogWaterForm
