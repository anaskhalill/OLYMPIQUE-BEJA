# Olympique de Beja - Official Website

The official website for Olympique de Beja (OB), a Tunisian football club founded in 1929, nicknamed "El Lampik" (The Storks).

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Auth:** Firebase Authentication (Google, Facebook, Email)
- **Payments:** Stripe
- **AI Chat:** OpenRouter API
- **Data:** SofaScore API (fixtures/standings), Google News RSS

## Features

- Homepage with club history, trophies, squad, academy, news, and matches
- AI assistant chatbot for club information
- Live standings and fixtures from SofaScore
- News feed from Google News
- Stripe payment checkout for shop/tickets
- Daily trivia quiz game
- Multi-language support (English, French, Arabic)
- Dark/light theme toggle
- GDPR cookie consent
- Age verification for shop/tickets

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or bun

### Installation

```bash
npm install
# or
bun install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI chat |
| `NEXT_PUBLIC_SITE_URL` | Site URL (http://localhost:3000 for dev) |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/            # Next.js App Router pages and API routes
    api/          # API endpoints (chat, fixtures, news, payment, players, standings)
    matchday/     # Matchday "Coming Soon" page
    privacy/      # Privacy policy page
    terms/        # Terms of service page
    trivia/       # Daily trivia quiz
  components/     # React components
    ui/           # shadcn/ui and custom UI components
  lib/            # Utilities and Firebase config
  hooks/          # Custom React hooks
  types/          # TypeScript type definitions
public/           # Static assets (images, logos, icons, video)
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

All rights reserved. Olympique de Beja.
