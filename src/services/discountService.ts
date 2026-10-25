import client from '../api/client';
import type { ApiResponse, PaginatedResult, SpringPage } from '../types';
import type { Discount, DiscountListParams, DiscountRequest, DiscountStatus } from '../types/discount';
import { mapSpringPage, toSpringPage } from '../utils/pagination';

const BASE = '/discounts';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

function toNum(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  if (typeof value === 'string') {
    if (/^\d+(\.\d+)?$/.test(value.trim())) {
      const n = Number(value);
      const ms = n < 1e12 ? n * 1000 : n;
      return new Date(ms).toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return null;
}

export function normalizeDiscount(raw: Discount): Discount {
  return {
    ...raw,
    id: Number(raw.id),
    discountValue: toNum(raw.discountValue) ?? 0,
    minOrderValue: toNum(raw.minOrderValue) ?? 0,
    maxDiscount: toNum(raw.maxDiscount) ?? null,
    startDate: toIsoOrNull(raw.startDate),
    endDate: toIsoOrNull(raw.endDate),
    usageLimit: toNum(raw.usageLimit) ?? null,
    usedCount: toNum(raw.usedCount) ?? 0,
  };
}

export function getDiscountStatus(discount: Discount, now = Date.now()): DiscountStatus {
  const used = discount.usedCount ?? 0;
  const limit = discount.usageLimit;
  if (limit != null && limit > 0 && used >= limit) return 'exhausted';

  const start = discount.startDate ? new Date(discount.startDate).getTime() : null;
  const end = discount.endDate ? new Date(discount.endDate).getTime() : null;

  if (start != null && !Number.isNaN(start) && now < start) return 'scheduled';
  if (end != null && !Number.isNaN(end) && now > end) return 'expired';
  return 'active';
}

/** Convert datetime-local / date input to Instant ISO string for backend. */
export function localInputToInstant(value: string, endOfDay = false): string | null {
  if (!value?.trim()) return null;
  if (value.includes('T')) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(endOfDay ? `${value}T23:59:59` : `${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Instant ISO → datetime-local value (yyyy-MM-ddTHH:mm) */
export function instantToLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const discountService = {
  async list(params: DiscountListParams = {}): Promise<PaginatedResult<Discount>> {
    const uiPage = params.page ?? 1;
    const { data } = await client.get<ApiResponse<SpringPage<Discount>>>(BASE, {
      params: {
        page: toSpringPage(uiPage),
        size: params.size ?? 20,
        sort: 'id,desc',
      },
    });
    const page = unwrap(data);
    const items = (page.content ?? []).map(normalizeDiscount);
    return mapSpringPage({ ...page, content: items }, uiPage);
  },

  async getById(id: number): Promise<Discount> {
    const { data } = await client.get<ApiResponse<Discount>>(`${BASE}/${id}`);
    return normalizeDiscount(unwrap(data));
  },

  async create(request: DiscountRequest): Promise<Discount> {
    const { data } = await client.post<ApiResponse<Discount>>(BASE, request);
    return normalizeDiscount(unwrap(data));
  },

  async update(id: number, request: DiscountRequest): Promise<Discount> {
    const { data } = await client.put<ApiResponse<Discount>>(`${BASE}/${id}`, request);
    return normalizeDiscount(unwrap(data));
  },

  async remove(id: number): Promise<void> {
    const { data } = await client.delete<ApiResponse<null>>(`${BASE}/${id}`);
    unwrap(data);
  },
};
