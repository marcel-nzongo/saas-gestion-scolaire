'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearTokens, setTokens } from '@/lib/auth';
import api from '@/lib/api';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    subdomain: string,
  ) => Promise<string>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password, subdomain) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
            subdomain,
          });
          const { user, tokens } = response.data.data;
          setTokens(tokens.access_token, tokens.refresh_token);
          set({ user, isLoading: false });
          return user.role;
        } catch (error: any) {
          const code = error.response?.data?.error?.code;
          const message =
            code === 'INVALID_CREDENTIALS'
              ? 'Email ou mot de passe incorrect'
              : code === 'TENANT_NOT_FOUND'
                ? 'École introuvable'
                : 'Une erreur est survenue';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          clearTokens();
          set({ user: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'educore-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
