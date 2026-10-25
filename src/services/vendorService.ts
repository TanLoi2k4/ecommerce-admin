import client from '../api/client';
import type { ApiResponse, PaginatedResult, SpringPage } from '../types';
import type {
  VendorBankAccountListParams,
  VendorBankAccountResponse,
  VendorListItem,
  VendorListParams,
  VendorResponse,
  VendorStatsResponse,
  VendorStatus,
  VendorUpdateRequest,
} from '../types/vendor';
import type { PublicVendorProfile } from '../types/product';
import { mapSpringPage, toSpringPage } from '../utils/pagination';
import { toVendorListItem } from './vendor/mappers';

const BASE = '/vendors/admin';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

export const vendorService = {
  async list(params: VendorListParams = {}): Promise<PaginatedResult<VendorListItem>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<VendorResponse>>>(BASE, {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 10,
        status: params.status,
        search: params.search,
        sortBy: params.sortBy ?? 'createdAt',
      },
    });
    const mapped = mapSpringPage(unwrap(data), uiPage);
    return {
      ...mapped,
      data: mapped.data.map(toVendorListItem),
    };
  },

  async getById(id: number): Promise<VendorResponse> {
    const { data } = await client.get<ApiResponse<VendorResponse>>(`${BASE}/${id}`);
    const result = unwrap(data);
    if (!result) {
      throw new Error('Vendor not found');
    }
    return result;
  },

  async updateStatus(id: number, status: VendorStatus): Promise<VendorResponse> {
    const { data } = await client.put<ApiResponse<VendorResponse>>(`${BASE}/${id}/status`, null, {
      params: { status },
    });
    const result = unwrap(data);
    if (!result) {
      throw new Error(data.message || 'Failed to update vendor status');
    }
    return result;
  },

  async updateInfo(id: number, payload: VendorUpdateRequest): Promise<VendorResponse> {
    const { data } = await client.put<ApiResponse<VendorResponse>>(`${BASE}/${id}`, payload);
    const result = unwrap(data);
    if (!result) {
      throw new Error(data.message || 'Failed to update vendor');
    }
    return result;
  },

  async delete(id: number): Promise<void> {
    const { data } = await client.delete<ApiResponse<string>>(`${BASE}/${id}`);
    unwrap(data);
  },

  async getStats(): Promise<VendorStatsResponse> {
    const [all, inactive] = await Promise.all([
      client.get<ApiResponse<SpringPage<VendorResponse>>>(BASE, { params: { page: 0, size: 1 } }),
      client.get<ApiResponse<SpringPage<VendorResponse>>>(BASE, {
        params: { page: 0, size: 1, status: 'INACTIVE' },
      }),
    ]);
    return {
      total: unwrap(all.data).totalElements,
      inactive: unwrap(inactive.data).totalElements,
    };
  },

  async listBankAccounts(
    params: VendorBankAccountListParams = {},
  ): Promise<PaginatedResult<VendorBankAccountResponse>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<VendorBankAccountResponse>>>(
      '/vendors/bank-accounts',
      {
        params: {
          page: toSpringPage(uiPage),
          size: params.size ?? 10,
          bankCode: params.bankCode,
          vendorName: params.vendorName,
          accountName: params.accountName,
          bankName: params.bankName,
          verificationStatus: params.verificationStatus,
        },
      },
    );
    return mapSpringPage(unwrap(data), uiPage);
  },

  async getBankAccountForVendor(
    vendorKeycloakId: string,
    shopName: string,
  ): Promise<VendorBankAccountResponse | null> {
    const { data } = await client.get<ApiResponse<SpringPage<VendorBankAccountResponse>>>(
      '/vendors/bank-accounts',
      { params: { page: 0, size: 20, vendorName: shopName } },
    );
    const page = unwrap(data);
    return page.content.find((account) => account.vendorKeycloakId === vendorKeycloakId) ?? null;
  },

  async getVerifiedBankAccount(vendorKeycloakId: string): Promise<VendorBankAccountResponse | null> {
    try {
      const { data } = await client.get<ApiResponse<VendorBankAccountResponse>>(
        `/vendors/${vendorKeycloakId}/bank-account/verified`,
      );
      if (!data.success) {
        return null;
      }
      return data.data;
    } catch {
      return null;
    }
  },

  async verifyBankAccount(vendorKeycloakId: string, isValid: boolean): Promise<VendorBankAccountResponse> {
    const { data } = await client.post<ApiResponse<VendorBankAccountResponse>>(
      `/vendors/${vendorKeycloakId}/bank-account/verify`,
      null,
      { params: { isValid } },
    );
    const result = unwrap(data);
    if (!result) {
      throw new Error(data.message || 'Failed to verify bank account');
    }
    return result;
  },

  async fetchShopNamesByIds(keycloakIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(keycloakIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const { data } = await client.post<ApiResponse<PublicVendorProfile[]>>('/vendors/public/batch', {
      keycloakIds: uniqueIds.slice(0, 100),
    });

    const vendors = unwrap(data) ?? [];
    return new Map(vendors.map((vendor) => [vendor.keycloakId, vendor.shopName]));
  },
};
