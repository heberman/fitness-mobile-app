import { StyleSheet, TouchableOpacity } from 'react-native'
import { Colors } from '@constants/Colors'

const ThemedButton = ({ style, ...props }) => {
	return (
		<TouchableOpacity
			style={[{ backgroundColor: Colors.surfaceBackground }, styles.button, style]}
			{...props}
		/>
	)
}

export default ThemedButton

const styles = StyleSheet.create({
	button: {
		borderRadius: 6,
		padding: 16,
	},
})
