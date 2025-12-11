import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'
import ThemedView from '@components/ThemedView'
import { useState } from 'react'
import ThemedText from '@components/ThemedText'
import { useUser } from '@hooks/useUser'
import ThemedCard from '@components/ThemedCard'
import { Colors } from '@constants/Colors'
import { Link } from 'expo-router'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)

	const { signIn } = useUser()

	const handleSubmit = async () => {
		setError(null)

		const { error } = await signIn(email, password)
		if (error) {
			setError(error.message)
		}
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.contentWrapper}>
				{/* Genie Logo */}
				<ThemedView style={styles.logoContainer}>
					<ThemedText style={styles.appName}>FitGenie</ThemedText>
					<ThemedText style={styles.appSubtitle}>Your AI-powered health companion</ThemedText>
				</ThemedView>

				{/* Auth Card */}
				<ThemedCard style={styles.authCard}>
					<ThemedText style={styles.cardTitle}>Get Started</ThemedText>
					<TextInput
						placeholder="Email address"
						placeholderTextColor={Colors.placeholderText}
						value={email}
						onChangeText={setEmail}
						style={styles.input}
						keyboardType="email-address"
						autoCapitalize="none"
					/>
					<TextInput
						placeholder="Password"
						placeholderTextColor={Colors.placeholderText}
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						style={styles.input}
					/>

					{/* Primary Button */}
					<TouchableOpacity onPress={handleSubmit} style={styles.primaryButton}>
						<ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
					</TouchableOpacity>

					{error && <Text style={styles.error}>{error}</Text>}

					{/* Divider */}
					<ThemedView style={styles.dividerContainer}>
						<ThemedView style={styles.dividerLine} />
						<ThemedText style={styles.dividerText}>or</ThemedText>
						<ThemedView style={styles.dividerLine} />
					</ThemedView>

					{/* Social Login Buttons */}
					<TouchableOpacity style={styles.socialButton}>
						<ThemedText style={styles.socialButtonText}>Continue with Google</ThemedText>
					</TouchableOpacity>
					<TouchableOpacity style={styles.socialButton}>
						<ThemedText style={styles.socialButtonText}>Continue with GitHub</ThemedText>
					</TouchableOpacity>

					{/* Link to Register */}
					<Link href="/register" replace>
						<ThemedText style={{ textAlign: 'center' }}>Register</ThemedText>
					</Link>
				</ThemedCard>

				{/* Footer */}
				<ThemedText style={styles.footerText}>
					By continuing, you agree to our Terms & Privacy Policy
				</ThemedText>
			</ThemedView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	contentWrapper: {
		width: '100%',
		maxWidth: 576,
		alignItems: 'center',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 32,
	},
	appName: {
		fontSize: 48,
		fontWeight: 'bold',
		color: Colors.logo,
	},
	appSubtitle: {
		marginTop: 8,
		fontSize: 14,
	},
	authCard: {
		backgroundColor: '#2a2a40',
		borderRadius: 16,
		padding: 32,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.25,
		shadowRadius: 16,
		elevation: 5,
		borderWidth: 1,
		borderColor: '#4a4a60',
		width: '100%',
	},
	cardTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 24,
	},
	input: {
		width: '100%',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#1a1a2e',
		borderWidth: 1,
		borderColor: '#4a4a60',
		borderRadius: 8,
		color: Colors.text,
		fontSize: 16,
		marginBottom: 16,
	},
	primaryButton: {
		width: '100%',
		paddingVertical: 12,
		paddingHorizontal: 16,
		backgroundColor: Colors.logo,
		color: Colors.text,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	primaryButtonText: {
		color: Colors.text,
		fontWeight: '600',
		fontSize: 16,
	},
	dividerContainer: {
		backgroundColor: '#2a2a40',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginVertical: 24,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#4a4a60', // bg-border
	},
	dividerText: {
		fontSize: 14,
		color: Colors.text,
	},
	socialButton: {
		width: '100%',
		paddingVertical: 12,
		paddingHorizontal: 16,
		backgroundColor: '#1a1a2e',
		borderWidth: 1,
		borderColor: '#4a4a60',
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	socialButtonText: {
		fontWeight: '500',
		fontSize: 16,
	},
	skipButton: {
		width: '100%',
		paddingVertical: 8,
		paddingHorizontal: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	skipButtonText: {
		fontSize: 14,
	},
	footerText: {
		textAlign: 'center',
		fontSize: 14,
		marginTop: 24,
	},
	error: {
		color: Colors.warning,
		padding: 10,
		backgroundColor: '#f5c1c8',
		borderColor: Colors.warning,
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 16,
	},
})
