import { Groq } from "groq-sdk";

export type ChatCompletionMessages =
	Groq.Chat.Completions.ChatCompletionMessageParam;

export interface TranscriptionCreateParams {
	model?: string;
	language?: string;
	sampleRate?: number;
}

export interface ChatCompletionOptions {
	model?: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	stop?: string[];
	stream?: boolean;
}

/**
 * Service for interacting with the Groq API for LLM completions
 */
class GroqService {
	private client: Groq;
	private defaultModel: string = "llama-3.3-70b-versatile";

	/**
	 * Initialize the Groq service with an API key
	 * @param apiKey Optional API key (defaults to environment variable)
	 */
	constructor(apiKey: string) {
		this.client = new Groq({ apiKey });
	}

	/**
	 * Generate a non-streaming chat completion
	 * @param messages ChatCompletionMessages[]
	 * @param options ChatCompletionOptions
	 * @returns APIPromise<ChatCompletion>
	 */
	public async createChatCompletion(
		messages: ChatCompletionMessages[],
		options: Omit<ChatCompletionOptions, "stream"> = {},
	) {
		const {
			model = this.defaultModel,
			maxTokens,
			temperature,
			topP,
			stop,
		} = options;

		try {
			return await this.client.chat.completions.create({
				messages: messages,
				model: model,
				max_tokens: maxTokens,
				temperature: temperature,
				top_p: topP,
				stop: stop,
				stream: false,
			});
		} catch (error) {
			console.error("Error creating chat completion:", error);
			throw error;
		}
	}
	/**
	 * Generate a non-streaming audio transcription
	 * @param file  Uploadable
	 * @param options  TranscriptionCreateParams
	 * @returns APIPromise<Transcription>
	 */
	public async createAudioTranscription(
		url: string,
		options: TranscriptionCreateParams,
	) {
		const { model = this.defaultModel, language } = options;

		try {
			return await this.client.audio.transcriptions.create({
				url,
				model,
				language,
			});
		} catch (error) {
			console.error("Error creating audio transcription:", error);
			throw error;
		}
	}

	public async sendMessage(messages: ChatCompletionMessages[]) {
		const chatResponse = await this.createChatCompletion(messages, {
			temperature: 0.7,
			maxTokens: 300,
		});

		return chatResponse.choices[0]?.message?.content || "";
	}

	/**
	 * Set the default model to use for completions when not specified
	 * @param model The model identifier to use as default
	 */
	public setDefaultModel(model: string) {
		this.defaultModel = model;
	}

	/**
	 * Get the current default model being used
	 * @returns The model identifier
	 */
	public getDefaultModel(): string {
		return this.defaultModel;
	}

	/**
	 * Retrieve a list of all available models from Groq
	 * @returns Array of available models
	 */
	public async listModels() {
		try {
			const models = await this.client.models.list();
			return models;
		} catch (error) {
			console.error("Error listing models:", error);
			throw error;
		}
	}
}

export default GroqService;
