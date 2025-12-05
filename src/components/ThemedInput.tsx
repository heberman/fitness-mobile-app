import { StyleSheet, TextInput } from 'react-native'
import { Colors } from '@constants/Colors'

const ThemedInput = ({ style, ...props }) => {
	return <TextInput style={[styles.input, style]} {...props} />
}

export default ThemedInput

const styles = StyleSheet.create({
	input: {
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: Colors.inputBackground,
		fontSize: 16,
		color: Colors.text,
	},
})
