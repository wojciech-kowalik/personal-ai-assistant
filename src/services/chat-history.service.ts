import { ChatMessage } from "@/services/groq.service";

class ChatHistoryService {
	private chatHistory: Map<string, ChatMessage[]>;
	private maxHistoryLength: number;

	constructor(maxHistoryLength = 10) {
		this.chatHistory = new Map<string, ChatMessage[]>();
		this.maxHistoryLength = maxHistoryLength;
	}

	getHistory(userId: string): ChatMessage[] {
		if (!this.chatHistory.has(userId)) {
			this.chatHistory.set(userId, []);
		}
		return this.chatHistory.get(userId) || [];
	}

	addMessage(userId: string, userMessage: string): void {
		// prevent adding command messages to history
		if (userMessage.startsWith("/")) {
			return;
		}

		const history = this.getHistory(userId);

		history.push({ role: "user", content: userMessage });

		// limit history to prevent token overflow
		if (history.length > this.maxHistoryLength) {
			this.chatHistory.set(userId, history.slice(-this.maxHistoryLength));
		} else {
			this.chatHistory.set(userId, history);
		}
	}

	resetHistory(userId: string): void {
		this.chatHistory.set(userId, []);
	}
}

export default ChatHistoryService;
