import { db } from '../db/index.js';
import { missions, missionSteps } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { MissionStatus, AgentType, NetworkId } from '@baseagent/shared';

interface CreateMissionParams {
  userId: string;
  agentType: AgentType;
  title: string;
  description: string;
  walletId?: string;
  network: NetworkId;
  approvalRequired?: boolean;
}

export class MissionService {
  async create(params: CreateMissionParams) {
    const correlationId = uuidv4();
    const [mission] = await db.insert(missions).values({
      id: uuidv4(),
      userId: params.userId,
      agentType: params.agentType,
      status: 'planning',
      title: params.title,
      description: params.description,
      walletId: params.walletId,
      network: params.network,
      startedAt: new Date(),
      correlationId,
      approvalStatus: params.approvalRequired ? 'pending' : 'not_required',
    }).returning();
    return mission;
  }

  async getById(id: string) {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission || null;
  }

  async listByUser(userId: string, limit = 50, offset = 0) {
    return db.select().from(missions)
      .where(eq(missions.userId, userId))
      .orderBy(desc(missions.createdAt))
      .limit(limit).offset(offset);
  }

  async updateStatus(id: string, status: MissionStatus, error?: string) {
    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date();
    }
    if (error) updates.error = error;
    const [updated] = await db.update(missions).set(updates).where(eq(missions.id, id)).returning();
    return updated;
  }

  async approve(id: string) {
    const [updated] = await db.update(missions)
      .set({ approvalStatus: 'approved', updatedAt: new Date() })
      .where(eq(missions.id, id)).returning();
    return updated;
  }

  async reject(id: string) {
    const [updated] = await db.update(missions)
      .set({ approvalStatus: 'rejected', status: 'cancelled', updatedAt: new Date() })
      .where(eq(missions.id, id)).returning();
    return updated;
  }

  async addStep(missionId: string, step: number, name: string) {
    const [s] = await db.insert(missionSteps).values({
      id: uuidv4(),
      missionId,
      step,
      name,
      status: 'running',
      startedAt: new Date(),
    }).returning();
    return s;
  }

  async completeStep(stepId: string, output?: Record<string, unknown>) {
    const [s] = await db.update(missionSteps).set({
      status: 'completed',
      output,
      completedAt: new Date(),
    }).where(eq(missionSteps.id, stepId)).returning();
    return s;
  }

  async failStep(stepId: string, error: string) {
    const [s] = await db.update(missionSteps).set({
      status: 'failed',
      error,
      completedAt: new Date(),
    }).where(eq(missionSteps.id, stepId)).returning();
    return s;
  }

  async getSteps(missionId: string) {
    return db.select().from(missionSteps)
      .where(eq(missionSteps.missionId, missionId))
      .orderBy(missionSteps.step);
  }
}

export const missionService = new MissionService();
