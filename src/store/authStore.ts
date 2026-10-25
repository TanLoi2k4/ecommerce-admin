import { create } from 'zustand';
import { authService } from '../services/authService';
import type { AdminRole, AuthUser } from '../types';
import { extractApiError } from '../utils/apiError';
import { tokenStorage } from '../utils/tokenStorage';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  hasInitialized: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: (options?: { silent?: boolean }) => Promise<void>;
  clearError: () => void;
  hasRole: (role: AdminRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  hasInitialized: false,
  error: null,

  login: async (username, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      const { user } = await authService.login({ username, password });
      set({ user, isAuthenticated: true, isLoggingIn: false, hasInitialized: true, error: null });
    } catch (error) {
      set({ error: extractApiError(error, 'Đăng nhập thất bại'), isLoggingIn: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isInitializing: true });
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isInitializing: false,
        isLoggingIn: false,
        hasInitialized: true,
        error: null,
      });
    }
  },

  checkAuth: async (options) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      set({ isInitializing: true });
    }

    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      if (tokenStorage.isAccessTokenExpired()) {
        try {
          await authService.refreshToken();
        } catch {
          tokenStorage.clearTokens();
          set({ user: null, isAuthenticated: false });
          return;
        }
      }

      try {
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true });
      } catch {
        tokenStorage.clearTokens();
        set({ user: null, isAuthenticated: false });
      }
    } finally {
      set({ isInitializing: false, hasInitialized: true });
    }
  },

  clearError: () => set({ error: null }),

  hasRole: (role) => {
    const { user } = get();
    return user?.roles.includes(role) ?? false;
  },
}));
