import { Bot, Context, GrammyError, HttpError } from "grammy";
import { ParseMode } from "@grammyjs/types";

class TelegramService {
  private bot: Bot;

  constructor(token: string) {
    this.bot = new Bot(token);

    this.bot.catch((err) => {
      const ctx = err.ctx;
      console.error(`Error while handling update ${ctx.update.update_id}:`);
      const e = err.error;
      if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
      } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
      } else {
        console.error("Unknown error:", e);
      }
    });
  }

  public startPolling(): void {
    this.bot.start();
  }

  public stopPolling(): void {
    this.bot.stop();
  }

  public async sendMessage(
    chatId: number | string,
    text: string,
    options?: {
      parse_mode?: ParseMode;
      reply_markup?: any;
      disable_notification?: boolean;
      protect_content?: boolean;
    },
  ): Promise<any> {
    return this.bot.api.sendMessage(chatId, text, options);
  }

  public onMessage(callback: (ctx: Context) => void): void {
    this.bot.on("message", callback);
  }

  public onCommand(command: string, callback: (ctx: Context) => void): void {
    this.bot.command(command, callback);
  }

  public getBot(): Bot {
    return this.bot;
  }
}

export default TelegramService;
