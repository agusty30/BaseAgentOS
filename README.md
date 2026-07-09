# BaseAgent OS

Autonomous Payment & DEX Trading Platform on Base Network.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local infrastructure
docker-compose up -d postgres redis

# Run database migrations
pnpm db:push

# Start development
pnpm dev
```

## Architecture

- **apps/web** — Next.js 14 frontend
- **apps/api** — Fastify API gateway (Node.js)
- **apps/agents** — AI Agent service (Python FastAPI)
- **packages/shared** — Shared types, constants, ABIs
- **packages/ui** — Design system components

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.
