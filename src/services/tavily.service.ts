import {
	tavily,
	type TavilySearchOptions,
	type TavilySearchResponse,
	type TavilyClient,
} from "@tavily/core";

/**
 * A service for interacting with the Tavily AI Search API using the official SDK
 * @see https://tavily.com/
 */
class TavilyService {
	private client: TavilyClient;

	/**
	 * Creates a new TavilyService instance
	 * @param apiKey string
	 */
	constructor(apiKey: string) {
		if (!apiKey) {
			throw new Error("Tavily API key is required");
		}

		try {
			this.client = tavily({ apiKey });
		} catch (error) {
			throw new Error(
				`Failed to initialize Tavily client: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Performs a search
	 * @param query string
	 * @param options TavilySearchOptions
	 * @returns Promise<TavilySearchResponse>
	 */
	async search(
		query: string,
		options: TavilySearchOptions = {
			searchDepth: "basic",
			maxResults: 4,
			includeRawContent: false,
			includeImages: false,
			excludeDomains: [],
			includeDomains: [],
		},
	): Promise<TavilySearchResponse> {
		if (!query) {
			throw new Error("Search query is required");
		}

		try {
			return await this.client.search(query, {
				search_depth: options.searchDepth,
				max_results: options.maxResults,
				include_raw_content: options.includeRawContent,
				include_images: options.includeImages,
				exclude_domains: options.excludeDomains,
				include_domains: options.includeDomains,
				...options,
			});
		} catch (error) {
			console.error("Tavily search error:", error);
			throw new Error(
				`Tavily search failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

export { TavilyService };
