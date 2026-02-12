import { useState } from 'react'
import { sendChatMessage, Message } from '@services/gemini'

export const useFitnessChat = () => {
	const [messages, setMessages] = useState<Message[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const sendMessage = async (userMessage: string) => {
		setIsLoading(true)
		setError(null)

		const newUserMessage: Message = {
			role: 'user',
			parts: userMessage,
		}

		// Add user message to display
		setMessages((prev) => [...prev, newUserMessage])

		try {
			const aiResponse = await sendChatMessage(messages, userMessage)

			const assistantMessage: Message = {
				role: 'model',
				parts: aiResponse,
			}

			setMessages((prev) => [...prev, assistantMessage])
		} catch (err) {
			setError('Failed to get response. Please try again.')
			console.error(err)
			// Remove the user message if there was an error
			setMessages((prev) => prev.slice(0, -1))
		} finally {
			setIsLoading(false)
		}
	}

	const clearChat = () => {
		setMessages([])
		setError(null)
	}

	return {
		messages,
		sendMessage,
		isLoading,
		error,
		clearChat,
	}
}
