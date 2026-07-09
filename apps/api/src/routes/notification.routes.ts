import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get('/', async (request) => {
    const { limit, unreadOnly } = request.query as { limit?: string; unreadOnly?: string };
    let query = db.select().from(notifications)
      .where(eq(notifications.userId, request.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(parseInt(limit || '50'));
    return query;
  });

  app.patch('/:id/read', async (request) => {
    const { id } = request.params as { id: string };
    const [updated] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  });

  app.post('/read-all', async (request) => {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, request.user.id));
    return { message: 'All notifications marked as read' };
  });
}
