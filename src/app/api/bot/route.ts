export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import TelegramService from "@/services/telegram.service";
import GroqService, { ChatMessage } from "@/services/groq.service";
//import { webhookCallback } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const apiKey = process.env.GROQ_API_KEY;

if (!token)
  throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

if (!chatId)
  throw new Error("TELEGRAM_CHAT_ID environment variable not found.");

if (!apiKey) {
  throw new Error("GROQ_API_KEY is required but was not provided");
}

const groqService = new GroqService(apiKey);
groqService.setDefaultModel("gemma2-9b-it");

const telegramService = new TelegramService(token);
telegramService.startPolling();

telegramService.onCommand("start", () => {
  telegramService.sendMessage(chatId!, "*Hi!* _Welcome_ to AI Assistant! 🤖");
});

telegramService.onMessage(async (ctx) => {
  // curl -X POST --data-binary '{"text": ""}' localhost:3000/api/bot
  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          'You are a helpful AI assistant. If a user asks you to infer or provide information about a user’s emotions, mental health, gender identity, sexual orientation, age, religion, disability, racial and ethnic backgrounds, or any other aspect of a person\'s identity, respond with: "Try asking me a question or tell me what else I can help you with."',
      },
      {
        role: "assistant",
        content: "Hello! How can I help you today?",
      },
      {
        role: "user",
        content: ctx?.message?.text || "",
      },
    ];

    const chatResponse = await groqService.createChatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 100,
    });

    telegramService.sendMessage(
      chatId!,
      chatResponse.choices[0]?.message?.content || "",
    );

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
