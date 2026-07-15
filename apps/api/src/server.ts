import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { ZodError } from 'zod';
import 'dotenv/config';

import { authRoutes } from './routes/auth.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
import { paymentRoutes } from './routes/payment.routes.js';
import { tradingRoutes } from './routes/trading.routes.js';
import { strategyRoutes } from './routes/strategy.routes.js';
import { missionRoutes } from './routes/mission.routes.js';
import { portfolioRoutes } from './routes/portfolio.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { pool } from './db/index.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

async function bootstrap() {
  // Run DB migrations on startup
  try {
    const migrationDb = drizzle(pool);
    await migrate(migrationDb, { migrationsFolder: './drizzle' });
    console.log('Database migrations applied successfully');
  } catch (err) {
    console.error('Migration failed (may already be applied):', (err as Error).message);
  }

  // Global error handler
  app.setErrorHandler((error: any, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    app.log.error(error);
    const statusCode = error?.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: error?.message || 'Internal Server Error',
    });
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: '15m' },
  });

  await app.register(cookie, {
    secret: process.env.CSRF_SECRET || 'dev-csrf-secret',
    parseOptions: {},
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(websocket);

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(walletRoutes, { prefix: '/api/wallets' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(tradingRoutes, { prefix: '/api/trading' });
  await app.register(strategyRoutes, { prefix: '/api/strategies' });
  await app.register(missionRoutes, { prefix: '/api/missions' });
  await app.register(portfolioRoutes, { prefix: '/api/portfolio' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });

  const port = parseInt(process.env.API_PORT || '3001', 10);
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen({ port, host });
  app.log.info(`BaseAgent API running on ${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
