# BaseAgent OS — Deployment Guide

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Python >= 3.11
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/heliosneo/BaseAgentOS.git
cd BaseAgentOS
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Fill in required environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| REDIS_URL | Yes | Redis connection string |
| JWT_SECRET | Yes | Secret for JWT token signing |
| JWT_REFRESH_SECRET | Yes | Secret for refresh token signing |
| ENCRYPTION_MASTER_KEY | Yes | 32-byte hex key for wallet encryption |
| BASE_MAINNET_RPC_URL | Yes | Base Mainnet RPC endpoint |
| BASE_SEPOLIA_RPC_URL | Yes | Base Sepolia RPC endpoint |
| DEFAULT_NETWORK | Yes | Default network (base-sepolia or base-mainnet) |
| OPENAI_API_KEY | For AI | OpenAI API key for agent LLM |
| ANTHROPIC_API_KEY | For AI | Anthropic API key for agent LLM |
| CDP_API_KEY_NAME | Optional | Coinbase Developer Platform API key |
| CDP_API_KEY_PRIVATE_KEY | Optional | CDP API private key |
| WALLETCONNECT_PROJECT_ID | Optional | WalletConnect project ID |
| CSRF_SECRET | Yes | CSRF token secret |

## Local Development

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis (if not using Docker)
# Ensure they're running on the ports specified in .env

# Push database schema
pnpm db:push

# Start all services in development mode
pnpm dev
```

This starts:
- Frontend at http://localhost:3000
- API at http://localhost:3001
- Agent service at http://localhost:8000

## Production Deployment

### Frontend (Netlify)

1. Connect the repository to Netlify
2. Set build settings:
   - Base directory: `apps/web`
   - Build command: `cd ../.. && pnpm install && pnpm build --filter=@baseagent/web`
   - Publish directory: `apps/web/.next`
3. Set environment variables in Netlify dashboard
4. Deploy

### Backend API (Docker)

```bash
# Build the API image
docker build -f apps/api/Dockerfile -t baseagent-api .

# Run with environment variables
docker run -d \
  --name baseagent-api \
  -p 3001:3001 \
  --env-file .env \
  baseagent-api
```

### Agent Service (Docker)

```bash
# Build the agent service image
docker build -f apps/agents/Dockerfile -t baseagent-agents .

# Run with environment variables
docker run -d \
  --name baseagent-agents \
  -p 8000:8000 \
  --env-file .env \
  baseagent-agents
```

## Database Migrations

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema directly (development)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## Security Checklist

- [ ] All secrets set via environment variables
- [ ] JWT_SECRET is a strong random string (min 32 chars)
- [ ] ENCRYPTION_MASTER_KEY is a secure 32-byte hex string
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured appropriately
- [ ] CORS origins restricted to frontend domain
- [ ] Database accessible only from API service
- [ ] Redis accessible only from API and Agent services
- [ ] No private keys exposed in frontend or logs
- [ ] Audit logging enabled

## Monitoring

- API health: `GET /health`
- Agent health: `GET /agents/status`
- Database: Use `pnpm db:studio` for inspection
- Redis: `redis-cli info`

## Generating Encryption Keys

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate encryption master key
openssl rand -hex 32

# Generate CSRF secret
openssl rand -hex 32
```
