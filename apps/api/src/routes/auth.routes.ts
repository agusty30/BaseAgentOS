import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword, generateTokens, generateRefreshToken, verifyRefreshToken } from '../security/auth.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: 'Email already registered' });
    }
    const passwordHash = await hashPassword(body.password);
    const [user] = await db.insert(users).values({
      id: uuidv4(),
      email: body.email,
      passwordHash,
      name: body.name,
      role: 'admin',
    }).returning();

    const { accessToken, refreshToken } = await generateTokens(app, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken };
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = await generateTokens(app, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken };
  });

  app.post('/refresh', async (request, reply) => {
    const token = request.cookies.refresh_token;
    if (!token) {
      return reply.status(401).send({ error: 'No refresh token' });
    }
    try {
      const payload = verifyRefreshToken(token);
      const [user] = await db.select().from(users).where(eq(users.id, payload.id)).limit(1);
      if (!user) {
        return reply.status(401).send({ error: 'User not found' });
      }
      const { accessToken, refreshToken } = await generateTokens(app, {
        id: user.id,
        email: user.email,
        role: user.role,
      });
      reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out' };
  });
}
