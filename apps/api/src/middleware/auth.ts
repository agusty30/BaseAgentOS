import type { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<{ id: string; email: string; role: string }>();
    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}
