import { TouchableOpacity, StyleSheet } from 'react-native'
import ThemedView from './ThemedView'
import ThemedText from './ThemedText'
import { router } from 'expo-router'
import { Colors } from '@constants/Colors'

const PageHeader = ({ title, onBack }: { title: string; onBack?: () => void }) => {
	return (
		<ThemedView style={styles.header} safe>
			<TouchableOpacity style={styles.backButton} onPress={onBack || (() => router.back())}>
				<ThemedText title style={styles.backButtonText}>
					←
				</ThemedText>
			</TouchableOpacity>
			<ThemedText style={styles.headerTitle}>{title}</ThemedText>
			<ThemedView style={styles.headerSpacer} />
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.surfaceBackground,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	backButtonText: {
		fontSize: 28,
		color: Colors.primary,
		fontWeight: '300',
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	headerSpacer: {
		width: 40,
	},
})

export default PageHeader
