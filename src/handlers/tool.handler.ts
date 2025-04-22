import { ToolType, ToolHandlerType } from "@/app/types";
import { TavilyService } from "@/services/tavily.service";

class ToolHandler {
	private handlers: Map<ToolType, ToolHandlerType> = new Map();
	private tavilyService: TavilyService;

	constructor(tavilyService: TavilyService) {
		this.tavilyService = tavilyService;
		this.registerHandlers();
	}

	registerHandlers(): void {
		this.register("search_web", async (_, args) => {
			const results = await this.tavilyService.search(args.query);
			return JSON.stringify(results);
		});

		this.register("calculator", async (_, args) => {
			try {
				const result = new Function(`return ${args.expression}`)();
				return JSON.stringify({ result });
			} catch (error) {
				return JSON.stringify({ error: "Invalid expression" });
			}
		});
	}

	register(toolType: ToolType, handler: ToolHandlerType): void {
		this.handlers.set(toolType, handler);
	}

	getHandler(toolType: ToolType): ToolHandlerType | undefined {
		return this.handlers.get(toolType);
	}
}

export { ToolHandler };
