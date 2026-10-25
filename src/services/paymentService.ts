import client from '../api/client';
import type { ApiResponse, PaginatedResult, SpringPage } from '../types';
import type {
  PayablesFilterParams,
  PaymentDetail,
  PaymentStatus,
  PlatformPayableToVendor,
  RejectPayoutRequest,
  VendorPayableToPlatform,
  VendorPayout,
  VendorPayoutStatus,
} from '../types/payment';
import { mapSpringPage, toSpringPage } from '../utils/pagination';
import { toTransactionListItem } from './order/mappers';
import {
  normalizePaymentDetail,
  normalizePlatformPayable,
  normalizeVendorPayable,
  normalizeVendorPayout,
} from '../types/payment';

const ADMIN_BASE = '/payments/admin';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

export const paymentService = {
  async listPayouts(status: VendorPayoutStatus = 'PENDING_APPROVAL'): Promise<VendorPayout[]> {
    const { data } = await client.get<ApiResponse<VendorPayout[]>>(`${ADMIN_BASE}/payouts`, {
      params: { status },
    });
    return (unwrap(data) ?? []).map(normalizeVendorPayout);
  },

  async approvePayout(payoutId: number): Promise<VendorPayout> {
    const { data } = await client.post<ApiResponse<VendorPayout>>(
      `${ADMIN_BASE}/payouts/${payoutId}/approve`
    );
    return normalizeVendorPayout(unwrap(data));
  },

  async rejectPayout(payoutId: number, request: RejectPayoutRequest): Promise<VendorPayout> {
    const { data } = await client.post<ApiResponse<VendorPayout>>(
      `${ADMIN_BASE}/payouts/${payoutId}/reject`,
      request
    );
    return normalizeVendorPayout(unwrap(data));
  },

  async releaseFailedPayoutItems(payoutId: number): Promise<VendorPayout> {
    const { data } = await client.post<ApiResponse<VendorPayout>>(
      `${ADMIN_BASE}/payouts/${payoutId}/release-items`
    );
    return normalizeVendorPayout(unwrap(data));
  },

  async getPlatformPayables(params: PayablesFilterParams = {}): Promise<PlatformPayableToVendor[]> {
    const { data } = await client.get<ApiResponse<PlatformPayableToVendor[]>>(
      `${ADMIN_BASE}/platform-payables`,
      { params }
    );
    return (unwrap(data) ?? []).map(normalizePlatformPayable);
  },

  async getVendorPayables(params: PayablesFilterParams = {}): Promise<VendorPayableToPlatform[]> {
    const { data } = await client.get<ApiResponse<VendorPayableToPlatform[]>>(
      `${ADMIN_BASE}/vendor-payables`,
      { params }
    );
    return (unwrap(data) ?? []).map(normalizeVendorPayable);
  },

  async getPaymentByOrderCode(orderCode: string): Promise<PaymentDetail> {
    const { data } = await client.get<ApiResponse<PaymentDetail>>(
      `${ADMIN_BASE}/${encodeURIComponent(orderCode)}`
    );
    return normalizePaymentDetail(unwrap(data));
  },

  async listTransactions(params: {
    page?: number;
    size?: number;
    search?: string;
    status?: PaymentStatus;
  } = {}): Promise<PaginatedResult<ReturnType<typeof toTransactionListItem>>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<PaymentDetail>>>(`${ADMIN_BASE}/transactions`, {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 10,
        search: params.search || undefined,
        status: params.status,
      },
    });

    const page = unwrap(data);
    return {
      ...mapSpringPage(page, uiPage),
      data: page.content.map((item) => toTransactionListItem(normalizePaymentDetail(item))),
    };
  },
};
