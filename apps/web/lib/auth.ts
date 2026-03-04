import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  sub: string;
  tid: string;
  tsc: string;
  role: string;
  perms: string[];
  iat: number;
  exp: number;
  jti: string;
}

export const setTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('access_token', accessToken, {
    expires: 1,
    path: '/',
  });
  Cookies.set('refresh_token', refreshToken, {
    expires: 7,
    path: '/',
  });
};

export const clearTokens = () => {
  Cookies.remove('access_token', { path: '/' });
  Cookies.remove('refresh_token', { path: '/' });
};

export const getAccessToken = (): string | undefined => {
  return Cookies.get('access_token');
};

export const getDecodedToken = (): JwtPayload | null => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getDecodedToken();
  if (!token) return false;
  return token.exp > Date.now() / 1000;
};

export const getDashboardRoute = (role: string): string => {
  const routes: Record<string, string> = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
    parent: '/parent',
    accountant: '/admin/finance',
    librarian: '/admin',
  };
  return routes[role] || '/login';
};
