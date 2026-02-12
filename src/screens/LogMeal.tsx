import React, { useState } from 'react'
import {
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	FlatList,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Keyboard,
} from 'react-native'
import ThemedText from '@components/ThemedText'
import ThemedButton from '@components/ThemedButton'
import { Colors } from '@constants/Colors'
import ThemedInput from '@components/ThemedInput'
import { useDailyTracking } from '@hooks/useDailyTracking'
import PageHeader from '@components/PageHeader'
import { router } from 'expo-router'
import ThemedView from '@components/ThemedView'
import { NewMeal } from 'src/types/localstore'
import { useLogMeal } from '@hooks/useLogMeal'

const LogMealScreen = () => {
	const [name, setName] = useState('')

	const { logMeal } = useDailyTracking()
	const { foods, totalMacros, removeFood, clearFoods } = useLogMeal()

	const handleSubmit = async () => {
		if (foods.length === 0) {
			Alert.alert('Invalid Input', 'Please add at least one food item.')
			return
		}
		if (!name.trim()) {
			Alert.alert('Invalid Input', 'Please enter a valid meal name.')
			return
		}
		const newMeal: NewMeal = {
			name,
			...totalMacros,
		}
		console.log('New meal to log:', newMeal)
		try {
			await logMeal(newMeal)
			clearFoods()
			router.back()
		} catch (error) {
			console.error('Error logging meal:', error)
			Alert.alert('Error', 'Failed to log meal. Please try again.')
		}
	}

	const onAddFoodPress = () => {
		router.push('/add-food')
	}

	const handleRemoveFood = (foodId: string, foodName: string) => {
		Alert.alert(
			'Remove Food',
			`Are you sure you want to remove "${foodName}"?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Remove',
					style: 'destructive',
					onPress: () => removeFood(foodId),
				},
			],
			{ cancelable: true },
		)
	}

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<KeyboardAvoidingView style={styles.container} behavior="padding">
				<PageHeader title="Log Meal" />
				<ThemedView style={styles.formContainer}>
					<ThemedView style={{}}>
						<ThemedInput
							placeholder="Meal name"
							value={name}
							onChangeText={setName}
							style={styles.input}
							placeholderTextColor={Colors.placeholderText}
						/>
						{foods.length > 0 && (
							<ThemedView style={styles.totalMacros}>
								<ThemedText style={styles.totalLabel}>Total Macros:</ThemedText>
								<ThemedText style={styles.totalText}>
									Calories: {totalMacros.calories.toFixed(0)}
								</ThemedText>
								<ThemedText style={styles.totalText}>
									Protein: {totalMacros.protein.toFixed(1)}g
								</ThemedText>
								<ThemedText style={styles.totalText}>
									Carbs: {totalMacros.carbs.toFixed(1)}g
								</ThemedText>
								<ThemedText style={styles.totalText}>Fat: {totalMacros.fat.toFixed(1)}g</ThemedText>
							</ThemedView>
						)}
						<FlatList
							data={foods}
							keyExtractor={(item) => item.id}
							renderItem={({ item }) => (
								<ThemedView style={styles.foodItem}>
									<ThemedView style={styles.foodItemText}>
										<ThemedText style={styles.foodName} numberOfLines={1}>
											{item.name}
										</ThemedText>
										<ThemedText style={styles.foodMacros}>
											{`${item.calories} cal | P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fat}g`}
										</ThemedText>
									</ThemedView>
									<TouchableOpacity
										onPress={() => handleRemoveFood(item.id, item.name)}
										style={styles.removeButton}
									>
										<ThemedText style={styles.removeText}>✕</ThemedText>
									</TouchableOpacity>
								</ThemedView>
							)}
						/>
						<ThemedButton onPress={onAddFoodPress} style={styles.button}>
							<ThemedText style={styles.buttonText}>Add food</ThemedText>
						</ThemedButton>
					</ThemedView>
					<ThemedButton onPress={handleSubmit} style={styles.button}>
						<ThemedText style={styles.buttonText}>Log</ThemedText>
					</ThemedButton>
				</ThemedView>
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	mealContainer: {
		flex: 1,
	},
	input: {
		padding: 12,
		marginBottom: 12,
	},
	searchButtonContainer: {
		padding: 24,
		borderBottomWidth: 1,
		borderBottomColor: Colors.surfaceBackground,
	},
	formContainer: {
		padding: 24,
		flex: 1,
		justifyContent: 'space-between',
	},
	totalMacros: {
		padding: 16,
		marginBottom: 16,
		backgroundColor: Colors.surfaceBackground,
		borderRadius: 8,
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	totalText: {
		fontSize: 16,
		marginVertical: 2,
	},
	foodItem: {
		padding: 12,
		borderWidth: 1,
		borderColor: Colors.text,
		borderRadius: 8,
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	foodItemText: {
		flex: 1,
	},
	foodName: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	foodMacros: {
		fontSize: 14,
		color: Colors.placeholderText,
	},
	removeButton: {
		padding: 5,
	},
	removeText: {
		fontSize: 20,
	},
	button: {
		alignItems: 'center',
		borderRadius: 8,
		marginBottom: 16,
		backgroundColor: Colors.primary,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
})

export default LogMealScreen
