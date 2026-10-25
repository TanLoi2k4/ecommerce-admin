import client from '../api/client';
import type { ApiResponse, PaginatedResult, SpringPage } from '../types';
import type {
  AddressResponse,
  CustomerListItem,
  CustomerListParams,
  CustomerResponse,
  CustomerStatsResponse,
  CustomerStatus,
  CustomerUpdateRequest,
} from '../types/customer';
import { mapSpringPage, toSpringPage } from '../utils/pagination';
import { toCustomerListItem } from './customer/mappers';

const BASE = '/customers/admin';

export const customerService = {
  async list(params: CustomerListParams = {}): Promise<PaginatedResult<CustomerListItem>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<CustomerResponse>>>(BASE, {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 10,
        status: params.status,
        search: params.search,
        sortBy: params.sortBy ?? 'createdAt',
      },
    });
    const mapped = mapSpringPage(data.data, uiPage);
    return {
      ...mapped,
      data: mapped.data.map(toCustomerListItem),
    };
  },

  async getById(id: number): Promise<CustomerResponse> {
    const { data } = await client.get<ApiResponse<CustomerResponse>>(`${BASE}/${id}`);
    return data.data;
  },

  async getStats(): Promise<CustomerStatsResponse> {
    const { data } = await client.get<ApiResponse<CustomerStatsResponse>>(`${BASE}/stats`);
    return data.data;
  },

  async getAddresses(id: number): Promise<AddressResponse[]> {
    const { data } = await client.get<ApiResponse<AddressResponse[]>>(`${BASE}/${id}/addresses`);
    return data.data;
  },

  async updateStatus(id: number, status: CustomerStatus, reason?: string): Promise<CustomerResponse> {
    const { data } = await client.put<ApiResponse<CustomerResponse>>(`${BASE}/${id}/status`, null, {
      params: { status, reason },
    });
    return data.data;
  },

  async updateInfo(id: number, payload: CustomerUpdateRequest): Promise<CustomerResponse> {
    const { data } = await client.put<ApiResponse<CustomerResponse>>(`${BASE}/${id}`, payload);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await client.delete(`${BASE}/${id}`);
  },
};
