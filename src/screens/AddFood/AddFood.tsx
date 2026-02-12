import React, { useState } from 'react'
import { StyleSheet, Alert, KeyboardAvoidingView } from 'react-native'
import ThemedText from '@components/ThemedText'
import ThemedButton from '@components/ThemedButton'
import { Colors } from '@constants/Colors'
import ThemedInput from '@components/ThemedInput'
import PageHeader from '@components/PageHeader'
import { router } from 'expo-router'
import ThemedView from '@components/ThemedView'
import { NewMeal } from 'src/types/localstore'
import FoodSearchModal from './FoodSearchModal'
import { useLogMeal } from '@hooks/useLogMeal'

const validatePositiveInteger = (value: string): number | null => {
	if (value.trim() === '') {
		return 0
	}
	const parsed = parseInt(value, 10)
	if (!isNaN(parsed) && parsed >= 0) {
		return parsed
	}
	return null
}

const validateNewFoodFromInputs = (
	name: string,
	calories: string,
	protein: string,
	carbs: string,
	fat: string,
): NewMeal | null => {
	const parsedCalories = validatePositiveInteger(calories)
	const parsedProtein = validatePositiveInteger(protein)
	const parsedCarbs = validatePositiveInteger(carbs)
	const parsedFat = validatePositiveInteger(fat)
	if (
		!name.trim() ||
		parsedCalories === null ||
		parsedProtein === null ||
		parsedCarbs === null ||
		parsedFat === null
	) {
		return null
	}
	return {
		name: name.trim(),
		calories: parsedCalories,
		protein: parsedProtein,
		carbs: parsedCarbs,
		fat: parsedFat,
	}
}

const AddFoodScreen = () => {
	const [name, setName] = useState('')
	const [calories, setCalories] = useState('')
	const [protein, setProtein] = useState('')
	const [carbs, setCarbs] = useState('')
	const [fat, setFat] = useState('')
	const [searchModalVisible, setSearchModalVisible] = useState(false)

	const { addFood } = useLogMeal()

	const handleSubmit = async () => {
		const newFood = validateNewFoodFromInputs(name, calories, protein, carbs, fat)
		console.log('New food to add:', newFood)
		if (newFood) {
			addFood(newFood)
			router.back()
		} else {
			Alert.alert('Invalid Input', 'Please enter a valid food name and a positive calorie count.')
		}
	}

	const handleFoodSelected = (newFood: NewMeal) => {
		setName(newFood.name)
		setCalories(newFood.calories.toFixed(0))
		setProtein(newFood.protein.toFixed(1))
		setCarbs(newFood.carbs.toFixed(1))
		setFat(newFood.fat.toFixed(1))
	}

	return (
		<KeyboardAvoidingView style={styles.container} behavior="padding">
			<PageHeader title="Add Food" />
			<ThemedView style={styles.searchButtonContainer}>
				<ThemedButton style={styles.button} onPress={() => setSearchModalVisible(true)}>
					<ThemedText style={styles.buttonText}>Search for Food</ThemedText>
				</ThemedButton>
			</ThemedView>
			<ThemedView style={styles.formContainer}>
				<ThemedInput
					placeholder="Food name"
					value={name}
					onChangeText={setName}
					style={styles.input}
					placeholderTextColor={Colors.placeholderText}
				/>
				<ThemedInput
					placeholder="Calories"
					value={calories}
					onChangeText={setCalories}
					keyboardType="numeric"
					style={styles.input}
					placeholderTextColor={Colors.placeholderText}
				/>
				<ThemedInput
					placeholder="Protein (g)"
					value={protein}
					onChangeText={setProtein}
					keyboardType="numeric"
					style={styles.input}
					placeholderTextColor={Colors.placeholderText}
				/>
				<ThemedInput
					placeholder="Carbs (g)"
					value={carbs}
					onChangeText={setCarbs}
					keyboardType="numeric"
					style={styles.input}
					placeholderTextColor={Colors.placeholderText}
				/>
				<ThemedInput
					placeholder="Fat (g)"
					value={fat}
					onChangeText={setFat}
					keyboardType="numeric"
					style={styles.input}
					placeholderTextColor={Colors.placeholderText}
				/>
				<ThemedButton onPress={handleSubmit} style={styles.button}>
					<ThemedText style={styles.buttonText}>Add food</ThemedText>
				</ThemedButton>
			</ThemedView>
			<FoodSearchModal
				visible={searchModalVisible}
				onClose={() => setSearchModalVisible(false)}
				onFoodSelected={handleFoodSelected}
			/>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
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
	},
	button: {
		alignItems: 'center',
		borderRadius: 8,
		backgroundColor: Colors.primary,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
})

export default AddFoodScreen
