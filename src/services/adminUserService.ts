import client from '../api/client';
import type {
  AdminUserCreateRequest,
  AdminUserResponse,
  AdminUserStatus,
  AdminUserUpdateAccountRequest,
  AdminUpdateProfileRequest,
  ApiResponse,
  PaginatedResult,
  SpringPage,
} from '../types';
import { mapSpringPage, toSpringPage } from '../utils/pagination';

export interface AdminUserListParams {
  page?: number;
  size?: number;
  status?: AdminUserStatus;
  search?: string;
}

export const adminUserService = {
  async list(params: AdminUserListParams = {}): Promise<PaginatedResult<AdminUserResponse>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<AdminUserResponse>>>('/admin/users', {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 10,
        status: params.status,
        query: params.search,
      },
    });
    return mapSpringPage(data.data, uiPage);
  },

  async getById(id: number): Promise<AdminUserResponse> {
    const { data } = await client.get<ApiResponse<AdminUserResponse>>(`/admin/users/${id}`);
    return data.data;
  },

  async create(payload: AdminUserCreateRequest): Promise<AdminUserResponse> {
    const { data } = await client.post<ApiResponse<AdminUserResponse>>('/admin/users', payload, {
      timeout: 30000,
      skipAuthRedirect: true,
    });
    return data.data;
  },

  async updateProfile(id: number, payload: AdminUpdateProfileRequest): Promise<AdminUserResponse> {
    const { data } = await client.put<ApiResponse<AdminUserResponse>>(`/admin/users/${id}/profile`, payload);
    return data.data;
  },

  async updateAccount(id: number, payload: AdminUserUpdateAccountRequest): Promise<AdminUserResponse> {
    const { data } = await client.put<ApiResponse<AdminUserResponse>>(`/admin/users/${id}/account`, payload);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await client.delete(`/admin/users/${id}`);
  },
};
