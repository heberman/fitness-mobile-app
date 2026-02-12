import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!)

export type Message = {
	role: 'user' | 'model'
	parts: string
}

const SYSTEM_INSTRUCTION = `You are an expert AI fitness coach. You provide personalized workout advice, 
nutrition guidance, form corrections, and motivation. Keep responses concise, encouraging, 
and tailored to the user's fitness level. Always prioritize safety and recommend consulting 
professionals for medical concerns.`

export const sendChatMessage = async (
	messageHistory: Message[],
	userMessage: string,
): Promise<string> => {
	try {
		const model = genAI.getGenerativeModel({
			model: 'gemini-2.5-flash-lite',
			systemInstruction: SYSTEM_INSTRUCTION,
		})

		// Convert message history to Gemini format
		const history = messageHistory.map((msg) => ({
			role: msg.role,
			parts: [{ text: msg.parts }],
		}))

		const chat = model.startChat({
			history: history,
		})

		const result = await chat.sendMessage(userMessage)
		const response = await result.response
		return response.text()
	} catch (error) {
		console.error('Error calling Gemini:', error)
		throw error
	}
}
