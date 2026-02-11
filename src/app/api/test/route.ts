import {
	GroqService,
	RouterModelQueryService,
	TavilyService,
	TelegramService,
} from "@/services";

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
const routerModelQueryService = new RouterModelQueryService(
	groqService,
	tavilyService,
);

export async function GET(): Promise<Response> {
	telegramService.sendMessage(chatId!, "Hello from the test API route!");

	const mathResponse = await routerModelQueryService.sendMessage("2e23*3");
	console.log(mathResponse);
	telegramService.sendMessage(chatId!, "Math response: " + mathResponse);

	const weatherResponse = await routerModelQueryService.sendMessage(
		"What is the weather in Wielowies, Slaskie, Poland",
	);
	console.log("Weather search response:", weatherResponse);
	telegramService.sendMessage(chatId!, "Weather response: " + weatherResponse);

	return new Response("OK");
}
