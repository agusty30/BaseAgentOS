import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { missionService } from '../services/mission.service.js';

export async function missionRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get('/', async (request) => {
    const { limit, offset, status } = request.query as { limit?: string; offset?: string; status?: string };
    const missions = await missionService.listByUser(
      request.user.id,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
    if (status) {
      return missions.filter(m => m.status === status);
    }
    return missions;
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return missionService.getById(id);
  });

  app.get('/:id/steps', async (request) => {
    const { id } = request.params as { id: string };
    return missionService.getSteps(id);
  });

  app.post('/:id/approve', async (request) => {
    const { id } = request.params as { id: string };
    return missionService.approve(id);
  });

  app.post('/:id/reject', async (request) => {
    const { id } = request.params as { id: string };
    return missionService.reject(id);
  });

  app.post('/:id/cancel', async (request) => {
    const { id } = request.params as { id: string };
    return missionService.updateStatus(id, 'cancelled');
  });

  app.post('/:id/replay', async (request) => {
    const { id } = request.params as { id: string };
    const original = await missionService.getById(id);
    if (!original) return { error: 'Mission not found' };
    const replay = await missionService.create({
      userId: request.user.id,
      agentType: original.agentType as any,
      title: `[Replay] ${original.title}`,
      description: original.description,
      walletId: original.walletId || undefined,
      network: original.network as any,
    });
    return replay;
  });

  app.register(async function wsRoutes(wsApp) {
    wsApp.get('/ws', { websocket: true }, (socket) => {
      const interval = setInterval(async () => {
        try {
          const recent = await missionService.listByUser('system', 10);
          socket.send(JSON.stringify({ type: 'missions_update', data: recent }));
        } catch { /* connection might be closed */ }
      }, 3000);

      socket.on('close', () => clearInterval(interval));
    });
  });
}
