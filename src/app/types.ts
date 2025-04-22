import Groq from "groq-sdk";

export type ToolType = "search_web" | "calculator";

export type ToolHandlerType = (
	toolName: ToolType,
	args: any,
) => Promise<string>;

export type ChatMessage = Groq.Chat.Completions.ChatCompletionMessageParam;
export type ChatCompletionMessages =
	Groq.Chat.Completions.ChatCompletionMessageParam;

export interface QueryResult {
	content: string;
	usedTools?: string[];
}

export interface ChatCompletionTool {
	type: string;
	function: {
		name: string;
		description: string;
		parameters: Record<string, any>;
	};
}

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
	tools?: Groq.Chat.Completions.ChatCompletionTool[];
	toolChoice?: Groq.Chat.Completions.ChatCompletionToolChoiceOption;
}
