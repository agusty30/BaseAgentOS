import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { settings, users } from '../db/schema.js';
import { encrypt, decrypt } from '../security/encryption.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ─── Validation Schemas ────────────────────────────────────────────

const addProviderSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  defaultModel: z.string().min(1).max(200),
  isDefault: z.boolean().optional().default(false),
});

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  defaultModel: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  isDefault: z.boolean().optional(),
});

// ─── Provider Types ────────────────────────────────────────────────

interface AIProvider {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  encryptedApiKey: string;
  defaultModel: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

async function getProviders(userId: string): Promise<AIProvider[]> {
  const [row] = await db
    .select()
    .from(settings)
    .where(and(eq(settings.userId, userId), eq(settings.key, 'ai_providers')));
  return (row?.value as AIProvider[]) || [];
}

async function saveProviders(userId: string, providers: AIProvider[]): Promise<void> {
  const existing = await db
    .select()
    .from(settings)
    .where(and(eq(settings.userId, userId), eq(settings.key, 'ai_providers')));

  if (existing.length > 0) {
    await db
      .update(settings)
      .set({
        value: providers as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(and(eq(settings.userId, userId), eq(settings.key, 'ai_providers')));
  } else {
    await db.insert(settings).values({
      id: uuidv4(),
      userId,
      key: 'ai_providers',
      value: providers as unknown as Record<string, unknown>,
    });
  }
}

function maskApiKey(encryptedKey: string): string {
  try {
    const decrypted = decrypt(encryptedKey);
    if (decrypted.length <= 4) return '****';
    return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
  } catch {
    return '****';
  }
}

// ─── Routes ────────────────────────────────────────────────────────

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // PATCH /profile — Update user profile
  app.patch('/profile', async (request, reply) => {
    const body = z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
    }).parse(request.body);

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, request.user.id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } };
  });

  // GET /ai-providers — List all configured AI providers
  app.get('/ai-providers', async (request) => {
    const providers = await getProviders(request.user.id);

    const masked = providers.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      baseUrl: p.baseUrl,
      apiKey: maskApiKey(p.encryptedApiKey),
      defaultModel: p.defaultModel,
      isDefault: p.isDefault,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return { providers: masked };
  });

  // POST /ai-providers — Add a new AI provider
  app.post('/ai-providers', async (request, reply) => {
    const body = addProviderSchema.parse(request.body);
    const providers = await getProviders(request.user.id);

    if (providers.some((p) => p.slug === body.slug)) {
      return reply.status(409).send({ error: `Provider with slug '${body.slug}' already exists` });
    }

    const now = new Date().toISOString();
    const encryptedApiKey = encrypt(body.apiKey);

    if (body.isDefault) {
      for (const p of providers) {
        p.isDefault = false;
      }
    }

    const provider: AIProvider = {
      id: uuidv4(),
      name: body.name,
      slug: body.slug,
      baseUrl: body.baseUrl,
      encryptedApiKey,
      defaultModel: body.defaultModel,
      isDefault: body.isDefault || providers.length === 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    providers.push(provider);
    await saveProviders(request.user.id, providers);

    return {
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        baseUrl: provider.baseUrl,
        apiKey: maskApiKey(provider.encryptedApiKey),
        defaultModel: provider.defaultModel,
        isDefault: provider.isDefault,
        status: provider.status,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      },
    };
  });

  // PATCH /ai-providers/:slug — Update an existing AI provider
  app.patch('/ai-providers/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const body = updateProviderSchema.parse(request.body);
    const providers = await getProviders(request.user.id);

    const index = providers.findIndex((p) => p.slug === slug);
    if (index === -1) {
      return reply.status(404).send({ error: `Provider '${slug}' not found` });
    }

    const provider = providers[index];
    const now = new Date().toISOString();

    if (body.name !== undefined) provider.name = body.name;
    if (body.baseUrl !== undefined) provider.baseUrl = body.baseUrl;
    if (body.defaultModel !== undefined) provider.defaultModel = body.defaultModel;
    if (body.status !== undefined) provider.status = body.status;
    if (body.apiKey !== undefined) provider.encryptedApiKey = encrypt(body.apiKey);

    if (body.isDefault) {
      for (const p of providers) {
        p.isDefault = false;
      }
      provider.isDefault = true;
    }

    provider.updatedAt = now;
    providers[index] = provider;
    await saveProviders(request.user.id, providers);

    return {
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        baseUrl: provider.baseUrl,
        apiKey: maskApiKey(provider.encryptedApiKey),
        defaultModel: provider.defaultModel,
        isDefault: provider.isDefault,
        status: provider.status,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      },
    };
  });

  // DELETE /ai-providers/:slug — Remove an AI provider
  app.delete('/ai-providers/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const providers = await getProviders(request.user.id);

    const index = providers.findIndex((p) => p.slug === slug);
    if (index === -1) {
      return reply.status(404).send({ error: `Provider '${slug}' not found` });
    }

    providers.splice(index, 1);
    await saveProviders(request.user.id, providers);

    return { deleted: true };
  });

  // POST /ai-providers/:slug/test — Test connectivity to an AI provider
  app.post('/ai-providers/:slug/test', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const providers = await getProviders(request.user.id);

    const provider = providers.find((p) => p.slug === slug);
    if (!provider) {
      return reply.status(404).send({ error: `Provider '${slug}' not found` });
    }

    let decryptedKey: string;
    try {
      decryptedKey = decrypt(provider.encryptedApiKey);
    } catch {
      return reply.status(500).send({ error: 'Failed to decrypt API key' });
    }

    const startTime = Date.now();

    try {
      // Different providers use different auth headers and test endpoints
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let testUrl = `${provider.baseUrl}/v1/models`;

      if (slug === 'anthropic' || provider.baseUrl.includes('anthropic')) {
        headers['x-api-key'] = decryptedKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (slug === 'openai' || provider.baseUrl.includes('openai')) {
        headers['Authorization'] = `Bearer ${decryptedKey}`;
      } else {
        // Generic: send both headers (works for OpenRouter, AgentRouter, etc.)
        headers['Authorization'] = `Bearer ${decryptedKey}`;
        headers['x-api-key'] = decryptedKey;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10_000),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        // Try alternative endpoint for providers that don't support /v1/models
        const altUrl = `${provider.baseUrl}/models`;
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => null);

        if (altResponse?.ok) {
          return { success: true, latencyMs: Date.now() - startTime };
        }

        return {
          success: false,
          latencyMs,
          error: `API returned status ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true, latencyMs };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : 'Unknown error';

      return {
        success: false,
        latencyMs,
        error: message.includes('abort') || message.includes('timeout')
          ? 'Connection timed out after 10 seconds'
          : `Connection failed: ${message}`,
      };
    }
  });

  // POST /ai-providers/:slug/set-default — Set a provider as the default
  app.post('/ai-providers/:slug/set-default', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const providers = await getProviders(request.user.id);

    const provider = providers.find((p) => p.slug === slug);
    if (!provider) {
      return reply.status(404).send({ error: `Provider '${slug}' not found` });
    }

    for (const p of providers) {
      p.isDefault = p.slug === slug;
    }

    await saveProviders(request.user.id, providers);

    return {
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        baseUrl: provider.baseUrl,
        apiKey: maskApiKey(provider.encryptedApiKey),
        defaultModel: provider.defaultModel,
        isDefault: provider.isDefault,
        status: provider.status,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      },
    };
  });
}
