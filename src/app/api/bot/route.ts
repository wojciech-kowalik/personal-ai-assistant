// export const dynamic = "force-dynamic";

// export const fetchCache = "force-no-store";

// import { Bot, webhookCallback } from "grammy";

// const token = process.env.TELEGRAM_BOT_TOKEN;

// if (!token)
//   throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

// const bot = new Bot(token);

// bot.on("message:text", async (ctx) => {
//   await ctx.reply(ctx.message.text);
// });

// export const POST = webhookCallback(bot, "std/http");

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import { webhookCallback } from "grammy";

import TelegramService from "@/services/telegram.service";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token)
  throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

const telegramService = new TelegramService(token);

await telegramService.onMessage((ctx) => {
  ctx.reply("Hello, world!");
  console.log("Received message:", ctx.message?.text);
});

export const POST = webhookCallback(telegramService.getBot(), "std/http");
