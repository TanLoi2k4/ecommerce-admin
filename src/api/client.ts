import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { refreshAccessToken, isAuthEndpoint } from './tokenRefresh';
import { tokenStorage } from '../utils/tokenStorage';

type ApiRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRedirect?: boolean;
};

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

function redirectToLogin() {
  tokenStorage.clearTokens();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  if (!isAuthEndpoint(config.url) && tokenStorage.getAccessToken() && tokenStorage.isAccessTokenExpired()) {
    try {
      await refreshAccessToken();
    } catch {
      tokenStorage.clearTokens();
      redirectToLogin();
      return Promise.reject(new Error('Session expired'));
    }
  }

  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ApiRequestConfig | undefined;
    const status = error.response?.status;
    const skipAuthRedirect = originalRequest?.skipAuthRedirect;

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
      if (status === 401 && !isAuthEndpoint(originalRequest?.url) && !skipAuthRedirect) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshAccessToken();
      const token = tokenStorage.getAccessToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      return client(originalRequest);
    } catch (refreshError) {
      if (!skipAuthRedirect) {
        redirectToLogin();
      }
      return Promise.reject(refreshError);
    }
  }
);

export default client;
