import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import redis from '../config/redis';
import { env } from '../config/env';
import { JwtPayload, TokenPair } from '@educore/shared';
import { UserRole } from '@educore/shared';

export class TokenService {
  // Générer une paire de tokens
  static generateTokens(payload: {
    userId: string;
    tenantId: string;
    schemaName: string;
    role: UserRole;
    permissions: string[];
  }): TokenPair {
    const jti = uuidv4();

    const accessPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: payload.userId,
      tid: payload.tenantId,
      tsc: payload.schemaName,
      role: payload.role,
      perms: payload.permissions,
      jti,
    };

    const access_token = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);

    const refresh_token = jwt.sign(
      { sub: payload.userId, tid: payload.tenantId, jti },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions,
    );

    return {
      access_token,
      refresh_token,
      expires_in: 15 * 60, // 15 minutes en secondes
    };
  }

  // Vérifier un access token
  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  }

  // Vérifier un refresh token
  static verifyRefreshToken(token: string): any {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }

  // Sauvegarder le refresh token dans Redis
  static async saveRefreshToken(userId: string, token: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    const expiry = 7 * 24 * 60 * 60; // 7 jours en secondes
    await redis.setex(key, expiry, token);
  }

  // Vérifier si le refresh token est valide dans Redis
  static async isRefreshTokenValid(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const key = `refresh_token:${userId}`;
    const stored = await redis.get(key);
    return stored === token;
  }

  // Révoquer le refresh token
  static async revokeRefreshToken(userId: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    await redis.del(key);
  }

  // Blacklister un access token (lors du logout)
  static async blacklistAccessToken(
    jti: string,
    expiresIn: number,
  ): Promise<void> {
    const key = `blacklist:${jti}`;
    await redis.setex(key, expiresIn, '1');
  }

  // Vérifier si un token est blacklisté
  static async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = `blacklist:${jti}`;
    const result = await redis.get(key);
    return result === '1';
  }
}
