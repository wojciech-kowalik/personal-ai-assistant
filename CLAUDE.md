# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal AI assistant built with Next.js 16, integrating multiple AI services:
- **Groq API** - LLM chat capabilities with multiple specialized models
- **Telegram Bot (Grammy)** - Primary messaging interface
- **Tavily API** - Real-time web search as a tool

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Type checking (no emit)
pnpm compile
```

## Environment Setup

Required environment variables (see `.env.local.tmp` for template):
- `TELEGRAM_BOT_TOKEN` - Telegram bot authentication token
- `TELEGRAM_CHAT_ID` - Default Telegram chat ID
- `GROQ_API_KEY` - Groq API key for LLM services
- `TAVILY_API_KEY` - Tavily API key for web search

## Architecture

### Service Layer (`src/services/`)

The application follows a service-oriented architecture:

- **GroqService** - Manages all Groq API interactions (chat completions, audio transcriptions)
- **TelegramService** - Handles Telegram bot operations via Grammy
- **TavilyService** - Provides web search functionality
- **ChatHistoryService** - In-memory chat history management (10 message pairs per user)
- **RouterModelQueryService** - Routes queries to appropriate handlers (with tools or general chat)

### Multi-Model Strategy (`src/app/constants.ts`)

The app uses different Groq models for different tasks:
- `DEFAULT_MODEL` (llama-3.1-8b-instant) - General chat
- `ROUTING_MODEL` (llama3-70b-8192) - Determines if tools are needed and performs initial tool calls
- `TOOL_USE_MODEL` (llama-3.3-70b-versatile) - Final response generation after tool execution
- `IMAGE_MODEL` (meta-llama/llama-4-maverick-17b-128e-instruct) - Image understanding
- `AUDIO_TRANSCRIPTION_MODEL` (whisper-large-v3-turbo) - Voice transcription

### Tool System

**Flow**: User query → Router determines tool need → Tool handler executes → Final response

**Components**:
- `ToolFactory` (`src/factories/tool.factory.ts`) - Creates tool definitions for Groq SDK
- `ToolHandler` (`src/handlers/tool.handler.ts`) - Executes tool logic (search_web, calculator)
- Currently supports: `search_web` (via Tavily), `calculator` (via eval)

**Adding New Tools**:
1. Add tool type to `ToolType` union in `src/app/types.ts`
2. Create tool definition in `ToolFactory.create()`
3. Register handler in `ToolHandler.registerHandlers()`
4. Update routing prompt if needed (`src/prompts/routing.prompt.ts`)

### Request Flow

1. **Telegram Webhook** → `src/app/api/bot/route.ts` (POST handler)
2. **Message Type Detection** (text/image/voice)
3. **Text Messages**:
   - Query sent to `RouterModelQueryService`
   - Router LLM determines tool necessity via `determineToolNeeded()`
   - If tool needed → `runWithTools()` (uses ROUTING_MODEL then TOOL_USE_MODEL)
   - If no tool → `runGeneral()` (uses DEFAULT_MODEL)
   - Response sent back to Telegram
4. **Image Messages**: Processed with IMAGE_MODEL
5. **Voice Messages**: Transcribed with AUDIO_TRANSCRIPTION_MODEL, then processed as text

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` → `./src/*`

## Telegram Bot Commands

Implemented in `src/app/api/bot/route.ts`:
- `/start` - Initialize bot and reset chat history
- `/reset` - Clear chat history for current user
- `/debug` - View history stats and recent messages

## Webhook Management

Manual webhook operations via Telegram API:

```bash
# Set webhook
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url={url_to_send_updates_to}

# Get webhook info
GET https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo

# Delete webhook
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?remove
```

## Testing

Test the API locally:
```bash
curl -X GET localhost:3000/api/test
```

## Deployment

Deployed on Vercel with Next.js 16 App Router. The bot webhook must be configured to point to the deployed URL's `/api/bot` endpoint.

## Key Implementation Notes

- **Chat History**: Stored in-memory (not persistent), limited to 10 message pairs per user
- **Messages starting with `/`** are not added to chat history (treated as commands)
- **Tool routing**: Uses an LLM-based router rather than keyword matching for flexibility
- **Volta**: Node version 18.18.0 specified in package.json
- **API Routes**: Use `force-dynamic` and `force-no-store` to prevent caching
