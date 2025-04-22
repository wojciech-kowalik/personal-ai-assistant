import { Groq } from "groq-sdk";

import {
	ChatCompletionMessages,
	ChatCompletionOptions,
	TranscriptionCreateParams,
} from "@/app/types";
import { AUDIO_TRANSCRIPTION_MODEL, DEFAULT_MODEL } from "@/app/constants";

/**
 * Service for interacting with the Groq API for LLM completions
 */
class GroqService {
	private client: Groq;
	private defaultModel: string = DEFAULT_MODEL;

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
			tools,
			toolChoice,
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
				tools,
				tool_choice: toolChoice,
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
		const { model = AUDIO_TRANSCRIPTION_MODEL, language } = options;

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

	/**
	 * @param messages ChatCompletionMessages[]
	 * @returns string
	 */
	public async sendMessage(messages: ChatCompletionMessages[]) {
		const chatResponse = await this.createChatCompletion(messages, {
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

export { GroqService };
