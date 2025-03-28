import TelegramService from "@/services/telegram.service";
import { type NextRequest } from "next/server";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token)
  throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

const telegramService = new TelegramService(token);

telegramService.onMessage(async (ctx) => {
  console.log("Received message:", ctx.message?.text);
  console.log("Chat ID:", ctx.chat?.id);
});

telegramService.startPolling();

telegramService.sendMessage("7504626147", "Bot started successfully!");

export async function POST(request: NextRequest): Promise<Response> {
  const payload = await request.json().catch(() => ({}));
  console.log("Received webhook:", payload);

  telegramService.sendMessage("7504626147", payload?.text);

  return new Response("OK");
}
