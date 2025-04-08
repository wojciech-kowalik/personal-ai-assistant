export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import TelegramService from "@/services/telegram.service";
import GroqService, { ChatMessage } from "@/services/groq.service";
import ChatHistoryService from "@/services/chat-history.service";
//import { webhookCallback } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const apiKey = process.env.GROQ_API_KEY;

if (!token)
	throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

if (!chatId)
	throw new Error("TELEGRAM_CHAT_ID environment variable not found.");

if (!apiKey) {
	throw new Error("GROQ_API_KEY is required but was not provided.");
}

const groqService = new GroqService(apiKey);
groqService.setDefaultModel("gemma2-9b-it");

const telegramService = new TelegramService(token);
telegramService.startPolling();

const chatHistoryService = new ChatHistoryService();

/**
 * Command to start the bot and reset chat history
 */
telegramService.onCommand("start", (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	chatHistoryService.resetHistory(userId);
	telegramService.sendMessage(userId, "*Hi!* _Welcome_ to AI Assistant! 🤖");
});

/**
 * Command to reset the chat history
 */
telegramService.onCommand("reset", (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	chatHistoryService.resetHistory(userId);
	telegramService.sendMessage(userId, "Memory reset! Let's start fresh.");
});

/**
 * Command to get the current chat history
 */
telegramService.onCommand("debug", (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	const history = chatHistoryService.getHistory(userId);
	const historyLength = history.length;

	telegramService.sendMessage(
		userId,
		`Debug info:\nHistory entries: ${historyLength / 2} exchanges\nTotal messages: ${historyLength}`,
	);

	// only send abbreviated history to avoid flooding the chat
	if (historyLength > 0) {
		const lastExchanges = history.slice(-4); // Show last 2 exchanges at most
		const historyPreview = lastExchanges
			.map(
				(msg, i) =>
					`${i % 2 === 0 ? "👤" : "🤖"}: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? "..." : ""}`,
			)
			.join("\n");

		telegramService.sendMessage(userId, `Recent messages:\n${historyPreview}`);
	}
});

/**
 * Test command to check context retention
 */
telegramService.onCommand("test", (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	telegramService.sendMessage(
		userId,
		"Let's run a quick test of context retention. Please ask a question about a specific topic, then follow up with 'Tell me more' to see if I remember what we were discussing.",
	);
});

telegramService.onMessage(async (ctx) => {
	try {
		const userId = ctx.message?.from?.id.toString() || chatId!;
		const userMessage = ctx?.message?.text || "";
		const userHistory = chatHistoryService.getHistory(userId);

		const messages: ChatMessage[] = [
			{
				role: "system",
				content:
					"You are a helpful AI assistant. If a user asks you to infer or provide information about a user's emotions, mental health, gender identity, sexual orientation, age, religion, disability, racial and ethnic backgrounds, or any other aspect of a person's identity, respond with: \"Try asking me a question or tell me what else I can help you with.\"",
			},
			...userHistory,
			{
				role: "user",
				content: userMessage,
			},
		];

		console.log(
			`Processing message with ${userHistory.length / 2} previous exchanges in context`,
		);

		const chatResponse = await groqService.createChatCompletion(messages, {
			temperature: 0.7,
			maxTokens: 100,
		});

		const chatResponseMessage = chatResponse.choices[0]?.message?.content || "";

		// add the message pair to history
		chatHistoryService.addMessage(userId, userMessage, "user");
		chatHistoryService.addMessage(userId, chatResponseMessage, "assistant");

		telegramService.sendMessage(userId, chatResponseMessage);

		console.log("Tokens used:", chatResponse.usage?.total_tokens);
		console.log("Response time:", chatResponse.usage?.total_time);
	} catch (error) {
		console.error("Internal error:", error);
	}
});

//export const POST = webhookCallback(telegramService.getInstance(), "std/http");
export async function POST(): Promise<Response> {
	return new Response("OK");
}
