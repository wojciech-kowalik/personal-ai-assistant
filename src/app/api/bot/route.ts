export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import {
	TelegramService,
	GroqService,
	TavilyService,
	ChatHistoryService,
	RouterModelQueryService,
} from "@/services";
import { promptDefault as systemPrompt } from "@/prompts/system.prompt";
import { ChatCompletionMessages } from "@/app/types";
import { DEFAULT_MODEL, IMAGE_MODEL } from "@/app/constants";

//import { webhookCallback } from "grammy";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const groqAPIKey = process.env.GROQ_API_KEY;
const tavilyAPIKey = process.env.TAVILY_API_KEY;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!telegramBotToken)
	throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

if (!groqAPIKey)
	throw new Error("GROQ_API_KEY is required but was not provided.");

if (!tavilyAPIKey)
	throw new Error("TAVILY_API_KEY is required but was not provided.");

if (!chatId)
	throw new Error("TELEGRAM_CHAT_ID environment variable not found.");

const groqService = new GroqService(groqAPIKey);
const telegramService = new TelegramService(telegramBotToken);
const tavilyService = new TavilyService(tavilyAPIKey);
const chatHistoryService = new ChatHistoryService();

telegramService.startPolling();

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

		groqService.setDefaultModel(IMAGE_MODEL);
		const chatResponseMessage = await groqService.sendMessage(messages);
		await telegramService.sendMessage(chatId, chatResponseMessage);
	} catch (error) {
		console.error("Error processing the image:", error);
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

		const transcription = await groqService.createAudioTranscription(fileUrl, {
			language: "en",
		});

		await telegramService.sendMessage(chatId, transcription.text);

		const messages: ChatCompletionMessages[] = [
			{
				role: "system",
				content: systemPrompt,
			},
			{
				role: "user",
				content: transcription.text,
			},
		];

		groqService.setDefaultModel(DEFAULT_MODEL);
		const chatResponseMessage = await groqService.sendMessage(messages);
		await telegramService.sendMessage(chatId, chatResponseMessage);
	} catch (error) {
		console.error("Error processing the voice message:", error);
		telegramService.sendMessage(
			chatId,
			"Error processing the voice. Please try again.",
		);
	}
});

telegramService.onTextMessage(async (ctx) => {
	try {
		const userId = ctx.message?.from?.id.toString() || chatId!;
		const userMessage = ctx?.message?.text || "";
		const userHistory = chatHistoryService.getHistory(userId);

		const routerModelQueryService = new RouterModelQueryService(
			groqService,
			tavilyService,
			userHistory,
		);

		await telegramService.sendMessage(
			userId,
			"🤖 I am executing text answering ...",
		);

		const chatResponseMessage =
			await routerModelQueryService.sendMessage(userMessage);

		// add the message pair to history
		chatHistoryService.addMessage(userId, userMessage, "user");
		chatHistoryService.addMessage(userId, chatResponseMessage, "assistant");

		await telegramService.sendMessage(userId, chatResponseMessage);
	} catch (error) {
		console.error("Error processing the text message:", error);
		telegramService.sendMessage(
			chatId,
			"Error processing the text message. Please try again.",
		);
	}
});

//export const POST = webhookCallback(telegramService.getInstance(), "std/http");
export async function POST(): Promise<Response> {
	return new Response("OK");
}
