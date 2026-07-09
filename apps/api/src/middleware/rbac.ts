import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@baseagent/shared';

export function requireRole(...allowedRoles: UserRole[]) {
  return async function rbacMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      reply.code(403).send({
        error: 'Forbidden',
        message: `Required role: ${allowedRoles.join(' or ')}. Your role: ${user.role}`,
      });
      return;
    }
  };
}
