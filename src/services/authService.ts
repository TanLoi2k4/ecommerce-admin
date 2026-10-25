import client from '../api/client';
import { refreshAccessToken } from '../api/tokenRefresh';
import type {
  AdminRole,
  AdminUpdateAccountRequest,
  AdminUpdateProfileRequest,
  AdminUserResponse,
  ApiResponse,
  AuthUser,
  ForgetPasswordRequest,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  ResetPasswordRequest,
} from '../types';
import { extractAdminRoles } from '../utils/jwt';
import { tokenStorage } from '../utils/tokenStorage';

export function mapAdminUserToAuthUser(admin: AdminUserResponse, roles: AdminRole[]): AuthUser {
  return {
    id: String(admin.id),
    username: admin.username,
    email: admin.email,
    name: `${admin.lastName} ${admin.firstName}`.trim(),
    firstName: admin.firstName,
    lastName: admin.lastName,
    phoneNumber: admin.phoneNumber,
    status: admin.status,
    roles,
    isSuperAdmin: roles.includes('SUPER_ADMIN'),
    createdAt: admin.createdAt,
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<{ tokens: LoginResponse; user: AuthUser }> {
    const { data } = await client.post<ApiResponse<LoginResponse>>('/admin/users/login', credentials);
    const tokens = data.data;
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
    const roles = extractAdminRoles(tokens.accessToken);
    const profile = await this.getProfile();
    return { tokens, user: mapAdminUserToAuthUser(profile, roles) };
  },

  async logout(): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    if (accessToken && refreshToken) {
      try {
        const body: LogoutRequest = { accessToken, refreshToken };
        await client.post('/admin/users/logout', body);
      } catch {
        // Clear local session even if blacklist call fails
      }
    }
    tokenStorage.clearTokens();
  },

  async getProfile(): Promise<AdminUserResponse> {
    const { data } = await client.get<ApiResponse<AdminUserResponse>>('/admin/users/profile');
    return data.data;
  },

  async getCurrentUser(): Promise<AuthUser> {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) throw new Error('Unauthorized');
    const profile = await this.getProfile();
    const roles = extractAdminRoles(accessToken);
    return mapAdminUserToAuthUser(profile, roles);
  },

  async updateProfile(payload: AdminUpdateProfileRequest): Promise<AuthUser> {
    const { data } = await client.put<ApiResponse<AdminUserResponse>>('/admin/users/profile', payload);
    const accessToken = tokenStorage.getAccessToken();
    const roles = accessToken ? extractAdminRoles(accessToken) : [];
    return mapAdminUserToAuthUser(data.data, roles);
  },

  async updateAccount(payload: AdminUpdateAccountRequest): Promise<AuthUser> {
    const { data } = await client.put<ApiResponse<AdminUserResponse>>('/admin/users/account', payload);
    const accessToken = tokenStorage.getAccessToken();
    const roles = accessToken ? extractAdminRoles(accessToken) : [];
    return mapAdminUserToAuthUser(data.data, roles);
  },

  async forgetPassword(payload: ForgetPasswordRequest): Promise<void> {
    await client.post('/admin/users/forget-password', payload);
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await client.post('/admin/users/reset-password', payload);
  },

  async refreshToken(): Promise<LoginResponse> {
    return refreshAccessToken();
  },
};
