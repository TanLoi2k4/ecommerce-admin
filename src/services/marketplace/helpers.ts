import type { PaginatedResult } from '../../types';

export function emptyPage<T>(page = 1): PaginatedResult<T> {
  return { data: [], total: 0, page, totalPages: 0 };
}

export function emptyList<T>(): T[] {
  return [];
}
