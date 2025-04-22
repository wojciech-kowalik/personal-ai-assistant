const prompt = (query: string) => `
    Given the following user query, determine if any tools are needed to answer it.
    If a calculation tool is needed, respond with 'TOOL: CALCULATE'.
    If a web search tool is needed, respond with 'TOOL: SEARCH'.
    If no tools are needed, respond with 'NO TOOL'.

    User query: ${query}

    Response:
`;

export { prompt };
