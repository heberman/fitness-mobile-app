import PageHeader from '@components/PageHeader'
import { Colors } from '@constants/Colors'
import { useProfile } from '@hooks/useProfile'
import { router } from 'expo-router'
import { useState } from 'react'
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
} from 'react-native'
import { ProfileUpdate } from 'src/types/localstore'

export default function EditProfileScreen() {
	const { profile, updateProfile } = useProfile()

	const [firstName, setFirstName] = useState(profile.first_name || '')
	const [lastName, setLastName] = useState(profile.last_name || '')
	const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '')
	const [gender, setGender] = useState(profile.gender || '')
	const [heightFeet, setHeightFeet] = useState(
		(profile.height_inches ? Math.floor(profile.height_inches / 12) : 0).toString() || '',
	)
	const [heightInches, setHeightInches] = useState(
		(profile.height_inches ? profile.height_inches % 12 : 0).toString() || '',
	)
	const [weight, setWeight] = useState(
		(profile.weight_lbs ? profile.weight_lbs : 0).toString() || '',
	)

	const handleSave = async () => {
		const totalInches = (parseInt(heightFeet) || 0) * 12 + (parseInt(heightInches) || 0)

		const updatedProfile: ProfileUpdate = {
			first_name: firstName,
			last_name: lastName,
			date_of_birth: dateOfBirth,
			gender,
			height_inches: totalInches,
			weight_lbs: parseFloat(weight) || 0,
		}

		console.log('Saving profile:', updatedProfile)

		// Save to database
		await updateProfile(updatedProfile)

		// Navigate back
		router.back()
	}

	const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']

	return (
		<KeyboardAvoidingView style={styles.container} behavior="padding">
			<PageHeader title="Edit Profile" />

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* First Name */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>First Name</Text>
					<TextInput
						style={styles.input}
						value={firstName}
						onChangeText={setFirstName}
						placeholder="Enter first name"
						placeholderTextColor="#666"
					/>
				</View>

				{/* Last Name */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Last Name</Text>
					<TextInput
						style={styles.input}
						value={lastName}
						onChangeText={setLastName}
						placeholder="Enter last name"
						placeholderTextColor="#666"
					/>
				</View>

				{/* Date of Birth */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Date of Birth</Text>
					<TextInput
						style={styles.input}
						value={dateOfBirth}
						onChangeText={setDateOfBirth}
						placeholder="YYYY-MM-DD"
						placeholderTextColor="#666"
					/>
					<Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
				</View>

				{/* Gender */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Gender</Text>
					<View style={styles.genderContainer}>
						{genderOptions.map((option) => (
							<TouchableOpacity
								key={option}
								style={[styles.genderButton, gender === option && styles.genderButtonActive]}
								onPress={() => setGender(option)}
							>
								<Text
									style={[
										styles.genderButtonText,
										gender === option && styles.genderButtonTextActive,
									]}
								>
									{option}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Height */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Height</Text>
					<View style={styles.heightContainer}>
						<View style={styles.heightInput}>
							<TextInput
								style={styles.input}
								value={heightFeet}
								onChangeText={setHeightFeet}
								placeholder="5"
								placeholderTextColor="#666"
								keyboardType="numeric"
							/>
							<Text style={styles.unitText}>ft</Text>
						</View>
						<View style={styles.heightInput}>
							<TextInput
								style={styles.input}
								value={heightInches}
								onChangeText={setHeightInches}
								placeholder="10"
								placeholderTextColor="#666"
								keyboardType="numeric"
							/>
							<Text style={styles.unitText}>in</Text>
						</View>
					</View>
				</View>

				{/* Weight */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Weight</Text>
					<View style={styles.weightContainer}>
						<TextInput
							style={styles.input}
							value={weight}
							onChangeText={setWeight}
							placeholder="175"
							placeholderTextColor="#666"
							keyboardType="numeric"
						/>
						<Text style={styles.unitText}>lbs</Text>
					</View>
				</View>

				{/* Save Button */}
				<View style={styles.footer}>
					<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
						<Text style={styles.saveButtonText}>Save Changes</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 24,
	},
	inputGroup: {
		marginBottom: 24,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#b0b0b0',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#1a3a42',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: '#fff',
		borderWidth: 1,
		borderColor: '#2a4a52',
	},
	helperText: {
		fontSize: 12,
		color: '#666',
		marginTop: 6,
	},
	genderContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	genderButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
		backgroundColor: '#1a3a42',
		borderWidth: 1,
		borderColor: '#2a4a52',
	},
	genderButtonActive: {
		backgroundColor: '#007ea7',
		borderColor: '#007ea7',
	},
	genderButtonText: {
		fontSize: 14,
		color: '#b0b0b0',
	},
	genderButtonTextActive: {
		color: '#fff',
		fontWeight: '600',
	},
	heightContainer: {
		flexDirection: 'row',
		gap: 12,
	},
	heightInput: {
		flex: 1,
		position: 'relative',
	},
	weightContainer: {
		position: 'relative',
	},
	unitText: {
		position: 'absolute',
		right: 16,
		top: 14,
		fontSize: 16,
		color: '#666',
	},
	footer: {
		padding: 20,
		borderTopWidth: 1,
		borderTopColor: '#1a3a42',
	},
	saveButton: {
		backgroundColor: '#007ea7',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
})
