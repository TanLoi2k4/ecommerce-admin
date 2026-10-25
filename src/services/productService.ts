import client from '../api/client';
import type { ApiResponse, PaginatedResult, SpringPage } from '../types';
import type {
  ProductDetail,
  ProductDocument,
  ProductListItem,
  ProductListParams,
  ProductResponse,
  PublicVendorProfile,
  ReviewResponse,
} from '../types/product';
import { mapSpringPage, toSpringPage } from '../utils/pagination';
import { filterByStatus, toProductDetail, toProductListItem } from './product/mappers';

const BASE = '/products';
const ADMIN_BASE = '/products/admin';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

async function fetchVendorNames(keycloakIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(keycloakIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data } = await client.post<ApiResponse<PublicVendorProfile[]>>('/vendors/public/batch', {
    keycloakIds: uniqueIds.slice(0, 100),
  });

  const vendors = unwrap(data);
  return new Map(vendors.map((v) => [v.keycloakId, v.shopName]));
}

export const productService = {
  async list(params: ProductListParams = {}): Promise<PaginatedResult<ProductListItem>> {
    const uiPage = params.page ?? 1;
    const showDeleted = params.status === 'deleted';
    const { data } = await client.get<ApiResponse<SpringPage<ProductDocument>>>(ADMIN_BASE, {
      params: {
        query: params.search || undefined,
        deleted: showDeleted || undefined,
        page: toSpringPage(uiPage),
        size: params.size ?? 10,
      },
    });

    const page = unwrap(data);
    const vendorNames = await fetchVendorNames(page.content.map((p) => p.keycloakId));
    const items = page.content.map((doc) =>
      toProductListItem(doc, vendorNames.get(doc.keycloakId) ?? 'Unknown vendor'),
    );

    return {
      ...mapSpringPage({ ...page, content: items }, uiPage),
      data: showDeleted ? items : filterByStatus(items, params.status),
    };
  },

  async fetchImageUrlsByIds(ids: number[]): Promise<Map<number, string>> {
    const uniqueIds = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
    const entries = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const { data } = await client.get<ApiResponse<ProductResponse>>(`${BASE}/${id}`);
          const product = unwrap(data);
          const url =
            product.imageUrl ||
            product.images?.find((img) => img.main)?.imageUrl ||
            product.images?.[0]?.imageUrl ||
            '';
          return [id, url] as const;
        } catch {
          return [id, ''] as const;
        }
      }),
    );
    return new Map(entries);
  },

  async getById(id: number): Promise<ProductDetail> {
    const { data } = await client.get<ApiResponse<ProductResponse>>(`${ADMIN_BASE}/${id}`);
    const product = unwrap(data);
    const vendorNames = await fetchVendorNames([product.keycloakId]);
    return toProductDetail(product, vendorNames.get(product.keycloakId) ?? 'Unknown vendor');
  },

  async getTotalCount(): Promise<number> {
    const { data } = await client.get<ApiResponse<SpringPage<ProductDocument>>>(ADMIN_BASE, {
      params: { page: 0, size: 1 },
    });
    return unwrap(data).totalElements;
  },

  async getReviews(productId: number, page = 0, size = 10): Promise<PaginatedResult<ReviewResponse>> {
    const { data } = await client.get<ApiResponse<SpringPage<ReviewResponse>>>(
      `${BASE}/${productId}/reviews`,
      { params: { page, size, sort: 'createdAt,desc' } },
    );
    return mapSpringPage(unwrap(data), page + 1);
  },

  async deleteReview(reviewId: number): Promise<void> {
    const { data } = await client.delete<ApiResponse<void>>(`${BASE}/reviews/${reviewId}`);
    unwrap(data);
  },

  async delete(id: number): Promise<void> {
    const { data } = await client.delete<ApiResponse<void>>(`${ADMIN_BASE}/${id}`);
    unwrap(data);
  },
};
