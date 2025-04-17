export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import fs from "fs";
import TelegramService from "@/services/telegram.service";
import GroqService, {
	type ChatCompletionMessages,
} from "@/services/groq.service";
import ChatHistoryService from "@/services/chat-history.service";
//import { webhookCallback } from "grammy";

const systemContent = "You are a helpful AI assistant. ";
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

const telegramService = new TelegramService(token);
telegramService.startPolling();

const chatHistoryService = new ChatHistoryService();

/**
 * Command to start the bot and reset chat history
 */
telegramService.onCommand("start", async (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	chatHistoryService.resetHistory(userId);
	await telegramService.sendMessage(
		userId,
		"*Hi!* _Welcome_ to AI Assistant! 🤖",
		{
			parse_mode: "Markdown",
		},
	);
});

/**
 * Command to reset the chat history
 */
telegramService.onCommand("reset", async (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	chatHistoryService.resetHistory(userId);
	await telegramService.sendMessage(userId, "Memory reset! Let's start fresh.");
});

/**
 * Command to get the current chat history
 */
telegramService.onCommand("debug", async (ctx) => {
	const userId = ctx.message?.from?.id.toString() || chatId!;
	const history = chatHistoryService.getHistory(userId);
	const historyLength = history.length;

	await telegramService.sendMessage(
		userId,
		`Debug info:\nHistory entries: ${historyLength / 2} exchanges\nTotal messages: ${historyLength}`,
	);

	if (historyLength > 0) {
		const lastExchanges = history.slice(-4);
		const historyPreview = lastExchanges
			.map((msg, i) => {
				const content =
					typeof msg.content === "string"
						? msg.content
						: JSON.stringify(msg.content);

				return `${i % 2 === 0 ? "👤" : "🤖"}: ${
					content?.substring(0, 30) || "[No content]"
				}${content && content.length > 30 ? "..." : ""}`;
			})
			.join("\n");

		await telegramService.sendMessage(
			userId,
			`Recent messages:\n${historyPreview}`,
		);
	}
});

/**
 * Command to handle image data
 */
telegramService.onImageMessage(async (ctx) => {
	try {
		const photo = ctx.message?.photo;
		const userMessage = ctx?.msg?.caption || "";

		await telegramService.sendMessage(
			chatId,
			"🤖 I am executing image processing...",
		);

		if (!photo || photo.length === 0) {
			await telegramService.sendMessage(
				chatId,
				"No image found in the message.",
			);
			return;
		}

		const fileId = photo[photo.length - 1]?.file_id;

		if (!fileId) {
			await telegramService.sendMessage(chatId, "Could not process the image.");
			return;
		}

		const isValidImageType = await telegramService.isValidImageType(fileId, [
			"jpg",
			"jpeg",
			"png",
		]);

		if (!isValidImageType) {
			await telegramService.sendMessage(
				chatId,
				"Please send only JPG or PNG images.",
			);
			return;
		}

		const fileUrl = await telegramService.getFileUrl(fileId);

		if (!fileUrl) {
			await telegramService.sendMessage(
				chatId,
				"Could not retrieve the image URL.",
			);
			return;
		}

		const messages: ChatCompletionMessages[] = [
			{
				role: "user",
				content: [
					{
						type: "text",
						text: userMessage,
					},
					{
						type: "image_url",
						image_url: {
							url: fileUrl,
							detail: "auto",
						},
					},
				],
			},
		];

		groqService.setDefaultModel(
			"meta-llama/llama-4-maverick-17b-128e-instruct",
		);
		const chatResponseMessage = await groqService.sendMessage(messages);
		await telegramService.sendMessage(chatId, chatResponseMessage);
	} catch (error) {
		console.error("Error processing image:", error);
		telegramService.sendMessage(
			chatId,
			"Error processing the image. Please try again.",
		);
	}
});

telegramService.onVoiceMessage(async (ctx) => {
	try {
		const voice = ctx.message?.voice;

		await telegramService.sendMessage(
			chatId,
			"🤖 I am executing voice processing...",
		);

		if (!voice) {
			await telegramService.sendMessage(chatId, "No voice message found.");
			return;
		}

		const fileId = voice.file_id;

		if (!fileId) {
			await telegramService.sendMessage(
				chatId,
				"Could not process the voice message.",
			);
			return;
		}

		if (!telegramService.isVoiceFileSizeValid(voice.file_size)) {
			await telegramService.sendMessage(
				chatId,
				"Voice message is too large. Please send a voice message smaller than 1MB.",
			);
			return;
		}

		const fileUrl = await telegramService.getFileUrl(fileId);

		if (!fileUrl) {
			await telegramService.sendMessage(
				chatId,
				"Could not retrieve the voice URL.",
			);
			return;
		}

		groqService.setDefaultModel("whisper-large-v3-turbo");
		const transcription = await groqService.createAudioTranscription(fileUrl, {
			language: "en",
		});

		await telegramService.sendMessage(chatId, transcription.text);

		const messages: ChatCompletionMessages[] = [
			{
				role: "system",
				content: systemContent,
			},
			{
				role: "user",
				content: transcription.text,
			},
		];

		groqService.setDefaultModel("gemma2-9b-it");
		const chatResponseMessage = await groqService.sendMessage(messages);
		await telegramService.sendMessage(chatId, chatResponseMessage);
	} catch (error) {
		console.error("Error processing voice message:", error);
	}
});

telegramService.onTextMessage(async (ctx) => {
	try {
		const userId = ctx.message?.from?.id.toString() || chatId!;
		const userMessage = ctx?.message?.text || "";
		const userHistory = chatHistoryService.getHistory(userId);

		await telegramService.sendMessage(
			userId,
			"🤖 I am executing text answering ...",
		);

		const messages: ChatCompletionMessages[] = [
			{
				role: "system",
				content: systemContent,
			},
			...userHistory,
			{
				role: "user",
				content: userMessage,
			},
		];

		groqService.setDefaultModel("gemma2-9b-it");
		const chatResponseMessage = await groqService.sendMessage(messages);

		// add the message pair to history
		chatHistoryService.addMessage(userId, userMessage, "user");
		chatHistoryService.addMessage(userId, chatResponseMessage, "assistant");

		await telegramService.sendMessage(userId, chatResponseMessage);
	} catch (error) {
		console.error("Internal error:", error);
	}
});

//export const POST = webhookCallback(telegramService.getInstance(), "std/http");
export async function POST(): Promise<Response> {
	return new Response("OK");
}
