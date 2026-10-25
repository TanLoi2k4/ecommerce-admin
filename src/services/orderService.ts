import client from '../api/client';
import type { ApiResponse, PaginatedResult } from '../../types';
import type { AnalyticsPeriodQuery } from '../types/analytics';
import type {
  AdminOrderDetailDto,
  AdminOrderStatsDto,
  OrderListParams,
  OrderPageResponse,
  OrderProductInfo,
  ReturnRequestDto,
  ReturnRequestPage,
  ReturnRequestStatus,
} from '../types/order';
import { toPeriodParams, todayAnchor } from '../utils/analyticsPeriod';
import { productService } from './productService';
import { vendorService } from './vendorService';
import { toOrderDetail, toOrderListItem } from './order/mappers';

const BASE = '/orders/admin';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

function mapOrderPage(page: OrderPageResponse, uiPage: number): PaginatedResult<ReturnType<typeof toOrderListItem>> {
  return {
    data: [],
    total: page.totalElements,
    page: uiPage,
    totalPages: page.totalPages,
  };
}

export const orderService = {
  async list(params: OrderListParams = {}): Promise<PaginatedResult<ReturnType<typeof toOrderListItem>>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<OrderPageResponse>>(BASE, {
      params: {
        page: Math.max(0, uiPage - 1),
        size: params.size ?? 10,
        search: params.search || undefined,
        status: params.status || undefined,
      },
    });

    const page = unwrap(data);
    const vendorIds = page.items.flatMap((order) => order.vendorKeycloakIds);
    const vendorNames = await vendorService.fetchShopNamesByIds(vendorIds);
    const items = page.items.map((order) => toOrderListItem(order, vendorNames));

    return {
      ...mapOrderPage(page, uiPage),
      data: items,
    };
  },

  async getByOrderCode(orderCode: string) {
    const { data } = await client.get<ApiResponse<AdminOrderDetailDto>>(`${BASE}/${encodeURIComponent(orderCode)}`);
    const detail = unwrap(data);
    if (!detail?.order) {
      throw new Error('Order not found');
    }

    const productIds = detail.order.subOrders.flatMap((subOrder) =>
      subOrder.items.map((item) => item.productId),
    );
    const products = await fetchProductInfo(productIds);
    return toOrderDetail(detail, products);
  },

  async getStats(query: AnalyticsPeriodQuery = {}): Promise<AdminOrderStatsDto> {
    const { data } = await client.get<ApiResponse<AdminOrderStatsDto>>(`${BASE}/stats`, {
      params: toPeriodParams(query.period ?? 'MONTH', query.anchor || todayAnchor()),
    });
    return unwrap(data);
  },

  async listReturns(params: { page?: number; size?: number; status?: ReturnRequestStatus } = {}): Promise<ReturnRequestPage> {
    const { data } = await client.get<ApiResponse<ReturnRequestPage>>(`${BASE}/returns`, {
      params: {
        page: Math.max(0, (params.page ?? 1) - 1),
        size: params.size ?? 20,
        status: params.status,
      },
    });
    return unwrap(data);
  },

  async approveReturn(returnId: number, note?: string): Promise<ReturnRequestDto> {
    const { data } = await client.post<ApiResponse<ReturnRequestDto>>(
      `${BASE}/returns/${returnId}/approve`,
      note ? { note } : {},
    );
    return unwrap(data);
  },

  async rejectReturn(returnId: number, note: string): Promise<ReturnRequestDto> {
    const { data } = await client.post<ApiResponse<ReturnRequestDto>>(
      `${BASE}/returns/${returnId}/reject`,
      { note },
    );
    return unwrap(data);
  },
};

function resolveProductImageUrl(product: {
  imageUrl?: string;
  images?: Array<{ imageUrl?: string; main?: boolean }>;
}): string {
  return (
    product.imageUrl ||
    product.images?.find((img) => img.main)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    ''
  );
}

async function fetchProductInfo(productIds: number[]): Promise<Map<number, OrderProductInfo>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const product = await productService.getById(id);
        return [
          id,
          { name: product.name, imageUrl: resolveProductImageUrl(product) },
        ] as const;
      } catch {
        return [id, { name: `Product #${id}`, imageUrl: '' }] as const;
      }
    }),
  );

  return new Map(entries);
}
