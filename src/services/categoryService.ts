import client from '../api/client';
import type { ApiResponse } from '../types';
import type { CategoryListItem, CategoryRequest, CategoryResponse } from '../types/category';
import { toCategoryListItem } from './category/mappers';

const BASE = '/products/admin/categories';

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

export const categoryService = {
  async list(): Promise<CategoryListItem[]> {
    const { data } = await client.get<ApiResponse<CategoryResponse[]>>(BASE);
    return unwrap(data).map(toCategoryListItem);
  },

  async getById(id: number): Promise<CategoryListItem> {
    const { data } = await client.get<ApiResponse<CategoryResponse>>(`${BASE}/${id}`);
    return toCategoryListItem(unwrap(data));
  },

  async create(payload: CategoryRequest): Promise<CategoryListItem> {
    const { data } = await client.post<ApiResponse<CategoryResponse>>(BASE, payload);
    return toCategoryListItem(unwrap(data));
  },

  async update(id: number, payload: CategoryRequest): Promise<CategoryListItem> {
    const { data } = await client.put<ApiResponse<CategoryResponse>>(`${BASE}/${id}`, payload);
    return toCategoryListItem(unwrap(data));
  },

  async deactivate(id: number): Promise<void> {
    const { data } = await client.delete<ApiResponse<void>>(`${BASE}/${id}`);
    unwrap(data);
  },
};
