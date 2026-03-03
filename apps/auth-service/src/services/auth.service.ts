import bcrypt from 'bcryptjs';
import { db, getTenantDb } from '../config/database';
import { TokenService } from './token.service';
import { ROLE_PERMISSIONS } from '@educore/shared';
import { LoginRequest, LoginResponse, TokenPair } from '@educore/shared';
import { ERROR_CODES } from '@educore/shared';

export class AuthService {
  // ================================
  // CONNEXION
  // ================================
  static async login(data: LoginRequest): Promise<LoginResponse> {
    // 1. Trouver le tenant via subdomain
    const tenant = await db('tenants')
      .where({ subdomain: data.subdomain, status: 'active' })
      .orWhere({ subdomain: data.subdomain, status: 'trial' })
      .first();

    if (!tenant) {
      throw { code: ERROR_CODES.TENANT_NOT_FOUND, status: 404 };
    }

    if (tenant.status === 'suspended') {
      throw { code: ERROR_CODES.TENANT_SUSPENDED, status: 403 };
    }

    // 2. Connexion au schéma du tenant
    const tenantDb = getTenantDb(tenant.schema_name);

    // 3. Trouver l'utilisateur
    let user;
    if (data.email) {
      user = await tenantDb('users')
        .where({ email: data.email, is_active: true })
        .first();
    } else if (data.phone) {
      user = await tenantDb('users')
        .where({ phone: data.phone, is_active: true })
        .first();
    }

    if (!user) {
      throw { code: ERROR_CODES.INVALID_CREDENTIALS, status: 401 };
    }

    // 4. Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw { code: ERROR_CODES.INVALID_CREDENTIALS, status: 401 };
    }

    // 5. Récupérer les permissions du rôle
    const permissions = ROLE_PERMISSIONS[user.role] || [];

    // 6. Générer les tokens
    const tokens = TokenService.generateTokens({
      userId: user.id,
      tenantId: tenant.id,
      schemaName: tenant.schema_name,
      role: user.role,
      permissions,
    });

    // 7. Sauvegarder le refresh token
    await TokenService.saveRefreshToken(user.id, tokens.refresh_token);

    // 8. Mettre à jour last_login_at
    await tenantDb('users')
      .where({ id: user.id })
      .update({ last_login_at: new Date() });

    return {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      tokens,
    };
  }

  // ================================
  // REFRESH TOKEN
  // ================================
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    // 1. Vérifier le token
    let decoded: any;
    try {
      decoded = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw { code: ERROR_CODES.TOKEN_INVALID, status: 401 };
    }

    // 2. Vérifier dans Redis
    const isValid = await TokenService.isRefreshTokenValid(
      decoded.sub,
      refreshToken,
    );

    if (!isValid) {
      throw { code: ERROR_CODES.TOKEN_INVALID, status: 401 };
    }

    // 3. Récupérer le tenant
    const tenant = await db('tenants').where({ id: decoded.tid }).first();

    if (!tenant) {
      throw { code: ERROR_CODES.TENANT_NOT_FOUND, status: 404 };
    }

    // 4. Récupérer l'utilisateur
    const tenantDb = getTenantDb(tenant.schema_name);
    const user = await tenantDb('users')
      .where({ id: decoded.sub, is_active: true })
      .first();

    if (!user) {
      throw { code: ERROR_CODES.USER_NOT_FOUND, status: 404 };
    }

    // 5. Générer nouveaux tokens (rotation)
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    const newTokens = TokenService.generateTokens({
      userId: user.id,
      tenantId: tenant.id,
      schemaName: tenant.schema_name,
      role: user.role,
      permissions,
    });

    // 6. Remplacer l'ancien refresh token
    await TokenService.saveRefreshToken(user.id, newTokens.refresh_token);

    return newTokens;
  }

  // ================================
  // LOGOUT
  // ================================
  static async logout(
    userId: string,
    jti: string,
    tokenExp: number,
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = tokenExp - now;

    // Blacklister l'access token
    if (remainingTime > 0) {
      await TokenService.blacklistAccessToken(jti, remainingTime);
    }

    // Révoquer le refresh token
    await TokenService.revokeRefreshToken(userId);
  }

  // ================================
  // CRÉER UN UTILISATEUR (Admin)
  // ================================
  static async createUser(
    schemaName: string,
    userData: {
      email?: string;
      phone?: string;
      password: string;
      first_name: string;
      last_name: string;
      role: string;
      gender?: string;
      date_of_birth?: string;
    },
  ) {
    const tenantDb = getTenantDb(schemaName);

    // Vérifier si l'email existe déjà
    if (userData.email) {
      const existing = await tenantDb('users')
        .where({ email: userData.email })
        .first();
      if (existing) {
        throw { code: ERROR_CODES.USER_ALREADY_EXISTS, status: 409 };
      }
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(userData.password, 12);

    // Créer l'utilisateur
    const [user] = await tenantDb('users')
      .insert({
        ...userData,
        password_hash,
        password: undefined,
      })
      .returning([
        'id',
        'email',
        'first_name',
        'last_name',
        'role',
        'is_active',
        'created_at',
      ]);

    return user;
  }
}
