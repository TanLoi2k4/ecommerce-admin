import { getJwtExpiryMs } from './jwt';

const ACCESS_TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const EXPIRES_AT_KEY = 'admin_token_expires_at';

function resolveExpiresAt(accessToken: string, expiresIn?: number): number | null {
  if (expiresIn && expiresIn > 0) {
    return Date.now() + expiresIn * 1000;
  }
  return getJwtExpiryMs(accessToken);
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getExpiresAt: () => {
    const value = localStorage.getItem(EXPIRES_AT_KEY);
    return value ? Number(value) : null;
  },
  setTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    const expiresAt = resolveExpiresAt(accessToken, expiresIn);
    if (expiresAt) {
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    } else {
      localStorage.removeItem(EXPIRES_AT_KEY);
    }
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem('admin_token');
  },
  isAccessTokenExpired: (skewMs = 30_000) => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;

    const expiresAt = tokenStorage.getExpiresAt() ?? getJwtExpiryMs(token);
    if (!expiresAt) return false;

    return Date.now() >= expiresAt - skewMs;
  },
};
