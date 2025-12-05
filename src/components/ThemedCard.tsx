import { StyleSheet, View } from 'react-native'
import { Colors } from '@constants/Colors'

const ThemedCard = ({ style, ...props }) => {
	return <View style={[{ backgroundColor: Colors.uiBackground }, styles.card, style]} {...props} />
}

export default ThemedCard

const styles = StyleSheet.create({
	card: {
		borderRadius: 6,
		padding: 16,
	},
})
