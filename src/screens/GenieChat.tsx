import ThemedView from '@components/ThemedView'
import ThemedText from '@components/ThemedText'
import { StyleSheet, KeyboardAvoidingView, ScrollView } from 'react-native'
import { Colors } from '@constants/Colors'
import { useState, useEffect, useRef } from 'react'
import ThemedButton from '@components/ThemedButton'
import ThemedInput from '@components/ThemedInput'
import ThemedScrollView from '@components/ThemedScrollView'

type Message = {
	id: number
	text: string
	isUser: boolean
}

export default function GenieChat() {
	const [messages, setMessages] = useState<Message[]>([
		{ id: 1, text: "Hi! I'm your FitGenie. How can I help you today?", isUser: false },
		{ id: 2, text: 'I want to build better eating habits', isUser: true },
		{
			id: 3,
			text: "Great goal! Let's start by tracking your meals daily. I can help you build consistency and earn XP along the way!",
			isUser: false,
		},
	])
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

	const handleSend = () => {
		const messageText = inputValue.trim()
		if (!messageText) return
		const newMessage = {
			id: messages.length + 1,
			text: inputValue,
			isUser: true,
		}
		setMessages([...messages, newMessage])
		setInputValue('')

		// Mock response
		setTimeout(() => {
			setMessages((prev) => [
				...prev,
				{
					id: prev.length + 1,
					text: "That's a great question! I'm here to support you on your health journey. Keep logging your habits to earn more XP!",
					isUser: false,
				},
			])
		}, 1000)
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
					{messages.map((message) => (
						<ThemedText
							key={message.id}
							style={[
								styles.message,
								{
									alignSelf: message.isUser ? 'flex-end' : 'flex-start',
									backgroundColor: message.isUser ? Colors.primary : Colors.uiBackground,
								},
							]}
						>
							{message.text}
						</ThemedText>
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
