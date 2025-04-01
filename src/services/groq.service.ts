import { Groq } from "groq-sdk";

/**
 * Represents a message in a chat conversation
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Options for customizing chat completion requests
 */
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
   * @param messages Array of messages in the conversation
   * @param options Configuration options for the completion
   * @returns The completion response from the API
   */
  public async createChatCompletion(
    messages: ChatMessage[],
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
   * Generate a simple text completion from a single prompt
   * @param prompt The text prompt to send to the model
   * @param options Configuration options for the completion
   * @returns The completion response from the API
   */
  public async simpleCompletion(
    prompt: string,
    options: Omit<ChatCompletionOptions, "stream"> = {},
  ) {
    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    return this.createChatCompletion(messages, options);
  }

  /**
   * Stream a chat completion for real-time responses
   * @param messages Array of messages in the conversation
   * @param options Configuration options for the completion
   * @returns A stream of completion chunks
   */
  public async streamChatCompletion(
    messages: ChatMessage[],
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
        stream: true,
      });
    } catch (error) {
      console.error("Error creating streaming chat completion:", error);
      throw error;
    }
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
