# Personal AI Assistant

This project is a personal AI assistant built with Next.js 15 that leverages several powerful APIs:

- **Groq API** for LLM chat capabilities
- **Telegram Bot (Grammy)** for messaging interface
- **Tavily API** for real-time information retrieval and search

## Features

- Conversational AI assistant using Groq's LLM
- Telegram integration via Grammy
- Internet connectivity for up-to-date information via Tavily
- Deployed as a Next.js application

## Development

```bash
# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm compile
```

## Telegram Webhook management

Set Webhook

```bash
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url={url_to_send_updates_to}
```

Get Webhook

```bash
GET https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

Delete Webhook

```bash
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?remove
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Dev

Test route

```
curl -X GET localhost:3000/api/test
```

## Technologies

- Next.js
- React
- TypeScript
- Grammy for Telegram bot functionality
- Groq SDK for LLM integration
- Tavily for search capabilities

  <a href="https://groq.com" target="_blank" rel="noopener noreferrer">
  <img
    width="120"
    src="https://groq.com/wp-content/uploads/2024/03/PBG-mark1-color.svg"
    alt="Powered by Groq for fast inference."
  />
</a>
