import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';

interface AuditOptions {
  action: string;
  resource: string;
  getResourceId?: (request: FastifyRequest) => string | undefined;
  getDetails?: (request: FastifyRequest, reply: FastifyReply) => Record<string, unknown> | undefined;
}

export function auditLog(options: AuditOptions) {
  return async function auditMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const startTime = Date.now();

    reply.raw.on('finish', () => {
      const userId = (request as any).user?.id ?? null;
      const resourceId = options.getResourceId?.(request) ?? null;
      const details = options.getDetails?.(request, reply) ?? {};
      const ipAddress =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
        request.ip;

      db.insert(auditLogs)
        .values({
          userId,
          action: options.action,
          resource: options.resource,
          resourceId,
          details: {
            ...details,
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            durationMs: Date.now() - startTime,
            userAgent: request.headers['user-agent'],
          },
          ipAddress,
          correlationId: (request.headers['x-correlation-id'] as string) ?? null,
        })
        .execute()
        .catch((err) => {
          request.log.error({ err }, 'Failed to write audit log');
        });
    });
  };
}
