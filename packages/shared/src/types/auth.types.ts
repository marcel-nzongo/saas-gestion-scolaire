// ================================
// Types liés à l'authentification
// ================================

import { UserRole } from './user.types';

export interface JwtPayload {
  sub: string; // user id
  tid: string; // tenant id
  tsc: string; // tenant schema name
  role: UserRole;
  perms: string[]; // permissions
  iat: number;
  exp: number;
  jti: string; // jwt id (pour révocation)
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  subdomain: string;
}

export interface LoginResponse {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    role: UserRole;
    avatar_url?: string;
  };
  tokens: TokenPair;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
