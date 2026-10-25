import axios from 'axios';
import type { ApiResponse, LoginResponse } from '../types';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let refreshPromise: Promise<LoginResponse> | null = null;

export async function refreshAccessToken(): Promise<LoginResponse> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  refreshPromise = axios
    .post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/admin/users/refresh`, { refreshToken }, { timeout: 15000 })
    .then((response) => {
      const body = response.data;
      if (!body.success || !body.data?.accessToken || !body.data?.refreshToken) {
        throw new Error(body.message || 'Refresh failed');
      }
      const tokens = body.data;
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      return tokens;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/admin/users/login') ||
    url.includes('/admin/users/refresh') ||
    url.includes('/admin/users/logout') ||
    url.includes('/admin/users/forget-password') ||
    url.includes('/admin/users/reset-password')
  );
}
