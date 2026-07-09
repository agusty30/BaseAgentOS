import argon2 from 'argon2';
import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export async function generateTokens(app: FastifyInstance, user: UserPayload) {
  const accessToken = app.jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' },
  );
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    refreshSecret,
    { expiresIn: '7d' },
  );
  return { accessToken, refreshToken };
}

export function generateRefreshToken(app: FastifyInstance, user: UserPayload): string {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    refreshSecret,
    { expiresIn: '7d' },
  );
}

export function verifyRefreshToken(token: string): UserPayload {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  const decoded = jwt.verify(token, refreshSecret) as UserPayload & { iat: number; exp: number };
  return { id: decoded.id, email: decoded.email, role: decoded.role };
}
