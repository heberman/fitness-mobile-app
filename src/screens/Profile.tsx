import ThemedScrollView from '@components/ThemedScrollView'
import ThemedText from '@components/ThemedText'
import { Colors } from '@constants/Colors'
import { useUser } from '@hooks/useUser'
import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

export default function ProfileScreen() {
	// Sample user data - replace with actual user data from context/props
	const user = {
		name: 'John Doe',
		profileImage: 'https://via.placeholder.com/150',
		memberSince: 'January 2024',
		level: 10,
		age: 28,
		gender: 'Male',
		height: '5\'10"',
		weight: '175 lbs',
	}

	const { signOut } = useUser()

	return (
		<ThemedScrollView safe contentContainerStyle={styles.container}>
			{/* Profile Picture */}
			<Image source={{ uri: user.profileImage }} style={styles.profileImage} />

			{/* User Name */}
			<ThemedText title style={styles.name}>
				{user.name}
			</ThemedText>

			{/* Member Since and Level */}
			<ThemedText style={styles.memberSince}>Member since {user.memberSince}</ThemedText>
			<View style={styles.levelBadge}>
				<ThemedText style={styles.levelText}>{`Level ${user.level}`}</ThemedText>
			</View>

			{/* Info Section */}
			<View style={styles.infoSection}>
				<View style={styles.infoRow}>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Age</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{user.age}
						</ThemedText>
					</View>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Gender</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{user.gender}
						</ThemedText>
					</View>
				</View>

				<View style={styles.infoRow}>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Height</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{user.height}
						</ThemedText>
					</View>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Weight</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{user.weight}
						</ThemedText>
					</View>
				</View>
			</View>

			{/* Sign Out Button */}
			<TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
				<ThemedText title style={styles.signOutText}>
					Sign Out
				</ThemedText>
			</TouchableOpacity>
		</ThemedScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 24,
		paddingHorizontal: 20,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		marginBottom: 16,
		borderWidth: 3,
		borderColor: Colors.primary,
	},
	name: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	memberSince: {
		marginBottom: 12,
	},
	levelBadge: {
		backgroundColor: Colors.primary,
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderRadius: 20,
		marginBottom: 32,
	},
	levelText: {
		fontWeight: '600',
	},
	infoSection: {
		width: '100%',
		backgroundColor: Colors.surfaceBackground,
		borderRadius: 16,
		paddingTop: 20,
		paddingHorizontal: 20,
		marginBottom: 32,
		borderWidth: 1,
		borderColor: Colors.surfaceBorder,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	infoItem: {
		flex: 1,
		alignItems: 'center',
	},
	infoLabel: {
		marginBottom: 6,
	},
	infoValue: {
		fontSize: 20,
		fontWeight: '600',
	},
	signOutButton: {
		width: '100%',
		backgroundColor: Colors.error,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 'auto',
	},
	signOutText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
})
