import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { portfolioService } from '../services/portfolio.service.js';

export async function portfolioRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get('/', async (request) => {
    const { network } = request.query as { network?: string };
    const snapshot = await portfolioService.getLatestSnapshot(request.user.id);
    if (!snapshot) {
      return portfolioService.createSnapshot(request.user.id, network || 'base-sepolia');
    }
    return snapshot;
  });

  app.get('/history', async (request) => {
    const { limit } = request.query as { limit?: string };
    return portfolioService.getHistory(request.user.id, parseInt(limit || '30'));
  });

  app.get('/performance', async (request) => {
    return portfolioService.getPerformance(request.user.id);
  });

  app.post('/snapshot', async (request) => {
    const { network } = request.body as { network?: string };
    return portfolioService.createSnapshot(request.user.id, network || 'base-sepolia');
  });
}
