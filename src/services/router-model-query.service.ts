import { TavilyService, GroqService, ChatHistoryService } from "@/services";
import { ToolHandler } from "@/handlers/tool.handler";
import { ToolFactory } from "@/factories/tool.factory";
import { systemPrompt, systemPromptWithTools, routingPrompt } from "@/prompts";
import {
	ToolType,
	QueryResult,
	ChatCompletionOptions,
	ChatMessage,
	ChatCompletionMessages,
} from "@/app/types";
import { DEFAULT_MODEL, ROUTING_MODEL, TOOL_USE_MODEL } from "@/app/constants";

class RouterModelQueryService {
	private tavilyClient: TavilyService;
	private groqClient: GroqService;
	private toolHandler: ToolHandler;
	private history: ChatCompletionMessages[];

	private tools: ChatCompletionOptions["tools"] = [];

	constructor(
		groqClient: GroqService,
		tavilyClient: TavilyService,
		history: ChatCompletionMessages[],
	) {
		this.groqClient = groqClient;
		this.tavilyClient = tavilyClient;
		this.history = history;

		this.tools = [
			ToolFactory.create("search_web"),
			ToolFactory.create("calculator"),
		];

		this.toolHandler = new ToolHandler(this.tavilyClient);
		this.toolHandler.registerHandlers();
	}

	/**
	 * Determine the tool needed for the query
	 * @param query string
	 * @returns  Promise<ToolType | null>
	 */
	private async determineToolNeeded(query: string): Promise<ToolType | null> {
		try {
			this.groqClient.setDefaultModel(ROUTING_MODEL);
			const response = await this.groqClient.sendMessage([
				{
					role: "user",
					content: routingPrompt(query),
				},
			]);

			if (response.includes("TOOL: CALCULATE")) {
				return "calculator";
			} else if (response.includes("TOOL: SEARCH")) {
				return "search_web";
			} else {
				return null;
			}
		} catch (error) {
			console.error("Error determining tool:", error);
			return null;
		}
	}

	/**
	 * Process the query and determine if a tool is needed
	 * @param query string
	 * @returns Promise<QueryResult>
	 */
	private async processQuery(query: string): Promise<QueryResult> {
		try {
			const toolNeeded = await this.determineToolNeeded(query);

			if (toolNeeded) {
				const usedTools: string[] = [];
				const response = await this.runWithTools(query, usedTools);

				return {
					content: response,
					usedTools: usedTools.length > 0 ? usedTools : undefined,
				};
			} else {
				const response = await this.runGeneral(query);
				return {
					content: response,
				};
			}
		} catch (error) {
			console.error("Error processing query:", error);
			return {
				content: `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Run the query with the specified tools
	 * @param query string
	 * @param usedTools string[]
	 * @returns Promise<string>
	 */
	private async runWithTools(
		query: string,
		usedTools: string[] = [],
	): Promise<string> {
		try {
			const messages: ChatMessage[] = [
				{
					role: "system",
					content: systemPromptWithTools,
				},
				...this.history,
				{
					role: "user",
					content: query,
				},
			];

			this.groqClient.setDefaultModel(TOOL_USE_MODEL);
			const chatCompletion = await this.groqClient.createChatCompletion(
				messages,
				{
					tools: this.tools,
					toolChoice: "auto",
				},
			);

			const responseMessage = chatCompletion.choices[0].message;

			if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
				for (const toolCall of responseMessage.tool_calls) {
					const toolName = toolCall.function.name as ToolType;
					usedTools.push(toolName);

					const handler = this.toolHandler.getHandler(toolName);

					if (!handler) {
						throw new Error(`No handler registered for tool: ${toolName}`);
					}

					try {
						const args = JSON.parse(toolCall.function.arguments);
						const toolResult = await handler(toolName, args);

						messages.push({
							role: "assistant",
							content: null,
							tool_calls: [toolCall],
						});

						messages.push({
							role: "tool",
							tool_call_id: toolCall.id,
							content: toolResult,
						});
					} catch (error) {
						console.error(`Error calling tool ${toolName}:`, error);
						messages.push({
							role: "tool",
							tool_call_id: toolCall.id,
							content: JSON.stringify({
								error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
							}),
						});
					}
				}

				this.groqClient.setDefaultModel(TOOL_USE_MODEL);
				const finalResponse = await this.groqClient.sendMessage(messages);

				return finalResponse || "No response generated";
			}

			return responseMessage.content || "No response generated";
		} catch (error) {
			console.error("Error executing query with tools:", error);
			throw new Error(
				`Failed to execute query with tools: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Run the query without tools
	 * @param query string
	 * @returns Promise<string>
	 */
	private async runGeneral(query: string): Promise<string> {
		try {
			this.groqClient.setDefaultModel(DEFAULT_MODEL);

			const response = await this.groqClient.sendMessage([
				{
					role: "system",
					content: systemPrompt,
				},
				...this.history,
				{
					role: "user",
					content: query,
				},
			]);

			return response || "No response generated";
		} catch (error) {
			console.error("Error executing general query:", error);
			throw new Error(
				`Failed to execute general query: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
	/**
	 * Send a message to the router model
	 * @param query string
	 * @returns Promise<string>
	 */
	async sendMessage(query: string): Promise<string> {
		try {
			const result = await this.processQuery(query);
			return result.content;
		} catch (error) {
			console.error("Error routing query:", error);
			throw new Error(
				`Failed to route query: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

export { RouterModelQueryService };
