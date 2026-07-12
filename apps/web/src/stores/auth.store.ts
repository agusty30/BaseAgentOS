import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, accessToken } = await api.login({ email, password });
      api.setToken(accessToken);
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, accessToken } = await api.register({ name, email, password });
      api.setToken(accessToken);
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // Proceed with local logout even if the server call fails
    } finally {
      api.clearToken();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  refreshToken: async () => {
    try {
      const { accessToken, user } = await api.refresh();
      api.setToken(accessToken);
      set({ accessToken, user, isAuthenticated: true });
      return true;
    } catch {
      api.clearToken();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));
