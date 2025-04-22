import { ChatCompletionMessages } from "@/app/types";

class ChatHistoryService {
	private chatHistory: Map<string, ChatCompletionMessages[]>;
	private maxHistoryLength: number;

	constructor(maxHistoryLength = 10) {
		this.chatHistory = new Map<string, ChatCompletionMessages[]>();
		this.maxHistoryLength = maxHistoryLength;
	}

	getHistory(userId: string): ChatCompletionMessages[] {
		if (!this.chatHistory.has(userId)) {
			this.chatHistory.set(userId, []);
		}
		return this.chatHistory.get(userId) || [];
	}

	addMessage(
		userId: string,
		content: string,
		role: "user" | "assistant" = "user",
	): void {
		if (role === "user" && content.startsWith("/")) {
			return;
		}

		const history = this.getHistory(userId);
		history.push({ role, content });

		// limit history to prevent token overflow
		// keep pairs of messages (user + assistant)
		const maxMessages = this.maxHistoryLength * 2;
		if (history.length > maxMessages) {
			this.chatHistory.set(userId, history.slice(-maxMessages));
		} else {
			this.chatHistory.set(userId, history);
		}
	}

	resetHistory(userId: string): void {
		this.chatHistory.set(userId, []);
	}
}

export { ChatHistoryService };
