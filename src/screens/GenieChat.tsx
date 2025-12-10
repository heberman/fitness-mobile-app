import ThemedView from '@components/ThemedView'
import ThemedText from '@components/ThemedText'
import { StyleSheet, KeyboardAvoidingView, ScrollView, View } from 'react-native'
import { Colors } from '@constants/Colors'
import { useState, useEffect, useRef } from 'react'
import ThemedButton from '@components/ThemedButton'
import ThemedInput from '@components/ThemedInput'
import ThemedScrollView from '@components/ThemedScrollView'
import { useFitnessChat } from '@hooks/useFitnessChat'
import Markdown from 'react-native-markdown-display'

export default function GenieChat() {
	const { messages, sendMessage, isLoading, error } = useFitnessChat()
	const [inputValue, setInputValue] = useState('')

	const quickActions = ['Meal Tips', 'Workout Ideas']

	const scrollRef = useRef<ScrollView | null>(null)

	useEffect(() => {
		// Scroll to bottom whenever messages change
		scrollRef.current?.scrollToEnd({ animated: true })
	}, [messages])

	const handleInputFocus = () => {
		// Scroll to bottom whenever input is focused
		scrollRef.current?.scrollToEnd({ animated: true })
	}

	const handleSend = async () => {
		if (inputValue.trim() && !isLoading) {
			await sendMessage(inputValue.trim())
			setInputValue('')
			// setTimeout(() => scrollRef.current?.scrollToEnd(), 100);
		}
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: Colors.background }}
			behavior={'padding'}
		>
			<ThemedView style={styles.container} safe>
				{/* Header */}
				<ThemedText title style={styles.pageTitle}>
					Your Fit Genie
				</ThemedText>
				{/* Messages */}
				<ThemedScrollView
					ref={scrollRef}
					style={styles.messages}
					contentContainerStyle={{}}
					keyboardShouldPersistTaps="handled"
				>
					{messages.map((message, index) => (
						<View
							key={index}
							style={[
								styles.message,
								{
									alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
									backgroundColor: message.role === 'user' ? Colors.secondary : Colors.uiBackground,
								},
							]}
						>
							<Markdown
								style={{
									paragraph: { marginTop: 0, marginBottom: 0 },
									body: { color: Colors.text },
								}}
							>
								{message.parts}
							</Markdown>
						</View>
					))}
				</ThemedScrollView>

				{/* Quick Actions */}
				<ThemedView style={styles.rowContainer}>
					{quickActions.map((action, index) => (
						<ThemedButton key={index} style={{ flex: 1, alignItems: 'center' }} onPress={() => {}}>
							<ThemedText style={{}}>{action}</ThemedText>
						</ThemedButton>
					))}
				</ThemedView>

				{/* Input */}
				<ThemedView style={styles.rowContainer}>
					<ThemedInput
						style={{ flex: 1 }}
						placeholder="Ask me anything..."
						value={inputValue}
						onChangeText={setInputValue}
						onFocus={handleInputFocus}
						placeholderTextColor={Colors.placeholderText}
					/>
					<ThemedButton style={{}} onPress={handleSend}>
						<ThemedText style={{}}>Send</ThemedText>
					</ThemedButton>
				</ThemedView>
			</ThemedView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 8,
		gap: 24,
	},
	pageTitle: {
		fontSize: 48,
		fontWeight: 'bold',
		color: Colors.primary,
		width: '100%',
		paddingHorizontal: 16,
		borderBottomWidth: 2,
		borderBottomColor: Colors.primary,
	},
	messages: {
		flex: 1,
		paddingHorizontal: 16,
	},
	message: {
		maxWidth: '80%',
		backgroundColor: Colors.uiBackground,
		color: Colors.text,
		padding: 8,
		marginVertical: 8,
		borderRadius: 8,
	},
	rowContainer: {
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 16,
	},
})
