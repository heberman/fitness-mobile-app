import PageHeader from '@components/PageHeader'
import ThemedButton from '@components/ThemedButton'
import ThemedInput from '@components/ThemedInput'
import ThemedText from '@components/ThemedText'
import ThemedView from '@components/ThemedView'
import { Colors } from '@constants/Colors'
import { useFoodSearch } from '@hooks/useFoodSearch'
import React, { useState } from 'react'
import {
	Modal,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
	KeyboardAvoidingView,
	TouchableWithoutFeedback,
	Keyboard,
} from 'react-native'
import { FoodDetails, NewMeal } from 'src/types/localstore'

type FoodSearchModalProps = {
	visible: boolean
	onClose: () => void
	onFoodSelected: (newFood: NewMeal) => void
}

const getFoodDisplayName = (food: Pick<FoodDetails, 'brand_name' | 'food_name'>) =>
	`${food.brand_name ? food.brand_name + ' ' : ''}${food.food_name}`

export default function FoodSearchModal({
	visible,
	onClose,
	onFoodSelected,
}: FoodSearchModalProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [hasSearched, setHasSearched] = useState(false)
	const [foodDetails, setFoodDetails] = useState<FoodDetails | null>(null)
	const [selectedServing, setSelectedServing] = useState(null)
	const [servingAmount, setServingAmount] = useState('1')

	const { foods, isLoading, error, search, getFoodDetails, clearFoods } = useFoodSearch()

	const onSearch = () => {
		setHasSearched(true)
		search(searchTerm)
	}

	const selectFood = async (foodId: string) => {
		const food = await getFoodDetails(foodId)

		if (food) {
			setFoodDetails(food)
			// Auto-select first serving
			const servings = Array.isArray(food.servings.serving)
				? food.servings.serving
				: [food.servings.serving]
			setSelectedServing(servings[0])
		}
	}

	const handleConfirm = () => {
		if (!selectedServing) return

		const amount = parseFloat(servingAmount) || 1

		const newMeal: NewMeal = {
			name: getFoodDisplayName(foodDetails),
			calories: parseFloat(selectedServing.calories) * amount,
			protein: parseFloat(selectedServing.protein) * amount,
			carbs: parseFloat(selectedServing.carbohydrate) * amount,
			fat: parseFloat(selectedServing.fat) * amount,
		}

		onFoodSelected(newMeal)
		handleClose()
	}

	const handleClose = () => {
		setSearchTerm('')
		setHasSearched(false)
		setFoodDetails(null)
		clearFoods()
		setSelectedServing(null)
		setServingAmount('1')
		onClose()
	}

	const getListEmptyText = () => {
		if (error) return error
		return hasSearched ? 'No results found' : 'Search for a food to get started'
	}

	const servings = foodDetails
		? Array.isArray(foodDetails.servings.serving)
			? foodDetails.servings.serving
			: [foodDetails.servings.serving]
		: []

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
				<KeyboardAvoidingView style={styles.container} behavior="padding">
					<PageHeader title="Search Food" onBack={handleClose} />

					{/* Step 1: Search */}
					{!foodDetails && (
						<>
							<ThemedView style={styles.searchBar}>
								<ThemedInput
									style={styles.searchInput}
									placeholder="Search for a food..."
									value={searchTerm}
									onChangeText={setSearchTerm}
									onSubmitEditing={onSearch}
								/>
								<ThemedButton style={{}} onPress={onSearch}>
									<ThemedText style={{}}>Search</ThemedText>
								</ThemedButton>
							</ThemedView>

							{isLoading ? (
								<ActivityIndicator size="large" style={styles.loader} />
							) : (
								<FlatList
									data={foods}
									keyExtractor={(item) => item.food_id}
									renderItem={({ item }) => (
										<TouchableOpacity
											style={styles.foodItem}
											onPress={() => selectFood(item.food_id)}
										>
											<ThemedText style={styles.foodName}>{getFoodDisplayName(item)}</ThemedText>
										</TouchableOpacity>
									)}
									ListEmptyComponent={
										<ThemedText style={styles.emptyText}>{getListEmptyText()}</ThemedText>
									}
								/>
							)}
						</>
					)}

					{/* Step 2: Select serving & amount */}
					{foodDetails && (
						<>
							<ThemedView style={styles.detailsContainer}>
								<TouchableOpacity
									style={styles.backButton}
									onPress={() => {
										setFoodDetails(null)
										setSelectedServing(null)
									}}
								>
									<ThemedText style={styles.backButtonText}>← Back to search</ThemedText>
								</TouchableOpacity>

								<ThemedText style={styles.selectedFoodName}>
									{getFoodDisplayName(foodDetails)}
								</ThemedText>

								<ThemedText style={styles.label}>Select Serving Size:</ThemedText>
								<FlatList
									data={servings}
									keyExtractor={(item) => item.serving_id}
									renderItem={({ item }) => (
										<TouchableOpacity
											style={[
												styles.servingItem,
												selectedServing === item && styles.servingItemSelected,
											]}
											onPress={() => setSelectedServing(item)}
										>
											<ThemedText style={styles.servingDescription}>
												{item.serving_description}
											</ThemedText>
											<ThemedText style={styles.servingMacros}>
												{`${item.calories} cal | P: ${item.protein}g | C: ${item.carbohydrate}g | F: ${item.fat}g`}
											</ThemedText>
										</TouchableOpacity>
									)}
								/>
							</ThemedView>
							<ThemedView style={styles.totalsContainer}>
								<ThemedText style={styles.label}>Number of Servings:</ThemedText>

								<ThemedInput
									style={styles.servingInput}
									keyboardType="decimal-pad"
									value={servingAmount}
									onChangeText={setServingAmount}
									placeholder="1"
								/>

								{selectedServing && (
									<ThemedView style={styles.totalMacros}>
										<ThemedText style={styles.totalLabel}>Calculated Macros:</ThemedText>
										<ThemedText style={styles.totalText}>
											Calories:{' '}
											{(
												parseFloat(selectedServing.calories) * (parseFloat(servingAmount) || 1)
											).toFixed(0)}
										</ThemedText>
										<ThemedText style={styles.totalText}>
											Protein:{' '}
											{(
												parseFloat(selectedServing.protein) * (parseFloat(servingAmount) || 1)
											).toFixed(1)}
											g
										</ThemedText>
										<ThemedText style={styles.totalText}>
											Carbs:{' '}
											{(
												parseFloat(selectedServing.carbohydrate) * (parseFloat(servingAmount) || 1)
											).toFixed(1)}
											g
										</ThemedText>
										<ThemedText style={styles.totalText}>
											Fat:{' '}
											{(parseFloat(selectedServing.fat) * (parseFloat(servingAmount) || 1)).toFixed(
												1,
											)}
											g
										</ThemedText>
									</ThemedView>
								)}

								<ThemedButton
									style={styles.confirmButton}
									onPress={handleConfirm}
									disabled={!selectedServing}
								>
									<ThemedText title style={styles.confirmButtonText}>
										Use These Values
									</ThemedText>
								</ThemedButton>
							</ThemedView>
						</>
					)}
				</KeyboardAvoidingView>
			</TouchableWithoutFeedback>
		</Modal>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	searchBar: {
		flexDirection: 'row',
		padding: 16,
		gap: 8,
	},
	searchInput: {
		flex: 1,
	},
	loader: {
		marginTop: 32,
	},
	foodItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.surfaceBackground,
	},
	foodName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	emptyText: {
		textAlign: 'center',
		marginTop: 20,
	},
	detailsContainer: {
		flex: 1,
		marginTop: 16,
		paddingHorizontal: 16,
	},
	backButton: {
		marginBottom: 16,
	},
	backButtonText: {
		color: Colors.primary,
		fontSize: 16,
	},
	selectedFoodName: {
		fontSize: 22,
		fontWeight: 'bold',
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		paddingTop: 16,
		marginBottom: 8,
	},
	servingItem: {
		padding: 12,
		borderWidth: 1,
		borderColor: Colors.text,
		borderRadius: 8,
		marginBottom: 8,
	},
	servingItemSelected: {
		backgroundColor: Colors.surfaceBackground,
	},
	servingDescription: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	servingMacros: {
		fontSize: 14,
		color: Colors.placeholderText,
	},
	servingInput: {
		padding: 12,
	},
	totalsContainer: {
		paddingHorizontal: 16,
		borderTopWidth: 2,
		borderTopColor: Colors.surfaceBackground,
	},
	totalMacros: {
		marginTop: 20,
		padding: 16,
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
	confirmButton: {
		backgroundColor: Colors.primary,
		marginTop: 20,
		marginBottom: 32,
		alignItems: 'center',
	},
	confirmButtonText: {
		fontSize: 18,
		fontWeight: '600',
	},
})
