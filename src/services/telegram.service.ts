import { Bot, Context, GrammyError, HttpError } from "grammy";
import { ParseMode } from "@grammyjs/types";

/**
 * Service for interacting with the Telegram Bot API using grammY
 */
class TelegramService {
	private bot: Bot;

	/**
	 * Create a new Telegram bot service instance
	 * @param token The Telegram Bot API token
	 */
	constructor(token: string) {
		this.bot = new Bot(token);

		// Setup error handling for bot updates
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

	/**
	 * Get the underlying Bot instance
	 * @returns The grammY Bot instance
	 */
	public getInstance(): Bot {
		return this.bot;
	}

	/**
	 * Start the bot's long polling process to receive updates
	 */
	public startPolling(): void {
		this.bot.start();
	}

	/**
	 * Stop the bot's long polling process
	 */
	public stopPolling(): void {
		this.bot.stop();
	}

	/**
	 * Send a text message to a specific chat
	 * @param chatId The ID of the chat to send the message to
	 * @param text The text content of the message
	 * @param options Additional options for the message
	 * @returns Promise resolving to the sent message
	 */
	public async sendMessage(
		chatId: number | string,
		text: string,
		options: {
			parse_mode?: ParseMode;
			disable_notification?: boolean;
			protect_content?: boolean;
		} = {
			parse_mode: "Markdown",
		},
	): Promise<ReturnType<typeof this.bot.api.sendMessage>> {
		return this.bot.api.sendMessage(chatId, text, options);
	}

	/**
	 * Register a handler for text messages
	 * @param callback Function to call when a message is received
	 */
	public onTextMessage(callback: (ctx: Context) => void): void {
		this.bot.on("message:text", callback);
	}

	/**
	 * Register a handler for image data
	 * @param callback Function to call when a data are received
	 */
	public onImageData(callback: (ctx: Context) => void): void {
		this.bot.on("message:photo", callback);
	}

	/**
	 * Register a handler for a specific command
	 * @param command The command to listen for (without the slash)
	 * @param callback Function to call when the command is received
	 */
	public onCommand(command: string, callback: (ctx: Context) => void): void {
		this.bot.command(command, callback);
	}

	/**
	 * Get information about a file using its file ID
	 * @param fileId  The ID of the file to retrieve information for
	 * @returns File
	 */
	async getFileInfo(fileId: string) {
		try {
			const fileInfo = await this.bot.api.getFile(fileId);
			return fileInfo;
		} catch (error) {
			console.error("Error getting file info:", error);
			return null;
		}
	}
	/**
	 * Check if the file type is valid based on the allowed extensions
	 * @param fileId  The ID of the file to check
	 * @param allowedExtensions  Array of allowed file extensions (e.g., ['jpg', 'png'])
	 * @returns boolean
	 */
	async isValidImageType(
		fileId: string,
		allowedExtensions: string[],
	): Promise<boolean> {
		try {
			const fileInfo = await this.getFileInfo(fileId);

			if (!fileInfo || !fileInfo.file_path) {
				return false;
			}

			// Check if the file extension is in the allowed list
			const filePath = fileInfo.file_path.toLowerCase();
			const fileExtension = filePath.split(".").pop() || "";

			return allowedExtensions.includes(fileExtension);
		} catch (error) {
			console.error("Error validating image type:", error);
			return false;
		}
	}

	async getFileUrl(fileId: string): Promise<string | null> {
		try {
			const fileInfo = await this.getFileInfo(fileId);

			if (!fileInfo || !fileInfo.file_path) {
				return null;
			}

			// Construct the file URL using the Telegram Bot API
			const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${fileInfo.file_path}`;
			return fileUrl;
		} catch (error) {
			console.error("Error getting file URL:", error);
			return null;
		}
	}
}

export default TelegramService;
