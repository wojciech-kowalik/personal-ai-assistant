import { Groq } from "groq-sdk";

import { ToolType } from "@/app/types";

/**
 * Factory for creating LLM tools
 */
class ToolFactory {
	/**
	 * Creates a tool based on specified configuration
	 *
	 * @param type Tool type to create
	 * @param options Custom options for the tool
	 * @returns ChatCompletionTool object ready to be used with Groq
	 */
	static create(type: ToolType): Groq.Chat.Completions.ChatCompletionTool {
		switch (type) {
			case "search_web":
				return this.createSearchWebTool();
			case "calculator":
				return this.createCalculatorTool();

			default:
				throw new Error(`Unknown tool type: ${type}`);
		}
	}

	/**
	 * Creates a function tool definition
	 */
	private static createFunctionTool(
		name: ToolType,
		description: string,
		parameters: Record<string, any>,
		required: string[] = [],
	): Groq.Chat.Completions.ChatCompletionTool {
		return {
			type: "function",
			function: {
				name,
				description,
				parameters: {
					type: "object",
					properties: parameters,
					required,
				},
			},
		};
	}

	/**
	 * Creates a search tool
	 */
	private static createSearchWebTool(): Groq.Chat.Completions.ChatCompletionTool {
		return this.createFunctionTool(
			"search_web",
			"Search the web for current information",
			{
				query: {
					type: "string",
					description: "The search query to look up",
				},
			},
			["query"],
		);
	}

	/**
	 * Creates a calculator tool
	 */
	private static createCalculatorTool(): Groq.Chat.Completions.ChatCompletionTool {
		return this.createFunctionTool(
			"calculator",
			"Perform mathematical calculations",
			{
				expression: {
					type: "string",
					description: "The mathematical expression to evaluate",
				},
			},
			["expression"],
		);
	}
}

export { ToolFactory };
