import ThemedButton from '@components/ThemedButton'
import ThemedScrollView from '@components/ThemedScrollView'
import ThemedText from '@components/ThemedText'
import { Colors } from '@constants/Colors'
import { useProfile } from '@hooks/useProfile'
import { useUser } from '@hooks/useUser'
import { calculateAge, formatHeight, formatMemberSince } from '@utils/formatters'
import { calculateLevel } from '@utils/levels'
import { router } from 'expo-router'
import React from 'react'
import { View, Image, StyleSheet } from 'react-native'

export default function ProfileScreen() {
	const { profile } = useProfile()

	const { signOut } = useUser()

	const handleEdit = () => {
		router.push('/edit-profile')
	}

	return (
		<ThemedScrollView safe contentContainerStyle={styles.container}>
			{/* Profile Picture */}
			<Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />

			{/* User Name */}
			<ThemedText title style={styles.name}>
				{profile.first_name} {profile.last_name}
			</ThemedText>

			{/* Member Since and Level */}
			<ThemedText style={styles.memberSince}>
				Member since {formatMemberSince(profile?.created_at)}
			</ThemedText>
			<View style={styles.levelBadge}>
				<ThemedText
					style={styles.levelText}
				>{`Level ${calculateLevel(profile.experience_points)}`}</ThemedText>
			</View>

			{/* Info Section */}
			<View style={styles.infoSection}>
				<View style={styles.infoRow}>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Age</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{calculateAge(profile.date_of_birth)}
						</ThemedText>
					</View>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Gender</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{profile.gender}
						</ThemedText>
					</View>
				</View>

				<View style={styles.infoRow}>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Height</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{formatHeight(profile.height_inches)}
						</ThemedText>
					</View>
					<View style={styles.infoItem}>
						<ThemedText style={styles.infoLabel}>Weight</ThemedText>
						<ThemedText title style={styles.infoValue}>
							{profile.weight_lbs} lbs
						</ThemedText>
					</View>
				</View>
			</View>

			{/* Edit Button */}
			<ThemedButton style={styles.editButton} onPress={handleEdit}>
				<ThemedText title style={styles.buttonText}>
					Edit Profile
				</ThemedText>
			</ThemedButton>

			{/* Sign Out Button */}
			<ThemedButton style={styles.signOutButton} onPress={() => signOut()}>
				<ThemedText title style={styles.buttonText}>
					Sign Out
				</ThemedText>
			</ThemedButton>
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
	editButton: {
		width: '100%',
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	signOutButton: {
		width: '100%',
		backgroundColor: Colors.error,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 'auto',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
})
